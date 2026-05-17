# Layout Agent — Compra Assignment

A chat-based layout agent that transforms design JSON through natural language. Uses **OpenRouter free tier** — no credit card needed.

## Chat commands supported
- "Convert this design to 9:16"
- "Move the headline to the top"
- "Keep the product large"
- "Move the offer badge higher"
- "Make the headline smaller / bigger"

## Setup (5 minutes)

### Step 1 — Get a free API key
1. Go to **https://openrouter.ai**
2. Sign up (free, no credit card)
3. Go to **Keys** → **Create Key** → copy it

### Step 2 — Run the app
```bash
git clone https://github.com/YOUR_USERNAME/layout-agent.git
cd layout-agent
npm install
cp .env.example .env
# Open .env and paste: REACT_APP_OPENROUTER_API_KEY=sk-or-...
npm start
```
Opens at http://localhost:3000

## Project Structure
```
src/
├── components/
│   ├── ChatPanel.jsx         # Chat UI + suggestion chips
│   ├── CanvasPreview.jsx     # Live wireframe on HTML Canvas
│   └── JsonViewer.jsx        # JSON viewer with copy/download
├── hooks/
│   └── useLayoutAgent.js     # LLM API + layout reasoning logic
├── App.jsx                   # Split-panel layout
└── layoutData.js             # Original design JSON
```

## Approach
- **LLM**: Llama 3.3 70B via OpenRouter (free). System prompt encodes semantic node roles + coordinate rules + transformation recipes.
- **Follow-ups**: Last 6 turns sent as history so relative instructions work ("make it bigger", "undo that").
- **Canvas preview**: HTML Canvas renders images, shapes, text scaled to container width.
- **JSON output**: Full updated JSON returned each turn, parsed via `EXPLANATION:` / `JSON:` markers.

## Built With
- React 18, OpenRouter API (free), Llama 3.3 70B
