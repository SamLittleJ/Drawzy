module "rds_mysql" {
  source = "../../modules/rds_mysql"

  db_name = var.db_name
  db_username = var.db_username
  db_password = var.db_password
  vpc_security_group_ids = var.security_group_ids
  db_subnet_group_name = var.db_subnet_group_name
}

output "db_instance_endpoint" {
  value = module.rds_mysql.db_instance_endpoint
}

module "ec2_backend" {
  source = "../../modules/ec2_backend"
  vpc_id = var.vpc_id
  subnet_ids = var.subnet_ids
  key_name = var.key_name
  instance_type = var.instance_type
  desired_capacity = var.desired_capacity
  min_size = var.min_size
  max_size = var.max_size
  backend_ecr_url = aws_ecr_repository.backend.repository_url
}

module "ec2_frontend" {
  source = "../../modules/ec2_frontend"
  vpc_id = var.vpc_id
  subnet_ids = var.subnet_ids
  key_name = var.key_name
  instance_type = var.instance_type
  desired_capacity = var.desired_capacity
  min_size = var.min_size
  max_size = var.max_size
  frontend_ecr_url = aws_ecr_repository.frontend.repository_url
}

output "backend_load_balancer_dns" {
  description = "DNS of the load balancer"
  value = module.ec2_backend.backend_alb_dns
}

output "frontend_load_balancer_dns" {
  description = "DNS of the load balancer"
  value = module.ec2_frontend.frontend_alb_dns
}