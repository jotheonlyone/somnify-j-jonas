import React, { useState } from 'react';
import { Factor, SleepLog } from '../types';
import { formatMinutes, getTodayDateString } from '../lib/sleepAnalysis';
import { renderHabitIcon } from '../lib/iconHelper';
import { ArrowRight, Check } from 'lucide-react';

interface MorningFlowProps {
  factors: Factor[];
  initialLog?: SleepLog | null;
  onComplete: (log: SleepLog) => void;
  onCancel?: () => void;
  isEditing?: boolean;
}

export const MorningFlow: React.FC<MorningFlowProps> = ({
  factors,
  initialLog,
  onComplete,
  onCancel,
  isEditing = false,
}) => {
  const [step, setStep] = useState<1 | 2>(1);

  // Default values: 7h 30m (450m) total, 1h 45m (105m) deep, 1h 30m (90m) rem
  const [totalMinutes, setTotalMinutes] = useState<number>(initialLog ? initialLog.totalMinutes : 450);
  const [deepMinutes, setDeepMinutes] = useState<number>(initialLog ? initialLog.deepMinutes : 105);
  const [remMinutes, setRemMinutes] = useState<number>(initialLog ? initialLog.remMinutes : 90);
  const [selectedFactorIds, setSelectedFactorIds] = useState<string[]>(
    initialLog ? initialLog.activeFactors : []
  );

  // Calculate light sleep remaining
  const lightMinutes = Math.max(0, totalMinutes - (deepMinutes + remMinutes));

  // Step 1: Validation & next
  const handleNextStep = () => {
    if (deepMinutes + remMinutes > totalMinutes) {
      setTotalMinutes(deepMinutes + remMinutes);
    }
    setStep(2);
  };

  const handleFinish = () => {
    const today = initialLog ? initialLog.date : getTodayDateString();
    const finalLog: SleepLog = {
      id: initialLog ? initialLog.id : `log_${today}`,
      date: today,
      totalMinutes,
      deepMinutes,
      remMinutes,
      lightMinutes: Math.max(0, totalMinutes - (deepMinutes + remMinutes)),
      activeFactors: selectedFactorIds,
      timestamp: initialLog ? initialLog.timestamp : Date.now(),
    };
    onComplete(finalLog);
  };

  const toggleFactor = (factorId: string) => {
    if (selectedFactorIds.includes(factorId)) {
      setSelectedFactorIds(selectedFactorIds.filter((id) => id !== factorId));
    } else {
      setSelectedFactorIds([...selectedFactorIds, factorId]);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white dark:bg-[#090d16] text-slate-900 dark:text-slate-100 flex flex-col justify-between p-6 max-w-lg mx-auto">
      {/* Header bar / step progress */}
      <div className="pt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold tracking-wider uppercase text-emerald-600 dark:text-emerald-500">
            {isEditing ? 'Schlafdaten anpassen' : 'Guten Morgen'}
          </span>
          <span className="text-slate-300 dark:text-slate-700">·</span>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Schritt {step} von 2
          </span>
        </div>

        {onCancel && (
          <button
            onClick={onCancel}
            className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium py-1 px-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            Abbrechen
          </button>
        )}
      </div>

      {/* Screen 1: DIRECTLY 3 SLIDERS AND NOTHING ELSE */}
      {step === 1 && (
        <div className="my-auto py-6 space-y-7">
          {/* Regler 1: Gesamtschlaf */}
          <div className="bg-slate-50 dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                1. Gesamtschlaf
              </span>
              <span className="text-2xl font-black font-display text-emerald-600 dark:text-emerald-400 tabular-nums">
                {formatMinutes(totalMinutes)}
              </span>
            </div>

            <input
              type="range"
              min={180} // 3h
              max={840} // 14h
              step={15} // 15m intervals
              value={totalMinutes}
              onChange={(e) => setTotalMinutes(Number(e.target.value))}
              aria-label="Gesamtschlafzeit"
              className="w-full cursor-pointer my-2"
            />

            <div className="flex justify-between text-[11px] text-slate-500 font-medium">
              <span>3h 00m</span>
              <span>8h 00m</span>
              <span>14h 00m</span>
            </div>
          </div>

          {/* Regler 2: Tiefschlaf */}
          <div className="bg-slate-50 dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
                  2. Tiefschlaf
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  {totalMinutes > 0 ? `${Math.round((deepMinutes / totalMinutes) * 100)}% des Gesamtschlafs` : ''}
                </span>
              </div>
              <span className="text-2xl font-black font-display text-emerald-600 dark:text-emerald-400 tabular-nums">
                {formatMinutes(deepMinutes)}
              </span>
            </div>

            <input
              type="range"
              min={0}
              max={270} // 4h 30m
              step={15}
              value={deepMinutes}
              onChange={(e) => setDeepMinutes(Number(e.target.value))}
              aria-label="Tiefschlafzeit"
              className="w-full cursor-pointer my-2"
            />

            <div className="flex justify-between text-[11px] text-slate-500 font-medium">
              <span>0h</span>
              <span>1h 45m</span>
              <span>4h 30m</span>
            </div>
          </div>

          {/* Regler 3: REM-Schlaf */}
          <div className="bg-slate-50 dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
                  3. REM-Schlaf
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  {totalMinutes > 0 ? `${Math.round((remMinutes / totalMinutes) * 100)}% des Gesamtschlafs` : ''}
                </span>
              </div>
              <span className="text-2xl font-black font-display text-emerald-600 dark:text-emerald-400 tabular-nums">
                {formatMinutes(remMinutes)}
              </span>
            </div>

            <input
              type="range"
              min={0}
              max={270} // 4h 30m
              step={15}
              value={remMinutes}
              onChange={(e) => setRemMinutes(Number(e.target.value))}
              aria-label="REM-Schlafzeit"
              className="w-full cursor-pointer my-2"
            />

            <div className="flex justify-between text-[11px] text-slate-500 font-medium">
              <span>0h</span>
              <span>1h 30m</span>
              <span>4h 30m</span>
            </div>
          </div>

          {/* Computed Light Sleep Indicator */}
          <div className="px-2 text-center text-xs text-slate-500 dark:text-slate-400 font-medium">
            Ergibt {formatMinutes(lightMinutes)} Leichtschlaf & Wachphasen
          </div>
        </div>
      )}

      {/* Screen 2: GEWOHNHEITEN & EINFLÜSSE */}
      {step === 2 && (
        <div className="my-auto py-6">
          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-black font-display text-slate-900 dark:text-white mb-2">
              Gewohnheiten & Einflüsse
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Wähle alle Faktoren aus, die gestern oder am Abend auf dich zutrafen.
            </p>
          </div>

          {/* Factor Selection Cards */}
          <div className="space-y-3">
            {factors.map((factor) => {
              const isSelected = selectedFactorIds.includes(factor.id);
              return (
                <button
                  key={factor.id}
                  type="button"
                  onClick={() => toggleFactor(factor.id)}
                  className={`w-full min-h-[58px] px-4 py-3.5 rounded-2xl border text-left flex items-center justify-between transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 dark:border-emerald-600 text-emerald-900 dark:text-emerald-100'
                      : 'bg-slate-50 dark:bg-[#111726] border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#161f33]'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white dark:bg-[#1a2333] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {renderHabitIcon(factor.icon, "w-5 h-5")}
                    </div>
                    <span className="font-semibold text-sm sm:text-base">
                      {factor.name}
                    </span>
                  </div>

                  <div
                    className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-[#182235]'
                    }`}
                  >
                    {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Sticky Bottom Next Button */}
      <div className="pb-4">
        {step === 1 ? (
          <button
            onClick={handleNextStep}
            className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-lg rounded-2xl transition-transform flex items-center justify-center gap-2 cursor-pointer"
          >
            Weiter
            <ArrowRight className="w-5 h-5" />
          </button>
        ) : (
          <div className="space-y-2">
            <button
              onClick={handleFinish}
              className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-lg rounded-2xl transition-transform flex items-center justify-center gap-2 cursor-pointer"
            >
              {isEditing ? 'Änderungen speichern' : 'Weiter (Schlaf erfassen)'}
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              onClick={() => setStep(1)}
              className="w-full h-10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-semibold rounded-xl cursor-pointer"
            >
              Zurück zu den Reglern
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
