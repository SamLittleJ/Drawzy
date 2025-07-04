# Sursa de date: Obține cea mai recentă AMI Amazon Linux 2
# • Rol: Asigură că folosim o imagine actuală și oficială pentru instanțe.
# • Motiv: Evită hardcodarea unui ID de AMI și beneficiază de actualizările Amazon.
# • Alternative: Hardcodarea manuală a unui AMI sau utilizarea unui parametru SSM.
data "aws_ami" "backend" {
    most_recent = true
    owners = ["amazon"]

    filter {
        name = "name"
        values = ["amzn2-ami-hvm-*x86_64-ebs"]
    }
}

# • Rol: Definirea configurației instanțelor EC2 (AMI, tip instanță, rol IAM, user_data).
# • Motiv: Centralizează setările pentru autoscaling și actualizări controlate.
# • Implementare: Script de inițializare care instalează Docker, autentifică la ECR și rulează containerul backend.
# • Alternative: Configurare manuală EC2 sau utilizarea provisioner-elor Terraform (remote-exec).
# • Observație: create_before_destroy previne downtime-ul la actualizarea user_data.
resource "aws_launch_template" "backend_lt" {
  name_prefix = "drawzy-backend-"
  image_id = data.aws_ami.backend.id   #AMI that includes your backend or docker runtime
  instance_type = var.instance_type
  depends_on = [ aws_iam_instance_profile.ec2_instance_profile ]
  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_instance_profile.name
  }

  key_name = var.key_name

  #Use the EC2 security group created above
  vpc_security_group_ids = [
    aws_security_group.ec2_sg_backend.id
  ] 

  #User data script to run your backend container
  user_data = base64encode(<<-EOF
  #!/bin/bash

  exec > /var/log/drawzy-backend-init.log 2>&1
  set -x

  # Write the DATABASE_URL into an .env file for Docker
  echo "DATABASE_URL=${var.database_url}" > /home/ec2-user/.env

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
     docker login --username AWS --password-stdin ${var.backend_ecr_url}
    if [ $? -ne 0 ]; then
      echo "Docker login failed"
      exit 1
    fi

    #Pull and run your backend docker image with restart policy and env-file
    docker run -d --name drawzy-backend \
      --restart unless-stopped \
      --env-file /home/ec2-user/.env \
      -p 80:8080 \
      ${var.backend_ecr_url}:latest
  EOF
  )

  lifecycle {
    create_before_destroy = true
  }
}

# • Rol: Gestionează automat numărul de instanțe în funcție de capacitate.
# • Motiv: Asigură disponibilitate ridicată și scalare automată a backend-ului.
# • Alternative: Utilizarea Spot Fleet sau scalare manuală.
# • Config cheie: Rolling updates cu min_healthy_percentage = 90% pentru a menține uptime.
resource "aws_autoscaling_group" "backend_asg" {
  name_prefix = "drawzy-backend-asg-"
  desired_capacity = var.desired_capacity
  min_size = var.min_size
  max_size = var.max_size
  vpc_zone_identifier = var.subnet_ids

  launch_template {
    id = aws_launch_template.backend_lt.id
    version = "$Latest"
  }

  target_group_arns = [
    aws_lb_target_group.backend_tg.arn,
  ]

  tag {
    key = "Name"
    value = "drawzy-backend-instance"
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

# • Rol: Distribuie traficul HTTP către instanțele sănătoase.
# • Motiv: Oferă punct de intrare stabil, health checks și integrare cu autoscaling.
# • Alternative: Classic Load Balancer sau Network Load Balancer pe TCP.
resource "aws_lb" "backend_alb" {
  name = "drawzy-backend-alb"
  internal = false
  load_balancer_type = "application"
  security_groups = [aws_security_group.alb_sg_backend.id]
  subnets = var.subnet_ids
}

# • Rol: Definește portul și setările health check pentru ALB.
# • Motiv: Redirecționează numai către instanțele sănătoase.
# • Alternative: Sări peste health checks (nu recomandat).
resource "aws_lb_target_group" "backend_tg" {
  name = "drawzy-backend-tg"
  port = 80
  protocol = "HTTP"
  vpc_id = var.vpc_id
  
  health_check {
    path = "/health"
    protocol = "HTTP"
    interval = 30
    timeout = 5
    healthy_threshold = 3
    unhealthy_threshold = 3
  }
}

# • Rol: Ascultă pe portul 80 și forward-ează traficul către target group.
# • Motiv: Configurarea punctului de intrare HTTP pentru ALB.
# • Alternative: Adăugarea unui listener HTTPS cu certificat ACM.
resource "aws_lb_listener" "backend_listener" {
  load_balancer_arn = aws_lb.backend_alb.arn
  port = 80
  protocol = "HTTP"

  default_action {
    type = "forward"
    target_group_arn = aws_lb_target_group.backend_tg.arn
  }
}

# • Rol: Permite instanțelor EC2 să tragă imagini din ECR.
# • Motiv: Necesită autentificare securizată la registry-ul AWS ECR.
# • Alternative: Includerea credențialelor în user_data (mai puțin sigur).
resource "aws_iam_role" "ec2_role" {
  name_prefix = "drawzy-ec2-instance-role-backend"
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
  name = "drawzy-ec2-instance-profile-backend"
  role = aws_iam_role.ec2_role.name
}

# • Rol: Permite trafic HTTP/HTTPS public către ALB.
# • Motiv: Izolează EC2-urile din spate și expune doar ALB-ul.
# • Alternative: Separarea SG-urilor pentru fiecare protocol sau whitelist IP.
resource "aws_security_group" "alb_sg_backend" {
  name_prefix = "drawzy-backend-alb-sg"
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
    description = "Allow HTTPS from anyone"
    from_port = 443
    to_port = 443
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

# • Rol: Permite SSH din rețeaua de administratori și HTTP doar de la ALB.
# • Motiv: Protejează instanțele backend de acces direct neautorizat.
# • Alternative: Deschiderea altor porturi pentru monitorizare sau health checks custom.
resource "aws_security_group" "ec2_sg_backend" {
  name_prefix = "drawzy-backend-ec2-sg"
  description = "Allow HTTP and SSH inbound traffic"
  vpc_id = var.vpc_id

  ingress {
    description = "Allow SSH"
    from_port = 22
    to_port = 22
    protocol = "tcp"
    cidr_blocks = ["82.77.109.74/32"]
  }

  ingress {
    description = "Allow HTTPS from ALB"
    from_port = 443
    to_port = 443
    protocol = "tcp"
    security_groups = [aws_security_group.alb_sg_backend.id]
  }

  ingress {
    description = "Allow HTTP from NLB health checks"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    security_groups = [aws_security_group.alb_sg_backend.id]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port = 0
    to_port = 0
    protocol = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# Output-uri: Expun ID-urile SG și subnet-urilor pentru reutilizare în alte module.
output "backend_alb_sg_id" {
  value = aws_security_group.alb_sg_backend.id
}
output "backend_ec2_sg_id" {
  value = aws_security_group.ec2_sg_backend.id
}
output "subnet_ids" {
  value = var.subnet_ids
}