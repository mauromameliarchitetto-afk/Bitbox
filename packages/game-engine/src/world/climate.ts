import { ClimateProfile, RegionDefinition } from "./types";

/**
 * Profili climatici di riferimento. Ogni profilo definisce come una regione
 * "si comporta" meteorologicamente stagione per stagione: quanto piove,
 * quanto tira vento, quali sono le temperature attese. È da qui che nasce la
 * regionalità: due regioni condividono lo stesso motore meteo, ma profili
 * diversi producono climi coerenti e riconoscibili nel tempo, non eventi
 * casuali scollegati dal contesto — un deserto avrà pochissima pioggia ma
 * vento e caldo frequenti, una foresta pluviale pioggia quasi costante.
 */

export const CLIMATE_ARIDO: ClimateProfile = {
  type: "arido",
  latitudeBand: "temperata",
  altitudeMeters: 400,
  baseAquifer: 0.15,
  temperature: {
    primavera: { min: 14, max: 30 },
    estate: { min: 24, max: 42 },
    autunno: { min: 12, max: 28 },
    inverno: { min: 2, max: 18 },
  },
  weatherWeights: {
    primavera: { sereno: 45, poco_nuvoloso: 15, ventoso: 25, tempesta_di_sabbia: 8, pioggia_leggera: 4, nuvoloso: 3 },
    estate: { sereno: 40, ventoso: 20, tempesta_di_sabbia: 15, ondata_di_calore: 18, poco_nuvoloso: 5, pioggia_leggera: 2 },
    autunno: { sereno: 48, poco_nuvoloso: 18, ventoso: 20, tempesta_di_sabbia: 8, pioggia_leggera: 6 },
    inverno: { sereno: 40, poco_nuvoloso: 22, ventoso: 22, pioggia_leggera: 12, nuvoloso: 4 },
  },
  persistence: 2.2,
};

export const CLIMATE_TROPICALE: ClimateProfile = {
  type: "tropicale",
  latitudeBand: "equatoriale",
  altitudeMeters: 100,
  baseAquifer: 0.85,
  temperature: {
    primavera: { min: 22, max: 31 },
    estate: { min: 24, max: 33 },
    autunno: { min: 22, max: 31 },
    inverno: { min: 20, max: 29 },
  },
  // Pioggia quasi costante tutto l'anno: la regione "dove piove sempre".
  weatherWeights: {
    primavera: { pioggia_intensa: 30, temporale: 20, pioggia_leggera: 25, nuvoloso: 15, poco_nuvoloso: 8, sereno: 2 },
    estate: { pioggia_intensa: 25, temporale: 25, pioggia_leggera: 22, nuvoloso: 18, poco_nuvoloso: 8, sereno: 2 },
    autunno: { pioggia_intensa: 32, temporale: 22, pioggia_leggera: 24, nuvoloso: 14, poco_nuvoloso: 6, sereno: 2 },
    inverno: { pioggia_intensa: 20, temporale: 15, pioggia_leggera: 28, nuvoloso: 20, poco_nuvoloso: 12, sereno: 5 },
  },
  persistence: 2.6,
};

export const CLIMATE_MONSONICO: ClimateProfile = {
  type: "monsonico",
  latitudeBand: "temperata",
  altitudeMeters: 250,
  baseAquifer: 0.5,
  temperature: {
    primavera: { min: 20, max: 34 }, // stagione secca
    estate: { min: 24, max: 32 }, // stagione delle piogge
    autunno: { min: 18, max: 30 },
    inverno: { min: 10, max: 24 }, // stagione secca
  },
  // Due "anime" nello stesso anno: secca e ventosa in inverno/primavera,
  // improvvisamente piovosissima in estate — dimostra come una sola regione
  // possa avere regimi molto diversi a seconda della stagione.
  weatherWeights: {
    primavera: { sereno: 35, ventoso: 25, poco_nuvoloso: 20, tempesta_di_sabbia: 5, pioggia_leggera: 10, nuvoloso: 5 },
    estate: { pioggia_intensa: 35, temporale: 28, pioggia_leggera: 20, nuvoloso: 12, poco_nuvoloso: 4, sereno: 1 },
    autunno: { nuvoloso: 25, pioggia_leggera: 25, poco_nuvoloso: 20, sereno: 15, ventoso: 15 },
    inverno: { sereno: 40, poco_nuvoloso: 25, ventoso: 20, nuvoloso: 10, pioggia_leggera: 5 },
  },
  persistence: 2.4,
};

export const CLIMATE_TEMPERATO: ClimateProfile = {
  type: "temperato",
  latitudeBand: "temperata",
  altitudeMeters: 200,
  baseAquifer: 0.55,
  temperature: {
    primavera: { min: 8, max: 18 },
    estate: { min: 16, max: 28 },
    autunno: { min: 6, max: 16 },
    inverno: { min: -2, max: 8 },
  },
  weatherWeights: {
    primavera: { poco_nuvoloso: 25, nuvoloso: 20, pioggia_leggera: 20, sereno: 20, ventoso: 10, pioggia_intensa: 5 },
    estate: { sereno: 35, poco_nuvoloso: 25, nuvoloso: 15, pioggia_leggera: 12, temporale: 8, ventoso: 5 },
    autunno: { nuvoloso: 28, pioggia_leggera: 22, poco_nuvoloso: 18, ventoso: 15, sereno: 10, pioggia_intensa: 7 },
    inverno: { nuvoloso: 25, pioggia_leggera: 18, neve: 15, poco_nuvoloso: 15, sereno: 12, ventoso: 10, bufera_di_neve: 5 },
  },
  persistence: 1.6,
};

export const CLIMATE_ALPINO: ClimateProfile = {
  type: "alpino",
  latitudeBand: "temperata",
  altitudeMeters: 2200,
  baseAquifer: 0.6,
  temperature: {
    primavera: { min: -2, max: 10 },
    estate: { min: 6, max: 18 },
    autunno: { min: -4, max: 8 },
    inverno: { min: -18, max: -4 },
  },
  weatherWeights: {
    primavera: { poco_nuvoloso: 20, nuvoloso: 20, neve: 20, ventoso: 20, sereno: 12, pioggia_leggera: 8 },
    estate: { sereno: 30, poco_nuvoloso: 25, nuvoloso: 15, temporale: 15, ventoso: 15 },
    autunno: { nuvoloso: 25, ventoso: 25, neve: 20, poco_nuvoloso: 15, sereno: 15 },
    inverno: { neve: 30, bufera_di_neve: 25, ventoso: 20, nuvoloso: 15, sereno: 10 },
  },
  persistence: 2.0,
};

export const REGIONS: RegionDefinition[] = [
  { id: "khal-arida", name: "Distese di Khal", climate: CLIMATE_ARIDO },
  { id: "yrel-tropicale", name: "Foreste di Yrel", climate: CLIMATE_TROPICALE },
  { id: "duvain-monsonico", name: "Bassopiano di Duvain", climate: CLIMATE_MONSONICO },
  { id: "ovest-temperato", name: "Piana dell'Ovest", climate: CLIMATE_TEMPERATO },
  { id: "corone-alpine", name: "Corone Alpine", climate: CLIMATE_ALPINO },
];
