// Import React și hook-uri
// • Rol: React pentru JSX; useState pentru stări locale; useEffect pentru efecte secundare; useRef pentru referințe DOM.
import React, { useState, useEffect, useRef } from 'react';

// Import stiluri modulare CSS
// • Rol: Clasă CSS izolată pentru interfața GameRoom.
import styles from './GameRoom.module.css';

// Import GameTools
// • Rol: Listă de unelte disponibile pentru desen.
import tools from './GameTools';

// Import useNavigate din React Router
// • Rol: Navigare programatică între rute (ex: Leave Room).
import { useNavigate } from 'react-router-dom';

// Funcție: rgbToHex
// • Rol: Convertește valorile RGB la un string hexa (‘#rrggbb’).
function rgbToHex(r, g, b) {
  return "#" + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

// Componentă: GameRoom
// • Rol: Gestionează și afișează interfața de joc (canvas, chat, jucători, unelte).
// • Motiv: Centralizează logica de desen și comunicare prin WebSocket.
export default function GameRoom({
  roomId,
  players,
  messages,
  theme,
  drawingPhase,
  wsRef
}) {

  // Hook: useNavigate
// • Rol: Permite navigarea programatică (ex: la /lobby când dai Leave Room).
  const navigate = useNavigate();

  // Ref Canvas
// • Rol: Referință către elementul <canvas> pentru desen.
  const canvasRef = useRef(null);

  // State Chat Input
// • Rol: Stochează textul curent pentru chat.
  const [chatInput, setChatInput] = useState('');

  // State Desen
// • Rol: Indică dacă se face desen (mousedown activ).
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [color, setColor] = useState('#000');
  const [size, setSize] = useState(2);
  const [selectedTool, setSelectedTool] = useState('brush');
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [savedImage, setSavedImage] = useState(null);

  // Funcție: startDrawing
// • Rol: Inițiază sesiunile de desen (sau clear/fill/colorPicker).
  const startDrawing = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    switch (selectedTool) {
      case 'clear':
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'CLEAR_CANVAS' }));
        }
        return;
      case 'fill':
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'FILL_CANVAS', payload: { color } }));
        }
        return;
      case 'colorPicker':
        const pixel = ctx.getImageData(x, y, 1, 1).data;
        const picked = rgbToHex(pixel[0], pixel[1], pixel[2]);
        setColor(picked);
        return;
      default:
        // Begin a shape draw: capture initial canvas state
        ctx.beginPath();
        setStartPos({ x, y });
        setLastPos({ x, y });
        // Save canvas pixels for preview
        const imgData = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
        setSavedImage(imgData);
        setIsDrawing(true);
        window.addEventListener('mouseup', stopDrawing);
        if (selectedTool === 'brush' || selectedTool === 'eraser') {
          // Freehand: draw point immediately
          draw(e);
        } else {
          // Shapes: preview on drag
          // no immediate commit
        }
    }
  };

  // Funcție: draw
// • Rol: Desenează puncte libere sau previzualizează forme în timpul drag-ului.
  const draw = (e) => {
    if (!isDrawing) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (selectedTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = size * 2;
      ctx.lineTo(x, y);
      ctx.stroke();
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'DRAW',
          payload: { tool: selectedTool, x, y, color, size }
        }));
      }
      setLastPos({ x, y });
    } else if (selectedTool === 'brush') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.lineWidth = size;
      ctx.lineTo(x, y);
      ctx.stroke();
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'DRAW',
          payload: { tool: selectedTool, x, y, color, size }
        }));
      }
      setLastPos({ x, y });
    } else if (isDrawing && (selectedTool === 'rectangle' || selectedTool === 'circle' || selectedTool === 'line')) {
      // Restore saved canvas and draw shape outline (rectangle or circle via diameter)
      ctx.putImageData(savedImage, 0, 0);
      const x0 = startPos.x, y0 = startPos.y;
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.lineWidth = size;
      if (selectedTool === 'rectangle') {
        ctx.strokeRect(x0, y0, x - x0, y - y0);
      } else if (selectedTool === 'circle') {
        // Circle: treat start and current as diameter endpoints
        const dx = x - x0;
        const dy = y - y0;
        const radius = Math.hypot(dx, dy) / 2;
        const cx = x0 + dx / 2;
        const cy = y0 + dy / 2;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
        ctx.stroke();
      } else {
        // Line preview: draw from start to current cursor
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    }
  };

  // Funcție: stopDrawing
