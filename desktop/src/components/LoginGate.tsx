import { useState, type FormEvent } from "react";
import {
  loginWithPassword,
  persistSession,
  type StaffSession,
} from "../api/auth";

interface LoginGateProps {
  onLogin: (session: StaffSession) => void;
}

export function LoginGate({ onLogin }: LoginGateProps) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const result = loginWithPassword(username, password);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    persistSession(result.session);
    onLogin(result.session);
  };

  return (
    <div className="login-gate">
      <form className="login-card" onSubmit={submit}>
        <p className="eyebrow">Love Roulette</p>
        <h1>CasaPad</h1>
        <p className="lede">Accesso plancia (bootstrap locale)</p>
        <label className="field">
          <span>Utente</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
        </label>
        <label className="field">
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </label>
        {error && <p className="error-line">{error}</p>}
        <button type="submit" className="btn btn-primary btn-block">
          Entra
        </button>
      </form>
    </div>
  );
}
