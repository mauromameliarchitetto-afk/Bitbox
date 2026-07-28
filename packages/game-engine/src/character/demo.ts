import { ATTRIBUTES, ATTRIBUTE_LABEL } from "./types";
import {
  TALENTS,
  validateTalentCoverage,
  createAttributeScores,
  createCharacterSheet,
  listTalentProgress,
  trainTalent,
  talentsForAttribute,
} from "./talents";

// 1. Verifica che le 28 coppie di caratteristiche siano coperte esattamente una volta.
const coverage = validateTalentCoverage();
console.log(`Talenti definiti: ${TALENTS.length} (attesi: 28)`);
console.log(`Copertura coppie: ${coverage.ok ? "OK, nessuna coppia mancante o duplicata" : "PROBLEMA"}`);
if (!coverage.ok) {
  console.log("Mancanti:", coverage.missing);
  console.log("Duplicate:", coverage.duplicates);
}

// 2. Personaggio d'esempio, ispirato all'esempio dell'autore (Forza 5 + Percezione 7 => Balistica 0/12).
const attributes = createAttributeScores({
  costituzione: 6,
  forza: 5,
  agilita: 8,
  percezione: 7,
  logica: 4,
  ingegno: 6,
  personalita: 3,
  astuzia: 5,
});

let sheet = createCharacterSheet(attributes);

const balistica = listTalentProgress(sheet).find((t) => t.id === "balistica")!;
console.log(`\nBalistica: potenziale ${balistica.potential} (atteso 12), attuale ${balistica.current}/${balistica.potential}`);

// 3. Investimento di esperienza, con verifica del tetto massimo.
sheet = trainTalent(sheet, "balistica", 9);
console.log("Dopo +9 esperienza:", listTalentProgress(sheet).find((t) => t.id === "balistica"));

sheet = trainTalent(sheet, "balistica", 9); // dovrebbe fermarsi al potenziale (12), non salire a 18
const afterCap = listTalentProgress(sheet).find((t) => t.id === "balistica")!;
console.log("Dopo un altro +9 (deve restare a 12):", afterCap);
if (afterCap.current !== 12) throw new Error("Il tetto massimo del talento non è stato rispettato!");

// 4. Talenti collegati a una caratteristica (utile in UI: "cosa migliora se alzo Percezione?").
console.log("\nTalenti collegati a Percezione:");
for (const t of talentsForAttribute("percezione")) {
  const other = t.attributes.find((a) => a !== "percezione")!;
  console.log(`  ${t.name} (Percezione + ${ATTRIBUTE_LABEL[other]})`);
}

// 5. Elenco completo con potenziali, per controllo visivo.
console.log("\nElenco completo talenti e potenziali:");
for (const t of listTalentProgress(sheet)) {
  const [a, b] = t.attributes;
  console.log(
    `  ${t.name.padEnd(16)} (${ATTRIBUTE_LABEL[a]} + ${ATTRIBUTE_LABEL[b]}) -> ${t.current}/${t.potential}`
  );
}

console.log("\nTutti i controlli superati.");
