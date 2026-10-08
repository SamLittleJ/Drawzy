module "rds_mysql" {
  source = "../../modules/rds_mysql"

  db_name                = var.db_name
  db_username            = var.db_username
  db_password            = var.db_password
  vpc_security_group_ids = var.db_security_group_ids
  db_subnet_group_name   = var.db_subnet_group_name
}

module "ecr" {
  source = "../../modules/ecr"
}

module "ec2_backend" {
  source = "../../modules/ec2_backend"

  aws_region       = var.aws_region
  vpc_id           = var.vpc_id
  subnet_ids       = var.subnet_ids
  key_name         = var.key_name
  admin_cidr       = var.admin_cidr
  instance_type    = var.instance_type
  desired_capacity = var.desired_capacity
  min_size         = var.min_size
  max_size         = var.max_size
  backend_ecr_url  = module.ecr.backend_ecr_url
  database_url     = module.rds_mysql.database_url
  secret_key       = var.secret_key
}

module "ec2_frontend" {
  source = "../../modules/ec2_frontend"

  aws_region       = var.aws_region
  vpc_id           = var.vpc_id
  subnet_ids       = var.subnet_ids
  key_name         = var.key_name
  admin_cidr       = var.admin_cidr
  instance_type    = var.instance_type
  desired_capacity = var.desired_capacity
  min_size         = var.min_size
  max_size         = var.max_size
  frontend_ecr_url = module.ecr.frontend_ecr_url
}
