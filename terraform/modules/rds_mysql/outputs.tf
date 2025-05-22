output "db_instance_endpoint"{ 
  value = aws_db_instance.mysql.endpoint
  }

output "DATABASE_URL" {
  value = "mysql://${var.db_username}:${var.db_password}@${aws_db_instance.mysql.endpoint}:${aws_db_instance.mysql.port}/${var.db_name}"
  description = "The database connection string"
}