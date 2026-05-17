import { useState } from 'react';
import styles from './JsonViewer.module.css';

export default function JsonViewer({ layout }) {
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState(new Set());

  const jsonStr = JSON.stringify(layout, null, 2);

  function copyJson() {
    navigator.clipboard.writeText(jsonStr).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function downloadJson() {
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'layout.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  const artboard = layout?.nodes?.['artboard_1778485662755_3'];
  const W = artboard?.width || 1080;
  const H = artboard?.height || 1080;
  const nodeCount = Object.keys(layout?.nodes || {}).length;

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <div className={styles.stats}>
          <span className={styles.stat}>{W}×{H}px</span>
          <span className={styles.sep}>·</span>
          <span className={styles.stat}>{nodeCount} nodes</span>
        </div>
        <div className={styles.actions}>
          <button className={styles.btn} onClick={copyJson}>
            {copied ? (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Copied
              </>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                Copy
              </>
            )}
          </button>
          <button className={styles.btn} onClick={downloadJson}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download
          </button>
        </div>
      </div>
      <pre className={styles.code}>{jsonStr}</pre>
    </div>
  );
}
