import {
  ALL_WIDGET_TYPES,
  UNIQUE_WIDGET_TYPES,
  WIDGET_LABELS,
  type CasaWidgetSize,
  type CasaWidgetType,
} from "@/lib/admin/casa-layouts";

export type CasaWidgetMeta = {
  type: CasaWidgetType;
  label: string;
  sizes: CasaWidgetSize[];
  defaultSize: CasaWidgetSize;
  unique: boolean;
};

const ALL_SIZES: CasaWidgetSize[] = ["S", "M", "L", "XL"];

const DEFAULT_SIZE: Partial<Record<CasaWidgetType, CasaWidgetSize>> = {
  projector: "XL",
  avanti: "S",
  clock: "S",
  settings: "S",
  messages: "S",
  qr_help: "S",
  volume_master: "S",
  timer: "S",
  notes: "M",
  quiz_regia: "L",
  transport: "M",
  preflight: "M",
  panic: "S",
  finals: "L",
  extraction: "M",
  leaderboard: "M",
  cue: "M",
};

/**
 * Gallery order: addable / non-factory types first, then core deck widgets.
 * Factory defaults still appear (disabled when unique + present).
 */
const TYPE_ORDER: CasaWidgetType[] = [
  "timer",
  "notes",
  "qr_help",
  "volume_master",
  "video_player",
  "quiz_regia",
  "transport",
  "preflight",
  "panic",
  "finals",
  "extraction",
  "leaderboard",
  "cue",
  "settings",
  "players",
  "messages",
  "projector",
  "audio",
  "pad",
  "avanti",
  "clock",
  "audio_bed",
];

function assertRegistryComplete(order: CasaWidgetType[]): CasaWidgetType[] {
  const missing = ALL_WIDGET_TYPES.filter((t) => !order.includes(t));
  const extra = order.filter((t) => !(ALL_WIDGET_TYPES as readonly string[]).includes(t));
  if (missing.length || extra.length) {
    throw new Error(
      `WIDGET_REGISTRY incomplete: missing=${missing.join(",") || "—"} extra=${extra.join(",") || "—"}`,
    );
  }
  return order;
}

const ORDERED = assertRegistryComplete(TYPE_ORDER);

export const WIDGET_REGISTRY: CasaWidgetMeta[] = ORDERED.map((type) => ({
  type,
  label: WIDGET_LABELS[type],
  sizes: ALL_SIZES,
  defaultSize: DEFAULT_SIZE[type] ?? "M",
  unique: UNIQUE_WIDGET_TYPES.has(type),
}));

export function widgetMeta(type: CasaWidgetType): CasaWidgetMeta {
  return (
    WIDGET_REGISTRY.find((m) => m.type === type) ?? {
      type,
      label: WIDGET_LABELS[type],
      sizes: ALL_SIZES,
      defaultSize: DEFAULT_SIZE[type] ?? "M",
      unique: UNIQUE_WIDGET_TYPES.has(type),
    }
  );
}

export function cycleWidgetSize(size: CasaWidgetSize): CasaWidgetSize {
  const i = ALL_SIZES.indexOf(size);
  return ALL_SIZES[(i + 1) % ALL_SIZES.length] ?? "M";
}
