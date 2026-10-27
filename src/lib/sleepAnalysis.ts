import { SleepLog, Factor, FactorImpact, SynergyImpact, SleepBaseline } from "../types";

export const DEFAULT_FACTORS: Factor[] = [
  {
    id: "caffeine_after_14",
    name: "Koffein nach 14 Uhr",
    isDefault: true,
    category: "drink",
    icon: "Coffee",
  },
  {
    id: "alcohol_consumed",
    name: "Alkohol getrunken",
    isDefault: true,
    category: "drink",
    icon: "Wine",
  },
  {
    id: "workout_done",
    name: "Sport gemacht",
    isDefault: true,
    category: "activity",
    icon: "Activity",
  },
];

// Format minutes into clean "Xh Ym" notation
export function formatMinutes(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

// Convert hours and minutes to total minutes
export function toMinutes(hours: number, minutes: number): number {
  return hours * 60 + minutes;
}

// Format date YYYY-MM-DD into German readable format
export function formatGermanDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const days = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
  const months = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
  return `${days[dt.getDay()]}, ${d}. ${months[dt.getMonth()]}`;
}

export function getTodayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Threshold constants for statistical significance & color coding
export const MIN_IMPACT_THRESHOLD = 5; // Minimal (< 5%): gar nicht als Statistik anzeigen
export const STRONG_IMPACT_THRESHOLD = 12; // Groß (>= 12%): Rot; darunter (5% bis < 12%): Orange

// Helper: compute percentage share of a phase for a single sleep log
function getDeepPercent(log: SleepLog): number {
  return log.totalMinutes > 0 ? (log.deepMinutes / log.totalMinutes) * 100 : 0;
}

function getRemPercent(log: SleepLog): number {
  return log.totalMinutes > 0 ? (log.remMinutes / log.totalMinutes) * 100 : 0;
}

// Compute general baseline across all logs
export function calculateBaseline(logs: SleepLog[]): SleepBaseline {
  if (logs.length === 0) {
    return {
      totalLogs: 0,
      avgTotalMinutes: 450, // 7h 30m
      avgDeepMinutes: 105,  // 1h 45m
      avgRemMinutes: 90,    // 1h 30m
      avgLightMinutes: 255,
      avgDeepPercent: 23.3,
      avgRemPercent: 20.0,
    };
  }

  const sumTotal = logs.reduce((acc, l) => acc + l.totalMinutes, 0);
  const sumDeep = logs.reduce((acc, l) => acc + l.deepMinutes, 0);
  const sumRem = logs.reduce((acc, l) => acc + l.remMinutes, 0);
  const sumLight = logs.reduce((acc, l) => acc + l.lightMinutes, 0);

  const avgTotal = sumTotal / logs.length;
  const avgDeep = sumDeep / logs.length;
  const avgRem = sumRem / logs.length;
  const avgLight = sumLight / logs.length;

  // Average the per-night percentage shares so nights with longer sleep duration
  // (e.g. weekends) do not skew the baseline ratios.
  const avgDeepPct = logs.reduce((acc, l) => acc + getDeepPercent(l), 0) / logs.length;
  const avgRemPct = logs.reduce((acc, l) => acc + getRemPercent(l), 0) / logs.length;

  return {
    totalLogs: logs.length,
    avgTotalMinutes: Math.round(avgTotal),
    avgDeepMinutes: Math.round(avgDeep),
    avgRemMinutes: Math.round(avgRem),
    avgLightMinutes: Math.round(avgLight),
    avgDeepPercent: Number(avgDeepPct.toFixed(1)),
    avgRemPercent: Number(avgRemPct.toFixed(1)),
  };
}

