# CAM 4.0 - RFQ Automation UI

Three-pane RFQ automation interface (React + Vite + TypeScript + Refine), built from the
CAM 4.0 workflow note: 10 skills as workflows in the left rail, assistant Q&A
chat in the centre, sub-skill steps and their output on the right.

- Light/dark themes, CAM 4.0 branding (orange #FF9800, blue #0084C2)
- Human review checkpoint with Action button ending each skill; hooks hand off between skills
- Front-end mock data only - no backend is connected yet

The Refine data provider is a local read-only mock (src/provider.ts); write
operations are rejected. Swap it for the real API provider when the backend lands.

## Run

```
npm install
npm run dev
```
