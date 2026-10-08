variable "aws_region" {
  type    = string
  default = "eu-central-1"
}

# --- Networking (existing VPC) ---

variable "vpc_id" {
  type = string
}

variable "subnet_ids" {
  description = "Public subnets for the load balancers and instances (at least two AZs)"
  type        = list(string)
}

variable "admin_cidr" {
  description = "CIDR allowed to SSH into the instances, e.g. 203.0.113.10/32"
  type        = string
}

variable "key_name" {
  description = "Name of an existing EC2 key pair"
  type        = string
}

# --- Compute ---

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
  default = 3
}

# --- Database ---

variable "db_subnet_group_name" {
  type = string
}

variable "db_security_group_ids" {
  description = "Security groups attached to the RDS instance; must allow MySQL from the backend instances"
  type        = list(string)
}

variable "db_name" {
  type    = string
  default = "drawzydb"
}

variable "db_username" {
  type    = string
  default = "admin"
}

variable "db_password" {
  description = "Master password for RDS. Pass via TF_VAR_db_password, never commit it."
  type        = string
  sensitive   = true
}

# --- Application ---

variable "secret_key" {
  description = "JWT signing key for the backend. Pass via TF_VAR_secret_key."
  type        = string
  sensitive   = true
}
