# Modul: rds_mysql
# • Rol: Să creeze și să configureze instanța RDS MySQL pentru mediul dev.
# • Motiv: Separă logica bazei de date într-un modul reutilizabil.
# • Date intrare: db_name, db_username, db_password, SG-urile și subnet group-ul RDS.
module "rds_mysql" {
  source = "../../modules/rds_mysql"

  db_name               = var.db_name
  db_username           = var.db_username
  db_password           = var.db_password
  vpc_security_group_ids = var.security_group_ids
  db_subnet_group_name  = var.db_subnet_group_name
}

# Output: DATABASE_URL
# • Rol: Expune string-ul de conexiune complet la baza de date MySQL creată.
# • Motiv: Ușurează configurarea aplicației pentru a se conecta la RDS.
output "DATABASE_URL" {
  value = module.rds_mysql.DATABASE_URL
}

# Modul: ecr
# • Rol: Creează repository-urile ECR pentru backend și frontend.
# • Motiv: Centralizează gestionarea imaginilor Docker într-un modul dedicat.
module "ecr" {
  source = "../../modules/ecr"
}

# Modul: ec2_backend
# • Rol: Lanțează și scalează instanțele EC2 pentru serviciul backend.
# • Motiv: Modulează infrastructura EC2 și legătura cu ECR, RDS și ALB.
# • Date intrare: VPC, subnete, cheie SSH, ECR URL, SG-urile, DATABASE_URL și certificate ARN.
module "ec2_backend" {
  source                 = "../../modules/ec2_backend"
  vpc_id                 = var.vpc_id
  subnet_ids             = var.subnet_ids
  key_name               = var.key_name
  instance_type          = var.instance_type
  desired_capacity       = var.desired_capacity
  min_size               = var.min_size
  max_size               = var.max_size
  backend_ecr_url        = module.ecr.backend_ecr_url
  vpc_security_group_ids = var.security_group_ids
  database_url           = module.rds_mysql.DATABASE_URL
  certificate_arn        = var.certificate_arn
}

# Modul: ec2_frontend
# • Rol: Lanțează și scalează instanțele EC2 pentru serviciul frontend.
# • Motiv: Separă infrastructura frontend de cea backend și gestionează imaginea din ECR.
# • Date intrare: VPC, subnete, cheie SSH, ECR URL și dimensiuni grupASG.
module "ec2_frontend" {
  source            = "../../modules/ec2_frontend"
  vpc_id            = var.vpc_id
  subnet_ids        = var.subnet_ids
  key_name          = var.key_name
  instance_type     = var.instance_type
  desired_capacity  = var.desired_capacity
  min_size          = var.min_size
  max_size          = var.max_size
  frontend_ecr_url  = module.ecr.frontend_ecr_url
}