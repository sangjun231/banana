"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type RtcVideoProps = {
  stream: MediaStream | null;
  label: string;
  muted?: boolean;
  mirror?: boolean;
};

export function RtcVideo({
  stream,
  label,
  muted = false,
  mirror = false,
}: RtcVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!videoRef.current) {
      return;
    }

    videoRef.current.srcObject = stream;
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
          연결 대기 중
        </div>
      )}
      <span className="absolute top-3 left-3 rounded-full bg-black/70 px-3 py-1 text-white text-xs">
        {label}
      </span>
    </div>
  );
}
