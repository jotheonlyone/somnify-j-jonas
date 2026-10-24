import React from 'react';
import { SleepLog, Factor } from '../types';
import { formatMinutes, formatGermanDate, getTodayDateString } from '../lib/sleepAnalysis';
import { renderHabitIcon } from '../lib/iconHelper';
import { Edit3, Moon, PlusCircle } from 'lucide-react';

interface TodayTabProps {
  todayLog: SleepLog | null;
  factors: Factor[];
  onEditToday: () => void;
  recentLogs: SleepLog[];
}

export const TodayTab: React.FC<TodayTabProps> = ({
  todayLog,
  factors,
  onEditToday,
  recentLogs,
}) => {
  const factorMap = new Map(factors.map((f) => [f.id, f]));
  const todayStr = getTodayDateString();

  if (!todayLog) {
    return (
      <div className="p-6 text-center py-16 max-w-lg mx-auto">
        <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 mx-auto flex items-center justify-center mb-4">
          <Moon className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold font-display text-slate-900 dark:text-white mb-2">
          Noch kein Schlaf für heute erfasst
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Trage deine Schlafphasen und Gewohnheiten der vergangenen Nacht mit den 3 Reglern ein.
        </p>
        <button
          onClick={onEditToday}
          className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-base rounded-2xl transition-transform flex items-center justify-center gap-2 cursor-pointer"
        >
          <PlusCircle className="w-5 h-5" />
          Heutigen Schlaf erfassen
        </button>
      </div>
    );
  }

  const deepPct = todayLog.totalMinutes > 0 
    ? Math.round((todayLog.deepMinutes / todayLog.totalMinutes) * 100) 
    : 0;
  const remPct = todayLog.totalMinutes > 0 
    ? Math.round((todayLog.remMinutes / todayLog.totalMinutes) * 100) 
    : 0;
  const lightPct = Math.max(0, 100 - deepPct - remPct);

  return (
    <div className="p-5 sm:p-6 pb-24 max-w-lg mx-auto space-y-6">
      {/* Top Banner / Today Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
            {formatGermanDate(todayLog.date)}
          </span>
          <h1 className="text-2xl sm:text-3xl font-black font-display text-slate-900 dark:text-white tracking-tight">
            Heutige Erholung
          </h1>
        </div>

        <button
          onClick={onEditToday}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-[#1a2333] hover:bg-slate-200 dark:hover:bg-[#222e44] text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl transition-colors cursor-pointer border border-slate-200 dark:border-slate-800"
        >
          <Edit3 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          Werte anpassen
        </button>
      </div>

      {/* Main Total Sleep Flat Card */}
      <div className="bg-slate-50 dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-3xl p-6">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
          Gesamtschlafdauer
        </span>
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-4xl sm:text-5xl font-black font-display text-emerald-600 dark:text-emerald-400 tracking-tight tabular-nums">
            {formatMinutes(todayLog.totalMinutes)}
          </span>
        </div>

        {/* Flat Phase Proportion Bar */}
        <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-200 dark:bg-slate-800 mb-3">
          <div
            style={{ width: `${deepPct}%` }}
            className="h-full bg-emerald-600"
            title={`Tiefschlaf: ${deepPct}%`}
          />
          <div
            style={{ width: `${remPct}%` }}
            className="h-full bg-blue-600"
            title={`REM-Schlaf: ${remPct}%`}
          />
          <div
            style={{ width: `${lightPct}%` }}
            className="h-full bg-slate-400 dark:bg-slate-600"
            title={`Leichtschlaf: ${lightPct}%`}
          />
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-medium pt-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0" />
            <span>Tiefschlaf ({deepPct}%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
            <span>REM ({remPct}%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400 dark:bg-slate-600 shrink-0" />
            <span>Leichtschlaf ({lightPct}%)</span>
          </div>
        </div>
      </div>

      {/* 2-Column Split for Deep & REM Sleep */}
      <div className="grid grid-cols-2 gap-3.5">
        {/* Tiefschlaf Card */}
        <div className="bg-slate-50 dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-3xl p-5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
            Tiefschlaf
          </span>
          <span className="text-2xl sm:text-3xl font-black font-display text-slate-900 dark:text-white tabular-nums block mb-1">
            {formatMinutes(todayLog.deepMinutes)}
          </span>
          <span className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
            {deepPct}% des Schlafs
          </span>
        </div>

        {/* REM Card */}
        <div className="bg-slate-50 dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-3xl p-5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
            REM-Schlaf
          </span>
          <span className="text-2xl sm:text-3xl font-black font-display text-slate-900 dark:text-white tabular-nums block mb-1">
            {formatMinutes(todayLog.remMinutes)}
          </span>
          <span className="text-xs text-blue-700 dark:text-blue-400 font-semibold">
            {remPct}% des Schlafs
          </span>
        </div>
      </div>

      {/* Active Habits & Influences Card */}
      <div className="bg-slate-50 dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-3xl p-6">
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200">
            Erfasste Gewohnheiten & Einflüsse
          </h2>
          <span className="text-xs text-slate-400 font-semibold">
            {todayLog.activeFactors.length} ausgewählt
          </span>
        </div>

        {todayLog.activeFactors.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {todayLog.activeFactors.map((fid) => {
              const factor = factorMap.get(fid);
              return (
                <div
                  key={fid}
                  className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#1a2333] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center gap-2"
                >
                  {renderHabitIcon(factor?.icon, "w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0")}
                  <span>{factor ? factor.name : fid}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-500 dark:text-slate-400 italic">
            Keine Gewohnheiten oder Einflüsse für heute markiert.
          </p>
        )}
      </div>

      {/* Recent History Preview */}
      {recentLogs.length > 1 && (
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 px-1">
            Vergangene Nächte
          </h2>
          <div className="space-y-2.5">
            {recentLogs
              .filter((l) => l.date !== todayLog.date)
              .slice(0, 4)
              .map((pastLog) => (
                <div
                  key={pastLog.id || pastLog.date}
                  className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-200 block">
                      {formatGermanDate(pastLog.date)}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Tief: {formatMinutes(pastLog.deepMinutes)} · REM: {formatMinutes(pastLog.remMinutes)}
                    </span>
                  </div>
                  <span className="text-sm font-bold font-display text-slate-900 dark:text-white tabular-nums">
                    {formatMinutes(pastLog.totalMinutes)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
