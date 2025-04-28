import React from  'react';

export default function RoomSelector({code, onCodeChange, onJoinQueue, onCreatePrivate, onJoinPrivate}) {
    return (
        <div>
            <button onClick={onJoinQueue}>Join Public Queue</button>
            <button onClick={onCreatePrivate}>Create Private Room</button>
            <div>
                <input
                    placeholder="Enter room code"
                    value={code}
                    onChange={e => onCodeChange(e.target.value)}
                    />
                <button onClick={onJoinPrivate}>Join Room</button>
            </div>
        </div>
    )
}