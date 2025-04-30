#Load balancer for the frontend
resource "aws_launch_template" "frontend_lt" {
  name_prefix = "drawzy-frontend-"
  image_id = data.aws_ami.amazon_linux.id   #AMI that includes your backend or docker runtime
  instance_type = var.instance_type
  depends_on = [ aws_iam_instance_profile.ec2_instance_profile ]
  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_instance_profile.name
  }

  key_name = var.key_name

  #Use the EC2 security group created above
  vpc_security_group_ids = [aws_security_group.ec2_sg.id] 

  #User data script to run your backend container
  user_data = base64encode(<<-EOF
  #!/bin/bash

  exec > /var/log/drawzy-frontend-init.log 2>&1
  set -x

  #Install docker
    if ! command -v docker &> /dev/null; then
      sudo yum update -y
      sudo amazon-linux-extras install docker -y
      sudo service docker start
      sudo usermod -a -G docker ec2-user
    fi

    #Wait until docker is running
    while ! docker info > /dev/null; do
      sleep 3
    done

    #Authenticate to ECR
    aws ecr get-login-password --region eu-central-1 | \
     docker login --username AWS --password-stdin ${var.frontend_ecr_url}
     if [ $? -ne 0 ]; then
      echo "Docker login failed"
      exit 1
    fi

    #Pull and run your frontend docker image
      docker run -d --name drawzy-frontend -p 80:80 ${var.frontend_ecr_url}:latest
  EOF
  )

  lifecycle {
    create_before_destroy = true
  }
}

#ASG for the frontend
resource "aws_autoscaling_group" "frontend_asg" {
  name_prefix = "drawzy-frontend-asg-"
  desired_capacity = var.desired_capacity
  min_size = var.min_size
  max_size = var.max_size
  vpc_zone_identifier = var.subnet_ids

  launch_template {
    id = aws_launch_template.frontend_lt.id
    version = "$Latest"
  }
  target_group_arns = [aws_lb_target_group.frontend_tg.arn]

  tag {
    key = "Name"
    value = "drawzy-frontend-instance"
    propagate_at_launch = true
  }

  instance_refresh {
    triggers = ["launch_template"]
    strategy = "Rolling"
    preferences {
      min_healthy_percentage = 90
    }
  }
}

#Load balancer for the frontend
resource "aws_lb" "frontend_alb" {
  name = "drawzy-frontend-alb"
  internal = false
  load_balancer_type = "application"
  security_groups = [aws_security_group.alb_sg_frontend.id]
  subnets = var.subnet_ids
}

# Target group for the frontend
resource "aws_lb_target_group" "frontend_tg" {
  name = "drawzy-frontend-tg"
  port = 80
  protocol = "HTTP"
  vpc_id = var.vpc_id
  
  health_check {
    path = "/"
    protocol = "HTTP"
    port = "traffic-port"
    interval = 30
    timeout = 10
    healthy_threshold = 2
    unhealthy_threshold = 5
    matcher = "200-299"
  }
}

# Alb listener for the frontend
resource "aws_lb_listener" "frontend_listener" {
  load_balancer_arn = aws_lb.frontend_alb.arn
  port = 80
  protocol = "HTTP"

  default_action {
    type = "forward"
    target_group_arn = aws_lb_target_group.frontend_tg.arn
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

# Security group for the EC2 instance:
resource "aws_security_group" "ec2_sg" {
  name = "drawzy-frontend-ec2-sg"
  description = "Allow HTTP and SSH inbound traffic"
  vpc_id = var.vpc_id

  ingress {
    description = "Allow HTTP from ALB"
    from_port = 80
    to_port = 80
    protocol = "tcp"
    security_groups = [aws_security_group.alb_sg_frontend.id]
  }

  ingress {
    description = "Allow SSH"
    from_port = 22
    to_port = 22
    protocol = "tcp"
    cidr_blocks = ["82.77.109.35/32"]
  }

  egress {
    from_port = 0
    to_port = 0
    protocol = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

data "aws_ami" "amazon_linux" {
    most_recent = true
    owners = ["amazon"]

    filter {
        name = "name"
        values = ["amzn2-ami-hvm-*x86_64-ebs"]
    }
}

#New IAM role and instance profile for EC2 with ECR permissions
resource "aws_iam_role" "ec2_role" {
  name = "drawzy-ec2-instance-role-frontend"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
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