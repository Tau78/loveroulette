/**
 * Copy fasi finali — tono game show, proiettore + mobile.
 * Evitare riferimenti all'animatore nel copy giocatore/display.
 */

export const ELIMINATION_COPY = {
  badge: "Eliminazione",
  displayKicker: "Eliminazione",
  displayHeadline:
    "Stiamo per entrare nella fase di eliminazione delle coppie meno affini",
  displaySubline: "Ne rimarranno solo 3",
  displayFinalistsReady: "Restano 3 coppie — la fase finale sta per iniziare",
  displayInProgress: "Si eliminano le coppie meno affini…",
  displayEliminatedKicker: "Eliminati",
  playerSubtitle: "Eliminazione in corso — ne rimarranno solo 3",
} as const;

export const FINALS_COPY = {
  badge: "Fase finale",
  displayKicker: "Fase finale",
  displayHeadline: "Le prove",
  displayWaitingSubline: "Tra poco potrai votare dal telefono",
  displayVoteSubline: "Ora sei tu il giudice — vota la tua coppia preferita",
  displayVotePrepHeadline: "Ora tocca a te",
  displayVotePrepSubline: "Prendi il telefono e vota",
  displayWinnerKicker: "Vincitori",
  displayWinnerHeadline: "Ecco la coppia vincitrice!",
  displayVoteClosed: "Votazione chiusa — guarda il conteggio",
  displayChallengePrefix: "Prova",
  playerWaiting: "Fase finale: le prove — tra poco voti tu",
  playerVoting: "Ora sei tu il giudice — vota la tua coppia preferita!",
  playerWinner: "Ecco la coppia vincitrice!",
  playerVoteClosed: "Grazie per il voto — guarda gli schermi!",
  votingCardKicker: "Fase finale — le prove",
  votingCardTitle: "Ora sei tu il giudice: vota la tua coppia preferita",
} as const;

export const CLOSED_COPY = {
  badge: "A presto",
  displayKicker: "Fine partita",
  displayHeadline: "Ci vediamo al prossimo evento",
  displaySubline: "Grazie per aver giocato con noi!",
  playerSubtitle: "Ci vediamo al prossimo evento!",
} as const;

export const MATCHING_COPY = {
  badge: "Roulette",
  displayKicker: "Roulette",
  displayHeadline: "Calcolo delle affinità…",
  displaySubline: "Le coppie stanno prendendo forma",
  playerSubtitle: "La roulette sta girando — chi sarà la tua metà?",
} as const;

export const EXTRACTION_COPY = {
  badge: "Estrazione",
  displayKicker: "Estrazione",
  displayHeadline: "La coppia sta per essere rivelata",
  displaySubline: "Tieni d'occhio gli schermi",
  playerSubtitle: "Estrazione coppie in corso!",
} as const;

export const DEFAULT_PLAYER_SUBTITLE = "Segui gli schermi in sala";
