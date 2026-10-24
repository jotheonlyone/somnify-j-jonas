import React, { useState } from 'react';
import { SleepLog, Factor } from '../types';
import {
  calculateBaseline,
  calculateFactorImpacts,
  calculateSynergies,
  formatMinutes,
} from '../lib/sleepAnalysis';
import {
  TrendingDown,
  TrendingUp,
  Layers,
  Info,
} from 'lucide-react';

interface StatisticsTabProps {
  logs: SleepLog[];
  factors: Factor[];
}

export const StatisticsTab: React.FC<StatisticsTabProps> = ({
  logs,
  factors,
}) => {
  const [metricFilter, setMetricFilter] = useState<'all' | 'deep' | 'rem'>('all');

  const baseline = calculateBaseline(logs);
  const factorImpacts = calculateFactorImpacts(logs, factors);
  const synergies = calculateSynergies(logs, factors, factorImpacts);

  // Filter impacts if user selected a tab
  const displayedImpacts = factorImpacts.filter((impact) => {
    if (metricFilter === 'all') return true;
    if (impact.primaryMetric === 'both') return true;
    return impact.primaryMetric === metricFilter;
  });

  return (
    <div className="p-5 sm:p-6 pb-24 max-w-lg mx-auto space-y-6">
      {/* Header: Exactly "Schlaf & Gewohnheiten" with nothing above or below */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black font-display text-slate-900 dark:text-white tracking-tight">
          Schlaf & Gewohnheiten
        </h1>
      </div>

      {/* Baseline Overview Card */}
      <div className="bg-slate-50 dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-3xl p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Deine persönliche Baseline ({logs.length} {logs.length === 1 ? 'Nacht' : 'Nächte'})
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-white dark:bg-[#182235] border border-slate-200 dark:border-slate-700/80 rounded-2xl p-3">
            <span className="text-[11px] font-semibold text-slate-500 block mb-0.5">
              Gesamt
            </span>
            <span className="text-base sm:text-lg font-black font-display text-slate-900 dark:text-white tabular-nums">
              {formatMinutes(baseline.avgTotalMinutes)}
            </span>
          </div>

          <div className="bg-white dark:bg-[#182235] border border-slate-200 dark:border-slate-700/80 rounded-2xl p-3">
            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 block mb-0.5">
              Tiefschlaf
            </span>
            <span className="text-base sm:text-lg font-black font-display text-slate-900 dark:text-white tabular-nums">
              {formatMinutes(baseline.avgDeepMinutes)}
            </span>
            <span className="text-[10px] text-slate-500 font-medium block">
              {baseline.avgDeepPercent}%
            </span>
          </div>

          <div className="bg-white dark:bg-[#182235] border border-slate-200 dark:border-slate-700/80 rounded-2xl p-3">
            <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-400 block mb-0.5">
              REM-Schlaf
            </span>
            <span className="text-base sm:text-lg font-black font-display text-slate-900 dark:text-white tabular-nums">
              {formatMinutes(baseline.avgRemMinutes)}
            </span>
            <span className="text-[10px] text-slate-500 font-medium block">
              {baseline.avgRemPercent}%
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs for Correlation Focus */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-xl">
        <button
          onClick={() => setMetricFilter('all')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
            metricFilter === 'all'
              ? 'bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Alle Gewohnheiten
        </button>
        <button
          onClick={() => setMetricFilter('deep')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
            metricFilter === 'deep'
              ? 'bg-white dark:bg-[#1e293b] text-emerald-700 dark:text-emerald-400'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Tiefschlaf-Fokus
        </button>
        <button
          onClick={() => setMetricFilter('rem')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
            metricFilter === 'rem'
              ? 'bg-white dark:bg-[#1e293b] text-blue-700 dark:text-blue-400'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          REM-Fokus
        </button>
      </div>

      {/* Individual Factor Correlation Charts */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Einfluss nach Relevanz sortiert ({displayedImpacts.length})
          </h2>
        </div>

        {displayedImpacts.length === 0 ? (
          <div className="bg-slate-50 dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center space-y-3">
            <Info className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Noch nicht genügend Datensätze vorhanden
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
              Trage an mehreren Tagen Schlafdaten und Gewohnheiten ein, um präzise Korrelationsdiagramme zu erhalten.
            </p>
          </div>
        ) : (
          displayedImpacts.map((impact) => {
            const isNegative = impact.isNegative;
            const absPrimary = Math.abs(impact.primaryDiffPercent);
            const isBoth = impact.primaryMetric === 'both';
            const isDeepPrimary = impact.primaryMetric === 'deep';

            // Badge text: either single phase or both if equal impact!
            let badgeText = '';
            if (isBoth) {
              const absSecondary = Math.abs(impact.secondaryDiffPercent || impact.primaryDiffPercent);
              badgeText = `${isNegative ? '-' : '+'}${absPrimary}% Tief & ${absSecondary}% REM`;
            } else if (isDeepPrimary) {
              badgeText = `${isNegative ? '-' : '+'}${absPrimary}% Tiefschlaf`;
            } else if (impact.primaryMetric === 'rem') {
              badgeText = `${isNegative ? '-' : '+'}${absPrimary}% REM-Schlaf`;
            } else {
              badgeText = `${isNegative ? '-' : '+'}${absPrimary}% Gesamtschlaf`;
            }

            const factorAvg = isDeepPrimary
              ? impact.avgDeepMinutesWith
              : impact.primaryMetric === 'rem'
              ? impact.avgRemMinutesWith
              : impact.avgTotalMinutesWith;

            const baselineAvg = isDeepPrimary
              ? baseline.avgDeepMinutes
              : impact.primaryMetric === 'rem'
              ? baseline.avgRemMinutes
              : baseline.avgTotalMinutes;

            const maxVal = Math.max(factorAvg, baselineAvg, 1);
            const factorBarWidth = Math.min(100, Math.round((factorAvg / maxVal) * 100));
            const baselineBarWidth = Math.min(100, Math.round((baselineAvg / maxVal) * 100));

            return (
              <div
                key={impact.factorId}
                className="bg-slate-50 dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6"
              >
                {/* Factor Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                      {impact.factorName}
                    </h3>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      An {impact.occurrences} von {impact.totalDays} Nächten erfasst
                    </span>
                  </div>

                  {/* Impact Badge */}
                  <div
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 shrink-0 ${
                      isNegative
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-300 dark:border-rose-900'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-900'
                    }`}
                  >
                    {isNegative ? (
                      <TrendingDown className="w-3.5 h-3.5" />
                    ) : (
                      <TrendingUp className="w-3.5 h-3.5" />
                    )}
                    <span>{badgeText}</span>
                  </div>
                </div>

                {/* Explanation sentence */}
                <p className="text-xs text-slate-600 dark:text-slate-300 mb-4">
                  {impact.summaryText}
                </p>

                {/* Custom Flat Comparative Diagram */}
                <div className="bg-white dark:bg-[#161f31] border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 space-y-3">
                  {/* Row 1: Baseline */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                      <span>Baseline-Durchschnitt</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200 tabular-nums">
                        {formatMinutes(baselineAvg)}
                      </span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${baselineBarWidth}%` }}
                        className="h-full bg-slate-400 dark:bg-slate-500 rounded-full"
                      />
                    </div>
                  </div>

                  {/* Row 2: Mit der Gewohnheit */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-900 dark:text-white font-bold">
                        Mit {impact.factorName}
                      </span>
                      <span
                        className={`font-black tabular-nums ${
                          isNegative
                            ? 'text-rose-700 dark:text-rose-400'
                            : 'text-emerald-700 dark:text-emerald-400'
                        }`}
                      >
                        {formatMinutes(factorAvg)}
                      </span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${factorBarWidth}%` }}
                        className={`h-full rounded-full ${
                          isNegative ? 'bg-rose-600' : 'bg-emerald-600'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Secondary Phase Metric Pills */}
                <div className="grid grid-cols-2 gap-2 mt-3 pt-2 text-[11px] text-slate-500 font-medium">
                  <div>
                    Tiefschlaf-Quote:{' '}
                    <span className="text-slate-800 dark:text-slate-200 font-bold">
                      {impact.avgDeepPercentWith}%
                    </span>{' '}
                    (vs. {baseline.avgDeepPercent}%)
                  </div>
                  <div>
                    REM-Quote:{' '}
                    <span className="text-slate-800 dark:text-slate-200 font-bold">
                      {impact.avgRemPercentWith}%
                    </span>{' '}
                    (vs. {baseline.avgRemPercent}%)
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Combinations & Synergies Section */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-2 px-1">
          <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Erkannte Kombinationen & Synergien ({synergies.length})
          </h2>
        </div>

        {synergies.length === 0 ? (
          <div className="bg-slate-50 dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Sobald mehrere Gewohnheiten gleichzeitig an verschiedenen Tagen erfasst wurden, deckt Somnify hier synergistische Wechselwirkungen auf.
            </p>
          </div>
        ) : (
          synergies.map((syn, idx) => {
            const isNegative = syn.isNegative;
            const targetLabel = syn.metric === 'rem' ? 'REM-Schlaf' : 'Tiefschlaf';
            const combinedPct = syn.metric === 'rem' ? syn.combinedRemDiffPercent : syn.combinedDeepDiffPercent;

            return (
              <div
                key={`${syn.factorAId}_${syn.factorBId}_${idx}`}
                className="bg-slate-50 dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6"
              >
                {/* Combination Header */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                      Kombinierte Gewohnheiten
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {syn.factorAName} + {syn.factorBName}
                    </h3>
                  </div>

                  <span
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 shrink-0 ${
                      isNegative
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-300 dark:border-rose-900'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-900'
                    }`}
                  >
                    {isNegative ? '-' : '+'}
                    {Math.abs(Math.round(combinedPct))}% {targetLabel}
                  </span>
                </div>

                {/* Synthesis Statement */}
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                  {syn.summaryText}
                </p>

                {/* Subtext info */}
                <div className="bg-white dark:bg-[#161f31] border border-slate-200 dark:border-slate-700/80 rounded-2xl p-3 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span>Gemeinsam an {syn.occurrences} Nächten aufgetreten</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Erwartung: {syn.expectedSumPercent > 0 ? '+' : ''}
                    {Math.round(syn.expectedSumPercent)}%
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
