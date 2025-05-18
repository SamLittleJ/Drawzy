variable "vpc_id" {
    default = "vpc-0e996db6d45a33188"
}

variable "subnet_ids" {
    default = ["subnet-08c6209d4e59c4414", "subnet-0dba26c2fec825c4e", "subnet-0bff2dae40f83600f"]
}

variable "db_subnet_group_name" {
  default = "default-vpc-0e996db6d45a33188"
}

variable "instance_type" {
  default = "t3.micro"
}

variable "key_name" {
  default = "drawzy-key"
}

variable "desired_capacity" {
  default = 1
}

variable "min_size" {
  default = 1
}

variable "max_size" {
  default = 3
}

variable "db_name" {
  default = "drawzydb"
}

variable "db_username" {
  default = "admin"
}

variable "db_password" {
  default = "parola123$%^"
}

variable "security_group_ids" {
  default = ["sg-0af475469589a9f2b"]
}