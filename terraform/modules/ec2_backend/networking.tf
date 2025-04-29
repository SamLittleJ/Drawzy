# Security group for the backend ALB:
# Allows inbound HTTP traffic on port 8080 from any IPv4 address (0.0.0.0/0)
# and allows all outbound traffic.
resource "aws_security_group" "alb_sg" {
  name = "drawzy-backend-alb-sg"
  description = "Allow HTTP and HTTPS inbound traffic"
  vpc_id = var.vpc_id

  ingress {
    description = "Allow HTTP from anyone"
    from_port = 8080
    to_port = 8080
    protocol = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    description = "Allow all outbound traffic"
    from_port = 0
    to_port = 0
    protocol = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# Security group for the frontend ALB:
# Allows inbound HTTP traffic on port 80 from any IPv4 address (0.0.0.0/0),
# allows SSH access on port 22 from the specified admin IP,
# and allows all outbound traffic.
resource "aws_security_group" "alb_sg_frontend" {
  name = "drawzy-frontend-alb-sg"
  description = "Allow HTTP and HTTPS inbound traffic"
  vpc_id = var.vpc_id

  ingress {
    description = "Allow HTTP from anyone"
    from_port = 80
    to_port = 80
    protocol = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Allow SSH"
    from_port = 22
    to_port = 22
    protocol = "tcp"
    cidr_blocks = ["82.77.109.35/32"]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port = 0
    to_port = 0
    protocol = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# Security group for EC2 instances:
# Allows inbound HTTP traffic on port 8080 from the backend ALB security group,
# allows inbound HTTP traffic on port 80 from the frontend ALB security group,
# allows SSH access on port 22 from the specified admin IP,
# and allows all outbound traffic.
resource "aws_security_group" "ec2_sg" {
  name = "drawzy-backend-ec2-sg"
  description = "Security group for EC2 instances serving backend"
  vpc_id = var.vpc_id

  ingress {
    description = "Allow HTTP from backend ALB"
    from_port = 8080
    to_port = 8080
    protocol = "tcp"
    security_groups = [aws_security_group.alb_sg.id]
  }

  ingress {
    description = "Allow HTTP from frontend ALB"
    from_port = 80
    to_port = 80
    protocol = "tcp"
    security_groups = [aws_security_group.alb_sg_frontend.id]
  }

  ingress {
    description = "Allow SSH from anywhere"
    from_port = 22
    to_port = 22
    protocol = "tcp"
    cidr_blocks = ["82.77.109.35/32"]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port = 0
    to_port = 0
    protocol = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}