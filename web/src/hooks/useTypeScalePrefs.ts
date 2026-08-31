"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_TYPE_SCALE_PREFS,
  clampTypeScale,
  loadTypeScalePrefs,
  saveTypeScalePrefs,
  type TypeScalePrefs,
  typeScaleStyleVars,
} from "@/lib/display/type-scale";

/**
 * Preferenze tipografia Schermo / Plancia (localStorage + opzionale sync da config evento).
 */
export function useTypeScalePrefs(eventCode: string) {
  const [prefs, setPrefs] = useState<TypeScalePrefs>(DEFAULT_TYPE_SCALE_PREFS);

  useEffect(() => {
    setPrefs(loadTypeScalePrefs(eventCode));
  }, [eventCode]);

  useEffect(() => {
    let cancelled = false;
    async function hydrateFromEvent() {
      try {
        const res = await fetch(
          `/api/events/${encodeURIComponent(eventCode)}`,
        );
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as {
          config?: {
            display_type_scale?: number | null;
            plancia_type_scale?: number | null;
          };
        };
        const remoteDisplay = data.config?.display_type_scale;
        const remotePlancia = data.config?.plancia_type_scale;
        if (remoteDisplay == null && remotePlancia == null) return;

        setPrefs((prev) => {
          const next = saveTypeScalePrefs(eventCode, {
            display:
              remoteDisplay != null
                ? clampTypeScale(remoteDisplay)
                : prev.display,
            plancia:
              remotePlancia != null
                ? clampTypeScale(remotePlancia)
                : prev.plancia,
          });
          return next;
        });
      } catch {
        // offline / demo — resta localStorage
      }
    }
    void hydrateFromEvent();
    return () => {
      cancelled = true;
    };
  }, [eventCode]);

  const updatePrefs = useCallback(
    (patch: Partial<TypeScalePrefs>) => {
      setPrefs((prev) => saveTypeScalePrefs(eventCode, { ...prev, ...patch }));
    },
    [eventCode],
  );

  const styleVars = typeScaleStyleVars(prefs);

  return { prefs, updatePrefs, styleVars };
}
