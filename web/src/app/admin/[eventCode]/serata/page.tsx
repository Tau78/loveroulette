"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { normalizeEventSlug } from "@/lib/musicpro/slug";

/**
 * Legacy URL — la plancia ufficiale è solo `/admin/{code}/board`
 * (TestFlight + desktop). Redirect permanente.
 */
export default function SerataPlanciaRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const eventCode = normalizeEventSlug(String(params.eventCode ?? ""));

  useEffect(() => {
    if (!eventCode) return;
    router.replace(`/admin/${encodeURIComponent(eventCode)}/board`);
  }, [eventCode, router]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#0d0d12] text-sm font-semibold uppercase tracking-widest text-white/50">
      Apro la plancia…
    </div>
  );
}
