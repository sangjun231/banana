# VPC (Virtual Private Cloud) 설정
# VPC는 AWS에서 격리된 네트워크 공간입니다
# 보안을 위해 외부와 격리된 네트워크를 만듭니다

# 1. VPC 생성
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr  # 10.0.0.0/16
  enable_dns_hostnames = true          # DNS 이름 해석 활성화
  enable_dns_support   = true          # DNS 지원 활성화

  tags = {
    Name = "${var.project_name}-vpc"
  }
}

# 2. 인터넷 게이트웨이 (외부 인터넷과 연결)
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.project_name}-igw"
  }
}

# 3. Public Subnet (로드밸런서용 - 외부 접근 가능)
# 가용 영역별로 서브넷 생성 (고가용성)
resource "aws_subnet" "public" {
  count = length(var.availability_zones)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)  # 10.0.0.0/24, 10.0.1.0/24
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true  # Public IP 자동 할당

  tags = {
    Name = "${var.project_name}-public-subnet-${count.index + 1}"
    Type = "public"
  }
}

# 4. Private Subnet (ECS 서버용 - 외부 접근 불가, 보안 강화)
resource "aws_subnet" "private" {
  count = length(var.availability_zones)

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 10)  # 10.0.10.0/24, 10.0.11.0/24
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name = "${var.project_name}-private-subnet-${count.index + 1}"
    Type = "private"
  }
}

# 5. NAT Gateway (Private Subnet에서 외부 접근용)
# Docker 이미지 다운로드 등에 필요
# 비용: 월 ~$32 (프리티어 없음)
# 개발 환경에서는 선택사항 (비용 절감을 위해 주석 처리 가능)
resource "aws_eip" "nat" {
  count = length(var.availability_zones)

  domain = "vpc"
  tags = {
    Name = "${var.project_name}-nat-eip-${count.index + 1}"
  }
}

resource "aws_nat_gateway" "main" {
  count = length(var.availability_zones)

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name = "${var.project_name}-nat-${count.index + 1}"
  }

  depends_on = [aws_internet_gateway.main]
}

# 6. Public Route Table (로드밸런서용)
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"  # 모든 트래픽
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "${var.project_name}-public-rt"
  }
}

# Public Subnet과 Route Table 연결
resource "aws_route_table_association" "public" {
  count = length(var.availability_zones)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# 7. Private Route Table (ECS 서버용)
resource "aws_route_table" "private" {
  count = length(var.availability_zones)

  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = {
    Name = "${var.project_name}-private-rt-${count.index + 1}"
  }
}

# Private Subnet과 Route Table 연결
resource "aws_route_table_association" "private" {
  count = length(var.availability_zones)

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

