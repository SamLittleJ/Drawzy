#Load balancer for the backend
resource "aws_lb" "backend_alb" {
  name = "drawzy-backend-alb"
  internal = false
  load_balancer_type = "application"
  security_groups = [aws_security_group.alb_sg.id]
  subnets = var.subnet_ids
}

#Load balancer for the frontend
resource "aws_lb" "frontend_alb" {
  name = "drawzy-frontend-alb"
  internal = false
  load_balancer_type = "application"
  security_groups = [aws_security_group.alb_sg_frontend.id]
  subnets = var.subnet_ids
}

#Target group for the backend
resource "aws_lb_target_group" "backend_tg" {
  name = "drawzy-backend-tg"
  port = 8080
  protocol = "HTTP"
  vpc_id = var.vpc_id
  
  health_check {
    path = "/health"
    protocol = "HTTP"
    port = "traffic-port"
    interval = 30
    timeout = 10
    healthy_threshold = 2
    unhealthy_threshold = 5
    matcher = "200-299"
  }
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

# Alb listener for the backend
resource "aws_lb_listener" "backend_listener" {
  load_balancer_arn = aws_lb.backend_alb.arn
  port = 8080
  protocol = "HTTP"

  default_action {
    type = "forward"
    target_group_arn = aws_lb_target_group.backend_tg.arn
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