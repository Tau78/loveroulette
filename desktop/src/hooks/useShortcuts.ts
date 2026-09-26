import { useEffect } from "react";

export interface ShortcutHandlers {
  onRefresh: () => void;
  onConnect: () => void;
  onFocusPin: () => void;
  onOpenProjector: () => void;
}

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return el.isContentEditable;
}

/**
 * Shortcut CasaPad:
 * - Cmd+R / r — refresh snapshot
 * - Cmd+Enter — connect
 * - Cmd+P — focus PIN (se campo presente) altrimenti apre proiettore
 */
export function useShortcuts(handlers: ShortcutHandlers, enabled = true): void {
  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;

      if (meta && e.key === "Enter") {
        e.preventDefault();
        handlers.onConnect();
        return;
      }

      if (meta && (e.key === "r" || e.key === "R")) {
        e.preventDefault();
        handlers.onRefresh();
        return;
      }

      if (meta && (e.key === "p" || e.key === "P")) {
        e.preventDefault();
        // Preferisci focus PIN; se già sul PIN, apri proiettore
        const pinEl = document.getElementById("casa-pin");
        if (pinEl && document.activeElement !== pinEl) {
          handlers.onFocusPin();
        } else {
          handlers.onOpenProjector();
        }
        return;
      }

      // `r` senza modifier — solo fuori dai campi testo
      if (!meta && !e.altKey && !e.shiftKey && (e.key === "r" || e.key === "R")) {
        if (isTypingTarget(e.target)) return;
        e.preventDefault();
        handlers.onRefresh();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handlers, enabled]);
}
