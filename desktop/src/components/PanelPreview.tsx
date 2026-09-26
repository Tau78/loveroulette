import { displayEmbedUrl } from "../api/client";

interface PanelPreviewProps {
  host: string;
  code: string;
  connected: boolean;
}

export function PanelPreview({ host, code, connected }: PanelPreviewProps) {
  const url = code.trim() ? displayEmbedUrl(host, code.trim()) : "";

  return (
    <section className="panel panel-preview">
      <header className="panel-head">
        <h2>Anteprima</h2>
        {url ? (
          <a
            className="panel-link"
            href={url}
            target="_blank"
            rel="noreferrer"
            title={url}
          >
            Apri embed
          </a>
        ) : (
          <span className="panel-meta">—</span>
        )}
      </header>
      <div className="preview-frame-wrap">
        {connected && url ? (
          <iframe
            className="preview-frame"
            src={url}
            title="Anteprima display"
            sandbox="allow-scripts allow-same-origin allow-forms"
          />
        ) : (
          <div className="preview-empty">
            Connetti un evento per vedere il display (`?embed=1`).
          </div>
        )}
      </div>
    </section>
  );
}
