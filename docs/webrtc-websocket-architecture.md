# WebRTC 시그널링 아키텍처 (Socket.IO)

## 목적/범위

- 1:1 영상/음성 통화 + 화면 공유
- WebRTC P2P 연결을 위한 **시그널링만** 서버가 담당
- 다자간 통화(SFU/MCU), 채팅, 녹화 등은 범위 밖

## 관련 문서

- 제품 요구/플로우 스펙: `docs/webrtc-1on1-spec.md`
- 환경 변수 예시: `docs/env.example.md`

## 구조 개요

```
Browser A  <--- Socket.IO --->  NestJS Signaling  <--- Socket.IO --->  Browser B
   |                               |
   |<-------- WebRTC P2P ----------|
```

## 전체 구조 (Mermaid)

   ```mermaid
   flowchart LR
    subgraph FE_A["Browser A (Frontend)"]
        A_UI["RTC UI"]
        A_PC["RTCPeerConnection"]
        A_SIO["Socket.IO Client"]
      end
    
      subgraph FE_B["Browser B (Frontend)"]
        B_UI["RTC UI"]
        B_PC["RTCPeerConnection"]
        B_SIO["Socket.IO Client"]
      end
    
      subgraph ICE["ICE Servers"]
        STUN["STUN"]
        TURN["TURN (Relay)"]
      end
    
      BE["NestJS Signaling (Socket.IO Gateway)"]
    
      A_UI --> A_PC
      B_UI --> B_PC
    
      A_SIO <--> BE
      B_SIO <--> BE
    
      A_PC -- "ICE candidate gather" --> STUN
      B_PC -- "ICE candidate gather" --> STUN
      A_PC -- "ICE candidate gather" --> TURN
      B_PC -- "ICE candidate gather" --> TURN
    
      A_PC <-- "offer/answer/ICE via signaling" --> A_SIO
      B_PC <-- "offer/answer/ICE via signaling" --> B_SIO
    
      A_PC == "Media (P2P when possible)" ==> B_PC
      A_PC -. "Media via relay if P2P fails" .-> TURN
      TURN -. "Relay media" .-> B_PC
   ```

## 디렉터리 구성

```
project/
├── backend/
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   └── rtc/
│   │       ├── rtc.gateway.ts
│   │       ├── rtc.service.ts
│   │       └── rtc.module.ts
│   └── package.json
├── frontend/
│   ├── app/(auth)/rtc/page.tsx
│   └── src/features/rtc/
│       ├── hooks/
│       │   ├── use-media-stream.ts
│       │   └── use-rtc-connection.ts
│       ├── ui/
│       │   ├── rtc-page.tsx
│       │   ├── rtc-controls.tsx
│       │   └── rtc-video.tsx
│       └── types.ts
└── docs/
    ├── env.example.md
    └── webrtc-1on1-spec.md
```

## 시그널링 이벤트

```ts
// frontend/src/features/rtc/types.ts
export type RtcSignalPayload =
  | { type: "offer"; sdp: string }
  | { type: "answer"; sdp: string }
  | { type: "ice-candidate"; candidate: RTCIceCandidateInit };
```

- `rtc:join` `{ roomId: string, userId?: string }`
  - 서버 응답: `rtc:joined` `{ roomId, role: "caller" | "callee" }`
- `rtc:ready` `{ roomId }`
  - 양쪽 모두 준비되면 서버가 `rtc:ready` 브로드캐스트
- `rtc:signal` `{ roomId, payload: RtcSignalPayload }`
  - offer/answer/ICE 후보 전달
- `rtc:leave` `{ roomId }`
  - 상대에게 `rtc:peer-left` 브로드캐스트
- `rtc:room-full` `{ roomId }`
  - 1:1 초과 접속 방지

## 연결 플로우

1. `rtc:join`으로 룸 진입 (1명: caller, 2명: callee)
2. 로컬 미디어 준비 후 `rtc:ready`
3. 서버가 `rtc:ready` 브로드캐스트 -> caller가 offer 생성
4. `rtc:signal`로 offer/answer/ice 후보 교환
5. `ontrack`에서 원격 스트림 렌더링
6. 화면 공유 시 video track 교체 (`replaceTrack`)
   - 필요 시 `negotiationneeded`로 재협상
