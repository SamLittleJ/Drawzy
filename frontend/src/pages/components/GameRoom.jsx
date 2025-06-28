import React, {useRef, useState, useEffect} from 'react';
import styles from './GameRoom.module.css';

export default function GameRoom({roomId, messages, onSendMessage, wsRef, theme, drawingPhase}) {
    const canvasRef = useRef(null);
    const [color, setColor] = useState('#000000');
    const [size, setSize] = useState(4);
    const [isDrawing, setIsDrawing] = useState(false);
    const prevPoint = useRef({x: 0, y: 0});
    const [input, setInput] = useState('');

    useEffect(() =>{
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        function handleMouseDown(e){
            ctx.beginPath();
            const x = e.clientX - canvas.offsetLeft;
            const y = e.clientY - canvas.offsetTop;
            ctx.moveTo(x, y);
            prevPoint.current = {x, y};
            setIsDrawing(true);
        }

        function handleMouseMove(e){
            if (!drawing) return;
            const x = e.clientX - canvas.offsetLeft;
            const y = e.clientY - canvas.offsetTop;
            ctx.lineTo(x, y);
            ctx.strokeStyle = color;
            ctx.lineWidth = size;
            ctx.stroke();

            const x0 = prevPoint.current.x;
            const y0 = prevPoint.current.y;
            const x1 = x;
            const y1 = y;
            prevPoint.current = { x :x1, y: y1 };

            if(wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({
                    type: 'DRAW',
                    payload: { x0, y0, x1, y1, color, size }
                }))
            }
        }

        function handleMouseUp(){
            setIsDrawing(false);
        }

        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseup', handleMouseUp);
        canvas.addEventListener('mouseleave', handleMouseUp);

        return () =>{
            canvas.removeEventListener('mousedown', handleMouseDown);
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('mouseup', handleMouseUp);
            canvas.removeEventListener('mouseleave', handleMouseUp);
        }
    }, [color, size, isDrawing, wsRef]);

    return (
        <div className={styles.container}>
            {!drawingPhase && theme && (
                <div className={styles.themeOverlay}>
                    Draw: {theme}
                </div>
            )}
            <div className={styles.canvasSection}>
                <canvas ref={canvasRef} className={styles.canvas} />

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
                            onChange={(e) => setSize(e.target.value)}
                        />
                    </label>
                </div>
            </div>

            <div className={styles.chatSection}>
                <div className={styles.messages}>
                    {messages.map((msg,i) =>(
                        <div key={i} className={styles.message}>
                            <strong>{msg.user}: </strong>
                            {msg.message}
                        </div>
                    ))}
                </div>


                <div className={styles.inputArea}>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your message here"
                    />
                    <button
                        onClick={() =>{
                            onSendMessage(input);
                            setInput('');
                        }}
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    )
}