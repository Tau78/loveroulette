"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { pickFinalistCheerLine } from "@/lib/player/finalist-cheer";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FINALS_COPY } from "@/lib/game/late-game-copy";
import { cn } from "@/lib/utils";

const CARD_CLASS =
  "bg-card/85 backdrop-blur-md border-primary/25 shadow-[0_0_32px_rgba(236,72,153,0.12)]";

interface FinalistCheerPlayerProps {
  participantId: string;
  gender: "male" | "female";
}

export function FinalistCheerPlayer({
  participantId,
  gender,
}: FinalistCheerPlayerProps) {
  const [line, setLine] = useState(() =>
    pickFinalistCheerLine(participantId.length),
  );

  useEffect(() => {
    const interval = window.setInterval(() => {
      setLine(pickFinalistCheerLine(Date.now() + participantId.length));
    }, 4500);
    return () => window.clearInterval(interval);
  }, [participantId]);

  return (
    <Card className={cn(CARD_CLASS, "border-primary/30 text-center")}>
      <CardHeader className="pb-2">
        <CardDescription>{FINALS_COPY.votingCardKicker}</CardDescription>
        <CardTitle className="text-lg">
          {gender === "female" ? "Sei in finale!" : "Sei in finale!"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <motion.p
          key={line}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xl font-display font-bold text-primary"
        >
          {line}
        </motion.p>
        <p className="mt-3 text-sm text-muted-foreground">
          Tu non voti — spacca la prova e lascia giudicare la sala!
        </p>
      </CardContent>
    </Card>
  );
}
