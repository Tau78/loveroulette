interface PanelActionsProps {
  pinUnlocked: boolean;
  pinRequired: boolean;
  busy: boolean;
  connected: boolean;
  onVerifyPin: () => void;
  onRefresh: () => void;
  onOpenProjector: () => void;
  onAdvanceQuiz: () => void;
}

export function PanelActions({
  pinUnlocked,
  pinRequired,
  busy,
  connected,
  onVerifyPin,
  onRefresh,
  onOpenProjector,
  onAdvanceQuiz,
}: PanelActionsProps) {
  return (
    <section className="panel">
      <header className="panel-head">
        <h2>Azioni</h2>
        <span className="panel-meta">MVP sicuro</span>
      </header>
      <div className="actions-row">
        {pinRequired && (
          <button
            type="button"
            className="btn"
            onClick={onVerifyPin}
            disabled={busy}
          >
            Verifica PIN
          </button>
        )}
        <button
          type="button"
          className="btn"
          onClick={onRefresh}
          disabled={busy || !connected}
          title="Cmd+R / r"
        >
          Aggiorna
        </button>
        <button
          type="button"
          className="btn"
          onClick={onOpenProjector}
          disabled={!connected}
          title="Cmd+P (se PIN già attivo)"
        >
          Apri proiettore
        </button>
        <button
          type="button"
          className="btn btn-warn"
          onClick={onAdvanceQuiz}
          disabled={busy || !connected || (pinRequired && !pinUnlocked)}
          title="POST /quiz { action: advance } — non è AVANTI completo"
        >
          Advance quiz (API)
        </button>
      </div>
      <p className="actions-note">
        <strong>Advance quiz (API)</strong> chiama solo{" "}
        <code>POST …/quiz</code> con <code>{`{ action: "advance" }`}</code>.
        Il binario AVANTI completo (sigla, slide, matching…) resta sul server /
        plancia web — non reimplementato qui.
      </p>
    </section>
  );
}
