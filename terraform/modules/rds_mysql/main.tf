# Resursă: aws_db_instance.mysql
# • Rol: Creează și configurează o instanță RDS MySQL pentru aplicația Drawzy.
# • Motiv: Oferă o bază de date gestionată, cu backup automat și opțiune multi-AZ pentru disponibilitate.
# • Parametri cheie:
#     - allocated_storage: Spațiul de stocare alocat în GB.
#     - engine_version: Versiunea MySQL pentru compatibilitate.
#     - instance_class: Tipul instanței (performanță vs. cost).
#     - multi_az: Selectează replicare multi-AZ pentru toleranță la erori.
# • Securitate:
#     - vpc_security_group_ids: Listează SG-urile care permit traficul autorizat către baza de date.
#     - db_subnet_group_name: Specifică grupul de subrețele din VPC pentru RDS.
#     - publicly_accessible: Controlează dacă instanța este accesibilă public (în prezent true pentru testare).
# • Alternative: Poți folosi Aurora MySQL pentru scalare și performanță superioară.
# • Limitări: skip_final_snapshot = true va omite crearea unui snapshot final la distrugere, ceea ce poate duce la pierderea datelor.
resource "aws_db_instance" "mysql" {
  allocated_storage = var.allocated_storage
  engine            = "mysql"
  engine_version    = var.engine_version
  instance_class    = var.instance_class
  db_name           = var.db_name
  username          = var.db_username
  password          = var.db_password
  parameter_group_name = var.parameter_group_name
  skip_final_snapshot  = true

  vpc_security_group_ids = var.vpc_security_group_ids
  db_subnet_group_name   = var.db_subnet_group_name

  publicly_accessible = true
  multi_az           = var.multi_az

  tags = {
    Name = "drawzydb"
  }
}