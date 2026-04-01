#!/bin/bash
set -euxo pipefail

DOMAIN="${domain}"
EMAIL="${acme_email}"

# ---------------------------------------------------------------------------
# 시스템 / 런타임
# ---------------------------------------------------------------------------
dnf update -y

dnf install -y nodejs npm git nginx certbot python3-certbot-nginx

npm install -g pm2

mkdir -p /home/ec2-user/app
chown ec2-user:ec2-user /home/ec2-user/app

# ---------------------------------------------------------------------------
# nginx → Nest (127.0.0.1:3001) 리버스 프록시 (HTTP 먼저, certbot이 SSL 블록 추가)
# ---------------------------------------------------------------------------
# 작은따옴표 heredoc: bash가 $를 치환하지 않음(nginx의 $host 등 유지).
# 아래 코드는 bash 환경에서 사용하는 코드 / 다른 환경에서는 $ 등 확인 필요.
# ${domain}만 Terraform이 템플릿 렌더 시 치환.
cat >/etc/nginx/conf.d/api.conf <<'NGINX_CONF'
server {
    listen 80;
    listen [::]:80;
    server_name ${domain};

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }
}
NGINX_CONF

# 기본 welcome 페이지가 server_name과 충돌하지 않도록 비활성화
if [ -f /etc/nginx/default.d/welcome.conf ]; then
  mv /etc/nginx/default.d/welcome.conf /etc/nginx/default.d/welcome.conf.disabled || true
fi

nginx -t
systemctl enable nginx
systemctl restart nginx

# ---------------------------------------------------------------------------
# Let's Encrypt: DNS가 늦게 붙거나 Cloudflare 프록시여도 LE가 80으로 도달하면 성공
# ---------------------------------------------------------------------------
CERT_OK=0
for attempt in $(seq 1 36); do
  if certbot --nginx \
      -d "$DOMAIN" \
      --non-interactive \
      --agree-tos \
      -m "$EMAIL" \
      --redirect; then
    CERT_OK=1
    break
  fi
  echo "certbot attempt $attempt failed; retry in 120s (DNS/전파 대기)"
  sleep 120
done

# 갱신: certbot 패키지가 timer를 제공하면 사용, 없으면 cron으로 이중화
if systemctl list-unit-files | grep -q '^certbot-renew.timer'; then
  systemctl enable --now certbot-renew.timer
else
  cat >/etc/cron.d/certbot-renew <<'CRON'
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin
0 2,14 * * * root certbot renew --quiet --deploy-hook "systemctl reload nginx"
CRON
fi

# renew 후 nginx 재로드
mkdir -p /etc/letsencrypt/renewal-hooks/deploy
cat >/etc/letsencrypt/renewal-hooks/deploy/nginx-reload.sh <<'HOOK'
#!/bin/bash
systemctl reload nginx
HOOK
chmod +x /etc/letsencrypt/renewal-hooks/deploy/nginx-reload.sh

{
  echo "EC2 초기 설정 완료 (nginx + certbot). DOMAIN=$DOMAIN"
  if [ "$CERT_OK" -ne 1 ]; then
    echo "certbot 자동 발급 실패 — DNS·80 포트 확인 후 SSH에서 수동 실행:"
    echo "  sudo certbot --nginx -d $DOMAIN --agree-tos -m $EMAIL --redirect"
  fi
} > /home/ec2-user/setup-complete.txt
