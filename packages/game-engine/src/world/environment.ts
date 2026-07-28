import { ClimateProfile, EnvironmentSnapshot, Season, WeatherSnapshot, WorldTime } from "./types";
import { getDaylightWindow, getHourOfDay } from "./time";

const SEASON_CYCLE: Record<Season, Season> = {
  primavera: "estate",
  estate: "autunno",
  autunno: "inverno",
  inverno: "primavera",
};

// ------------------------------------------------------------------
// LUCE
// ------------------------------------------------------------------

/**
 * Calcola il livello di luce naturale (0-1) in un dato momento, combinando
 * l'ora del giorno, la finestra di alba/tramonto (che dipende da stagione e
 * latitudine) e la copertura nuvolosa attuale.
 */
export function computeLightLevel(
  time: WorldTime,
  season: Season,
  climate: ClimateProfile,
  weather: WeatherSnapshot
): number {
  const hour = getHourOfDay(time);
  const { sunrise, sunset } = getDaylightWindow(season, climate.latitudeBand);
  const twilightSpan = 1.1; // ore di crepuscolo prima dell'alba/dopo il tramonto

  let base: number;

  if (hour >= sunrise && hour <= sunset) {
    const dayLength = sunset - sunrise;
    const noon = sunrise + dayLength / 2;
    const distFromNoon = Math.abs(hour - noon) / (dayLength / 2);
    base = clamp(Math.cos((distFromNoon * Math.PI) / 2), 0, 1);
  } else if (hour >= sunrise - twilightSpan && hour < sunrise) {
    base = ((1 - (sunrise - hour) / twilightSpan) as number) * 0.35;
  } else if (hour > sunset && hour <= sunset + twilightSpan) {
    base = (1 - (hour - sunset) / twilightSpan) * 0.35;
  } else {
    base = 0.04; // notte piena: minimo chiarore ambientale (luna/stelle)
  }

  // Le nuvole attenuano soprattutto la luce diurna; l'impatto sul già minimo
  // chiarore notturno è trascurabile.
  const cloudPenalty = base > 0.1 ? weather.cloudCover * 0.55 : weather.cloudCover * 0.1;

  return clamp(base * (1 - cloudPenalty), 0, 1);
}

export function classifyLight(level: number): EnvironmentSnapshot["lightLabel"] {
  if (level < 0.06) return "buio_totale";
  if (level < 0.18) return "penombra";
  if (level < 0.35) return "crepuscolo";
  if (level < 0.65) return "luce_attenuata";
  return "piena_luce";
}

// ------------------------------------------------------------------
// TEMPERATURA
// ------------------------------------------------------------------

/**
 * Temperatura media attesa per la stagione corrente, interpolata verso la
 * stagione successiva in base all'avanzamento stagionale, per evitare
 * "scatti" bruschi il primo giorno di ogni stagione.
 */
function seasonalBaseline(
  climate: ClimateProfile,
  season: Season,
  progress: number
): { min: number; max: number } {
  const a = climate.temperature[season];
  const b = climate.temperature[SEASON_CYCLE[season]];
  return { min: lerp(a.min, b.min, progress), max: lerp(a.max, b.max, progress) };
}

export function computeAirTemperature(
  time: WorldTime,
  season: Season,
  seasonProgress: number,
  climate: ClimateProfile,
  weather: WeatherSnapshot
): number {
  const { min, max } = seasonalBaseline(climate, season, seasonProgress);
  const mid = (min + max) / 2;

  // Le nuvole fanno da "coperta": riducono l'escursione termica giornaliera
  // invece di limitarsi ad abbassare la temperatura in blocco.
  const amplitude = ((max - min) / 2) * (1 - weather.cloudCover * 0.5);

  const hour = getHourOfDay(time);
  const peakHour = 15; // il picco di calore segue il mezzogiorno solare per inerzia termica
  const dailyCurve = Math.cos(((hour - peakHour) / 24) * 2 * Math.PI);

  let temp = mid + amplitude * dailyCurve;

  // Correzione per altitudine: gradiente adiabatico semplificato (~6.5°C/1000m).
  temp -= (climate.altitudeMeters / 1000) * 6.5;

  // La pioggia raffredda l'aria.
  temp -= weather.rainIntensity * 3.5;

  return temp;
}

/**
 * Temperatura "percepita": corregge la temperatura dell'aria per l'effetto
 * raffreddante del vento (wind chill) e l'effetto opprimente dell'umidità
 * quando fa già caldo (heat index semplificato).
 */
export function computeFeltTemperature(airTemp: number, weather: WeatherSnapshot): number {
  let felt = airTemp;

  if (airTemp <= 10) {
    const windEffect = Math.sqrt(weather.windSpeedKmh) * 0.7;
    felt -= windEffect;
  }

  if (airTemp >= 27) {
    const humidityEffect = (weather.humidity - 0.4) * 8;
    felt += Math.max(0, humidityEffect);
  }

  return felt;
}

export function classifyComfort(feltTemp: number): EnvironmentSnapshot["comfortLabel"] {
  if (feltTemp < -5) return "estremo";
  if (feltTemp < 5) return "gelido";
  if (feltTemp < 12) return "freddo";
  if (feltTemp < 18) return "fresco";
  if (feltTemp < 27) return "confortevole";
  if (feltTemp < 34) return "caldo";
  if (feltTemp < 40) return "torrido";
  return "estremo";
}

export function computeEnvironment(
  time: WorldTime,
  season: Season,
  seasonProgress: number,
  climate: ClimateProfile,
  weather: WeatherSnapshot
): EnvironmentSnapshot {
  const lightLevel = computeLightLevel(time, season, climate, weather);
  const airTemperatureC = computeAirTemperature(time, season, seasonProgress, climate, weather);
  const feltTemperatureC = computeFeltTemperature(airTemperatureC, weather);

  return {
    lightLevel,
    lightLabel: classifyLight(lightLevel),
    airTemperatureC: round1(airTemperatureC),
    feltTemperatureC: round1(feltTemperatureC),
    comfortLabel: classifyComfort(feltTemperatureC),
  };
}

// ------------------------------------------------------------------
function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
function round1(v: number): number {
  return Math.round(v * 10) / 10;
}
