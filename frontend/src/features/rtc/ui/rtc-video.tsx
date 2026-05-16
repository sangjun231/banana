"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type RtcVideoProps = {
  stream: MediaStream | null;
  label: string;
  emptyMessage?: string;
  muted?: boolean;
  mirror?: boolean;
};

export function RtcVideo({
  stream,
  label,
  emptyMessage = "연결 대기 중",
  muted = false,
  mirror = false,
}: RtcVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) {
      return;
    }

    el.srcObject = stream;
    if (stream) {
      void el.play().catch(() => {
        /* 일부 모바일 브라우저는 srcObject 직후 명시적 play 가 필요 */
      });
    }
  }, [stream]);

  return (
    <div className="relative overflow-hidden rounded-xl border bg-black">
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={muted}
          className={cn("h-full w-full object-cover", mirror && "-scale-x-100")}
        />
      ) : (
        <div className="flex h-full min-h-[260px] items-center justify-center bg-muted text-muted-foreground">
          {emptyMessage}
        </div>
      )}
      <span className="absolute top-3 left-3 rounded-full bg-black/70 px-3 py-1 text-white text-xs">
        {label}
      </span>
    </div>
  );
}
