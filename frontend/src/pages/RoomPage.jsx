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
  const [roundDuration, setRoundDuration] = useState(0);
  const [currentRound, setCurrentRound] = useState(0);
  const [maxRounds, setMaxRounds] = useState(0);

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
      // First request existing players, then announce self
      ws.send(JSON.stringify({ type: 'GET_EXISTING_PLAYERS' }));
    };

    // Eveniment WS onmessage
    // • Rol: Procesează mesajele primite de la server și actualizează stările relevante.
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      switch (msg.type) {
        case 'EXISTING_PLAYERS':
          // Initialize full player list when joining
          setPlayers(msg.payload);
          wsRef.current.send(JSON.stringify ({ type: 'PLAYER_JOIN'}));
          break;
        case 'PLAYER_JOIN': {
          setPlayers(prev => {
            if (prev.some(p => p.id === msg.payload.id)) return prev;
            return [...prev, msg.payload];
          });
          break;
        }
        case 'PLAYER_LEAVE':
          setPlayers(prev => prev.filter(p => p.id !== msg.payload.id));
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
          setRoundDuration(msg.payload.duration);
          setCurrentRound(msg.payload.round);
          setMaxRounds(msg.payload.maxRounds);
          setDrawingPhase(true);
          break;
        case 'ROUND_END':
          setDrawingPhase(false);
          setCurrentTheme('');
          alert(`Round ${msg.payload.round} ended!`);
          break;
        case 'VOTE_RESULT':
          break;
        case 'GAME_END':
          // Switch back to waiting room without closing WS
          setGameStarted(false);
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
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'START_GAME' }));
      console.log('START_GAME sent; awaiting server response');
    }
  }

  function sendMessage(text) {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'CHAT', payload: { message: text } }));
    }
  }

  // Render WaitingRoom
  // • Rol: Afișează sala de așteptare cu lista de jucători și butonul de start.
  if (!gameStarted) {
    return (
      <WaitingRoom
        roomId={code}
        players={players}
        messages={messages}
        onStart={startGame}
        onSend={sendMessage}
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
      roundDuration={roundDuration}
      currentRound={currentRound}
      maxRounds={maxRounds}
      onSend={sendMessage}
      wsRef={wsRef}
    />
  );
}