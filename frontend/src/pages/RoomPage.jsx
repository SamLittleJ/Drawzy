import React, {useState, useEffect, useRef} from 'react';
import {useParams} from 'react-router-dom';
import WaitingRoom from './components/WaitingRoom';
import GameRoom from './components/GameRoom';


export default function RoomPage() {
    const {code} = useParams();
    const chatWsRef = useRef(null);
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

    function startGame() {
        
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