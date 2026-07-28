import { EnvironmentSnapshot, RegionDefinition, Season, WorldTime } from "./types";
import { advanceTime, createWorldTime, getDayIndex, getSeason, getSeasonProgress } from "./time";
import { advanceRegionWeather, createInitialWeather, RegionWeatherRuntime } from "./weather";
import { computeEnvironment } from "./environment";
import { computeRegionResources, RegionResourceIndex } from "./resources";

export interface RegionRuntimeState {
  definition: RegionDefinition;
  weather: RegionWeatherRuntime;
  environment: EnvironmentSnapshot;
  resources: RegionResourceIndex;
}

export class WorldSimulation {
  time: WorldTime;
  regions: Map<string, RegionRuntimeState> = new Map();
  private rng: () => number;

  constructor(
    regionDefs: RegionDefinition[],
    startDay = 0,
    startHour = 8,
    rng: () => number = Math.random
  ) {
    this.time = createWorldTime(startDay, startHour);
    this.rng = rng;

    for (const def of regionDefs) {
      const season = getSeason(this.time);
      const weather = createInitialWeather(def.climate, season, rng);
      const environment = computeEnvironment(
        this.time,
        season,
        getSeasonProgress(this.time),
        def.climate,
        weather.current
      );
      const resources = computeRegionResources(def.climate, weather.history, environment.airTemperatureC);
      this.regions.set(def.id, { definition: def, weather, environment, resources });
    }
  }

  getSeason(): Season {
    return getSeason(this.time);
  }

  getRegion(id: string): RegionRuntimeState {
    const region = this.regions.get(id);
    if (!region) throw new Error(`Regione sconosciuta: ${id}`);
    return region;
  }

  /**
   * Avanza la simulazione di `hours` ore. Il meteo di ciascuna regione viene
   * ricalcolato una volta per ogni giorno di gioco trascorso (non a ogni
   * ora), mentre luce e temperatura vengono ricalcolate sempre, dato che
   * seguono un ciclo continuo nell'arco della giornata.
   */
  advance(hours: number): void {
    const previousDay = getDayIndex(this.time);
    this.time = advanceTime(this.time, hours * 60);
    const currentDay = getDayIndex(this.time);
    const daysPassed = currentDay - previousDay;

    const season = getSeason(this.time);
    const seasonProgress = getSeasonProgress(this.time);

    for (const region of this.regions.values()) {
      let weather = region.weather;
      for (let d = 0; d < daysPassed; d++) {
        weather = advanceRegionWeather(region.definition.climate, season, weather, previousDay + d + 1, this.rng);
      }

      const environment = computeEnvironment(this.time, season, seasonProgress, region.definition.climate, weather.current);

      // Aggiorna la temperatura registrata nell'ultima voce di storia, così
      // il calcolo delle risorse legge temperature reali e non segnaposto.
      if (daysPassed > 0 && weather.history.length > 0) {
        const last = weather.history[weather.history.length - 1];
        weather = {
          ...weather,
          history: [...weather.history.slice(0, -1), { ...last, airTemperatureC: environment.airTemperatureC }],
        };
      }

      const resources = computeRegionResources(region.definition.climate, weather.history, environment.airTemperatureC);

      this.regions.set(region.definition.id, { ...region, weather, environment, resources });
    }
  }
}
