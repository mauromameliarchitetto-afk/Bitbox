import React, { useCallback, useState } from "react";
import {
  Sun, Moon, CloudSun, Cloud, CloudDrizzle, CloudRain, CloudLightning,
  CloudFog, Wind, CloudSnow, Snowflake, Flame, Target, Footprints, Eye, Ear,
  Shield, Users, Utensils, GlassWater, BedDouble, Droplets, ThermometerSun,
  Gauge as GaugeIcon,
} from "lucide-react";
import {
  REGIONS, createWorldTime, advanceTime, getHourOfDay, getDayIndex, getSeason,
  getSeasonProgress, getDaylightWindow, SEASON_LABEL, formatHour,
  initRegionsState, advanceRegionWeather, computeEnvironment, computeRegionResources,
  createDefaultNeeds, advanceNeeds, applyRest, eatFood, drinkWater,
  createDefaultMood, pushMoodEvent, advanceMood, classifyMorale, MORALE_LABEL,
  computeModifiers, WEATHER_LABEL, LIGHT_LABEL, COMFORT_LABEL, ACTIVITY_LABEL,
  clamp,
} from "./world-engine.js";

const ACTIONS = [
  { id: "attacco_a_distanza", label: "Attacco a distanza", icon: Target },
  { id: "furtivita", label: "Furtività", icon: Footprints },
  { id: "percezione_visiva", label: "Percezione visiva", icon: Eye },
  { id: "percezione_uditiva", label: "Percezione uditiva", icon: Ear },
  { id: "movimento", label: "Movimento", icon: GaugeIcon },
  { id: "coraggio", label: "Coraggio", icon: Shield },
  { id: "sociale", label: "Sociale", icon: Users },
];

const WEATHER_ICON = {
  sereno: Sun, poco_nuvoloso: CloudSun, nuvoloso: Cloud, pioggia_leggera: CloudDrizzle,
  pioggia_intensa: CloudRain, temporale: CloudLightning, nebbia: CloudFog, ventoso: Wind,
  tempesta_di_sabbia: Wind, neve: CloudSnow, bufera_di_neve: Snowflake, ondata_di_calore: Flame,
};

/* ============================== sottocomponenti ============================== */

