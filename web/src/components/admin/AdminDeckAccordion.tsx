"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface AdminDeckAccordionContextValue {
  openId: string | null;
  togglePanel: (panelId: string) => void;
  isOpen: (panelId: string) => boolean;
}

const AdminDeckAccordionContext =
  createContext<AdminDeckAccordionContextValue | null>(null);

export function AdminDeckAccordionProvider({ children }: { children: ReactNode }) {
  const [openId, setOpenId] = useState<string | null>(null);

  const togglePanel = useCallback((panelId: string) => {
    setOpenId((current) => (current === panelId ? null : panelId));
  }, []);

  const isOpen = useCallback((panelId: string) => openId === panelId, [openId]);

  const value = useMemo(
    () => ({ openId, togglePanel, isOpen }),
    [openId, togglePanel, isOpen],
  );

  return (
    <AdminDeckAccordionContext.Provider value={value}>
      {children}
    </AdminDeckAccordionContext.Provider>
  );
}

export function useAdminDeckAccordion() {
  return useContext(AdminDeckAccordionContext);
}
