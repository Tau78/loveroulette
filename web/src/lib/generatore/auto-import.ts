import type { SupabaseClient } from "@supabase/supabase-js";
import demo01FullDocument from "../../../data/generatore/DEMO01-manche-full-v1.json";
import {
  importMancheDocument,
  snapshotGeneratoreContent,
} from "@/lib/generatore/manche";
import type { GeneratoreMancheDocument } from "@/lib/generatore/types";
import { isDemoJoinCode } from "@/lib/musicpro/demo-event";
import { getQuestionsForEvent } from "@/lib/musicpro/questions";

export const DEMO01_MANCHE_BUNDLE_ID = "DEMO01-manche-full-v1";

const BUNDLES: Record<string, GeneratoreMancheDocument> = {
  [DEMO01_MANCHE_BUNDLE_ID]: demo01FullDocument as GeneratoreMancheDocument,
};

function countBundleQuestions(document: GeneratoreMancheDocument): number {
  return document.manche.reduce(
    (sum, manche) => sum + manche.questions.length,
    0,
  );
}

function bundleFingerprint(bundleId: string, document: GeneratoreMancheDocument): string {
  return `${bundleId}:${JSON.stringify(snapshotGeneratoreContent(document))}`;
}

export function resolveDefaultGeneratoreBundle(
  eventSlug: string,
  metadata: Record<string, unknown>,
): { bundleId: string; document: GeneratoreMancheDocument } | null {
  const autoImport = metadata.generatore_auto_import;
  if (autoImport === false) return null;

  const configured =
    typeof metadata.generatore_default_bundle === "string"
      ? metadata.generatore_default_bundle.trim()
      : "";

  if (configured && BUNDLES[configured]) {
    return { bundleId: configured, document: BUNDLES[configured] };
  }

  if (isDemoJoinCode(eventSlug)) {
    return {
      bundleId: DEMO01_MANCHE_BUNDLE_ID,
      document: BUNDLES[DEMO01_MANCHE_BUNDLE_ID],
    };
  }

  return null;
}

export interface EnsureGeneratoreImportResult {
  imported: boolean;
  questionCount: number;
  expectedCount: number;
  bundleId: string | null;
}

/** Idempotente: importa il bundle default se mancano domande o il contenuto è cambiato. */
export async function ensureDefaultGeneratoreImport(
  supabase: SupabaseClient,
  eventId: string,
  eventSlug: string,
  metadata: Record<string, unknown> = {},
): Promise<EnsureGeneratoreImportResult> {
  const bundle = resolveDefaultGeneratoreBundle(eventSlug, metadata);
  const { questions } = await getQuestionsForEvent(supabase, eventId);
  const currentCount = questions.length;

  if (!bundle) {
    return {
      imported: false,
      questionCount: currentCount,
      expectedCount: currentCount,
      bundleId: null,
    };
  }

  const expectedCount = countBundleQuestions(bundle.document);
  const fingerprint = bundleFingerprint(bundle.bundleId, bundle.document);
  const storedFingerprint =
    typeof metadata.generatore_import_fingerprint === "string"
      ? metadata.generatore_import_fingerprint
      : null;

  if (
    storedFingerprint === fingerprint &&
    currentCount >= expectedCount
  ) {
    return {
      imported: false,
      questionCount: currentCount,
      expectedCount,
      bundleId: bundle.bundleId,
    };
  }

  const result = await importMancheDocument(
    supabase,
    eventId,
    bundle.document,
  );

  const { data: row } = await supabase
    .from("events")
    .select("metadata")
    .eq("id", eventId)
    .maybeSingle();

  const nextMetadata = {
    ...((row?.metadata ?? {}) as Record<string, unknown>),
    generatore_auto_import: metadata.generatore_auto_import !== false,
    generatore_default_bundle: bundle.bundleId,
    generatore_import_fingerprint: fingerprint,
    generatore_last_auto_import_at: new Date().toISOString(),
  };

  await supabase
    .from("events")
    .update({ metadata: nextMetadata })
    .eq("id", eventId);

  return {
    imported: true,
    questionCount: result.questionCount,
    expectedCount,
    bundleId: bundle.bundleId,
  };
}
