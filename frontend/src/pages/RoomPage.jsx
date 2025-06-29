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

    const handleMessage = (event) => {
      const msg = JSON.parse(event.data);

      if (msg.type === 'PLAYER_JOIN') {
        setPlayers(prev => [
          ...prev,
          { id: msg.payload.userId, username: msg.payload.username, avatarUrl: msg.payload.avatarUrl }
        ]);
        return;
      }
      if (msg.type === 'SHOW_THEME') {
        setCurrentTheme(msg.payload.theme);
        setDrawingPhase(false);
        setGameStarted(true);
        return;
      }
      if (msg.type === 'ROUND_START') {
        setDrawingPhase(true);
        return;
      }
      if (msg.type === 'ROUND_END') {
        setCurrentTheme('');
        setDrawingPhase(false);
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
        wsRef.current = new WebSocket(`${protocol}://${host}/game/ws/${code}?token=${token}`);

        wsRef.current.onopen = () => {
            console.log('WebSocket connection established');
        }

        wsRef.current.onmessage = handleMessage;

        return () => {
            if (wsRef.current){
                wsRef.current.close();
            }
        }
    }, [code]);

    function startGame() {
        const ws = wsRef.current;
        if(ws?.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({type: 'START_GAME'}));
            console.log("START_GAME event sent");   
            setGameStarted(true);
        } else {
            console.warn("WebSocket is not open. Cannot send START_GAME event.");
        }
    }

    function sendMessage(message) {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
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
            wsRef={wsRef}
            theme={currentTheme}
            drawingPhase={drawingPhase}
        />
    )


}