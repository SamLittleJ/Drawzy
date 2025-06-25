# test_ws.py
from websockets import create_connection
import os

TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiZXhwIjoxNzUwODc1NjQ0fQ.pqhsx_Hg_D-Y6kezhH4ZSfwOOVm6kvAo_iaC-2jwoFM"
URL   = f"ws://drawzy-backend-alb-409373296.eu-central-1.elb.amazonaws.com/ws/DS8DBH?token={TOKEN}"

print("Connecting to", URL)
ws = create_connection(URL)
print("Connected!")

# Trimitem un mesaj de chat de test:
msg = '{"type":"CHAT","payload":{"message":"hello from CLI"}}'
print("Sending:", msg)
ws.send(msg)

# Aşteptăm un răspuns de la server
resp = ws.recv()
print("Received back:", resp)

ws.close()
print("Closed")