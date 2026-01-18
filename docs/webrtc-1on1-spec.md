# WebRTC 1:1 화면공유/화상 통화 스펙

## 0. 배경 (현재 레포 맥락)

- **Frontend**: Next.js(App Router) 기반, `/rtc` 페이지와 `features/rtc` 모듈 구현 완료
- **Backend**: NestJS WebSocketGateway + Socket.IO로 **시그널링 서버** 구현
- **Docs**:
  - 현재 구현/모듈/역할 정리는 `docs/websocket-architecture.md`
  - 환경 변수 예시는 `docs/env.example.md`

## 1. 목표

- 1:1 기준 **영상 + 음성 + 화면공유** 통화 구현
- WebRTC 표준 API만 사용 (브라우저 네이티브)
- NestJS 서버를 **시그널링 서버**로 사용
- 간단한 룸(방) 기반 연결 흐름 제공

## 2. 비목표 (이번 범위 제외)

- 다자간 통화, SFU/MCU
- 녹화/리플레이
- 메시지 채팅
- 고급 미디어 처리(노이즈 억제, 배경 제거 등)

## 3. 사용자 시나리오

1. A가 `/rtc?room=ROOM_ID` 접속 (혹은 생성 버튼으로 룸 생성)
2. A가 카메라/마이크 권한 승인
3. B가 동일한 `room`으로 접속
4. A/B 간 시그널링 완료 후 1:1 WebRTC 연결
5. A 또는 B가 화면공유 시작/중지
6. 통화 종료 시 리소스 정리

## 4. 아키텍처 개요

```
Browser A  <--- Socket.IO --->  NestJS Signaling  <--- Socket.IO --->  Browser B
   |                               |
   |<-------- WebRTC P2P ----------|
```

### 구성 요소

- **Frontend**
  - `/rtc` 페이지 (client component)
  - WebRTC 훅 + UI 컴포넌트
  - Socket.IO 클라이언트
- **Backend**
  - WebSocket Gateway (Socket.IO)
  - 룸 관리/시그널링 메시지 라우팅

## 5. 시그널링 이벤트 설계 (Socket.IO)

### 공통 페이로드

```ts
type RtcSignalPayload =
  | { type: "offer"; sdp: string }
  | { type: "answer"; sdp: string }
  | { type: "ice-candidate"; candidate: RTCIceCandidateInit };
```

### 이벤트 목록

- `rtc:join` `{ roomId: string, userId?: string }`
  - 서버 응답: `rtc:joined` `{ roomId, role: "caller" | "callee" }`
- `rtc:ready` `{ roomId }`
  - 양쪽 모두 준비되면 서버가 `rtc:ready` 브로드캐스트
- `rtc:signal` `{ roomId, payload: RtcSignalPayload }`
  - offer/answer/candidate 전달
- `rtc:leave` `{ roomId }`
  - 상대에게 `rtc:peer-left` 브로드캐스트
- `rtc:room-full` `{ roomId }`
  - 1:1 제한 초과 시

## 6. WebRTC 연결 플로우

1. **join**
   - 클라이언트가 `rtc:join` -> 서버에서 room 참가
   - 첫 입장자는 `caller`, 두 번째는 `callee`
2. **ready**
   - 양쪽 모두 로컬 미디어 준비되면 `rtc:ready` 전송
   - 서버가 `rtc:ready` 브로드캐스트 -> `caller`가 offer 생성
3. **answer**
   - `callee`가 answer 생성 후 `rtc:signal` 발송
4. **ICE**
   - `onicecandidate` 발생 시 `rtc:signal`로 상대에게 전달
   - remote description 이전 후보는 큐에 보관 후 처리
5. **연결 완료**
   - `ontrack`에서 remote stream 렌더링
6. **화면공유**
   - `replaceTrack`으로 video track 교체
   - 필요 시 `negotiationneeded`로 재협상

## 7. Frontend 구현 상세

### 7.1 위치/파일 구조 (현재)

```
frontend/
├── app/(auth)/rtc/page.tsx
└── src/features/rtc/
    ├── hooks/
    │   ├── use-rtc-connection.ts
    │   └── use-media-stream.ts
    ├── ui/
    │   ├── rtc-page.tsx
    │   ├── rtc-controls.tsx
    │   └── rtc-video.tsx
    └── types.ts
```

### 7.2 상태/훅 설계

- `useMediaStream`
  - `getUserMedia` + `getDisplayMedia`
  - 카메라/마이크 on/off, 화면공유 toggle
- `useRtcConnection`
  - Socket.IO 연결 및 시그널링 이벤트 처리
  - `RTCPeerConnection` 생성/관리
  - `offer/answer/ice-candidate` 핸들링 + ICE 후보 큐
  - 화면공유 시 video track 교체

### 7.3 UI (간단)

- 상단: roomId/role 표시 + 링크 복사
- 메인: 상대 영상(큰 영역), 내 영상(보조 영역)
- 하단: 마이크/카메라/화면공유/종료 버튼

## 8. Backend 구현 상세

### 8.1 NestJS Gateway

```
backend/src/rtc/
├── rtc.module.ts
├── rtc.gateway.ts
└── rtc.service.ts
```

### 8.2 기능

- roomId 기준 연결 관리 (최대 2명)
- caller/callee role 할당
- ready 상태 동기화 후 `rtc:ready` 브로드캐스트
- 시그널링 메시지 중계
- 연결 해제 시 룸/ready 상태 정리
- CORS는 `FRONTEND_URL` 기반

## 9. 환경 변수

### Frontend

```env
# 시그널링 서버 URL
NEXT_PUBLIC_RTC_SIGNALING_URL=http://localhost:3001

# ICE 서버 설정 (JSON 문자열)
NEXT_PUBLIC_RTC_ICE_SERVERS=[{"urls":"stun:stun.l.google.com:19302"}]
```

### Backend

```env
PORT=3001
FRONTEND_URL=http://localhost:3000
SSL_KEY_PATH=...
SSL_CERT_PATH=...
```

## 10. 에러/엣지 케이스

- 권한 거부 (카메라/마이크/화면공유)
- 룸 인원 초과 (`rtc:room-full`)
- 상대방 연결 해제/탭 닫힘 (`rtc:peer-left`)
- 네트워크 불안정으로 ICE 실패
- 화면공유 트랙 종료 이벤트 처리

## 11. 테스트 전략 (간단)

- **Frontend 유닛**
  - `useMediaStream` 권한 실패/성공 핸들링
  - UI 상태 전환
- **Backend 유닛**
  - room 참가/퇴장 처리
  - 1:1 제한 로직

## 12. 현재 상태/다음 개선

- **현재 구현**: 1:1 통화 + 화면공유 + 기본 UI + Socket.IO 시그널링
- **개선 후보**: 재연결/네트워크 복구 처리, 에러 메시지 구체화, e2e 테스트
