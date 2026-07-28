import { ClimateProfile, Season, WeatherSnapshot, WeatherState } from "./types";

/**
 * Parametri di riferimento (min/max) per ciascuno stato meteo: da qui vengono
 * campionati vento, pioggia, copertura nuvolosa, umidità e visibilità effettivi.
 */
const STATE_PARAMS: Record<
  WeatherState,
  {
    wind: [number, number];
    rain: [number, number];
    cloud: [number, number];
    humidity: [number, number];
    visibility: [number, number];
  }
> = {
  sereno: { wind: [0, 12], rain: [0, 0], cloud: [0, 0.1], humidity: [0.2, 0.4], visibility: [8000, 12000] },
  poco_nuvoloso: { wind: [3, 18], rain: [0, 0], cloud: [0.15, 0.4], humidity: [0.3, 0.5], visibility: [7000, 11000] },
  nuvoloso: { wind: [5, 22], rain: [0, 0.05], cloud: [0.55, 0.85], humidity: [0.4, 0.65], visibility: [5000, 9000] },
  pioggia_leggera: { wind: [5, 25], rain: [0.15, 0.4], cloud: [0.6, 0.9], humidity: [0.6, 0.8], visibility: [2500, 5000] },
  pioggia_intensa: { wind: [15, 40], rain: [0.5, 0.85], cloud: [0.85, 1], humidity: [0.75, 0.95], visibility: [800, 2000] },
  temporale: { wind: [30, 60], rain: [0.7, 1], cloud: [0.9, 1], humidity: [0.8, 0.98], visibility: [400, 1200] },
  nebbia: { wind: [0, 8], rain: [0, 0.05], cloud: [0.3, 0.7], humidity: [0.85, 1], visibility: [50, 300] },
  ventoso: { wind: [35, 65], rain: [0, 0.1], cloud: [0.1, 0.5], humidity: [0.2, 0.5], visibility: [6000, 10000] },
  tempesta_di_sabbia: { wind: [55, 95], rain: [0, 0], cloud: [0.2, 0.5], humidity: [0.05, 0.2], visibility: [100, 600] },
  neve: { wind: [5, 25], rain: [0.1, 0.3], cloud: [0.7, 0.95], humidity: [0.6, 0.85], visibility: [1500, 4000] },
  bufera_di_neve: { wind: [40, 80], rain: [0.3, 0.6], cloud: [0.9, 1], humidity: [0.7, 0.9], visibility: [50, 400] },
  ondata_di_calore: { wind: [0, 15], rain: [0, 0], cloud: [0, 0.15], humidity: [0.05, 0.25], visibility: [7000, 12000] },
};

export interface WeatherHistoryEntry {
  dayIndex: number;
  state: WeatherState;
  rainIntensity: number;
  airTemperatureC: number;
}

export interface RegionWeatherRuntime {
  current: WeatherSnapshot;
  history: WeatherHistoryEntry[];
}

function sample(range: [number, number], rng: () => number): number {
  return range[0] + rng() * (range[1] - range[0]);
}

/**
 * Sceglie il prossimo stato meteo per la regione. Non è un tiro puramente
 * casuale: si applica un bonus di "persistenza" allo stato attuale (definito
 * dal profilo climatico) così che il tempo tenda a restare stabile per più
 * giorni consecutivi, come nella realtà, invece di cambiare in modo
 * incoerente a ogni avanzamento.
 */
export function pickNextWeatherState(
  climate: ClimateProfile,
  season: Season,
  currentState: WeatherState,
  rng: () => number
): WeatherState {
  const weights = climate.weatherWeights[season];
  const entries = Object.entries(weights) as [WeatherState, number][];

  const adjusted = entries.map(([state, weight]) => {
    const persistenceBonus = state === currentState ? climate.persistence : 1;
    return [state, weight * persistenceBonus] as [WeatherState, number];
  });

  const totalWeight = adjusted.reduce((sum, [, w]) => sum + w, 0);
  let roll = rng() * totalWeight;

  for (const [state, weight] of adjusted) {
    roll -= weight;
    if (roll <= 0) return state;
  }
  return adjusted[adjusted.length - 1][0];
}

export function generateWeatherSnapshot(state: WeatherState, rng: () => number): WeatherSnapshot {
  const params = STATE_PARAMS[state];
  return {
    state,
    windSpeedKmh: round1(sample(params.wind, rng)),
    rainIntensity: round2(sample(params.rain, rng)),
    cloudCover: round2(sample(params.cloud, rng)),
    visibilityMeters: Math.round(sample(params.visibility, rng)),
    humidity: round2(sample(params.humidity, rng)),
  };
}

/** Avanza il meteo di una regione di un giorno di gioco. */
export function advanceRegionWeather(
  climate: ClimateProfile,
  season: Season,
  runtime: RegionWeatherRuntime,
  dayIndex: number,
  rng: () => number = Math.random
): RegionWeatherRuntime {
  const nextState = pickNextWeatherState(climate, season, runtime.current.state, rng);
  const snapshot = generateWeatherSnapshot(nextState, rng);

  const history = [
    ...runtime.history,
    { dayIndex, state: nextState, rainIntensity: snapshot.rainIntensity, airTemperatureC: 0 },
  ].slice(-90); // conserva al più gli ultimi 90 giorni

  return { current: snapshot, history };
}

export function createInitialWeather(
  climate: ClimateProfile,
  season: Season,
  rng: () => number = Math.random
): RegionWeatherRuntime {
  const entries = Object.entries(climate.weatherWeights[season]) as [WeatherState, number][];
  const [initialState] = entries[Math.floor(rng() * entries.length)];
  return { current: generateWeatherSnapshot(initialState, rng), history: [] };
}

function round1(v: number) {
  return Math.round(v * 10) / 10;
}
function round2(v: number) {
  return Math.round(v * 100) / 100;
}