7. `rtc:leave` 또는 disconnect 시 리소스 정리

## ICE 서버란?
- ICE 서버는 WebRTC의 “연결 길 찾기”를 돕는 STUN/TURN 서버 묶음입니다. 
- 역할은 P2P로 직접 연결할 수 있는 후보 주소(ICE candidate)를 찾아 주고, 직접 연결이 안 될 때는 TURN을 통해 중계하는 것입니다.

  - STUN: 내 공인 IP/포트(외부에서 보이는 주소) 알아내기
  - TURN: NAT/방화벽 때문에 직접 연결이 막히면 미디어를 대신 전달(릴레이)

  즉, 미디어를 처리하는 서버가 아니라 “연결 성사”를 위한 보조 인프라입니다.

  NEXT_PUBLIC_RTC_ICE_SERVERS=[{"urls":"stun:stun.l.google.com:19302"}]
  이 값은 구글이 공개로 제공하는 STUN 서버를 쓰는 설정입니다.

  왜 쓰냐면:

  - 설정이 간단하고 무료이며, 대부분의 환경에서 잘 동작해서 개발/테스트용 기본값으로 많이 씁니다.
  - STUN은 “내가 외부에서 보이는 주소/포트”를 알려주는 역할이라 미디어를 구글로 보내는 게 아닙니다.

  다만 프로덕션에서는:

  - 안정성/가용성 이슈에 대비하거나,
  - 사설망/대칭 NAT 환경에서 연결이 안 될 때를 대비해

  자체 STUN/TURN(특히 TURN)을 두는 게 일반적입니다.

  가장 일반적인 “자체 STUN/TURN” 방식은 coturn(오픈소스 TURN 서버)을 직접 운영하는 것입니다. 선택지는 크게 이렇게 나뉩니다.

  - VPS/EC2에 coturn 설치 (가장 흔함)
     - 공인 IP가 있는 서버 필요
     - 방화벽 포트 오픈: 3478/udp, 3478/tcp, (TLS 사용 시) 5349/tcp + 릴레이 포트 대역(예: 49152-65535/udp)
     - 기본 설정 예시:
      ```bash
        listening-port=3478
        tls-listening-port=5349
        realm=your-domain.com
        fingerprint
        lt-cred-mech
        user=user:pass   # 테스트용(실서비스는 동적 토큰 권장)
        external-ip=PUBLIC_IP/PRIVATE_IP  # NAT 뒤라면 필수
      ```
     - HTTPS/TLS는 Let’s Encrypt로 인증서 발급 후 cert, pkey 설정
  - Docker로 coturn 운영
     - 빠르게 띄울 수 있지만 포트 매핑/방화벽, public IP 설정은 동일하게 필요
  - 클라우드 매니지드 TURN/STUN
     - 자체 운영은 아니지만 운영 부담이 적음 (Twilio, Xirsys, Agora, Vonage 등)
     - 비용은 트래픽 기반

  그리고 프론트엔드에서는 이렇게 등록합니다:

  NEXT_PUBLIC_RTC_ICE_SERVERS=[
    {"urls":"stun:your-stun.example.com:3478"},
    {"urls":"turn:your-turn.example.com:3478","username":"user","credential":"pass"},
    {"urls":"turns:your-turn.example.com:5349","username":"user","credential":"pass"}
  ]

  실서비스라면 TURN 트래픽 비용/대역폭이 꽤 크고, 인증 정보는 **정적 문자열보다 단기 토큰(REST API 기반)**이 더 안전합니다. 

  네, REST + 폴링으로도 가능합니다.
  시그널링 경로는 그냥 **“서로가 만든 연결 정보(offer/answer/ICE)를 주고받는 통로”**예요. 
  그 통로가 WebSocket일 필요는 없고, 어떤 방식이든 “양방향 메시지 전달”이 되면 됩니다.

  시그널링이 하는 일(핵심 3가지):

  1. Offer 전달: A가 “이런 조건으로 연결하자”는 제안을 보냄
  2. Answer 전달: B가 “좋아, 이렇게 연결하자”는 응답을 보냄
  3. ICE 후보 전달: 서로가 발견한 네트워크 경로 후보들을 계속 교환

  그래서 REST + 폴링으로 하면 보통 이런 식이에요:

  - A가 offer를 서버에 POST
  - B가 주기적으로 GET으로 offer/answer/ICE 후보를 확인 (폴링)
  - B가 answer/ICE를 POST
  - A가 다시 GET으로 확인 …

  가능은 하지만:

  - ICE 후보는 여러 개가 연속으로 나오므로 폴링이 번거롭고 지연이 늘어남
  - 실시간성이 떨어져 연결이 느려질 수 있음

  그래서 보통은 WebSocket/Realtime(SSE, Firebase, Supabase Realtime 등)으로 즉시 전달하는 방식을 씁니다.

