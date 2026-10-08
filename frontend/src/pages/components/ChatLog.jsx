import React, { useEffect, useRef } from 'react';

import styles from './ChatLog.module.css';

// Chat lines and game notices, kept scrolled to the newest message.
export default function ChatLog({ messages, className, messageClassName }) {
  const logRef = useRef(null);

  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [messages.length]);

  return (
    <div ref={logRef} className={className} role="log" aria-label="Chat">
      {messages.map((msg, idx) =>
        msg.system ? (
          <div key={idx} className={`${messageClassName} ${styles.notice} ${styles[msg.tone] ?? ''}`}>
            {msg.text}
          </div>
        ) : (
          <div key={idx} className={messageClassName}>
            <strong>{msg.user}:</strong> {msg.message}
          </div>
        )
      )}
    </div>
  );
}
