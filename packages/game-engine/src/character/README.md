# Sistema di caratteristiche e talenti

Otto caratteristiche genetiche, assegnate una sola volta alla creazione del
personaggio e mai più modificate:

**Costituzione · Forza · Agilità · Percezione · Logica · Ingegno · Personalità · Astuzia**

Ogni coppia di caratteristiche genera un **talento**. Il potenziale massimo
del talento è la somma dei due punteggi genetici; il valore attuale parte da
0 e cresce con l'esperienza in gioco, senza mai superare il potenziale.

> Esempio dell'autore: Forza 5 + Percezione 7 → **Balistica**, potenziale 0/12.

## I 28 talenti

Le 8 caratteristiche generano 28 coppie possibili. Sei sono quelli indicati
dall'autore (contrassegnati sotto); gli altri ventidue sono una **proposta**
pensata per restare coerente con lo stile dei sei originali — punto di
partenza da correggere liberamente, non nomi definitivi.

| Talento | Caratteristiche | Origine |
|---|---|---|
| Furtività | Percezione + Agilità | autore |
| Balistica | Percezione + Forza | autore |
| Visione | Percezione + Costituzione | autore |
| Diagnostica | Percezione + Logica | autore |
| Caccia | Percezione + Ingegno | autore |
| Empatia | Percezione + Personalità | autore |
| Intuizione | Percezione + Astuzia | proposta |
| Resistenza | Costituzione + Forza | proposta |
| Equilibrio | Costituzione + Agilità | proposta |
| Lucidità | Costituzione + Logica | proposta |
| Sopravvivenza | Costituzione + Ingegno | proposta |
| Presenza | Costituzione + Personalità | proposta |
| Dissimulazione | Costituzione + Astuzia | proposta |
| Acrobazia | Forza + Agilità | proposta |
| Demolizione | Forza + Logica | proposta |
| Costruzione | Forza + Ingegno | proposta |
| Intimidazione | Forza + Personalità | proposta |
| Lotta | Forza + Astuzia | proposta |
| Manualità | Agilità + Logica | proposta |
| Trappole | Agilità + Ingegno | proposta |
| Fascino | Agilità + Personalità | proposta |
| Evasione | Agilità + Astuzia | proposta |
| Ingegneria | Logica + Ingegno | proposta |
| Persuasione | Logica + Personalità | proposta |
| Strategia | Logica + Astuzia | proposta |
| Comando | Ingegno + Personalità | proposta |
| Raggiro | Ingegno + Astuzia | proposta |
| Manipolazione | Personalità + Astuzia | proposta |

## File

- `types.ts` — tipi condivisi (caratteristiche, scheda personaggio, progresso talento).
- `talents.ts` — tabella dei 28 talenti e funzioni: `createCharacterSheet`,
  `getTalentPotential`, `getTalentProgress`, `listTalentProgress`,
  `trainTalent`, `talentsForAttribute`, `validateTalentCoverage`.
- `demo.ts` — verifica automatica: copertura delle 28 coppie, esempio
  Balistica dell'autore, rispetto del tetto massimo.

## Uso rapido

```ts
import { createAttributeScores, createCharacterSheet, trainTalent, listTalentProgress } from "./index";

const attributi = createAttributeScores({ forza: 5, percezione: 7 /* ...altre */ });
let scheda = createCharacterSheet(attributi);

scheda = trainTalent(scheda, "balistica", 9); // guadagna 9 punti esperienza in Balistica
listTalentProgress(scheda); // -> elenco di tutti i talenti con potenziale e valore attuale
```

## Non ancora deciso (da specificare quando vorrai)

- Come si assegnano i punteggi iniziali delle 8 caratteristiche (punti da
  distribuire, tiro di dadi, punti fissi da modificare, ecc.) — il codice
  accetta valori già decisi altrove, qualunque sia il metodo.
- Come l'esperienza in gioco si traduce in punti da investire nei talenti
  (per azione riuscita, per missione, per tempo di pratica, ecc.).
- Collegamento dei talenti al motore del mondo (`packages/game-engine/src/world`):
  es. il valore di Balistica potrebbe sommarsi ai modificatori di
  `attacco_a_distanza` già calcolati da vento/luce/bisogni.
