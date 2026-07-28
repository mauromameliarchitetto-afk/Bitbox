import {
  ActionType,
  CharacterNeeds,
  EnvironmentSnapshot,
  Modifier,
  ModifierResult,
  MoodState,
  WeatherSnapshot,
} from "./types";
import { getNeedsModifiers } from "./needs";
import { classifyMorale } from "./mood";

export interface ModifierContext {
  weather: WeatherSnapshot;
  environment: EnvironmentSnapshot;
  needs: CharacterNeeds;
  mood: MoodState;
  /** Parametri opzionali specifici dell'azione (es. distanza del bersaglio in metri). */
  params?: {
    distanceMeters?: number;
  };
}

// ------------------------------------------------------------------
// Fattori atmosferici riutilizzabili tra più tipi di azione
// ------------------------------------------------------------------

/** Indice di rumore ambientale (0-1): quanto l'ambiente maschera i suoni. */
function ambientNoiseIndex(weather: WeatherSnapshot): number {
  const windComponent = clamp(weather.windSpeedKmh / 70, 0, 1);
  const rainComponent = weather.rainIntensity;
  const stormBonus = weather.state === "temporale" ? 0.25 : 0;
  return clamp(windComponent * 0.6 + rainComponent * 0.5 + stormBonus, 0, 1);
}

function windRangedPenalty(weather: WeatherSnapshot): Modifier | null {
  if (weather.windSpeedKmh <= 10) return null;
  const value = -Math.round((weather.windSpeedKmh - 10) * 0.4);
  return { source: "vento", label: `Vento forte (${weather.windSpeedKmh} km/h)`, value, type: "additivo" };
}

function rainRangedPenalty(weather: WeatherSnapshot): Modifier | null {
  if (weather.rainIntensity <= 0.1) return null;
  return {
    source: "pioggia",
    label: "Presa bagnata, visibilità ridotta dalla pioggia",
    value: -Math.round(weather.rainIntensity * 12),
    type: "additivo",
  };
}

function visibilityPenalty(weather: WeatherSnapshot, distanceMeters: number): Modifier | null {
  if (weather.visibilityMeters >= distanceMeters * 3) return null;
  const ratio = clamp(weather.visibilityMeters / (distanceMeters * 3), 0, 1);
  return {
    source: "visibilita",
    label: `Visibilità ridotta (${weather.visibilityMeters} m)`,
    value: -Math.round((1 - ratio) * 25),
    type: "additivo",
  };
}

function lightVisualModifier(environment: EnvironmentSnapshot): Modifier | null {
  if (environment.lightLevel >= 0.5) return null;
  const value = -Math.round((0.5 - environment.lightLevel) * 30);
  return { source: "luce", label: `Scarsa illuminazione (${environment.lightLabel})`, value, type: "additivo" };
}

function coldHandsPenalty(environment: EnvironmentSnapshot): Modifier | null {
  if (environment.feltTemperatureC >= 2) return null;
  return {
    source: "freddo",
    label: "Mani intorpidite dal freddo",
    value: -Math.round((2 - environment.feltTemperatureC) * 1.2),
    type: "additivo",
  };
}

// ------------------------------------------------------------------
// Modificatori per tipo di azione
// ------------------------------------------------------------------

function rangedModifiers(ctx: ModifierContext): Modifier[] {
  const distance = ctx.params?.distanceMeters ?? 20;
  return [
    windRangedPenalty(ctx.weather),
    rainRangedPenalty(ctx.weather),
    visibilityPenalty(ctx.weather, distance),
    lightVisualModifier(ctx.environment),
    coldHandsPenalty(ctx.environment),
  ].filter((m): m is Modifier => m !== null);
}

function stealthModifiers(ctx: ModifierContext): Modifier[] {
  const noise = ambientNoiseIndex(ctx.weather);
  const modifiers: Modifier[] = [];

  if (noise > 0.05) {
    modifiers.push({
      source: "rumore_ambientale",
      label: "Il rumore di fondo copre i tuoi movimenti",
      value: Math.round(noise * 25),
      type: "additivo",
    });
  } else {
    modifiers.push({
      source: "silenzio",
      label: "Ambiente silenzioso: ogni passo si sente",
      value: -8,
      type: "additivo",
    });
  }

  if (ctx.environment.lightLevel < 0.35) {
    modifiers.push({
      source: "oscurita",
      label: "Oscurità favorevole",
      value: Math.round((0.35 - ctx.environment.lightLevel) * 30),
      type: "additivo",
    });
  } else if (ctx.environment.lightLevel > 0.75) {
    modifiers.push({ source: "luce_piena", label: "Piena luce: difficile passare inosservati", value: -6, type: "additivo" });
  }

  if (ctx.weather.state === "nebbia") {
    modifiers.push({ source: "nebbia", label: "La nebbia nasconde la sagoma", value: 10, type: "additivo" });
  }

  return modifiers;
}

