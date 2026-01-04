# WebSocket 채팅 기능 아키텍처

## 구조 개요

```
project/
├── server/                    # WebSocket 서버 (별도 프로세스)
│   ├── src/
│   │   ├── server.ts         # WebSocket 서버 진입점
│   │   ├── websocket/
│   │   │   ├── server.ts     # WebSocket 서버 클래스
│   │   │   ├── connection-manager.ts  # 연결 관리
│   │   │   └── message-handler.ts      # 메시지 처리
│   │   └── utils/
│   │       └── message-validator.ts   # 메시지 검증
│   ├── tests/                # 서버 테스트
│   └── package.json
├── src/
│   ├── features/
│   │   └── chat/
│   │       ├── hooks/
│   │       │   └── use-websocket.ts  # 클라이언트 WebSocket 훅
│   │       ├── utils/
│   │       │   └── message-utils.ts  # 메시지 유틸리티
│   │       └── types.ts
│   └── lib/
│       └── websocket/
│           └── client.ts     # WebSocket 클라이언트 래퍼
└── tests/
    ├── unit/
    │   └── chat/             # 채팅 관련 유닛 테스트
    └── integration/
        └── chat/             # 채팅 통합 테스트
```

## 기술 스택

- **서버**: Node.js + `ws` 라이브러리
- **클라이언트**: 브라우저 WebSocket API
- **테스트**: Vitest + MSW (WebSocket 모킹)

## 개발 순서 (TDD)

1. **메시지 유틸리티 함수** (가장 단순)

   - 메시지 검증
   - 메시지 포맷팅
   - 타임스탬프 처리

2. **WebSocket 서버 핵심 로직**

   - 연결 관리
   - 메시지 라우팅
   - 에러 처리

3. **WebSocket 서버 구현**

   - 실제 서버 구동
   - Supabase 인증 연동

4. **클라이언트 훅**
   - WebSocket 연결 관리
   - 메시지 송수신
   - 재연결 로직

## 실행 방법

### 개발 환경

```bash
# 터미널 1: Next.js 개발 서버
pnpm dev

# 터미널 2: WebSocket 서버
cd server && pnpm dev
```

### 프로덕션

```bash
# WebSocket 서버를 별도 프로세스로 실행
# 또는 Docker 컨테이너로 분리
```
