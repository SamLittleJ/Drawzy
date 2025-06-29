import React, {useState, useEffect, useRef} from 'react';
import {useParams} from 'react-router-dom';
import WaitingRoom from './components/WaitingRoom';
import GameRoom from './components/GameRoom';


export default function RoomPage() {
    const {code} = useParams();
    const chatWsRef = useRef(null);
    const gameWsRef = useRef(null);
    const [gameStarted, setGameStarted] = useState(false);
    const [players, setPlayers] = useState([{id:1, username: 'You', avatarUrl: null}]);
    const [messages, setMessages] = useState([]);
    const [currentTheme, setCurrentTheme] = useState('');
    const [drawingPhase, setDrawingPhase] = useState(false);

    const handleMessage = (event) => {
      const msg = JSON.parse(event.data);

      if (msg.type === 'PLAYER_JOIN') {
        setPlayers(prev => [
          ...prev,
          { id: msg.payload.userId, username: msg.payload.username, avatarUrl: msg.payload.avatarUrl }
        ]);
        return;
      }
      
      if (msg.type === 'CHAT') {
        setMessages(prev => [
          ...prev,
          { user: msg.payload.user, message: msg.payload.message }
        ]);
        return;
      }
    };

    useEffect(() =>{
        const token = localStorage.getItem('access_token');
        const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
        const host = "drawzy-backend-alb-409373296.eu-central-1.elb.amazonaws.com"
        chatWsRef.current = new WebSocket(`${protocol}://${host}/ws/${code}?token=${token}`);

        chatWsRef.current.onopen = () => {
            console.log('WebSocket connection established');
        }

        chatWsRef.current.onmessage = (event) =>{
            console.log("RoomPage received message:", event.data);
            handleMessage(event);
        }

        chatWsRef.current.onerror = (error) => {
            console.error('WebSocket error:', error);
        }

        chatWsRef.current.onclose = (event) => {
            console.log('WebSocket connection closed:', event);
        }

        return () => {
            if (chatWsRef.current){
                chatWsRef.current.close();
            }
        }
    }, [code]);

    useEffect(() => {
      const token = localStorage.getItem('access_token');
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const host = "drawzy-backend-alb-409373296.eu-central-1.elb.amazonaws.com";
      gameWsRef.current = new WebSocket(
        `${protocol}://${host}/game/ws/${code}?token=${token}`
      );

      gameWsRef.current.onopen = () => {
        console.log('Game WebSocket connection established');
      };

      gameWsRef.current.onmessage = (event) => {
        console.log("RoomPage game WS raw:", event.data);
        const msg = JSON.parse(event.data);

        if (msg.type === 'PLAYER_JOIN') {
            return;
        }

        if (msg.type === 'SHOW_THEME') {
          setCurrentTheme(msg.payload.theme);
          setDrawingPhase(false);
          setGameStarted(true);
        }
        if (msg.type === 'ROUND_START') {
          setDrawingPhase(true);
        }
        if (msg.type === 'ROUND_END') {
          setDrawingPhase(false);
          setCurrentTheme('');
        }
      };

      gameWsRef.current.onerror = (e) =>
        console.error("Game WebSocket error:", e);

      gameWsRef.current.onclose = (e) =>
        console.log("Game WebSocket closed:", e);

      return () => {
        if (gameWsRef.current) gameWsRef.current.close();
      };
    }, [code]);

    function startGame() {
        const ws = gameWsRef.current;
        console.log("Sending START_GAME on game WS, state:", ws?.readyState);
        if (ws?.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'START_GAME' }));
          console.log("START_GAME sent");
        } else {
          console.warn("Game WS not open, cannot send START_GAME");
        }
    }

    function sendMessage(message) {
        if (chatWsRef.current?.readyState === WebSocket.OPEN) {
            chatWsRef.current.send(JSON.stringify({
                type: 'CHAT',
                payload: { message }
            }))
        }
    }

    if(!gameStarted){
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
            messages={messages}
            onSendMessage={sendMessage}
            wsRef={chatWsRef}
            theme={currentTheme}
            drawingPhase={drawingPhase}
        />
    )


}