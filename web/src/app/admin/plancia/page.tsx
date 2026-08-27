"use client";

import dynamic from "next/dynamic";

const PlanciaDemo = dynamic(
  () =>
    import("@/components/admin/plancia/PlanciaDemo").then((mod) => mod.PlanciaDemo),
  {
    ssr: false,
    loading: () => (
      <div
        className="h-screen w-screen bg-[#0d0d12]"
        aria-label="Caricamento plancia"
      />
    ),
  },
);

export default function PlanciaDemoPage() {
  return <PlanciaDemo />;
}
