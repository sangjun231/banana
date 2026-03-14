// ============================================
// ChatModule - 채팅 기능 모듈
// ============================================
// 역할: 채팅 관련 컴포넌트(Gateway, Service)를 묶어주는 모듈
// Gateway: WebSocket 이벤트 처리 (프론트엔드와 실시간 통신)
// Service: 비즈니스 로직 처리 (DB 조회/저장)

import { Module } from "@nestjs/common";
import { ChatGateway } from "./chat.gateway";
import { ChatService } from "./chat.service";

@Module({
  providers: [
    ChatGateway, // WebSocket 이벤트 핸들러
    ChatService, // 채팅 비즈니스 로직
  ],
})
export class ChatModule {}
