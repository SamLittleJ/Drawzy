# • Rol: Expune adresa DNS a Application Load Balancer-ului.
# • Motiv: Permite altor module sau aplicații să obțină punctul final LB pentru a-l folosi în configurări sau pentru traficul HTTP.
# • Alternative: Utilizarea directă a ARN-ului și rezolvarea DNS-ului printr-un script extern (mai puțin comod și întreținut).
output "backend_alb_dns" {
  description = "The dns name of the backend load balancer"
    value = aws_lb.backend_alb.dns_name
}

# • Rol: Expune ARN-ul grupului țintă (target group) asociat ALB-ului.
# • Motiv: Necesită referință în alte module Terraform care trebuie să adauge instanțe sau resurse în același target group.
# • Alternative: Hardcodarea ARN-ului (susceptibilă la erori când grupul țintă se recreează).
output "backend_tg_arn" {
  description = "The ARN of the backend target group"
  value = aws_lb_target_group.backend_tg.arn
}

# • Rol: Expune încă o dată adresa DNS a Load Balancer-ului, cu un alias semantic diferit.
# • Motiv: Poate fi folosită pentru a distinge între endpoint-urile frontend și backend în configurații.
# • Observație: Valoarea duplicată cu `backend_alb_dns`; poți păstra doar unul dacă nu ai nevoie de două denumiri alternative.
output "backend_load_balancer_dns" {
  description = "DNS of the load balancer"
  value = aws_lb.backend_alb.dns_name
}
