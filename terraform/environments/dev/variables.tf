# Variabilă: vpc_id
# • Rol: ID-ul VPC-ului folosit pentru lansarea instanțelor EC2.
# • Motiv: Permite reutilizarea modulului în VPC-uri diferite prin simpla schimbare a valorii.
variable "vpc_id" {
    default = "vpc-0e996db6d45a33188"
}

# Variabilă: subnet_ids
# • Rol: Lista de subrețele pentru distribuirea instanțelor în multiple Availability Zones.
# • Motiv: Asigură redundanță și disponibilitate a serviciilor.
variable "subnet_ids" {
    default = ["subnet-08c6209d4e59c4414", "subnet-0dba26c2fec825c4e", "subnet-0bff2dae40f83600f"]
}

# Variabilă: db_subnet_group_name
# • Rol: Numele grupului de subrețele pentru RDS în VPC.
# • Motiv: Permite RDS să fie în subrețele private securizate.
variable "db_subnet_group_name" {
  default = "default-vpc-0e996db6d45a33188"
}

# Variabilă: instance_type
# • Rol: Specifică tipul de instanță EC2 pentru backend/frontend.
# • Motiv: Permite ajustarea puterii de procesare și a costurilor.
variable "instance_type" {
  default = "t3.micro"
}

# Variabilă: key_name
# • Rol: Numele cheii SSH utilizate pentru accesul administrativ.
# • Motiv: Asigură acces securizat la instanțele EC2.
variable "key_name" {
  default = "drawzy-key"
}

# Variabilă: desired_capacity
# • Rol: Numărul țintă de instanțe în Auto Scaling Group.
# • Motiv: Definește dimensiunea inițială a clusterului.
variable "desired_capacity" {
  default = 1
}

# Variabilă: min_size
# • Rol: Numărul minim de instanțe permise în Auto Scaling Group.
# • Motiv: Asigură un prag minim de disponibilitate.
variable "min_size" {
  default = 1
}

# Variabilă: max_size
# • Rol: Numărul maxim de instanțe permise în Auto Scaling Group.
# • Motiv: Previi costuri neașteptate prin limitarea scalării.
variable "max_size" {
  default = 3
}

# Variabilă: db_name
# • Rol: Numele bazei de date inițiale create în RDS.
# • Motiv: Permite aplicației să se conecteze direct la baza de date specificată.
variable "db_name" {
  default = "drawzydb"
}

# Variabilă: db_username
# • Rol: Utilizatorul administrativ pentru baza de date RDS.
# • Motiv: Folosit pentru autentificarea aplicației la baza de date.
variable "db_username" {
  default = "admin"
}

# Variabilă: db_password
# • Rol: Parola contului administrativ de conectare la RDS.
# • Motiv: Permite acces securizat la baza de date.
# • Observație: Pentru producție, gestionează parola prin AWS Secrets Manager.
variable "db_password" {
  default = "parola123$%^"
}

# Variabilă: security_group_ids
# • Rol: Listează ID-urile Security Group-urilor asociate instanțelor EC2.
# • Motiv: Controlează regulile de acces (SSH, HTTP).
variable "security_group_ids" {
  default = ["sg-0af475469589a9f2b"]
}

# Variabilă: certificate_arn
# • Rol: ARN-ul certificatului ACM folosit de ALB pentru HTTPS.
# • Motiv: Permite terminarea TLS la nivel de Load Balancer.
variable "certificate_arn" {
  default = "arn:aws:acm:eu-central-1:980921758343:certificate/b7315d04-fb22-489c-9e2b-a5a34ffc3ef3"
}