"use client";

import { motion } from "framer-motion";
import { Heart } from "lucide-react";

export function PlayerLobbyGlow() {
  return (
    <motion.div
      className="relative mx-auto flex size-40 items-center justify-center"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {[0, 1, 2].map((ring) => (
        <motion.span
          key={ring}
          className="pointer-events-none absolute inset-0 rounded-full border border-primary/40"
          animate={{ scale: [0.85, 1.35], opacity: [0.55, 0] }}
          transition={{
            duration: 2.4,
            repeat: Infinity,
            delay: ring * 0.55,
            ease: "easeOut",
          }}
          aria-hidden
        />
      ))}
      <motion.div
        className="relative flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/35 via-primary/20 to-fuchsia-600/10 shadow-[0_0_40px_rgba(236,72,153,0.55)] ring-2 ring-primary/50"
        animate={{
          boxShadow: [
            "0 0 32px rgba(236,72,153,0.45)",
            "0 0 56px rgba(236,72,153,0.75)",
            "0 0 32px rgba(236,72,153,0.45)",
          ],
        }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <Heart className="size-10 fill-primary text-primary" />
      </motion.div>
    </motion.div>
  );
}
