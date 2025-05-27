output "db_instance_endpoint"{ 
  value = aws_db_instance.mysql.endpoint
  }

output "DATABASE_URL" {
  value = "mysql+pymysql://${var.db_username}:${var.db_password}@${aws_db_instance.mysql.endpoint}/${var.db_name}"
  description = "The database connection string"
}