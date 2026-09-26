import type { SessionStats } from "../api/types";

interface PanelStatsProps {
  stats: SessionStats;
  connected: boolean;
}

export function PanelStats({ stats, connected }: PanelStatsProps) {
  return (
    <section className="panel">
      <header className="panel-head">
        <h2>Stats</h2>
        <span className="panel-meta">/session</span>
      </header>
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-value">{connected ? stats.onlineCount : "—"}</span>
          <span className="stat-label">online</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">
            {connected ? stats.participantCount : "—"}
          </span>
          <span className="stat-label">partecipanti</span>
        </div>
      </div>
    </section>
  );
}
