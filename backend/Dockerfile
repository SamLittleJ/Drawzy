FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# The code is imported as the `backend` package, so it lives in /app/backend.
COPY . /app/backend

RUN useradd --create-home drawzy
USER drawzy

EXPOSE 8080

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8080", "--timeout-keep-alive", "300"]
