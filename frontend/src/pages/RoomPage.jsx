import React, {useState, useEffect, useRef} from 'react';
import {useParams} from 'react-router-dom';
import WaitingRoom from './components/WaitingRoom';
import GameRoom from './components/GameRoom';


export default function RoomPage() {
    const {code} = useParams();
    const wsRef = useRef(null);
    const [gameStarted, setGameStarted] = useState(false);
    const [players, setPlayers] = useState([]);
    const [messages, setMessages] = useState([]);
    const [currentTheme, setCurrentTheme] = useState('');
    const [drawingPhase, setDrawingPhase] = useState(false);
    const userId = Number(localStorage.getItem('user_id'));
    const username = localStorage.getItem('username') || 'Anonymous';

    useEffect(() => {
      const token = localStorage.getItem('access_token');
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const host = "drawzy-backend-alb-409373296.eu-central-1.elb.amazonaws.com";
      wsRef.current = new WebSocket(`${protocol}://${host}/ws/${code}?token=${token}`);

      wsRef.current.onopen = () => {
        console.log('Unified WS connected');
        // Announce this client has joined
        wsRef.current.send(JSON.stringify({
          type: 'PLAYER_JOIN',
          payload: { id: userId, username: username, avatarUrl: null }
        }));
      };

      wsRef.current.onmessage = (event) => {
        console.log("Unified WS message received:", event.data);
        const msg = JSON.parse(event.data);
        console.log("Unified WS message parsed:", msg);
        switch (msg.type) {
          case 'PLAYER_JOIN':
            setPlayers(prev => [...prev, msg.payload]);
            break;
          case 'CHAT':
            setMessages(prev => [...prev, msg.payload]);
            break;
          case 'DRAW':
            // drawing handled in GameRoom via wsRef prop
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
            // handle vote results if needed
            break;
          case 'GAME_END':
            // handle game end if needed
            break;
          default:
            console.warn('Unknown WS type', msg.type);
        }
      };
      console.log('Unified WS onmessage set up');
      wsRef.current.onerror = (e) => console.error('Unified WS error', e);
      console.log('Unified WS onerror set up');
      wsRef.current.onclose = (e) => console.warn('Unified WS closed', e.code, e.reason);

      return () =>  wsRef.current?.close();
    }, [code]);

    function startGame() {
        console.log('Starting game in room', code);
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        console.log('Sending START_GAME message');
        wsRef.current.send(JSON.stringify({ type: 'START_GAME' }));
      }
      console.log('Game start message sent');
      setGameStarted(true);
    }

    if (!gameStarted) {
        return (
            <WaitingRoom
                roomId={code}
                players={players}
                onStart={startGame}
            />
        )
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
    )


}