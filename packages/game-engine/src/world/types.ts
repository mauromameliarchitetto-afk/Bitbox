// ============================================================
// Bitbox — World Simulation Engine
// Tipi condivisi
// ============================================================

/** Le quattro stagioni dell'anno di gioco. */
export type Season = "primavera" | "estate" | "autunno" | "inverno";

/** Fasce climatiche di base: determinano il "carattere" meteorologico di una regione. */
export type ClimateType =
  | "arido" // deserto, steppa secca: poca pioggia, molto vento, forti escursioni termiche
  | "mediterraneo" // estati calde e secche, inverni miti e piovosi
  | "temperato" // quattro stagioni bilanciate
  | "continentale" // inverni rigidi, estati calde, poca influenza del mare
  | "tropicale" // caldo e piovoso quasi tutto l'anno
  | "monsonico" // stagione secca marcata + stagione delle piogge marcata
  | "alpino" // quota elevata, freddo, vento forte, precipitazioni nevose
  | "polare"; // freddo estremo, luce diurna molto variabile

/** Stati meteorologici discreti che una regione può attraversare. */
export type WeatherState =
  | "sereno"
  | "poco_nuvoloso"
  | "nuvoloso"
  | "pioggia_leggera"
  | "pioggia_intensa"
  | "temporale"
  | "nebbia"
  | "ventoso"
  | "tempesta_di_sabbia"
  | "neve"
  | "bufera_di_neve"
  | "ondata_di_calore";

/** Fascia di latitudine, usata per calcolare la lunghezza del giorno. */
export type LatitudeBand = "equatoriale" | "temperata" | "polare";

export interface WorldTime {
  /** Minuti totali trascorsi dall'inizio della simulazione. */
  totalMinutes: number;
}

export interface SeasonalRange {
  min: number;
  max: number;
}

/** Descrive il comportamento climatico atteso di una regione, stagione per stagione. */
export interface ClimateProfile {
  type: ClimateType;
  latitudeBand: LatitudeBand;
  /** Temperatura media (°C) attesa in ciascuna stagione. */
  temperature: Record<Season, SeasonalRange>;
  /**
   * Peso relativo (non normalizzato) di ciascuno stato meteo, per stagione.
   * Definisce la "personalità" climatica della regione: un deserto avrà pesi
   * alti per sereno/ventoso/tempesta_di_sabbia e quasi nulli per pioggia,
   * mentre una foresta pluviale avrà l'opposto.
   */
  weatherWeights: Record<Season, Partial<Record<WeatherState, number>>>;
  /**
   * Quanto la regione tende a "restare" nello stato meteo attuale prima di
   * cambiare (1 = nessuna inerzia, 3 = molto persistente, come una stagione
   * delle piogge tropicale che dura settimane).
   */
  persistence: number;
  /** Altitudine media in metri: incide sulla temperatura (gradiente adiabatico). */
  altitudeMeters: number;
  /** Capacità di base della falda/riserva idrica, indipendente dalla pioggia recente (0-1). */
  baseAquifer: number;
}

export interface RegionDefinition {
  id: string;
  name: string;
  climate: ClimateProfile;
}

/** Stato meteo istantaneo e "vissuto" di una regione in un dato momento. */
export interface WeatherSnapshot {
  state: WeatherState;
  /** Velocità del vento in km/h. */
  windSpeedKmh: number;
  /** Intensità della pioggia, 0 (assente) - 1 (violenta). */
  rainIntensity: number;
  /** Copertura nuvolosa, 0 (cielo terso) - 1 (coperto). */
  cloudCover: number;
  /** Visibilità orizzontale in metri (nebbia/tempeste la riducono). */
  visibilityMeters: number;
  /** Umidità relativa, 0-1. */
  humidity: number;
}

export interface EnvironmentSnapshot {
  /** Livello di luce percepito, 0 (buio totale) - 1 (piena luce diurna). */
  lightLevel: number;
  lightLabel: "buio_totale" | "penombra" | "crepuscolo" | "luce_attenuata" | "piena_luce";
  /** Temperatura dell'aria in °C. */
  airTemperatureC: number;
  /** Temperatura "percepita" in °C (corretta per vento e umidità). */
  feltTemperatureC: number;
  comfortLabel: "gelido" | "freddo" | "fresco" | "confortevole" | "caldo" | "torrido" | "estremo";
}

/** Bisogni fisiologici del personaggio, scala 0-100 (100 = pienamente soddisfatto). */
export interface CharacterNeeds {
  hunger: number;
  thirst: number;
  energy: number;
  /** Debito di sonno accumulato: non si azzera col semplice riposo breve. */
  sleepDebt: number;
}

export type ActivityLevel = "riposo" | "normale" | "viaggio" | "combattimento";

export interface MoodEventImpulse {
  /** Etichetta descrittiva dell'evento che ha causato la spinta di umore. */
  label: string;
  /** Delta applicato all'umore (-100..+100), che decade nel tempo. */
  delta: number;
  /** Quanto rapidamente l'effetto di questo evento si esaurisce (0-1 per tick). */
  decayPerTick: number;
}

export interface MoodState {
  /** Umore corrente, -100 (disperazione) .. +100 (esaltazione), 0 = neutro. */
  value: number;
  impulses: MoodEventImpulse[];
}

export type MoraleLabel = "disperato" | "scoraggiato" | "neutro" | "motivato" | "esaltato";

/** Un singolo modificatore applicabile a un'azione o a un tiro. */
export interface Modifier {
  source: string;
  label: string;
  value: number;
  /** "additivo": si somma a un tiro; "moltiplicativo": scala un valore (es. tempo, costo stamina). */
  type: "additivo" | "moltiplicativo";
}

export interface ModifierResult {
  modifiers: Modifier[];
  total: number;
}

export type ActionType =
  | "attacco_a_distanza"
  | "furtivita"
  | "percezione_visiva"
  | "percezione_uditiva"
  | "movimento"
  | "coraggio"
  | "sociale";
