# CAM 4.0 - RFQ Automation UI

Three-pane RFQ automation interface (React + Vite + TypeScript + Refine), built from the
CAM 4.0 workflow note: 10 skills as workflows in the left rail, assistant Q&A
chat in the centre, sub-skill steps and their output on the right.

- Look and feel matched to BAM_UI (tokens, Inter type, flat surfaces); CAM 4.0 branding kept (orange #FF9800, blue #0084C2)
- Add files opens its upload options (Choose folder / Bulk upload / Upload zip) on hover or click, same as BAM_UI
- Bull glyph marks automated steps; person icon marks human steps
- Human review checkpoint with Action button ending each skill; hooks hand off between skills
- Front-end mock data only - no backend is connected yet

The Refine data provider is a local read-only mock (src/provider.ts); write
operations are rejected. Swap it for the real API provider when the backend lands.

## Run

```
npm install
npm run dev
```

Open the printed URL, then click "Yes, start." in the assistant pane: the mock run
walks all 10 skills, pausing at each human review - press the orange Action button to
continue. Nothing leaves the browser; every run is mock data.
