#Launch template for EC2 instances
resource "aws_launch_template" "backend_lt" {
  name_prefix = "drawzy-backend-"
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

  exec > /var/log/drawzy-backend-init.log 2>&1
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
     docker login --username AWS --password-stdin ${var.backend_ecr_url}
    if [ $? -ne 0 ]; then
      echo "Docker login failed"
      exit 1
    fi

    #Pull and run your backend docker image
      docker run -d --name drawzy-backend -p 8080:8080 ${var.backend_ecr_url}:latest
  EOF
  )

  lifecycle {
    create_before_destroy = true
  }
}

# Autoscaling group for the backend
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

  target_group_arns = [aws_lb_target_group.backend_tg.arn]

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