"use client";

import { useCallback, useEffect, useState } from "react";
import {
  clearStoredAnimatorPin,
  readStoredAnimatorPin,
  storeAnimatorPin,
  verifyAnimatorPinApi,
} from "@/lib/admin/animator-api";

interface UseAnimatorPinOptions {
  eventCode: string;
  pinRequired: boolean;
}

export interface UseAnimatorPinResult {
  pin: string | null;
  pinReady: boolean;
  showPinModal: boolean;
  pinError: string | null;
  pinVerifying: boolean;
  submitPin: (value: string) => Promise<void>;
  rejectPin: (message?: string) => void;
  openPinModal: () => void;
}

export function useAnimatorPin({
  eventCode,
  pinRequired,
}: UseAnimatorPinOptions): UseAnimatorPinResult {
  const [pin, setPin] = useState<string | null>(null);
  const [pinReady, setPinReady] = useState(!pinRequired);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinVerifying, setPinVerifying] = useState(false);

  const rejectPin = useCallback(
    (message = "PIN non valido — inseriscilo di nuovo.") => {
      clearStoredAnimatorPin(eventCode);
      setPin(null);
      setPinReady(false);
      setShowPinModal(true);
      setPinError(message);
    },
    [eventCode],
  );

  const openPinModal = useCallback(() => {
    setShowPinModal(true);
    setPinError(null);
  }, []);

  useEffect(() => {
    if (!pinRequired) {
      setPin(null);
      setPinReady(true);
      setShowPinModal(false);
      setPinError(null);
      return;
    }

    let cancelled = false;

    async function bootstrap() {
      setPinReady(false);
      const stored = readStoredAnimatorPin(eventCode);
      if (!stored) {
        setPin(null);
        setPinReady(false);
        setShowPinModal(true);
        return;
      }

      setPinVerifying(true);
      const result = await verifyAnimatorPinApi(eventCode, stored);
      if (cancelled) return;

      setPinVerifying(false);
      if (result.ok) {
        setPin(stored);
        setPinReady(true);
        setShowPinModal(false);
        setPinError(null);
        return;
      }

      clearStoredAnimatorPin(eventCode);
      setPin(null);
      setPinReady(false);
      setShowPinModal(true);
      setPinError(result.error);
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [eventCode, pinRequired]);

  const submitPin = useCallback(
    async (value: string) => {
      const trimmed = value.trim();
      if (!trimmed) {
        setPinError("Inserisci il PIN dell'animatore.");
        return;
      }

      setPinVerifying(true);
      setPinError(null);

      const result = await verifyAnimatorPinApi(eventCode, trimmed);
      setPinVerifying(false);

      if (!result.ok) {
        setPinError(result.error);
        return;
      }

      storeAnimatorPin(eventCode, trimmed);
      setPin(trimmed);
      setPinReady(true);
      setShowPinModal(false);
      setPinError(null);
    },
    [eventCode],
  );

  return {
    pin,
    pinReady,
    showPinModal,
    pinError,
    pinVerifying,
    submitPin,
    rejectPin,
    openPinModal,
  };
}
