import { useState, useRef, useEffect } from 'react';
import styles from './ChatPanel.module.css';

const SUGGESTIONS = [
  'Convert this design to 9:16',
  'Move the headline to the top',
  'Keep the product large',
  'Move the offer badge higher',
  'Make the headline smaller',
  'Make the headline bigger',
];

export default function ChatPanel({ messages, onSend, isLoading }) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  function handleSend() {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');
    onSend(text);
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function fillSuggestion(text) {
    setInput(text);
    textareaRef.current?.focus();
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.headerDot} />
        <span className={styles.headerTitle}>Layout Agent</span>
        <span className={styles.headerSub}>1080×1080 · 13 layers</span>
      </div>

      <div className={styles.messages}>
        {messages.map((msg, i) => (
          <div key={i} className={`${styles.msg} ${styles[msg.role]}`}>
            {msg.role === 'system' && (
              <span className={styles.systemLabel}>system</span>
            )}
            <span className={styles.msgText}>{msg.text}</span>
          </div>
        ))}
        {isLoading && (
          <div className={`${styles.msg} ${styles.assistant}`}>
            <span className={styles.typing}>
              <span />
              <span />
              <span />
            </span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className={styles.suggestions}>
        {SUGGESTIONS.map((s) => (
          <button key={s} className={styles.chip} onClick={() => fillSuggestion(s)}>
            {s}
          </button>
        ))}
      </div>

      <div className={styles.inputRow}>
        <textarea
          ref={textareaRef}
          className={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="e.g. Convert to 9:16, move badge higher..."
          rows={2}
          disabled={isLoading}
        />
        <button
          className={styles.sendBtn}
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          aria-label="Send"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
}
