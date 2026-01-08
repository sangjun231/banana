# Terraform AWS 인프라 구축 완료 요약

## ✅ 완료된 작업

### 1. 기본 구조
- ✅ Terraform 디렉토리 구조 생성
- ✅ Provider 설정 (AWS)
- ✅ 변수 정의 (variables.tf)
- ✅ 출력값 정의 (outputs.tf)

### 2. 네트워크 및 보안
- ✅ VPC 생성 (격리된 네트워크)
- ✅ Public/Private Subnet 생성
- ✅ 인터넷 게이트웨이
- ✅ NAT Gateway (Private Subnet용)
- ✅ 보안 그룹 (방화벽 규칙)
  - ALB: HTTP(80), HTTPS(443) 허용
  - ECS: ALB에서만 접근 가능

### 3. IAM (권한 관리)
- ✅ ECS Task Execution Role
- ✅ ECS Task Role
- ✅ CloudWatch Logs 권한
- ✅ Secrets Manager 권한

### 4. 컨테이너 인프라
- ✅ ECR 리포지토리 (Docker 이미지 저장소)
- ✅ ECS 클러스터
- ✅ ECS Task Definition
- ✅ ECS Service

### 5. 로드밸런서
- ✅ ALB (Application Load Balancer)
- ✅ Target Group
- ✅ HTTP Listener

### 6. 모니터링 및 비용
- ✅ CloudWatch Log Group
- ✅ Budget 알림 설정

### 7. Docker
- ✅ Dockerfile 작성
- ✅ .dockerignore 작성

## 🔒 보안 기능

1. **네트워크 격리**
   - VPC로 격리된 네트워크
   - Private Subnet에 ECS 배치 (외부 직접 접근 불가)

2. **방화벽 규칙**
   - ALB: HTTP(80)만 외부 접근 허용
   - ECS: ALB에서만 접근 가능

3. **IAM 최소 권한**
   - 필요한 권한만 부여
   - 역할 기반 접근 제어

4. **이미지 보안 스캔**
   - ECR 이미지 자동 스캔

## 💰 예상 비용

- **ECS Fargate**: 월 ~$15-30
- **ALB**: 월 ~$16
- **NAT Gateway**: 월 ~$32 (2개)
- **ECR**: 무료
- **CloudWatch**: 무료 (기본)
- **총 예상**: 월 $60-80

**비용 절감 팁:**
- NAT Gateway는 선택사항 (필요시 활성화)
- 개발 중에는 서버 중지
- Budget 알림 설정 완료

## 📋 다음 단계

### 1. AWS 설정
- [ ] AWS 계정 생성
- [ ] IAM 사용자 생성
- [ ] Access Key 발급
- [ ] AWS CLI 설정

### 2. Terraform 배포
- [ ] `terraform.tfvars` 파일 생성
- [ ] `terraform init`
- [ ] `terraform plan` (확인)
- [ ] `terraform apply` (배포)

### 3. Docker 이미지 배포
- [ ] ECR 로그인
- [ ] Docker 이미지 빌드
- [ ] ECR에 푸시
- [ ] ECS 서비스 업데이트

### 4. 확인
- [ ] ALB DNS로 접속 테스트
- [ ] CloudWatch 로그 확인
- [ ] Budget 알림 확인

## 📚 학습 포인트

### Terraform 개념
- **Infrastructure as Code**: 인프라를 코드로 관리
- **Resource**: AWS 리소스 정의
- **Variable**: 재사용 가능한 값
- **Output**: 생성된 리소스 정보

### AWS 개념
- **VPC**: 격리된 네트워크
- **Subnet**: 네트워크 세분화
- **Security Group**: 가상 방화벽
- **IAM**: 권한 관리
- **ECS**: 컨테이너 실행 서비스
- **ALB**: 로드밸런서

### 보안 개념
- **최소 권한 원칙**: 필요한 권한만 부여
- **네트워크 격리**: Private Subnet 사용
- **방화벽**: Security Group으로 트래픽 제어

## 🎯 NestJS MVC 패턴 이해

이 인프라에서 NestJS는:
- **Model**: 데이터 구조 (나중에 추가)
- **View**: 없음 (API 서버)
- **Controller**: `app.controller.ts` (요청 처리)
- **Service**: `app.service.ts` (비즈니스 로직)

NestJS는 MVC 패턴을 사용하지만, API 서버이므로 View는 없고 Controller와 Service로 구성됩니다.

