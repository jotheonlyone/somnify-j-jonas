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

  return {
    totalLogs: logs.length,
    avgTotalMinutes: Math.round(avgTotal),
    avgDeepMinutes: Math.round(avgDeep),
    avgRemMinutes: Math.round(avgRem),
    avgLightMinutes: Math.round(avgLight),
    avgDeepPercent: avgTotal > 0 ? Number(((avgDeep / avgTotal) * 100).toFixed(1)) : 0,
    avgRemPercent: avgTotal > 0 ? Number(((avgRem / avgTotal) * 100).toFixed(1)) : 0,
  };
}

// Calculate individual factor impacts on sleep quality
export function calculateFactorImpacts(logs: SleepLog[], factors: Factor[]): FactorImpact[] {
  if (logs.length < 2) return [];

  const baseline = calculateBaseline(logs);
  const impacts: FactorImpact[] = [];

  for (const factor of factors) {
    const logsWith = logs.filter(l => l.activeFactors.includes(factor.id));
    const logsWithout = logs.filter(l => !l.activeFactors.includes(factor.id));

    if (logsWith.length === 0) continue;

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

    const deepPercentWith = (avgDeepWith / avgTotalWith) * 100;
    const deepPercentWithout = (avgDeepWithout / avgTotalWithout) * 100;
    const remPercentWith = (avgRemWith / avgTotalWith) * 100;
    const remPercentWithout = (avgRemWithout / avgTotalWithout) * 100;

    // Relative delta compared to baseline
    const deepDiffPercent = baseline.avgDeepMinutes > 0 
      ? ((avgDeepWith - baseline.avgDeepMinutes) / baseline.avgDeepMinutes) * 100 
      : 0;

    const remDiffPercent = baseline.avgRemMinutes > 0 
      ? ((avgRemWith - baseline.avgRemMinutes) / baseline.avgRemMinutes) * 100 
      : 0;

    const totalDiffPercent = baseline.avgTotalMinutes > 0 
      ? ((avgTotalWith - baseline.avgTotalMinutes) / baseline.avgTotalMinutes) * 100 
      : 0;

    // Detection logic:
    // When both deep and rem change equally (within 3% tolerance and same direction, or both significant):
    // Display both! Otherwise pick the dominant one.
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

    if (Math.abs(totalDiffPercent) > Math.max(absDeep, absRem) * 1.6) {
      primaryMetric = 'total';
      primaryDiffPercent = totalDiffPercent;
    }

    const isNegative = primaryDiffPercent < 0;
    const absPrimary = Math.abs(Math.round(primaryDiffPercent));

    let summaryText = "";
    if (primaryMetric === 'both') {
      const absSecondary = Math.abs(Math.round(secondaryDiffPercent || primaryDiffPercent));
      summaryText = isNegative
        ? `Im Schnitt ${absPrimary}% weniger Tiefschlaf und ${absSecondary}% weniger REM-Schlaf.`
        : `Im Schnitt ${absPrimary}% mehr Tiefschlaf und ${absSecondary}% mehr REM-Schlaf.`;
    } else if (primaryMetric === 'deep') {
      summaryText = isNegative 
        ? `Im Schnitt ${absPrimary}% weniger Tiefschlaf (${formatMinutes(avgDeepWith)} statt ${formatMinutes(baseline.avgDeepMinutes)}).`
        : `Im Schnitt ${absPrimary}% mehr Tiefschlaf (${formatMinutes(avgDeepWith)} statt ${formatMinutes(baseline.avgDeepMinutes)}).`;
    } else if (primaryMetric === 'rem') {
      summaryText = isNegative 
        ? `Im Schnitt ${absPrimary}% weniger REM-Schlaf (${formatMinutes(avgRemWith)} statt ${formatMinutes(baseline.avgRemMinutes)}).`
        : `Im Schnitt ${absPrimary}% mehr REM-Schlaf (${formatMinutes(avgRemWith)} statt ${formatMinutes(baseline.avgRemMinutes)}).`;
    } else {
      summaryText = isNegative 
        ? `Im Schnitt ${absPrimary}% weniger Gesamtschlafzeit.`
        : `Im Schnitt ${absPrimary}% mehr Gesamtschlafzeit.`;
    }

    impacts.push({
      factorId: factor.id,
      factorName: factor.name,
      occurrences: logsWith.length,
      totalDays: logs.length,
      avgDeepMinutesWith: Math.round(avgDeepWith),
      avgDeepMinutesWithout: Math.round(avgDeepWithout),
      avgDeepPercentWith: Number(deepPercentWith.toFixed(1)),
      avgDeepPercentWithout: Number(deepPercentWithout.toFixed(1)),
      deepDiffPercent: Number(deepDiffPercent.toFixed(1)),
      avgRemMinutesWith: Math.round(avgRemWith),
      avgRemMinutesWithout: Math.round(avgRemWithout),
      avgRemPercentWith: Number(remPercentWith.toFixed(1)),
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
    });
  }

  return impacts.sort((a, b) => Math.abs(b.primaryDiffPercent) - Math.abs(a.primaryDiffPercent));
}

