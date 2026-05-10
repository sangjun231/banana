"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserQuery } from "@/features/auth/queries";
import { socketServerUrl } from "@/lib/socket-url";
import { cn } from "@/lib/utils";

// 채팅방 요약 정보 타입
type ChatRoomSummary = {
  roomId: string;
  peerId: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  hasUnread: boolean;
};

// 수신 메시지 타입
type ChatMessage = {
  id: string;
  roomId: string;
  senderId: string;
  content: string;
  createdAt: string;
};

export default function ChatListPage() {
  const router = useRouter();
  const { data: user, isLoading: isUserLoading } = useUserQuery();
  const [peerId, setPeerId] = useState("");
  const [rooms, setRooms] = useState<ChatRoomSummary[]>([]);
  const [isRoomsLoading, setIsRoomsLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);

  // WebSocket 연결 및 채팅방 목록 조회
  useEffect(() => {
    if (!user?.id) return;

    const newSocket = io(socketServerUrl, { transports: ["websocket"] });
    setSocket(newSocket);

    newSocket.on("connect", () => {
      // 채팅방 목록 요청 + 모든 방에 자동 join
      newSocket.emit(
        "getRooms",
        { userId: user.id },
        (response: { rooms: ChatRoomSummary[] }) => {
          const roomList = response.rooms || [];
          setRooms(roomList);
          setIsRoomsLoading(false);

          // 모든 채팅방에 join하여 실시간 메시지 수신
          for (const room of roomList) {
            newSocket.emit("joinRoom", { roomId: room.roomId });
          }
        },
      );
    });

    // 실시간 메시지 수신 시 목록 업데이트
    newSocket.on("message", (message: ChatMessage) => {
      setRooms((prevRooms) => {
        const updatedRooms = prevRooms.map((room) => {
          if (room.roomId === message.roomId) {
            return {
              ...room,
              lastMessage: message.content,
              lastMessageAt: message.createdAt,
              // 내가 보낸 메시지가 아니면 읽지 않음 표시
              hasUnread: message.senderId !== user.id,
            };
          }
          return room;
        });

        // 새 메시지가 온 방을 맨 위로 정렬
        return updatedRooms.sort((a, b) => {
          if (!a.lastMessageAt && !b.lastMessageAt) return 0;
          if (!a.lastMessageAt) return 1;
          if (!b.lastMessageAt) return -1;
          return (
            new Date(b.lastMessageAt).getTime() -
            new Date(a.lastMessageAt).getTime()
          );
        });
      });
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user?.id]);

  // 새 채팅방으로 이동 (ID 직접 입력)
  const handleEnterRoom = () => {
    const trimmed = peerId.trim();
    if (!trimmed) return;
    router.push(`/chat/${encodeURIComponent(trimmed)}`);
  };

  // 기존 채팅방 클릭
  const handleRoomClick = (room: ChatRoomSummary) => {
    router.push(`/chat/${encodeURIComponent(room.peerId)}`);
  };

  // 시간 포맷팅 (오늘이면 시간, 아니면 날짜)
  const formatTime = (dateString: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return date.toLocaleDateString("ko-KR", {
      month: "short",
      day: "numeric",
    });
  };

  if (isUserLoading) {
    return <div className="container mx-auto py-10">로딩 중...</div>;
  }

  if (!user) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardContent className="space-y-4 p-6">
            <h1 className="font-bold text-2xl">채팅</h1>
            <p>로그인이 필요합니다.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl space-y-6 py-10">
      {/* 새 채팅 시작 */}
      <Card>
        <CardContent className="space-y-4 p-6">
          <h1 className="font-bold text-2xl">채팅</h1>
          <p className="text-muted-foreground text-sm">
            새로운 대화를 시작하려면 상대방 ID를 입력하세요.
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="상대 사용자 ID"
              value={peerId}
              onChange={(event) => setPeerId(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== "Enter" || event.shiftKey) {
                  return;
                }
                if (event.nativeEvent.isComposing) {
                  return;
                }
                event.preventDefault();
                handleEnterRoom();
              }}
            />
            <Button onClick={handleEnterRoom}>시작</Button>
          </div>
        </CardContent>
      </Card>

      {/* 채팅방 목록 */}
      <Card>
        <CardContent className="p-6">
          <h2 className="mb-4 font-semibold text-lg">채팅 목록</h2>

          {isRoomsLoading ? (
            // 로딩 스켈레톤
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              ))}
            </div>
          ) : rooms.length === 0 ? (
            // 채팅방 없음
            <p className="py-8 text-center text-muted-foreground text-sm">
              아직 채팅 내역이 없습니다.
            </p>
          ) : (
            // 채팅방 리스트
            <div className="space-y-1">
              {rooms.map((room) => (
                <button
                  key={room.roomId}
                  type="button"
                  onClick={() => handleRoomClick(room)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors",
                    "hover:bg-accent",
                  )}
                >
                  {/* 아바타 + 읽지 않음 표시 */}
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {room.peerId.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {/* 읽지 않은 메시지 빨간 점 */}
                    {room.hasUnread && (
                      <span className="absolute top-0 right-0 h-3 w-3 rounded-full bg-destructive" />
                    )}
                  </div>

                  {/* 채팅 정보 */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="truncate font-medium text-sm">
                        {room.peerId.length > 20
                          ? `${room.peerId.slice(0, 8)}...${room.peerId.slice(-4)}`
                          : room.peerId}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {formatTime(room.lastMessageAt)}
                      </span>
                    </div>
                    <p
                      className={cn(
                        "truncate text-sm",
                        room.hasUnread
                          ? "font-medium text-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      {room.lastMessage || "메시지가 없습니다"}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
