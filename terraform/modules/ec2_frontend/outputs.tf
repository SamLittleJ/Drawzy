output "frontend_alb_dns" {
  description = "DNS name of the frontend load balancer"
  value = aws_lb.frontend_alb.dns_name
}

output "frontend_tg_arn" {
  description = "ARN of the frontend target group"
  value = aws_lb_target_group.frontend_tg.arn
}

output "frontend_load_balancer_dns" {
  description = "DNS of the load balancer"
  value = aws_lb.frontend_alb.dns_name
}