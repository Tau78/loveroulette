import {
  CASA_PAD_BUILTIN,
  CASA_PAD_SRC,
  type CasaPadHitId,
} from "@/lib/admin/casa-pad-bank";

export type { CasaPadHitId } from "@/lib/admin/casa-pad-bank";
export { CASA_PAD_HITS, CASA_PAD_SRC } from "@/lib/admin/casa-pad-bank";

/** @deprecated Prefer CASA_PAD_BUILTIN from casa-pad-bank. */
export const CASA_PAD_HITS_LEGACY = CASA_PAD_BUILTIN.map(({ id, label }) => ({
  id,
  label,
}));

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC =
    window.AudioContext ||
    (window as Window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function noise(ac: AudioContext, seconds: number): AudioBufferSourceNode {
  const buffer = ac.createBuffer(
    1,
    Math.floor(ac.sampleRate * seconds),
    ac.sampleRate,
  );
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buffer;
  return src;
}

function env(
  ac: AudioContext,
  node: AudioNode,
  dest: AudioNode,
  gain: number,
  attack: number,
  release: number,
): void {
  const g = ac.createGain();
  g.gain.setValueAtTime(0, ac.currentTime);
  g.gain.linearRampToValueAtTime(gain, ac.currentTime + attack);
  g.gain.exponentialRampToValueAtTime(
    0.0001,
    ac.currentTime + attack + release,
  );
  node.connect(g);
  g.connect(dest);
}

function tone(
  ac: AudioContext,
  dest: AudioNode,
  type: OscillatorType,
  freq: number,
  gain: number,
  dur: number,
  start = 0,
): void {
  const osc = ac.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ac.currentTime + start);
  const g = ac.createGain();
  g.gain.setValueAtTime(0, ac.currentTime + start);
  g.gain.linearRampToValueAtTime(gain, ac.currentTime + start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + start + dur);
  osc.connect(g);
  g.connect(dest);
  osc.start(ac.currentTime + start);
  osc.stop(ac.currentTime + start + dur + 0.05);
}

/** Fallback sintetico solo se manca il file MP3. */
function playSynth(id: string, volume: number): void {
  const ac = audio();
  if (!ac) return;
  const master = ac.createGain();
  master.gain.value = volume;
  master.connect(ac.destination);

  if (id === "applausi") {
    for (let i = 0; i < 14; i++) {
      const n = noise(ac, 0.12);
      const f = ac.createBiquadFilter();
      f.type = "bandpass";
      f.frequency.value = 1800 + Math.random() * 900;
      n.connect(f);
      env(ac, f, master, 0.35, 0.005, 0.1);
      n.start(ac.currentTime + i * 0.045);
    }
    return;
  }
  if (id === "risate") {
    for (let i = 0; i < 6; i++) {
      tone(ac, master, "triangle", 420 - i * 18, 0.22, 0.09, i * 0.08);
    }
    return;
  }
  if (id === "ohno") {
    tone(ac, master, "sine", 380, 0.28, 0.18, 0);
    tone(ac, master, "sine", 260, 0.3, 0.35, 0.16);
    return;
  }
  if (id === "buuuh") {
    const osc = ac.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(180, ac.currentTime);
    osc.frequency.exponentialRampToValueAtTime(70, ac.currentTime + 0.9);
    env(ac, osc, master, 0.22, 0.04, 0.85);
    osc.start();
    osc.stop(ac.currentTime + 1);
    return;
  }
  if (id === "tuono") {
    const n = noise(ac, 1.4);
    const f = ac.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.setValueAtTime(180, ac.currentTime);
    f.frequency.exponentialRampToValueAtTime(60, ac.currentTime + 1.2);
    n.connect(f);
    env(ac, f, master, 0.55, 0.01, 1.2);
    n.start();
    return;
  }
  if (id === "cuore") {
    tone(ac, master, "sine", 70, 0.55, 0.16, 0);
    tone(ac, master, "sine", 62, 0.48, 0.2, 0.22);
    return;
  }
  if (id === "sospiro") {
    const n = noise(ac, 0.8);
    const f = ac.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.setValueAtTime(900, ac.currentTime);
    f.frequency.exponentialRampToValueAtTime(280, ac.currentTime + 0.7);
    n.connect(f);
    env(ac, f, master, 0.2, 0.08, 0.65);
    n.start();
    return;
  }
  if (id === "spavento") {
    const osc = ac.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(420, ac.currentTime);
    osc.frequency.exponentialRampToValueAtTime(980, ac.currentTime + 0.35);
    env(ac, osc, master, 0.2, 0.02, 0.4);
    osc.start();
    osc.stop(ac.currentTime + 0.5);
    return;
  }
  // gong / rullo / confetti / … o dolore
  const osc = ac.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(340, ac.currentTime);
  osc.frequency.exponentialRampToValueAtTime(160, ac.currentTime + 0.55);
  env(ac, osc, master, 0.24, 0.01, 0.55);
  osc.start();
  osc.stop(ac.currentTime + 0.65);
}

const buffers = new Map<string, AudioBuffer>();

async function decodeHit(
  id: string,
  src: string,
): Promise<AudioBuffer | null> {
  const cached = buffers.get(id);
  if (cached) return cached;
  const ac = audio();
  if (!ac) return null;
  try {
    const res = await fetch(src);
    if (!res.ok) return null;
    const raw = await res.arrayBuffer();
    const buf = await ac.decodeAudioData(raw.slice(0));
    buffers.set(id, buf);
    return buf;
  } catch {
    return null;
  }
}

export function prefetchCasaPadHits(): void {
  for (const hit of CASA_PAD_BUILTIN) {
    void fetch(hit.src);
  }
}

const playing = new Map<string, AudioBufferSourceNode>();
const pending = new Set<string>();

function stopSource(id: string): void {
  const src = playing.get(id);
  if (!src) return;
  try {
    src.stop();
  } catch {
    /* already stopped */
  }
  playing.delete(id);
}

/**
 * Tap on: starts. Tap again: stops.
 * `src` opzionale — default dal catalogo builtin.
 */
export function toggleCasaPadHit(
  id: CasaPadHitId,
  volume = 0.7,
  onEnded?: () => void,
  src?: string,
): boolean {
  if (playing.has(id) || pending.has(id)) {
    pending.delete(id);
    stopSource(id);
    return false;
  }

  const gain = Math.min(1, Math.max(0, volume));
  const ac = audio();
  if (!ac) return false;

  const url = src ?? CASA_PAD_SRC[id] ?? "";
  pending.add(id);
  void decodeHit(id, url).then((buf) => {
    if (!pending.has(id)) return;
    pending.delete(id);

    if (!buf) {
      playSynth(id, gain);
      window.setTimeout(() => onEnded?.(), 900);
      return;
    }

    const node = ac.createBufferSource();
    const g = ac.createGain();
    g.gain.value = gain;
    node.buffer = buf;
    node.connect(g);
    g.connect(ac.destination);
    node.onended = () => {
      if (playing.get(id) === node) playing.delete(id);
      onEnded?.();
    };
    playing.set(id, node);
    node.start();
  });
  return true;
}
