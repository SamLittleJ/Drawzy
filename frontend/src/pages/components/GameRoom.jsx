import React from 'react';

export default function GameRoom({ roomId, players }) {
  return (
    <div>
      <h1>Game Room: {roomId}</h1>
      <h2>Players:</h2>
      <ul>
        {players.map((p, idx) => (
          <li key={idx}>{p.username}</li>
        ))}
      </ul>
      <p>The game has started!</p>
    </div>
  );
}