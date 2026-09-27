/**
 * Whoosh cupo per tick countdown stacco / avvio quiz.
 * Attacco lungo in arrivo, coda lunga in uscita, più impatto (sub + vento).
 */

let sharedCtx: AudioContext | null = null;

function audioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AC) return null;
  if (!sharedCtx) sharedCtx = new AC();
  if (sharedCtx.state === "suspended") void sharedCtx.resume();
  return sharedCtx;
}

export function playCountdownWhoosh(volume = 0.58): void {
  const ac = audioContext();
  if (!ac) return;

  const gain = Math.min(1, Math.max(0, volume));
  const t0 = ac.currentTime;
  const dur = 1.15;
  const attack = 0.22;
  const peakAt = attack + 0.12;

  const master = ac.createGain();
  master.gain.value = gain;
  master.connect(ac.destination);

  // Layer 1 — vento scuro lungo (in + out)
  const buffer = ac.createBuffer(1, Math.floor(ac.sampleRate * dur), ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const noise = ac.createBufferSource();
  noise.buffer = buffer;

  const low = ac.createBiquadFilter();
  low.type = "lowpass";
  low.Q.value = 0.7;
  low.frequency.setValueAtTime(520, t0);
  low.frequency.exponentialRampToValueAtTime(280, t0 + peakAt);
  low.frequency.exponentialRampToValueAtTime(70, t0 + dur);

  const highCut = ac.createBiquadFilter();
  highCut.type = "highpass";
  highCut.frequency.value = 40;
  highCut.Q.value = 0.35;

  const windGain = ac.createGain();
  windGain.gain.setValueAtTime(0.0001, t0);
  windGain.gain.exponentialRampToValueAtTime(0.85, t0 + attack);
  windGain.gain.linearRampToValueAtTime(0.78, t0 + peakAt);
  windGain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

  noise.connect(low);
  low.connect(highCut);
  highCut.connect(windGain);
  windGain.connect(master);
  noise.start(t0);
  noise.stop(t0 + dur + 0.03);

  // Layer 2 — rumore più cupo/stretto (corpo)
  const bodyBuf = ac.createBuffer(1, Math.floor(ac.sampleRate * dur), ac.sampleRate);
  const bodyData = bodyBuf.getChannelData(0);
  for (let i = 0; i < bodyData.length; i++) {
    bodyData[i] = Math.random() * 2 - 1;
  }
  const body = ac.createBufferSource();
  body.buffer = bodyBuf;
  const bodyFilter = ac.createBiquadFilter();
  bodyFilter.type = "bandpass";
  bodyFilter.Q.value = 1.1;
  bodyFilter.frequency.setValueAtTime(160, t0);
  bodyFilter.frequency.exponentialRampToValueAtTime(90, t0 + dur);
  const bodyGain = ac.createGain();
  bodyGain.gain.setValueAtTime(0.0001, t0);
  bodyGain.gain.exponentialRampToValueAtTime(0.45, t0 + attack * 1.15);
  bodyGain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur * 0.92);
  body.connect(bodyFilter);
  bodyFilter.connect(bodyGain);
  bodyGain.connect(master);
  body.start(t0);
  body.stop(t0 + dur + 0.03);

  // Sub d'impatto — entrata lenta, coda lunga
  const sub = ac.createOscillator();
  sub.type = "sine";
  sub.frequency.setValueAtTime(78, t0);
  sub.frequency.exponentialRampToValueAtTime(32, t0 + dur * 0.85);
  const subGain = ac.createGain();
  subGain.gain.setValueAtTime(0.0001, t0);
  subGain.gain.exponentialRampToValueAtTime(0.42, t0 + attack);
  subGain.gain.linearRampToValueAtTime(0.38, t0 + peakAt + 0.1);
  subGain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  sub.connect(subGain);
  subGain.connect(master);
  sub.start(t0);
  sub.stop(t0 + dur + 0.03);
}
