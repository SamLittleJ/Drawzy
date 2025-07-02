# • Rol: Expune adresa DNS a Application Load Balancer-ului pentru frontend.
# • Motiv: Permite altor module sau servicii să obțină punctul final HTTP al frontend-ului.
# • Alternative: Obținerea DNS-ului prin API-ul AWS sau hardcodarea într-o variabilă externă.
output "frontend_alb_dns" {
  description = "DNS name of the frontend load balancer"
  value = aws_lb.frontend_alb.dns_name
}

# • Rol: Expune ARN-ul grupului țintă (target group) asociat ALB-ului frontend.
# • Motiv: Util pentru referințe Terraform în alte module care trebuie să conecteze resurse la același target group.
# • Alternative: Hardcodarea ARN-ului (mai puțin flexibil și predispus erorilor la schimbări).
output "frontend_tg_arn" {
  description = "ARN of the frontend target group"
  value = aws_lb_target_group.frontend_tg.arn
}

# • Rol: Expune din nou adresa DNS a Load Balancer-ului pentru frontend (alias semantic).
# • Motiv: Oferă consistență și claritate în diferite părți ale configurației Terraform.
# • Observație: Valoarea este identică cu `frontend_alb_dns`; poți elimina unul dacă nu ai nevoie de duplicat.
output "frontend_load_balancer_dns" {
  description = "DNS of the load balancer"
  value = aws_lb.frontend_alb.dns_name
}