## 런타임 설정

### Frontend

- `NEXT_PUBLIC_RTC_SIGNALING_URL` : 시그널링 서버 URL (기본값: http://localhost:3001)
- `NEXT_PUBLIC_RTC_ICE_SERVERS` : ICE 서버 JSON 문자열
  - 예: `[{"urls":"stun:stun.l.google.com:19302"}]`
  - 미설정 시 기본 STUN 사용

### Backend

- `PORT` : 서버 포트 (기본값: 3001)
- `FRONTEND_URL` : CORS 허용 Origin, 콤마로 다중 입력
  - 예: `http://localhost:3000,https://example.com`
- `SSL_KEY_PATH`, `SSL_CERT_PATH` : 설정 시 HTTPS/WSS 활성화

## 실행 방법

```bash
# 터미널 1: 프론트엔드
pnpm dev

# 터미널 2: 백엔드 시그널링 서버
pnpm dev:backend
```

---

## 역할/모듈 빠른 이해

### 현재 백엔드 역할

- Socket.IO 기반 **시그널링 서버**로 동작
- 1:1 룸 입장/퇴장 관리 및 이벤트 중계
- WebRTC 미디어는 **직접 처리하지 않음** (브라우저 간 P2P)

### 현재 프론트엔드 역할

- 카메라/마이크/화면공유 스트림 제어
- WebRTC 연결 생성 및 시그널링 처리
- 통화 UI 렌더링 및 상태 표시

### Backend RTC 모듈별 기능

- `backend/src/rtc/rtc.gateway.ts`
  - Socket.IO 이벤트 핸들러 (`rtc:join`, `rtc:ready`, `rtc:signal`, `rtc:leave`)
  - 1:1 룸 제한 및 role 할당
  - `rtc:peer-left`, `rtc:room-full` 브로드캐스트
- `backend/src/rtc/rtc.service.ts`
  - 룸별 ready 상태 관리 (caller/callee 준비 동기화)
- `backend/src/rtc/rtc.module.ts`
  - Gateway/Service 등록
- `backend/src/main.ts`
  - CORS/HTTPS 설정, 서버 부트스트랩

### Frontend RTC 모듈별 기능

- `frontend/app/(auth)/rtc/page.tsx`
  - `/rtc` 라우팅 엔트리, `RtcPage` 렌더링
- `frontend/src/features/rtc/hooks/use-media-stream.ts`
  - 카메라/마이크/화면 공유 시작/중지 및 토글
- `frontend/src/features/rtc/hooks/use-rtc-connection.ts`
  - Socket.IO 연결, 시그널링 이벤트 처리
  - `RTCPeerConnection` 생성/관리, offer/answer/ICE 처리
  - 화면 공유 시 video track 교체
- `frontend/src/features/rtc/types.ts`
  - 시그널링 타입 정의
- `frontend/src/features/rtc/ui/rtc-page.tsx`
  - roomId/role 상태 관리, 버튼/영상/알림 구성
- `frontend/src/features/rtc/ui/rtc-controls.tsx`
  - 통화 제어 버튼 UI
- `frontend/src/features/rtc/ui/rtc-video.tsx`
  - 스트림 렌더링 및 라벨 표시
