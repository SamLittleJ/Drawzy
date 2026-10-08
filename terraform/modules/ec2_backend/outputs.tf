output "alb_dns_name" {
  value = aws_lb.backend_alb.dns_name
}

output "target_group_arn" {
  value = aws_lb_target_group.backend_tg.arn
}

output "instance_security_group_id" {
  description = "Allow this group in the database security group"
  value       = aws_security_group.ec2_sg_backend.id
}
