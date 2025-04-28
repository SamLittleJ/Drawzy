variable "allocated_storage" {
  description = "value of allocated storage"
  type = number
  default = 20
}

variable "engine_version" {
  description = "value of engine version"
  type = string
  default = "8.0.40"
}

variable "instance_class" {
  description = "value of instance class"
  type = string
  default = "db.t3.micro"
}

variable "db_name" {
  description = "value of db name"
  type = string
  default = "drawzydb"
}

variable "db_username" {
  description = "value of db username"
  type = string
  default = "admin"
}

variable "db_password" {
  description = "value of db password"
  type = string
  default = "parola123$%^"
}

variable "parameter_group_name" {
  description = "value of parameter group name"
  type = string
  default = "default.mysql8.0"
}

variable "vpc_security_group_ids" {
  description = "value of vpc security group ids"
  type = list(string)
  default = ["sg-0af475469589a9f2b"]
}

variable "db_subnet_group_name" {
  description = "value of db subnet group name"
  type = string
  default = "default-vpc-0e996db6d45a33188"
}

variable "multi_az" {
  description = "value of multi az"
  type = bool
  default = false
}