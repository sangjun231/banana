/**
 * 채팅 메모리 단계 테스트용 WebSocket Gateway
 * - 이벤트: join(입장+히스토리), leave(퇴장), message(전송·브로드캐스트)
 * - src/chat/chat.gateway.ts와 동일 인터페이스로, 메모리 서비스만 주입해 사용
 */
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { ChatService } from "./chat.service.memory";
import { JoinPayload, MessagePayload } from "./chat.types.memory";

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  },
})
export class ChatGateway {
  @WebSocketServer()
  private readonly server!: Server;

  constructor(private readonly chatService: ChatService) {}

  @SubscribeMessage("join")
  handleJoin(
    @MessageBody() payload: JoinPayload,
    @ConnectedSocket() client: Socket,
  ) {
    // roomId는 두 사용자 ID를 정렬해 생성해 일관성을 유지합니다.
    const roomId = this.chatService.getRoomId(payload.userId, payload.peerId);
    client.join(roomId);

    // 방 입장 시 기존 메시지 히스토리를 전송합니다.
    const history = this.chatService.getMessages(roomId);
    client.emit("history", { roomId, messages: history });

    return { roomId };
  }

  @SubscribeMessage("leave")
  handleLeave(
    @MessageBody() payload: JoinPayload,
    @ConnectedSocket() client: Socket,
  ) {
    const roomId = this.chatService.getRoomId(payload.userId, payload.peerId);
    client.leave(roomId);

    return { roomId };
  }

  @SubscribeMessage("message")
  handleMessage(@MessageBody() payload: MessagePayload) {
    const roomId = this.chatService.getRoomId(payload.userId, payload.peerId);

    const message = this.chatService.saveMessage({
      roomId,
      senderId: payload.userId,
      receiverId: payload.peerId,
      content: payload.content,
    });

    // 보낸 사람을 포함해 방 전체에 브로드캐스트합니다.
    this.server.to(roomId).emit("message", message);

    return message;
  }
}
