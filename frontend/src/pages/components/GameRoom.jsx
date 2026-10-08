import React, { useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import ChatInput from './ChatInput';
import ChatLog from './ChatLog';
import { isShapeTool, renderAction } from './drawing';
import tools from './GameTools';
import styles from './GameRoom.module.css';

function getPointerPos(e) {
  const { offsetX: x, offsetY: y } = e.nativeEvent;
  return { x, y };
}

function headline({ phase, isDrawer, word, hint }) {
  if (phase === 'turnEnd' || phase === 'gameOver') return { label: 'The word was', text: word };
  if (isDrawer) return { label: 'Draw', text: word };
  if (word) return { label: 'You guessed it', text: word };
  return { label: 'Guess the word', text: hint, isHint: true };
}

function statusText({ phase, isDrawer, drawer }) {
  if (phase === 'turnEnd') return 'Turn over';
  if (phase === 'gameOver') return 'Game over';
  return isDrawer ? 'You are drawing' : `${drawer?.username ?? '...'} is drawing`;
}

function winnerText(leaderboard, winnerIds, self) {
  const winners = leaderboard.filter((entry) => winnerIds.includes(entry.id));
  if (winners.length === 0) return 'Nobody scored this time.';
  if (winners.length === 1) return winners[0].id === self?.id ? 'You win!' : `${winners[0].username} wins!`;
  return `It's a tie between ${winners.map((w) => w.username).join(' and ')}!`;
}

export default function GameRoom({
  ref,
  self,
  players,
  messages,
  phase,
  round,
  maxRounds,
  drawer,
  word,
  hint,
  turnId,
  timeLeft,
  guessedIds,
  leaderboard,
  winnerIds,
  onDraw,
  onSendChat,
  onCanvasReady,
  onCloseResults,
}) {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  // In-progress stroke: where it started, the last point seen and, for shapes, the canvas before the preview.
  const strokeRef = useRef(null);

  const [secondsLeft, setSecondsLeft] = useState(timeLeft);
  const [tool, setTool] = useState('brush');
  const [color, setColor] = useState('#000000');
  const [size, setSize] = useState(4);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  const isDrawer = Boolean(self) && drawer?.id === self.id;
  const canDraw = isDrawer && phase === 'drawing';
  const getCtx = () => canvasRef.current.getContext('2d');

  // RoomPage pushes other players' strokes in, and wipes the canvas when a new turn starts.
  useImperativeHandle(ref, () => ({
    applyRemoteAction: (action) => canvasRef.current && renderAction(getCtx(), action),
    clearCanvas: () => canvasRef.current && renderAction(getCtx(), { tool: 'clear' }),
  }));

  // Match the canvas backing store to the screen's pixel density so lines stay crisp. This runs as a layout
  // effect, together with the ref above: resizing a canvas wipes it, so it must happen before any stroke is drawn.
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    canvas.getContext('2d').scale(dpr, dpr);
    onCanvasReady?.();
  }, []);

  useEffect(() => {
    setSecondsLeft(phase === 'drawing' ? timeLeft : 0);
    if (phase !== 'drawing') return undefined;
    const timerId = setInterval(() => setSecondsLeft((s) => Math.max(s - 1, 0)), 1000);
    return () => clearInterval(timerId);
  }, [turnId, phase, timeLeft]);

  const apply = (action) => {
    renderAction(getCtx(), action);
    onDraw(action);
  };

  const handleMouseDown = (e) => {
    if (!canDraw) return;
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
    if (!canDraw) {
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

  const title = headline({ phase, isDrawer, word, hint });

  return (
    <div className={styles.container}>
      <div className={styles.themeHeader}>
        {title.label}: <span className={title.isHint ? styles.hint : styles.word}>{title.text}</span>
      </div>
      <div className={styles.subHeader}>
        Round {round}/{maxRounds} · {statusText({ phase, isDrawer, drawer })}
      </div>

      <div className={styles.mainArea}>
        <div className={styles.playerList}>
          <h2>Players</h2>
          <ul>
            {players.map((p) => (
              <li key={p.id} className={styles.playerRow}>
                <span className={styles.username}>
                  {p.username}
                  {p.id === self?.id && ' (you)'}
                </span>
                {p.id === drawer?.id && (
                  <span className={styles.badge} title="Drawing">
                    <i className="fas fa-pencil" aria-hidden="true" />
                  </span>
                )}
                {guessedIds.includes(p.id) && (
                  <span className={styles.badge} title="Guessed the word">
                    <i className="fas fa-check" aria-hidden="true" />
                  </span>
                )}
                <span className={styles.score}>{p.score ?? 0}</span>
              </li>
            ))}
          </ul>
          <button onClick={() => navigate('/lobby')} className={styles.leaveButton}>
            Leave Room
          </button>
        </div>

        <div className={styles.canvasSection}>
          <div className={styles.timer} aria-label="Seconds left">
            {secondsLeft}
          </div>
          <canvas
            ref={canvasRef}
            className={styles.canvas}
            aria-label="Drawing canvas"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={finishStroke}
            onMouseLeave={finishStroke}
            style={{ cursor: canDraw ? 'crosshair' : 'not-allowed' }}
          />
          {canDraw && tool === 'eraser' && (
            <div
              className={styles.eraserCursor}
              style={{ left: cursorPos.x - size, top: cursorPos.y - size, width: size * 2, height: size * 2 }}
            />
          )}

          {phase === 'gameOver' && (
            <div className={styles.overlay}>
              <div className={styles.resultsCard} role="dialog" aria-label="Game results">
                <h2>Game over</h2>
                <p className={styles.winner}>{winnerText(leaderboard, winnerIds, self)}</p>
                <ol className={styles.leaderboard}>
                  {leaderboard.map((entry) => (
                    <li key={entry.id}>
                      <span>{entry.username}</span>
                      <span>{entry.score}</span>
                    </li>
                  ))}
                </ol>
                <button className={styles.resultsButton} onClick={onCloseResults}>
                  Back to waiting room
                </button>
              </div>
            </div>
          )}
        </div>

        <div className={styles.chatSection}>
          <h2>Chat</h2>
          <ChatLog messages={messages} className={styles.messages} messageClassName={styles.message} />
          <ChatInput
            className={styles.inputArea}
            onSend={onSendChat}
            placeholder={isDrawer || word ? 'Chat...' : 'Type your guess...'}
          />
        </div>
      </div>

      {isDrawer && (
        <>
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
        </>
      )}
    </div>
  );
}
