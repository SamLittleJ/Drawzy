Drawzy

Drawzy este o platformă de jocuri interactive de tip desen colaborativ, construită cu un backend Python serverless pe AWS și o interfață frontend modernă. Proiectul este orchestrată și provisionată cu Terraform pentru a asigura scalabilitate, fiabilitate și deploy rapid.

📝 Cuprins

Caracteristici

Arhitectură

Tehnologii și tool-uri

Instalare și utilizare

Dezvoltare locală

Deploy în AWS

Contribuții

Licență

🎯 Caracteristici

Joc de desen în timp real, multiplayer

Canvas partajat pentru toți jucătorii dintr-o cameră

Sincronizare rapidă prin WebSocket (API Gateway + Lambda)

Salvarea și încărcarea sesiunilor din S3/DynamoDB

Scalare automată și serverless (AWS Lambda)

Deploy și management infrastructură cu Terraform

🏗️ Arhitectură

Frontend: aplicație React (vite, tailwindcss) comunică prin WebSocket cu API Gateway.

API Gateway WebSocket: punct de intrare pentru mesaje desen („draw”, „erase”, „clear”).

AWS Lambda (Python): procesează evenimentele WebSocket, actualizează starea camerei în DynamoDB și publică mesaje către clienți.

DynamoDB: stocare rapidă a stării canvas-ului și managementul sesiunilor.

Amazon S3: backup-uri periodice ale sesiunilor și exporturi de imagini.

Terraform: definirea și deploy-ul resurselor AWS (lambdas, apigateway, dynamodb, s3, iam, etc.).

🛠️ Tehnologii și tool‑uri

Componentă

Tehnologie/Tool

Infrastructură

Terraform

Backend

AWS Lambda (Python)

API

API Gateway WS

Bază de date

DynamoDB

Stocare

Amazon S3

Frontend

React, Vite, Tailwind CSS

Control versiuni

Git & GitHub

🚀 Instalare și utilizare

1. Prerechizite

Terraform >= 1.0

AWS CLI configurat cu un profil cu drepturi suficiente

Node.js >= 16

2. Clonare și configurare

git clone https://github.com/SamLittleJ/Drawzy.git
cd Drawzy

3. Deploy infrastructură

cd infrastructure
terraform init
terraform apply

4. Pornire backend

Lambda-urile sunt serverless și nu necesită pornire locală; însă poți testa handler-ele cu AWS SAM CLI sau un mock local.

5. Pornire frontend

cd frontend
npm install
npm run dev

Accesează http://localhost:3000 pentru a începe un joc.

🔧 Dezvoltare locală

Folosește serverless-websocket-local pentru testare WebSocket local.

Modelează cererile în Postman / Insomnia cu endpoint-urile WebSocket din infrastructure/outputs.tf.

☁️ Deploy în AWS

După testare locală, rulează din nou:

cd infrastructure
terraform plan
terraform apply

Acest proces va actualiza infrastructura și va redeploy Lambda-urile.

🤝 Contribuții

Fork repository

Creează un branch nou (git checkout -b feature/nume-funcționalitate)

Commit modificările (git commit -m 'Add some feature')

Push la branch-ul tău (git push origin feature/nume-funcționalitate)

Deschide un Pull Request

