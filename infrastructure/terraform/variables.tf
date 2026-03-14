# 변수 정의 - EC2 버전
# EC2 단독 배포에 필요한 변수들

# ============================================================
# 공통 설정
# ============================================================

variable "aws_region" {
  description = "AWS 리전"
  type        = string
  default     = "ap-northeast-2"
}

variable "environment" {
  description = "환경 이름 (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "project_name" {
  description = "프로젝트 이름"
  type        = string
  default     = "websocket-chat"
}

# ============================================================
# VPC 설정
# ============================================================

variable "vpc_cidr" {
  description = "VPC CIDR 블록"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "가용 영역"
  type        = list(string)
  default     = ["ap-northeast-2a", "ap-northeast-2c"]
}

# ============================================================
# EC2 설정
# ============================================================

variable "ec2_instance_type" {
  description = "EC2 인스턴스 타입"
  type        = string
  default     = "t3.micro"
}

variable "ec2_key_name" {
  description = "EC2 SSH 키 페어 이름"
  type        = string
}

variable "ssh_allowed_cidr" {
  description = "SSH 접속 허용 CIDR"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

# ============================================================
# 비용 관리
# ============================================================

variable "monthly_budget_limit" {
  description = "월 예산 한도 (USD)"
  type        = number
  default     = 50
}

variable "budget_alert_email" {
  description = "비용 알림 이메일"
  type        = string
}
