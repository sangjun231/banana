# 보안 그룹 (Security Group) 설정
# 보안 그룹은 가상 방화벽입니다
# 어떤 포트를 열고 닫을지 정의합니다

# 1. ALB (로드밸런서) 보안 그룹
# 외부에서 접근 가능하지만 HTTPS만 허용
resource "aws_security_group" "alb" {
  name        = "${var.project_name}-alb-sg"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.main.id

  # 인바운드 규칙 (들어오는 트래픽)
  
  # HTTPS (443) - 외부에서 접근 가능
  ingress {
    description = "HTTPS from Internet"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  # 모든 IP에서 접근 가능 (나중에 제한 가능)
  }

  # HTTP (80) - HTTPS로 리다이렉트용 (선택사항)
  # 개발 환경에서는 HTTP도 허용 가능
  ingress {
    description = "HTTP from Internet (redirect to HTTPS)"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # 아웃바운드 규칙 (나가는 트래픽)
  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"  # 모든 프로토콜
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-alb-sg"
  }
}

# 2. ECS (서버) 보안 그룹
# ALB에서만 접근 가능 (외부 직접 접근 불가)
resource "aws_security_group" "ecs" {
  name        = "${var.project_name}-ecs-sg"
  description = "Security group for ECS tasks"
  vpc_id      = aws_vpc.main.id

  # 인바운드 규칙
  
  # ALB에서만 접근 가능 (포트 3001 - NestJS 서버)
  ingress {
    description     = "Allow traffic from ALB"
    from_port       = 3001
    to_port         = 3001
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]  # ALB 보안 그룹만 허용
  }

  # 아웃바운드 규칙
  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-ecs-sg"
  }
}

# 3. Rate Limiting을 위한 추가 보안 (선택사항)
# AWS WAF (Web Application Firewall) 사용 가능
# 비용이 추가되므로 초기에는 생략 가능

