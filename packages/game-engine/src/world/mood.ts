import { CharacterNeeds, EnvironmentSnapshot, MoodState, MoraleLabel } from "./types";

export function createDefaultMood(): MoodState {
  return { value: 0, impulses: [] };
}

export function pushMoodEvent(mood: MoodState, label: string, delta: number, decayPerTick = 0.15): MoodState {
  return { ...mood, impulses: [...mood.impulses, { label, delta, decayPerTick }] };
}

function needsSatisfaction(needs: CharacterNeeds): number {
  // Media dei bisogni, riportata su scala -50..+50 rispetto a un livello di
  // "pieno benessere" convenzionale del 70%.
  const avg = (needs.hunger + needs.thirst + needs.energy + (100 - needs.sleepDebt)) / 4;
  return (avg - 70) * 0.7;
}

function environmentalComfortBonus(environment: EnvironmentSnapshot): number {
  switch (environment.comfortLabel) {
    case "confortevole":
      return 4;
    case "fresco":
      return 1;
    case "caldo":
      return -2;
    case "freddo":
      return -3;
    case "torrido":
      return -7;
    case "gelido":
      return -8;
    case "estremo":
      return -14;
    default:
      return 0;
  }
}

/**
 * Avanza l'umore di un tick: calcola un "bersaglio" desiderato in base a
 * bisogni e ambiente più gli impulsi da eventi recenti (vittorie, lutti,
 * ecc.), poi fa scivolare dolcemente l'umore corrente verso quel bersaglio
 * invece di scattarci sopra di colpo — un brutto momento non deve ribaltare
 * l'umore all'istante, ma nemmeno un umore pessimo guarisce in un solo tick.
 */
export function advanceMood(mood: MoodState, needs: CharacterNeeds, environment: EnvironmentSnapshot): MoodState {
  const eventContribution = mood.impulses.reduce((sum, i) => sum + i.delta, 0);
  const target = clamp(
    needsSatisfaction(needs) + environmentalComfortBonus(environment) + eventContribution,
    -100,
    100
  );

  const smoothing = 0.18;
  const value = clamp(mood.value + (target - mood.value) * smoothing, -100, 100);

  const impulses = mood.impulses
    .map((i) => ({ ...i, delta: i.delta * (1 - i.decayPerTick) }))
    .filter((i) => Math.abs(i.delta) > 0.5);

  return { value, impulses };
}

export function classifyMorale(value: number): MoraleLabel {
  if (value < -50) return "disperato";
  if (value < -15) return "scoraggiato";
  if (value < 15) return "neutro";
  if (value < 50) return "motivato";
  return "esaltato";
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}
