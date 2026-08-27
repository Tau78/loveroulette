import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@/components/admin/plancia/plancia-theme.css";

export const metadata: Metadata = {
  title: "Plancia regia — demo",
};

export default function PlanciaLayout({ children }: { children: ReactNode }) {
  return children;
}