// Calculate individual factor impacts on sleep quality based on percentage shares of total sleep
export function calculateFactorImpacts(
  logs: SleepLog[],
  factors: Factor[],
  allLogs: SleepLog[] = logs
): FactorImpact[] {
  if (logs.length < 2) return [];

  const baseline = calculateBaseline(logs);
  const impacts: FactorImpact[] = [];

  // Use unrounded baseline percentages for accurate relative delta calculation
  const baselineDeepPct = logs.reduce((acc, l) => acc + getDeepPercent(l), 0) / logs.length;
  const baselineRemPct = logs.reduce((acc, l) => acc + getRemPercent(l), 0) / logs.length;

  const sortedAllLogs = [...allLogs].sort((a, b) => b.date.localeCompare(a.date));

  for (const factor of factors) {
    const windowLogsWith = logs.filter(l => l.activeFactors.includes(factor.id));
    const allLogsWith = sortedAllLogs.filter(l => l.activeFactors.includes(factor.id));

    if (allLogsWith.length === 0) continue;

    // Mindestens 5 Nächte mit der Gewohnheit für verlässliche Analyse heranziehen:
    // Wenn im aktuellen Zeitfenster (z.B. letzte 7 oder 30 Tage) bereits >= 5 Nächte vorliegen,
    // wird dieses Fenster verwendet (auch wenn es mehr als 5 sind).
    // Wenn im aktuellen Zeitfenster weniger als 5 Nächte vorliegen, werden die jüngsten bis zu 5
    // Nächte aus dem gesamten Verlauf herangezogen (bzw. alle verfügbaren, falls < 5).
    const logsWith = windowLogsWith.length >= 5
      ? windowLogsWith
      : allLogsWith.slice(0, 5);

    if (logsWith.length === 0) continue;

    const logsWithout = logs.filter(l => !l.activeFactors.includes(factor.id));

    const avgTotalWith = logsWith.reduce((s, l) => s + l.totalMinutes, 0) / logsWith.length;
    const avgDeepWith = logsWith.reduce((s, l) => s + l.deepMinutes, 0) / logsWith.length;
    const avgRemWith = logsWith.reduce((s, l) => s + l.remMinutes, 0) / logsWith.length;

    const avgTotalWithout = logsWithout.length > 0 
      ? logsWithout.reduce((s, l) => s + l.totalMinutes, 0) / logsWithout.length 
      : baseline.avgTotalMinutes;
    const avgDeepWithout = logsWithout.length > 0 
      ? logsWithout.reduce((s, l) => s + l.deepMinutes, 0) / logsWithout.length 
      : baseline.avgDeepMinutes;
    const avgRemWithout = logsWithout.length > 0 
      ? logsWithout.reduce((s, l) => s + l.remMinutes, 0) / logsWithout.length 
      : baseline.avgRemMinutes;

    // Mean of per-night percentage shares (eliminates bias from sleeping longer/shorter on certain days)
    const deepPercentWith = logsWith.reduce((s, l) => s + getDeepPercent(l), 0) / logsWith.length;
    const remPercentWith = logsWith.reduce((s, l) => s + getRemPercent(l), 0) / logsWith.length;

    const deepPercentWithout = logsWithout.length > 0
      ? logsWithout.reduce((s, l) => s + getDeepPercent(l), 0) / logsWithout.length
      : baselineDeepPct;
    const remPercentWithout = logsWithout.length > 0
      ? logsWithout.reduce((s, l) => s + getRemPercent(l), 0) / logsWithout.length
      : baselineRemPct;

    // Relative delta compared to baseline percentage share (NOT raw minutes)
    const deepDiffPercent = baselineDeepPct > 0 
      ? ((deepPercentWith - baselineDeepPct) / baselineDeepPct) * 100 
      : 0;

    const remDiffPercent = baselineRemPct > 0 
      ? ((remPercentWith - baselineRemPct) / baselineRemPct) * 100 
      : 0;

    const totalDiffPercent = baseline.avgTotalMinutes > 0 
      ? ((avgTotalWith - baseline.avgTotalMinutes) / baseline.avgTotalMinutes) * 100 
      : 0;

    // Detection logic based strictly on proportional phase shares (Deep % and REM %):
    // When both deep and rem shares change similarly, display both; otherwise pick the dominant phase.
    let primaryMetric: 'deep' | 'rem' | 'total' | 'both' = 'deep';
    let primaryDiffPercent = deepDiffPercent;
    let secondaryDiffPercent: number | undefined = undefined;

    const absDeep = Math.abs(deepDiffPercent);
    const absRem = Math.abs(remDiffPercent);

    if (
      absDeep >= 4 &&
      absRem >= 4 &&
      Math.abs(absDeep - absRem) <= 3.5 &&
      Math.sign(deepDiffPercent) === Math.sign(remDiffPercent)
    ) {
      primaryMetric = 'both';
      primaryDiffPercent = deepDiffPercent;
      secondaryDiffPercent = remDiffPercent;
    } else if (absRem > absDeep) {
      primaryMetric = 'rem';
      primaryDiffPercent = remDiffPercent;
    } else {
      primaryMetric = 'deep';
      primaryDiffPercent = deepDiffPercent;
    }

    const absPrimary = Math.abs(Math.round(primaryDiffPercent));

    // Wenn der Unterschied nur minimal ist (< 5%), gar nicht als Statistik anzeigen
    if (absPrimary < MIN_IMPACT_THRESHOLD) {
      continue;
    }

    const isNegative = primaryDiffPercent < 0;
    // Severity: Groß (>= 12%) -> Rot ('red'), mäßig (5% - 11.9%) -> Orange ('orange'), positiv -> Grün ('green')
    const severity: 'red' | 'orange' | 'green' = isNegative
      ? (absPrimary >= STRONG_IMPACT_THRESHOLD ? 'red' : 'orange')
      : 'green';

    const formattedDeepWith = Number(deepPercentWith.toFixed(1));
    const formattedRemWith = Number(remPercentWith.toFixed(1));

    let summaryText = "";
    if (primaryMetric === 'both') {
      const absSecondary = Math.abs(Math.round(secondaryDiffPercent || primaryDiffPercent));
      summaryText = isNegative
        ? `Prozentualer Anteil am Gesamtschlaf: ${absPrimary}% weniger Tiefschlaf (${formattedDeepWith}% statt ${baseline.avgDeepPercent}%) und ${absSecondary}% weniger REM-Schlaf (${formattedRemWith}% statt ${baseline.avgRemPercent}%).`
        : `Prozentualer Anteil am Gesamtschlaf: ${absPrimary}% mehr Tiefschlaf (${formattedDeepWith}% statt ${baseline.avgDeepPercent}%) und ${absSecondary}% mehr REM-Schlaf (${formattedRemWith}% statt ${baseline.avgRemPercent}%).`;
    } else if (primaryMetric === 'deep') {
      summaryText = isNegative 
        ? `Im Schnitt ${absPrimary}% geringerer Tiefschlaf-Anteil (${formattedDeepWith}% statt ${baseline.avgDeepPercent}% der Gesamtschlafzeit).`
        : `Im Schnitt ${absPrimary}% höherer Tiefschlaf-Anteil (${formattedDeepWith}% statt ${baseline.avgDeepPercent}% der Gesamtschlafzeit).`;
    } else {
      summaryText = isNegative 
        ? `Im Schnitt ${absPrimary}% geringerer REM-Anteil (${formattedRemWith}% statt ${baseline.avgRemPercent}% der Gesamtschlafzeit).`
        : `Im Schnitt ${absPrimary}% höherer REM-Anteil (${formattedRemWith}% statt ${baseline.avgRemPercent}% der Gesamtschlafzeit).`;
    }

    impacts.push({
      factorId: factor.id,
      factorName: factor.name,
      occurrences: logsWith.length,
      totalDays: logs.length,
      avgDeepMinutesWith: Math.round(avgDeepWith),
      avgDeepMinutesWithout: Math.round(avgDeepWithout),
      avgDeepPercentWith: formattedDeepWith,
      avgDeepPercentWithout: Number(deepPercentWithout.toFixed(1)),
      deepDiffPercent: Number(deepDiffPercent.toFixed(1)),
      avgRemMinutesWith: Math.round(avgRemWith),
      avgRemMinutesWithout: Math.round(avgRemWithout),
      avgRemPercentWith: formattedRemWith,
      avgRemPercentWithout: Number(remPercentWithout.toFixed(1)),
      remDiffPercent: Number(remDiffPercent.toFixed(1)),
      avgTotalMinutesWith: Math.round(avgTotalWith),
      avgTotalMinutesWithout: Math.round(avgTotalWithout),
      totalDiffPercent: Number(totalDiffPercent.toFixed(1)),
      primaryMetric,
      primaryDiffPercent: Number(primaryDiffPercent.toFixed(1)),
      secondaryDiffPercent: secondaryDiffPercent ? Number(secondaryDiffPercent.toFixed(1)) : undefined,
      summaryText,
      isNegative,
      severity,
    });
  }

  return impacts.sort((a, b) => Math.abs(b.primaryDiffPercent) - Math.abs(a.primaryDiffPercent));
}

