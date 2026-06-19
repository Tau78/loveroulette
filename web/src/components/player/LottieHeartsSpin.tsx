"use client";

import Lottie from "lottie-react";
import { useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface LottieHeartsSpinProps {
  className?: string;
  playing?: boolean;
}

export function LottieHeartsSpin({ className, playing = true }: LottieHeartsSpinProps) {
  const reduceMotion = useReducedMotion();
  const [data, setData] = useState<object | null>(null);

  useEffect(() => {
    fetch("/lottie/hearts-spin.json")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null));
  }, []);

  if (reduceMotion) {
    return (
      <div
        className={cn(
          "flex items-center justify-center text-6xl text-accent",
          className,
        )}
        aria-hidden
      >
        ♥
      </div>
    );
  }

  if (!data) {
    return (
      <div
        className={cn(
          "size-48 rounded-full border-4 border-dashed border-accent/50 animate-spin-slow",
          className,
        )}
        aria-label="Caricamento animazione"
      />
    );
  }

  return (
    <Lottie
      animationData={data}
      loop={playing}
      autoplay={playing}
      className={cn("size-48 md:size-64", className)}
      aria-hidden
    />
  );
}
