"use client";

import { useParams } from "next/navigation";
import { CasaPad } from "@/components/admin/casa/CasaPad";
import { normalizeEventSlug } from "@/lib/musicpro/slug";

export default function SerataPlanciaPage() {
  const params = useParams();
  const eventCode = normalizeEventSlug(String(params.eventCode ?? ""));
  return <CasaPad eventCode={eventCode} />;
}
