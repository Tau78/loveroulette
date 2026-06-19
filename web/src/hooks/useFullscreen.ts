"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "lr_admin_fullscreen_pref";

function getFullscreenElement(): Element | null {
  return (
    document.fullscreenElement ??
    (document as Document & { webkitFullscreenElement?: Element | null })
      .webkitFullscreenElement ??
    null
  );
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
}

interface UseFullscreenOptions {
  storageKey?: string;
  enableShortcut?: boolean;
  /** When true, F toggles without requiring focus inside the container (e.g. projector page). */
  alwaysListenShortcut?: boolean;
}

export function useFullscreen({
  storageKey = STORAGE_KEY,
  enableShortcut = true,
  alwaysListenShortcut = false,
}: UseFullscreenOptions = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [supported, setSupported] = useState(false);

  const syncState = useCallback(() => {
    const el = containerRef.current;
    setIsFullscreen(Boolean(el && getFullscreenElement() === el));
  }, []);

  useEffect(() => {
    setSupported(
      typeof document !== "undefined" && document.fullscreenEnabled !== false,
    );
    document.addEventListener("fullscreenchange", syncState);
    document.addEventListener("webkitfullscreenchange", syncState);
    return () => {
      document.removeEventListener("fullscreenchange", syncState);
      document.removeEventListener("webkitfullscreenchange", syncState);
    };
  }, [syncState]);

  const persistPreference = useCallback(
    (active: boolean) => {
      try {
        sessionStorage.setItem(storageKey, active ? "1" : "0");
      } catch {
        // ignore quota / private mode
      }
    },
    [storageKey],
  );

  const enter = useCallback(async () => {
    const el = containerRef.current;
    if (!el) return;

    try {
      if (el.requestFullscreen) {
        await el.requestFullscreen();
      } else {
        const webkitEl = el as HTMLElement & {
          webkitRequestFullscreen?: () => Promise<void>;
        };
        await webkitEl.webkitRequestFullscreen?.();
      }
      persistPreference(true);
    } catch {
      // gesture or policy may block fullscreen
    }
  }, [persistPreference]);

  const exit = useCallback(async () => {
    if (!getFullscreenElement()) return;

    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else {
        const webkitDoc = document as Document & {
          webkitExitFullscreen?: () => Promise<void>;
        };
        await webkitDoc.webkitExitFullscreen?.();
      }
      persistPreference(false);
    } catch {
      // ignore
    }
  }, [persistPreference]);

  const toggle = useCallback(async () => {
    if (isFullscreen) {
      await exit();
    } else {
      await enter();
    }
  }, [isFullscreen, enter, exit]);

  useEffect(() => {
    if (!enableShortcut) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "f" && event.key !== "F") return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isEditableTarget(event.target)) return;

      const container = containerRef.current;
      if (!container) return;

      if (!alwaysListenShortcut) {
        const active = document.activeElement;
        const dashboardFocused =
          active === document.body ||
          active === container ||
          (active instanceof Node && container.contains(active));

        if (!dashboardFocused) return;
      }

      event.preventDefault();
      void toggle();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [alwaysListenShortcut, enableShortcut, toggle]);

  return {
    containerRef,
    isFullscreen,
    supported,
    enter,
    exit,
    toggle,
  };
}
