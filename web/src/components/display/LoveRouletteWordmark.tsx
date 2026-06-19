import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoveRouletteWordmarkProps {
  size?: "sm" | "lg" | "hero";
  className?: string;
}

const sizeClasses = {
  sm: {
    text: "text-xl md:text-2xl tracking-[0.18em]",
    heart: "size-3.5 md:size-4",
    gap: "gap-2 md:gap-2.5",
  },
  lg: {
    text: "text-3xl md:text-4xl tracking-[0.22em]",
    heart: "size-5 md:size-6",
    gap: "gap-3 md:gap-4",
  },
  hero: {
    text: "text-5xl md:text-7xl lg:text-8xl tracking-[0.28em]",
    heart: "size-7 md:size-10 lg:size-12",
    gap: "gap-4 md:gap-6",
  },
};

export function LoveRouletteWordmark({
  size = "lg",
  className,
}: LoveRouletteWordmarkProps) {
  const s = sizeClasses[size];

  return (
    <div
      className={cn(
        "inline-flex flex-col items-center select-none",
        className,
      )}
      aria-label="Love Roulette"
    >
      <div
        className={cn(
          "flex items-center justify-center font-display font-bold uppercase",
          s.gap,
          s.text,
        )}
        style={{ fontFamily: "var(--font-display), Georgia, serif" }}
      >
        <span className="text-white/95 drop-shadow-[0_2px_24px_rgba(233,30,140,0.25)]">
          Love
        </span>
        <Heart
          className={cn(
            s.heart,
            "text-primary fill-primary/40 shrink-0 drop-shadow-[0_0_20px_rgba(233,30,140,0.5)]",
          )}
          strokeWidth={1.5}
        />
        <span className="text-white/95 drop-shadow-[0_2px_24px_rgba(233,30,140,0.25)]">
          Roulette
        </span>
      </div>
      {size === "hero" && (
        <div className="mt-3 flex items-center gap-2 opacity-60">
          <Heart className="size-2 fill-primary/50 text-primary" />
          <Heart className="size-3 fill-primary/60 text-primary" />
          <Heart className="size-2 fill-primary/50 text-primary" />
        </div>
      )}
    </div>
  );
}
