// Dictation, same approach as BAM_UI ("openwhisper" mic): the browser's own speech
// recognition (Web Speech API) with a getUserMedia level meter driving the waveform.
// No server transcription and no new dependencies. The transcript lands in the
// composer as an editable draft - nothing is sent until the user presses send.
// Front-end mock app: this is the only feature that touches a device API (the mic),
// and the audio is handled entirely by the browser's recognizer.
import { useSyncExternalStore } from "react";

export type DictatePhase = "idle" | "requesting" | "listening" | "blocked";
export interface DictateState { phase: DictatePhase; startedAt: number; levels: number[]; error?: string }
const BARS = 16;
let state: DictateState = { phase: "idle", startedAt: 0, levels: Array(BARS).fill(0) };
const subs = new Set<() => void>();
const set = (p: Partial<DictateState>) => { state = { ...state, ...p }; subs.forEach(f => f()); };
export const useDictate = () => useSyncExternalStore(cb => { subs.add(cb); return () => { subs.delete(cb); }; }, () => state);

const SR: any = typeof window !== "undefined" ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) : undefined;
export const dictationSupported = !!SR;

let recog: any;
let meter: { stream: MediaStream; ctx: AudioContext; raf: number } | undefined;

function stopMeter() {
  if (!meter) return;
  cancelAnimationFrame(meter.raf);
  meter.stream.getTracks().forEach(t => t.stop());
  void meter.ctx.close();
  meter = undefined;
  set({ levels: Array(BARS).fill(0) });
}

async function startMeter(onBlocked: () => void) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    if (state.phase !== "requesting") { stream.getTracks().forEach(t => t.stop()); return; }
    set({ phase: "listening", startedAt: Date.now() });
    const ctx = new AudioContext(), an = ctx.createAnalyser();
    an.fftSize = 64;
    ctx.createMediaStreamSource(stream).connect(an);
    const data = new Uint8Array(an.frequencyBinCount);
    let last = 0;
    const tick = (t: number) => {
      if (!meter) return;
      meter.raf = requestAnimationFrame(tick);
      if (t - last < 66) return;
      last = t; an.getByteFrequencyData(data);
      set({ levels: Array.from({ length: BARS }, (_, i) => data[Math.min(data.length - 1, i + 1)] / 255) });
    };
    meter = { stream, ctx, raf: requestAnimationFrame(tick) };
  } catch {
    if (state.phase === "requesting") onBlocked();
  }
}

/** Start dictating. The composer text becomes base + transcript; interim words update live. */
export function startDictation(base: string, onUpdate: (text: string) => void): void {
  if (!SR || state.phase === "listening" || state.phase === "requesting") return;
  const join = (t: string) => (base ? base.replace(/\s+$/, "") + " " + t.replace(/^\s+/, "") : t).replace(/\s+$/, "");
  let finals = "";
  recog = new SR();
  recog.continuous = true; recog.interimResults = true; recog.lang = "en-IN";
  recog.onresult = (e: any) => {
    let interim = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i];
      if (r.isFinal) finals += r[0].transcript + " "; else interim += r[0].transcript;
    }
    onUpdate(join(finals + interim));
  };
  recog.onerror = (e: any) => {
    if (e.error === "not-allowed" || e.error === "service-not-allowed") set({ phase: "blocked" });
    else if (e.error !== "aborted" && e.error !== "no-speech") set({ error: "Dictation stopped with an error. Try again, or type instead." });
  };
  recog.onend = () => { stopMeter(); if (state.phase !== "blocked") set({ phase: "idle" }); };
  set({ phase: "requesting", startedAt: 0, error: undefined });
  void startMeter(() => { set({ phase: "blocked" }); try { recog.stop(); } catch { /* not started */ } });
  try { recog.start(); } catch { set({ phase: "idle" }); }
}

export function stopDictation() {
  try { recog?.stop(); } catch { /* never started */ }
  stopMeter();
  set({ phase: "idle" });
}
