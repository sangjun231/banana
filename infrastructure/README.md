# AWS 인프라 구축 가이드

## 📋 사전 준비

### 1. AWS 계정 생성

1. [AWS 콘솔](https://aws.amazon.com/ko/) 접속
2. 계정 생성 (신용카드 필요, 프리티어 사용 가능)

### 2. AWS CLI 설치

```bash
# Windows (Chocolatey)
choco install awscli

# 또는 직접 다운로드
# https://aws.amazon.com/cli/
```

### 3. AWS 자격 증명 설정

```bash
aws configure
# Access Key ID 입력
# Secret Access Key 입력
# Default region: ap-northeast-2 (서울)
# Default output format: json
```

**Access Key 발급 방법:**

1. AWS 콘솔 → IAM → 사용자
2. 사용자 생성 또는 기존 사용자 선택
3. "액세스 키 만들기"
4. Access Key ID와 Secret Access Key 저장 (한 번만 보임!)

### 4. Terraform 설치

```bash
# Windows (Chocolatey)
choco install terraform

# 또는 직접 다운로드
# https://www.terraform.io/downloads
```

## 🚀 시작하기

### 1. 변수 파일 생성

```bash
cd infrastructure/terraform
cp terraform.tfvars.example terraform.tfvars
# terraform.tfvars 파일을 열어서 실제 값 입력
```

### 2. Terraform 초기화

```bash
terraform init
```

### 3. 계획 확인

```bash
terraform plan
```

### 4. 적용

```bash
terraform apply
# 'yes' 입력하여 확인
```

## 🔒 보안 체크리스트

- [ ] IAM 사용자 생성 (루트 계정 사용 금지)
- [ ] Access Key 안전하게 보관
- [ ] terraform.tfvars를 Git에 올리지 않음
- [ ] 보안 그룹 규칙 확인
- [ ] Budget 알림 설정

## 💰 비용 관리

- Budget 알림 설정 완료
- 리소스 태깅으로 비용 추적
- 사용하지 않을 때 서버 중지

## 📚 학습 자료

- [Terraform 공식 문서](https://www.terraform.io/docs)
- [AWS 공식 문서](https://docs.aws.amazon.com/)
- [AWS 프리티어](https://aws.amazon.com/ko/free/)
