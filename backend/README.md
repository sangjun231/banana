# WebSocket Server (NestJS)

NestJS로 구축한 WebSocket 채팅 서버입니다.

## 개발 환경 설정

```bash
# 의존성 설치
pnpm install

# 개발 서버 실행
pnpm start:dev

# 빌드
pnpm build

# 프로덕션 실행
pnpm start:prod
```

## API 엔드포인트

- `GET /` - Hello 메시지
- `GET /health` - 서버 상태 확인

## 환경 변수

- `PORT` - 서버 포트 (기본값: 3001)
- `FRONTEND_URL` - 프론트엔드 URL (CORS용, 기본값: http://localhost:3000)

