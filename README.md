# CAM 4.0 - RFQ Automation UI

Three-pane RFQ automation interface (React + Vite + TypeScript + Refine), built from the
CAM 4.0 workflow note: 10 skills as workflows in the left rail, assistant Q&A
chat in the centre, sub-skill steps and their output on the right.

- Look and feel matched to BAM_UI (tokens, Inter type, flat surfaces); blue accents only - no orange except the CAM logo
- Add files opens its upload options (Choose folder / Bulk upload / Upload zip) on hover or click, same as BAM_UI
- Bull glyph marks automated steps; person icon marks human steps
- Human review checkpoint with Action button ending each skill; hooks hand off between skills
- Add files uses Uppy for the actual file picking (same intake library as BAM_UI): Choose folder, Bulk upload and Upload zip pick real files from the device and list their real names; nothing is uploaded anywhere (no backend), the intake statuses are simulated
- Costed BOM output uses ag-grid (same table library as BAM_UI) - interactive sortable table, mock rows
- The Sales Quote cover letter is a real editable TipTap editor (same editor as BAM_UI); edits stay in the browser, nothing is sent
- Mic dictation in the composer, same approach as BAM_UI: the browser's own speech recognition (Web Speech API) with a live level-meter waveform; the transcript lands as an editable draft and nothing sends itself. No server transcription. Note: in Chrome the Web Speech API is processed by the browser vendor's speech service.
- Front-end mock data only - no backend is connected yet

The Refine data provider is a local read-only mock (src/provider.ts); write
operations are rejected. Swap it for the real API provider when the backend lands.

## Run

```
npm install
npm run dev
```

Open the printed URL, then click "Yes, start." in the assistant pane: the mock run
walks all 10 skills, pausing at each human review - press the Action button to
continue. Nothing leaves the browser; every run is mock data.
