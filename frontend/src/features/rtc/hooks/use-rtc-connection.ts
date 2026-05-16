/** biome-ignore-all lint/correctness/useExhaustiveDependencies: we need to use exhaustive dependencies */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { socketServerUrl } from "@/lib/socket-url";
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
  // UI에서 쓰는 상태: 원격 스트림, 역할, 연결 상태, 에러.
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [role, setRole] = useState<RtcRole | null>(null);
  const [connectionState, setConnectionState] =
    useState<RTCPeerConnectionState>("new");
  const [error, setError] = useState<string | null>(null);
  const [isRoomFull, setIsRoomFull] = useState(false);
  const [hasPeer, setHasPeer] = useState(false);

  // 렌더링 중 재생성을 피하기 위해 장수 객체는 ref로 관리.
  const socketRef = useRef<Socket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  // 비동기 콜백에서 최신 값이 보이도록 ready/role을 ref로 보관.
  const readyRef = useRef(false);
  const roleRef = useRef<RtcRole | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  // remoteDescription 설정 전에 ICE 후보가 오면 큐에 쌓아둔다.
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  // 재렌더링 시 ready 이벤트 중복 전송 방지.
  const hasSentReadyRef = useRef(false);
  // caller offer 중복 전송 방지 (rtc:ready 재발화·재접속 시 ICE 꼬임 방지).
  const hasSentOfferRef = useRef(false);
  // Socket.IO 리스너 재등록을 피하기 위해 콜백을 ref로 저장.
  const handleSignalRef = useRef<
    (payload: RtcSignalPayload) => Promise<void> | void
  >(async () => {});
  const createOfferRef = useRef<() => Promise<void>>(async () => {});
  const ensurePeerConnectionRef = useRef<() => RTCPeerConnection | null>(
    () => null,
  );

  // ICE 서버 목록은 한 번만 파싱해서 재사용.
  const iceServers = useMemo(() => parseIceServers(), []);

  // 비동기 콜백에서 최신 값이 보이도록 ref를 동기화.
  useEffect(() => {
    roleRef.current = role;
  }, [role]);

  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  // Socket.IO로 시그널링 payload를 전송.
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

  // 이미 생성된 peer connection에 로컬 트랙을 중복 없이 동기화한다.
  // (권한 허용이 늦거나 재입장으로 stream이 바뀌는 경우를 처리)
  // m-line 순서를 브라우저 간에 맞추기 위해 audio → video 순으로 addTrack 한다.
  const syncLocalTracks = useCallback(
    (pc: RTCPeerConnection, stream: MediaStream | null) => {
      if (!stream) {
        return;
      }

      const tracks = [...stream.getAudioTracks(), ...stream.getVideoTracks()];
      for (const track of tracks) {
        const hasSender = pc
          .getSenders()
          .some((sender) => sender.track?.id === track.id);
        if (!hasSender) {
          pc.addTrack(track, stream);
        }
      }
    },
    [],
  );

  // 소켓/역할 준비 시 rtc:ready 전송.
  // 테스트 단계: 양쪽 모두 카메라(비디오 트랙)까지 붙은 뒤에만 협상 시작 — offer/answer 타이밍 꼬임 방지.
  // (나중에 마이크만·입장만 먼저 등은 여기 조건만 완화하면 됨.)
  const emitReadyIfPossible = useCallback(() => {
    if (!socketRef.current || !roleRef.current || hasSentReadyRef.current) {
      return;
    }

    const stream = localStreamRef.current;
    if (!stream || stream.getVideoTracks().length === 0) {
      return;
    }

    socketRef.current.emit("rtc:ready", { roomId });
    hasSentReadyRef.current = true;
  }, [roomId]);

  // SDP offer 생성 후 전송.
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

  // SDP answer 생성 후 전송.
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

  // RTCPeerConnection 생성 및 이벤트 핸들러 연결.
  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection({ iceServers });

    // ontrack에서 원격 미디어 스트림 수신.
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

    // ICE 후보가 발견되면 상대에게 전달.
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

    // UI 연결 상태 동기화.
    pc.onconnectionstatechange = () => {
      setConnectionState(pc.connectionState);
    };

    // 초기 offer는 rtc:ready 한 번에서만 보낸다. 여기서 createOffer 를 또 호출하면
    // (recvonly 제거 후에도) addTrack 타이밍에 따라 m-line 순서 불일치 InvalidAccessError 가 난다.
    // 화면 공유는 replaceTrack 으로 처리한다.

    setConnectionState(pc.connectionState);
    return pc;
  }, [iceServers, sendSignal]);

  // 로컬 미디어가 준비된 뒤 peer connection 생성.
  // caller 는 로컬 스트림이 있을 때만 PC 를 만든다 (빈 PC + recvonly + addTrack 혼합 방지).
  const ensurePeerConnection = useCallback(() => {
    if (pcRef.current) {
      syncLocalTracks(pcRef.current, localStream);
      return pcRef.current;
    }

    if (roleRef.current === "caller" && !localStream) {
      return null;
    }

    const pc = createPeerConnection();
    pcRef.current = pc;
    syncLocalTracks(pc, localStream);

    return pc;
  }, [createPeerConnection, localStream, syncLocalTracks]);

  // 수신한 시그널링 메시지(offer/answer/ICE) 처리.
  const handleSignal = useCallback(
    async (payload: RtcSignalPayload) => {
      const pc = ensurePeerConnection();
      if (!pc) {
        return;
      }

      if (payload.type === "offer") {
        if (pc.signalingState === "stable") {
          return;
        }
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

  // 룸 퇴장 및 리소스 정리.
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
    hasSentOfferRef.current = false;
    setConnectionState("closed");
  }, [roomId]);

  useEffect(() => {
    if (!roomId) {
      return;
    }

    // 시그널링 서버 연결 및 RTC 이벤트 리스너 등록.
    const socket = io(socketServerUrl, { transports: ["websocket"] });

    socketRef.current = socket;

    socket.on("connect", () => {
      readyRef.current = false;
      hasSentReadyRef.current = false;
      hasSentOfferRef.current = false;
      socket.emit("rtc:join", { roomId });
    });

    socket.on("connect_error", (err) => {
      setError(
        `시그널링 서버 연결 실패: ${err.message}. NEXT_PUBLIC_SOCKET_URL을 확인하세요.`,
      );
    });

    // 서버가 caller/callee 역할을 부여.
    socket.on("rtc:joined", ({ role }: { role: RtcRole }) => {
      setRole(role);
      setHasPeer(role === "callee");
      setIsRoomFull(false);
      setError(null);
    });

    socket.on("rtc:peer-joined", () => {
      setHasPeer(true);
    });

    // 방이 가득 찼을 때(2명 초과).
    socket.on("rtc:room-full", () => {
      setIsRoomFull(true);
      setError("현재 방에 이미 2명이 있습니다.");
    });

    // 양쪽 준비 완료 시 caller가 offer 시작.
    socket.on("rtc:ready", () => {
      readyRef.current = true;
      if (roleRef.current === "caller" && !hasSentOfferRef.current) {
        const pc = ensurePeerConnectionRef.current();
        if (pc) {
          hasSentOfferRef.current = true;
          void createOfferRef.current();
        }
      }
    });

    // 시그널링 payload(offer/answer/ICE) 수신.
    socket.on("rtc:signal", ({ payload }: { payload: RtcSignalPayload }) => {
      void handleSignalRef.current(payload);
    });

    // 상대가 나가면 상태 초기화 후 대기.
    socket.on("rtc:peer-left", () => {
      setRemoteStream(null);
      setHasPeer(false);
      readyRef.current = false;
      hasSentReadyRef.current = false;
      hasSentOfferRef.current = false;
      pcRef.current?.close();
      pcRef.current = null;
      setConnectionState("new");
      setRole("caller");
      emitReadyIfPossible();
    });

    // 시그널링 서버와 연결 종료.
    socket.on("disconnect", () => {
      setConnectionState("disconnected");
    });

    return () => {
      const socket = socketRef.current;
      if (socket?.connected) {
        socket.emit("rtc:leave", { roomId });
      }
      socket?.disconnect();
      socketRef.current = null;
      pcRef.current?.close();
      pcRef.current = null;
      pendingCandidatesRef.current = [];
      readyRef.current = false;
      hasSentReadyRef.current = false;
      hasSentOfferRef.current = false;
    };
  }, [roomId]);

  useEffect(() => {
    handleSignalRef.current = handleSignal;
  }, [handleSignal]);

  // Socket.IO 콜백에서 최신 offer/answer 함수 사용.
  useEffect(() => {
    createOfferRef.current = createOffer;
  }, [createOffer]);

  // Socket.IO 콜백에서 최신 peer connection 생성 함수 사용.
  useEffect(() => {
    ensurePeerConnectionRef.current = ensurePeerConnection;
  }, [ensurePeerConnection]);

  // 로컬 미디어 준비 후 peer connection 보장.
  useEffect(() => {
    const pc = ensurePeerConnection();
    if (!pc) {
      return;
    }
    syncLocalTracks(pc, localStream);
  }, [ensurePeerConnection, localStream, syncLocalTracks]);

  useEffect(() => {
    emitReadyIfPossible();
  }, [emitReadyIfPossible, localStream, role]);

  // 화면공유 토글 시 송신 video 트랙 교체.
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
    hasPeer,
    connectionState,
    error,
    isRoomFull,
    leave,
  };
}
