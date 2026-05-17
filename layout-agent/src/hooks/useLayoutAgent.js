import { useState, useRef } from 'react';

const SYSTEM_PROMPT = `You are a layout transformation agent for a design tool. You receive a design JSON and a user instruction, and you output the updated JSON with layout changes applied.

Semantic roles in the design:
- "Background.png" (img_1778485681535_4): full-canvas background image — always covers 100% of canvas
- "Product.png" (img_1778489515746_17): the main product image
- "circle_1778488914968_15" + "text_1778489078397_16": the offer badge (yellow circle with "20% OFF") — keep them together
- "text_1778486306230_8": MAIN HEADLINE "Luxury Comfort, Surprisingly Attainable" (fontSize 72, italic)
- "text_1778486136643_7": SUBHEADLINE "Comfort that defines modern living." (fontSize 48)
- "text_1778486004640_6": "Limited time offer" text (usually at bottom)
- "text_1778486552508_9": "Over 8,000 happy homes" social proof
- img_1778486846247_10, img_1778486856821_11, img_1778487081392_12, img_1778487101466_13, img_1778487110538_14: small rating/star icon decorations

Coordinate rules:
- x, y = absolute pixel position (top-left of element)
- width, height = element size in pixels
- nx = x / canvasWidth, ny = y / canvasHeight
- nw = width / canvasWidth, nh = height / canvasHeight
- ALWAYS keep nx,ny,nw,nh in sync with x,y,width,height after any change

Transformation rules:
1. ASPECT RATIO CHANGE (e.g. "convert to 9:16"):
   - 9:16 means width=1080, height=1920
   - Scale all y positions: newY = oldNY * newHeight
   - Keep x positions by normalized ratio: newX = oldNX * newWidth
   - Background must cover full new canvas
   - Spread elements vertically across the taller canvas with good spacing

2. "KEEP PRODUCT LARGE": Product.png width >= 80% of canvas width, positioned in lower half

3. "MOVE HEADLINE TO TOP": Set text_1778486306230_8 y to ~40px from top

4. "MOVE OFFER BADGE HIGHER": Decrease y of both circle_1778488914968_15 and text_1778489078397_16 by ~100px

5. "MAKE HEADLINE SMALLER": Reduce fontSize of text_1778486306230_8 by 30%, update fontSizeRatio = fontSize/canvasWidth

6. "MAKE HEADLINE BIGGER": Increase fontSize of text_1778486306230_8 by 30%, update fontSizeRatio

Always return the COMPLETE updated JSON — do not omit any nodes.

Respond in this EXACT format (no markdown, no extra text):
EXPLANATION: [1-2 sentences describing exactly what changed]
JSON: [complete minified JSON on one line]`;

export function useLayoutAgent() {
  const [isLoading, setIsLoading] = useState(false);
  const historyRef = useRef([]);

  async function transformLayout(currentLayout, userInstruction) {
    setIsLoading(true);

    const artboard = currentLayout.nodes['artboard_1778485662755_3'];
    const W = artboard.width;
    const H = artboard.height;

    const userMsg = `Current canvas: ${W}x${H}px\n\nCurrent layout JSON:\n${JSON.stringify(currentLayout)}\n\nInstruction: ${userInstruction}`;

    historyRef.current.push({ role: 'user', content: userMsg });

    try {
      const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
      if (!apiKey || apiKey === 'your_api_key_here') {
        throw new Error('Please set REACT_APP_GEMINI_API_KEY in your .env file. Get a FREE key at https://aistudio.google.com/apikey');
      }

      // Build conversation: system + history (last 6 turns)
      const history = historyRef.current.slice(-6);
      const contents = history.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents,
            generationConfig: { maxOutputTokens: 8192, temperature: 0.2 },
          }),
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || `API error ${response.status}`);
      }

      const data = await response.json();
      const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      const explanationMatch = raw.match(/EXPLANATION:\s*(.+?)(?=\nJSON:|$)/s);
      const jsonMatch = raw.match(/JSON:\s*(\{[\s\S]+)/);

      const explanation = explanationMatch ? explanationMatch[1].trim() : 'Layout updated.';

      let updatedLayout = null;
      if (jsonMatch) {
        const jsonStr = jsonMatch[1].trim();
        updatedLayout = JSON.parse(jsonStr);
      }

      historyRef.current.push({ role: 'assistant', content: explanation });
      if (historyRef.current.length > 12) {
        historyRef.current = historyRef.current.slice(-12);
      }

      return { explanation, updatedLayout };
    } finally {
      setIsLoading(false);
    }
  }

  function resetHistory() {
    historyRef.current = [];
  }

  return { transformLayout, isLoading, resetHistory };
}