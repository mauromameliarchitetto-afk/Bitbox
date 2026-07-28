/**
 * Bitbox — World Simulation Engine (porting JS del pacchetto
 * packages/game-engine/src/world, senza dipendenze da React).
 *
 * Nessuna dipendenza esterna: può essere riusato da qualunque interfaccia
 * (questa web app, una futura app Android, o un backend Node).
 */

export function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }
export function lerp(a, b, t) { return a + (b - a) * t; }
export function round1(v) { return Math.round(v * 10) / 10; }
export function round2(v) { return Math.round(v * 100) / 100; }

// ---------------------------------------------------------------- tempo ----
export const MINUTES_PER_HOUR = 60;
export const MINUTES_PER_DAY = 24 * MINUTES_PER_HOUR;
export const DAYS_PER_SEASON = 90;
export const DAYS_PER_YEAR = DAYS_PER_SEASON * 4;
export const SEASON_ORDER = ["primavera", "estate", "autunno", "inverno"];
export const SEASON_CYCLE = { primavera: "estate", estate: "autunno", autunno: "inverno", inverno: "primavera" };
export const SEASON_LABEL = { primavera: "Primavera", estate: "Estate", autunno: "Autunno", inverno: "Inverno" };

export function createWorldTime(startDay = 0, startHour = 8) {
  return { totalMinutes: startDay * MINUTES_PER_DAY + startHour * MINUTES_PER_HOUR };
}
export function advanceTime(time, minutes) { return { totalMinutes: time.totalMinutes + minutes }; }
export function getHourOfDay(time) { return (time.totalMinutes % MINUTES_PER_DAY) / MINUTES_PER_HOUR; }
export function getDayIndex(time) { return Math.floor(time.totalMinutes / MINUTES_PER_DAY); }
export function getDayOfYear(time) { return getDayIndex(time) % DAYS_PER_YEAR; }
export function getSeason(time) {
  const dayOfYear = getDayOfYear(time);
  return SEASON_ORDER[Math.floor(dayOfYear / DAYS_PER_SEASON) % 4];
}
export function getSeasonProgress(time) {
  const dayOfYear = getDayOfYear(time);
  return (dayOfYear % DAYS_PER_SEASON) / DAYS_PER_SEASON;
}
export function getDaylightWindow(season, latitudeBand) {
  const swing = latitudeBand === "equatoriale" ? 0.3 : latitudeBand === "temperata" ? 2.2 : 5.5;
  const seasonSign = season === "estate" ? 1 : season === "inverno" ? -1 : 0;
  return {
    sunrise: clamp(6 - swing * seasonSign, 3, 11),
    sunset: clamp(18 + swing * seasonSign, 13, 21),
  };
}
export function formatHour(h) {
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

// -------------------------------------------------------- climi & regioni --
export const CLIMATE_ARIDO = {
  type: "arido", latitudeBand: "temperata", altitudeMeters: 400, baseAquifer: 0.15,
  temperature: {
    primavera: { min: 14, max: 30 }, estate: { min: 24, max: 42 },
    autunno: { min: 12, max: 28 }, inverno: { min: 2, max: 18 },
  },
  weatherWeights: {
    primavera: { sereno: 45, poco_nuvoloso: 15, ventoso: 25, tempesta_di_sabbia: 8, pioggia_leggera: 4, nuvoloso: 3 },
    estate: { sereno: 40, ventoso: 20, tempesta_di_sabbia: 15, ondata_di_calore: 18, poco_nuvoloso: 5, pioggia_leggera: 2 },
    autunno: { sereno: 48, poco_nuvoloso: 18, ventoso: 20, tempesta_di_sabbia: 8, pioggia_leggera: 6 },
    inverno: { sereno: 40, poco_nuvoloso: 22, ventoso: 22, pioggia_leggera: 12, nuvoloso: 4 },
  },
  persistence: 2.2,
};
export const CLIMATE_TROPICALE = {
  type: "tropicale", latitudeBand: "equatoriale", altitudeMeters: 100, baseAquifer: 0.85,
  temperature: {
    primavera: { min: 22, max: 31 }, estate: { min: 24, max: 33 },
    autunno: { min: 22, max: 31 }, inverno: { min: 20, max: 29 },
  },
  weatherWeights: {
    primavera: { pioggia_intensa: 30, temporale: 20, pioggia_leggera: 25, nuvoloso: 15, poco_nuvoloso: 8, sereno: 2 },
    estate: { pioggia_intensa: 25, temporale: 25, pioggia_leggera: 22, nuvoloso: 18, poco_nuvoloso: 8, sereno: 2 },
    autunno: { pioggia_intensa: 32, temporale: 22, pioggia_leggera: 24, nuvoloso: 14, poco_nuvoloso: 6, sereno: 2 },
    inverno: { pioggia_intensa: 20, temporale: 15, pioggia_leggera: 28, nuvoloso: 20, poco_nuvoloso: 12, sereno: 5 },
  },
  persistence: 2.6,
};
export const CLIMATE_MONSONICO = {
  type: "monsonico", latitudeBand: "temperata", altitudeMeters: 250, baseAquifer: 0.5,
  temperature: {
    primavera: { min: 20, max: 34 }, estate: { min: 24, max: 32 },
    autunno: { min: 18, max: 30 }, inverno: { min: 10, max: 24 },
  },
  weatherWeights: {
    primavera: { sereno: 35, ventoso: 25, poco_nuvoloso: 20, tempesta_di_sabbia: 5, pioggia_leggera: 10, nuvoloso: 5 },
    estate: { pioggia_intensa: 35, temporale: 28, pioggia_leggera: 20, nuvoloso: 12, poco_nuvoloso: 4, sereno: 1 },
    autunno: { nuvoloso: 25, pioggia_leggera: 25, poco_nuvoloso: 20, sereno: 15, ventoso: 15 },
    inverno: { sereno: 40, poco_nuvoloso: 25, ventoso: 20, nuvoloso: 10, pioggia_leggera: 5 },
  },
  persistence: 2.4,
};
export const CLIMATE_TEMPERATO = {
  type: "temperato", latitudeBand: "temperata", altitudeMeters: 200, baseAquifer: 0.55,
  temperature: {
    primavera: { min: 8, max: 18 }, estate: { min: 16, max: 28 },
    autunno: { min: 6, max: 16 }, inverno: { min: -2, max: 8 },
  },
  weatherWeights: {
    primavera: { poco_nuvoloso: 25, nuvoloso: 20, pioggia_leggera: 20, sereno: 20, ventoso: 10, pioggia_intensa: 5 },
    estate: { sereno: 35, poco_nuvoloso: 25, nuvoloso: 15, pioggia_leggera: 12, temporale: 8, ventoso: 5 },
    autunno: { nuvoloso: 28, pioggia_leggera: 22, poco_nuvoloso: 18, ventoso: 15, sereno: 10, pioggia_intensa: 7 },
    inverno: { nuvoloso: 25, pioggia_leggera: 18, neve: 15, poco_nuvoloso: 15, sereno: 12, ventoso: 10, bufera_di_neve: 5 },
  },
  persistence: 1.6,
};
export const CLIMATE_ALPINO = {
  type: "alpino", latitudeBand: "temperata", altitudeMeters: 2200, baseAquifer: 0.6,
  temperature: {
    primavera: { min: -2, max: 10 }, estate: { min: 6, max: 18 },
    autunno: { min: -4, max: 8 }, inverno: { min: -18, max: -4 },
  },
  weatherWeights: {
    primavera: { poco_nuvoloso: 20, nuvoloso: 20, neve: 20, ventoso: 20, sereno: 12, pioggia_leggera: 8 },
    estate: { sereno: 30, poco_nuvoloso: 25, nuvoloso: 15, temporale: 15, ventoso: 15 },
    autunno: { nuvoloso: 25, ventoso: 25, neve: 20, poco_nuvoloso: 15, sereno: 15 },
    inverno: { neve: 30, bufera_di_neve: 25, ventoso: 20, nuvoloso: 15, sereno: 10 },
  },
  persistence: 2.0,
};

export const REGIONS = [
  { id: "khal-arida", name: "Distese di Khal", tag: "Deserto", climate: CLIMATE_ARIDO, accent: "#c9863f" },
  { id: "yrel-tropicale", name: "Foreste di Yrel", tag: "Pluviale", climate: CLIMATE_TROPICALE, accent: "#3e9e7e" },
  { id: "duvain-monsonico", name: "Bassopiano di Duvain", tag: "Monsonico", climate: CLIMATE_MONSONICO, accent: "#7b86cf" },
  { id: "ovest-temperato", name: "Piana dell'Ovest", tag: "Temperato", climate: CLIMATE_TEMPERATO, accent: "#a3b158" },
  { id: "corone-alpine", name: "Corone Alpine", tag: "Alpino", climate: CLIMATE_ALPINO, accent: "#7fa8c9" },
];

// --------------------------------------------------------------- meteo ----
export const STATE_PARAMS = {
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

export const WEATHER_LABEL = {
  sereno: "Sereno", poco_nuvoloso: "Poco nuvoloso", nuvoloso: "Nuvoloso",
  pioggia_leggera: "Pioggia leggera", pioggia_intensa: "Pioggia intensa", temporale: "Temporale",
  nebbia: "Nebbia", ventoso: "Ventoso", tempesta_di_sabbia: "Tempesta di sabbia",
  neve: "Neve", bufera_di_neve: "Bufera di neve", ondata_di_calore: "Ondata di calore",
};

function sample([a, b], rng) { return a + rng() * (b - a); }

export function pickNextWeatherState(climate, season, currentState, rng) {
  const weights = climate.weatherWeights[season];
  const entries = Object.entries(weights);
  const adjusted = entries.map(([state, weight]) => [
    state, weight * (state === currentState ? climate.persistence : 1),
  ]);
  const total = adjusted.reduce((s, [, w]) => s + w, 0);
  let roll = rng() * total;
  for (const [state, weight] of adjusted) {
    roll -= weight;
    if (roll <= 0) return state;
  }
  return adjusted[adjusted.length - 1][0];
}

export function generateWeatherSnapshot(state, rng) {
  const p = STATE_PARAMS[state];
  return {
    state,
    windSpeedKmh: round1(sample(p.wind, rng)),
    rainIntensity: round2(sample(p.rain, rng)),
    cloudCover: round2(sample(p.cloud, rng)),
    visibilityMeters: Math.round(sample(p.visibility, rng)),
    humidity: round2(sample(p.humidity, rng)),
  };
}

export function advanceRegionWeather(climate, season, runtime, dayIndex, rng) {
  const nextState = pickNextWeatherState(climate, season, runtime.current.state, rng);
  const snapshot = generateWeatherSnapshot(nextState, rng);
  const history = [
    ...runtime.history,
    { dayIndex, state: nextState, rainIntensity: snapshot.rainIntensity, airTemperatureC: 0 },
  ].slice(-90);
  return { current: snapshot, history };
}

export function createInitialWeather(climate, season, rng) {
  const entries = Object.entries(climate.weatherWeights[season]);
  const [initialState] = entries[Math.floor(rng() * entries.length)];
  return { current: generateWeatherSnapshot(initialState, rng), history: [] };
}

// ----------------------------------------------------------- ambiente ----
export function computeLightLevel(time, season, climate, weather) {
  const hour = getHourOfDay(time);
  const { sunrise, sunset } = getDaylightWindow(season, climate.latitudeBand);
  const twilightSpan = 1.1;
  let base;

  if (hour >= sunrise && hour <= sunset) {
    const dayLength = sunset - sunrise;
    const noon = sunrise + dayLength / 2;
    const distFromNoon = Math.abs(hour - noon) / (dayLength / 2);
    base = clamp(Math.cos((distFromNoon * Math.PI) / 2), 0, 1);
  } else if (hour >= sunrise - twilightSpan && hour < sunrise) {
    base = (1 - (sunrise - hour) / twilightSpan) * 0.35;
  } else if (hour > sunset && hour <= sunset + twilightSpan) {
    base = (1 - (hour - sunset) / twilightSpan) * 0.35;
  } else {
    base = 0.04;
  }

  const cloudPenalty = base > 0.1 ? weather.cloudCover * 0.55 : weather.cloudCover * 0.1;
  return clamp(base * (1 - cloudPenalty), 0, 1);
}

export function classifyLight(level) {
  if (level < 0.06) return "buio_totale";
  if (level < 0.18) return "penombra";
  if (level < 0.35) return "crepuscolo";
  if (level < 0.65) return "luce_attenuata";
  return "piena_luce";
}
export const LIGHT_LABEL = {
  buio_totale: "Buio totale", penombra: "Penombra", crepuscolo: "Crepuscolo",
  luce_attenuata: "Luce attenuata", piena_luce: "Piena luce",
};

function seasonalBaseline(climate, season, progress) {
  const a = climate.temperature[season];
  const b = climate.temperature[SEASON_CYCLE[season]];
  return { min: lerp(a.min, b.min, progress), max: lerp(a.max, b.max, progress) };
}

export function computeAirTemperature(time, season, seasonProgress, climate, weather) {
  const { min, max } = seasonalBaseline(climate, season, seasonProgress);
  const mid = (min + max) / 2;
  const amplitude = ((max - min) / 2) * (1 - weather.cloudCover * 0.5);
  const hour = getHourOfDay(time);
  const peakHour = 15;
  const dailyCurve = Math.cos(((hour - peakHour) / 24) * 2 * Math.PI);
  let temp = mid + amplitude * dailyCurve;
  temp -= (climate.altitudeMeters / 1000) * 6.5;
  temp -= weather.rainIntensity * 3.5;
  return temp;
}

export function computeFeltTemperature(airTemp, weather) {
  let felt = airTemp;
  if (airTemp <= 10) felt -= Math.sqrt(weather.windSpeedKmh) * 0.7;
  if (airTemp >= 27) felt += Math.max(0, (weather.humidity - 0.4) * 8);
  return felt;
}

export function classifyComfort(feltTemp) {
  if (feltTemp < -5) return "estremo";
  if (feltTemp < 5) return "gelido";
  if (feltTemp < 12) return "freddo";
  if (feltTemp < 18) return "fresco";
  if (feltTemp < 27) return "confortevole";
  if (feltTemp < 34) return "caldo";
  if (feltTemp < 40) return "torrido";
  return "estremo";
}
export const COMFORT_LABEL = {
  gelido: "Gelido", freddo: "Freddo", fresco: "Fresco", confortevole: "Confortevole",
  caldo: "Caldo", torrido: "Torrido", estremo: "Estremo",
};

export function computeEnvironment(time, season, seasonProgress, climate, weather) {
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

// ------------------------------------------------------------ risorse ----
export function computeRegionResources(climate, history, avgAirTemperatureC) {
  const window = history.slice(-30);
  const avgRain = window.length > 0
    ? window.reduce((s, h) => s + h.rainIntensity, 0) / window.length
    : 0.2;
  const evaporationLoss = clamp((avgAirTemperatureC - 15) / 60, 0, 0.4);
  const waterAvailability = clamp(climate.baseAquifer * 0.6 + avgRain * 0.9 - evaporationLoss, 0, 1);
  const idealTemp = 20;
  const tempSuitability = clamp(1 - Math.abs(avgAirTemperatureC - idealTemp) / 30, 0, 1);
  const fertility = clamp(waterAvailability * 0.7 + tempSuitability * 0.3, 0, 1);
  const scarcityIndex = clamp(1 - (waterAvailability * 0.5 + fertility * 0.5), 0, 1);
  return {
    waterAvailability: round2(waterAvailability),
    fertility: round2(fertility),
    scarcityIndex: round2(scarcityIndex),
  };
}

// ------------------------------------------------------------- bisogni ----
export const ACTIVITY_MULTIPLIER = { riposo: 0.6, normale: 1.0, viaggio: 1.4, combattimento: 2.5 };
export const ACTIVITY_LABEL = { riposo: "Riposo", normale: "Normale", viaggio: "Viaggio", combattimento: "Combattimento" };

export function createDefaultNeeds() { return { hunger: 100, thirst: 100, energy: 100, sleepDebt: 0 }; }

export function advanceNeeds(needs, hours, activity, environment) {
  const activityMult = ACTIVITY_MULTIPLIER[activity];
  const baseHungerRate = 100 / 72;
  const baseThirstRate = 100 / 36;
  const baseEnergyRate = 100 / 18;
  const heatThirstMult = environment.feltTemperatureC > 27 ? 1 + (environment.feltTemperatureC - 27) * 0.08 : 1;
  const coldEnergyMult = environment.feltTemperatureC < 5 ? 1 + (5 - environment.feltTemperatureC) * 0.05 : 1;

  const hunger = clamp(needs.hunger - baseHungerRate * activityMult * hours, 0, 100);
  const thirst = clamp(needs.thirst - baseThirstRate * activityMult * heatThirstMult * hours, 0, 100);
  const energy = clamp(needs.energy - baseEnergyRate * activityMult * coldEnergyMult * hours, 0, 100);
  const sleepDebtDelta = activity === "riposo" ? -hours * 3 : hours * 1.2;
  const sleepDebt = clamp(needs.sleepDebt + sleepDebtDelta, 0, 100);

  return { hunger, thirst, energy, sleepDebt };
}

export function applyRest(needs, hours, quality = "normale") {
  const qualityMult = quality === "scarso" ? 0.5 : quality === "buono" ? 1.4 : 1;
  return {
    ...needs,
    energy: clamp(needs.energy + hours * 8 * qualityMult, 0, 100),
    sleepDebt: clamp(needs.sleepDebt - hours * 6 * qualityMult, 0, 100),
  };
}

export function eatFood(needs, amount) { return { ...needs, hunger: clamp(needs.hunger + amount, 0, 100) }; }
export function drinkWater(needs, amount) { return { ...needs, thirst: clamp(needs.thirst + amount, 0, 100) }; }

function pushThresholdModifier(out, source, value, thresholds) {
  for (const t of thresholds) {
    if (value < t.below) {
      out.push({ source, label: t.label, value: t.value, type: "additivo" });
      return;
    }
  }
}

export function getNeedsModifiers(needs) {
  const modifiers = [];
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
  if (needs.sleepDebt > 70) modifiers.push({ source: "sonno", label: "Deficit di sonno severo", value: -15, type: "additivo" });
  else if (needs.sleepDebt > 40) modifiers.push({ source: "sonno", label: "Deficit di sonno", value: -7, type: "additivo" });
  return modifiers;
}

// --------------------------------------------------------------- umore ----
export function createDefaultMood() { return { value: 0, impulses: [] }; }
export function pushMoodEvent(mood, label, delta, decayPerTick = 0.15) {
  return { ...mood, impulses: [...mood.impulses, { label, delta, decayPerTick }] };
}
function needsSatisfaction(needs) {
  const avg = (needs.hunger + needs.thirst + needs.energy + (100 - needs.sleepDebt)) / 4;
  return (avg - 70) * 0.7;
}
function environmentalComfortBonus(environment) {
  switch (environment.comfortLabel) {
    case "confortevole": return 4;
    case "fresco": return 1;
    case "caldo": return -2;
    case "freddo": return -3;
    case "torrido": return -7;
    case "gelido": return -8;
    case "estremo": return -14;
    default: return 0;
  }
}
export function advanceMood(mood, needs, environment) {
  const eventContribution = mood.impulses.reduce((s, i) => s + i.delta, 0);
  const target = clamp(needsSatisfaction(needs) + environmentalComfortBonus(environment) + eventContribution, -100, 100);
  const smoothing = 0.18;
  const value = clamp(mood.value + (target - mood.value) * smoothing, -100, 100);
  const impulses = mood.impulses
    .map((i) => ({ ...i, delta: i.delta * (1 - i.decayPerTick) }))
    .filter((i) => Math.abs(i.delta) > 0.5);
  return { value, impulses };
}
export function classifyMorale(value) {
  if (value < -50) return "disperato";
  if (value < -15) return "scoraggiato";
  if (value < 15) return "neutro";
  if (value < 50) return "motivato";
  return "esaltato";
}
export const MORALE_LABEL = { disperato: "Disperato", scoraggiato: "Scoraggiato", neutro: "Neutro", motivato: "Motivato", esaltato: "Esaltato" };

// --------------------------------------------------------- modificatori ----
function ambientNoiseIndex(weather) {
  const windComponent = clamp(weather.windSpeedKmh / 70, 0, 1);
  const rainComponent = weather.rainIntensity;
  const stormBonus = weather.state === "temporale" ? 0.25 : 0;
  return clamp(windComponent * 0.6 + rainComponent * 0.5 + stormBonus, 0, 1);
}
function windRangedPenalty(weather) {
  if (weather.windSpeedKmh <= 10) return null;
  return { source: "vento", label: `Vento forte (${weather.windSpeedKmh} km/h)`, value: -Math.round((weather.windSpeedKmh - 10) * 0.4), type: "additivo" };
}
function rainRangedPenalty(weather) {
  if (weather.rainIntensity <= 0.1) return null;
  return { source: "pioggia", label: "Presa bagnata, visibilità ridotta dalla pioggia", value: -Math.round(weather.rainIntensity * 12), type: "additivo" };
}
function visibilityPenalty(weather, distanceMeters) {
  if (weather.visibilityMeters >= distanceMeters * 3) return null;
  const ratio = clamp(weather.visibilityMeters / (distanceMeters * 3), 0, 1);
  return { source: "visibilita", label: `Visibilità ridotta (${weather.visibilityMeters} m)`, value: -Math.round((1 - ratio) * 25), type: "additivo" };
}
function lightVisualModifier(environment) {
  if (environment.lightLevel >= 0.5) return null;
  return { source: "luce", label: `Scarsa illuminazione (${LIGHT_LABEL[environment.lightLabel]})`, value: -Math.round((0.5 - environment.lightLevel) * 30), type: "additivo" };
}
function coldHandsPenalty(environment) {
  if (environment.feltTemperatureC >= 2) return null;
  return { source: "freddo", label: "Mani intorpidite dal freddo", value: -Math.round((2 - environment.feltTemperatureC) * 1.2), type: "additivo" };
}
function rangedModifiers(ctx) {
  const distance = ctx.params?.distanceMeters ?? 20;
  return [
    windRangedPenalty(ctx.weather), rainRangedPenalty(ctx.weather),
    visibilityPenalty(ctx.weather, distance), lightVisualModifier(ctx.environment),
    coldHandsPenalty(ctx.environment),
  ].filter(Boolean);
}
function stealthModifiers(ctx) {
  const noise = ambientNoiseIndex(ctx.weather);
  const modifiers = [];
  if (noise > 0.05) modifiers.push({ source: "rumore_ambientale", label: "Il rumore di fondo copre i tuoi movimenti", value: Math.round(noise * 25), type: "additivo" });
  else modifiers.push({ source: "silenzio", label: "Ambiente silenzioso: ogni passo si sente", value: -8, type: "additivo" });
  if (ctx.environment.lightLevel < 0.35) modifiers.push({ source: "oscurita", label: "Oscurità favorevole", value: Math.round((0.35 - ctx.environment.lightLevel) * 30), type: "additivo" });
  else if (ctx.environment.lightLevel > 0.75) modifiers.push({ source: "luce_piena", label: "Piena luce: difficile passare inosservati", value: -6, type: "additivo" });
  if (ctx.weather.state === "nebbia") modifiers.push({ source: "nebbia", label: "La nebbia nasconde la sagoma", value: 10, type: "additivo" });
  return modifiers;
}
function auditoryPerceptionModifiers(ctx) {
  const noise = ambientNoiseIndex(ctx.weather);
  if (noise <= 0.05) return [];
  return [{ source: "rumore_ambientale", label: "Il vento/la pioggia coprono i suoni circostanti", value: -Math.round(noise * 25), type: "additivo" }];
}
function visualPerceptionModifiers(ctx) {
  const modifiers = [];
  const lp = lightVisualModifier(ctx.environment); if (lp) modifiers.push(lp);
  const vp = visibilityPenalty(ctx.weather, 15); if (vp) modifiers.push(vp);
  return modifiers;
}
function movementModifiers(ctx) {
  const modifiers = [];
  if (ctx.weather.rainIntensity > 0.4) modifiers.push({ source: "fango", label: "Terreno fangoso", value: -10, type: "additivo" });
  if (ctx.weather.state === "neve" || ctx.weather.state === "bufera_di_neve") modifiers.push({ source: "neve", label: "Neve al suolo", value: -15, type: "additivo" });
  if (ctx.weather.windSpeedKmh > 50) modifiers.push({ source: "vento", label: "Vento fortissimo", value: -8, type: "additivo" });
  if (ctx.environment.comfortLabel === "torrido" || ctx.environment.comfortLabel === "estremo") modifiers.push({ source: "calore", label: "Il caldo estremo affatica ogni sforzo", value: -10, type: "additivo" });
  return modifiers;
}
const MORALE_TABLE = {
  disperato: { coraggio: -20, sociale: -15 }, scoraggiato: { coraggio: -8, sociale: -5 },
  neutro: { coraggio: 0, sociale: 0 }, motivato: { coraggio: 8, sociale: 5 }, esaltato: { coraggio: 18, sociale: 12 },
};
function moraleModifiers(action, ctx) {
  const label = classifyMorale(ctx.mood.value);
  return [{ source: "morale", label: `Morale: ${MORALE_LABEL[label]}`, value: MORALE_TABLE[label][action], type: "additivo" }];
}
export function computeModifiers(action, ctx) {
  let modifiers = [];
  if (action === "attacco_a_distanza") modifiers = rangedModifiers(ctx);
  else if (action === "furtivita") modifiers = stealthModifiers(ctx);
  else if (action === "percezione_uditiva") modifiers = auditoryPerceptionModifiers(ctx);
  else if (action === "percezione_visiva") modifiers = visualPerceptionModifiers(ctx);
  else if (action === "movimento") modifiers = movementModifiers(ctx);
  else if (action === "coraggio" || action === "sociale") modifiers = moraleModifiers(action, ctx);

  modifiers = [...modifiers, ...getNeedsModifiers(ctx.needs)];
  const total = modifiers.filter((m) => m.type === "additivo").reduce((s, m) => s + m.value, 0);
  return { modifiers, total };
}

// -------------------------------------------------------------- comodo ----
export function initRegionsState(time) {
  const season = getSeason(time);
  const out = {};
  for (const def of REGIONS) {
    const weather = createInitialWeather(def.climate, season, Math.random);
    const environment = computeEnvironment(time, season, getSeasonProgress(time), def.climate, weather.current);
    const resources = computeRegionResources(def.climate, weather.history, environment.airTemperatureC);
    out[def.id] = { def, weather, environment, resources };
  }
  return out;
}
