import { useCallback, useMemo, useState } from "react";

const DEFAULT_MEDIA_CONSTRAINTS: MediaStreamConstraints = {
  video: true,
  audio: true,
};

export function useMediaStream() {
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    if (cameraStream) {
      return;
    }

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("브라우저가 카메라/마이크를 지원하지 않습니다.");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia(
        DEFAULT_MEDIA_CONSTRAINTS,
      );
      setCameraStream(stream);
      setIsMicOn(stream.getAudioTracks()[0]?.enabled ?? false);
      setIsCameraOn(stream.getVideoTracks()[0]?.enabled ?? false);
      setError(null);
    } catch {
      setError("카메라 또는 마이크 권한을 확인해주세요.");
    }
  }, [cameraStream]);

  const stopCamera = useCallback(() => {
    for (const track of cameraStream?.getTracks() ?? []) {
      track.stop();
    }
    setCameraStream(null);
    setIsMicOn(false);
    setIsCameraOn(false);
  }, [cameraStream]);

  const toggleMic = useCallback(() => {
    const track = cameraStream?.getAudioTracks()[0];
    if (!track) {
      return;
    }

    track.enabled = !track.enabled;
    setIsMicOn(track.enabled);
  }, [cameraStream]);

  const toggleCamera = useCallback(() => {
    const track = cameraStream?.getVideoTracks()[0];
    if (!track) {
      return;
    }

    track.enabled = !track.enabled;
    setIsCameraOn(track.enabled);
  }, [cameraStream]);

  const stopScreenShare = useCallback(() => {
    for (const track of screenStream?.getTracks() ?? []) {
      track.stop();
    }
    setScreenStream(null);
  }, [screenStream]);

  const startScreenShare = useCallback(async () => {
    if (screenStream) {
      return;
    }

    try {
      if (!navigator.mediaDevices?.getDisplayMedia) {
        setError("브라우저가 화면 공유를 지원하지 않습니다.");
        return;
      }
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });
      stream.getVideoTracks()[0]?.addEventListener("ended", stopScreenShare);
      setScreenStream(stream);
      setError(null);
    } catch {
      setError("화면 공유 권한을 확인해주세요.");
    }
  }, [screenStream, stopScreenShare]);

  const stopAll = useCallback(() => {
    stopScreenShare();
    stopCamera();
  }, [stopCamera, stopScreenShare]);

  const previewStream = useMemo(
    () => screenStream ?? cameraStream,
    [screenStream, cameraStream],
  );

  return {
    cameraStream,
    screenStream,
    previewStream,
    isMicOn,
    isCameraOn,
    isScreenSharing: !!screenStream,
    startCamera,
    stopCamera,
    toggleMic,
    toggleCamera,
    startScreenShare,
    stopScreenShare,
    stopAll,
    error,
  };
}
