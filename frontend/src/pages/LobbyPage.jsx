// Import React și hook-urile necesare
// • Rol: React pentru JSX; useState pentru gestionarea stărilor locale; useEffect pentru efecte secundare (încarcarea datelor).
import React, { useState, useEffect } from 'react';

// Import React Router
// • Rol: useNavigate pentru navigare programatică între pagini.
import { useNavigate } from 'react-router-dom';

// Import API client
// • Rol: Funcții pentru apeluri HTTP către backend (preluare și creare camere).
import api from '../api';

// Import stiluri CSS module
// • Rol: Clase CSS izolate pentru stilizarea componentei lobby.
import styles from './LobbyPage.module.css';

// Componentă: LobbyPage
// • Rol: Pagina principală de lobby, permite crearea și alăturarea la camere.
// • Motiv: Centralizează opțiunile de configurare a camerei și lista camerelor disponibile.
// • Alternative: Putea fi separată în componente mai mici pentru form și listă.
export default function LobbyPage(){
    // State-uri componentă
    // • Rol: Stochează valorile pentru cod, setările camerei și lista de camere.
    const [code, setCode] = useState('');
    const [maxPlayers, setMaxPlayers] = useState(6);
    const [roundTime, setRoundTime] = useState(60);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [isPublic, setIsPublic] = useState(false);
    const [maxRounds, setMaxRounds] = useState(5);
    const [targetScore, setTargetScore] = useState(100);
    const nav = useNavigate();
    const [rooms, setRooms] = useState([]);

    // Hook: useEffect pentru încărcarea camerelor
    // • Rol: Preia lista de camere de la backend la montarea componentei.
    // • Alternative: Utilizarea SWR sau React Query pentru caching și revalidare.

    const loadRooms = async () => {
        try {
            const resp = await api.fetchRooms();
            setRooms(resp.data);
        } catch (err) {
            console.error("Failed to load rooms", err);
        }
    }

    useEffect(() => {
        loadRooms();
    }, []);

    // Funcție: createRoom
    // • Rol: Trimite solicitarea de creare a unei camere cu parametrii selectați.
    // • Observații: Redirecționează utilizatorul în camera nou creată.
    const createRoom = async () => {
        try {
            const resp = await api.createRoom({
                max_players: maxPlayers,
                round_time: roundTime,
                max_rounds: maxRounds,
                target_score: targetScore,
                is_public: isPublic
            });
            nav(`/rooms/${resp.data.code}`);
        } catch (err) {
            console.error("Failed to create room", err);
        }
    }

    // Funcție: joinRoomByCode
    // • Rol: Navighează către camera specificată prin cod introdus manual.
    // • Observații: Ignoră coduri goale.
    const joinRoomByCode = () => {
        if (code.trim()){
            nav(`/rooms/${code.trim()}`);
        }
    }

    // Funcție: logout
    // • Rol: Șterge token-ul de autentificare și redirecționează la pagina de login.
    const logout = () => {
        localStorage.removeItem('access_token');
        nav('/login');
    }

    // Render UI
    // • Rol: Afișează interfața lobby-ului: buton de creare cameră, form de configurare, listă camere și buton logout.
    return (
        <div className={styles.container}>
            <h1>Lobby</h1>
            {/* Join existing room by code */}
            <div className={styles.section}>
                <h2>Join Room</h2>
                <div className={styles.formRow}>
                    <input
                        type="text"
                        placeholder="Enter room code"
                        value={code}
                        className={styles.input}
                        onChange={e => setCode(e.target.value)}
                    />
                    <button
                        className={styles.button}
                        onClick={joinRoomByCode}
                    >
                        Join
                    </button>
                </div>
            </div>
            <div className={styles.section}>
                {!showCreateForm ? (
                    <button className={styles.button} onClick={() => setShowCreateForm(true)}>
                        Create Room
                    </button>
                ) :(
                    <>
                    <h2>Create Room</h2>
                    <div className={styles.formRow}>
                        <label className={styles.label} htmlFor="maxPlayers">
                            Max Players:
                        </label>
                        <input
                            id="maxPlayers"
                            type="number"
                            value={maxPlayers}
                            className={styles.input}
                            onChange={e => setMaxPlayers(Number(e.target.value))}
                        />
                    </div>

                    <div className={styles.formRow}>
                        <label className={styles.label} htmlFor="roundTime">
                            Round Time (seconds):
                        </label>
                        <input
                            id="roundTime"
                            type="number"
                            value={roundTime}
                            className={styles.input}
                            onChange={e => setRoundTime(Number(e.target.value))}
                        />
                    </div>

                    <div className={styles.formRow}>
                        <label className={styles.label} htmlFor="maxRounds">
                            Max Rounds:
                        </label>
                        <input
                            id="maxRounds"
                            type="number"
                            value={maxRounds}
                            className={styles.input}
                            onChange={e => setMaxRounds(Number(e.target.value))}
                        />
                    </div>

                    <div className={styles.formRow}>
                        <label className={styles.label} htmlFor="targetScore">
                            Target Score:
                        </label>
                        <input
                            id="targetScore"
                            type="number"
                            value={targetScore}
                            className={styles.input}
                            onChange={e => setTargetScore(Number(e.target.value))}
                        />
                    </div>

                    <div className={styles.formRow}>
                        <label className={styles.label} htmlFor="isPublic">
                            Public:
                        </label>
                        <select
                            id="isPublic"
                            className={styles.input}
                            value={isPublic}
                            onChange={e => setIsPublic(e.target.value === 'true')}
                        >
                            <option value="true">Yes</option>
                            <option value="false">No</option>
                        </select>
                    </div>

                    <div className={styles.formActions}>
                        <button className={styles.button} onClick={createRoom}>
                            Submit
                        </button>
                        <button className={styles.button} onClick={() => setShowCreateForm(false)}>
                            Cancel
                        </button>
                    </div>
                    </>
                )
            }
            </div>

            <div className={styles.section}>
                <h2>Available Rooms</h2>
                <button className={styles.button} onClick={loadRooms}>
                    Refresh
                </button>
                <ul className={styles.list}>
                    {rooms.map(room => (
                        <li key={room.code} className={styles.listItem}>
                            Code: {room.code} | Players: {room.current_players}/{room.max_players} | Time: {room.round_time}s
                            <button className={styles.button} onClick={() => nav(`/rooms/${room.code}`)}>
                                Join
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

            <button className={`${styles.button} ${styles.logoutButton}`} onClick={logout}>
                    Logout
            </button>
        </div>        
    )
}