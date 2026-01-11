import { Logger } from "@nestjs/common";
import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { RtcService } from "./rtc.service";

type RtcRole = "caller" | "callee";

type RtcJoinPayload = {
  roomId: string;
  userId?: string;
};

type RtcReadyPayload = {
  roomId: string;
};

type RtcSignalMessage =
  | { type: "offer"; sdp: string }
  | { type: "answer"; sdp: string }
  | { type: "ice-candidate"; candidate: RtcIceCandidate };

type RtcIceCandidate = {
  candidate: string;
  sdpMid?: string | null;
  sdpMLineIndex?: number | null;
  usernameFragment?: string | null;
};

type RtcSignalPayload = {
  roomId: string;
  payload: RtcSignalMessage;
};

type RtcLeavePayload = {
  roomId: string;
};

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  },
})
export class RtcGateway {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(RtcGateway.name);
  private readonly clientRoomMap = new Map<string, string>();

  constructor(private readonly rtcService: RtcService) {}

  @SubscribeMessage("rtc:join")
  handleJoin(client: Socket, payload: RtcJoinPayload): void {
    const roomId = payload?.roomId?.trim();
    if (!roomId) {
      client.emit("rtc:room-full", { roomId: "" });
      return;
    }

    const roomSize = this.getRoomSize(roomId);
    if (roomSize >= 2) {
      client.emit("rtc:room-full", { roomId });
      return;
    }

    const role: RtcRole = roomSize === 0 ? "caller" : "callee";
    client.join(roomId);
    this.clientRoomMap.set(client.id, roomId);

    client.emit("rtc:joined", { roomId, role });
    this.logger.log(`RTC join: ${client.id} -> ${roomId} (${role})`);
  }

  @SubscribeMessage("rtc:ready")
  handleReady(client: Socket, payload: RtcReadyPayload): void {
    const roomId = payload?.roomId?.trim();
    if (!roomId) {
      return;
    }

    const readyCount = this.rtcService.markReady(roomId, client.id);
    const roomSize = this.getRoomSize(roomId);

    if (roomSize >= 2 && readyCount >= 2) {
      this.server.to(roomId).emit("rtc:ready", { roomId });
    }
  }

  @SubscribeMessage("rtc:signal")
  handleSignal(client: Socket, payload: RtcSignalPayload): void {
    const roomId = payload?.roomId?.trim();
    if (!roomId) {
      return;
    }

    client.to(roomId).emit("rtc:signal", payload);
  }

  @SubscribeMessage("rtc:leave")
  handleLeave(client: Socket, payload: RtcLeavePayload): void {
    this.leaveRoom(client, payload?.roomId);
  }

  handleDisconnect(client: Socket): void {
    this.leaveRoom(client);
  }

  private leaveRoom(client: Socket, explicitRoomId?: string): void {
    const roomId = explicitRoomId || this.clientRoomMap.get(client.id);
    if (!roomId) {
      return;
    }

    client.leave(roomId);
    this.clientRoomMap.delete(client.id);
    this.rtcService.clearReady(roomId, client.id);

    client.to(roomId).emit("rtc:peer-left", { roomId });

    if (this.getRoomSize(roomId) === 0) {
      this.rtcService.clearRoom(roomId);
    }

    this.logger.log(`RTC leave: ${client.id} -> ${roomId}`);
  }

  private getRoomSize(roomId: string): number {
    return this.server.sockets.adapter.rooms.get(roomId)?.size ?? 0;
  }
}
