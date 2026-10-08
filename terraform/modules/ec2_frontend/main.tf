# React frontend served by nginx: an auto-scaling group of Docker hosts behind an Application Load Balancer.

data "aws_ami" "amazon_linux_2" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*x86_64-ebs"]
  }
}

resource "aws_launch_template" "frontend_lt" {
  name_prefix            = "drawzy-frontend-"
  image_id               = data.aws_ami.amazon_linux_2.id
  instance_type          = var.instance_type
  key_name               = var.key_name
  vpc_security_group_ids = [aws_security_group.ec2_sg_frontend.id]

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_instance_profile.name
  }

  user_data = base64encode(<<-EOF
    #!/bin/bash
    exec > /var/log/drawzy-frontend-init.log 2>&1
    set -euxo pipefail

    if ! command -v docker > /dev/null; then
      yum update -y
      amazon-linux-extras install docker -y
      service docker start
      usermod -a -G docker ec2-user
    fi
    until docker info > /dev/null; do sleep 3; done

    aws ecr get-login-password --region ${var.aws_region} \
      | docker login --username AWS --password-stdin ${var.frontend_ecr_url}
    docker run -d --name drawzy-frontend --restart unless-stopped -p 80:80 \
      ${var.frontend_ecr_url}:latest
  EOF
  )

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_autoscaling_group" "frontend_asg" {
  name_prefix         = "drawzy-frontend-asg-"
  desired_capacity    = var.desired_capacity
  min_size            = var.min_size
  max_size            = var.max_size
  vpc_zone_identifier = var.subnet_ids
  target_group_arns   = [aws_lb_target_group.frontend_tg.arn]

  launch_template {
    id      = aws_launch_template.frontend_lt.id
    version = "$Latest"
  }

  instance_refresh {
    strategy = "Rolling"
    preferences {
      min_healthy_percentage = 90
    }
  }

  tag {
    key                 = "Name"
    value               = "drawzy-frontend-instance"
    propagate_at_launch = true
  }
}

resource "aws_lb" "frontend_alb" {
  name               = "drawzy-frontend-alb"
  load_balancer_type = "application"
  internal           = false
  security_groups    = [aws_security_group.alb_sg_frontend.id]
  subnets            = var.subnet_ids
}

resource "aws_lb_target_group" "frontend_tg" {
  name     = "drawzy-frontend-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = var.vpc_id

  health_check {
    path                = "/"
    protocol            = "HTTP"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 3
    unhealthy_threshold = 3
  }
}

resource "aws_lb_listener" "frontend_listener" {
  load_balancer_arn = aws_lb.frontend_alb.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.frontend_tg.arn
  }
}

# --- IAM: let instances pull images from ECR ---

resource "aws_iam_role" "ec2_role" {
  name = "drawzy-ec2-instance-role-frontend"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ec2_ecr" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}

resource "aws_iam_instance_profile" "ec2_instance_profile" {
  name = "drawzy-ec2-instance-profile-frontend"
  role = aws_iam_role.ec2_role.name
}

# --- Security groups: internet -> ALB -> instances ---

resource "aws_security_group" "alb_sg_frontend" {
  name        = "drawzy-frontend-alb-sg"
  description = "Public HTTP access to the frontend load balancer"
  vpc_id      = var.vpc_id

  ingress {
    description = "HTTP from anywhere"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "ec2_sg_frontend" {
  name        = "drawzy-frontend-ec2-sg"
  description = "Frontend instances: HTTP from the ALB, SSH from the admin network"
  vpc_id      = var.vpc_id

  ingress {
    description     = "HTTP from the load balancer"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg_frontend.id]
  }

  ingress {
    description = "SSH from the admin network"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.admin_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
