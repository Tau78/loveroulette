import Link from "next/link";
import { notFound } from "next/navigation";
import { Heart, Sparkles, Ticket } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { runtimeStateLabel, themeClass } from "@/lib/events";
import { getLoveRouletteEvent } from "@/lib/musicpro/resolve-event";
import { isValidEventSlug, normalizeEventSlug } from "@/lib/musicpro/slug";

export default async function EventJoinPage({
  params,
}: {
  params: Promise<{ eventCode: string }>;
}) {
  const { eventCode } = await params;
  const urlSlug = normalizeEventSlug(eventCode);

  if (!isValidEventSlug(urlSlug)) notFound();

  let event = null;
  try {
    const { createServiceClient } = await import("@/lib/supabase/service");
    const supabase = createServiceClient();
    event = await getLoveRouletteEvent(supabase, urlSlug);
  } catch {
    event = null;
  }

  const displayCode = event?.joinCode ?? urlSlug;
  const theme = event?.config.theme ?? "dark_fuchsia";

  return (
    <PageShell
      className={`lr-landing-bg items-center justify-center p-6 ${themeClass(theme)}`}
      theme={
        theme === "romantic_elegant"
          ? "romantic-elegant"
          : theme === "neon_party"
            ? "neon-party"
            : "dark-fuchsia"
      }
    >
      <div
        className="w-full max-w-md space-y-8 text-center animate-fade-in"
        data-theme={theme}
      >
        <div className="space-y-4">
          <div className="inline-flex size-16 items-center justify-center rounded-2xl bg-primary/15 ring-1 ring-primary/25 shadow-[0_0_40px_rgba(233,30,140,0.15)]">
            <Heart className="size-8 text-primary fill-primary/25" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
            Love Roulette
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            {event?.title ?? "Serata non trovata"}
          </h1>
          {event ? (
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <Badge
                variant="outline"
                className="border-primary/30 text-foreground font-mono text-sm px-3 py-1"
              >
                {displayCode}
              </Badge>
              <Badge variant="secondary" className="text-muted-foreground">
                {runtimeStateLabel(event.runtimeState)}
              </Badge>
            </div>
          ) : (
            <p className="text-muted-foreground text-base leading-relaxed max-w-sm mx-auto">
              Il codice{" "}
              <span className="font-mono text-foreground/90">{displayCode}</span>{" "}
              non corrisponde a nessuna serata attiva.
            </p>
          )}
        </div>

        {event ? (
          <Card className="border-border/50 bg-card/75 backdrop-blur-md text-left shadow-xl shadow-primary/5">
            <CardHeader className="pb-3 text-center">
              <CardTitle className="font-display text-xl flex items-center justify-center gap-2">
                <Sparkles className="size-4 text-primary shrink-0" />
                Sei pronto?
              </CardTitle>
              <CardDescription className="text-base">
                Entra in sala o pre-registrati prima della serata.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Link href={`/s/${urlSlug}/play`} className="w-full">
                <Button size="lg" className="w-full h-12 text-base font-semibold">
                  Entra in sala
                </Button>
              </Link>
              <Link href={`/register/${urlSlug}`} className="w-full">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full h-12 text-base border-primary/35 hover:bg-primary/10"
                >
                  Pre-registrati
                </Button>
              </Link>
              <p className="text-center text-sm text-muted-foreground pt-1 flex items-center justify-center gap-1.5">
                <Ticket className="size-3.5 shrink-0 opacity-70" />
                Hai un badge? Scansiona il QR sulla pettorina a cuore.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border/40 bg-card/60 backdrop-blur-md">
            <CardContent className="pt-6 pb-6 space-y-3 text-center">
              <p className="text-muted-foreground leading-relaxed">
                Controlla di aver scritto bene il codice o chiedi all&apos;animatore
                del locale.
              </p>
              <Link href="/" className="block w-full">
                <Button variant="secondary" size="lg" className="w-full h-11">
                  Torna alla home
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {event && (
          <div className="flex justify-center gap-6 text-sm text-muted-foreground">
            <Link
              href={`/s/${urlSlug}/display`}
              className="hover:text-primary transition-colors"
            >
              Schermo display →
            </Link>
            <Link
              href={`/admin/${urlSlug}`}
              className="hover:text-primary transition-colors"
            >
              Area animatore →
            </Link>
          </div>
        )}
      </div>
    </PageShell>
  );
}
