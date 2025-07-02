# Output: db_instance_endpoint
# • Rol: Expune endpoint-ul DNS al instanței RDS MySQL.
# • Motiv: Permite aplicațiilor să se conecteze la baza de date folosind host-ul RDS.
# • Alternative: Obținerea endpoint-ului direct prin interfața AWS CLI sau SDK.
output "db_instance_endpoint"{ 
  value = aws_db_instance.mysql.endpoint
}

# Output: DATABASE_URL
# • Rol: Concatenează și expune string-ul complet de conexiune MySQL (DSN).
# • Motiv: Simplifică configurarea aplicației, predefinind formatul corect al URL-ului de acces la baza de date.
# • Alternative: Construirea manuală a URL-ului în codul aplicației sau folosirea unui secret manager.
output "DATABASE_URL" {
  value = "mysql+pymysql://${var.db_username}:${var.db_password}@${aws_db_instance.mysql.endpoint}/${var.db_name}"
  description = "The database connection string"
}