// ============================================
// Chat Types - 채팅 관련 타입 정의
// ============================================
// 역할: 채팅에서 사용되는 데이터 타입들을 정의
// Gateway와 Service에서 공통으로 사용됩니다.

// 채팅방 ID 타입 (UUID 문자열)
export type ChatRoomId = string;

// ============================================
// JoinPayload - 채팅방 입장 시 전송되는 데이터
// ============================================
// 프론트엔드에서 socket.emit("join", { userId, peerId }) 로 전송
export interface JoinPayload {
  userId: string; // 현재 로그인한 사용자 ID
  peerId: string; // 대화 상대 사용자 ID
}

// ============================================
// MessagePayload - 메시지 전송 시 전송되는 데이터
// ============================================
// 프론트엔드에서 socket.emit("message", { userId, peerId, content }) 로 전송
export interface MessagePayload extends JoinPayload {
  content: string; // 메시지 내용
}

// ============================================
// ChatMessage - 채팅 메시지 객체
// ============================================
// DB에서 조회하거나 저장할 때 사용되는 메시지 형식
export interface ChatMessage {
  id: string; // 메시지 고유 ID (UUID)
  roomId: ChatRoomId; // 채팅방 ID
  senderId: string; // 보낸 사람 ID
  receiverId: string; // 받는 사람 ID
  content: string; // 메시지 내용
  createdAt: string; // 전송 시간 (ISO 문자열)
}

// ============================================
// ChatRoomSummary - 채팅방 목록에 표시할 요약 정보
// ============================================
export interface ChatRoomSummary {
  roomId: string; // 채팅방 ID
  peerId: string; // 대화 상대 ID
  lastMessage: string | null; // 마지막 메시지 내용
  lastMessageAt: string | null; // 마지막 메시지 시간
  hasUnread: boolean; // 읽지 않은 메시지 여부
}

// ============================================
// GetRoomsPayload - 채팅방 목록 요청 시 전송되는 데이터
// ============================================
export interface GetRoomsPayload {
  userId: string; // 현재 로그인한 사용자 ID
}
