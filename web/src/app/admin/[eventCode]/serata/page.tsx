"use client";

import { useParams } from "next/navigation";
import { CasaLiveSessionProvider } from "@/components/admin/casa/CasaLiveSessionProvider";
import { CasaPad } from "@/components/admin/casa/CasaPad";
import { CasaPinGate } from "@/components/admin/casa/CasaPinGate";
import { normalizeEventSlug } from "@/lib/musicpro/slug";

export default function SerataPlanciaPage() {
  const params = useParams();
  const eventCode = normalizeEventSlug(String(params.eventCode ?? ""));
  return (
    <CasaLiveSessionProvider eventCode={eventCode}>
      <CasaPinGate />
      <CasaPad eventCode={eventCode} />
    </CasaLiveSessionProvider>
  );
}
