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

    useEffect(() => {
      const token = localStorage.getItem('access_token');
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const host = "drawzy-backend-alb-409373296.eu-central-1.elb.amazonaws.com";
      wsRef.current = new WebSocket(`${protocol}://${host}/ws/${code}?token=${token}`);

      wsRef.current.onopen = () => {
        console.log('Unified WS connected');
        // Announce this client has joined
        wsRef.current.send(JSON.stringify({ type: 'PLAYER_JOIN' }));
      };

      wsRef.current.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === 'PLAYER_JOIN') {
          setPlayers(prev => [...prev, msg.payload]);
        }
      };

      wsRef.current.onerror = (event) => {
        // Suppress protocol error 1002 (idle timeout)
        if (event?.code && event.code !== 1002) {
          console.error('Unified WS error event:', event);
        } else {
          console.debug('Unified WS protocol error (1002) suppressed.');
        }
      };

      wsRef.current.onclose = (e) => {
        if (e.code === 1002) {
          console.log('Unified WS closed with code 1002 (protocol error), likely idle timeout.');
        } else {
          console.warn('Unified WS closed', e.code, e.reason);
        }
      };

      return () => {
        if (wsRef.current) {
          wsRef.current.close();
        }
      };
    }, [code]);

    function startGame() {
        console.log('Starting game in room', code);
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        console.log('Sending START_GAME message');
        wsRef.current.send(JSON.stringify({ type: 'START_GAME' }));
        console.log('START_GAME sent; awaiting server response');
      }
      // setGameStarted(true);
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