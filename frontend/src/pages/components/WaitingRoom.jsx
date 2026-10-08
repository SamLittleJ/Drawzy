import React from 'react';
import { useNavigate } from 'react-router-dom';

import ChatInput from './ChatInput';
import styles from './WaitingRoom.module.css';

export default function WaitingRoom({ roomCode, players = [], messages = [], onStart, onSendChat }) {
  const navigate = useNavigate();

  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        <h2>Waiting Room</h2>
        <p>Room Code: {roomCode}</p>
        <p>Players ready: {players.length}</p>

        <div className={styles.playersList}>
          {players.map((player) => (
            <div key={player.id} className={styles.playerItem}>
              <span className={styles.username}>{player.username}</span>
            </div>
          ))}
        </div>
        <button className={styles.startButton} onClick={onStart}>
          Start Game
        </button>
        <button className={styles.leaveButton} onClick={() => navigate('/lobby')}>
          Leave Room
        </button>
      </div>

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
        <ChatInput className={styles.inputArea} onSend={onSendChat} />
      </div>
    </div>
  );
}
