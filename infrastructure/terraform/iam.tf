# IAM (Identity and Access Management) 설정
# IAM은 AWS 리소스에 대한 접근 권한을 관리합니다
# 보안 강화를 위해 최소 권한 원칙 적용

# 1. ECS Task Execution Role
# ECS가 Docker 이미지를 가져오고, CloudWatch에 로그를 보내는 역할
resource "aws_iam_role" "ecs_task_execution" {
  name = "${var.project_name}-ecs-task-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-ecs-task-execution-role"
  }
}

# ECS Task Execution Role에 필요한 권한 부여
resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# CloudWatch Logs 권한 (로그 기록용)
resource "aws_iam_role_policy" "ecs_task_execution_logs" {
  name = "${var.project_name}-ecs-task-execution-logs"
  role = aws_iam_role.ecs_task_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

# 2. ECS Task Role
# ECS 태스크 내에서 실행되는 애플리케이션이 사용하는 역할
# 현재는 기본 권한만 (필요시 추가)
resource "aws_iam_role" "ecs_task" {
  name = "${var.project_name}-ecs-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-ecs-task-role"
  }
}

# ECS Task Role에 필요한 권한 추가 (필요시)
# 예: S3 접근, DynamoDB 접근 등
# 현재는 최소 권한만 유지

# 3. Secrets Manager 권한 (환경 변수 보안 저장용)
# 민감한 정보(DB 비밀번호, API 키 등)를 안전하게 저장
resource "aws_iam_role_policy" "ecs_task_execution_secrets" {
  name = "${var.project_name}-ecs-task-execution-secrets"
  role = aws_iam_role.ecs_task_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = "*"  # 나중에 특정 Secret으로 제한 가능
      }
    ]
  })
}

