"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { PLAYER_PRIVACY_SHARING_NOTICE } from "@/lib/player/public-copy";

export default function RegisterPage() {
  const params = useParams();
  const eventCode = String(params.eventCode ?? "").toUpperCase();
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [consent, setConsent] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="min-h-full flex items-center justify-center p-6 theme-dark-fuchsia">
        <div className="max-w-md text-center space-y-4">
          <p className="text-4xl text-accent">♥</p>
          <h1 className="text-2xl font-bold">Pre-registrazione inviata!</h1>
          <p className="text-muted">
            Controlla la tua email per confermare l&apos;account.
          </p>
          <Link
            href={`/s/${eventCode}`}
            className="inline-block mt-4 text-accent hover:underline"
          >
            Torna all&apos;evento →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full flex flex-col p-6 theme-dark-fuchsia">
      <div className="w-full max-w-md mx-auto space-y-6">
        <Link href={`/s/${eventCode}`} className="text-sm text-muted hover:text-accent">
          ← {eventCode}
        </Link>
        <h1 className="text-2xl font-bold">Pre-registrazione</h1>
        <p className="text-muted text-sm">
          Registrati prima della serata per accedere alla chat e al gioco.
        </p>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (consent && email && nickname) setSubmitted(true);
          }}
        >
          <Field label="Email" type="email" value={email} onChange={setEmail} required />
          <Field label="Nickname" value={nickname} onChange={setNickname} required />

          <div>
            <label className="block text-sm text-muted mb-1">Genere</label>
            <div className="grid grid-cols-2 gap-3">
              {(["male", "female"] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGender(g)}
                  className={`rounded-lg py-3 font-medium border ${
                    gender === g
                      ? "border-accent bg-accent/20 text-accent"
                      : "border-muted/30 bg-surface"
                  }`}
                >
                  {g === "male" ? "Uomo" : "Donna"}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-start gap-3 text-sm text-muted">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-1"
              required
            />
            <span>
              Accetto l&apos;informativa privacy e il trattamento dei dati per
              la partecipazione a Love Roulette.
            </span>
          </label>

          <p className="text-xs leading-relaxed text-muted">
            {PLAYER_PRIVACY_SHARING_NOTICE}
          </p>

          <button
            type="submit"
            disabled={!consent}
            className="w-full rounded-xl bg-accent py-4 text-lg font-bold text-white disabled:opacity-50"
          >
            Registrati
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm text-muted mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full rounded-lg bg-surface border border-muted/30 px-4 py-3"
      />
    </div>
  );
}
