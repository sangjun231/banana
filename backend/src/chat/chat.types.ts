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
