variable "aws_region" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "subnet_ids" {
  type = list(string)
}

variable "key_name" {
  type = string
}

variable "admin_cidr" {
  description = "CIDR allowed to SSH into the instances"
  type        = string
}

variable "instance_type" {
  type    = string
  default = "t3.micro"
}

variable "desired_capacity" {
  type    = number
  default = 1
}

variable "min_size" {
  type    = number
  default = 1
}

variable "max_size" {
  type    = number
  default = 2
}

variable "backend_ecr_url" {
  type = string
}

variable "database_url" {
  type      = string
  sensitive = true
}

variable "secret_key" {
  description = "JWT signing key passed to the backend container"
  type        = string
  sensitive   = true
}
