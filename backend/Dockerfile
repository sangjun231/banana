# Dockerfile
# NestJS 서버를 Docker 이미지로 만드는 파일

# 1단계: 빌드 환경
FROM node:20-alpine AS builder

# 작업 디렉토리 설정
WORKDIR /app

# package.json과 pnpm-lock.yaml 복사
COPY package*.json ./
COPY pnpm-lock.yaml ./

# pnpm 설치
RUN npm install -g pnpm

# 의존성 설치
RUN pnpm install --frozen-lockfile

# 소스 코드 복사
COPY . .

# 빌드
RUN pnpm build

# 2단계: 실행 환경 (더 작은 이미지)
FROM node:20-alpine

WORKDIR /app

# pnpm 설치
RUN npm install -g pnpm

# package.json만 복사 (의존성 설치용)
COPY package*.json ./
COPY pnpm-lock.yaml ./

# 프로덕션 의존성만 설치
RUN pnpm install --prod --frozen-lockfile

# 빌드된 파일 복사
COPY --from=builder /app/dist ./dist

# 포트 노출
EXPOSE 3001

# 헬스 체크
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# 서버 실행
CMD ["node", "dist/main.js"]

