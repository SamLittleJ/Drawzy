import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import WaitingRoom from './components/WaitingRoom';
import GameRoom from './components/GameRoom';

export default function RoomPage(){
    const { code } = useParams();
    const wsRef = useRef(null);
    const [players, setPlayers] = useState([]);
    const [gameStarted, setGameStarted] = useState(false);

    useEffect(() =>{
        const token = localStorage.getItem('access_token');
        const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
        const host = 'drawzy-ws-nlb-a06e066743dd7e7d.elb.eu-central-1.amazonaws.com';
        const ws = new WebSocket(`${protocol}://${host}/ws/${code}?token=${token}`);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log('WebSocket connection established');
            ws.send(JSON.stringify({ type: 'PLAYER_JOIN', payload: {} }));
        }

        ws.onmessage = (event) =>{
            try {
                const msg = JSON.parse(event.data);
                if (msg.type === 'PLAYER_JOIN') {
                    setPlayers(prev => [...prev, msg.payload]);
                }
            } catch (e) {
                console.error('Error parsing WebSocket message:', e);
            }
        }

        ws.onerror = (e) => {
            console.error('WebSocket error:', e);
        }

        ws.onclose = (e) => {
            console.log('WebSocket closed', e.code, e.reason);
        }

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        }
    }, [code]);

    const startGame = () => {
        setGameStarted(true);
     }
    
     if (!gameStarted) {
        return (
            <WaitingRoom 
                roomId = {code}
                players = {players}
                onStart = {startGame}
            />
        )
     }

    return (
        <GameRoom 
            roomId = {code}
            players = {players}
        />
    );
}