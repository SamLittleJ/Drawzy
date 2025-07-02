// Import React și hook-urile necesare
// • Rol: useState pentru gestionarea stărilor, useEffect pentru efecte secundare, useRef pentru referințe mutable.
import React, { useState, useEffect, useRef } from 'react';

// Import useParams din React Router
// • Rol: Obține parametrul de rută `code` pentru identificarea camerei.
import { useParams } from 'react-router-dom';

// Import componentele de UI
import WaitingRoom from './components/WaitingRoom';
import GameRoom from './components/GameRoom';

// Componentă: RoomPage
// • Rol: Gestionează starea camerei de joc și conexiunea WebSocket.
// • Motiv: Centralizează inițializarea WS și comutarea între WaitingRoom și GameRoom.
export default function RoomPage() {
  // Obține codul camerei din URL
  const { code } = useParams();

  // Ref WebSocket: wsRef
  // • Rol: Păstrează instanța WebSocket între render-uri fără a recrea conexiunea.
  const wsRef = useRef(null);

  // State-uri pentru logica de joc
  const [gameStarted, setGameStarted] = useState(false);
  const [players, setPlayers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [currentTheme, setCurrentTheme] = useState('');
  const [drawingPhase, setDrawingPhase] = useState(false);

  // Hook: useEffect pentru inițializarea WebSocket
  // • Rol: Deschide conexiunea WS la montarea componentei și o închide la demontare.
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const host = 'drawzy-backend-alb-409373296.eu-central-1.elb.amazonaws.com';
    const ws = new WebSocket(`${protocol}://${host}/ws/${code}?token=${token}`);
    wsRef.current = ws;

    // Eveniment WS onopen
    // • Rol: Logare la deschiderea conexiunii și trimiterea evenimentului PLAYER_JOIN.
    ws.onopen = () => {
      console.log('Unified WS connected');
      ws.send(JSON.stringify({ type: 'PLAYER_JOIN' }));
    };

    // Eveniment WS onmessage
    // • Rol: Procesează mesajele primite de la server și actualizează stările relevante.
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

    // Eveniment WS onerror
    // • Rol: Capturează și loghează erorile de conexiune WebSocket.
    ws.onerror = (e) => console.error('Unified WS error', e);

    // Eveniment WS onclose
    // • Rol: Loghează codul și motivul închiderii conexiunii WS.
    ws.onclose = (e) => console.warn('Unified WS closed', e.code, e.reason);

    return () => {
      if (wsRef.current) {
        console.log('Closing Unified WS connection');
        wsRef.current.close();
      }
    };
  }, [code]);

  // Funcție: startGame
  // • Rol: Trimite comanda START_GAME prin WebSocket și actualizează starea locală.
  // • Alternative: Schema de evenimente ar putea include confirmare de la server.
  function startGame() {
    console.log('Starting game in room', code);
    setGameStarted(true);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('Sending START_GAME message');
      wsRef.current.send(JSON.stringify({ type: 'START_GAME' }));
      console.log('START_GAME sent; awaiting server response');
    }
  }

  // Render WaitingRoom
  // • Rol: Afișează sala de așteptare cu lista de jucători și butonul de start.
  if (!gameStarted) {
    return (
      <WaitingRoom
        roomId={code}
        players={players}
        onStart={startGame}
      />
    );
  }

  // Render GameRoom
  // • Rol: Afișează componenta principală de joc după ce a început partida.
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