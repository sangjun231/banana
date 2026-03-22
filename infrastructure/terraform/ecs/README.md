# ECS 배포 모드 전환 가이드

이 폴더에는 ECS Fargate + ALB 배포에 필요한 Terraform 코드가 백업되어 있습니다.

## 포함된 파일

| 파일 | 설명 |
|------|------|
| `alb.tf` | Application Load Balancer |
| `ecr.tf` | Elastic Container Registry |
| `ecs.tf` | ECS 클러스터, 태스크, 서비스 |
| `iam.tf` | ECS IAM 역할 및 정책 |
| `security.tf` | ALB/ECS 보안 그룹 |
| `vpc.tf` | VPC (NAT Gateway 포함) |
| `outputs.tf` | ECS용 출력값 |

## EC2 → ECS 전환 방법

### 1. 현재 EC2 인프라 제거 (선택사항)

```powershell
cd infrastructure/terraform
terraform destroy
```

### 2. ECS 파일들을 루트로 복사

```powershell
# 기존 EC2용 파일 백업
mkdir ec2-backup
Move-Item -Path "ec2.tf" -Destination "ec2-backup/"
Move-Item -Path "security-groups.tf" -Destination "ec2-backup/"
Move-Item -Path "outputs.tf" -Destination "ec2-backup/"
Move-Item -Path "vpc.tf" -Destination "ec2-backup/"

# ECS 파일 복사
Copy-Item -Path "ecs/*.tf" -Destination "."
```

### 3. terraform.tfvars 수정

```hcl
deploy_mode = "ecs"  # ec2 → ecs로 변경

# ECS 설정 확인
ecs_task_cpu      = 256
ecs_task_memory   = 512
ecs_desired_count = 1

# 예산 한도 증가 (ECS는 비용 발생)
monthly_budget_limit = 100
```

### 4. Terraform 적용

```powershell
terraform init
terraform plan
terraform apply
```

### 5. Docker 이미지 푸시

```powershell
# ECR 로그인
aws ecr get-login-password --region ap-northeast-2 | docker login --username AWS --password-stdin <ECR_URL>

# 이미지 빌드 및 푸시
docker build -t websocket-chat-server ./backend
docker tag websocket-chat-server:latest <ECR_URL>:latest
docker push <ECR_URL>:latest
```

## 예상 비용 (ECS 모드)

| 서비스 | 월 예상 비용 |
|--------|-------------|
| ECS Fargate (0.25 vCPU, 512MB) | ~$10-15 |
| ALB | ~$18-25 |
| NAT Gateway (2개) | ~$70 |
| ECR | ~$0-1 |
| **합계** | **~$100-110/월** |

## ECS → EC2 롤백

```powershell
# ECS 인프라 제거
terraform destroy

# EC2 파일 복원
Move-Item -Path "ec2-backup/*" -Destination "."

# EC2 인프라 재생성
terraform init
terraform apply
```
