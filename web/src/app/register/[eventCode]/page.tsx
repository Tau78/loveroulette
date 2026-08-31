"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { DataVisibilitySelector } from "@/components/player/DataVisibilitySelector";
import { DEFAULT_PARTICIPANT_DATA_VISIBILITY } from "@/lib/player/data-visibility";
import type { ParticipantDataVisibility } from "@/lib/musicpro/types";
import {
  NICKNAME_FROM_REAL_NAME_PROMPT,
  nicknameSaveErrorMessage,
  resolveNicknameOnSave,
} from "@/lib/player/nickname-save";

export default function RegisterPage() {
  const params = useParams();
  const eventCode = String(params.eventCode ?? "").toUpperCase();
  const [email, setEmail] = useState("");
  const [realName, setRealName] = useState("");
  const [nickname, setNickname] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [dataVisibility, setDataVisibility] = useState<ParticipantDataVisibility>(
    DEFAULT_PARTICIPANT_DATA_VISIBILITY,
  );
  const [consent, setConsent] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [nickConfirmOpen, setNickConfirmOpen] = useState(false);

  function submitRegistration(opts?: { confirmUseRealName?: boolean }) {
    if (!email.trim()) {
      setFormError("Inserisci la tua email.");
      return;
    }
    if (!dataVisibility) {
      setFormError("Scegli chi può vedere i tuoi dati personali.");
      return;
    }
    if (!consent) {
      setFormError("Devi accettare l'informativa privacy.");
      return;
    }

    const resolved = resolveNicknameOnSave({
      realName,
      nickname,
      confirmUseRealName: opts?.confirmUseRealName,
    });

    if (!resolved.ok) {
      if (resolved.reason === "NEED_CONFIRM") {
        setNickConfirmOpen(true);
        setFormError(NICKNAME_FROM_REAL_NAME_PROMPT);
        return;
      }
      setNickConfirmOpen(false);
      setFormError(nicknameSaveErrorMessage(resolved.reason));
      return;
    }

    setNickname(resolved.nickname);
    setNickConfirmOpen(false);
    setFormError(null);
    setSubmitted(true);
  }

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
          Registrati prima della serata per accedere alla chat e al gioco. Il
          nickname è obbligatorio e verrà mostrato a schermo.
        </p>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            submitRegistration();
          }}
        >
          <Field label="Email" type="email" value={email} onChange={setEmail} required />
          <Field
            label="Nome"
            value={realName}
            onChange={(v) => {
              setRealName(v);
              if (nickConfirmOpen) setNickConfirmOpen(false);
            }}
          />
          <Field
            label="Nickname (obbligatorio)"
            value={nickname}
            onChange={(v) => {
              setNickname(v);
              if (nickConfirmOpen) setNickConfirmOpen(false);
            }}
            placeholder="Se vuoto userai il nome"
          />

          {nickConfirmOpen ? (
            <div
              role="dialog"
              aria-modal="true"
              className="rounded-xl border border-amber-400/40 bg-amber-950/35 p-4 space-y-3"
            >
              <p className="text-sm font-medium text-amber-50">
                {NICKNAME_FROM_REAL_NAME_PROMPT}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => submitRegistration({ confirmUseRealName: true })}
                  className="rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white"
                >
                  Sì, usa il nome
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNickConfirmOpen(false);
                    setFormError(null);
                  }}
                  className="rounded-lg border border-muted/40 px-3 py-2 text-sm"
                >
                  No, inserisco un nickname
                </button>
              </div>
            </div>
          ) : null}

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

          <DataVisibilitySelector
            value={dataVisibility}
            onChange={(value) => {
              setDataVisibility(value);
              if (formError) setFormError(null);
            }}
            invalid={Boolean(formError) && !nickConfirmOpen}
          />

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

          {formError && !nickConfirmOpen ? (
            <p className="text-sm text-destructive" role="alert">
              {formError}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={!consent || nickConfirmOpen}
            className="w-full rounded-xl bg-accent py-4 text-lg font-bold text-white disabled:opacity-50"
          >
            Salva registrazione
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
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm text-muted mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-xl border border-muted/30 bg-surface px-4 py-3"
      />
    </div>
  );
}
