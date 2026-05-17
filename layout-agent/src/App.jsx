import { useState, useCallback } from 'react';
import ChatPanel from './components/ChatPanel';
import CanvasPreview from './components/CanvasPreview';
import JsonViewer from './components/JsonViewer';
import { useLayoutAgent } from './hooks/useLayoutAgent';
import INITIAL_LAYOUT from './layoutData';
import styles from './App.module.css';

const INITIAL_MESSAGES = [
  { role: 'system', text: 'Design loaded — 1080×1080 canvas, 13 layers' },
  { role: 'assistant', text: 'Hi! I can transform your layout. Try asking me to convert the aspect ratio, move elements around, resize text, or reposition the offer badge.' },
];

export default function App() {
  const [layout, setLayout] = useState(INITIAL_LAYOUT);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [activeTab, setActiveTab] = useState('preview');
  const { transformLayout, isLoading } = useLayoutAgent();

  const handleSend = useCallback(async (text) => {
    setMessages((prev) => [...prev, { role: 'user', text }]);

    try {
      const { explanation, updatedLayout } = await transformLayout(layout, text);

      if (updatedLayout) {
        setLayout(updatedLayout);
        const artboard = updatedLayout.nodes['artboard_1778485662755_3'];
        const W = Math.round(artboard?.width || 0);
        const H = Math.round(artboard?.height || 0);
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', text: explanation },
          { role: 'system', text: `Canvas updated → ${W}×${H}px` },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', text: explanation + '\n\n(Note: Could not parse updated JSON — layout unchanged.)' },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: `Error: ${err.message}` },
      ]);
    }
  }, [layout, transformLayout]);

  function handleReset() {
    setLayout(INITIAL_LAYOUT);
    setMessages(INITIAL_MESSAGES);
  }

  return (
    <div className={styles.app}>
      <header className={styles.topbar}>
        <div className={styles.logo}>
          <span className={styles.logoMark}>◆</span>
          <span className={styles.logoText}>Compra</span>
          <span className={styles.logoDivider}>/</span>
          <span className={styles.logoSub}>Layout Agent</span>
        </div>
        <div className={styles.topbarRight}>
          <button className={styles.resetBtn} onClick={handleReset}>
            Reset
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <aside className={styles.sidebar}>
          <ChatPanel
            messages={messages}
            onSend={handleSend}
            isLoading={isLoading}
          />
        </aside>

        <section className={styles.canvas}>
          <div className={styles.canvasHeader}>
            <div className={styles.tabs}>
              <button
                className={`${styles.tab} ${activeTab === 'preview' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('preview')}
              >
                Preview
              </button>
              <button
                className={`${styles.tab} ${activeTab === 'json' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('json')}
              >
                JSON
              </button>
            </div>
            <div className={styles.canvasInfo}>
              {(() => {
                const ab = layout.nodes['artboard_1778485662755_3'];
                return `${Math.round(ab?.width)}×${Math.round(ab?.height)}`;
              })()}
            </div>
          </div>

          <div className={styles.canvasBody}>
            {activeTab === 'preview' ? (
              <div className={styles.previewWrap}>
                <CanvasPreview layout={layout} />
              </div>
            ) : (
              <JsonViewer layout={layout} />
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
