variable "vpc_id" {
  description = "value of vpc id"
  type = string
}

variable "subnet_ids" {
  description = "value of subnet ids"
  type = list(string)
}

variable "instance_type" {
  description = "value of instance type"
  type = string
  default = "t3.micro"
}

variable "key_name" {
  description = "value of key name"
  type = string
}

variable "desired_capacity" {
  description = "value of desired capacity"
  type = number
  default = 1
}

variable "min_size" {
  description = "value of min size"
  type = number
  default = 1
}

variable "max_size" {
  description = "value of max size"
  type = number
  default = 2
}


variable "backend_ecr_url" {
  description = "ECR URL for the backend image"
  type = string
}

variable "frontend_ecr_url" {
  description = "ECR URL for the frontend image"
  type = string
}