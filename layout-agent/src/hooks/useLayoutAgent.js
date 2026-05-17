import { useState, useRef } from 'react';

// ─── Pure JS transformations (no API needed for these) ───────────────────────

function syncNormalized(node, W, H) {
  node.nx = node.x / W;
  node.ny = node.y / H;
  node.nw = node.width / W;
  node.nh = node.height / H;
  return node;
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function applyTransform(layout, instruction) {
  const cmd = instruction.toLowerCase();
  const result = deepClone(layout);
  const ab = result.nodes['artboard_1778485662755_3'];
  const W = ab.width;
  const H = ab.height;
  const nodes = result.nodes;

  // Helper to move a node by id
  function moveNode(id, newX, newY) {
    if (!nodes[id]) return;
    nodes[id].x = newX;
    nodes[id].y = newY;
    syncNormalized(nodes[id], ab.width, ab.height);
  }
  function resizeNode(id, newW, newH) {
    if (!nodes[id]) return;
    nodes[id].width = newW;
    nodes[id].height = newH;
    syncNormalized(nodes[id], ab.width, ab.height);
  }

  // ── Convert to 9:16 ──────────────────────────────────────────────────────
  if (cmd.includes('9:16') || cmd.includes('9 16') || cmd.includes('portrait') || cmd.includes('phone')) {
    const newW = 1080, newH = 1920;
    ab.width = newW; ab.height = newH;

    // Background covers full canvas
    const bg = nodes['img_1778485681535_4'];
    bg.x = 0; bg.y = 0; bg.width = newW; bg.height = newH;
    syncNormalized(bg, newW, newH);

    // Reposition all other nodes using normalized coords scaled to new canvas
    Object.values(nodes).forEach(n => {
      if (n.id === 'artboard_1778485662755_3' || n.id === 'img_1778485681535_4') return;
      n.x = n.nx * newW;
      n.y = n.ny * newH;
      n.width = n.nw * newW;
      n.height = n.nh * newH;
      syncNormalized(n, newW, newH);
    });

    // Spread elements nicely in taller canvas
    // Stars row at top
    ['img_1778486846247_10','img_1778486856821_11','img_1778487081392_12','img_1778487101466_13','img_1778487110538_14'].forEach(id => {
      if (nodes[id]) { nodes[id].y = 80; syncNormalized(nodes[id], newW, newH); }
    });
    if (nodes['text_1778486552508_9']) { moveNode('text_1778486552508_9', nodes['text_1778486552508_9'].x, 80); }

    // Headline
    moveNode('text_1778486306230_8', 60, 160);
    // Subheadline
    moveNode('text_1778486136643_7', nodes['text_1778486136643_7'].x, 480);
    // Badge (circle + text)
    moveNode('circle_1778488914968_15', 80, 580);
    moveNode('text_1778489078397_16', 103, 600);
    // Product image — large in middle
    nodes['img_1778489515746_17'].x = 40;
    nodes['img_1778489515746_17'].y = 820;
    nodes['img_1778489515746_17'].width = 1000;
    nodes['img_1778489515746_17'].height = 700;
    syncNormalized(nodes['img_1778489515746_17'], newW, newH);
    // Limited time offer at bottom
    moveNode('text_1778486004640_6', nodes['text_1778486004640_6'].x, 1780);

    return { layout: result, explanation: 'Converted canvas from 1:1 to 9:16 (1080×1920) and repositioned all elements for the taller portrait format.' };
  }

  // ── Move headline to top ─────────────────────────────────────────────────
  if (cmd.includes('headline') && cmd.includes('top')) {
    moveNode('text_1778486306230_8', nodes['text_1778486306230_8'].x, 30);
    return { layout: result, explanation: 'Moved the main headline to the top of the canvas (y=30px).' };
  }

  // ── Keep product large ───────────────────────────────────────────────────
  if (cmd.includes('product') && (cmd.includes('large') || cmd.includes('big') || cmd.includes('keep'))) {
    const p = nodes['img_1778489515746_17'];
    p.x = 40; p.y = 520; p.width = 1000; p.height = 520;
    syncNormalized(p, W, H);
    return { layout: result, explanation: 'Enlarged the product image to 1000×520px and centered it on the canvas.' };
  }

  // ── Move offer badge higher ──────────────────────────────────────────────
  if ((cmd.includes('badge') || cmd.includes('offer') || cmd.includes('20%')) && (cmd.includes('high') || cmd.includes('up') || cmd.includes('move'))) {
    const dy = -120;
    ['circle_1778488914968_15', 'text_1778489078397_16'].forEach(id => {
      if (nodes[id]) { nodes[id].y = Math.max(20, nodes[id].y + dy); syncNormalized(nodes[id], W, H); }
    });
    return { layout: result, explanation: 'Moved the offer badge (yellow circle and 20% OFF text) 120px higher.' };
  }

  // ── Make headline smaller ────────────────────────────────────────────────
  if (cmd.includes('headline') && (cmd.includes('small') || cmd.includes('reduc') || cmd.includes('shrink'))) {
    const t = nodes['text_1778486306230_8'];
    t.style.visual.fontSize = Math.round(t.style.visual.fontSize * 0.7);
    t.fontSizeRatio = t.style.visual.fontSize / W;
    return { layout: result, explanation: `Reduced headline font size to ${t.style.visual.fontSize}px (70% of original).` };
  }

  // ── Make headline bigger ─────────────────────────────────────────────────
  if (cmd.includes('headline') && (cmd.includes('big') || cmd.includes('larg') || cmd.includes('increas'))) {
    const t = nodes['text_1778486306230_8'];
    t.style.visual.fontSize = Math.round(t.style.visual.fontSize * 1.3);
    t.fontSizeRatio = t.style.visual.fontSize / W;
    return { layout: result, explanation: `Increased headline font size to ${t.style.visual.fontSize}px (130% of original).` };
  }

  // ── Reset / restore ──────────────────────────────────────────────────────
  if (cmd.includes('reset') || cmd.includes('original') || cmd.includes('undo')) {
    return { layout: null, explanation: 'Use the Reset button at the top right to restore the original layout.' };
  }

  return null; // not handled locally — fall through to AI
}

// ─── AI fallback for unknown instructions ─────────────────────────────────────

const AI_SYSTEM = `You are a layout agent. Given a short instruction and canvas size, output ONLY a JSON patch like:
{"nodeId": "text_1778486306230_8", "changes": {"x": 100, "y": 50, "fontSize": 60}}

You can patch multiple nodes: return a JSON array of patch objects.
Each patch: {"nodeId": "...", "changes": {"x":N, "y":N, "width":N, "height":N, "fontSize":N}}
Only include fields that change. No explanation, no markdown, just the JSON array.`;

export function useLayoutAgent() {
  const [isLoading, setIsLoading] = useState(false);
  const historyRef = useRef([]);

  async function transformLayout(currentLayout, userInstruction) {
    setIsLoading(true);

    try {
      // Try local transform first (no API needed)
      const local = applyTransform(currentLayout, userInstruction);
      if (local) {
        historyRef.current.push({ role: 'user', content: userInstruction });
        historyRef.current.push({ role: 'assistant', content: local.explanation });
        return { explanation: local.explanation, updatedLayout: local.layout || currentLayout };
      }

      // Fallback to AI for unknown instructions
      const apiKey = process.env.REACT_APP_GROQ_API_KEY;
      if (!apiKey || apiKey === 'your_api_key_here') {
        throw new Error('Unknown instruction. Please set REACT_APP_GROQ_API_KEY for AI-powered transforms.');
      }

      const ab = currentLayout.nodes['artboard_1778485662755_3'];
      const nodeList = Object.values(currentLayout.nodes)
        .filter(n => n.type !== 'artboard')
        .map(n => ({ id: n.id, name: n.name, type: n.type, x: Math.round(n.x), y: Math.round(n.y), w: Math.round(n.width), h: Math.round(n.height) }));

      const prompt = `Canvas: ${ab.width}x${ab.height}px\nNodes: ${JSON.stringify(nodeList)}\nInstruction: ${userInstruction}`;

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          max_tokens: 1024,
          temperature: 0.1,
          messages: [
            { role: 'system', content: AI_SYSTEM },
            { role: 'user', content: prompt },
          ],
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || `API error ${response.status}`);
      }

      const data = await response.json();
      const raw = (data.choices?.[0]?.message?.content || '').trim().replace(/```json|```/g, '');
      const patches = JSON.parse(raw);
      const updated = JSON.parse(JSON.stringify(currentLayout));

      (Array.isArray(patches) ? patches : [patches]).forEach(patch => {
        const node = updated.nodes[patch.nodeId];
        if (!node) return;
        const W = updated.nodes['artboard_1778485662755_3'].width;
        const H = updated.nodes['artboard_1778485662755_3'].height;
        if (patch.changes.x !== undefined) node.x = patch.changes.x;
        if (patch.changes.y !== undefined) node.y = patch.changes.y;
        if (patch.changes.width !== undefined) node.width = patch.changes.width;
        if (patch.changes.height !== undefined) node.height = patch.changes.height;
        if (patch.changes.fontSize !== undefined) {
          node.style.visual.fontSize = patch.changes.fontSize;
          node.fontSizeRatio = patch.changes.fontSize / W;
        }
        syncNormalized(node, W, H);
      });

      const explanation = `Applied: ${userInstruction}`;
      historyRef.current.push({ role: 'user', content: userInstruction });
      historyRef.current.push({ role: 'assistant', content: explanation });
      return { explanation, updatedLayout: updated };

    } finally {
      setIsLoading(false);
    }
  }

  function resetHistory() { historyRef.current = []; }
  return { transformLayout, isLoading, resetHistory };
}