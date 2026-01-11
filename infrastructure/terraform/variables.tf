# 변수 정의
# 재사용 가능하고 유연한 설정을 위한 변수들

variable "aws_region" {
  description = "AWS 리전 (예: ap-northeast-2 = 서울)"
  type        = string
  default     = "ap-northeast-2"  # 서울 리전
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

# VPC 설정
variable "vpc_cidr" {
  description = "VPC의 IP 주소 범위"
  type        = string
  default     = "10.0.0.0/16"  # 10.0.0.0 ~ 10.0.255.255
}

variable "availability_zones" {
  description = "사용할 가용 영역 (고가용성을 위해 2개 이상)"
  type        = list(string)
  default     = ["ap-northeast-2a", "ap-northeast-2c"]
}

# ECS 설정
variable "ecs_task_cpu" {
  description = "ECS 태스크 CPU (256 = 0.25 vCPU)"
  type        = number
  default     = 256  # 최소 사양 (비용 절감)
}

variable "ecs_task_memory" {
  description = "ECS 태스크 메모리 (512 = 0.5 GB)"
  type        = number
  default     = 512  # 최소 사양 (비용 절감)
}

variable "ecs_desired_count" {
  description = "실행할 ECS 태스크 개수"
  type        = number
  default     = 1  # 개발 환경에서는 1개만
}

# 비용 관리
variable "monthly_budget_limit" {
  description = "월 예산 한도 (USD)"
  type        = number
  default     = 50  # 월 $50 한도
}

variable "budget_alert_email" {
  description = "비용 알림을 받을 이메일"
  type        = string
  # terraform.tfvars에서 설정
}

