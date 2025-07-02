# Variabilă: allocated_storage
# • Rol: Definește spațiul de stocare (în GB) alocat instanței RDS.
# • Motiv: Permite ajustarea capacității de stocare în funcție de nevoi.
# • Default: 20 GB, suficient pentru un mediu de test.
variable "allocated_storage" {
  description = "value of allocated storage"
  type        = number
  default     = 20
}

# Variabilă: engine_version
# • Rol: Specifică versiunea MySQL a instanței RDS.
# • Motiv: Asigură compatibilitate cu caracteristici și aplicații existente.
# • Default: "8.0.40", o versiune modernă și suportată.
variable "engine_version" {
  description = "value of engine version"
  type        = string
  default     = "8.0.40"
}

# Variabilă: instance_class
# • Rol: Setează clasa de instanță (hardware) pentru RDS (performanță vs. cost).
# • Motiv: Permite echilibrarea cost/performance; se poate scala vertical.
# • Default: "db.t3.micro" pentru cost redus în medii de dezvoltare/test.
variable "instance_class" {
  description = "value of instance class"
  type        = string
  default     = "db.t3.micro"
}

# Variabilă: db_name
# • Rol: Numele bazei de date inițiale create în RDS.
# • Motiv: Permite configurarea aplicației pentru a se conecta implicit la acest DB.
# • Default: "drawzydb", nume relevant pentru aplicație.
variable "db_name" {
  description = "value of db name"
  type        = string
  default     = "drawzydb"
}

# Variabilă: db_username
# • Rol: Utilizatorul administrativ pentru baza de date.
# • Motiv: Necesită credențiale separate pentru conectare securizată.
# • Default: "admin"; recomand schimbarea într-un mediu de producție.
variable "db_username" {
  description = "value of db username"
  type        = string
  default     = "admin"
}

# Variabilă: db_password
# • Rol: Parola asociată contului administrativ de bază de date.
# • Motiv: Permite stabilirea conexiunii autentificate la RDS.
# • Considerații: În producție, gestionează parola în AWS Secrets Manager.
variable "db_password" {
  description = "value of db password"
  type        = string
  default     = "parola123$%^"
}

# Variabilă: parameter_group_name
# • Rol: Setează grupul de parametri MySQL pentru instanța RDS.
# • Motiv: Permite customizarea comportamentului MySQL (timeout-uri, memorie).
# • Default: "default.mysql8.0", grup implicit AWS.
variable "parameter_group_name" {
  description = "value of parameter group name"
  type        = string
  default     = "default.mysql8.0"
}

# Variabilă: vpc_security_group_ids
# • Rol: Lista de Security Group-uri asociate instanței RDS.
# • Motiv: Controlează accesul la baza de date prin reguli de rețea.
# • Default: SG pentru test; adaptează la SG-uri specifice producției.
variable "vpc_security_group_ids" {
  description = "value of vpc security group ids"
  type        = list(string)
  default     = ["sg-0af475469589a9f2b"]
}

# Variabilă: db_subnet_group_name
# • Rol: Numele grupului de subrețele (subnet group) pentru RDS.
# • Motiv: Asigură lansarea instanței în subrețele private din VPC.
# • Default: "default-vpc-0e996db6d45a33188", grup implicit.
variable "db_subnet_group_name" {
  description = "value of db subnet group name"
  type        = string
  default     = "default-vpc-0e996db6d45a33188"
}

# Variabilă: multi_az
# • Rol: Activează replicarea multi-AZ pentru disponibilitate ridicată.
# • Motiv: Oferă toleranță la erori; crește costul.
# • Default: false pentru medii non-producție.
variable "multi_az" {
  description = "value of multi az"
  type        = bool
  default     = false
}