function Panel({ title, icon: Icon, accent, children }) {
  return (
    <section className="panel">
      <div className="panel-head">
        {Icon ? <Icon size={15} strokeWidth={2} style={{ color: accent || "var(--brass)" }} /> : null}
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Bar({ label, value, max = 100, unit = "", accent, caption }) {
  const pct = clamp((value / max) * 100, 0, 100);
  return (
    <div className="bar-row">
      <div className="bar-row-top">
        <span className="bar-label">{label}</span>
        <span className="bar-value">{Math.round(value)}{unit}</span>
      </div>
      <div className="bar-track">
        <div className="bar-fill" style={{ width: `${pct}%`, background: accent }} />
      </div>
      {caption ? <div className="bar-caption">{caption}</div> : null}
    </div>
  );
}

function StatChip({ icon: Icon, label, value }) {
  return (
    <div className="stat-chip">
      <Icon size={13} strokeWidth={2} />
      <div>
        <div className="stat-chip-value">{value}</div>
        <div className="stat-chip-label">{label}</div>
      </div>
    </div>
  );
}

function DayArc({ time, sunrise, sunset, lightLevel, accent }) {
  const hour = getHourOfDay(time);
  const isDay = hour >= sunrise && hour <= sunset;
  const t = clamp((hour - sunrise) / (sunset - sunrise), 0, 1);
  const phi = Math.PI * (1 - t);
  const cx = 150, cy = 118, r = 104;
  const mx = cx + r * Math.cos(phi);
  const my = cy - r * Math.sin(phi);
  const nightX = 150 + Math.cos((hour / 24) * Math.PI * 2) * 60;

  return (
    <svg viewBox="0 0 300 150" className="day-arc" role="img" aria-label="Posizione del sole nel cielo">
      <defs>
        <radialGradient id="skyGlow" cx="50%" cy="30%" r="75%">
          <stop offset="0%" stopColor={accent} stopOpacity={0.28 + lightLevel * 0.35} />
          <stop offset="100%" stopColor={accent} stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={r + 18} fill="url(#skyGlow)" />
      <path d={`M ${cx - r},${cy} A ${r},${r} 0 0 1 ${cx + r},${cy}`} stroke="var(--line)" strokeWidth="1.5" fill="none" strokeDasharray="1 5" strokeLinecap="round" />
      <line x1={cx - r - 12} y1={cy} x2={cx + r + 12} y2={cy} stroke="var(--line)" strokeWidth="1" />
      {isDay ? (
        <circle cx={mx} cy={my} r={7} fill={accent} opacity={0.55 + lightLevel * 0.45} />
      ) : (
        <circle cx={nightX} cy={cy - 6} r={5} fill="var(--ink-muted)" opacity={0.7} />
      )}
      <text x={cx - r} y={cy + 18} textAnchor="middle" className="day-arc-label">{formatHour(sunrise)}</text>
      <text x={cx + r} y={cy + 18} textAnchor="middle" className="day-arc-label">{formatHour(sunset)}</text>
      <text x={cx} y={cy - r - 6} textAnchor="middle" className="day-arc-label day-arc-label-strong">{formatHour(hour)}</text>
    </svg>
  );
}

function ModifierRow({ m }) {
  const positive = m.value >= 0;
  return (
    <div className="mod-row">
      <span className="mod-label">{m.label}</span>
      <span className={`mod-value ${positive ? "mod-pos" : "mod-neg"}`}>{positive ? "+" : ""}{m.value}</span>
    </div>
  );
}

/* ============================== componente principale ============================== */

export default function WorldTester() {
  const [time, setTime] = useState(() => createWorldTime(0, 8));
  const [regionsState, setRegionsState] = useState(() => initRegionsState(createWorldTime(0, 8)));
  const [activeRegionId, setActiveRegionId] = useState(REGIONS[0].id);
  const [activity, setActivity] = useState("normale");
  const [needs, setNeeds] = useState(() => createDefaultNeeds());
  const [mood, setMood] = useState(() => createDefaultMood());
  const [actionType, setActionType] = useState("attacco_a_distanza");
  const [distance, setDistance] = useState(30);
  const [result, setResult] = useState(null);
  const [log, setLog] = useState([{ id: "init", text: "Simulazione avviata." }]);

  const region = regionsState[activeRegionId];
  const def = region.def;
  const accent = def.accent;
  const season = getSeason(time);
  const daylight = getDaylightWindow(season, def.climate.latitudeBand);

  const pushLog = useCallback((text) => {
    setLog((l) => [{ id: `${Date.now()}-${Math.random()}`, text }, ...l].slice(0, 6));
  }, []);

  const advance = useCallback((hours) => {
    const currentEnv = regionsState[activeRegionId].environment;

    setTime((prevTime) => {
      const previousDay = getDayIndex(prevTime);
      const newTime = advanceTime(prevTime, hours * 60);
      const currentDay = getDayIndex(newTime);
      const daysPassed = currentDay - previousDay;
      const newSeason = getSeason(newTime);
      const seasonProgress = getSeasonProgress(newTime);

      setRegionsState((prevRegions) => {
        const next = {};
        for (const id of Object.keys(prevRegions)) {
          const r = prevRegions[id];
          let weather = r.weather;
          for (let d = 0; d < daysPassed; d++) {
            weather = advanceRegionWeather(r.def.climate, newSeason, weather, previousDay + d + 1, Math.random);
          }
          const environment = computeEnvironment(newTime, newSeason, seasonProgress, r.def.climate, weather.current);
          if (daysPassed > 0 && weather.history.length > 0) {
            const last = weather.history[weather.history.length - 1];
            weather = { ...weather, history: [...weather.history.slice(0, -1), { ...last, airTemperatureC: environment.airTemperatureC }] };
          }
          const resources = computeRegionResources(r.def.climate, weather.history, environment.airTemperatureC);
          next[id] = { ...r, weather, environment, resources };
        }
        return next;
      });

      return newTime;
    });

    setNeeds((prevNeeds) => {
      let n = advanceNeeds(prevNeeds, hours, activity, currentEnv);
      if (activity === "riposo") n = applyRest(n, hours, "normale");
      setMood((prevMood) => advanceMood(prevMood, n, currentEnv));
      return n;
    });

    pushLog(`Avanzate ${hours} ${hours === 1 ? "ora" : "ore"} — attività: ${ACTIVITY_LABEL[activity].toLowerCase()}.`);
  }, [activeRegionId, activity, regionsState, pushLog]);

  const doEat = useCallback(() => { setNeeds((n) => eatFood(n, 40)); pushLog("Pasto consumato (+40 fame)."); }, [pushLog]);
  const doDrink = useCallback(() => { setNeeds((n) => drinkWater(n, 40)); pushLog("Acqua bevuta (+40 sete)."); }, [pushLog]);
  const doRest = useCallback(() => {
    setNeeds((n) => applyRest(n, 8, "buono"));
    pushLog("Riposo di 8 ore in un rifugio sicuro.");
  }, [pushLog]);
  const doMoodEvent = useCallback((label, delta) => {
    setMood((m) => pushMoodEvent(m, label, delta));
    pushLog(`Evento: ${label} (${delta >= 0 ? "+" : ""}${delta} umore).`);
  }, [pushLog]);

  const runTest = useCallback(() => {
    const r = computeModifiers(actionType, {
      weather: region.weather.current,
      environment: region.environment,
      needs,
      mood,
      params: { distanceMeters: distance },
    });
    setResult(r);
  }, [actionType, region, needs, mood, distance]);

  const w = region.weather.current;
  const env = region.environment;
  const res = region.resources;
  const WeatherIcon = WEATHER_ICON[w.state];
  const moraleLabel = classifyMorale(mood.value);

  return (
    <div className="root">
      <div className="masthead">
        <div className="masthead-eyebrow">Bitbox — Motore del mondo</div>
        <h1>Banco di prova</h1>
        <div className="masthead-sub">Meteo · ambiente · bisogni · umore · modificatori d'azione</div>
      </div>

      <div className="region-row">
        {REGIONS.map((r) => (
          <button
            key={r.id}
            className={`region-chip${r.id === activeRegionId ? " active" : ""}`}
            style={r.id === activeRegionId ? { borderColor: r.accent, background: `${r.accent}22` } : undefined}
            onClick={() => setActiveRegionId(r.id)}
          >
            <span className="tag" style={{ color: r.accent }}>{r.tag}</span>
            {r.name}
          </button>
        ))}
      </div>

      <Panel title="Cielo" accent={accent}>
        <DayArc time={time} sunrise={daylight.sunrise} sunset={daylight.sunset} lightLevel={env.lightLevel} accent={accent} />
        <div className="season-row">
          <span>Giorno {getDayIndex(time) + 1} · <b>{SEASON_LABEL[season]}</b></span>
          <span>{LIGHT_LABEL[env.lightLabel]}</span>
        </div>
      </Panel>

      <Panel title="Meteo" icon={WeatherIcon} accent={accent}>
        <div className="weather-head">
          <WeatherIcon size={30} strokeWidth={1.6} style={{ color: accent }} />
          <div>
            <div className="weather-head-title">{WEATHER_LABEL[w.state]}</div>
            <div className="weather-head-sub">{def.name} · {def.tag.toLowerCase()}</div>
          </div>
        </div>
        <div className="stat-grid">
          <StatChip icon={Wind} label="Vento" value={`${w.windSpeedKmh} km/h`} />
          <StatChip icon={Droplets} label="Pioggia" value={`${Math.round(w.rainIntensity * 100)}%`} />
          <StatChip icon={Cloud} label="Nuvolosità" value={`${Math.round(w.cloudCover * 100)}%`} />
          <StatChip icon={Eye} label="Visibilità" value={`${w.visibilityMeters} m`} />
        </div>
      </Panel>

      <Panel title="Ambiente" icon={ThermometerSun} accent={accent}>
        <Bar label="Luce naturale" value={env.lightLevel * 100} unit="%" accent={accent} />
        <div className="stat-grid" style={{ marginTop: 4 }}>
          <StatChip icon={ThermometerSun} label="Temp. aria" value={`${env.airTemperatureC}°C`} />
          <StatChip icon={ThermometerSun} label="Temp. percepita" value={`${env.feltTemperatureC}°C`} />
        </div>
        <div className="bar-caption" style={{ marginTop: 8 }}>Sensazione: <b style={{ color: "var(--ink)" }}>{COMFORT_LABEL[env.comfortLabel]}</b></div>
      </Panel>

      <Panel title="Risorse regionali" accent={accent}>
        <Bar label="Disponibilità idrica" value={res.waterAvailability * 100} unit="%" accent="#6fa8dc" caption="Falda di base + media piogge (30 gg) − evaporazione" />
        <Bar label="Fertilità del suolo" value={res.fertility * 100} unit="%" accent="var(--good)" />
        <Bar label="Indice di scarsità" value={res.scarcityIndex * 100} unit="%" accent="var(--bad)" />
      </Panel>

      <Panel title="Avanzamento del tempo" accent={accent}>
        <div className="btn-row">
          <button className="btn" onClick={() => advance(1)}>+1 ora</button>
          <button className="btn" onClick={() => advance(6)}>+6 ore</button>
          <button className="btn" onClick={() => advance(24)}>+1 giorno</button>
          <button className="btn" onClick={() => advance(24 * 7)}>+7 giorni</button>
        </div>
      </Panel>

      <Panel title="Personaggio" accent={accent}>
        <span className="field-label">Attività corrente</span>
        <div className="segmented" style={{ marginBottom: 14 }}>
          {Object.keys(ACTIVITY_LABEL).map((a) => (
            <button key={a} className={a === activity ? "active" : ""} onClick={() => setActivity(a)}>{ACTIVITY_LABEL[a]}</button>
          ))}
        </div>

        <Bar label="Fame" value={needs.hunger} unit="%" accent="#c9863f" />
        <Bar label="Sete" value={needs.thirst} unit="%" accent="#6fa8dc" />
        <Bar label="Energia" value={needs.energy} unit="%" accent="var(--good)" />
        <Bar label="Debito di sonno" value={needs.sleepDebt} unit="%" accent="#9b7fc9" />

        <div className="btn-row" style={{ marginTop: 6 }}>
          <button className="btn btn-sm" onClick={doEat}><Utensils size={13} /> Mangia</button>
          <button className="btn btn-sm" onClick={doDrink}><GlassWater size={13} /> Bevi</button>
          <button className="btn btn-sm" onClick={doRest}><BedDouble size={13} /> Riposa 8h</button>
        </div>

        <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--line)" }}>
          <div className="bar-row-top" style={{ marginBottom: 8 }}>
            <span className="bar-label">Umore</span>
            <span className="bar-value">{MORALE_LABEL[moraleLabel]} ({Math.round(mood.value)})</span>
          </div>
          <div className="btn-row">
            <button className="btn btn-sm btn-ghost" onClick={() => doMoodEvent("Piccola vittoria", 20)}>+ Vittoria</button>
            <button className="btn btn-sm btn-ghost" onClick={() => doMoodEvent("Sconfitta", -20)}>− Sconfitta</button>
            <button className="btn btn-sm btn-ghost" onClick={() => doMoodEvent("Lutto", -40)}>− Lutto</button>
          </div>
        </div>
      </Panel>

      <Panel title="Test modificatori d'azione" accent={accent}>
        <div className="action-grid">
          {ACTIONS.map((a) => (
            <div key={a.id} className={`action-cell${a.id === actionType ? " active" : ""}`} onClick={() => setActionType(a.id)}>
              <a.icon size={17} strokeWidth={1.8} />
              {a.label}
            </div>
          ))}
        </div>

        {actionType === "attacco_a_distanza" && (
          <div className="slider-row">
            <div className="slider-row-top"><span className="bar-label">Distanza dal bersaglio</span><span className="bar-value mono">{distance} m</span></div>
            <input type="range" min={5} max={100} step={5} value={distance} onChange={(e) => setDistance(Number(e.target.value))} />
          </div>
        )}

        <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 6 }} onClick={runTest}>
          Calcola modificatori
        </button>

        {result && (
          <div style={{ marginTop: 14 }}>
            {result.modifiers.length === 0 ? (
              <div className="bar-caption">Nessun modificatore applicabile in queste condizioni.</div>
            ) : (
              result.modifiers.map((m, i) => <ModifierRow key={i} m={m} />)
            )}
            <div className="mod-total">
              <span className="mod-total-label">Totale</span>
              <span className="mod-total-value" style={{ color: result.total >= 0 ? "var(--good)" : "var(--bad)" }}>
                {result.total >= 0 ? "+" : ""}{result.total}
              </span>
            </div>
          </div>
        )}
      </Panel>

      <Panel title="Registro" accent={accent}>
        <div className="log-list">
          {log.map((entry) => <div key={entry.id} className="log-item">{entry.text}</div>)}
        </div>
      </Panel>
    </div>
  );
}
