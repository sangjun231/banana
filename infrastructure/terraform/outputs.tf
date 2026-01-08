# 출력값 정의
# Terraform 실행 후 필요한 정보를 출력

output "vpc_id" {
  description = "생성된 VPC ID"
  value       = aws_vpc.main.id
}

output "ecs_cluster_name" {
  description = "ECS 클러스터 이름"
  value       = aws_ecs_cluster.main.name
}

output "ecr_repository_url" {
  description = "ECR 리포지토리 URL (Docker 이미지 푸시용)"
  value       = aws_ecr_repository.main.repository_url
}

output "alb_dns_name" {
  description = "로드밸런서 DNS 이름 (서버 접속 URL)"
  value       = aws_lb.main.dns_name
}

output "alb_arn" {
  description = "로드밸런서 ARN"
  value       = aws_lb.main.arn
}

