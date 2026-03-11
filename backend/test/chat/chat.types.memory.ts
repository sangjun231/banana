/**
 * 채팅 메모리 단계 테스트용 타입 정의
 * - 용도: AWS 배포 전, DB 없이 WebSocket 동작을 검증할 때 사용
 * - 프로덕션 chat.types.ts와 필드를 맞춰 두면 Supabase 전환 시 타입 변경 최소화
 */
export type ChatRoomId = string;

export interface JoinPayload {
  userId: string;
  peerId: string;
}

export interface MessagePayload extends JoinPayload {
  content: string;
}

export interface ChatMessage {
  id: string;
  roomId: ChatRoomId;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
}
