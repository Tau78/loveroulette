import { pathToFileURL } from "node:url";
import { createServiceClient } from "@/lib/supabase/service";
import { DEMO_JOIN_CODE } from "@/lib/musicpro/demo-event";
import { resetLoveRouletteEvent } from "@/lib/musicpro/reset-event";
import { getLoveRouletteEvent } from "@/lib/musicpro/resolve-event";

export interface ResetDemoOptions {
  /** Rimuove anche i giocatori iscritti (default: false). */
  clearParticipants?: boolean;
}

export async function runResetDemo(
  options: ResetDemoOptions = {},
): Promise<void> {
  const clearParticipants = options.clearParticipants === true;
  const supabase = createServiceClient();

  const event = await getLoveRouletteEvent(supabase, DEMO_JOIN_CODE);
  if (!event) {
    throw new Error(
      `Evento ${DEMO_JOIN_CODE} non trovato (ensureDemoEvent non ha creato la riga).`,
    );
  }

  const result = await resetLoveRouletteEvent(supabase, event.id, {
    clearParticipants,
  });

  console.log(
    `Reset complete for ${DEMO_JOIN_CODE} (event_id=${event.id})`,
    result,
  );
}

function parseArgs(argv: string[]): ResetDemoOptions {
  return {
    clearParticipants: argv.includes("--clear-players"),
  };
}

export async function main(argv: string[] = process.argv.slice(2)): Promise<void> {
  await runResetDemo(parseArgs(argv));
}

const isDirectRun =
  typeof process.argv[1] === "string" &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  main().catch((err) => {
    console.error(
      "reset:demo FAIL —",
      err instanceof Error ? err.message : err,
    );
    process.exit(1);
  });
}
