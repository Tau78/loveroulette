#!/usr/bin/env node
/**
 * Carica .env.local e delega a reset-demo.ts (tsx).
 * Uso: npm run reset:demo [-- --clear-players]
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const webRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = join(webRoot, ".env.local");

function loadEnvLocal() {
  if (!existsSync(envPath)) {
    console.warn(
      "reset:demo — .env.local non trovato; uso variabili già presenti in process.env",
    );
    return;
  }

  const content = readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvLocal();

const { main } = await import("./reset-demo.ts");
await main(process.argv.slice(2)).catch((err) => {
  console.error(
    "reset:demo FAIL —",
    err instanceof Error ? err.message : err,
  );
  process.exit(1);
});