// Detect Synergies & Interactions between factor pairs (e.g. Koffein + Alkohol) using percentage shares
export function calculateSynergies(
  logs: SleepLog[], 
  factors: Factor[], 
  singleImpacts: FactorImpact[],
  allLogs: SleepLog[] = logs
): SynergyImpact[] {
  if (logs.length < 3) return [];

  const baseline = calculateBaseline(logs);
  const baselineDeepPct = logs.reduce((acc, l) => acc + getDeepPercent(l), 0) / logs.length;
  const baselineRemPct = logs.reduce((acc, l) => acc + getRemPercent(l), 0) / logs.length;

  const synergies: SynergyImpact[] = [];
  const singleMap = new Map(singleImpacts.map(i => [i.factorId, i]));

  const sortedAllLogs = [...allLogs].sort((a, b) => b.date.localeCompare(a.date));

  for (let i = 0; i < factors.length; i++) {
    for (let j = i + 1; j < factors.length; j++) {
      const fA = factors[i];
      const fB = factors[j];

      const windowLogsBoth = logs.filter(
        l => l.activeFactors.includes(fA.id) && l.activeFactors.includes(fB.id)
      );
      const allLogsBoth = sortedAllLogs.filter(
        l => l.activeFactors.includes(fA.id) && l.activeFactors.includes(fB.id)
      );

      if (allLogsBoth.length === 0) continue;

      const logsBoth = windowLogsBoth.length >= 5
        ? windowLogsBoth
        : (allLogsBoth.length >= 2 ? allLogsBoth.slice(0, 5) : windowLogsBoth);

      if (logsBoth.length < 2) continue;

      // Average percentage share of total sleep on nights with both habits
      const avgDeepPctBoth = logsBoth.reduce((s, l) => s + getDeepPercent(l), 0) / logsBoth.length;
      const avgRemPctBoth = logsBoth.reduce((s, l) => s + getRemPercent(l), 0) / logsBoth.length;

      const deepDiffBoth = baselineDeepPct > 0
        ? ((avgDeepPctBoth - baselineDeepPct) / baselineDeepPct) * 100
        : 0;
      const remDiffBoth = baselineRemPct > 0
        ? ((avgRemPctBoth - baselineRemPct) / baselineRemPct) * 100
        : 0;

      const impactA = singleMap.get(fA.id);
      const impactB = singleMap.get(fB.id);

      const remA = impactA ? impactA.remDiffPercent : 0;
      const remB = impactB ? impactB.remDiffPercent : 0;
      const expectedRemSum = remA + remB;
      const remSynergyDelta = remDiffBoth - expectedRemSum;

      const deepA = impactA ? impactA.deepDiffPercent : 0;
      const deepB = impactB ? impactB.deepDiffPercent : 0;
      const expectedDeepSum = deepA + deepB;
      const deepSynergyDelta = deepDiffBoth - expectedDeepSum;

      const chooseRem = Math.abs(remDiffBoth) >= Math.abs(deepDiffBoth);
      const combinedPercent = chooseRem ? remDiffBoth : deepDiffBoth;
      const expectedPercent = chooseRem ? expectedRemSum : expectedDeepSum;
      const synergyDelta = chooseRem ? remSynergyDelta : deepSynergyDelta;
      const metric: 'deep' | 'rem' = chooseRem ? 'rem' : 'deep';
      const metricLabel = metric === 'rem' ? 'REM-Anteil' : 'Tiefschlaf-Anteil';
      const formattedBothPct = Number((chooseRem ? avgRemPctBoth : avgDeepPctBoth).toFixed(1));
      const formattedBasePct = chooseRem ? baseline.avgRemPercent : baseline.avgDeepPercent;

      const absCombined = Math.abs(Math.round(combinedPercent));
      const absDelta = Math.abs(Math.round(synergyDelta));

      // Wenn die Kombination nur minimalen Unterschied aufweist (< 5%), gar nicht anzeigen
      if (absCombined < MIN_IMPACT_THRESHOLD) {
        continue;
      }

      const isNegative = combinedPercent < 0;
      const severity: 'red' | 'orange' | 'green' = isNegative
        ? (absCombined >= STRONG_IMPACT_THRESHOLD ? 'red' : 'orange')
        : 'green';

      let summaryText = "";
      if (Math.abs(synergyDelta) >= 5) {
        summaryText = isNegative
          ? `Gemeinsam sinkt dein ${metricLabel} um ${absCombined}% (${formattedBothPct}% statt ${formattedBasePct}% der Schlafzeit). Das sind ${absDelta}% mehr Verlust als durch beide Gewohnheiten einzeln zu erwarten war.`
          : `Gemeinsam steigt dein ${metricLabel} um ${absCombined}% (${formattedBothPct}% statt ${formattedBasePct}% der Schlafzeit) – ein synergistischer Erholungseffekt (+${absDelta}% Bonus).`;
      } else {
        summaryText = isNegative
          ? `In Kombination sinkt dein ${metricLabel} um durchschnittlich ${absCombined}% (${formattedBothPct}% statt ${formattedBasePct}% der Schlafzeit).`
          : `In Kombination steigt dein ${metricLabel} um durchschnittlich ${absCombined}% (${formattedBothPct}% statt ${formattedBasePct}% der Schlafzeit).`;
      }

      synergies.push({
        factorAId: fA.id,
        factorBId: fB.id,
        factorAName: fA.name,
        factorBName: fB.name,
        occurrences: logsBoth.length,
        avgDeepPercentBoth: Number(avgDeepPctBoth.toFixed(1)),
        avgRemPercentBoth: Number(avgRemPctBoth.toFixed(1)),
        combinedDeepDiffPercent: Number(deepDiffBoth.toFixed(1)),
        combinedRemDiffPercent: Number(remDiffBoth.toFixed(1)),
        expectedSumPercent: Number(expectedPercent.toFixed(1)),
        synergyDeltaPercent: Number(synergyDelta.toFixed(1)),
        metric,
        summaryText,
        isNegative,
        severity,
      });
    }
  }

  return synergies.sort((a, b) => {
    const aImpact = a.metric === 'rem' ? Math.abs(a.combinedRemDiffPercent) : Math.abs(a.combinedDeepDiffPercent);
    const bImpact = b.metric === 'rem' ? Math.abs(b.combinedRemDiffPercent) : Math.abs(b.combinedDeepDiffPercent);
    return bImpact - aImpact;
  });
}

