"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useUserQuery } from "@/features/auth/queries";

export default function ChatListPage() {
  const router = useRouter();
  const { data: user, isLoading } = useUserQuery();
  const [peerId, setPeerId] = useState("");

  useEffect(() => {
    if (user?.id) {
      console.log("현재 로그인 사용자 ID:", user.id);
    }
  }, [user?.id]);

  const handleEnterRoom = () => {
    const trimmed = peerId.trim();
    if (!trimmed) {
      return;
    }
    router.push(`/chat/${encodeURIComponent(trimmed)}`);
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
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardContent className="space-y-4 p-6">
          <h1 className="font-bold text-2xl">채팅 목록</h1>
          <p className="text-muted-foreground text-sm">
            테스트용으로 상대 사용자 ID를 입력해 채팅방으로 이동합니다.
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="상대 사용자 ID"
              value={peerId}
              onChange={(event) => setPeerId(event.target.value)}
            />
            <Button onClick={handleEnterRoom}>입장</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
