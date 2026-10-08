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
  const [state, dispatch] = useReducer(roomReducer, initialRoomState);

  useEffect(() => {
    const ws = new WebSocket(`${WS_URL}/ws/${code}?token=${encodeURIComponent(getToken() ?? '')}`);
    socketRef.current = ws;

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'DRAW') {
        gameRoomRef.current?.applyRemoteAction(msg.payload);
        return;
      }
      dispatch(msg);
      if (msg.type === 'ROUND_END') {
        alert(`Round ${msg.payload.round} ended!`);
      }
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
      players={state.players}
      messages={state.messages}
      theme={state.theme}
      drawingPhase={state.drawingPhase}
      roundDuration={state.roundDuration}
      currentRound={state.currentRound}
      maxRounds={state.maxRounds}
      onDraw={(action) => sendEvent('DRAW', action)}
      onSendChat={sendChat}
    />
  );
}
