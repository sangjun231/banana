/**
 * 채팅 메모리 단계 테스트용 서비스
 * - 저장소: Map<ChatRoomId, ChatMessage[]> (DB/Supabase 없음)
 * - 역할: 방 ID 생성, 메시지 조회/저장만 담당 → 로컬·CI E2E에서 빠르고 안정적으로 테스트
 */
import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { ChatMessage, ChatRoomId } from "./chat.types.memory";

@Injectable()
export class ChatService {
  // 메모리 저장소: roomId -> messages
  private readonly messagesByRoom = new Map<ChatRoomId, ChatMessage[]>();

  getRoomId(userId: string, peerId: string): ChatRoomId {
    const [a, b] = [userId, peerId].sort();
    return `${a}_${b}`;
  }

  getMessages(roomId: ChatRoomId): ChatMessage[] {
    return this.messagesByRoom.get(roomId) ?? [];
  }

  saveMessage(params: Omit<ChatMessage, "id" | "createdAt">): ChatMessage {
    const message: ChatMessage = {
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      ...params,
    };

    const messages = this.messagesByRoom.get(message.roomId) ?? [];
    messages.push(message);
    this.messagesByRoom.set(message.roomId, messages);

    return message;
  }
}
