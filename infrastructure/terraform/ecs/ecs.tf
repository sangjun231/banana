# ECS (Elastic Container Service) 설정
# ECS는 Docker 컨테이너를 실행하는 서비스입니다

# 1. CloudWatch Log Group (로그 저장소)
resource "aws_cloudwatch_log_group" "ecs" {
  name              = "/ecs/${var.project_name}"
  retention_in_days = 7  # 7일 후 자동 삭제 (비용 절감)

  tags = {
    Name = "${var.project_name}-ecs-logs"
  }
}

# 2. ECS 클러스터 생성
resource "aws_ecs_cluster" "main" {
  name = "${var.project_name}-cluster"

  # 컨테이너 인사이트 활성화 (모니터링)
  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name = "${var.project_name}-cluster"
  }
}

# 3. ECS Task Definition (컨테이너 실행 정의)
resource "aws_ecs_task_definition" "main" {
  family                   = "${var.project_name}-task"
  network_mode             = "awsvpc"  # VPC 네트워크 모드
  requires_compatibilities = ["FARGATE"]  # Fargate 사용 (서버 관리 불필요)
  cpu                      = var.ecs_task_cpu
  memory                   = var.ecs_task_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name  = "${var.project_name}-container"
      image = "${aws_ecr_repository.main.repository_url}:latest"

      portMappings = [
        {
          containerPort = 3001  # NestJS 서버 포트
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "NODE_ENV"
          value = var.environment
        },
        {
          name  = "PORT"
          value = "3001"
        }
        # 나중에 Secrets Manager로 민감한 정보 관리
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.ecs.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }

      # 헬스 체크 (컨테이너가 정상 작동하는지 확인)
      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:3001/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])

  tags = {
    Name = "${var.project_name}-task"
  }
}

# 4. ECS Service (실제로 컨테이너를 실행하는 서비스)
resource "aws_ecs_service" "main" {
  name            = "${var.project_name}-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.main.arn
  desired_count   = var.ecs_desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private[*].id  # Private Subnet 사용 (보안)
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = false  # Public IP 없음 (보안 강화)
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.main.arn
    container_name   = "${var.project_name}-container"
    container_port   = 3001
  }

  # 서비스가 중단되어도 자동으로 재시작
  # AWS Provider 5.0에서는 deployment_configuration 블록이 지원되지 않음
  # 대신 기본값 사용 (maximum_percent: 200, minimum_healthy_percent: 100)
  # 필요시 aws_ecs_service 리소스의 deployment_configuration 속성 사용

  # ALB가 정상일 때만 서비스 시작
  depends_on = [aws_lb_listener.main, aws_lb_target_group.main]

  tags = {
    Name = "${var.project_name}-service"
  }
}

