"use client";

import { useParams } from "next/navigation";
import { CasaLiveSessionProvider } from "@/components/admin/casa/CasaLiveSessionProvider";
import { CasaBoardGate } from "@/components/admin/casa/CasaBoardGate";
import { normalizeEventSlug } from "@/lib/musicpro/slug";

/**
 * Plancia ufficiale (unificata): scheletro /board + tab Regia / Giocatori /
 * Domande / Setup. /serata, /admin/{code} e /admin/plancia restano per raffronto.
 */
export default function BoardPlanciaPage() {
  const params = useParams();
  const eventCode = normalizeEventSlug(String(params.eventCode ?? ""));
  return (
    <CasaLiveSessionProvider eventCode={eventCode}>
      <CasaBoardGate eventCode={eventCode} />
    </CasaLiveSessionProvider>
  );
}
