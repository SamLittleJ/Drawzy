# Configurație Terraform
# • Rol: Definește versiunile și sursele furnizorilor necesari.
# • Motiv: Asigură utilizarea versiunilor compatibile ale provider-ului AWS.
# • Alternative: Specificarea versiunilor în fișiere separate sau lockfile-uri.
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Provider AWS
# • Rol: Configurează autentificarea și regiunea pentru resursele AWS.
# • Motiv: Permite Terraform să interacționeze cu contul și regiunea corectă.
# • Alternative: Utilizarea variabilelor de mediu AWS_PROFILE și AWS_REGION.
# • Observații: Folosește fișierul local de credențiale pentru autentificare.
provider "aws" {
  region                   = "eu-central-1"
  shared_credentials_files = ["/Users/sam_little_j/Drawzy/.aws/credentials"]
}