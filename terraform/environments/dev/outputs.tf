output "frontend_url" {
  value = "http://${module.ec2_frontend.alb_dns_name}"
}

output "backend_url" {
  description = "Use as VITE_API_URL when building the frontend image"
  value       = "http://${module.ec2_backend.alb_dns_name}"
}

output "database_url" {
  value     = module.rds_mysql.database_url
  sensitive = true
}
