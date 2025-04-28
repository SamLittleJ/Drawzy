output "alb_dns_name" {
  description = "The dns name of the backend load balancer"
    value = aws_lb.backend_alb.dns_name
}

output "alb_frontend_dns_name" {
  description = "DNS name of the frontend load balancer"
  value = aws_lb.frontend_alb.dns_name
}
