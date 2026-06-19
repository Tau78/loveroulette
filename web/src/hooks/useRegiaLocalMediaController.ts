"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  buildLocalMediaItems,
  postRegiaLocalMediaMessage,
  regiaLocalMediaChannel,
  revokeLocalMediaItems,
  type RegiaLocalMediaItem,
  type RegiaLocalMediaMessage,
  type RegiaLocalMediaState,
} from "@/lib/admin/regia-local-media";

interface UseRegiaLocalMediaControllerResult {
  folderName: string | null;
  itemCount: number;
  playing: boolean;
  muted: boolean;
  supported: boolean;
  pickFolder: () => Promise<void>;
  pickFolderFromInput: (files: FileList | null) => void;
  startPlayback: () => void;
  stopPlayback: () => void;
  toggleMute: () => void;
  clearFolder: () => void;
}

export function useRegiaLocalMediaController(
  eventCode: string,
): UseRegiaLocalMediaControllerResult {
  const [folderName, setFolderName] = useState<string | null>(null);
  const [items, setItems] = useState<RegiaLocalMediaItem[]>([]);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [supported, setSupported] = useState(false);

  const stateRef = useRef<RegiaLocalMediaState>({
    folderName: "",
    items: [],
    index: 0,
    playing: false,
    muted: false,
  });

  const broadcast = useCallback(
    (message: RegiaLocalMediaMessage) => {
      postRegiaLocalMediaMessage(eventCode, message);
    },
    [eventCode],
  );

  const broadcastState = useCallback(
    (next: RegiaLocalMediaState) => {
      stateRef.current = next;
      broadcast({ type: "state", state: next });
    },
    [broadcast],
  );

  const applyFolder = useCallback(
    (name: string, files: File[]) => {
      revokeLocalMediaItems(items);
      const nextItems = buildLocalMediaItems(files);
      if (nextItems.length === 0) {
        setFolderName(null);
        setItems([]);
        setPlaying(false);
        broadcast({ type: "clear" });
        return;
      }

      setFolderName(name);
      setItems(nextItems);
      setPlaying(true);
      setMuted(false);

      broadcastState({
        folderName: name,
        items: nextItems,
        index: 0,
        playing: true,
        muted: false,
      });
    },
    [broadcast, broadcastState, items],
  );

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "BroadcastChannel" in window);
  }, []);

  useEffect(() => {
    if (!supported) return;

    const channel = new BroadcastChannel(regiaLocalMediaChannel(eventCode));
    channel.onmessage = (event: MessageEvent<RegiaLocalMediaMessage>) => {
      if (event.data?.type === "sync_request" && stateRef.current.items.length) {
        broadcast({ type: "state", state: stateRef.current });
      }
    };

    return () => channel.close();
  }, [broadcast, eventCode, supported]);

  useEffect(() => {
    return () => revokeLocalMediaItems(items);
  }, [items]);

  const pickFolder = useCallback(async () => {
    if (
      typeof window !== "undefined" &&
      "showDirectoryPicker" in window &&
      typeof window.showDirectoryPicker === "function"
    ) {
      try {
        const handle = await window.showDirectoryPicker();
        const files: File[] = [];
        for await (const entry of handle.values()) {
          if (entry.kind === "file") {
            files.push(await entry.getFile());
          }
        }
        applyFolder(handle.name, files);
        return;
      } catch {
        return;
      }
    }
  }, [applyFolder]);

  const pickFolderFromInput = useCallback(
    (fileList: FileList | null) => {
      if (!fileList?.length) return;
      const files = [...fileList];
      const root =
        files[0].webkitRelativePath.split("/")[0] ||
        files[0].webkitRelativePath ||
        "Cartella locale";
      applyFolder(root, files);
    },
    [applyFolder],
  );

  const startPlayback = useCallback(() => {
    if (!items.length) return;
    setPlaying(true);
    broadcastState({ ...stateRef.current, items, playing: true, index: 0 });
  }, [broadcastState, items]);

  const stopPlayback = useCallback(() => {
    setPlaying(false);
    broadcast({ type: "control", playing: false });
    broadcastState({ ...stateRef.current, playing: false });
  }, [broadcast, broadcastState]);

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      broadcast({ type: "control", muted: next });
      broadcastState({ ...stateRef.current, muted: next });
      return next;
    });
  }, [broadcast, broadcastState]);

  const clearFolder = useCallback(() => {
    revokeLocalMediaItems(items);
    setFolderName(null);
    setItems([]);
    setPlaying(false);
    setMuted(false);
    stateRef.current = {
      folderName: "",
      items: [],
      index: 0,
      playing: false,
      muted: false,
    };
    broadcast({ type: "clear" });
  }, [broadcast, items]);

  return {
    folderName,
    itemCount: items.length,
    playing,
    muted,
    supported,
    pickFolder,
    pickFolderFromInput,
    startPlayback,
    stopPlayback,
    toggleMute,
    clearFolder,
  };
}
