# 출력값 정의 - ECS 버전
# 이 파일은 ECS 전환 시 루트의 outputs.tf를 대체합니다

output "vpc_id" {
  description = "생성된 VPC ID"
  value       = aws_vpc.main.id
}

output "deploy_mode" {
  description = "현재 배포 모드"
  value       = var.deploy_mode
}

output "ecs_cluster_name" {
  description = "ECS 클러스터 이름"
  value       = aws_ecs_cluster.main.name
}

output "ecs_cluster_arn" {
  description = "ECS 클러스터 ARN"
  value       = aws_ecs_cluster.main.arn
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

output "backend_url" {
  description = "백엔드 서버 URL"
  value       = "http://${aws_lb.main.dns_name}"
}

output "websocket_url" {
  description = "WebSocket 연결 URL (ALB 경유)"
  value       = "ws://${aws_lb.main.dns_name}"
}

# Docker 이미지 푸시 명령어
output "docker_push_commands" {
  description = "ECR에 Docker 이미지 푸시하는 명령어"
  value       = <<-EOF
    # 1. ECR 로그인
    aws ecr get-login-password --region ${var.aws_region} | docker login --username AWS --password-stdin ${aws_ecr_repository.main.repository_url}
    
    # 2. 이미지 빌드
    docker build -t ${var.project_name}-server ./backend
    
    # 3. 태그 지정
    docker tag ${var.project_name}-server:latest ${aws_ecr_repository.main.repository_url}:latest
    
    # 4. 푸시
    docker push ${aws_ecr_repository.main.repository_url}:latest
  EOF
}
