# EC2 인스턴스 설정
# t3.micro 프리티어로 NestJS WebSocket 서버 운영

# 최신 Amazon Linux 2023 AMI 자동 조회
data "aws_ami" "amazon_linux_2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  filter {
    name   = "root-device-type"
    values = ["ebs"]
  }
}

# EC2 인스턴스
resource "aws_instance" "main" {
  ami                         = data.aws_ami.amazon_linux_2023.id
  instance_type               = var.ec2_instance_type
  subnet_id                   = aws_subnet.public[0].id
  vpc_security_group_ids      = [aws_security_group.ec2.id]
  key_name                    = var.ec2_key_name
  associate_public_ip_address = true

  # 루트 볼륨 (프리티어: 30GB까지 무료)
  root_block_device {
    volume_size           = 8
    volume_type           = "gp3"
    delete_on_termination = true
    encrypted             = true

    tags = {
      Name = "${var.project_name}-ec2-root-volume"
    }
  }

  # 사용자 데이터 (인스턴스 시작 시 실행)
  user_data = base64encode(<<-EOF
    #!/bin/bash
    # 시스템 업데이트
    dnf update -y
    
    # Node.js 20 설치
    dnf install -y nodejs npm git
    
    # PM2 설치 (프로세스 매니저)
    npm install -g pm2
    
    # 애플리케이션 디렉토리 생성
    mkdir -p /home/ec2-user/app
    chown ec2-user:ec2-user /home/ec2-user/app
    
    # CloudWatch Agent 설치 (선택사항 - 로그 모니터링)
    # dnf install -y amazon-cloudwatch-agent
    
    echo "EC2 초기 설정 완료" > /home/ec2-user/setup-complete.txt
  EOF
  )

  tags = {
    Name = "${var.project_name}-ec2"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Elastic IP (고정 IP 주소)
# EC2 인스턴스에 연결된 상태에서는 프리티어 무료
resource "aws_eip" "main" {
  instance = aws_instance.main.id
  domain   = "vpc"

  tags = {
    Name = "${var.project_name}-eip"
  }

  depends_on = [aws_internet_gateway.main]
}
