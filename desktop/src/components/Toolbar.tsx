import type { ConnectionStatus } from "../api/types";

interface ToolbarProps {
  host: string;
  code: string;
  pin: string;
  pinRequired: boolean;
  status: ConnectionStatus;
  busy: boolean;
  onHostChange: (v: string) => void;
  onCodeChange: (v: string) => void;
  onPinChange: (v: string) => void;
  onConnect: () => void;
  onSubmitPin: () => void;
}

function statusLabel(status: ConnectionStatus): string {
  switch (status) {
    case "idle":
      return "Non connesso";
    case "connecting":
      return "Connessione…";
    case "connected":
      return "Connesso";
    case "pin_required":
      return "PIN richiesto";
    case "error":
      return "Errore";
    default:
      return status;
  }
}

export function Toolbar({
  host,
  code,
  pin,
  pinRequired,
  status,
  busy,
  onHostChange,
  onCodeChange,
  onPinChange,
  onConnect,
  onSubmitPin,
}: ToolbarProps) {
  return (
    <header className="toolbar">
      <div className="toolbar-brand">
        <span className="toolbar-mark">LR</span>
        <span className="toolbar-title">CasaPad</span>
      </div>

      <label className="field field-host">
        <span>Host</span>
        <input
          type="url"
          value={host}
          onChange={(e) => onHostChange(e.target.value)}
          spellCheck={false}
          autoComplete="off"
          placeholder="https://loveroulette.vercel.app"
        />
      </label>

      <label className="field field-code">
        <span>Evento</span>
        <input
          type="text"
          value={code}
          onChange={(e) => onCodeChange(e.target.value.toUpperCase())}
          spellCheck={false}
          autoComplete="off"
          placeholder="CODICE"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onConnect();
            }
          }}
        />
      </label>

      <button
        type="button"
        className="btn btn-primary"
        onClick={onConnect}
        disabled={busy || !code.trim()}
        title="Cmd+Enter"
      >
        Connetti
      </button>

      {(pinRequired || status === "pin_required" || pin) && (
        <label className="field field-pin">
          <span>PIN</span>
          <input
            id="casa-pin"
            type="password"
            value={pin}
            onChange={(e) => onPinChange(e.target.value)}
            autoComplete="off"
            placeholder="····"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onSubmitPin();
              }
            }}
          />
        </label>
      )}

      {(pinRequired || status === "pin_required") && (
        <button
          type="button"
          className="btn"
          onClick={onSubmitPin}
          disabled={busy || !pin.trim()}
        >
          Verifica PIN
        </button>
      )}

      <div
        className={`status-pill status-${status}`}
        role="status"
        aria-live="polite"
      >
        <span className="status-dot" />
        {statusLabel(status)}
      </div>
    </header>
  );
}
