import { LatitudeBand, Season, WorldTime } from "./types";

const MINUTES_PER_HOUR = 60;
export const MINUTES_PER_DAY = 24 * MINUTES_PER_HOUR;

/** Calendario di gioco semplificato: 4 stagioni da 90 giorni = 360 giorni/anno. */
export const DAYS_PER_SEASON = 90;
export const DAYS_PER_YEAR = DAYS_PER_SEASON * 4;

export function createWorldTime(startDay = 0, startHour = 8): WorldTime {
  return { totalMinutes: startDay * MINUTES_PER_DAY + startHour * MINUTES_PER_HOUR };
}

export function advanceTime(time: WorldTime, minutes: number): WorldTime {
  return { totalMinutes: time.totalMinutes + minutes };
}

export function getHourOfDay(time: WorldTime): number {
  return (time.totalMinutes % MINUTES_PER_DAY) / MINUTES_PER_HOUR;
}

export function getDayIndex(time: WorldTime): number {
  return Math.floor(time.totalMinutes / MINUTES_PER_DAY);
}

export function getDayOfYear(time: WorldTime): number {
  return getDayIndex(time) % DAYS_PER_YEAR;
}

const SEASON_ORDER: Season[] = ["primavera", "estate", "autunno", "inverno"];

export function getSeason(time: WorldTime): Season {
  const dayOfYear = getDayOfYear(time);
  const seasonIndex = Math.floor(dayOfYear / DAYS_PER_SEASON) % 4;
  return SEASON_ORDER[seasonIndex];
}

/**
 * Frazione (0-1) di avanzamento all'interno della stagione corrente, utile
 * per interpolare gradualmente tra una stagione e la successiva invece di
 * far "scattare" temperature e meteo di colpo al cambio di stagione.
 */
export function getSeasonProgress(time: WorldTime): number {
  const dayOfYear = getDayOfYear(time);
  return (dayOfYear % DAYS_PER_SEASON) / DAYS_PER_SEASON;
}

/**
 * Ora di alba e tramonto attese, in funzione di stagione e fascia di
 * latitudine. Alle latitudini polari l'escursione stagionale della
 * lunghezza del giorno è molto più marcata che all'equatore.
 */
export function getDaylightWindow(
  season: Season,
  latitudeBand: LatitudeBand
): { sunrise: number; sunset: number } {
  const swing = latitudeBand === "equatoriale" ? 0.3 : latitudeBand === "temperata" ? 2.2 : 5.5;

  // +1 in estate (giorni più lunghi), -1 in inverno (giorni più corti), 0 nelle mezze stagioni.
  const seasonSign = season === "estate" ? 1 : season === "inverno" ? -1 : 0;

  const sunrise = 6 - swing * seasonSign;
  const sunset = 18 + swing * seasonSign;

  return {
    sunrise: clamp(sunrise, 3, 11),
    sunset: clamp(sunset, 13, 21),
  };
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}
