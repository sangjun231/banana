# ECR (Elastic Container Registry) 설정
# ECR은 Docker 이미지를 저장하는 저장소입니다
# GitHub의 Docker Hub와 비슷한 역할

# ECR 리포지토리 생성
resource "aws_ecr_repository" "main" {
  name                 = "${var.project_name}-server"
  image_tag_mutability = "MUTABLE"  # 이미지 태그 수정 가능

  image_scanning_configuration {
    scan_on_push = true  # 이미지 푸시 시 자동 보안 스캔
  }

  tags = {
    Name = "${var.project_name}-ecr"
  }
}

# 이미지 수명 주기 정책 (오래된 이미지 자동 삭제)
# 비용 절감을 위해 오래된 이미지 삭제
# AWS Provider 5.0에서는 별도 리소스로 분리 필요
resource "aws_ecr_lifecycle_policy" "main" {
  repository = aws_ecr_repository.main.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 10 images"
        selection = {
          tagStatus   = "any"
          countType   = "imageCountMoreThan"
          countNumber = 10
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

# ECR 리포지토리 정책 (누가 접근할 수 있는지)
# 기본적으로 생성한 계정만 접근 가능 (보안)

