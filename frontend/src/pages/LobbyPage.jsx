import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api'; // Assuming you have an api.js file for API calls
import styles from './LobbyPage.module.css';

export default function LobbyPage(){
    const [code, setCode] = useState('');
    const [maxPlayers, setMaxPlayers] = useState(6);
    const [roundTime, setRoundTime] = useState(60);
    const nav = useNavigate();
    const [rooms, setRooms] = useState([]);

    useEffect(() => {
        const loadRooms = async () =>{
            try {
                const resp = await api.fetchRooms();
                setRooms(resp.data);
            } catch (err) {
                console.error("Failed to fetch rooms", err);
            }
        };
        loadRooms();
    }, []);

   
    const createRoom = async () => {
        try {
            const resp = await api.createRoom ({max_players: maxPlayers, round_time: roundTime});
            nav(`/rooms/${resp.data.code}`);
        } catch (err) {
            console.error("Failed to create room", err);
        }
    }

    const joinRoomByCode = () => {
        if (code.trim()){
            nav(`/rooms/${code.trim()}`);
        }
    }

    const logout = () => {
        localStorage.removeItem('access_token');
        nav('/login');
    }
    

    return (
        <div className={styles.container}>
            <h1>Lobby</h1>
            <div className={styles.section}>
                <h2>Create Room</h2>
                <div className={styles.formRow}>
                    <label className={styles.label} htmlFor="maxPlayers">Max Players:</label>
                    <input
                        id="maxPlayers"
                        type="number"
                        className={styles.input}
                        value={maxPlayers}
                        onChange={e => setMaxPlayers(Number(e.target.value))}
                    />
                </div>
                <div className={styles.formRow}>
                    <label className={styles.label} htmlFor="roundTime">Round Time (seconds):</label>
                    <input
                        id="roundTime"
                        type="number"
                        className={styles.input}
                        value={roundTime}
                        onChange={e => setRoundTime(Number(e.target.value))}
                    />
                </div>
                <button className={styles.button} onClick={createRoom}>Create Room</button>
            </div>
            <div className={styles.section}>
                <h2>Join Room</h2>
                <div className={styles.formRow}>
                    <label className={styles.label} htmlFor="roomCode">Room Code:</label>
                    <input
                        id="roomCode"
                        type="text"
                        className={styles.input}
                        placeholder="Enter room code"
                        value={code}
                        onChange={e => setCode(e.target.value)}
                    />
                    <button className={styles.button} onClick={joinRoomByCode}>Join Room</button>
                </div>
            </div>
            <h2>Available Rooms</h2>
            <ul className={styles.list}>
                {rooms.map(room => (
                    <li key={room.code} className={styles.listItem}>
                        Code: {room.code} | Players: {room.current_players}/{room.max_players} | Time: {room.round_time}s
                        <button className={styles.button} onClick={() => nav(`/rooms/${room.code}`)}>Join</button>
                        </li>
                ))}
            </ul>
            <button className={`${styles.button} ${styles.logoutButton}`} onClick={logout}>Logout</button>
        </div>
    )
}