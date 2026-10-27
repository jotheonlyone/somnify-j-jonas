import React, { useState, useMemo } from 'react';
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
  Check,
} from 'lucide-react';

interface StatisticsTabProps {
  logs: SleepLog[];
  factors: Factor[];
}

export const StatisticsTab: React.FC<StatisticsTabProps> = ({
  logs,
  factors,
}) => {
  // Time range filter: '7' (Letzte Woche), '30' (Letzte 30 Tage - Default), 'all' (Gesamt)
  // Always defaults to '30' on initial load or tab switch
  const [timeRange, setTimeRange] = useState<'7' | '30' | 'all'>('30');
  const [metricFilter, setMetricFilter] = useState<'all' | 'deep' | 'rem'>('all');

  // If fewer than 7 nights have been recorded, show prominent progress onboarding view
  if (logs.length < 7) {
    const daysDone = logs.length;
    const daysRemaining = 7 - daysDone;
    const progressPercent = Math.min(100, Math.round((daysDone / 7) * 100));

    return (
      <div className="p-5 sm:p-6 pb-24 max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-black font-display text-slate-900 dark:text-white tracking-tight">
            Schlaf & Gewohnheiten
          </h1>
        </div>

        {/* Main Prominent Progress Card */}
        <div className="bg-slate-50 dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Erkenntnisse werden aufgebaut
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Noch {daysRemaining} {daysRemaining === 1 ? 'Nacht' : 'Nächte'} bis zur Freischaltung
            </p>
          </div>

          {/* Progress Bar & Counter */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-600 dark:text-slate-300">Fortschritt</span>
              <span className="text-emerald-600 dark:text-emerald-400">
                {daysDone} von 7 Nächten ({progressPercent}%)
              </span>
            </div>

            {/* The Big Progress Bar */}
            <div className="w-full h-3.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
              <div
                style={{ width: `${progressPercent}%` }}
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500 ease-out"
              />
            </div>

            {/* 7 Day Nodes Visual */}
            <div className="grid grid-cols-7 gap-1.5 pt-2">
              {[1, 2, 3, 4, 5, 6, 7].map((dayNum) => {
                const isCompleted = dayNum <= daysDone;
                const isCurrent = dayNum === daysDone + 1;
                return (
                  <div key={dayNum} className="flex justify-center">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center text-[11px] font-bold transition-all ${
                        isCompleted
                          ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-600/30'
                          : isCurrent
                          ? 'border-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20'
                          : 'bg-white dark:bg-[#182235] border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : dayNum}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Informative Explanation */}
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-white dark:bg-[#161f31] border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4">
            Somnify berechnet für dich, wie sich deine Gewohnheiten (z. B. Koffein oder Sport) prozentual auf deine Tief- und REM-Schlafphasen auswirken. Um statistisch verlässliche Muster zu erkennen und Zufallsschwankungen auszuschließen, benötigt die Analyse mindestens 7 erfasste Nächte.
          </p>

          {/* Feature Teasers */}
          <div className="space-y-2.5 pt-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block px-1">
              Was dich nach 7 Tagen erwartet:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="bg-white dark:bg-[#161f31] border border-slate-200 dark:border-slate-700/80 rounded-2xl p-3">
                <span className="text-xs font-bold text-slate-900 dark:text-white block mb-0.5">
                  Persönliche Baseline
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Dein eigener Schlaf-Durchschnitt als Referenzwert.
                </span>
              </div>

              <div className="bg-white dark:bg-[#161f31] border border-slate-200 dark:border-slate-700/80 rounded-2xl p-3">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block mb-0.5">
                  Gewohnheits-Einfluss
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Exakte prozentuale Abweichungen in Tief- & REM-Schlaf.
                </span>
              </div>

              <div className="bg-white dark:bg-[#161f31] border border-slate-200 dark:border-slate-700/80 rounded-2xl p-3">
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 block mb-0.5">
                  Synergien & Paare
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Wechselwirkungen kombinierter Gewohnheiten.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // When 7 or more nights are available, filter according to chosen time range
  const sortedLogs = useMemo(() => {
    return [...logs].sort((a, b) => b.date.localeCompare(a.date));
  }, [logs]);

  const activeLogs = useMemo(() => {
    if (timeRange === '7') {
      return sortedLogs.slice(0, 7);
    }
    if (timeRange === '30') {
      return sortedLogs.slice(0, 30);
    }
    return sortedLogs;
  }, [sortedLogs, timeRange]);

  const baseline = calculateBaseline(activeLogs);
  const factorImpacts = calculateFactorImpacts(activeLogs, factors, logs);
  const synergies = calculateSynergies(activeLogs, factors, factorImpacts, logs);

  // Filter impacts if user selected a metric tab (all, deep, rem)
  const displayedImpacts = factorImpacts.filter((impact) => {
    if (metricFilter === 'all') return true;
    if (impact.primaryMetric === 'both') return true;
    return impact.primaryMetric === metricFilter;
  });

  return (
    <div className="p-5 sm:p-6 pb-24 max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black font-display text-slate-900 dark:text-white tracking-tight">
          Schlaf & Gewohnheiten
        </h1>
      </div>

      {/* Time Range Selector: Letzte Woche | Letzte 30 Tage (Standard) | Gesamt */}
      <div className="flex items-center p-1 bg-slate-100 dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl">
        <button
          type="button"
          onClick={() => setTimeRange('7')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            timeRange === '7'
              ? 'bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Letzte Woche
        </button>

        <button
          type="button"
          onClick={() => setTimeRange('30')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            timeRange === '30'
              ? 'bg-white dark:bg-[#1e293b] text-emerald-700 dark:text-emerald-400 shadow-xs'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Letzte 30 Tage
        </button>

        <button
          type="button"
          onClick={() => setTimeRange('all')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            timeRange === 'all'
              ? 'bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Gesamt
        </button>
      </div>

      {/* Baseline Overview Card */}
      <div className="bg-slate-50 dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-3xl p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Deine persönliche Baseline ({activeLogs.length} {activeLogs.length === 1 ? 'Nacht' : 'Nächte'})
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
              Keine signifikanten Einflüsse festgestellt
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
              Gewohnheiten mit nur minimalen Unterschieden (unter 5%) werden ausgeblendet. Sobald ein spürbarer Einfluss messbar ist, erscheint die Auswertung hier.
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

            const factorPct = isDeepPrimary
              ? impact.avgDeepPercentWith
              : impact.avgRemPercentWith;

            const baselinePct = isDeepPrimary
              ? baseline.avgDeepPercent
              : baseline.avgRemPercent;

            const phaseLabel = isDeepPrimary ? 'Tiefschlaf-Anteil' : 'REM-Anteil';

            const maxVal = Math.max(factorPct, baselinePct, 1);
            const factorBarWidth = Math.min(100, Math.round((factorPct / maxVal) * 100));
            const baselineBarWidth = Math.min(100, Math.round((baselinePct / maxVal) * 100));

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
                      impact.severity === 'red'
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-300 dark:border-rose-900'
                        : impact.severity === 'orange'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-900'
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

                {/* Custom Flat Comparative Diagram (Percentage-based) */}
                <div className="bg-white dark:bg-[#161f31] border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 space-y-3">
                  {/* Row 1: Baseline */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                      <span>Baseline-Durchschnitt ({phaseLabel})</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200 tabular-nums">
                        {baselinePct}%
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
                          impact.severity === 'red'
                            ? 'text-rose-700 dark:text-rose-400'
                            : impact.severity === 'orange'
                            ? 'text-amber-700 dark:text-amber-400'
                            : 'text-emerald-700 dark:text-emerald-400'
                        }`}
                      >
                        {factorPct}%
                      </span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${factorBarWidth}%` }}
                        className={`h-full rounded-full ${
                          impact.severity === 'red'
                            ? 'bg-rose-600'
                            : impact.severity === 'orange'
                            ? 'bg-amber-500'
                            : 'bg-emerald-600'
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
            const phaseLabel = syn.metric === 'rem' ? 'REM-Anteil' : 'Tiefschlaf-Anteil';
            const combinedPct = syn.metric === 'rem' ? syn.combinedRemDiffPercent : syn.combinedDeepDiffPercent;
            const bothSharePct = syn.metric === 'rem' ? syn.avgRemPercentBoth : syn.avgDeepPercentBoth;
            const baseSharePct = syn.metric === 'rem' ? baseline.avgRemPercent : baseline.avgDeepPercent;

            const maxVal = Math.max(bothSharePct, baseSharePct, 1);
            const bothBarWidth = Math.min(100, Math.round((bothSharePct / maxVal) * 100));
            const baseBarWidth = Math.min(100, Math.round((baseSharePct / maxVal) * 100));

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
                      syn.severity === 'red'
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-300 dark:border-rose-900'
                        : syn.severity === 'orange'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-900'
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

                {/* Comparative Bar (Percentage Share) */}
                <div className="bg-white dark:bg-[#161f31] border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 space-y-3 mb-3">
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                      <span>Baseline-Durchschnitt ({phaseLabel})</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200 tabular-nums">
                        {baseSharePct}%
                      </span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${baseBarWidth}%` }}
                        className="h-full bg-slate-400 dark:bg-slate-500 rounded-full"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-900 dark:text-white font-bold">
                        Mit {syn.factorAName} + {syn.factorBName}
                      </span>
                      <span
                        className={`font-black tabular-nums ${
                          syn.severity === 'red'
                            ? 'text-rose-700 dark:text-rose-400'
                            : syn.severity === 'orange'
                            ? 'text-amber-700 dark:text-amber-400'
                            : 'text-emerald-700 dark:text-emerald-400'
                        }`}
                      >
                        {bothSharePct}%
                      </span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${bothBarWidth}%` }}
                        className={`h-full rounded-full ${
                          syn.severity === 'red'
                            ? 'bg-rose-600'
                            : syn.severity === 'orange'
                            ? 'bg-amber-500'
                            : 'bg-emerald-600'
                        }`}
                      />
                    </div>
                  </div>
                </div>

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
