# 변수 정의 - ECS 버전
# ECS Fargate + ALB 배포에 필요한 변수들

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
# ECS 설정
# ============================================================

variable "ecs_task_cpu" {
  description = "ECS 태스크 CPU (256 = 0.25 vCPU)"
  type        = number
  default     = 256
}

variable "ecs_task_memory" {
  description = "ECS 태스크 메모리 (512 = 0.5 GB)"
  type        = number
  default     = 512
}

variable "ecs_desired_count" {
  description = "실행할 ECS 태스크 개수"
  type        = number
  default     = 1
}

# ============================================================
# 비용 관리
# ============================================================

variable "monthly_budget_limit" {
  description = "월 예산 한도 (USD)"
  type        = number
  default     = 100
}

variable "budget_alert_email" {
  description = "비용 알림 이메일"
  type        = string
}
