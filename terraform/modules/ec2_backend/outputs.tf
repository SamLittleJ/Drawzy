output "backend_alb_dns" {
  description = "The dns name of the backend load balancer"
    value = aws_lb.backend_alb.dns_name
}

output "backend_tg_arn" {
  description = "The ARN of the backend target group"
  value = aws_lb_target_group.backend_tg.arn
}

output "backend_load_balancer_dns" {
  description = "DNS of the load balancer"
  value = aws_lb.backend_alb.dns_name
}
