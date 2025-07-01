import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import WaitingRoom from './components/WaitingRoom';
import GameRoom from './components/GameRoom';

export default function RoomPage() {
  const { code } = useParams();
  const wsRef = useRef(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [players, setPlayers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [currentTheme, setCurrentTheme] = useState('');
  const [drawingPhase, setDrawingPhase] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const host = 'drawzy-ws-nlb-a06e066743dd7e7d.elb.eu-central-1.amazonaws.com';
    const ws = new WebSocket(`${protocol}://${host}/ws/${code}?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Unified WS connected');
      // Announce this client has joined
      ws.send(JSON.stringify({ type: 'PLAYER_JOIN' }));
    };

    ws.onmessage = (event) => {
      console.log('Unified WS message received:', event.data);
      const msg = JSON.parse(event.data);
      console.log('Unified WS message parsed:', msg);
      switch (msg.type) {
        case 'PLAYER_JOIN':
          setPlayers(prev => [...prev, msg.payload]);
          break;
        case 'CHAT':
          setMessages(prev => [...prev, msg.payload]);
          break;
        case 'DRAW':
          break;
        case 'SHOW_THEME':
          setCurrentTheme(msg.payload.theme);
          setDrawingPhase(false);
          setGameStarted(true);
          break;
        case 'ROUND_START':
          setDrawingPhase(true);
          break;
        case 'ROUND_END':
          setDrawingPhase(false);
          setCurrentTheme('');
          break;
        case 'VOTE_RESULT':
          break;
        case 'GAME_END':
          break;
        default:
          console.warn('Unknown WS type', msg.type);
      }
    };

    ws.onerror = (e) => console.error('Unified WS error', e);
    ws.onclose = (e) => console.warn('Unified WS closed', e.code, e.reason);

    return () => {
      if (wsRef.current) {
        console.log('Closing Unified WS connection');
        wsRef.current.close();
      }
    };
  }, [code]);

  function startGame() {
    console.log('Starting game in room', code);
    setGameStarted(true);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('Sending START_GAME message');
      wsRef.current.send(JSON.stringify({ type: 'START_GAME' }));
      console.log('START_GAME sent; awaiting server response');
    }
  }

  if (!gameStarted) {
    return (
      <WaitingRoom
        roomId={code}
        players={players}
        onStart={startGame}
      />
    );
  }

  return (
    <GameRoom
      roomId={code}
      players={players}
      messages={messages}
      theme={currentTheme}
      drawingPhase={drawingPhase}
      wsRef={wsRef}
    />
  );
}