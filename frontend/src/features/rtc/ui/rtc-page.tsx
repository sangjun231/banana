"use client";

import { Copy } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useMediaStream } from "../hooks/use-media-stream";
import { useRtcConnection } from "../hooks/use-rtc-connection";
import { RtcControls } from "./rtc-controls";
import { RtcVideo } from "./rtc-video";

function createFallbackRoomId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().slice(0, 8);
  }
  return `room-${Date.now()}`;
}

export function RtcPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [roomId, setRoomId] = useState("");
  const [copyMessage, setCopyMessage] = useState("");

  const {
    cameraStream,
    screenStream,
    previewStream,
    isMicOn,
    isCameraOn,
    isScreenSharing,
    startCamera,
    toggleMic,
    toggleCamera,
    startScreenShare,
    stopScreenShare,
    stopAll,
    error: mediaError,
  } = useMediaStream();

  const { remoteStream, role, connectionState, error, isRoomFull, leave } =
    useRtcConnection({
      roomId,
      localStream: cameraStream,
      screenStream,
    });

  useEffect(() => {
    const param = searchParams.get("room");
    if (param) {
      setRoomId(param);
      return;
    }

    if (roomId) {
      return;
    }

    const nextRoomId = createFallbackRoomId();
    setRoomId(nextRoomId);
    router.replace(`/rtc?room=${nextRoomId}`);
  }, [router, roomId, searchParams]);

  useEffect(() => {
    if (!roomId) {
      return;
    }

    void startCamera();
  }, [roomId, startCamera]);

  const handleCopyLink = async () => {
    if (!roomId) {
      return;
    }

    const url = `${window.location.origin}/rtc?room=${roomId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopyMessage("링크를 복사했습니다.");
    } catch (err) {
      setCopyMessage("복사에 실패했습니다.");
    }
    window.setTimeout(() => setCopyMessage(""), 2000);
  };

  const handleToggleScreenShare = () => {
    if (isScreenSharing) {
      stopScreenShare();
      return;
    }
    void startScreenShare();
  };

  const handleLeave = () => {
    leave();
    stopAll();
  };

  return (
    <div className="container mx-auto flex max-w-5xl flex-col gap-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-bold text-2xl">RTC 1:1 통화</h1>
          <p className="text-muted-foreground">
            room: {roomId || "생성 중..."} ·{" "}
            {role ? `role: ${role}` : "role: 대기 중"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleCopyLink}>
            <Copy className="mr-2 h-4 w-4" />
            링크 복사
          </Button>
          {copyMessage ? (
            <span className="text-muted-foreground text-sm">{copyMessage}</span>
          ) : null}
        </div>
      </div>

      {(mediaError || error || isRoomFull) && (
        <Alert variant="destructive">
          <AlertTitle>연결 오류</AlertTitle>
          <AlertDescription>
            {mediaError ||
              error ||
              (isRoomFull ? "이미 최대 인원입니다." : "알 수 없는 오류")}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
        <RtcVideo stream={remoteStream} label="상대 화면" />
        <RtcVideo stream={previewStream} label="내 화면" muted mirror />
      </div>

      <RtcControls
        isMicOn={isMicOn}
        isCameraOn={isCameraOn}
        isScreenSharing={isScreenSharing}
        onToggleMic={toggleMic}
        onToggleCamera={toggleCamera}
        onToggleScreenShare={handleToggleScreenShare}
        onLeave={handleLeave}
      />

      <div className="text-muted-foreground text-sm">
        연결 상태: {connectionState}
      </div>
    </div>
  );
}
