import React, { useEffect, useRef, useState } from 'react';  
import { useParams, useNavigate } from 'react-router-dom';
import styles from './RoomPage.module.css';


export default function RoomPage() {
    const { code } = useParams();
    const navigate = useNavigate();
    const canvasRef = useRef(null);
    const [ctx, setCtx] = useState(null);
    const [drawing, setDrawing] = useState(false);
    const [color, setColor] = useState('#000000');
    const [size, setSize] = useState(4);
    const [chatInput, setChatInput] = useState('');
    const [messages, setMessages] = useState([]);
    const wsRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            const context = canvas.getContext('2d');
            context.lineCap = 'round';
            setCtx(context);
        }
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
        const host = 'drawzy-backend-alb-409373296.eu-central-1.elb.amazonaws.com';
        const wsUrl = `${protocol}://${host}/ws/${code}?token=${token}`;
        wsRef.current = new WebSocket(wsUrl);
        wsRef.current.onopen = () => {
            console.log("Websocket connection established:", wsUrl);
        }

        wsRef.current.onmessage = (event) => {
            console.log("WebSocket message received:", event);
            const msg = JSON.parse(event.data);

            if (msg.type === 'CHAT') {
                setMessages(prev => [...prev, { user: msg.payload.user, message: msg.payload.message }]);
            } else if (messages.type === 'DRAW' && ctx) {
                const { x0, y0, x1, y1, color, size } = msg.payload;
                ctx.strokeStyle = color;
                ctx.lineWidth = size;
                ctx.beginPath();
                ctx.moveTo(x0, y0);
                ctx.lineTo(x1, y1);
                ctx.stroke();
            } 
        };

        wsRef.current.onerror = (error) => console.error("Websocket erorr:", error);
        wsRef.current.onclose = (event) => console.log("Websocket closed:", event);
        

        return () => {
            if (wsRef.current) wsRef.current.close();
        };
    }, [code]);

    const handleMouseDown = (e) => {
        setDrawing(true);
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setCtx((context) =>{
            context.beginPath();
            context.moveTo(x, y);
            context.prevX = x;
            context.prevY = y;
            return context;
        });
    };

    const handleMouseMove = (e) => {
        if (!drawing || !ctx) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        ctx.lineTo(x, y);  
        ctx.strokeStyle = color;
        ctx.lineWidth = size;
        ctx.stroke();

        if(wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'DRAW',
                payload: {
                    x0: ctx.prevX,
                    y0: ctx.prevY,
                    x1: x,
                    y1: y,
                    color,
                    size
                }
            }))
        }
        ctx.prevX = x;
        ctx.prevY = y;
        }

    const handleMouseUp = () => {setDrawing(false)};

    const sendMessage = () => {
        const messageText = chatInput.trim();
        if (!messageText) return;
        const ws = wsRef.current;
        console.log("sendMessage called, WS readyState:", ws?.readyState);
        const payload = {
            type: 'CHAT',
            payload: { message: messageText },
        };
        const text = JSON.stringify(payload);
        console.log("Sending WS test frame:", text)
        
        if (ws?.readyState === WebSocket.OPEN) {
            ws.send(text);
            setChatInput('');
        } else {
            console.warn("WebSocket is not open. Cannot send message.");
        }
    };

    const leaveRoom = () => {
        navigate('/lobby');
    };

    return (
        <div className={styles.container}>
            <h1>Room: {code}</h1>
            <button className={styles.leaveButton} onClick={leaveRoom}>
                Leave Room
                </button>
            <div className={styles.canvasContainer}>
                <canvas
                    ref={canvasRef}
                    width={800}
                    height={600}
                    className={styles.canvas}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                />

                <div className={styles.controls}>
                    <label>
                        Color:
                        <input
                            type="color"
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                        />
                    </label>
                    <label>
                        Size:
                        <input
                            type="range"
                            min="1"
                            max="20"
                            value={size}
                            onChange={(e) => setSize(+e.target.value)}
                        />
                    </label>
                </div>
            </div>
            <div className={styles.chatSection}>
                <h2>Chat</h2>
                <div className={styles.messages}>
                    {messages.map((m,i) =>(
                        <div key={i} className={styles.message}>
                            <strong>{m.user}: </strong>
                            {m.message}
                    </div>
                    ))}
                </div>
                <div className={styles.chatInput}>
                    <input
                        type="text"
                        className={styles.input}
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Type your message here"
                    />
                    <button className={styles.button} onClick={sendMessage}>
                        Send
                        </button>
                </div>
            </div>
        </div>
    );
}
