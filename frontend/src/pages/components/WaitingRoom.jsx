import React from 'react';
import { useNavigate } from 'react-router-dom';

import ChatInput from './ChatInput';
import ChatLog from './ChatLog';
import styles from './WaitingRoom.module.css';

const MIN_PLAYERS = 2;

export default function WaitingRoom({ roomCode, players = [], messages = [], onStart, onSendChat }) {
  const navigate = useNavigate();
  const canStart = players.length >= MIN_PLAYERS;

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
        <p className={styles.rules}>
          Take turns drawing a secret word while the others guess it in the chat. Faster guesses score more!
        </p>
        <button className={styles.startButton} onClick={onStart} disabled={!canStart}>
          Start Game
        </button>
        {!canStart && <p className={styles.rules}>Waiting for at least {MIN_PLAYERS} players...</p>}
        <button className={styles.leaveButton} onClick={() => navigate('/lobby')}>
          Leave Room
        </button>
      </div>

      <div className={styles.chatWrapper}>
        <div className={styles.chatSection}>
          <h3>Chat</h3>
          <ChatLog messages={messages} className={styles.messages} messageClassName={styles.message} />
        </div>
        <ChatInput className={styles.inputArea} onSend={onSendChat} />
      </div>
    </div>
  );
}
