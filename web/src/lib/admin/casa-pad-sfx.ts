export const CASA_PAD_HITS = [
  { id: "applausi", label: "Applausi" },
  { id: "risate", label: "Risate" },
  { id: "ohno", label: "Oh no" },
  { id: "buuuh", label: "Buuuh" },
  { id: "tuono", label: "Tuono" },
  { id: "cuore", label: "Cuore che batte" },
  { id: "sospiro", label: "Sospiro innamorato" },
  { id: "spavento", label: "Urlo di spavento" },
  { id: "dolore", label: "Urlo di dolore" },
] as const;

export type CasaPadHitId = (typeof CASA_PAD_HITS)[number]["id"];

/** Mixkit License (commercial, no attribution). Preview 44.1 kHz / 128 kbps. */
export const CASA_PAD_SRC: Record<CasaPadHitId, string> = {
  applausi: "/grafiche/audio/pad/applausi.mp3",
  risate: "/grafiche/audio/pad/risate.mp3",
  ohno: "/grafiche/audio/pad/ohno.mp3",
  buuuh: "/grafiche/audio/pad/buuuh.mp3",
  tuono: "/grafiche/audio/pad/tuono.mp3",
  cuore: "/grafiche/audio/pad/cuore.mp3",
  sospiro: "/grafiche/audio/pad/sospiro.mp3",
  spavento: "/grafiche/audio/pad/spavento.mp3",
  dolore: "/grafiche/audio/pad/dolore.mp3",
};

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function noise(ac: AudioContext, seconds: number): AudioBufferSourceNode {
  const buffer = ac.createBuffer(1, Math.floor(ac.sampleRate * seconds), ac.sampleRate);
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
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + attack + release);
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

function playSynth(id: CasaPadHitId, volume: number): void {
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
  const osc = ac.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(340, ac.currentTime);
  osc.frequency.exponentialRampToValueAtTime(160, ac.currentTime + 0.55);
  env(ac, osc, master, 0.24, 0.01, 0.55);
  osc.start();
  osc.stop(ac.currentTime + 0.65);
}

const buffers = new Map<CasaPadHitId, AudioBuffer>();

async function decodeHit(id: CasaPadHitId): Promise<AudioBuffer | null> {
  const cached = buffers.get(id);
  if (cached) return cached;
  const ac = audio();
  if (!ac) return null;
  try {
    const res = await fetch(CASA_PAD_SRC[id]);
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
  for (const hit of CASA_PAD_HITS) {
    void fetch(CASA_PAD_SRC[hit.id]);
  }
}

export function playCasaPadHit(id: CasaPadHitId, volume = 0.7): void {
  const gain = Math.min(1, Math.max(0, volume));
  const ac = audio();
  if (!ac) return;
  void decodeHit(id).then((buf) => {
    if (!buf) {
      playSynth(id, gain);
      return;
    }
    const src = ac.createBufferSource();
    const g = ac.createGain();
    g.gain.value = gain;
    src.buffer = buf;
    src.connect(g);
    g.connect(ac.destination);
    src.start();
  });
}
