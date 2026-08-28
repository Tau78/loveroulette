import { beforeEach, describe, expect, it } from "vitest";
import {
  MAX_CUSTOM_PROFILES,
  NAME_MAX,
  STORAGE_KEY,
  UNIQUE_WIDGET_TYPES,
  WIDGET_LABELS,
  createDefaultState,
  createId,
  createProfileFromCurrent,
  deleteProfile,
  getActiveProfile,
  getFactoryDefaultWidgets,
  loadLayouts,
  renameProfile,
  resetDefaultToFactory,
  saveLayouts,
  setActiveProfile,
  sizeToPx,
  updateActiveWidgets,
  type CasaLayoutsState,
  type CasaWidgetInstance,
} from "./casa-layouts";

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

describe("casa layouts", () => {
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

  it("maps widget sizes to pixel boxes", () => {
    expect(sizeToPx("S")).toEqual({ w: 180, h: 120 });
    expect(sizeToPx("M")).toEqual({ w: 280, h: 180 });
    expect(sizeToPx("L")).toEqual({ w: 400, h: 240 });
    expect(sizeToPx("XL")).toEqual({ w: 560, h: 360 });
  });

  it("creates ids with optional prefix", () => {
    expect(createId("profile")).toMatch(/^profile-/);
    expect(createId()).toMatch(/^w-/);
  });

  it("factory widgets use stable type-based ids", () => {
    const a = getFactoryDefaultWidgets();
    const b = getFactoryDefaultWidgets();
    expect(a.map((w) => w.id)).toEqual(b.map((w) => w.id));
    expect(a.find((w) => w.type === "projector")?.id).toBe("factory-projector");
    expect(a).toHaveLength(9);
    expect(a.find((w) => w.type === "audio_bed")?.id).toBe("factory-audio_bed");
  });

  it("default state has one Default profile", () => {
    const state = createDefaultState();
    expect(state.activeId).toBe("default");
    expect(state.profiles).toHaveLength(1);
    expect(state.profiles[0].isDefault).toBe(true);
    expect(state.profiles[0].name).toBe("Default");
    expect(state.profiles[0].widgets.length).toBeGreaterThan(0);
  });

  it("labels widgets in Italian and marks unique types", () => {
    expect(WIDGET_LABELS.projector).toBe("Proiettore");
    expect(WIDGET_LABELS.qr_help).toBe("Wi-Fi / QR");
    expect(UNIQUE_WIDGET_TYPES.has("notes")).toBe(false);
    expect(UNIQUE_WIDGET_TYPES.has("timer")).toBe(false);
    expect(UNIQUE_WIDGET_TYPES.has("projector")).toBe(true);
    // Only notes + timer are repeatable
    const allTypes = Object.keys(WIDGET_LABELS);
    for (const type of allTypes) {
      if (type === "notes" || type === "timer") {
        expect(UNIQUE_WIDGET_TYPES.has(type as keyof typeof WIDGET_LABELS)).toBe(
          false,
        );
      } else {
        expect(UNIQUE_WIDGET_TYPES.has(type as keyof typeof WIDGET_LABELS)).toBe(
          true,
        );
      }
    }
  });

  it("loadLayouts returns default when empty / corrupt", () => {
    expect(loadLayouts().activeId).toBe("default");
    localStorage.setItem(STORAGE_KEY, "{not-json");
    expect(loadLayouts().profiles[0].isDefault).toBe(true);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ profiles: "nope" }));
    expect(loadLayouts().activeId).toBe("default");
  });

  it("loadLayouts filters unknown types and clamps sizes", () => {
    const state = createDefaultState();
    state.profiles[0].widgets = [
      {
        id: "ok",
        type: "projector",
        x: 1,
        y: 2,
        size: "XL",
      },
      {
        id: "bad-type",
        type: "not-a-widget" as CasaWidgetInstance["type"],
        x: 0,
        y: 0,
        size: "M",
      },
      {
        id: "bad-size",
        type: "notes",
        x: 3,
        y: 4,
        size: "HUGE" as CasaWidgetInstance["size"],
      },
    ];
    saveLayouts(state);
    const loaded = loadLayouts();
    expect(loaded.profiles[0].widgets.map((w) => w.type)).toEqual([
      "projector",
      "notes",
    ]);
    expect(loaded.profiles[0].widgets[1].size).toBe("M");
  });

  it("loadLayouts injects Default when missing", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        activeId: "custom-1",
        profiles: [
          {
            id: "custom-1",
            name: "Sala A",
            widgets: getFactoryDefaultWidgets(),
            updatedAt: 1,
          },
        ],
      }),
    );
    const loaded = loadLayouts();
    expect(loaded.profiles.some((p) => p.isDefault)).toBe(true);
    expect(loaded.profiles.find((p) => p.id === "custom-1")?.name).toBe("Sala A");
  });

  it("save + load round-trips active profile", () => {
    const state = createDefaultState();
    saveLayouts(state);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).activeId).toBe(
      "default",
    );
    expect(loadLayouts().profiles[0].name).toBe("Default");
  });

  it("setActiveProfile / getActiveProfile / updateActiveWidgets", () => {
    let state = createDefaultState();
    const created = createProfileFromCurrent(state, "Live");
    expect(created.error).toBeUndefined();
    state = created.state;
    expect(getActiveProfile(state).name).toBe("Live");

    state = setActiveProfile(state, "default");
    expect(getActiveProfile(state).id).toBe("default");

    const before = getActiveProfile(state).updatedAt;
    const widgets = getFactoryDefaultWidgets().slice(0, 2);
    state = updateActiveWidgets(state, widgets);
    expect(getActiveProfile(state).widgets).toHaveLength(2);
    expect(getActiveProfile(state).updatedAt).toBeGreaterThanOrEqual(before);
  });

  it("creates a profile cloning the active widgets", () => {
    let state = createDefaultState();
    state = updateActiveWidgets(state, [
      { id: "a", type: "notes", x: 10, y: 20, size: "S" },
      { id: "b", type: "notes", x: 30, y: 40, size: "M" },
      { id: "c", type: "timer", x: 50, y: 60, size: "S" },
    ]);
    const result = createProfileFromCurrent(state, "Serata VIP");
    expect(result.error).toBeUndefined();
    state = result.state;
    const profile = getActiveProfile(state);
    expect(profile.name).toBe("Serata VIP");
    expect(profile.isDefault).toBeFalsy();
    expect(profile.widgets).toHaveLength(3);
    expect(profile.widgets.map((w) => w.type)).toEqual([
      "notes",
      "notes",
      "timer",
    ]);
    const ids = profile.widgets.map((w) => w.id);
    expect(ids).not.toContain("a");
    expect(ids).not.toContain("b");
    expect(ids).not.toContain("c");
    expect(new Set(ids).size).toBe(3);
  });

  it("dedupes colliding widget ids on load", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        activeId: "default",
        profiles: [
          {
            id: "default",
            name: "Default",
            isDefault: true,
            updatedAt: 1,
            widgets: [
              { id: "dup", type: "notes", x: 0, y: 0, size: "S" },
              { id: "dup", type: "notes", x: 8, y: 8, size: "S" },
            ],
          },
        ],
      }),
    );
    const loaded = loadLayouts();
    const ids = loaded.profiles[0].widgets.map((w) => w.id);
    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
  });

  it("rejects duplicate names (case-insensitive)", () => {
    let state = createDefaultState();
    state = createProfileFromCurrent(state, "Sala").state;
    const dup = createProfileFromCurrent(state, " sala ");
    expect(dup.error).toMatch(/nome/i);
    expect(dup.state.profiles).toHaveLength(2);

    const rename = renameProfile(state, state.activeId, "Default");
    expect(rename.error).toMatch(/nome/i);
  });

  it("rejects empty / too-long names", () => {
    const state = createDefaultState();
    expect(createProfileFromCurrent(state, "   ").error).toBeTruthy();
    expect(
      createProfileFromCurrent(state, "x".repeat(NAME_MAX + 1)).error,
    ).toBeTruthy();
  });

  it("caps custom profiles at MAX_CUSTOM_PROFILES", () => {
    let state = createDefaultState();
    for (let i = 0; i < MAX_CUSTOM_PROFILES; i++) {
      const r = createProfileFromCurrent(state, `Layout ${i + 1}`);
      expect(r.error).toBeUndefined();
      state = r.state;
    }
    expect(state.profiles).toHaveLength(MAX_CUSTOM_PROFILES + 1);
    const over = createProfileFromCurrent(state, "Troppo");
    expect(over.error).toMatch(/massimo/i);
    expect(over.state.profiles).toHaveLength(MAX_CUSTOM_PROFILES + 1);
  });

  it("renames a profile", () => {
    let state = createDefaultState();
    state = createProfileFromCurrent(state, "Vecchio").state;
    const id = state.activeId;
    const r = renameProfile(state, id, "Nuovo");
    expect(r.error).toBeUndefined();
    expect(r.state.profiles.find((p) => p.id === id)?.name).toBe("Nuovo");
  });

  it("cannot delete Default; deleting active switches to Default", () => {
    let state = createDefaultState();
    const blocked = deleteProfile(state, "default");
    expect(blocked.error).toMatch(/Default/i);

    state = createProfileFromCurrent(state, "Temp").state;
    const customId = state.activeId;
    const deleted = deleteProfile(state, customId);
    expect(deleted.error).toBeUndefined();
    expect(deleted.state.activeId).toBe("default");
    expect(deleted.state.profiles.some((p) => p.id === customId)).toBe(false);
  });

  it("resetDefaultToFactory restores widgets without changing activeId", () => {
    let state = createDefaultState();
    state = updateActiveWidgets(state, [
      { id: "z", type: "timer", x: 0, y: 0, size: "L" },
    ]);
    state = createProfileFromCurrent(state, "Custom").state;
    const customId = state.activeId;

    // Mess up Default while Custom is active
    state = {
      ...state,
      profiles: state.profiles.map((p) =>
        p.id === "default"
          ? {
              ...p,
              widgets: [{ id: "x", type: "notes", x: 1, y: 1, size: "S" }],
            }
          : p,
      ),
    } satisfies CasaLayoutsState;

    state = resetDefaultToFactory(state);
    expect(state.activeId).toBe(customId);
    const def = state.profiles.find((p) => p.isDefault)!;
    expect(def.widgets.map((w) => w.type)).toEqual(
      getFactoryDefaultWidgets().map((w) => w.type),
    );
    expect(def.widgets.find((w) => w.type === "projector")?.id).toBe(
      "factory-projector",
    );
  });
});
