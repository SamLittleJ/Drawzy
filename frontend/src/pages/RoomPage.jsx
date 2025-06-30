import React, {useState, useEffect, useRef} from 'react';
import {useParams} from 'react-router-dom';
import WaitingRoom from './components/WaitingRoom';
import GameRoom from './components/GameRoom';


export default function RoomPage() {
    const {code} = useParams();
    const wsRef = useRef(null);
    const [gameStarted, setGameStarted] = useState(false);
    const [players, setPlayers] = useState([{id:1, username: 'You', avatarUrl: null}]);
    const [messages, setMessages] = useState([]);
    const [currentTheme, setCurrentTheme] = useState('');
    const [drawingPhase, setDrawingPhase] = useState(false);

    useEffect(() => {
      const token = localStorage.getItem('access_token');
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const host = "drawzy-backend-alb-409373296.eu-central-1.elb.amazonaws.com";
      wsRef.current = new WebSocket(`${protocol}://${host}/ws/${code}?token=${token}`);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected for all events');
      };

      wsRef.current.onmessage = (event) => {
        console.log('WS received:', event.data);
        const msg = JSON.parse(event.data);

        if (msg.type === 'PLAYER_JOIN') {
          setPlayers(prev => [
            ...prev,
            { id: msg.payload.userId, username: msg.payload.username, avatarUrl: msg.payload.avatarUrl }
          ]);
        } else if (msg.type === 'CHAT') {
          setMessages(prev => [
            ...prev,
            { user: msg.payload.user, message: msg.payload.message }
          ]);
        } else if (msg.type === 'DRAW') {
          // DRAW events will be rendered in GameRoom via wsRef prop
        } else if (msg.type === 'VOTE_RESULT') {
          // handle vote results if needed
        } else if (msg.type === 'GAME_END') {
          // handle game end
        } else if (msg.type === 'SHOW_THEME') {
          setCurrentTheme(msg.payload.theme);
          setDrawingPhase(false);
          setGameStarted(true);
        } else if (msg.type === 'ROUND_START') {
          setDrawingPhase(true);
        } else if (msg.type === 'ROUND_END') {
          setDrawingPhase(false);
          setCurrentTheme('');
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      wsRef.current.onclose = (event) => {
        console.log('WebSocket closed:', event);
      };

      return () => wsRef.current?.close();
    }, [code]);

    function startGame() {
      console.log('Sending START_GAME on main WS');
      wsRef.current.send(JSON.stringify({ type: 'START_GAME' }));
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