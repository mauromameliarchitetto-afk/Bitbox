import { ActivityLevel, CharacterNeeds, EnvironmentSnapshot, Modifier } from "./types";

const ACTIVITY_MULTIPLIER: Record<ActivityLevel, number> = {
  riposo: 0.6,
  normale: 1.0,
  viaggio: 1.4,
  combattimento: 2.5,
};

export function createDefaultNeeds(): CharacterNeeds {
  return { hunger: 100, thirst: 100, energy: 100, sleepDebt: 0 };
}

/**
 * Fa avanzare i bisogni fisiologici di `hours` ore, tenendo conto
 * dell'attività svolta e delle condizioni ambientali: il caldo accelera la
 * sete, il freddo accelera il consumo energetico per la termoregolazione.
 */
export function advanceNeeds(
  needs: CharacterNeeds,
  hours: number,
  activity: ActivityLevel,
  environment: EnvironmentSnapshot
): CharacterNeeds {
  const activityMult = ACTIVITY_MULTIPLIER[activity];

  const baseHungerRate = 100 / 72; // esaurimento completo in ~72 ore a riposo
  const baseThirstRate = 100 / 36; // la sete cala più in fretta della fame
  const baseEnergyRate = 100 / 18; // l'energia si esaurisce nell'arco di una giornata intensa

  const heatThirstMult =
    environment.feltTemperatureC > 27 ? 1 + (environment.feltTemperatureC - 27) * 0.08 : 1;

  const coldEnergyMult =
    environment.feltTemperatureC < 5 ? 1 + (5 - environment.feltTemperatureC) * 0.05 : 1;

  const hunger = clamp(needs.hunger - baseHungerRate * activityMult * hours, 0, 100);
  const thirst = clamp(needs.thirst - baseThirstRate * activityMult * heatThirstMult * hours, 0, 100);
  const energy = clamp(needs.energy - baseEnergyRate * activityMult * coldEnergyMult * hours, 0, 100);

  // Il debito di sonno cresce solo se il personaggio non sta riposando e si
  // riduce lentamente durante il riposo, ma mai istantaneamente: rappresenta
  // un deficit cumulativo che un solo pisolino non ripaga del tutto.
  const sleepDebtDelta = activity === "riposo" ? -hours * 3 : hours * 1.2;
  const sleepDebt = clamp(needs.sleepDebt + sleepDebtDelta, 0, 100);

  return { hunger, thirst, energy, sleepDebt };
}

export function applyRest(
  needs: CharacterNeeds,
  hours: number,
  quality: "scarso" | "normale" | "buono" = "normale"
): CharacterNeeds {
  const qualityMult = quality === "scarso" ? 0.5 : quality === "buono" ? 1.4 : 1;
  return {
    ...needs,
    energy: clamp(needs.energy + hours * 8 * qualityMult, 0, 100),
    sleepDebt: clamp(needs.sleepDebt - hours * 6 * qualityMult, 0, 100),
  };
}

export function eat(needs: CharacterNeeds, amount: number): CharacterNeeds {
  return { ...needs, hunger: clamp(needs.hunger + amount, 0, 100) };
}

export function drink(needs: CharacterNeeds, amount: number): CharacterNeeds {
  return { ...needs, thirst: clamp(needs.thirst + amount, 0, 100) };
}

/** Traduce lo stato dei bisogni in modificatori concreti da applicare alle azioni. */
export function getNeedsModifiers(needs: CharacterNeeds): Modifier[] {
  const modifiers: Modifier[] = [];

  pushThresholdModifier(modifiers, "fame", needs.hunger, [
    { below: 10, value: -20, label: "Sfinito dalla fame" },
    { below: 25, value: -10, label: "Molto affamato" },
    { below: 50, value: -4, label: "Affamato" },
  ]);

  pushThresholdModifier(modifiers, "sete", needs.thirst, [
    { below: 10, value: -25, label: "Disidratazione grave" },
    { below: 25, value: -12, label: "Molto assetato" },
    { below: 50, value: -5, label: "Assetato" },
  ]);

  pushThresholdModifier(modifiers, "energia", needs.energy, [
    { below: 10, value: -25, label: "Esausto" },
    { below: 25, value: -12, label: "Molto stanco" },
    { below: 50, value: -5, label: "Stanco" },
  ]);

  if (needs.sleepDebt > 70) {
    modifiers.push({ source: "sonno", label: "Deficit di sonno severo", value: -15, type: "additivo" });
  } else if (needs.sleepDebt > 40) {
    modifiers.push({ source: "sonno", label: "Deficit di sonno", value: -7, type: "additivo" });
  }

  return modifiers;
}

function pushThresholdModifier(
  out: Modifier[],
  source: string,
  value: number,
  thresholds: { below: number; value: number; label: string }[]
) {
  for (const t of thresholds) {
    if (value < t.below) {
      out.push({ source, label: t.label, value: t.value, type: "additivo" });
      return; // applica solo la soglia più severa raggiunta
    }
  }
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}
