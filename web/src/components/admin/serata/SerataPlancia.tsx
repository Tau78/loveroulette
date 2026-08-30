"use client";

import Link from "next/link";

/** Stub: the live serata console files are not in this tree. */
export function SerataPlancia({ eventCode }: { eventCode: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#0d0d12] p-6 text-center text-white">
      <p className="text-lg font-bold">Plancia evento</p>
      <p className="text-sm text-[#d4d4de]">Evento {eventCode}</p>
      <Link href="/admin/plancia" className="text-sm font-semibold text-primary underline">
        Apri la plancia animatore
      </Link>
    </div>
  );
}
