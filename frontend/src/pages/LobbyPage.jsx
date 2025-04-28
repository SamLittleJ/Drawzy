import React, { useState } from 'react';
import RoomSelector from '../components/RoomSelector';
import { useNavigate } from 'react-router-dom';

export default function LobbyPage(){
    const [code, setCode] = useState('');
    const nav = useNavigate();

    const joinQueue = () => {/* TODO */};
    const createPrivate = () => {/* TODO */};
    const joinPrivate = () => {/* TODO */};
    const logout = () => {
        localStorage.removeItem('token');
        nav('/login');
    }

    return (
        <div>
            <h1>Welcome to Drawzy</h1>
            <RoomSelector
                code={code}
                onCodeChange={setCode}
                onJoinQueue={joinQueue}
                onCreatePrivate={createPrivate}
                onJoinPrivate={joinPrivate}
            />
        </div>
    )
}