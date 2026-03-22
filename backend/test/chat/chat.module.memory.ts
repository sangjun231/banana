/**
 * 채팅 메모리 단계 테스트용 Nest 모듈
 * - E2E에서 src/chat/chat.module 대신 이 모듈을 쓰면 Supabase 없이 WebSocket만 검증 가능
 */
import { Module } from "@nestjs/common";
import { ChatGateway } from "./chat.gateway.memory";
import { ChatService } from "./chat.service.memory";

@Module({
  providers: [ChatGateway, ChatService],
})
export class ChatModule {}
