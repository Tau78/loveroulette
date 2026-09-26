import { useCallback, useMemo, useState } from "react";
import {
  clearSession,
  readStoredSession,
  type StaffSession,
} from "./api/auth";
import {
  DEFAULT_HOST,
  displayPresentUrl,
  isTauriRuntime,
  normalizeHost,
} from "./api/client";
import { LoginGate } from "./components/LoginGate";
import { PanelActions } from "./components/PanelActions";
import { PanelLive } from "./components/PanelLive";
import { PanelPreview } from "./components/PanelPreview";
import { PanelStats } from "./components/PanelStats";
import { Toolbar } from "./components/Toolbar";
import { useEventPoll } from "./hooks/useEventPoll";
import { useShortcuts } from "./hooks/useShortcuts";

const CODE_STORAGE = "lr.desktop.event_code";
const HOST_STORAGE = "lr.desktop.host";

function openExternal(url: string): void {
  if (isTauriRuntime()) {
    void import("@tauri-apps/plugin-shell")
      .then((m) => m.open(url))
      .catch(() => {
        window.open(url, "_blank", "noopener,noreferrer");
      });
  } else {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

export default function App() {
  const [session, setSession] = useState<StaffSession | null>(() =>
    readStoredSession(),
  );
  const [host, setHost] = useState(
    () => localStorage.getItem(HOST_STORAGE) ?? DEFAULT_HOST,
  );
  const [code, setCode] = useState(
    () => localStorage.getItem(CODE_STORAGE) ?? "",
  );

  const poll = useEventPoll({
    host,
    code,
    enabled: Boolean(session),
  });

  const onHostChange = (v: string) => {
    setHost(v);
    localStorage.setItem(HOST_STORAGE, v);
  };

  const onCodeChange = (v: string) => {
    setCode(v);
    localStorage.setItem(CODE_STORAGE, v);
  };

  const openProjector = useCallback(() => {
    if (!code.trim()) return;
    openExternal(displayPresentUrl(host, code.trim()));
  }, [host, code]);

  const focusPin = useCallback(() => {
    const el = document.getElementById("casa-pin") as HTMLInputElement | null;
    if (el) {
      el.focus();
      el.select();
    } else {
      openProjector();
    }
  }, [openProjector]);

  const shortcutHandlers = useMemo(
    () => ({
      onRefresh: () => {
        void poll.refresh();
      },
      onConnect: () => {
        void poll.connect();
      },
      onFocusPin: focusPin,
      onOpenProjector: openProjector,
    }),
    [poll, focusPin, openProjector],
  );

  useShortcuts(shortcutHandlers, Boolean(session));

  if (!session) {
    return <LoginGate onLogin={setSession} />;
  }

  const pinRequired =
    Boolean(poll.event?.animatorPinRequired) || poll.status === "pin_required";

  return (
    <div className="app-shell">
      <Toolbar
        host={host}
        code={code}
        pin={poll.pin}
        pinRequired={pinRequired}
        status={poll.status}
        busy={poll.busy}
        onHostChange={onHostChange}
        onCodeChange={onCodeChange}
        onPinChange={poll.setPin}
        onConnect={() => void poll.connect()}
        onSubmitPin={() => void poll.submitPin()}
      />

      {poll.error && (
        <div className="banner-error" role="alert">
          {poll.error}
        </div>
      )}

      <div className="workspace">
        <div className="col-left">
          <PanelLive event={poll.event} lastPolledAt={poll.lastPolledAt} />
          <PanelStats stats={poll.stats} connected={poll.connected} />
          <PanelActions
            pinUnlocked={poll.pinUnlocked}
            pinRequired={pinRequired}
            busy={poll.busy}
            connected={poll.connected}
            onVerifyPin={() => void poll.submitPin()}
            onRefresh={() => void poll.refresh()}
            onOpenProjector={openProjector}
            onAdvanceQuiz={() => void poll.advanceQuiz()}
          />
        </div>
        <div className="col-right">
          <PanelPreview
            host={normalizeHost(host)}
            code={code}
            connected={poll.connected}
          />
        </div>
      </div>

      <footer className="app-footer">
        <span>
          {session.username} ·{" "}
          {isTauriRuntime() ? "Tauri" : "Browser (proxy Vite)"}
        </span>
        <span className="footer-keys">
          <kbd>⌘↵</kbd> Connetti · <kbd>⌘R</kbd>/<kbd>R</kbd> Aggiorna ·{" "}
          <kbd>⌘P</kbd> PIN / proiettore
        </span>
        <button
          type="button"
          className="btn-link"
          onClick={() => {
            clearSession();
            setSession(null);
          }}
        >
          Esci
        </button>
      </footer>
    </div>
  );
}
