# AWS Provider 설정
# Terraform이 AWS와 통신하기 위한 설정입니다

terraform {
  required_version = ">= 1.0"

  # Terraform 상태를 저장할 위치 (선택사항)
  # 나중에 S3에 저장하도록 변경 가능
  backend "local" {
    # 로컬에 저장 (초기 단계)
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"  # AWS Provider 버전
    }
  }
}

# AWS Provider 설정
provider "aws" {
  region = var.aws_region  # variables.tf에서 정의

  # 기본 태그 (모든 리소스에 자동 적용)
  default_tags {
    tags = {
      Project     = "websocket-chat"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

