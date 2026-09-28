"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { PlayerIdentityFields } from "@/components/player/PlayerIdentityFields";
import type {
  LoveRouletteAgeBand,
  LoveRouletteGender,
  LoveRouletteSeeking,
} from "@/lib/player/identity";

export default function RegisterPage() {
  const params = useParams();
  const eventCode = String(params.eventCode ?? "").toUpperCase();
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [nickname, setNickname] = useState("");
  const [gender, setGender] = useState<LoveRouletteGender | null>(null);
  const [seeking, setSeeking] = useState<LoveRouletteSeeking | null>(null);
  const [ageBand, setAgeBand] = useState<LoveRouletteAgeBand | null>(null);
  const [consent, setConsent] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function submitRegistration() {
    if (!firstName.trim() || !lastName.trim()) {
      setFormError("Nome e cognome sono obbligatori.");
      return;
    }
    if (phone.trim().length < 6) {
      setFormError("Inserisci un telefono.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setFormError("Inserisci la tua email.");
      return;
    }
    if (!gender || !seeking || !ageBand) {
      setFormError("Scegli chi sei, chi cerchi e la fascia d’età.");
      return;
    }
    if (!consent) {
      setFormError("Devi accettare l'informativa privacy.");
      return;
    }

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
            In sala completi la foto dal telefono. Senza nick si vede il nome.
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
          Nome, cognome, telefono ed email sono obbligatori. Il nick è
          facoltativo: senza nick in sala si vede il nome. La foto si
          aggiunge entrando dal telefono.
        </p>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            submitRegistration();
          }}
        >
          <Field label="Nome" value={firstName} onChange={setFirstName} required />
          <Field label="Cognome" value={lastName} onChange={setLastName} required />
          <Field label="Telefono" type="tel" value={phone} onChange={setPhone} required />
          <Field label="Email" type="email" value={email} onChange={setEmail} required />
          <Field
            label="Nick (facoltativo)"
            value={nickname}
            onChange={setNickname}
            placeholder="Se vuoto si vede il nome"
          />

          <PlayerIdentityFields
            gender={gender}
            seeking={seeking}
            ageBand={ageBand}
            invalid={Boolean(formError) && (!gender || !seeking || !ageBand)}
            onGender={(value) => {
              setGender(value);
              if (formError) setFormError(null);
            }}
            onSeeking={(value) => {
              setSeeking(value);
              if (formError) setFormError(null);
            }}
            onAgeBand={(value) => {
              setAgeBand(value);
              if (formError) setFormError(null);
            }}
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

          {formError ? (
            <p className="text-sm text-destructive" role="alert">
              {formError}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={!consent}
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
