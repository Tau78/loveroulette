import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PlanciaModule({
  title,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={cn(
        "flex min-h-0 flex-col overflow-hidden rounded-xl border border-white/20 bg-[#1a1a24]",
        className,
      )}
    >
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-white/15 bg-[#22222e] px-3 py-2">
        <h3 className="plancia-kicker">{title}</h3>
        {actions ? <div className="flex shrink-0 items-center gap-1">{actions}</div> : null}
      </header>
      <div className={cn("min-h-0 flex-1 p-2.5", bodyClassName)}>{children}</div>
    </section>
  );
}

export function StatusLed({
  on,
  label,
  tone = "ok",
}: {
  on: boolean;
  label?: string;
  tone?: "ok" | "warn" | "off";
}) {
  const color =
    !on || tone === "off"
      ? "bg-white/35"
      : tone === "warn"
        ? "bg-[#f5c84b] shadow-[0_0_8px_rgba(245,200,75,0.75)]"
        : "bg-[#3ee08a] shadow-[0_0_8px_rgba(62,224,138,0.75)]";
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("size-2.5 shrink-0 rounded-full", color)} aria-hidden />
      {label ? <span className="plancia-kicker">{label}</span> : null}
    </span>
  );
}

export function DeckBank({
  cols,
  children,
  className,
}: {
  cols: 2 | 3 | 4 | 5;
  children: ReactNode;
  className?: string;
}) {
  const colClass = {
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
    5: "grid-cols-5",
  } as const;

  return (
    <div className={cn("grid gap-1.5", colClass[cols], className)}>{children}</div>
  );
}

export function DeckKey({
  children,
  slot,
  onClick,
  active,
  disabled,
  tone = "neutral",
  className,
  title,
}: {
  children: ReactNode;
  slot?: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  tone?: "neutral" | "primary" | "danger" | "warn" | "ok";
  className?: string;
  title?: string;
}) {
  const lit = {
    neutral: "bg-[#3a3a4c] text-white",
    primary: "bg-primary text-white",
    danger: "bg-[#ff6b7a] text-[#2a0408]",
    warn: "bg-[#f5c84b] text-[#1a1400]",
    ok: "bg-[#3ee08a] text-[#04150c]",
  } as const;

  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "deck-key relative flex h-12 w-full min-w-0 flex-col items-center justify-center overflow-hidden rounded-md px-1.5",
        "text-center text-xs font-bold leading-tight",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80",
        "disabled:cursor-not-allowed disabled:opacity-100",
        active ? lit[tone] : "bg-[#1c1c26] text-white",
        disabled && !active && "bg-[#14141a] text-white/35",
        className,
      )}
    >
      {slot ? (
        <span className="absolute left-1.5 top-0.5 text-[9px] font-semibold tabular-nums text-white/45">
          {slot}
        </span>
      ) : null}
      <span className="line-clamp-2">{children}</span>
    </button>
  );
}

/** @deprecated usa DeckKey — tenuto per i pochi call-site residui */
export function DeckButton(props: Parameters<typeof DeckKey>[0]) {
  return <DeckKey {...props} />;
}
