"use client";

import { useParams } from "next/navigation";
import { CasaLiveSessionProvider } from "@/components/admin/casa/CasaLiveSessionProvider";
import { CasaPlanciaGate } from "@/components/admin/casa/CasaPlanciaGate";
import { normalizeEventSlug } from "@/lib/musicpro/slug";

export default function SerataPlanciaPage() {
  const params = useParams();
  const eventCode = normalizeEventSlug(String(params.eventCode ?? ""));
  return (
    <CasaLiveSessionProvider eventCode={eventCode}>
      <CasaPlanciaGate eventCode={eventCode} />
    </CasaLiveSessionProvider>
  );
}
