# Terraform 출력값 - EC2 버전
# terraform apply 완료 후 필요한 정보 출력

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "ec2_instance_id" {
  description = "EC2 인스턴스 ID"
  value       = aws_instance.main.id
}

output "ec2_public_ip" {
  description = "EC2 퍼블릭 IP (Elastic IP)"
  value       = aws_eip.main.public_ip
}

output "backend_url" {
  description = "백엔드 서버 URL"
  value       = "http://${aws_eip.main.public_ip}:3001"
}

output "websocket_url" {
  description = "WebSocket 연결 URL"
  value       = "ws://${aws_eip.main.public_ip}:3001"
}

output "ssh_command" {
  description = "SSH 접속 명령어"
  value       = "ssh -i ~/.ssh/${var.ec2_key_name}.pem ec2-user@${aws_eip.main.public_ip}"
}
