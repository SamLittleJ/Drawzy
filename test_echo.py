# test_echo.py
import asyncio
import websockets

async def test():
    uri = "ws://127.0.0.1:8080/ws/echo"
    # disable automatic ping/pong
    async with websockets.connect(uri, ping_interval=None, close_timeout=None) as ws:
        greeting = await ws.recv()
        print("Greeting:", greeting)
        
        await asyncio.sleep(1)
        
        message = "Hello from python test"
        await ws.send(message)
        print("Sent:", message)
        
        echo = await ws.recv()
        print("Echo:", echo)
        

asyncio.run(test())