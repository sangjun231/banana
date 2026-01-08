# Terraform AWS 배포 시작 가이드

## 📋 사전 준비 체크리스트

### 1. AWS 계정 및 설정
- [ ] AWS 계정 생성 완료
- [ ] IAM 사용자 생성 (루트 계정 사용 금지)
- [ ] Access Key ID 발급
- [ ] Secret Access Key 발급
- [ ] AWS CLI 설치 및 설정 (`aws configure`)

### 2. Terraform 설치
- [ ] Terraform 설치 완료
- [ ] `terraform version` 명령어로 확인

### 3. 변수 파일 설정
- [ ] `terraform.tfvars.example` 복사
- [ ] `terraform.tfvars` 파일 생성
- [ ] 이메일 주소 등 실제 값 입력

## 🚀 배포 단계

### 1단계: 변수 파일 생성

```bash
cd infrastructure/terraform
cp terraform.tfvars.example terraform.tfvars
```

`terraform.tfvars` 파일을 열어서 수정:
```hcl
aws_region          = "ap-northeast-2"
environment         = "dev"
project_name        = "websocket-chat"
budget_alert_email  = "your-email@example.com"  # 실제 이메일 입력
monthly_budget_limit = 50
```

### 2단계: Terraform 초기화

```bash
terraform init
```

이 명령어는:
- AWS Provider 다운로드
- Terraform 설정 초기화

### 3단계: 계획 확인 (중요!)

```bash
terraform plan
```

이 명령어는:
- 생성될 리소스 미리보기
- 비용 예상
- **실제로 생성하지 않음** (안전)

### 4단계: 실제 배포

```bash
terraform apply
```

확인 메시지가 나오면 `yes` 입력

### 5단계: 출력값 확인

배포 완료 후 출력되는 정보:
- ECR 리포지토리 URL (Docker 이미지 푸시용)
- ALB DNS 이름 (서버 접속 URL)

## 🐳 Docker 이미지 빌드 및 푸시

### 1. ECR 로그인

```bash
aws ecr get-login-password --region ap-northeast-2 | docker login --username AWS --password-stdin <계정ID>.dkr.ecr.ap-northeast-2.amazonaws.com
```

### 2. Docker 이미지 빌드

```bash
cd backend
docker build -t websocket-chat-server .
```

### 3. 이미지 태그 지정

```bash
docker tag websocket-chat-server:latest <ECR_URL>:latest
```

### 4. ECR에 푸시

```bash
docker push <ECR_URL>:latest
```

### 5. ECS 서비스 업데이트

```bash
aws ecs update-service --cluster <클러스터명> --service <서비스명> --force-new-deployment
```

## 🔍 확인 방법

1. **ALB DNS 이름 확인**
   ```bash
   terraform output alb_dns_name
   ```

2. **브라우저에서 접속**
   ```
   http://<alb_dns_name>/health
   ```

3. **CloudWatch 로그 확인**
   - AWS 콘솔 → CloudWatch → Log Groups
   - `/ecs/websocket-chat` 로그 그룹 확인

## 💰 비용 확인

- AWS 콘솔 → Billing → Bills
- Budget 알림 이메일 확인

## 🛑 리소스 삭제 (비용 절감)

개발이 끝나면 리소스 삭제:

```bash
terraform destroy
```

**주의**: 모든 리소스가 삭제됩니다!

## ❓ 문제 해결

### Terraform 오류
- `terraform init` 다시 실행
- AWS 자격 증명 확인 (`aws configure`)
- 리전 확인 (ap-northeast-2)

### Docker 빌드 오류
- `backend/package.json` 확인
- `pnpm install` 로컬에서 먼저 테스트

### ECS 서비스 오류
- CloudWatch 로그 확인
- 보안 그룹 규칙 확인
- Health check 엔드포인트 확인

