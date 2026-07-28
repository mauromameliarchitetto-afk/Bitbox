import { ClimateProfile } from "./types";
import { WeatherHistoryEntry } from "./weather";

export interface RegionResourceIndex {
  /** Disponibilità idrica attuale (0-1): falda di base + piogge recenti - evaporazione. */
  waterAvailability: number;
  /** Fertilità del suolo (0-1): funzione di acqua disponibile e clima termico adatto. */
  fertility: number;
  /** Indice di scarsità complessivo (0 = abbondanza, 1 = carestia), utile ai sistemi economici. */
  scarcityIndex: number;
}

/**
 * Deriva la "ricchezza" di risorse di una regione dalla sua storia meteo
 * recente, invece che da un numero statico scritto a mano. Così due regioni
 * con lo stesso profilo climatico possono comunque divergere nel tempo (un
 * deserto colpito da una serie di tempeste di sabbia fuori norma diventa
 * temporaneamente più povero d'acqua), e la narrazione può spiegare eventi
 * economici (carestie, buoni raccolti) con cause meteo concrete e tracciabili.
 */
export function computeRegionResources(
  climate: ClimateProfile,
  history: WeatherHistoryEntry[],
  avgAirTemperatureC: number
): RegionResourceIndex {
  const window = history.slice(-30); // ultimi ~30 giorni di gioco
  const avgRain =
    window.length > 0 ? window.reduce((sum, h) => sum + h.rainIntensity, 0) / window.length : 0.2;

  const evaporationLoss = clamp((avgAirTemperatureC - 15) / 60, 0, 0.4);

  const waterAvailability = clamp(climate.baseAquifer * 0.6 + avgRain * 0.9 - evaporationLoss, 0, 1);

  // La fertilità premia un clima termico "temperato" e penalizza gli estremi,
  // indipendentemente da quanto sia piovoso: una zona tropicale troppo calda
  // o una artica troppo fredda restano meno fertili di una zona temperata
  // ben irrigata, anche a parità d'acqua disponibile.
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

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}
function round2(v: number) {
  return Math.round(v * 100) / 100;
}
