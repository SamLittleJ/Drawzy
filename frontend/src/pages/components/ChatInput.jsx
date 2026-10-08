import React, { useState } from 'react';

export default function ChatInput({ onSend, className }) {
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
        placeholder="Type a message..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
      />
      <button onClick={submit}>Send</button>
    </div>
  );
}