function auditoryPerceptionModifiers(ctx: ModifierContext): Modifier[] {
  const noise = ambientNoiseIndex(ctx.weather);
  if (noise <= 0.05) return [];
  return [
    {
      source: "rumore_ambientale",
      label: "Il vento/la pioggia coprono i suoni circostanti",
      value: -Math.round(noise * 25),
      type: "additivo",
    },
  ];
}

function visualPerceptionModifiers(ctx: ModifierContext): Modifier[] {
  const modifiers: Modifier[] = [];
  const lightPenalty = lightVisualModifier(ctx.environment);
  if (lightPenalty) modifiers.push(lightPenalty);
  const visPenalty = visibilityPenalty(ctx.weather, 15);
  if (visPenalty) modifiers.push(visPenalty);
  return modifiers;
}

function movementModifiers(ctx: ModifierContext): Modifier[] {
  const modifiers: Modifier[] = [];
  if (ctx.weather.rainIntensity > 0.4) {
    modifiers.push({ source: "fango", label: "Terreno fangoso", value: -10, type: "additivo" });
  }
  if (ctx.weather.state === "neve" || ctx.weather.state === "bufera_di_neve") {
    modifiers.push({ source: "neve", label: "Neve al suolo", value: -15, type: "additivo" });
  }
  if (ctx.weather.windSpeedKmh > 50) {
    modifiers.push({ source: "vento", label: "Vento fortissimo", value: -8, type: "additivo" });
  }
  if (ctx.environment.comfortLabel === "torrido" || ctx.environment.comfortLabel === "estremo") {
    modifiers.push({ source: "calore", label: "Il caldo estremo affatica ogni sforzo", value: -10, type: "additivo" });
  }
  return modifiers;
}

const MORALE_TABLE: Record<MoraleLabelKey, { coraggio: number; sociale: number }> = {
  disperato: { coraggio: -20, sociale: -15 },
  scoraggiato: { coraggio: -8, sociale: -5 },
  neutro: { coraggio: 0, sociale: 0 },
  motivato: { coraggio: 8, sociale: 5 },
  esaltato: { coraggio: 18, sociale: 12 },
};
type MoraleLabelKey = "disperato" | "scoraggiato" | "neutro" | "motivato" | "esaltato";

function moraleModifiers(action: "coraggio" | "sociale", ctx: ModifierContext): Modifier[] {
  const label = classifyMorale(ctx.mood.value) as MoraleLabelKey;
  const value = MORALE_TABLE[label][action];
  return [{ source: "morale", label: `Morale: ${label}`, value, type: "additivo" }];
}

// ------------------------------------------------------------------
// Entry point pubblico
// ------------------------------------------------------------------

export function computeModifiers(action: ActionType, ctx: ModifierContext): ModifierResult {
  let modifiers: Modifier[] = [];

  switch (action) {
    case "attacco_a_distanza":
      modifiers = rangedModifiers(ctx);
      break;
    case "furtivita":
      modifiers = stealthModifiers(ctx);
      break;
    case "percezione_uditiva":
      modifiers = auditoryPerceptionModifiers(ctx);
      break;
    case "percezione_visiva":
      modifiers = visualPerceptionModifiers(ctx);
      break;
    case "movimento":
      modifiers = movementModifiers(ctx);
      break;
    case "coraggio":
    case "sociale":
      modifiers = moraleModifiers(action, ctx);
      break;
  }

  // I bisogni fisiologici incidono in una certa misura su qualunque azione fisica o mentale.
  modifiers = [...modifiers, ...getNeedsModifiers(ctx.needs)];

  const total = modifiers.filter((m) => m.type === "additivo").reduce((sum, m) => sum + m.value, 0);

  return { modifiers, total };
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}
