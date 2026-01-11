# Dockerfile
# NestJS 서버를 Docker 이미지로 만드는 파일
# Monorepo 구조: 루트에 backend/, frontend/ 폴더가 있음
# 빌드 명령: docker build -f backend/Dockerfile . (루트에서 실행)
ㅔ
# 1단계: 빌드 환경
FROM node:20-alpine AS builder

# 작업 디렉토리 설정
WORKDIR /app

# 루트의 workspace 설정 파일들 복사
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# backend 폴더 전체 복사 (루트의 backend/ → /app/backend/)
COPY backend/ ./backend/

# pnpm 설치
RUN npm install -g pnpm

# 의존성 설치 (backend만)
RUN pnpm install --frozen-lockfile --filter backend

# 빌드 (루트에서 workspace 필터 사용)
# WORKDIR은 /app에 그대로 유지 (pnpm workspace는 루트에서 실행)
RUN pnpm --filter backend build

# 2단계: 실행 환경 (더 작은 이미지)
FROM node:20-alpine

WORKDIR /app

# pnpm 설치
RUN npm install -g pnpm

# 루트의 workspace 설정 파일들 복사
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# backend의 package.json만 복사 (의존성 설치용)
COPY backend/package.json ./backend/package.json

# 프로덕션 의존성만 설치 (backend만)
RUN pnpm install --prod --frozen-lockfile --filter backend

# 빌드된 파일 복사 (builder에서)
COPY --from=builder /app/backend/dist ./backend/dist

# 작업 디렉토리를 backend로 변경
WORKDIR /app/backend

# 포트 노출
EXPOSE 3001

# 헬스 체크
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# 서버 실행 (현재 작업 디렉토리가 /app/backend이므로 dist/main.js)
CMD ["node", "dist/main.js"]

