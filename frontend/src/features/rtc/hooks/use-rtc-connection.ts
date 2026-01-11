/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <explanation> */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import type { RtcRole, RtcSignalPayload } from "../types";

type UseRtcConnectionParams = {
  roomId: string;
  localStream: MediaStream | null;
  screenStream: MediaStream | null;
};

const DEFAULT_ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];

function parseIceServers(): RTCIceServer[] {
  const raw = process.env.NEXT_PUBLIC_RTC_ICE_SERVERS;
  if (!raw) {
    return DEFAULT_ICE_SERVERS;
  }

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    return DEFAULT_ICE_SERVERS;
  }

  return DEFAULT_ICE_SERVERS;
}

export function useRtcConnection({
  roomId,
  localStream,
  screenStream,
}: UseRtcConnectionParams) {
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [role, setRole] = useState<RtcRole | null>(null);
  const [connectionState, setConnectionState] =
    useState<RTCPeerConnectionState>("new");
  const [error, setError] = useState<string | null>(null);
  const [isRoomFull, setIsRoomFull] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const readyRef = useRef(false);
  const roleRef = useRef<RtcRole | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const hasSentReadyRef = useRef(false);
  const handleSignalRef = useRef<
    (payload: RtcSignalPayload) => Promise<void> | void
  >(async () => {});
  const createOfferRef = useRef<() => Promise<void>>(async () => {});
  const ensurePeerConnectionRef = useRef<() => RTCPeerConnection | null>(
    () => null,
  );

  const iceServers = useMemo(() => parseIceServers(), []);

  useEffect(() => {
    roleRef.current = role;
  }, [role]);

  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  const sendSignal = useCallback(
    (payload: RtcSignalPayload) => {
      const socket = socketRef.current;
      if (!socket) {
        return;
      }

      socket.emit("rtc:signal", { roomId, payload });
    },
    [roomId],
  );

  const emitReadyIfPossible = useCallback(() => {
    if (
      !socketRef.current ||
      !localStreamRef.current ||
      !roleRef.current ||
      hasSentReadyRef.current
    ) {
      return;
    }

    socketRef.current.emit("rtc:ready", { roomId });
    hasSentReadyRef.current = true;
  }, [roomId]);

  const createOffer = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc) {
      return;
    }

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    if (offer.sdp) {
      sendSignal({ type: "offer", sdp: offer.sdp });
    }
  }, [sendSignal]);

  const createAnswer = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc) {
      return;
    }

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    if (answer.sdp) {
      sendSignal({ type: "answer", sdp: answer.sdp });
    }
  }, [sendSignal]);

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection({ iceServers });

    pc.ontrack = (event) => {
      const [stream] = event.streams;
      if (stream) {
        setRemoteStream(stream);
        return;
      }

      setRemoteStream((prev) => {
        const nextStream = prev ?? new MediaStream();
        nextStream.addTrack(event.track);
        return nextStream;
      });
    };

    pc.onicecandidate = (event) => {
      if (!event.candidate) {
        return;
      }

      const candidate =
        typeof event.candidate.toJSON === "function"
          ? event.candidate.toJSON()
          : event.candidate;
      sendSignal({ type: "ice-candidate", candidate });
    };

    pc.onconnectionstatechange = () => {
      setConnectionState(pc.connectionState);
    };

    pc.onnegotiationneeded = async () => {
      if (roleRef.current !== "caller" || !readyRef.current) {
        return;
      }
      await createOffer();
    };

    setConnectionState(pc.connectionState);
    return pc;
  }, [iceServers, sendSignal, createOffer]);

  const ensurePeerConnection = useCallback(() => {
    if (pcRef.current) {
      return pcRef.current;
    }

    if (!localStream) {
      return null;
    }

    const pc = createPeerConnection();
    pcRef.current = pc;
    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream);
    });
    return pc;
  }, [createPeerConnection, localStream]);

  const handleSignal = useCallback(
    async (payload: RtcSignalPayload) => {
      const pc = ensurePeerConnection();
      if (!pc) {
        return;
      }

      if (payload.type === "offer") {
        await pc.setRemoteDescription({ type: "offer", sdp: payload.sdp });
        for (const candidate of pendingCandidatesRef.current) {
          await pc.addIceCandidate(candidate);
        }
        pendingCandidatesRef.current = [];
        await createAnswer();
        return;
      }

      if (payload.type === "answer") {
        await pc.setRemoteDescription({ type: "answer", sdp: payload.sdp });
        for (const candidate of pendingCandidatesRef.current) {
          await pc.addIceCandidate(candidate);
        }
        pendingCandidatesRef.current = [];
        return;
      }

      if (payload.type === "ice-candidate") {
        if (!pc.remoteDescription) {
          pendingCandidatesRef.current.push(payload.candidate);
          return;
        }
        await pc.addIceCandidate(payload.candidate);
      }
    },
    [createAnswer, ensurePeerConnection],
  );

  const leave = useCallback(() => {
    const socket = socketRef.current;
    if (socket) {
      socket.emit("rtc:leave", { roomId });
      socket.disconnect();
      socketRef.current = null;
    }

    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    setRemoteStream(null);
    readyRef.current = false;
    hasSentReadyRef.current = false;
    setConnectionState("closed");
  }, [roomId]);

  useEffect(() => {
    if (!roomId) {
      return;
    }

    const signalingUrl =
      process.env.NEXT_PUBLIC_RTC_SIGNALING_URL || "http://localhost:3001";
    const socket = io(signalingUrl, { transports: ["websocket"] });

    socketRef.current = socket;

    socket.on("connect", () => {
      readyRef.current = false;
      hasSentReadyRef.current = false;
      socket.emit("rtc:join", { roomId });
    });

    socket.on("rtc:joined", ({ role }: { role: RtcRole }) => {
      setRole(role);
      setIsRoomFull(false);
      setError(null);
    });

    socket.on("rtc:room-full", () => {
      setIsRoomFull(true);
      setError("현재 방에 이미 2명이 있습니다.");
    });

    socket.on("rtc:ready", () => {
      readyRef.current = true;
      if (roleRef.current === "caller") {
        const pc = ensurePeerConnectionRef.current();
        if (pc) {
          void createOfferRef.current();
        }
      }
    });

    socket.on("rtc:signal", ({ payload }: { payload: RtcSignalPayload }) => {
      void handleSignalRef.current(payload);
    });

    socket.on("rtc:peer-left", () => {
      setRemoteStream(null);
      readyRef.current = false;
      hasSentReadyRef.current = false;
      pcRef.current?.close();
      pcRef.current = null;
      setConnectionState("new");
      setRole("caller");
      emitReadyIfPossible();
    });

    socket.on("disconnect", () => {
      setConnectionState("disconnected");
    });

    return () => {
      leave();
    };
  }, [emitReadyIfPossible, leave, roomId]);

  useEffect(() => {
    handleSignalRef.current = handleSignal;
  }, [handleSignal]);

  useEffect(() => {
    createOfferRef.current = createOffer;
  }, [createOffer]);

  useEffect(() => {
    ensurePeerConnectionRef.current = ensurePeerConnection;
  }, [ensurePeerConnection]);

  useEffect(() => {
    if (!localStream) {
      return;
    }

    ensurePeerConnection();
  }, [ensurePeerConnection, localStream]);

  useEffect(() => {
    emitReadyIfPossible();
  }, [emitReadyIfPossible, localStream, role]);

  useEffect(() => {
    const pc = pcRef.current;
    if (!pc || !localStream) {
      return;
    }

    const nextVideoTrack =
      screenStream?.getVideoTracks()[0] ?? localStream.getVideoTracks()[0];
    if (!nextVideoTrack) {
      return;
    }

    const sender = pc
      .getSenders()
      .find((currentSender) => currentSender.track?.kind === "video");
    if (!sender) {
      return;
    }

    void sender.replaceTrack(nextVideoTrack);
  }, [localStream, screenStream]);

  return {
    remoteStream,
    role,
    connectionState,
    error,
    isRoomFull,
    leave,
  };
}
