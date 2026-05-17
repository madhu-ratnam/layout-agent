import { useEffect, useRef, useCallback } from 'react';

const imageCache = {};

function loadImage(url) {
  if (imageCache[url]) return imageCache[url];
  const img = new Image();
  img.crossOrigin = 'anonymous';
  imageCache[url] = img;
  img.src = url;
  return img;
}

export default function CanvasPreview({ layout, style }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !layout) return;
    const ctx = canvas.getContext('2d');
    const artboard = layout.nodes['artboard_1778485662755_3'];
    if (!artboard) return;

    const W = artboard.width;
    const H = artboard.height;
    const containerW = canvas.parentElement?.offsetWidth || 400;
    const scale = containerW / W;
    const canvasH = Math.round(H * scale);

    canvas.width = containerW;
    canvas.height = canvasH;

    ctx.fillStyle = artboard.data?.backgroundColor || '#fff';
    ctx.fillRect(0, 0, containerW, canvasH);

    const drawOrder = artboard.children || [];
    let needsRedraw = false;

    drawOrder.forEach((id) => {
      const node = layout.nodes[id];
      if (!node) return;
      const x = node.x * scale;
      const y = node.y * scale;
      const w = node.width * scale;
      const h = node.height * scale;

      if (node.type === 'image') {
        const img = loadImage(node.data.sourceUrl);
        if (img.complete && img.naturalWidth > 0) {
          ctx.save();
          ctx.beginPath();
          ctx.rect(x, y, w, h);
          ctx.clip();
          ctx.drawImage(img, x, y, w, h);
          ctx.restore();
        } else {
          ctx.fillStyle = '#1e1e1e';
          ctx.fillRect(x, y, w, h);
          ctx.fillStyle = '#444';
          ctx.font = `${Math.max(9, 11 * scale)}px DM Mono, monospace`;
          ctx.fillText(node.name.substring(0, 14), x + 4, y + 16 * scale);
          if (!img.onload) {
            img.onload = () => { needsRedraw = true; };
          }
          needsRedraw = true;
        }
      } else if (node.type === 'shape' && node.data?.shapeType === 'circle') {
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
        ctx.fillStyle = node.style?.visual?.fill?.value || '#F4CF1B';
        ctx.fill();
      } else if (node.type === 'text') {
        const fs = Math.max(8, (node.style?.visual?.fontSize || 16) * scale);
        const fw = node.style?.visual?.fontWeight || 400;
        const fi = node.style?.visual?.fontStyle === 'italic' ? 'italic ' : '';
        const ff = node.style?.visual?.fontFamily || 'Arial';
        ctx.font = `${fi}${fw} ${fs}px ${ff}`;
        ctx.fillStyle = '#ffffff';
        ctx.textBaseline = 'top';
        const lines = node.data.content.split('\n');
        lines.forEach((line, i) => {
          ctx.fillText(line.trim(), x, y + i * fs * 1.25);
        });
      }
    });

    if (needsRedraw) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        setTimeout(draw, 200);
      });
    }
  }, [layout]);

  useEffect(() => {
    draw();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [draw]);

  useEffect(() => {
    const handleResize = () => draw();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        width: '100%',
        borderRadius: '6px',
        ...style,
      }}
    />
  );
}
