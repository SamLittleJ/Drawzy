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
    const [currentTheme, setCurrentTheme] = useState('null');
    const [drawingPhase, setDrawingPhase] = useState(false);

    useEffect(() =>{
        const token = localStorage.getItem('access_token');
        const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
        const host = "drawzy-backend-alb-409373296.eu-central-1.elb.amazonaws.com"
        wsRef.current = new WebSocket(`${protocol}://${host}/ws/${code}?token=${token}`);

        wsRef.current.onopen = () => {
            console.log('WebSocket connection established');
        }

        wsRef.current.onmessage = (event) => {
            const msg = JSON.parse(event.data);

            if(msg.type === 'PLAYER_JOIN') {
                setPlayers(prev => [...prev, {id: msg.payload.id, username: msg.payload.username, avatarUrl: msg.payload.avatarUrl}]);
                return;
            }
            if(msg.type === 'SHOW_THEME'){
                setCurrentTheme(msg.payload.theme);
                setGameStarted(true);
                return;
            }

            if(msg.type === 'ROUND_START') {
                setDrawingPhase(true);
                return;
            }

            if(msg.type === 'ROUND_END') {
                setCurrentTheme('');
                setDrawingPhase(false);
                return;
            }

            if(msg.type === 'CHAT') {
                setMessages(prev => [...prev, {user: msg.payload.username, message: msg.payload.text}]);
            }
            if(msg.type === 'DRAW') {

            }
    }
        return () => {
            if (wsRef.current){
                wsRef.current.close();
            }
        }
}, [code]);

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
                onStart={() => wsRef.current.send(JSON.stringify({type: 'START_GAME'}))}
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