# Terraform AWS 인프라 구축

## 📚 Terraform이란?

**Terraform**은 Infrastructure as Code (IaC) 도구입니다.

- 인프라를 코드로 정의
- 버전 관리 가능
- 재현 가능한 환경
- 자동화된 배포

## 🏗️ 파일 구조

```
infrastructure/terraform/
├── main.tf              # 메인 리소스 정의
├── variables.tf          # 변수 정의
├── outputs.tf           # 출력값 정의
├── provider.tf          # AWS Provider 설정
├── vpc.tf               # VPC 및 네트워크
├── security.tf          # 보안 그룹 (방화벽)
├── iam.tf               # IAM 역할 및 권한
├── ecr.tf               # Docker 이미지 저장소
├── ecs.tf               # ECS 클러스터 및 서비스
├── alb.tf               # 로드밸런서
├── budgets.tf           # 비용 관리
└── terraform.tfvars     # 변수 값 (gitignore에 추가)
```

## 🔒 보안 우선순위

1. **네트워크 보안**: VPC, 보안 그룹
2. **접근 제어**: IAM 역할 (최소 권한)
3. **암호화**: HTTPS, Secrets Manager
4. **모니터링**: CloudWatch, 알림

## 💰 비용 관리

- Budget 알림 설정
- 리소스 태깅
- 사용량 모니터링

## 🚀 사용 방법

```bash
# 초기화
terraform init

# 계획 확인 (변경사항 미리보기)
terraform plan

# 실제 적용
terraform apply

# 삭제 (주의!)
terraform destroy
```
