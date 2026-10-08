import React, { useCallback, useEffect, useReducer, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { clearToken, getToken } from '../api';
import { WS_URL } from '../config';
import GameRoom from './components/GameRoom';
import WaitingRoom from './components/WaitingRoom';
import { initialRoomState, roomReducer } from './roomReducer';

// Application close codes sent by the backend when it refuses a connection.
const UNAUTHORIZED = 4401;
const CLOSE_MESSAGES = {
  4403: 'That room is full.',
  4404: 'That room does not exist anymore.',
};

export default function RoomPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const socketRef = useRef(null);
  const gameRoomRef = useRef(null);
  // Strokes that arrive before the canvas is on screen (e.g. when joining mid-turn).
  const pendingStrokesRef = useRef([]);
  const [state, dispatch] = useReducer(roomReducer, initialRoomState);

  useEffect(() => {
    const ws = new WebSocket(`${WS_URL}/ws/${code}?token=${encodeURIComponent(getToken() ?? '')}`);
    socketRef.current = ws;

    const drawRemote = (action) => {
      if (gameRoomRef.current) gameRoomRef.current.applyRemoteAction(action);
      else pendingStrokesRef.current.push(action);
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      switch (msg.type) {
        case 'DRAW':
          drawRemote(msg.payload);
          return;
        case 'CANVAS_STATE':
          msg.payload.actions.forEach(drawRemote);
          return;
        case 'TURN_START':
          pendingStrokesRef.current = [];
          gameRoomRef.current?.clearCanvas();
          break;
        default:
          break;
      }
      dispatch(msg);
    };

    ws.onclose = (event) => {
      if (event.code === UNAUTHORIZED) {
        clearToken();
        navigate('/login', { replace: true });
      } else if (CLOSE_MESSAGES[event.code]) {
        navigate('/lobby', { replace: true, state: { error: CLOSE_MESSAGES[event.code] } });
      }
    };

    return () => {
      ws.onclose = null;
      ws.close();
    };
  }, [code, navigate]);

  const sendEvent = useCallback((type, payload) => {
    const ws = socketRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type, payload }));
    }
  }, []);

  const flushPendingStrokes = useCallback(() => {
    const strokes = pendingStrokesRef.current;
    pendingStrokesRef.current = [];
    strokes.forEach((action) => gameRoomRef.current?.applyRemoteAction(action));
  }, []);

  const sendChat = (message) => sendEvent('CHAT', { message });

  if (!state.gameStarted) {
    return (
      <WaitingRoom
        roomCode={code}
        players={state.players}
        messages={state.messages}
        onStart={() => sendEvent('START_GAME')}
        onSendChat={sendChat}
      />
    );
  }

  return (
    <GameRoom
      ref={gameRoomRef}
      self={state.self}
      players={state.players}
      messages={state.messages}
      phase={state.phase}
      round={state.round}
      maxRounds={state.maxRounds}
      drawer={state.drawer}
      word={state.word}
      hint={state.hint}
      turnId={state.turnId}
      timeLeft={state.timeLeft}
      guessedIds={state.guessedIds}
      leaderboard={state.leaderboard}
      winnerIds={state.winnerIds}
      onDraw={(action) => sendEvent('DRAW', action)}
      onSendChat={sendChat}
      onCanvasReady={flushPendingStrokes}
      onCloseResults={() => dispatch({ type: 'CLOSE_RESULTS' })}
    />
  );
}
