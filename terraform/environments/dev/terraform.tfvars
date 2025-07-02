# Variabilă: vpc_id
# • Rol: ID-ul VPC în care vor fi lansate instanțele EC2.
# • Motiv: Permite utilizarea aceluiași modul în VPC-uri diferite.
vpc_id = "vpc-0e996db6d45a33188"

# Variabilă: subnet_ids
# • Rol: Lista de subrețele pentru distribuirea instanțelor în AZ-uri multiple.
# • Motiv: Asigură redundanță și disponibilitate ridicată.
subnet_ids = ["subnet-08c6209d4e59c4414", "subnet-0dba26c2fec825c4e", "subnet-0bff2dae40f83600f"]

# Variabilă: instance_type
# • Rol: Specifică tipul instanței EC2 (performanță vs. cost).
# • Motiv: Permite ajustarea resurselor compute după necesități.
instance_type = "t3.micro"

# Variabilă: key_name
# • Rol: Cheia SSH folosită pentru accesul administrativ la instanțe.
# • Motiv: Asigură acces securizat și separat de infrastructură.
key_name = "drawzy-key"

# Variabilă: desired_capacity
# • Rol: Numărul țintă de instanțe în grupul autoscaling.
# • Motiv: Definește dimensiunea inițială a clusterului.
desired_capacity = 1

# Variabilă: min_size
# • Rol: Numărul minim de instanțe în grupul autoscaling.
# • Motiv: Asigură un prag minim de disponibilitate.
min_size = 1

# Variabilă: max_size
# • Rol: Numărul maxim de instanțe în grupul autoscaling.
# • Motiv: Previi costuri neașteptate prin limitarea scalării.
max_size = 3

# Variabilă: db_name
# • Rol: Numele bazei de date inițiale create în RDS.
# • Motiv: Configurare clară a numelui bazei pentru aplicație.
db_name = "drawzydb"

# Variabilă: db_username
# • Rol: Utilizatorul administrativ pentru baza de date.
# • Motiv: Permite autentificarea aplicației la RDS.
db_username = "admin"

# Variabilă: db_password
# • Rol: Parola asociată contului de administrare a bazei de date.
# • Motiv: Asigură autentificarea securizată a aplicației.
# • Observație: În producție, gestionează parola prin AWS Secrets Manager.
db_password = "parola123$%^"