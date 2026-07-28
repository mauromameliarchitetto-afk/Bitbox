// ============================================================
// Bitbox — Sistema di caratteristiche e talenti
// ============================================================

/**
 * Le otto caratteristiche genetiche di una creatura vivente. Si assegnano
 * una sola volta, alla creazione del personaggio, e non cambiano più nel
 * corso della partita.
 */
export type Attribute =
  | "costituzione"
  | "forza"
  | "agilita"
  | "percezione"
  | "logica"
  | "ingegno"
  | "personalita"
  | "astuzia";

export const ATTRIBUTES: Attribute[] = [
  "costituzione",
  "forza",
  "agilita",
  "percezione",
  "logica",
  "ingegno",
  "personalita",
  "astuzia",
];

export const ATTRIBUTE_LABEL: Record<Attribute, string> = {
  costituzione: "Costituzione",
  forza: "Forza",
  agilita: "Agilità",
  percezione: "Percezione",
  logica: "Logica",
  ingegno: "Ingegno",
  personalita: "Personalità",
  astuzia: "Astuzia",
};

/** Punteggio (valore genetico) per ciascuna delle otto caratteristiche. */
export type AttributeScores = Record<Attribute, number>;

/**
 * Un talento nasce dalla combinazione di due caratteristiche. Il suo
 * potenziale massimo raggiungibile è la somma dei due punteggi genetici; il
 * valore attuale parte da 0 e cresce con l'esperienza in gioco.
 */
export interface TalentDefinition {
  id: string;
  name: string;
  attributes: [Attribute, Attribute];
}

/** Progresso di un singolo talento per un personaggio specifico. */
export interface TalentProgress {
  id: string;
  name: string;
  attributes: [Attribute, Attribute];
  potential: number;
  current: number;
}

export interface CharacterSheet {
  attributes: AttributeScores;
  /** Valore attuale di ciascun talento (talentId -> punti guadagnati). */
  talentPoints: Record<string, number>;
}
