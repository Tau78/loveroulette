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
import {
  invalidRegistrationContactFields,
  type RegistrationContactField,
} from "@/lib/player/registration-validation";
import { cn } from "@/lib/utils";

type RegistrationField = RegistrationContactField | "identity" | "consent";

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
  const [fieldErrors, setFieldErrors] = useState<RegistrationField[]>([]);

  function clearFieldError(field: RegistrationField) {
    setFieldErrors((current) =>
      current.filter((candidate) => candidate !== field),
    );
    setFormError(null);
  }

  function submitRegistration() {
    const invalidContactFields = invalidRegistrationContactFields({
      firstName,
      lastName,
      phone,
      email,
    });
    if (invalidContactFields.length > 0) {
      setFieldErrors(invalidContactFields);
      setFormError("Controlla i campi evidenziati in rosso.");
      return;
    }
    if (!gender || !seeking || !ageBand) {
      setFieldErrors(["identity"]);
      setFormError("Scegli chi sei, chi cerchi e la fascia d’età.");
      return;
    }
    if (!consent) {
      setFieldErrors(["consent"]);
      setFormError("Devi accettare l'informativa privacy.");
      return;
    }

    setFormError(null);
    setFieldErrors([]);
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
          <Field
            label="Nome"
            value={firstName}
            onChange={(value) => {
              setFirstName(value);
              clearFieldError("firstName");
            }}
            invalid={fieldErrors.includes("firstName")}
            required
          />
          <Field
            label="Cognome"
            value={lastName}
            onChange={(value) => {
              setLastName(value);
              clearFieldError("lastName");
            }}
            invalid={fieldErrors.includes("lastName")}
            required
          />
          <Field
            label="Telefono"
            type="tel"
            value={phone}
            onChange={(value) => {
              setPhone(value);
              clearFieldError("phone");
            }}
            invalid={fieldErrors.includes("phone")}
            required
          />
          <Field
            label="Email"
            type="email"
            value={email}
            onChange={(value) => {
              setEmail(value);
              clearFieldError("email");
            }}
            invalid={fieldErrors.includes("email")}
            required
          />
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
            invalid={fieldErrors.includes("identity")}
            onGender={(value) => {
              setGender(value);
              clearFieldError("identity");
            }}
            onSeeking={(value) => {
              setSeeking(value);
              clearFieldError("identity");
            }}
            onAgeBand={(value) => {
              setAgeBand(value);
              clearFieldError("identity");
            }}
          />

          <label className="flex items-start gap-3 text-sm text-muted">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => {
                setConsent(e.target.checked);
                clearFieldError("consent");
              }}
              aria-invalid={fieldErrors.includes("consent")}
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
  invalid,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  invalid?: boolean;
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
        aria-invalid={invalid}
        className={cn(
          "w-full rounded-xl border border-muted/30 bg-surface px-4 py-3",
          invalid && "border-destructive ring-1 ring-destructive/30",
        )}
      />
    </div>
  );
}
