# Budget 및 비용 관리 설정
# AWS 비용을 모니터링하고 알림을 받습니다

# 1. Budget 알림
resource "aws_budgets_budget" "main" {
  name              = "${var.project_name}-monthly-budget"
  budget_type       = "COST"
  limit_amount      = var.monthly_budget_limit
  limit_unit        = "USD"
  time_period_start = "2024-01-01_00:00"
  time_unit         = "MONTHLY"

  # 80% 초과 시 알림
  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 80
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = [var.budget_alert_email]
  }

  # 100% 초과 시 알림
  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = [var.budget_alert_email]
  }

  # 50% 도달 시 알림 (선택사항)
  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 50
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = [var.budget_alert_email]
  }
}

# 참고: 자동 중단 기능은 Lambda 함수로 구현 가능
# 비용 초과 시 ECS 서비스를 자동으로 중지하는 함수
# 필요시 추가 구현 가능

