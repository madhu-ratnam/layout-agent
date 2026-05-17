# Approach Note

## Architecture

**Chat Interface**
A split-panel layout: chat on the left, canvas preview + JSON viewer on the right. Users can type instructions freely or tap quick-suggestion chips for the example commands from the spec.

**LLM Integration**
Each user message hits `claude-sonnet-4-20250514` via the Anthropic Messages API. The system prompt contains:
1. A semantic map of every node (what it is, its ID, its role in the design)
2. Coordinate rules explaining the relationship between absolute (x,y) and normalized (nx,ny,nw,nh) values
3. Step-by-step transformation rules for each common instruction type (aspect ratio, move, resize)

The LLM returns a response in a structured format: `EXPLANATION: ...` then `JSON: ...`. This makes parsing reliable regardless of any conversational preamble.

**Follow-up Handling**
The last 6 conversation turns are passed as history on every API call, so follow-up instructions ("make it even bigger", "actually put it back") work correctly using relative context.

**Layout Reasoning**
Rather than hard-coding transformation logic, the instructions are expressed as natural-language rules in the prompt. This means the agent handles novel combinations gracefully (e.g. "convert to 9:16 AND move the headline to the top" in one message).

**Canvas Wireframe**
An HTML Canvas renders the live layout. Images load from the real Cloudinary URLs. The canvas scales responsively to the container width while maintaining the correct artboard aspect ratio.

## Trade-offs

- **No PSD / image rendering**: Wireframe only, as specified
- **Full JSON returned on each transform**: Simple and reliable vs. a JSON-patch diff approach; slightly larger API responses but much easier to reason about correctness
- **Client-side API calls**: Requires `anthropic-dangerous-direct-browser-calls` header. For production, this should go through a backend proxy