// Detect Synergies & Interactions between factor pairs (e.g. Koffein + Alkohol)
export function calculateSynergies(
  logs: SleepLog[], 
  factors: Factor[], 
  singleImpacts: FactorImpact[]
): SynergyImpact[] {
  if (logs.length < 3) return [];

  const baseline = calculateBaseline(logs);
  const synergies: SynergyImpact[] = [];
  const singleMap = new Map(singleImpacts.map(i => [i.factorId, i]));

  for (let i = 0; i < factors.length; i++) {
    for (let j = i + 1; j < factors.length; j++) {
      const fA = factors[i];
      const fB = factors[j];

      const logsBoth = logs.filter(
        l => l.activeFactors.includes(fA.id) && l.activeFactors.includes(fB.id)
      );

      if (logsBoth.length < 2) continue;

      const avgDeepBoth = logsBoth.reduce((s, l) => s + l.deepMinutes, 0) / logsBoth.length;
      const avgRemBoth = logsBoth.reduce((s, l) => s + l.remMinutes, 0) / logsBoth.length;

      const deepDiffBoth = ((avgDeepBoth - baseline.avgDeepMinutes) / baseline.avgDeepMinutes) * 100;
      const remDiffBoth = ((avgRemBoth - baseline.avgRemMinutes) / baseline.avgRemMinutes) * 100;

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
      const metricLabel = metric === 'rem' ? 'REM-Schlaf' : 'Tiefschlaf';

      const isNegative = combinedPercent < 0;
      const absCombined = Math.abs(Math.round(combinedPercent));
      const absDelta = Math.abs(Math.round(synergyDelta));

      let summaryText = "";
      if (Math.abs(synergyDelta) >= 5) {
        summaryText = isNegative
          ? `Gemeinsam sinkt dein ${metricLabel} um ${absCombined}%. Das sind ${absDelta}% mehr Verlust als durch beide Gewohnheiten einzeln zu erwarten war.`
          : `Gemeinsam steigt dein ${metricLabel} um ${absCombined}% – ein synergistischer Erholungseffekt (+${absDelta}% Bonus).`;
      } else {
        summaryText = `In Kombination sinkt dein ${metricLabel} um durchschnittlich ${absCombined}%.`;
      }

      synergies.push({
        factorAId: fA.id,
        factorBId: fB.id,
        factorAName: fA.name,
        factorBName: fB.name,
        occurrences: logsBoth.length,
        combinedDeepDiffPercent: Number(deepDiffBoth.toFixed(1)),
        combinedRemDiffPercent: Number(remDiffBoth.toFixed(1)),
        expectedSumPercent: Number(expectedPercent.toFixed(1)),
        synergyDeltaPercent: Number(synergyDelta.toFixed(1)),
        metric,
        summaryText,
        isNegative,
      });
    }
  }

  return synergies.sort((a, b) => Math.abs(b.combinedDeepDiffPercent) - Math.abs(a.combinedDeepDiffPercent));
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
