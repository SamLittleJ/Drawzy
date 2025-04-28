module "rds_mysql" {
  source = "../../modules/rds_mysql"

  db_name = "drawzydb"
  db_username = "admin"
  db_password = "parola123$%^"
  vpc_security_group_ids = [ "sg-0af475469589a9f2b" ]
  db_subnet_group_name = "default-vpc-0e996db6d45a33188"
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
  frontend_ecr_url = aws_ecr_repository.frontend.repository_url
}

output "load_balancer_dns" {
  description = "DNS of the load balancer"
  value = module.ec2_backend.alb_dns_name
}
