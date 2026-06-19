type BedDuckHandlers = {
  duck: () => void;
  restore: () => void;
};

let handlers: BedDuckHandlers | null = null;

/** Registrato da useLoveRouletteSoundtrack quando il bed è attivo. */
export function registerSoundtrackBedDuck(next: BedDuckHandlers | null): void {
  handlers = next;
}

export function duckSoundtrackBed(): void {
  handlers?.duck();
}

export function restoreSoundtrackBed(): void {
  handlers?.restore();
}
