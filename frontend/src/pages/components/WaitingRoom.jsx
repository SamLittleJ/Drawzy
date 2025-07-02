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
export default function WaitingRoom({ roomId, players = [], onStart, wsRef }) {

    // Hook: useNavigate
    // • Rol: Navigare programatică (Leave Room, Join Room).
    const navigate = useNavigate();

    // State-uri componentă
    // • chatInput: textul curent din câmpul de chat. 
    // • messages: lista mesajelor primite de la WebSocket.
    const [chatInput, setChatInput] = useState('');
    const [messages, setMessages] = useState([]);

    // Hook: useEffect pentru mesaje WS
    // • Rol: Înregistrează listener pentru mesajele de tip CHAT din WebSocket.
    // • Cleanup: Elimină listener la demontare.
    useEffect(() => {
      if (!wsRef?.current) return;
      const ws = wsRef.current;
      const handleMessage = e => {
        const msg = JSON.parse(e.data);
        if (msg.type === 'CHAT') {
          setMessages(prev => [...prev, msg.payload]);
        }
      };
      ws.addEventListener('message', handleMessage);
      return () => ws.removeEventListener('message', handleMessage);
    }, [wsRef]);

    // Funcție: sendChat
    // • Rol: Trimite mesajul curent prin WebSocket și golește câmpul de input.
    function sendChat() {
      if (chatInput.trim() && wsRef?.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'CHAT', payload: chatInput }));
        setChatInput('');
      }
    }

    // Render UI
    // • Rol: Afișează structura WaitingRoom: cod camere, jucători, butoane și chat.
    return (
      <div className={styles.wrapper}>
        <div className={styles.container}>
          <h2>Waiting Room</h2>
          <p>Room Code: {roomId}</p>
          <p>Players ready: {players.length}</p>

          {/* Secțiune Jucători */}
          {/* • Rol: Afișează avatarurile și username-urile participanților. */}
          <div className={styles.playersList}>
            {players.map((player) => (
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
                <div key={idx} className={styles.message}>{msg}</div>
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
            <button onClick={sendChat}>Send</button>
          </div>
        </div>
      </div>
    );
};