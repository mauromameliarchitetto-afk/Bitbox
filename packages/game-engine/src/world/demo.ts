import { WorldSimulation } from "./world";
import { REGIONS } from "./climate";
import { advanceNeeds, createDefaultNeeds } from "./needs";
import { advanceMood, classifyMorale, createDefaultMood } from "./mood";
import { computeModifiers } from "./modifiers";

/** Generatore pseudo-casuale deterministico, per demo riproducibili. */
function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function runClimateComparison() {
  const world = new WorldSimulation(REGIONS, 0, 8, seededRng(42));
  const arid = REGIONS.find((r) => r.id === "khal-arida")!;
  const tropical = REGIONS.find((r) => r.id === "yrel-tropicale")!;

  const rainDays: Record<string, number> = { [arid.id]: 0, [tropical.id]: 0 };
  const windyDays: Record<string, number> = { [arid.id]: 0, [tropical.id]: 0 };

  for (let day = 0; day < 90; day++) {
    world.advance(24);
    for (const id of [arid.id, tropical.id]) {
      const r = world.getRegion(id);
      if (r.weather.current.rainIntensity > 0.1) rainDays[id]++;
      if (r.weather.current.windSpeedKmh > 35) windyDays[id]++;
    }
  }

  console.log("=== Confronto climatico su 90 giorni (una stagione) ===");
  for (const id of [arid.id, tropical.id]) {
    const r = world.getRegion(id);
    console.log(
      `${r.definition.name.padEnd(22)} | giorni di pioggia: ${String(rainDays[id]).padStart(2)}/90` +
        ` | giorni ventosi: ${String(windyDays[id]).padStart(2)}/90` +
        ` | acqua disponibile: ${r.resources.waterAvailability}` +
        ` | fertilità: ${r.resources.fertility}` +
        ` | scarsità: ${r.resources.scarcityIndex}`
    );
  }
}

function runCharacterScenario() {
  console.log("\n=== Scenario personaggio: viaggio nel deserto di Khal ===");
  const world = new WorldSimulation(REGIONS, 0, 6, seededRng(7));
  let needs = createDefaultNeeds();
  let mood = createDefaultMood();

  for (let hour = 0; hour < 30; hour += 6) {
    world.advance(6);
    const region = world.getRegion("khal-arida");
    needs = advanceNeeds(needs, 6, "viaggio", region.environment);
    mood = advanceMood(mood, needs, region.environment);

    console.log(
      `+${String(hour + 6).padStart(2)}h | meteo: ${region.weather.current.state.padEnd(18)}` +
        ` vento ${String(region.weather.current.windSpeedKmh).padStart(4)}km/h` +
        ` | temp.perc. ${region.environment.feltTemperatureC}°C` +
        ` | fame:${Math.round(needs.hunger)} sete:${Math.round(needs.thirst)} energia:${Math.round(needs.energy)}` +
        ` | umore: ${classifyMorale(mood.value)}`
    );
  }

  const region = world.getRegion("khal-arida");

  const ranged = computeModifiers("attacco_a_distanza", {
    weather: region.weather.current,
    environment: region.environment,
    needs,
    mood,
    params: { distanceMeters: 30 },
  });
  console.log("\nModificatori per un attacco a distanza in queste condizioni:");
  ranged.modifiers.forEach((m) => console.log(`  ${m.label}: ${m.value >= 0 ? "+" : ""}${m.value}`));
  console.log(`  TOTALE: ${ranged.total >= 0 ? "+" : ""}${ranged.total}`);

  const stealth = computeModifiers("furtivita", {
    weather: region.weather.current,
    environment: region.environment,
    needs,
    mood,
  });
  console.log("\nModificatori per un tentativo di furtività in queste condizioni:");
  stealth.modifiers.forEach((m) => console.log(`  ${m.label}: ${m.value >= 0 ? "+" : ""}${m.value}`));
  console.log(`  TOTALE: ${stealth.total >= 0 ? "+" : ""}${stealth.total}`);
}

runClimateComparison();
runCharacterScenario();
