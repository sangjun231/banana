# ============================================================
# ECS Fargate + ALB 배포 구성
# ============================================================
#
# 파일 구조:
#   - provider.tf      : AWS 프로바이더
#   - variables.tf     : 변수 정의
#   - vpc.tf           : VPC, 서브넷, NAT Gateway
#   - ecs.tf           : ECS 클러스터, 태스크, 서비스
#   - ecr.tf           : ECR 리포지토리
#   - alb.tf           : Application Load Balancer
#   - iam.tf           : IAM 역할
#   - security.tf      : 보안 그룹
#   - outputs.tf       : 출력값
#   - budgets.tf       : 비용 알림
#
# 예상 월 비용:
#   - ECS Fargate (0.25 vCPU, 512MB): ~$10-15
#   - ALB: ~$18-25
#   - NAT Gateway (2개): ~$70
#   - 합계: ~$100-110/월
#
# ============================================================

