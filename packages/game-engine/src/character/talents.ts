import { Attribute, AttributeScores, CharacterSheet, TalentDefinition, TalentProgress, ATTRIBUTES } from "./types";

/**
 * Le otto caratteristiche generano 28 coppie possibili (8 su 2), quindi 28
 * talenti. Sei sono quelli indicati dall'autore (tutti derivati dalla
 * Percezione); gli altri ventidue sono una proposta di base, pensata per
 * restare coerente con lo stile dei sei originali — vanno intesi come punto
 * di partenza da correggere liberamente, non come nomi definitivi.
 */
export const TALENTS: TalentDefinition[] = [
  // -- coppie con Percezione (le sei originali + una proposta) --
  { id: "furtivita", name: "Furtività", attributes: ["percezione", "agilita"] },
  { id: "balistica", name: "Balistica", attributes: ["percezione", "forza"] },
  { id: "visione", name: "Visione", attributes: ["percezione", "costituzione"] },
  { id: "diagnostica", name: "Diagnostica", attributes: ["percezione", "logica"] },
  { id: "caccia", name: "Caccia", attributes: ["percezione", "ingegno"] },
  { id: "empatia", name: "Empatia", attributes: ["percezione", "personalita"] },
  { id: "intuizione", name: "Intuizione", attributes: ["percezione", "astuzia"] }, // proposta

  // -- coppie con Costituzione (proposte) --
  { id: "resistenza", name: "Resistenza", attributes: ["costituzione", "forza"] },
  { id: "equilibrio", name: "Equilibrio", attributes: ["costituzione", "agilita"] },
  { id: "lucidita", name: "Lucidità", attributes: ["costituzione", "logica"] },
  { id: "sopravvivenza", name: "Sopravvivenza", attributes: ["costituzione", "ingegno"] },
  { id: "presenza", name: "Presenza", attributes: ["costituzione", "personalita"] },
  { id: "dissimulazione", name: "Dissimulazione", attributes: ["costituzione", "astuzia"] },

  // -- coppie con Forza (proposte) --
  { id: "acrobazia", name: "Acrobazia", attributes: ["forza", "agilita"] },
  { id: "demolizione", name: "Demolizione", attributes: ["forza", "logica"] },
  { id: "costruzione", name: "Costruzione", attributes: ["forza", "ingegno"] },
  { id: "intimidazione", name: "Intimidazione", attributes: ["forza", "personalita"] },
  { id: "lotta", name: "Lotta", attributes: ["forza", "astuzia"] },

  // -- coppie con Agilità (proposte) --
  { id: "manualita", name: "Manualità", attributes: ["agilita", "logica"] },
  { id: "trappole", name: "Trappole", attributes: ["agilita", "ingegno"] },
  { id: "fascino", name: "Fascino", attributes: ["agilita", "personalita"] },
  { id: "evasione", name: "Evasione", attributes: ["agilita", "astuzia"] },

  // -- coppie con Logica (proposte) --
  { id: "ingegneria", name: "Ingegneria", attributes: ["logica", "ingegno"] },
  { id: "persuasione", name: "Persuasione", attributes: ["logica", "personalita"] },
  { id: "strategia", name: "Strategia", attributes: ["logica", "astuzia"] },

  // -- coppie con Ingegno (proposte) --
  { id: "comando", name: "Comando", attributes: ["ingegno", "personalita"] },
  { id: "raggiro", name: "Raggiro", attributes: ["ingegno", "astuzia"] },

  // -- Personalità + Astuzia (proposta) --
  { id: "manipolazione", name: "Manipolazione", attributes: ["personalita", "astuzia"] },
];

const TALENT_BY_ID: Record<string, TalentDefinition> = Object.fromEntries(TALENTS.map((t) => [t.id, t]));

/** Verifica che ogni coppia di caratteristiche compaia in esattamente un talento. */
export function validateTalentCoverage(): { ok: boolean; missing: string[]; duplicates: string[] } {
  const seen = new Set<string>();
  const duplicates: string[] = [];
  for (const t of TALENTS) {
    const key = [...t.attributes].sort().join("+");
    if (seen.has(key)) duplicates.push(key);
    seen.add(key);
  }
  const missing: string[] = [];
  for (let i = 0; i < ATTRIBUTES.length; i++) {
    for (let j = i + 1; j < ATTRIBUTES.length; j++) {
      const key = [ATTRIBUTES[i], ATTRIBUTES[j]].sort().join("+");
      if (!seen.has(key)) missing.push(key);
    }
  }
  return { ok: missing.length === 0 && duplicates.length === 0, missing, duplicates };
}

export function createAttributeScores(partial: Partial<AttributeScores> = {}): AttributeScores {
  const scores = {} as AttributeScores;
  for (const a of ATTRIBUTES) scores[a] = partial[a] ?? 0;
  return scores;
}

export function createCharacterSheet(attributes: AttributeScores): CharacterSheet {
  const talentPoints: Record<string, number> = {};
  for (const t of TALENTS) talentPoints[t.id] = 0;
  return { attributes, talentPoints };
}

export function getTalentPotential(attributes: AttributeScores, talentId: string): number {
  const def = TALENT_BY_ID[talentId];
  if (!def) throw new Error(`Talento sconosciuto: ${talentId}`);
  const [a, b] = def.attributes;
  return attributes[a] + attributes[b];
}

export function getTalentProgress(sheet: CharacterSheet, talentId: string): TalentProgress {
  const def = TALENT_BY_ID[talentId];
  if (!def) throw new Error(`Talento sconosciuto: ${talentId}`);
  return {
    id: def.id,
    name: def.name,
    attributes: def.attributes,
    potential: getTalentPotential(sheet.attributes, talentId),
    current: sheet.talentPoints[talentId] ?? 0,
  };
}

export function listTalentProgress(sheet: CharacterSheet): TalentProgress[] {
  return TALENTS.map((t) => getTalentProgress(sheet, t.id));
}

/**
 * Investe punti esperienza in un talento. Il valore non può mai superare il
 * potenziale (somma delle due caratteristiche genetiche collegate) né
 * scendere sotto zero.
 */
export function trainTalent(sheet: CharacterSheet, talentId: string, amount: number): CharacterSheet {
  const potential = getTalentPotential(sheet.attributes, talentId);
  const current = clamp((sheet.talentPoints[talentId] ?? 0) + amount, 0, potential);
  return { ...sheet, talentPoints: { ...sheet.talentPoints, [talentId]: current } };
}

/** Talenti che coinvolgono una data caratteristica (utile per l'interfaccia: "cosa migliora se alzo Percezione?"). */
export function talentsForAttribute(attribute: Attribute): TalentDefinition[] {
  return TALENTS.filter((t) => t.attributes.includes(attribute));
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}
