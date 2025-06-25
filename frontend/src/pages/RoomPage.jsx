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
        const isSecure = window.location.protocol === 'https:';
        const wsProtocol = isSecure ? 'wss' : 'ws';
        const host = 'drawzy-backend-alb-409373296.eu-central-1.elb.amazonaws.com';
        const wsUrl = `${wsProtocol}://${host}/ws/${code}?token=${token}`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log('WebSocket connection established', wsUrl);
        };
        ws.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            switch (msg.type) {
                case 'DRAW':{
                    const { x0, y0, x1, y1, color, size } = msg.payload;
                    ctx.strokeStyle = color;
                    ctx.lineWidth = size;
                    ctx.beginPath();
                    ctx.moveTo(x0, y0);
                    ctx.lineTo(x1, y1);
                    ctx.stroke();
                    break;
                }
                case 'CHAT':{
                    setMessages(prev => [...prev, msg.payload]);
                    break;
                }
                default:
                    break;
            }
        };
        ws.onerror = (error) => console.error("WebSocket error:", error);
        ws.onclose = (event) => {
            console.log('Websocket connection closed', 'code=', event.code, 'reason=', event.reason);
        }

        return () => {
            ws.close();
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
        if(messageText === '') return;
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            console.log(wsRef.current);
            try{
            wsRef.current.send(JSON.stringify({
                type: 'CHAT',
                payload: {user: 'Me', message: messageText}
            }));} catch(err) {
                console.error("Failde to send WS message:", err)
            }
        } else {
            console.warn('WebSocket is not open. Cannot send message.');
        }
        setChatInput('');
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
