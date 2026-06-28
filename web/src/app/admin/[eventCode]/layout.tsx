"use client";

import { useEffect, type ReactNode } from "react";

/** Regia animatore: viewport fisso, zero scroll pagina. */
export default function AdminEventLayout({ children }: { children: ReactNode }) {
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    html.classList.add("admin-console-root");
    body.classList.add("overflow-hidden");
    return () => {
      html.classList.remove("admin-console-root");
      body.classList.remove("overflow-hidden");
    };
  }, []);

  return children;
}
