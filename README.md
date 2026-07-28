# Bitbox

Bitbox è un'applicazione per la gestione digitale di giochi di ruolo, progettata come web app installabile (PWA) e applicazione Android.

## Struttura

```text
bitbox/
├── apps/
│   ├── web/
│   └── android/
├── backend/
│   └── api/
├── packages/
│   ├── game-engine/
│   ├── game-data/
│   └── shared/
├── docs/
├── scripts/
└── .github/workflows/
```

- **apps/web** — client web installabile (PWA)
- **apps/android** — applicazione Android nativa
- **backend/api** — servizi backend e API
- **packages/game-engine** — logica di gioco condivisa
- **packages/game-data** — dati e contenuti di gioco
- **packages/shared** — codice condiviso tra i vari pacchetti/app
- **docs** — documentazione del progetto
- **scripts** — script di supporto (build, deploy, automazioni)
- **.github/workflows** — pipeline CI/CD

## Stato del progetto

Repository in fase di scaffolding iniziale. Le singole app e i pacchetti verranno popolati progressivamente.

## Note

Questo progetto è indipendente da altri repository dell'autore.
