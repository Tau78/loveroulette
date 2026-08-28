import { beforeEach, describe, expect, it } from "vitest";
import {
  DEFAULT_NOTES,
  getNote,
  loadNotes,
  setNote,
} from "./casa-notes";

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key: string) {
      return map.has(key) ? map.get(key)! : null;
    },
    key(index: number) {
      return [...map.keys()][index] ?? null;
    },
    removeItem(key: string) {
      map.delete(key);
    },
    setItem(key: string, value: string) {
      map.set(key, String(value));
    },
  };
}

describe("casa notes", () => {
  beforeEach(() => {
    const storage = memoryStorage();
    Object.defineProperty(globalThis, "localStorage", {
      value: storage,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(globalThis, "window", {
      value: { localStorage: storage },
      configurable: true,
      writable: true,
    });
  });

  it("returns empty string for missing ids", () => {
    expect(getNote(DEFAULT_NOTES, "w1")).toBe("");
  });

  it("setNote returns a new state with the text", () => {
    const next = setNote(DEFAULT_NOTES, "w1", "ricorda il premio");
    expect(getNote(next, "w1")).toBe("ricorda il premio");
    expect(DEFAULT_NOTES.byInstanceId.w1).toBeUndefined();
  });

  it("setNote overwrites an existing note without dropping others", () => {
    const a = setNote(DEFAULT_NOTES, "a", "uno");
    const b = setNote(a, "b", "due");
    const c = setNote(b, "a", "tre");
    expect(getNote(c, "a")).toBe("tre");
    expect(getNote(c, "b")).toBe("due");
  });

  it("loadNotes drops non-string values", () => {
    localStorage.setItem(
      "lr_casa_notes",
      JSON.stringify({ byInstanceId: { ok: "ciao", bad: 42 } }),
    );
    const loaded = loadNotes();
    expect(loaded.byInstanceId).toEqual({ ok: "ciao" });
  });
});
