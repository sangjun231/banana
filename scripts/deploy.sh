#!/usr/bin/env bash
# 백엔드(EC2) SSH 배포: 로컬 빌드 → scp 업로드 → 원격 npm install --omit=dev → pm2 재기동
# (원격에 rsync 불필요 — EC2 기본 AMI에 rsync가 없을 때 대비)

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND="${ROOT}/backend"
SSH_KEY="${SSH_KEY:-${ROOT}/infrastructure/terraform/banana-key.pem}"
DEPLOY_USER="${DEPLOY_USER:-ec2-user}"
DEPLOY_HOST="${DEPLOY_HOST:-}"
REMOTE_DIR="${REMOTE_DIR:-/home/ec2-user/banana-backend}"
PM2_APP_NAME="${PM2_APP_NAME:-api}"
DEPLOY_ENV_FILE="${DEPLOY_ENV_FILE:-}"

SSH_OPTS=(-i "$SSH_KEY" -o StrictHostKeyChecking=accept-new)

if [[ -z "$DEPLOY_HOST" ]]; then
  echo "DEPLOY_HOST 가 비어 있습니다. 예: export DEPLOY_HOST=<EIP>" >&2
  exit 1
fi

if [[ ! -f "$SSH_KEY" ]]; then
  echo "SSH 키를 찾을 수 없습니다: $SSH_KEY" >&2
  exit 1
fi

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm 이 필요합니다. corepack enable 또는 npm i -g pnpm" >&2
  exit 1
fi

chmod 600 "$SSH_KEY" 2>/dev/null || true

echo "==> 로컬 빌드 (backend)"
cd "$ROOT"
pnpm install
pnpm --filter backend build

echo "==> 원격 디렉터리 준비 (dist 비우기 — 이전 빌드 잔여 제거)"
ssh "${SSH_OPTS[@]}" "${DEPLOY_USER}@${DEPLOY_HOST}" "rm -rf '${REMOTE_DIR}/dist' && mkdir -p '${REMOTE_DIR}/dist'"

echo "==> scp dist + package.json"
scp "${SSH_OPTS[@]}" -r "${BACKEND}/dist/." "${DEPLOY_USER}@${DEPLOY_HOST}:${REMOTE_DIR}/dist/"
scp "${SSH_OPTS[@]}" "${BACKEND}/package.json" "${DEPLOY_USER}@${DEPLOY_HOST}:${REMOTE_DIR}/"

if [[ -n "$DEPLOY_ENV_FILE" ]]; then
  if [[ ! -f "$DEPLOY_ENV_FILE" ]]; then
    echo "DEPLOY_ENV_FILE 이 존재하지 않습니다: $DEPLOY_ENV_FILE" >&2
    exit 1
  fi
  echo "==> env 업로드 → ${REMOTE_DIR}/.env"
  scp "${SSH_OPTS[@]}" "$DEPLOY_ENV_FILE" "${DEPLOY_USER}@${DEPLOY_HOST}:${REMOTE_DIR}/.env"
fi

echo "==> 원격 의존성 설치 및 pm2 재기동"
ssh "${SSH_OPTS[@]}" "${DEPLOY_USER}@${DEPLOY_HOST}" bash -s <<REMOTE
set -euo pipefail
cd '${REMOTE_DIR}'
npm install --omit=dev
pm2 delete '${PM2_APP_NAME}' 2>/dev/null || true
pm2 start npm --name '${PM2_APP_NAME}' -- run start:prod
pm2 save
REMOTE

echo "==> 배포 완료. 확인: curl -sS -o /dev/null -w '%{http_code}' http://127.0.0.1:3001/ (서버에서)"
