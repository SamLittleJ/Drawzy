import asyncio
import websockets

async def test():
    uri = "ws://127.0.0.1:8080/ws/testroom"
    async with websockets.connect(uri, ping_interval=None) as ws:
        await ws.send("Hello from client")
        resp = await ws.recv()
        print("Got back:", resp)

if __name__ == "__main__":
    asyncio.run(test())