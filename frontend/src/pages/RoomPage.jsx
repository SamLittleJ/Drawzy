import React, {useEffect, useRef, useState} from 'react';  
import { useParams, useNavigate } from 'react-router-dom';
import styles from './RoomPage.module.css';


export default function RoomPage() {
    const {code} = useParams();
    const navigate = useNavigate();
    const canvasRef = useRef(null);
    const [ctx, setCtx] = useState(null);
    const [drawing, setDrawing] = useState(false);
    const [color, setColor] = useState('#000000');
    const [size, setSize] = useState(4);
    const [chatInput, setChatInput] = useState('');
    const [messages, setMessages] = useState([]);
    const wsRef = useRef(null);

    useEffect (() => {
        const canvas = canvasRef.current;
        if (canvas) {
            const context = canvas.getContext('2d');
            context.lineCap = 'round';
            setCtx(context);
        }
    }, []);

    useEffect(() =>{
        const token = localStorage.getItem('access_token');
        const wsUrl = `ws://drawzy-backend-alb-409373296.eu-central-1.elb.amazonaws.com/ws/${code}?token=${token}`; 
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log('WebSocket connection established', wsUrl);
        };
        ws.onmessage = event => {
            const msg = JSON.parse(event.data);
            switch (msg.type) {
                case 'DRAW':
                    const { x0, y0, x1, y1, color, size } = msg.payload;
                    ctx.strokeStyle = color;
                    ctx.lineWidth = size;
                    ctx.beginPath();
                    ctx.moveTo(x0, y0);
                    ctx.lineTo(x1, y1);
                    ctx.stroke();
                    break;
                case 'CHAT':
                    setMessages(prev => [...prev, msg.payload]);
                    break;
                default:
                    break;
            }
        };
        ws.onerror = (error) => console.log("WebSocket error:", error);
        ws.onclose = () => console.log("WebSocket connection closed");

        return () => {
            ws.close();
        };
    }, [ctx, code]);

    const handleMouseDown = (e) => {
        setDrawing(true);
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setCtx(ctx => {
            ctx.beginPath();
            ctx.moveTo(x, y);
            return ctx;
        });
    };

    const handleMouseMove = (e) => {
        if (!drawing) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        if(ctx) {
            ctx.lineTo(x, y);
            ctx.strokeStyle = color;
            ctx.lineWidth = size;
            ctx.stroke();
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({
                    type: 'DRAW',
                    payload: {
                        x0: ctx.prevX || x,
                        y0: ctx.prevY || y,
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
    };

    const handleMouseUp = () => setDrawing(false);

    const sendMessage = () => {
        if(chatInput.trim() === '') return;
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'CHAT',
                payload: {user: 'Me', message: chatInput.trim()}
            }))
        } else {
            console.warn('WebSocket is not open. Cannot send message.');
        }
        setChatInput('');
    };

    const leaveRoom = () => {
        navigate('/lobby');
    }

    return (
        <div className={styles.container}>
            <h1>Room: {code}</h1>
            <button className={styles.leaveButton} onClick={leaveRoom}>Leave Room</button>
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
                            <strong>{m.user}: </strong>{m.message}
                    </div>
                    ))}
                </div>
                <div className={styles.chatInput}>
                    <input
                        type="text"
                        className={styles.input}
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        placeholder="Type your message here"
                    />
                    <button className={styles.button} onClick={sendMessage}>Send</button>
                </div>
            </div>
        </div>
    );
}
