# Imagine de bază Python slim
# • Rol: Oferă o imagine minimă cu Python 3.13, redusă în dimensiune.
FROM python:3.13-slim

# Dezactivează generarea fișierelor .pyc
# • Rol: Evită scrierea fișierelor bytecode pentru a menține containerul curat.
ENV PYTHONDONTWRITEBYTECODE=1

# Dezactivează buffering-ul output-ului Python
# • Rol: Asigură afișarea imediată a log-urilor în terminal.
ENV PYTHONUNBUFFERED=1

# Setează directorul de lucru
# • Rol: Toate comenzile ulterioare se execută din /app.
WORKDIR /app

# Copiază fișierul de dependențe
# • Rol: Mută requirements.txt în container pentru instalarea pachetelor.
COPY requirements.txt .

# Instalează dependențele Python
# • Rol: Actualizează pip și instalează pachetele necesare (Uvicorn, WebSocket etc.).
RUN pip install --upgrade pip && \
    pip install "uvicorn[standard]" websockets wsproto && \
    pip install -r requirements.txt

# Copiază codul aplicației
# • Rol: Adaugă folderul backend în container la /app/backend.
COPY . /app/backend

# Expune portul aplicației
# • Rol: Deschide portul 8080 pentru trafic HTTP și WebSocket.
EXPOSE 8080

# Comandă implicită la start
# • Rol: Rulează serverul Uvicorn pe 0.0.0.0:8080 cu suport WebSocket și timeout prelungit.
CMD ["uvicorn", "backend.main:app", "--app-dir", "/app", "--host", "0.0.0.0", "--port", "8080", "--ws-per-message-deflate", "false", "--timeout-keep-alive", "300"]