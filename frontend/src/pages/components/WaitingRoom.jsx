import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './WaitingRoom.module.css';

export default function WaitingRoom({ roomId, players = [], onStart, wsRef }) {
    const navigate = useNavigate();
    const [chatInput, setChatInput] = useState('');
    const [messages, setMessages] = useState([]);

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

    function sendChat() {
      if (chatInput.trim() && wsRef?.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'CHAT', payload: chatInput }));
        setChatInput('');
      }
    }

    return (
      <div className={styles.wrapper}>
        <div className={styles.container}>
          <h2>Waiting Room</h2>
          <p>Room Code: {roomId}</p>
          <p>Players ready: {players.length}</p>
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
        {/* Chat wrapper containing chat box and input */}
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