// Generate 14 days of realistic sleep tracking data
export function generateSampleLogs(factors: Factor[]): SleepLog[] {
  const logs: SleepLog[] = [];
  const now = new Date();

  const profiles = [
    { offset: 1, factors: ["caffeine_after_14"], total: 420, deep: 80, rem: 85 },
    { offset: 2, factors: ["workout_done"], total: 480, deep: 130, rem: 95 },
    { offset: 3, factors: ["alcohol_consumed"], total: 435, deep: 95, rem: 50 },
    { offset: 4, factors: ["caffeine_after_14", "alcohol_consumed"], total: 390, deep: 75, rem: 45 },
    { offset: 5, factors: ["workout_done"], total: 465, deep: 125, rem: 100 },
    { offset: 6, factors: [], total: 450, deep: 110, rem: 90 },
    { offset: 7, factors: ["caffeine_after_14"], total: 420, deep: 85, rem: 88 },
    { offset: 8, factors: ["workout_done"], total: 495, deep: 135, rem: 105 },
    { offset: 9, factors: ["alcohol_consumed"], total: 420, deep: 90, rem: 48 },
    { offset: 10, factors: ["caffeine_after_14", "alcohol_consumed"], total: 405, deep: 70, rem: 42 },
    { offset: 11, factors: [], total: 465, deep: 115, rem: 92 },
    { offset: 12, factors: ["workout_done"], total: 480, deep: 128, rem: 98 },
    { offset: 13, factors: ["caffeine_after_14"], total: 435, deep: 82, rem: 85 },
    { offset: 14, factors: [], total: 450, deep: 112, rem: 90 },
  ];

  for (const p of profiles) {
    const d = new Date(now);
    d.setDate(d.getDate() - p.offset);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

    const lightMinutes = Math.max(0, p.total - (p.deep + p.rem));

    logs.push({
      id: `sample_${dateStr}`,
      date: dateStr,
      totalMinutes: p.total,
      deepMinutes: p.deep,
      remMinutes: p.rem,
      lightMinutes,
      activeFactors: p.factors,
      timestamp: d.getTime(),
    });
  }

  return logs.sort((a, b) => b.date.localeCompare(a.date));
}
