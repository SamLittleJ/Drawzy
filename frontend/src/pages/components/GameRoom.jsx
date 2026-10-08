import React, { useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import ChatInput from './ChatInput';
import { isShapeTool, renderAction } from './drawing';
import tools from './GameTools';
import styles from './GameRoom.module.css';

function getPointerPos(e) {
  const { offsetX: x, offsetY: y } = e.nativeEvent;
  return { x, y };
}

export default function GameRoom({
  ref,
  players,
  messages,
  theme,
  drawingPhase,
  roundDuration,
  currentRound,
  maxRounds,
  onDraw,
  onSendChat,
}) {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  // In-progress stroke: where it started, the last point seen and, for shapes, the canvas before the preview.
  const strokeRef = useRef(null);

  const [timeLeft, setTimeLeft] = useState(0);
  const [tool, setTool] = useState('brush');
  const [color, setColor] = useState('#000000');
  const [size, setSize] = useState(2);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  const getCtx = () => canvasRef.current.getContext('2d');

  // Strokes from other players are pushed in by RoomPage.
  useImperativeHandle(ref, () => ({
    applyRemoteAction: (action) => canvasRef.current && renderAction(getCtx(), action),
  }));

  // Match the canvas backing store to the screen's pixel density so lines stay crisp.
  useEffect(() => {
    const canvas = canvasRef.current;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    canvas.getContext('2d').scale(dpr, dpr);
  }, []);

  // Every round starts on a blank canvas.
  useEffect(() => {
    if (canvasRef.current) renderAction(getCtx(), { tool: 'clear' });
  }, [currentRound]);

  useEffect(() => {
    if (!drawingPhase || roundDuration <= 0) return undefined;
    setTimeLeft(roundDuration);
    const timerId = setInterval(() => setTimeLeft((t) => Math.max(t - 1, 0)), 1000);
    return () => clearInterval(timerId);
  }, [drawingPhase, roundDuration]);

  const apply = (action) => {
    renderAction(getCtx(), action);
    onDraw(action);
  };

  const handleMouseDown = (e) => {
    if (!drawingPhase) return;
    const point = getPointerPos(e);

    if (tool === 'clear') return apply({ tool: 'clear' });
    if (tool === 'fill') return apply({ tool: 'fill', color });

    const canvas = canvasRef.current;
    strokeRef.current = {
      start: point,
      last: point,
      snapshot: isShapeTool(tool) ? getCtx().getImageData(0, 0, canvas.width, canvas.height) : null,
    };
    if (!isShapeTool(tool)) {
      apply({ tool, from: point, to: point, color, size });
    }
  };

  const handleMouseMove = (e) => {
    const point = getPointerPos(e);
    if (tool === 'eraser') setCursorPos(point);

    const stroke = strokeRef.current;
    if (!stroke) return;
    if (!drawingPhase) {
      strokeRef.current = null;
      return;
    }

    if (isShapeTool(tool)) {
      // Preview only: restore the canvas and redraw the shape, without sending anything.
      const ctx = getCtx();
      ctx.putImageData(stroke.snapshot, 0, 0);
      renderAction(ctx, { tool, from: stroke.start, to: point, color, size });
    } else {
      apply({ tool, from: stroke.last, to: point, color, size });
    }
    stroke.last = point;
  };

  const finishStroke = () => {
    const stroke = strokeRef.current;
    if (!stroke) return;
    strokeRef.current = null;
    if (isShapeTool(tool)) {
      getCtx().putImageData(stroke.snapshot, 0, 0);
      apply({ tool, from: stroke.start, to: stroke.last, color, size });
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.themeHeader}>{theme || 'Waiting for theme...'}</div>
      <div className={styles.mainArea}>
        <div className={styles.playerList}>
          <h2>Players</h2>
          <ul>
            {players.map((p) => (
              <li key={p.id} className={styles.username}>
                <span className={styles.username}>{p.username}</span>
                <span className={styles.score}>{p.score ?? 0}</span>
              </li>
            ))}
          </ul>
          <button onClick={() => navigate('/lobby')} className={styles.leaveButton}>
            Leave Room
          </button>
        </div>

        <div className={styles.canvasSection} style={{ position: 'relative', overflow: 'hidden' }}>
          <div className={styles.timer}>{timeLeft}</div>
          <canvas
            ref={canvasRef}
            className={styles.canvas}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={finishStroke}
            onMouseLeave={finishStroke}
            style={{ cursor: drawingPhase ? 'crosshair' : 'not-allowed' }}
          />
          {tool === 'eraser' && (
            <div
              className={styles.eraserCursor}
              style={{
                position: 'absolute',
                left: cursorPos.x - size,
                top: cursorPos.y - size,
                width: size * 2,
                height: size * 2,
              }}
            />
          )}
        </div>

        <div className={styles.chatSection}>
          <h2>
            Rounds {currentRound}/{maxRounds}
          </h2>
          <div className={styles.messages}>
            {messages.map((m, idx) => (
              <div key={idx} className={styles.message}>
                <strong>{m.user}:</strong> {m.message}
              </div>
            ))}
          </div>
          <ChatInput className={styles.inputArea} onSend={onSendChat} />
        </div>
      </div>

      <div className={styles.toolsBar}>
        <div className={styles.toolsList}>
          {tools.map(({ id, label, icon }) => (
            <button
              key={id}
              title={label}
              aria-label={label}
              aria-pressed={tool === id}
              onClick={() => setTool(id)}
              className={tool === id ? styles.activeTool : ''}
            >
              {icon}
            </button>
          ))}
        </div>
        <div className={styles.colorControl}>
          <label className={styles.colorPicker}>
            <i className="fas fa-tint" style={{ color, fontSize: '34px' }} aria-hidden="true" />
            <input type="color" aria-label="Brush color" value={color} onChange={(e) => setColor(e.target.value)} />
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
          onChange={(e) => setSize(Number(e.target.value))}
        />
        <span>{size}px</span>
      </div>
    </div>
  );
}
