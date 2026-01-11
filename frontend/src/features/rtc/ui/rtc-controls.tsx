"use client";

import {
  Camera,
  CameraOff,
  Mic,
  MicOff,
  MonitorUp,
  PhoneOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type RtcControlsProps = {
  isMicOn: boolean;
  isCameraOn: boolean;
  isScreenSharing: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onLeave: () => void;
};

export function RtcControls({
  isMicOn,
  isCameraOn,
  isScreenSharing,
  onToggleMic,
  onToggleCamera,
  onToggleScreenShare,
  onLeave,
}: RtcControlsProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <Button variant="outline" onClick={onToggleMic}>
        {isMicOn ? <Mic className="mr-2 h-4 w-4" /> : <MicOff className="mr-2 h-4 w-4" />}
        {isMicOn ? "마이크 켜짐" : "마이크 꺼짐"}
      </Button>
      <Button variant="outline" onClick={onToggleCamera}>
        {isCameraOn ? (
          <Camera className="mr-2 h-4 w-4" />
        ) : (
          <CameraOff className="mr-2 h-4 w-4" />
        )}
        {isCameraOn ? "카메라 켜짐" : "카메라 꺼짐"}
      </Button>
      <Button variant="outline" onClick={onToggleScreenShare}>
        <MonitorUp className="mr-2 h-4 w-4" />
        {isScreenSharing ? "화면 공유 중지" : "화면 공유 시작"}
      </Button>
      <Button variant="destructive" onClick={onLeave}>
        <PhoneOff className="mr-2 h-4 w-4" />
        나가기
      </Button>
    </div>
  );
}
