# Bitbox — Web app

Client web (PWA in divenire) di Bitbox. Al momento contiene il **banco di
prova del motore del mondo**: meteo regionale, ambiente, bisogni, umore e
modificatori d'azione, con un'interfaccia per testarli in tempo reale.

## Avvio in locale

```bash
npm install
npm run dev
```

Apri l'indirizzo mostrato in console (di norma `http://localhost:5173`).

## Build di produzione

```bash
npm run build   # genera dist/
npm run preview # serve la build per un controllo rapido
```

## Struttura

```text
apps/web/
├── index.html
├── vite.config.js
├── package.json
└── src/
    ├── main.jsx          # entry point React
    ├── index.css         # stile globale (palette, tipografia, componenti)
    ├── world-engine.js    # motore di simulazione, JS puro senza dipendenze UI
    └── WorldTester.jsx    # interfaccia del banco di prova
```

`world-engine.js` non dipende da React: è pensato per essere riusabile anche
da altre interfacce (una futura app Android, un servizio backend) mano a
mano che la logica di gioco converge con `packages/game-engine`.

## Prossimi passi

- Convertire in PWA installabile (manifest + service worker).
- Sostituire il banco di prova con le schermate reali del gioco, mantenendo
  `world-engine.js` come base condivisa.
- Allineare `world-engine.js` alla versione TypeScript in
  `packages/game-engine/src/world`, così le due implementazioni non divergano.
