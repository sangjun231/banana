# EC2 보안 그룹 설정
# WebSocket 서버를 위한 포트 개방

resource "aws_security_group" "ec2" {
  name        = "${var.project_name}-ec2-sg"
  description = "Security group for EC2 WebSocket server"
  vpc_id      = aws_vpc.main.id

  # SSH 접속 (관리용)
  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.ssh_allowed_cidr  # 특정 IP만 허용 권장
  }

  # HTTP (80)
  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTPS (443)
  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # NestJS 서버 포트 (3001)
  ingress {
    description = "NestJS API"
    from_port   = 3001
    to_port     = 3001
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # WebSocket 포트 (Socket.IO는 HTTP/HTTPS와 같은 포트 사용 가능)
  # 별도 포트가 필요한 경우 추가

  # 아웃바운드 (모든 트래픽 허용)
  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-ec2-sg"
  }
}
