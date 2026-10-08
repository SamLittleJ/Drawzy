import React, { useState } from 'react';

export default function ChatInput({ onSend, className, placeholder = 'Type a message...' }) {
  const [text, setText] = useState('');

  const submit = () => {
    const message = text.trim();
    if (!message) return;
    onSend(message);
    setText('');
  };

  return (
    <div className={className}>
      <input
        type="text"
        aria-label="Chat message"
        placeholder={placeholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
      />
      <button onClick={submit}>Send</button>
    </div>
  );
}
