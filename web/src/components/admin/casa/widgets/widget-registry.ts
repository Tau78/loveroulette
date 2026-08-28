import {
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
};

const TYPE_ORDER: CasaWidgetType[] = [
  "settings",
  "players",
  "messages",
  "projector",
  "audio",
  "pad",
  "avanti",
  "clock",
  "timer",
  "notes",
  "qr_help",
  "volume_master",
  "audio_bed",
  "video_player",
];

export const WIDGET_REGISTRY: CasaWidgetMeta[] = TYPE_ORDER.map((type) => ({
  type,
  label: WIDGET_LABELS[type],
  sizes: ALL_SIZES,
  defaultSize: DEFAULT_SIZE[type] ?? "M",
  unique: UNIQUE_WIDGET_TYPES.has(type),
}));

export function widgetMeta(type: CasaWidgetType): CasaWidgetMeta {
  return WIDGET_REGISTRY.find((m) => m.type === type) ?? {
    type,
    label: WIDGET_LABELS[type],
    sizes: ALL_SIZES,
    defaultSize: DEFAULT_SIZE[type] ?? "M",
    unique: UNIQUE_WIDGET_TYPES.has(type),
  };
}

export function cycleWidgetSize(size: CasaWidgetSize): CasaWidgetSize {
  const i = ALL_SIZES.indexOf(size);
  return ALL_SIZES[(i + 1) % ALL_SIZES.length] ?? "M";
}
