import React from 'react';
import styles from './WaitingRoom.module.css';

export default function WaitingRoom({roomId, players = [], onStart}) {
    return (
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
        </div>
    )
};