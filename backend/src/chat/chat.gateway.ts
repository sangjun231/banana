// ============================================
// ChatGateway - WebSocket 이벤트 핸들러
// ============================================
// 역할: 프론트엔드와 실시간 WebSocket 통신을 담당
//
// 처리하는 이벤트:
//   - "join": 채팅방 입장
//   - "leave": 채팅방 퇴장
//   - "message": 메시지 전송
//   - "getRooms": 사용자의 채팅방 목록 조회
//   - "joinRoom": 특정 채팅방에 join (실시간 메시지 수신용)
//
// 발신하는 이벤트:
//   - "history": 채팅방 입장 시 기존 메시지 목록 전송
//   - "message": 새 메시지를 방의 모든 참여자에게 브로드캐스트

import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { webSocketCorsOptions } from "../common/websocket-cors";
import { ChatService } from "./chat.service";
import { GetRoomsPayload, JoinPayload, MessagePayload } from "./chat.types";

// WebSocketGateway 데코레이터: 이 클래스가 WebSocket 서버임을 선언
@WebSocketGateway({
  cors: webSocketCorsOptions,
})
export class ChatGateway {
  // WebSocket 서버 인스턴스 (socket.io Server)
  // 방에 있는 모든 클라이언트에게 메시지를 보낼 때 사용
  @WebSocketServer()
  private readonly server!: Server;

  // ChatService 주입: 실제 비즈니스 로직은 Service에서 처리
  constructor(private readonly chatService: ChatService) {}

  // ============================================
  // handleJoin - 채팅방 입장 처리
  // ============================================
  // 프론트엔드: socket.emit("join", { userId, peerId })
  //
  // 동작:
  //   1. 두 사용자 간의 채팅방 ID를 가져옴 (없으면 생성)
  //   2. 클라이언트를 해당 방에 join
  //   3. 기존 메시지 히스토리를 클라이언트에게 전송
  //   4. 마지막 읽은 시간 업데이트
  @SubscribeMessage("join")
  async handleJoin(
    @MessageBody() payload: JoinPayload, // 클라이언트가 보낸 데이터
    @ConnectedSocket() client: Socket, // 연결된 클라이언트 소켓
  ) {
    // 1. 채팅방 ID 가져오기 (또는 새로 생성)
    const roomId = await this.chatService.getRoomId(
      payload.userId,
      payload.peerId,
    );

    // 2. 클라이언트를 해당 방에 join (socket.io의 room 기능)
    client.join(roomId);

    // 3. 기존 메시지 히스토리 조회 후 클라이언트에게 전송
    const history = await this.chatService.getMessages(roomId);
    client.emit("history", { roomId, messages: history });

    // 4. 마지막 읽은 시간 업데이트 (읽지 않은 메시지 계산용)
    await this.chatService.updateLastRead(roomId, payload.userId);

    return { roomId };
  }

  // ============================================
  // handleLeave - 채팅방 퇴장 처리
  // ============================================
  // 프론트엔드: socket.emit("leave", { userId, peerId })
  //
  // 동작:
  //   1. 채팅방 ID 가져오기
  //   2. 클라이언트를 해당 방에서 leave
  //   3. 마지막 읽은 시간 업데이트
  @SubscribeMessage("leave")
  async handleLeave(
    @MessageBody() payload: JoinPayload,
    @ConnectedSocket() client: Socket,
  ) {
    const roomId = await this.chatService.getRoomId(
      payload.userId,
      payload.peerId,
    );

    // socket.io room에서 나가기
    client.leave(roomId);

    // 마지막 읽은 시간 업데이트
    await this.chatService.updateLastRead(roomId, payload.userId);

    return { roomId };
  }

  // ============================================
  // handleMessage - 메시지 전송 처리
  // ============================================
  // 프론트엔드: socket.emit("message", { userId, peerId, content })
  //
  // 동작:
  //   1. 채팅방 ID 가져오기
  //   2. 메시지를 DB에 저장
  //   3. 방의 모든 참여자에게 메시지 브로드캐스트
  @SubscribeMessage("message")
  async handleMessage(@MessageBody() payload: MessagePayload) {
    // 1. 채팅방 ID 가져오기
    const roomId = await this.chatService.getRoomId(
      payload.userId,
      payload.peerId,
    );

    // 2. 메시지를 Supabase DB에 저장
    const message = await this.chatService.saveMessage({
      roomId,
      senderId: payload.userId,
      receiverId: payload.peerId,
      content: payload.content,
    });

    // 3. 방의 모든 참여자에게 메시지 브로드캐스트
    // server.to(roomId): 해당 방에 있는 모든 클라이언트에게 전송
    this.server.to(roomId).emit("message", message);

    return message;
  }

  // ============================================
  // handleGetRooms - 사용자의 채팅방 목록 조회
  // ============================================
  // 프론트엔드: socket.emit("getRooms", { userId })
  //
  // 동작:
  //   1. 사용자가 참여한 모든 채팅방 조회
  //   2. 각 방의 상대방 ID, 마지막 메시지, 읽지 않은 여부 반환
  @SubscribeMessage("getRooms")
  async handleGetRooms(@MessageBody() payload: GetRoomsPayload) {
    const rooms = await this.chatService.getUserRooms(payload.userId);
    return { rooms };
  }

  // ============================================
  // handleJoinRoom - 특정 채팅방에 join (목록 페이지용)
  // ============================================
  // 프론트엔드: socket.emit("joinRoom", { roomId })
  //
  // 채팅 목록 페이지에서 실시간 메시지를 수신하기 위해
  // 사용자의 모든 채팅방에 join합니다.
  // (채팅 페이지의 "join" 이벤트와 달리 히스토리를 전송하지 않음)
  @SubscribeMessage("joinRoom")
  handleJoinRoom(
    @MessageBody() payload: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(payload.roomId);
    return { success: true };
  }
}
