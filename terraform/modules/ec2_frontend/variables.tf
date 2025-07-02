# Variabilă: vpc_id
# • Rol: ID-ul VPC-ului unde se vor lansa instanțele EC2 pentru frontend.
# • Motiv: Permite reutilizarea modulului în VPC-uri diferite fără modificări de cod.
variable "vpc_id" {
  description = "value of vpc id"
  type        = string
}

# Variabilă: subnet_ids
# • Rol: Lista de subrețele în care vor fi distribuite instanțele frontend.
# • Motiv: Asigură redundanță și disponibilitate în zone multiple.
variable "subnet_ids" {
  description = "value of subnet ids"
  type        = list(string)
}

# Variabilă: instance_type
# • Rol: Definește tipul instanței EC2 (e.g., t3.micro).
# • Motiv: Permite ajustarea performanței și costurilor în funcție de cerințe.
# • Implicit: "t3.micro" pentru echilibru între performanță și cost.
variable "instance_type" {
  description = "value of instance type"
  type        = string
  default     = "t3.micro"
}

# Variabilă: key_name
# • Rol: Numele cheii SSH utilizate pentru accesul administrativ la instanțe.
# • Motiv: Separă infrastructura de credențiale și oferă acces securizat.
variable "key_name" {
  description = "value of key name"
  type        = string
}

# Variabilă: desired_capacity
# • Rol: Numărul țintă de instanțe din grupul autoscaling pentru frontend.
# • Motiv: Setează rapid dimensiunea inițială a clusterului.
# • Implicit: 1 instanță.
variable "desired_capacity" {
  description = "value of desired capacity"
  type        = number
  default     = 1
}

# Variabilă: min_size
# • Rol: Numărul minim de instanțe permise în autoscaling group.
# • Motiv: Asigură că nu scazi sub un prag critic de disponibilitate.
# • Implicit: 1 instanță.
variable "min_size" {
  description = "value of min size"
  type        = number
  default     = 1
}

# Variabilă: max_size
# • Rol: Numărul maxim de instanțe permise în autoscaling group.
# • Motiv: Previi costuri neașteptate și suprasolicitare a resurselor.
# • Implicit: 2 instanțe.
variable "max_size" {
  description = "value of max size"
  type        = number
  default     = 2
}

# Variabilă: frontend_ecr_url
# • Rol: URL-ul registrului ECR de unde se va extrage imaginea containerului frontend.
# • Motiv: Permite configurarea dinamică a sursei imaginilor fără hardcodare.
variable "frontend_ecr_url" {
  description = "ECR URL for the frontend image"
  type        = string
}