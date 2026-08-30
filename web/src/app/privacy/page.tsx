import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy — Love Roulette",
  description: "Informativa sulla privacy della plancia Love Roulette",
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <main className="min-h-full bg-[#0d0d12] text-white px-6 py-12">
      <article className="mx-auto max-w-2xl space-y-6 text-[17px] leading-relaxed text-[#e8e8ef]">
        <p className="text-sm font-semibold uppercase tracking-wider text-[#E91E8C]">
          Love Roulette
        </p>
        <h1
          className="text-3xl font-bold text-white"
          style={{ fontFamily: "var(--font-display), serif" }}
        >
          Informativa sulla privacy
        </h1>
        <p className="text-[#A0A0B0]">Ultimo aggiornamento: 31 agosto 2026</p>

        <p>
          Love Roulette è una plancia per l’animatore di un evento live in
          sala. Non è un casinò e non è un gioco d’azzardo. Comanda quiz,
          proiettore e telefoni dei partecipanti.
        </p>

        <h2 className="text-xl font-semibold text-white pt-2">Chi gestisce i dati</h2>
        <p>
          Titolare: Mauro Andreoni (MusicPro Eventi), team Apple Individual
          YSU7PL673A. Contatto: andreoni.mauro@gmail.com.
        </p>

        <h2 className="text-xl font-semibold text-white pt-2">App iPhone e iPad</h2>
        <p>
          L’app è la plancia animatore. All’accesso chiediamo utente e password
          staff (stessi di APP Eventi). Sul dispositivo restano la sessione
          login e, se usi i crediti, l’orario di attivazione del credito serata
          (6 ore). Non creiamo un account Apple nell’app e non c’è
          registrazione pubblica.
        </p>

        <h2 className="text-xl font-semibold text-white pt-2">Sito dell'evento</h2>
        <p>
          Proiettore e telefoni usano lo stesso sito (QR / link). I partecipanti
          che entrano dal telefono possono lasciare un soprannome e le risposte
          al quiz di quell'evento. Servono solo a far girare il gioco in sala.
        </p>

        <h2 className="text-xl font-semibold text-white pt-2">Cosa non facciamo</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Non vendiamo dati</li>
          <li>Non mostriamo pubblicità</li>
          <li>Non usiamo tracciamento pubblicitario (ATT)</li>
          <li>Non chiediamo posizione, fotocamera o microfono nell’app</li>
          <li>Non ci sono acquisti in-app né denaro vero</li>
        </ul>

        <h2 className="text-xl font-semibold text-white pt-2">Conservazione</h2>
        <p>
          Sessione login e (se presenti) dati credito restano sul dispositivo
          finché non esci o disinstalli l’app. I dati dell'evento restano sul
          backend finché l’organizzatore tiene aperto l’evento.
        </p>

        <h2 className="text-xl font-semibold text-white pt-2">Apple</h2>
        <p>
          Quando scarichi o aggiorni l’app, Apple tratta i dati previsti
          dall’App Store. La connessione al sito usa solo HTTPS.
        </p>

        <h2 className="text-xl font-semibold text-white pt-2">Bambini</h2>
        <p>
          L’app è per chi conduce un evento per adulti. Non raccogliamo
          dati di minori di proposito.
        </p>

        <p className="text-[#A0A0B0] pt-4">
          Se questa informativa cambia, aggiorniamo la data in alto.
        </p>
      </article>
    </main>
  );
}