// • Rol: Finalizează desenul și trimite datele formei către server.
  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    window.removeEventListener('mouseup', stopDrawing);
    const rect = canvasRef.current.getBoundingClientRect();
    const x = lastPos.x;
    const y = lastPos.y;
    const { x: x0, y: y0 } = startPos;
    const ctx = canvasRef.current.getContext('2d');
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    // Calculate fallback dimensions for click-only shapes
    const dx = x - x0;
    const dy = y - y0;
    const width = dx !== 0 ? dx : size;
    const height = dy !== 0 ? dy : size;
    const radius = Math.hypot(dx, dy) || size;
    switch (selectedTool) {
      case 'line':
        // Commit line using startPos and lastPos coordinates
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x, y);
        ctx.stroke();
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'DRAW',
            payload: { tool: 'line', x0, y0, x1: x, y1: y, color, size }
          }));
        }
        break;
      case 'rectangle':
        if (width !== size || height !== size) {
          ctx.strokeRect(x0, y0, width, height);
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
              type: 'DRAW',
              payload: { tool: 'rectangle', x: x0, y: y0, width, height, color, size }
            }));
          }
        }
        break;
      case 'circle':
        // Only commit circle if the user has dragged (not a click)
        const dx = x - x0;
        const dy = y - y0;
        const radius = Math.hypot(dx, dy) / 2;
        if (radius > 0) {
          // Compute center from diameter endpoints
          const cx = x0 + dx / 2;
          const cy = y0 + dy / 2;
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
          ctx.stroke();
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
              type: 'DRAW',
              payload: { tool: 'circle', cx, cy, radius, color, size }
            }));
          }
        }
        break;
      default:
        break;
    }
  };

  // Hook: useEffect pentru mesaje DRAW
// • Rol: Primește evenimente DRAW de la server și le redă pe canvas.
  useEffect(() => {
    const ws = wsRef.current;
    if (!ws) return;
    const handleDraw = (payload) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const { x, y, color, size } = payload;
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

  // Hook: useEffect pentru preview radieră
// • Rol: Ascultă mișcarea mouse-ului pentru afișarea cercului de radieră.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      setCursorPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };
    if (selectedTool === 'eraser') {
      canvas.addEventListener('mousemove', handleMouseMove);
    }
    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
    };
  }, [selectedTool, size]);

  // Funcție: sendChat
// • Rol: Trimite mesajul prin WebSocket și golește câmpul de input.
  const sendChat = () => {
    if (chatInput.trim() && wsRef.current) {
      wsRef.current.send(
        JSON.stringify({ type: 'CHAT', payload: { message: chatInput } })
      );
      setChatInput('');
    }
  };

  // Render UI
// • Rol: Afișează structura GameRoom: tema, lista jucătorilor, canvas-ul, chatul, uneltele și sliderul de mărime.
  return (
    <div className={styles.container}>
      {/* Theme Header */}
{/* • Rol: Afișează tema curentă de joc */}
      <div className={styles.themeHeader}>
        {theme || 'Waiting for theme...'}
      </div>

      {/* Main Content Area */}
      <div className={styles.mainArea}>
        {/* Player List */}
{/* • Rol: Afișează scorurile și butonul Leave Room */}
        <div className={styles.playerList}>
          <h2>Players</h2>
          <ul>
            {players.map((p) => (
              <li key={p.id || p.username}>
                {p.username} – {p.score ?? 0}
              </li>
            ))}
          </ul>
          <button
            className={styles.leaveButton}
            onClick={() => navigate('/lobby')}
          >
            Leave Room
          </button>
        </div>

        {/* Canvas Section */}
{/* • Rol: Zona de desen cu preview radieră */}
        <div className={styles.canvasSection}>
          <canvas
            ref={canvasRef}
            className={styles.canvas}
            width={1000}
            height={700}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            style={{
              cursor: 'crosshair'
            }}
          />
          {selectedTool === 'eraser' && (
            <div
              className={styles.eraserCursor}
              style={{
                left: cursorPos.x - size,
                top: cursorPos.y - size,
                width: size * 2,
                height: size * 2
              }}
            />
          )}
        </div>

        {/* Chat Section */}
{/* • Rol: Mesaje și input chat */}
        <div className={styles.chatSection}>
          <h2>Chat</h2>
          <div className={styles.messages}>
            {messages.map((m, idx) => (
              <div key={idx} className={styles.message}>
                <strong>{m.user?.username || 'Unknown'}:</strong> {m.message}
              </div>
            ))}
          </div>
          <div className={styles.inputArea}>
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendChat()}
              placeholder="Type a message..."
            />
            <button onClick={sendChat}>Send</button>
          </div>
        </div>
      </div>

      {/* Tools Bar */}
{/* • Rol: Iconițe pentru unelte și color picker */}
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
      
      {/* Size Control */}
{/* • Rol: Slider pentru dimensiunea uneltei selectate */}
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