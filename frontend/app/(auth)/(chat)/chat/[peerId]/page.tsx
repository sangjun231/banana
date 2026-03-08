"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUserQuery } from "@/features/auth/queries";
import { cn } from "@/lib/utils";

type ChatMessage = {
  id: string;
  roomId: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
};

const SOCKET_URL =
  process.env.NEXT_PUBLIC_CHAT_WS_URL ?? "http://localhost:3001";

export default function ChatRoomPage() {
  const router = useRouter();
  const params = useParams<{ peerId: string }>();
  const peerId = useMemo(
    () => decodeURIComponent(params.peerId ?? ""),
    [params.peerId],
  );

  const { data: user, isLoading } = useUserQuery();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!user || !peerId) {
      return;
    }

    const socket = io(SOCKET_URL, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join", { userId: user.id, peerId });
    });

    socket.on(
      "history",
      (payload: { roomId: string; messages: ChatMessage[] }) => {
        setMessages(payload.messages ?? []);
      },
    );

    socket.on("message", (message: ChatMessage) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socket.emit("leave", { userId: user.id, peerId });
      socket.disconnect();
    };
  }, [user, peerId]);

  const handleSend = () => {
    if (!input.trim() || !user) {
      return;
    }

    socketRef.current?.emit("message", {
      userId: user.id,
      peerId,
      content: input.trim(),
    });
    setInput("");
  };

  if (isLoading) {
    return <div className="container mx-auto py-10">로딩 중...</div>;
  }

  if (!user) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardContent className="space-y-4 p-6">
            <h1 className="font-bold text-2xl">채팅</h1>
            <p>로그인이 필요합니다.</p>
            <Button onClick={() => router.push("/chat-list")}>목록으로</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto flex h-[80vh] flex-col gap-4 py-10">
      <Card>
        <CardContent className="flex items-center justify-between p-6">
          <div>
            <h1 className="font-bold text-2xl">채팅</h1>
            <p className="text-muted-foreground text-sm">상대 ID: {peerId}</p>
          </div>
          <Button variant="outline" onClick={() => router.push("/chat-list")}>
            목록으로
          </Button>
        </CardContent>
      </Card>

      <Card className="flex-1">
        <CardContent className="h-full p-6">
          <ScrollArea className="h-full pr-4">
            <div className="space-y-3">
              {messages.length === 0 ? (
                <div className="text-muted-foreground text-sm">
                  아직 메시지가 없습니다.
                </div>
              ) : (
                messages.map((message) => {
                  const isMine = message.senderId === user.id;
                  return (
                    <div
                      key={message.id}
                      className={cn(
                        "flex",
                        isMine ? "justify-end" : "justify-start",
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[70%] rounded-lg px-4 py-2 text-sm shadow-sm",
                          isMine
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted",
                        )}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        <p className="mt-1 text-[10px] opacity-70">
                          {new Date(message.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex gap-2 p-4">
          <Input
            placeholder="메시지를 입력하세요"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handleSend();
              }
            }}
          />
          <Button onClick={handleSend}>전송</Button>
        </CardContent>
      </Card>
    </div>
  );
}
