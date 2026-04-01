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

  # 사용자 데이터: nginx 리버스 프록시(3001) + Let's Encrypt(certbot) + 80→443 리다이렉트
  # user_data 변경 시 인스턴스 교체(create_before_destroy)될 수 있음.
  # DNS(A/프록시)가 LE 검증 전에 붙지 않으면 certbot 루프가 끝난 뒤 SSH로 수동 발급 필요(setup-complete.txt 참고).
  user_data = base64encode(templatefile("${path.module}/templates/ec2-user-data.sh.tpl", {
    domain     = var.api_domain
    acme_email = var.acme_email
  }))

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
