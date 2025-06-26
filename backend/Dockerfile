#Using a slim image of python
FROM python:3.13.slim

#Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

#Set the working directory in the container
WORKDIR /app

# Copy the requirements file and install dependencies
COPY requirements.txt .
RUN pip install --upgrade pip && \
pip install "uvicorn[standard]" websockets wsproto && \
pip install -r requirements.txt

# Copy the entire backend folder into the container
COPY .  /app/backend

#Expose the port 8000 (the port uvicorn runs on)
EXPOSE 8080

#Run the FastAPI application with uvicorn
CMD ["uvicorn", "backend.main:app", "--app-dir", "/app", "--host", "0.0.0.0", "--port", "8080"]