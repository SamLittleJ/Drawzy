# • Rol: Identificatorul VPC-ului în care vor fi lansate instanțele EC2.
# • Motiv: Permite reutilizarea modulului în VPC-uri diferite.
variable "vpc_id" {
  description = "value of vpc id"
  type = string
}

# • Rol: Lista de subrețele utilizate pentru distribuirea instanțelor.
# • Motiv: Asigură redundanță și disponibilitate prin lansarea instanțelor în multiple subrețele.
variable "subnet_ids" {
  description = "value of subnet ids"
  type = list(string)
}

# • Rol: Specifică tipul de instanță EC2 (ex. t3.micro).
# • Motiv: Permite adaptarea performanței și costurilor pentru nevoi diferite.
# • Default: "t3.micro" pentru echilibru între cost și performanță.
variable "instance_type" {
  description = "value of instance type"
  type = string
  default = "t3.micro"
}

# • Rol: Cheia SSH folosită pentru accesul administrativ la instanțe.
# • Motiv: Separă codul infrastructurii de credențialele specifice mediului.
variable "key_name" {
  description = "value of key name"
  type = string
}

# • Rol: Numărul țintă de instanțe în grupul autoscaling.
# • Motiv: Permite definirea rapidă a dimensiunii inițiale a clusterului.
# • Default: 1 instanță.
variable "desired_capacity" {
  description = "value of desired capacity"
  type = number
  default = 1
}

# • Rol: Numărul minim de instanțe în grupul autoscaling.
# • Motiv: Asigură că nu coborâ sub un prag critic de capacitate.
# • Default: 1 instanță.
variable "min_size" {
  description = "value of min size"
  type = number
  default = 1
}

# • Rol: Numărul maxim de instanțe acceptate pentru scalare.
# • Motiv: Previi costuri neașteptate și suprasolicitare prin limitare.
# • Default: 2 instanțe.
variable "max_size" {
  description = "value of max size"
  type = number
  default = 2
}

# • Rol: URL-ul registrului ECR pentru imaginea backend.
# • Motiv: Permite configurarea dinamică a locației containerului.
variable "backend_ecr_url" {
  description = "ECR URL for the backend image"
  type = string
}

# • Rol: Lista de ID-uri de Security Group pentru instanțele EC2.
# • Motiv: Definește regulile de acces la backend (SSH, HTTP).
variable "vpc_security_group_ids" {
  description = "Security group IDs for the EC2 instance"
  type = list(string)
}

# • Rol: String-ul de conexiune la baza de date pentru aplicație.
# • Motiv: Separă configurația de mediu de cod.
variable "database_url" {
  description = "Database URL for the backend application"
  type = string
}

# • Rol: ARN-ul certificatului SSL folosit de ALB pentru HTTPS.
# • Motiv: Permite terminarea TLS la nivel de Load Balancer.
variable "certificate_arn" {
  description = "ARN of the SSL certificate for the backend application"
  type = string
}