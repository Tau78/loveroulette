"use client";

import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const JOIN_CARD_CLASS =
  "border-primary/25 bg-card/85 shadow-[0_0_32px_rgba(236,72,153,0.12)] backdrop-blur-md";

type ConsentId = "privacy" | "media" | "social";

const CONSENTS: Array<{ id: ConsentId; title: string; body: string }> = [
  {
    id: "privacy",
    title: "Privacy",
    body: "Nome, telefono, email e foto servono solo per questa serata.",
  },
  {
    id: "media",
    title: "Foto e video",
    body: "Accetto di comparire in foto e video: in sala, sul proiettore e sui telefoni.",
  },
  {
    id: "social",
    title: "Social",
    body: "Foto e video della serata possono uscire sui social dell’evento.",
  },
];

export function PlayerJoinWelcome({ onContinue }: { onContinue: () => void }) {
  const [accepted, setAccepted] = useState<Record<ConsentId, boolean>>({
    privacy: false,
    media: false,
    social: false,
  });
  const ready = CONSENTS.every((item) => accepted[item.id]);

  return (
    <motion.div
      className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center space-y-6"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      <div className="space-y-3 text-center">
        <div className="mx-auto inline-flex size-14 items-center justify-center rounded-2xl bg-primary/15 ring-1 ring-primary/25">
          <Heart className="size-7 fill-primary/25 text-primary" aria-hidden />
        </div>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Benvenuti
        </h1>
        <p className="text-sm text-muted-foreground">
          Stasera si gioca insieme. Prima di entrare, tre sì chiari.
        </p>
      </div>

      <Card className={JOIN_CARD_CLASS}>
        <CardContent className="space-y-3 pt-6">
          {CONSENTS.map((item) => {
            const checked = accepted[item.id];
            return (
              <label
                key={item.id}
                className={cn(
                  "flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border px-3 py-3 text-left",
                  checked
                    ? "border-primary bg-primary/15"
                    : "border-border bg-background/50",
                )}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) =>
                    setAccepted((current) => ({
                      ...current,
                      [item.id]: e.target.checked,
                    }))
                  }
                  className="mt-0.5 size-5 shrink-0 accent-primary"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{item.title}</span>
                  <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
                    {item.body}
                    {item.id === "privacy" ? (
                      <>
                        {" "}
                        <a
                          href="/privacy"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline underline-offset-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Informativa
                        </a>
                      </>
                    ) : null}
                  </span>
                </span>
              </label>
            );
          })}

          <Button
            type="button"
            size="lg"
            className="h-12 w-full text-base font-semibold shadow-[0_0_24px_rgba(236,72,153,0.35)]"
            disabled={!ready}
            onClick={onContinue}
          >
            Accetto e continuo
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
