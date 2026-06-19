"use client";

import { useEffect, useState } from "react";
import {
  postRegiaLocalMediaMessage,
  regiaLocalMediaChannel,
  type RegiaLocalMediaMessage,
  type RegiaLocalMediaState,
} from "@/lib/admin/regia-local-media";

const EMPTY_STATE: RegiaLocalMediaState = {
  folderName: "",
  items: [],
  index: 0,
  playing: false,
  muted: false,
};

export function useRegiaLocalMediaReceiver(eventCode: string) {
  const [state, setState] = useState<RegiaLocalMediaState>(EMPTY_STATE);

  useEffect(() => {
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) {
      return;
    }

    const channel = new BroadcastChannel(regiaLocalMediaChannel(eventCode));

    channel.onmessage = (event: MessageEvent<RegiaLocalMediaMessage>) => {
      const message = event.data;
      if (!message?.type) return;

      if (message.type === "state") {
        setState(message.state);
        return;
      }

      if (message.type === "clear") {
        setState(EMPTY_STATE);
        return;
      }

      if (message.type === "control") {
        setState((prev) => ({
          ...prev,
          playing: message.playing ?? prev.playing,
          muted: message.muted ?? prev.muted,
          index: message.index ?? prev.index,
        }));
      }
    };

    postRegiaLocalMediaMessage(eventCode, { type: "sync_request" });

    return () => channel.close();
  }, [eventCode]);

  const active =
    state.playing && state.items.length > 0 && state.index < state.items.length;

  return { state, active };
}
