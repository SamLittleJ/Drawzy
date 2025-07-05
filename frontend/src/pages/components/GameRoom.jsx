import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './GameRoom.module.css';
import tools from './GameTools';

function rgbToHex(r, g, b) {
  return "#" + [r, g, b]
    .map(x => x.toString(16).padStart(2, '0'))
    .join('');
}

export default function GameRoom({
  roomId,
  players,
  messages,
  theme,
  drawingPhase,
  roundDuration,
  currentRound,
  maxRounds,
  wsRef
}) {
  const [timeLeft, setTimeLeft] = useState(0);
  // Countdown timer for the drawing phase
  useEffect(() => {
    if (drawingPhase && roundDuration > 0) {
      setTimeLeft(roundDuration);
      const timerId = setInterval(() => {
        setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timerId);
    }
  }, [drawingPhase, roundDuration]);
  // Unique ID for this client instance to filter out own DRAW echoes
  const clientId = useRef(`client_${Math.random().toString(36).substr(2, 9)}`);
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  const [chatInput, setChatInput] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [savedImage, setSavedImage] = useState(null);
  const [color, setColor] = useState('#000');
  const [size, setSize] = useState(2);
  const [selectedTool, setSelectedTool] = useState('brush');

  // 1. Ajustare rezoluție internă canvas la montare
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const { width, height } = canvas.getBoundingClientRect();

    canvas.width  = width  * dpr;
    canvas.height = height * dpr;
    canvas.style.width  = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.scale(dpr, dpr);
  }, []);

  // 2. Helper pentru poziția pointer-ului cu scalare
  function getPointerPos(e) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top)  * scaleY
    };
  }

  // 3. Start drawing: un singur beginPath + moveTo
  const startDrawing = (e) => {
    if (!drawingPhase) return;
    const { x, y } = getPointerPos(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    switch (selectedTool) {
      case 'clear':
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        wsRef.current?.readyState === WebSocket.OPEN &&
          wsRef.current.send(JSON.stringify({ type: 'CLEAR_CANVAS' }));
        return;

      case 'fill':
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        wsRef.current?.readyState === WebSocket.OPEN &&
          wsRef.current.send(JSON.stringify({ type: 'FILL_CANVAS', payload: { color } }));
        return;

      case 'colorPicker':
        const pixel = ctx.getImageData(x, y, 1, 1).data;
        setColor(rgbToHex(pixel[0], pixel[1], pixel[2]));
        return;

      default:
        // Pentru brush, eraser și shapes
        ctx.beginPath();
        ctx.moveTo(x, y);
        setStartPos({ x, y });
        setLastPos({ x, y });

        // Salvez starea pentru preview (shapes)
        if (selectedTool !== 'brush' && selectedTool !== 'eraser') {
          const imgData = ctx.getImageData(
            0, 0,
            canvasRef.current.width,
            canvasRef.current.height
          );
          setSavedImage(imgData);
        }

        setIsDrawing(true);
        window.addEventListener('mouseup', stopDrawing);

        // Desen inițial pentru brush/eraser
        if (selectedTool === 'brush' || selectedTool === 'eraser') {
          draw(e);
        }
        return;
    }
  };

  // 4. Draw: fără beginPath intern, doar lineTo
  const draw = (e) => {
    if (!drawingPhase) {
      setIsDrawing(false);
      return;
    }
    if (!isDrawing) return;
    const { x, y } = getPointerPos(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.globalCompositeOperation = selectedTool === 'eraser'
      ? 'destination-out'
      : 'source-over';
    ctx.lineWidth = selectedTool === 'eraser' ? size * 2 : size;
    ctx.strokeStyle = color;

    if (selectedTool === 'brush' || selectedTool === 'eraser') {
      ctx.lineTo(x, y);
      ctx.stroke();
      // if (wsRef.current?.readyState === WebSocket.OPEN) {      
      //   wsRef.current.send(JSON.stringify({
      //     type: 'DRAW',
      //     payload: { tool: selectedTool, x, y, color, size, clientId: clientId.current }
      //   }));
      //}
      setLastPos({ x, y });

    } else if (savedImage) {
      // Preview forme
      ctx.putImageData(savedImage, 0, 0);
      const x0 = startPos.x, y0 = startPos.y;

      if (selectedTool === 'rectangle') {
        ctx.strokeRect(x0, y0, x - x0, y - y0);

      } else if (selectedTool === 'circle') {
        const dx = x - x0, dy = y - y0;
        const r = Math.hypot(dx, dy) / 2;
        ctx.beginPath();
        ctx.arc(x0 + dx/2, y0 + dy/2, r, 0, 2 * Math.PI);
        ctx.stroke();

      } else if (selectedTool === 'line') {
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    }
  };

  // 5. Stop drawing: commit shapes și trimit payload
  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    window.removeEventListener('mouseup', stopDrawing);

    const ctx = canvasRef.current.getContext('2d');
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = color;
    ctx.lineWidth = size;

    const { x: x0, y: y0 } = startPos;
    const { x, y } = lastPos;
    const dx = x - x0, dy = y - y0;
    const width = dx;
    const height = dy;
    const radius = Math.hypot(dx, dy) / 2;

    let payload = null;

    switch (selectedTool) {
      case 'line':
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x, y);
        ctx.stroke();
        payload = { tool: 'line', x0, y0, x1: x, y1: y, color, size };
        break;

      case 'rectangle':
        if (width !== 0 && height != 0) {
          ctx.strokeRect(x0, y0, width, height);
          payload = {
            tool: 'rectangle',
            x: x0,
            y: y0,
            width,
            height,
            color,
            size
          }
        }
        break;

      case 'circle':
        ctx.beginPath();
        ctx.arc(x0 + dx/2, y0 + dy/2, radius, 0, 2 * Math.PI);
        ctx.stroke();
        payload = {
          tool: 'circle',
          cx: x0 + dx/2, cy: y0 + dy/2,
          radius, color, size
        };
        break;

      default:
        break;
    }

    if (payload && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'DRAW', payload }));
    }
  };

  // WebSocket DRAW listener (rămâne neschimbat)
  useEffect(() => {
    const ws = wsRef.current;
    if (!ws) return;
    const handleDraw = ({ x, y, color, size, clientId: senderId }) => {
      if (senderId === clientId.current) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx.strokeStyle = color || 'black';
      ctx.lineWidth = size || 2;
      ctx.lineTo(x, y);
      ctx.stroke();
    };
    const listener = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'DRAW') handleDraw(msg.payload);
    };
    ws.addEventListener('message', listener);
    return () => ws.removeEventListener('message', listener);
  }, [wsRef]);

  // Preview radieră (cursor eraser) — actualizat să folosească CSS coordinates
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const updateCursor = (e) => {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setCursorPos({ x, y });
    };
    if (selectedTool === 'eraser') {
      canvas.addEventListener('mousemove', updateCursor);
    }
    return () => {
      canvas.removeEventListener('mousemove', updateCursor);
    };
  }, [selectedTool, size]);

  const sendChat = () => {
    if (chatInput.trim() && wsRef.current) {
      wsRef.current.send(
        JSON.stringify({ type: 'CHAT', payload: { message: chatInput } })
      );
      setChatInput('');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.themeHeader}>
        {theme || 'Waiting for theme...'}
      </div>
      <div className={styles.mainArea}>
        <div className={styles.playerList}>
          <h2>Players</h2>
          <ul>
            {players.map(p => (
              <li key={p.id || p.username} className={styles.username}>
                <span className={styles.username}>{p.username}</span>
                <span className={styles.score}>{p.score ?? 0}</span>
              </li>
            ))}
          </ul>
          <button onClick={() => navigate('/lobby')} className={styles.leaveButton}>
            Leave Room
          </button>
        </div>
        <div 
           className={styles.canvasSection}
           style={{ position: 'relative', overflow: 'hidden' }}
        >
          <div className={styles.timer}>{timeLeft}</div>
          <canvas
            ref={canvasRef}
            className={styles.canvas}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            style={{ cursor: drawingPhase ? 'crosshair' : 'not-allowed' }}
          />
          {selectedTool === 'eraser' && (
            <div
              className={styles.eraserCursor}
              style={{
                position: 'absolute',
                left: cursorPos.x - size,
                top: cursorPos.y - size,
                width: size * 2,
                height: size * 2
              }}
            />
          )}
        </div>
        <div className={styles.chatSection}>
          <h2>Rounds {currentRound}/{maxRounds}</h2>
          <div className={styles.messages}>
            {messages.map((m, idx) => (
              <div key={idx} className={styles.message}>
                <strong>{m.user || 'Unknown'}:</strong> {m.message}
              </div>
            ))}
          </div>
          <div className={styles.inputArea}>
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendChat()}
              placeholder="Type a message..."
            />
            <button onClick={sendChat}>Send</button>
          </div>
        </div>
      </div>

      <div className={styles.toolsBar}>
        <div className={styles.toolsList}>
          {tools.map(tool => (
            <button
              key={tool.id}
              onClick={() => setSelectedTool(tool.id)}
              className={selectedTool === tool.id ? styles.activeTool : ''}
            >
              {tool.icon}
            </button>
          ))}
        </div>
        <div className={styles.colorControl}>
          <label className={styles.colorPicker}>
            <i
              className="fas fa-tint"
              style={{ color, fontSize: '34px' }}
              aria-hidden="true"
            />
            <input
              type="color"
              value={color}
              onChange={e => setColor(e.target.value)}
            />
          </label>
        </div>
      </div>

      <div className={styles.sizeControl}>
        <label htmlFor="tool-size">Size:</label>
        <input
          id="tool-size"
          type="range"
          min="1"
          max="50"
          value={size}
          onChange={e => setSize(+e.target.value)}
        />
        <span>{size}px</span>
      </div>
    </div>
  );
}