// ============================================
// ChatService - 채팅 비즈니스 로직
// ============================================
// 역할: 채팅 관련 데이터 처리 (Supabase DB와 통신)
//
// 주요 메서드:
//   - getRoomId(): 두 사용자 간의 채팅방 ID 조회/생성
//   - getMessages(): 채팅방의 메시지 목록 조회
//   - saveMessage(): 새 메시지 저장
//   - updateLastRead(): 마지막 읽은 시간 업데이트

import { Injectable, Logger } from "@nestjs/common";
import { SupabaseService } from "../supabase/supabase.service";
import { ChatMessage, ChatRoomId, ChatRoomSummary } from "./chat.types";

@Injectable()
export class ChatService {
  // Logger: 디버깅 및 에러 추적용 로거
  private readonly logger = new Logger(ChatService.name);

  // SupabaseService 주입: DB 작업에 사용
  constructor(private readonly supabaseService: SupabaseService) {}

  // ============================================
  // getRoomId - 1:1 채팅방 ID 조회 또는 생성
  // ============================================
  // 두 사용자 간의 기존 채팅방을 찾거나, 없으면 새로 생성합니다.
  //
  // 로직:
  //   1. 두 사용자 ID를 정렬 (일관된 조회를 위해)
  //   2. 기존 채팅방이 있는지 확인
  //   3. 없으면 새 채팅방 생성 + 참여자 추가
  async getRoomId(userId: string, peerId: string): Promise<ChatRoomId> {
    const supabase = this.supabaseService.getClient();

    // 1. 사용자 ID를 정렬 (A-B와 B-A가 같은 방을 가리키도록)
    const [userA, userB] = [userId, peerId].sort();

    // 2. userA가 참여한 모든 방 조회
    const { data: userARooms } = await supabase
      .from("chat_room_participants")
      .select("room_id")
      .eq("user_id", userA);

    if (userARooms && userARooms.length > 0) {
      const roomIds = userARooms.map((r) => r.room_id);

      // 3. 그 방들 중에서 userB도 참여한 방 찾기
      const { data: commonRoom } = await supabase
        .from("chat_room_participants")
        .select("room_id")
        .eq("user_id", userB)
        .in("room_id", roomIds);

      if (commonRoom && commonRoom.length > 0) {
        // 4. 찾은 방들 중 정확히 2명만 있는 1:1 방인지 확인
        for (const room of commonRoom) {
          const { data: participants } = await supabase
            .from("chat_room_participants")
            .select("user_id")
            .eq("room_id", room.room_id);

          // 참여자가 정확히 2명이면 1:1 채팅방
          if (participants && participants.length === 2) {
            this.logger.log(`Found existing chat room: ${room.room_id}`);
            return room.room_id;
          }
        }
      }
    }

    // ============================================
    // 4. 기존 방이 없으면 새 채팅방 생성
    // ============================================

    // 4-1. chat_rooms 테이블에 새 방 생성
    const { data: newRoom, error: roomError } = await supabase
      .from("chat_rooms")
      .insert({ name: null }) // 1:1 채팅은 이름 없음
      .select("id")
      .single();

    if (roomError || !newRoom) {
      this.logger.error("Failed to create chat room", roomError);
      throw new Error("Failed to create chat room");
    }

    const roomId = newRoom.id;

    // 4-2. chat_room_participants 테이블에 두 참여자 추가
    const { error: participantError } = await supabase
      .from("chat_room_participants")
      .insert([
        { room_id: roomId, user_id: userA },
        { room_id: roomId, user_id: userB },
      ]);

    if (participantError) {
      this.logger.error("Failed to add participants", participantError);
      throw new Error("Failed to add participants");
    }

    this.logger.log(`Created new chat room: ${roomId}`);
    return roomId;
  }

  // ============================================
  // getMessages - 채팅방의 메시지 목록 조회
  // ============================================
  // 해당 채팅방의 모든 메시지를 시간순으로 조회합니다.
  async getMessages(roomId: ChatRoomId): Promise<ChatMessage[]> {
    const supabase = this.supabaseService.getClient();

    // chat_messages 테이블에서 해당 방의 메시지 조회
    // order("created_at", { ascending: true }): 오래된 메시지부터 정렬
    const { data, error } = await supabase
      .from("chat_messages")
      .select("id, room_id, sender_id, content, created_at")
      .eq("room_id", roomId)
      .order("created_at", { ascending: true });

    if (error) {
      this.logger.error("Failed to fetch messages", error);
      return [];
    }

    // DB 컬럼명(snake_case) → 프론트엔드 형식(camelCase)으로 변환
    return (data || []).map((msg) => ({
      id: msg.id,
      roomId: msg.room_id,
      senderId: msg.sender_id,
      receiverId: "", // 메시지 조회 시에는 receiverId 불필요
      content: msg.content,
      createdAt: msg.created_at,
    }));
  }

