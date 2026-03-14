# ALB (Application Load Balancer) 설정
# ALB는 외부 요청을 여러 서버에 분산시킵니다
# HTTPS를 처리하고 보안을 강화합니다

# 1. ALB 생성
resource "aws_lb" "main" {
  name               = "${var.project_name}-alb"
  internal           = false  # 외부에서 접근 가능
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id  # Public Subnet 사용

  # 삭제 보호 (실수로 삭제 방지)
  enable_deletion_protection = false  # 개발 환경에서는 false

  tags = {
    Name = "${var.project_name}-alb"
  }
}

# 2. Target Group (ALB가 요청을 보낼 대상)
resource "aws_lb_target_group" "main" {
  name        = "${var.project_name}-tg"
  port        = 3001
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"  # Fargate는 IP 타입

  # 헬스 체크 (서버가 정상인지 확인)
  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/health"  # NestJS health check 엔드포인트
    protocol            = "HTTP"
    matcher             = "200"
  }

  # 연결 끊김 시 대기 시간
  deregistration_delay = 30

  tags = {
    Name = "${var.project_name}-tg"
  }
}

# 3. ALB Listener (HTTP - HTTPS로 리다이렉트)
# HTTPS 인증서가 준비되면 활성화
# resource "aws_lb_listener" "http" {
#   load_balancer_arn = aws_lb.main.arn
#   port              = "80"
#   protocol          = "HTTP"
#
#   default_action {
#     type = "redirect"
#
#     redirect {
#       port        = "443"
#       protocol    = "HTTPS"
#       status_code = "HTTP_301"
#     }
#   }
# }

# 4. ALB Listener (HTTP - 개발 환경용)
# 초기에는 HTTP만 사용 (SSL 인증서 없이 시작)
# 프로덕션에서는 반드시 HTTPS 사용 필요
resource "aws_lb_listener" "main" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }
}

# 참고: HTTPS 설정 (나중에 추가)
# 1. Route 53으로 도메인 구매/연결
# 2. ACM (AWS Certificate Manager)로 인증서 발급
# 3. 아래 코드 활성화
#
# resource "aws_lb_listener" "https" {
#   load_balancer_arn = aws_lb.main.arn
#   port              = "443"
#   protocol          = "HTTPS"
#   ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
#   certificate_arn   = aws_acm_certificate.main.arn
#
#   default_action {
#     type             = "forward"
#     target_group_arn = aws_lb_target_group.main.arn
#   }
# }

# 참고: SSL 인증서는 나중에 추가
# 1. Route 53으로 도메인 구매/연결
# 2. ACM으로 인증서 발급
# 3. ALB Listener에 인증서 연결

