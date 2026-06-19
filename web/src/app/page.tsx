// Dev-only entry hub (DEMO01 shortcuts). Production flow: docs/16-production-entry-flow.md
import Link from "next/link";
import { notFound } from "next/navigation";
import { Heart, Sparkles } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { isProductionApp } from "@/lib/env";

export default function Home() {
  if (isProductionApp()) {
    notFound();
  }

  return (
    <PageShell className="items-center justify-center p-6">
      <div className="max-w-lg w-full space-y-8 text-center">
        <div className="space-y-3">
          <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-primary/15 ring-1 ring-primary/30">
            <Heart className="size-8 text-primary fill-primary/20" />
          </div>
          <h1
            className="text-4xl font-bold tracking-tight"
            style={{ fontFamily: "var(--font-display), serif" }}
          >
            Love Roulette
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Gioco interattivo live in sala — single edition
          </p>
        </div>

        <Card className="border-border/60 bg-card/80 backdrop-blur-sm text-left">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="size-4 text-primary" />
              Demo serata
            </CardTitle>
            <CardDescription>
              Prototipo UI — stesso Supabase MusicPro in convergenza
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Link href="/s/DEMO01">
              <Button size="lg" className="w-full h-12 text-base">
                Evento demo (DEMO01)
              </Button>
            </Link>
            <Link href="/s/DEMO01/display">
              <Button variant="outline" size="lg" className="w-full h-12">
                Display proiettore
              </Button>
            </Link>
            <Link href="/admin/DEMO01">
              <Button variant="secondary" size="lg" className="w-full h-12">
                Dashboard animatore
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