  // ============================================
  // saveMessage - 새 메시지 저장
  // ============================================
  // 메시지를 DB에 저장하고, 채팅방의 updated_at도 갱신합니다.
  async saveMessage(
    params: Omit<ChatMessage, "id" | "createdAt">,
  ): Promise<ChatMessage> {
    const supabase = this.supabaseService.getClient();

    // 1. chat_messages 테이블에 메시지 저장
    const { data, error } = await supabase
      .from("chat_messages")
      .insert({
        room_id: params.roomId,
        sender_id: params.senderId,
        content: params.content,
      })
      .select("id, room_id, sender_id, content, created_at")
      .single();

    if (error || !data) {
      this.logger.error("Failed to save message", error);
      throw new Error("Failed to save message");
    }

    // 2. 채팅방의 updated_at 갱신 (채팅 목록 정렬용)
    await supabase
      .from("chat_rooms")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", params.roomId);

    // DB 형식 → 프론트엔드 형식으로 변환하여 반환
    return {
      id: data.id,
      roomId: data.room_id,
      senderId: data.sender_id,
      receiverId: params.receiverId,
      content: data.content,
      createdAt: data.created_at,
    };
  }

  // ============================================
  // updateLastRead - 마지막 읽은 시간 업데이트
  // ============================================
  // 사용자가 채팅방에 입장/퇴장할 때 호출됩니다.
  // 이 값을 기준으로 "읽지 않은 메시지" 개수를 계산할 수 있습니다.
  async updateLastRead(roomId: ChatRoomId, userId: string): Promise<void> {
    const supabase = this.supabaseService.getClient();

    // chat_room_participants 테이블의 last_read_at 업데이트
    const { error } = await supabase
      .from("chat_room_participants")
      .update({ last_read_at: new Date().toISOString() })
      .eq("room_id", roomId)
      .eq("user_id", userId);

    if (error) {
      this.logger.error("Failed to update last_read_at", error);
    }
  }

  // ============================================
  // getUserRooms - 사용자가 참여한 채팅방 목록 조회
  // ============================================
  // 채팅 목록 페이지에서 사용됩니다.
  // 각 방의 상대방 ID, 마지막 메시지, 읽지 않은 메시지 여부를 반환합니다.
  async getUserRooms(userId: string): Promise<ChatRoomSummary[]> {
    const supabase = this.supabaseService.getClient();

    // 1. 사용자가 참여한 모든 방 조회 (last_read_at 포함)
    const { data: myRooms, error: roomsError } = await supabase
      .from("chat_room_participants")
      .select("room_id, last_read_at")
      .eq("user_id", userId);

    if (roomsError || !myRooms || myRooms.length === 0) {
      this.logger.log("No rooms found for user");
      return [];
    }

    const roomIds = myRooms.map((r) => r.room_id);

    // 2. 각 방의 다른 참여자(상대방) 조회
    const { data: otherParticipants } = await supabase
      .from("chat_room_participants")
      .select("room_id, user_id")
      .in("room_id", roomIds)
      .neq("user_id", userId);

    // 3. 각 방의 마지막 메시지 조회
    const { data: lastMessages } = await supabase
      .from("chat_messages")
      .select("room_id, content, created_at, sender_id")
      .in("room_id", roomIds)
      .order("created_at", { ascending: false });

    // room_id별 마지막 메시지 맵 생성
    const lastMessageMap = new Map<
      string,
      { content: string; created_at: string; sender_id: string }
    >();
    for (const msg of lastMessages || []) {
      if (!lastMessageMap.has(msg.room_id)) {
        lastMessageMap.set(msg.room_id, {
          content: msg.content,
          created_at: msg.created_at,
          sender_id: msg.sender_id,
        });
      }
    }

    // 4. 결과 조합
    const result: ChatRoomSummary[] = [];

    for (const room of myRooms) {
      const peer = otherParticipants?.find((p) => p.room_id === room.room_id);
      const lastMsg = lastMessageMap.get(room.room_id);

      // 읽지 않은 메시지 여부 계산
      // last_read_at이 없거나 마지막 메시지가 last_read_at 이후이고 내가 보낸 게 아니면 unread
      let hasUnread = false;
      if (lastMsg) {
        const lastReadAt = room.last_read_at
          ? new Date(room.last_read_at)
          : null;
        const lastMsgAt = new Date(lastMsg.created_at);

        if (!lastReadAt) {
          // 한 번도 읽은 적 없음
          hasUnread = lastMsg.sender_id !== userId;
        } else if (lastMsgAt > lastReadAt && lastMsg.sender_id !== userId) {
          // 마지막 읽은 시간 이후에 상대방이 보낸 메시지 있음
          hasUnread = true;
        }
      }

      result.push({
        roomId: room.room_id,
        peerId: peer?.user_id || "",
        lastMessage: lastMsg?.content || null,
        lastMessageAt: lastMsg?.created_at || null,
        hasUnread,
      });
    }

    // 마지막 메시지 시간 기준 내림차순 정렬
    result.sort((a, b) => {
      if (!a.lastMessageAt && !b.lastMessageAt) return 0;
      if (!a.lastMessageAt) return 1;
      if (!b.lastMessageAt) return -1;
      return (
        new Date(b.lastMessageAt).getTime() -
        new Date(a.lastMessageAt).getTime()
      );
    });

    return result;
  }
}
