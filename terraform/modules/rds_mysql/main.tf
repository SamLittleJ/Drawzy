resource "aws_db_instance" "mysql" {
  allocated_storage = var.allocated_storage
  engine = "mysql"
  engine_version = var.engine_version
  instance_class = var.instance_class
  db_name = var.db_name
  username = var.db_username
  password = var.db_password
  parameter_group_name = var.parameter_group_name
  skip_final_snapshot = true

  vpc_security_group_ids = var.vpc_security_group_ids
  db_subnet_group_name = var.db_subnet_group_name

  publicly_accessible = true
  multi_az = var.multi_az

  tags = {
    Name = "drawzydb"
  }
}

output "db_instance_endpoint"{ 
  value = aws_db_instance.mysql.endpoint
  }