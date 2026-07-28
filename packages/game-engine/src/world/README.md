# World Simulation Engine

Motore di simulazione del mondo di Bitbox: meteo regionale, ambiente (luce e
temperatura), bisogni fisiologici, umore/morale, e un motore di modificatori
che traduce tutto questo in penalità/bonus concreti per le azioni dei
personaggi.

## Moduli

| File | Responsabilità |
|---|---|
| `types.ts` | Tipi condivisi da tutto il sistema |
| `time.ts` | Orologio di gioco: ore, giorni, stagioni, finestra di luce diurna |
| `climate.ts` | Profili climatici di riferimento e regioni di esempio |
| `weather.ts` | Macchina a stati meteo con persistenza regionale/stagionale |
| `environment.ts` | Calcolo di luce e temperatura (aria e percepita) |
| `resources.ts` | Ricchezza di risorse regionali derivata dalla storia meteo |
| `needs.ts` | Fame, sete, energia, debito di sonno |
| `mood.ts` | Umore e morale del personaggio |
| `modifiers.ts` | Aggregazione di tutto in modificatori per azione |
| `world.ts` | `WorldSimulation`: orchestratore con `advance(ore)` |
| `demo.ts` | Esempio eseguibile (confronto regionale + scenario di viaggio) |

## Idee chiave del design

**Regionalità del meteo.** Ogni regione ha un `ClimateProfile` con pesi
diversi per ciascuno stato meteo, per stagione. Un deserto pesa molto
`sereno`/`ventoso`/`tempesta_di_sabbia` e quasi nulla `pioggia_*`; una
foresta pluviale fa l'opposto. Il clima monsonico dimostra come una singola
regione possa avere due "regimi" completamente diversi a seconda della
stagione (secca e ventosa vs. piovosissima).

**Persistenza meteo.** Il prossimo stato meteo non è un tiro puro: lo stato
attuale riceve un bonus (`climate.persistence`) che lo rende più probabile
di ripetersi, per generare sequenze di giorni coerenti (un'ondata di caldo
che dura una settimana) invece di cambi bruschi ogni giorno.

**Risorse derivate, non statiche.** `resources.ts` calcola disponibilità
d'acqua e fertilità da una media mobile delle piogge recenti, non da un
numero scritto a mano. Questo permette a un sistema economico a valle di
spiegare carestie o abbondanze con cause meteo tracciabili nel tempo.

**Modificatori come lista, non come singolo numero.** `computeModifiers`
restituisce sia il totale sia l'elenco dettagliato delle singole cause
(`Vento forte: -13`, `Affamato: -4`, ...), così l'interfaccia di gioco può
mostrare al giocatore *perché* un tiro è penalizzato o favorito.

**Esempi di interazione implementati:**
- Vento forte → penalità a `attacco_a_distanza` (precisione balistica).
- Vento/pioggia forte → **bonus** a `furtivita` (il rumore ambientale copre i
  passi) ma penalità a `percezione_uditiva` di un osservatore.
- Ambiente perfettamente silenzioso → piccola penalità alla furtività (ogni
  passo si sente).
- Buio/luce piena → bonus/penalità simmetrici su furtività e percezione visiva.
- Freddo estremo → penalità da "mani intorpidite" alle azioni di precisione.
- Fame/sete/stanchezza/debito di sonno → penalità crescenti per soglie,
  applicate trasversalmente a tutte le azioni.

## Uso rapido

```ts
import { WorldSimulation, REGIONS, createDefaultNeeds, createDefaultMood, computeModifiers } from "./index";

const world = new WorldSimulation(REGIONS);
world.advance(6); // fa avanzare il tempo di 6 ore

const region = world.getRegion("khal-arida");
const needs = createDefaultNeeds();
const mood = createDefaultMood();

const result = computeModifiers("attacco_a_distanza", {
  weather: region.weather.current,
  environment: region.environment,
  needs,
  mood,
  params: { distanceMeters: 30 },
});

console.log(result.total, result.modifiers);
```

## Estensioni previste (non ancora implementate)

- Equipaggiamento come modificatore d'isolamento termico/protezione dal vento.
- Fasi lunari per affinare il chiarore notturno.
- Direzione del vento relativa alla direzione di tiro (oggi si considera solo
  l'intensità).
- Hook economico che consumi `RegionResourceIndex` per prezzi/commerci.
