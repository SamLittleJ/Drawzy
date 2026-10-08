output "endpoint" {
  value = aws_db_instance.mysql.endpoint
}

output "database_url" {
  description = "SQLAlchemy connection string for the backend"
  value       = "mysql+pymysql://${var.db_username}:${urlencode(var.db_password)}@${aws_db_instance.mysql.endpoint}/${var.db_name}"
  sensitive   = true
}
