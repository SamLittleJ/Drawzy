// Import React și hook-uri
// • Rol: React pentru JSX; useState pentru stări locale; useEffect pentru efecte secundare.
import React, { useState, useEffect } from 'react';

// Import useNavigate din React Router
// • Rol: Permite navigarea programatică între pagini (Lobby etc.).
import { useNavigate } from 'react-router-dom';

// Import CSS module
// • Rol: Clase CSS izolate pentru stilurile componentei WaitingRoom.
import styles from './WaitingRoom.module.css';

// Componentă: WaitingRoom
// • Rol: Afișează sala de așteptare, lista jucătorilor și chat-ul.
// • Motiv: Centralizează logica UI și integrarea WebSocket.
export default function WaitingRoom({ roomId, players = [], onStart, messages = [], onSend }) {

    // Hook: useNavigate
    // • Rol: Navigare programatică (Leave Room, Join Room).
    const navigate = useNavigate();

    // State-uri componentă
    // • chatInput: textul curent din câmpul de chat. 
    const [chatInput, setChatInput] = useState('');

    // Local copy of players list, synced via WS
    const [playerList, setPlayerList] = useState(players);

    // Sync initial and updated players prop into local list
    useEffect(() => {
      setPlayerList(players);
    }, [players]);

    // Sync PLAYER_JOIN events from WS into local players list
    useEffect(() => {
      // This effect is removed because wsRef is no longer passed, so no WS listeners here.
    }, []);

    // Render UI
    // • Rol: Afișează structura WaitingRoom: cod camere, jucători, butoane și chat.
    return (
      <div className={styles.wrapper}>
        <div className={styles.container}>
          <h2>Waiting Room</h2>
          <p>Room Code: {roomId}</p>
          <p>Players ready: {playerList.length}</p>

          {/* Secțiune Jucători */}
          {/* • Rol: Afișează avatarurile și username-urile participanților. */}
          <div className={styles.playersList}>
            {playerList.map((player) => (
              <div key={player.id} className={styles.playerItem}>
                {player.avatarUrl && (
                  <img src={player.avatarUrl} alt={player.username} className={styles.avatar} />
                )}
                <span className={styles.username}>{player.username}</span>
              </div>
            ))}
          </div>
          <button className={styles.startButton} onClick={onStart}>
            Start Game
          </button>
          <button
            className={styles.leaveButton}
            onClick={() => navigate('/lobby')}
          >
            Leave Room
          </button>
        </div>
        
        {/* Secțiune Chat */}
        {/* • Rol: Afișează lista de mesaje și zona de input pentru chat. */}
        <div className={styles.chatWrapper}>
          <div className={styles.chatSection}>
            <h3>Chat</h3>
            <div className={styles.messages}>
              {messages.map((msg, idx) => (
                <div key={idx} className={styles.message}>
                  <strong>{msg.user}: </strong>
                  {msg.message}
                </div>
              ))}
            </div>
          </div>
          <div className={styles.inputArea}>
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              placeholder="Type a message..."
            />
            <button onClick={() => { onSend(chatInput); setChatInput(''); }}>
              Send
            </button>
          </div>
        </div>
      </div>
    );
};