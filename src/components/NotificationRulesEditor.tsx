import React from 'react';
import { NotificationRule } from '../types';
import { WEEKDAY_LABELS, ALL_WEEKDAYS, createRuleId } from '../lib/notifications';
import { Clock, Plus, Trash2 } from 'lucide-react';

interface NotificationRulesEditorProps {
  rules: NotificationRule[];
  disabled: boolean;
  defaultTime: string;
  onChange: (rules: NotificationRule[]) => void;
}

/**
 * Editor for multiple weekday/time rules, e.g. "Mo–Fr 06:00" and "Sa–So 09:00".
 * A weekday can only belong to one rule at a time.
 */
export const NotificationRulesEditor: React.FC<NotificationRulesEditorProps> = ({
  rules,
  disabled,
  defaultTime,
  onChange,
}) => {
  const usedDays = new Set(rules.flatMap((r) => r.days));
  const freeDays = ALL_WEEKDAYS.filter((d) => !usedDays.has(d));

  const updateRule = (id: string, patch: Partial<NotificationRule>) => {
    onChange(rules.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const toggleDay = (rule: NotificationRule, day: number) => {
    const days = rule.days.includes(day)
      ? rule.days.filter((d) => d !== day)
      : [...rule.days, day].sort((a, b) => a - b);
    updateRule(rule.id, { days });
  };

  const addRule = () => {
    onChange([...rules, { id: createRuleId(), days: freeDays, time: defaultTime }]);
  };

  const removeRule = (id: string) => {
    onChange(rules.filter((r) => r.id !== id));
  };

  return (
    <div className="space-y-2.5 pt-1">
      {rules.map((rule) => (
        <div
          key={rule.id}
          className="p-3 rounded-xl bg-white dark:bg-[#090d16] border border-slate-200 dark:border-slate-800 space-y-2.5"
        >
          {/* Weekday chips */}
          <div className="flex gap-1">
            {WEEKDAY_LABELS.map((label, day) => {
              const active = rule.days.includes(day);
              const takenByOther = !active && usedDays.has(day);
              return (
                <button
                  key={day}
                  type="button"
                  disabled={disabled || takenByOther}
                  onClick={() => toggleDay(rule, day)}
                  title={takenByOther ? 'Bereits in einer anderen Zeile vergeben' : undefined}
                  className={`flex-1 h-8 rounded-lg text-xs font-bold transition-colors ${
                    active
                      ? 'bg-emerald-600 text-white'
                      : takenByOther
                        ? 'bg-slate-100 dark:bg-[#111726] text-slate-300 dark:text-slate-600 line-through cursor-not-allowed'
                        : 'bg-slate-100 dark:bg-[#151c2c] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1a2333] cursor-pointer'
                  } ${disabled ? 'cursor-not-allowed' : ''}`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Time + delete */}
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Uhrzeit:</span>
            <input
              type="time"
              disabled={disabled}
              value={rule.time}
              onChange={(e) => updateRule(rule.id, { time: e.target.value })}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#090d16] border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
            />
            <div className="flex-1" />
            {rules.length > 1 && (
              <button
                type="button"
                disabled={disabled}
                onClick={() => removeRule(rule.id)}
                title="Zeile entfernen"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {rule.days.length === 0 && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Keine Wochentage ausgewählt – diese Zeile löst keine Erinnerung aus.
            </p>
          )}
        </div>
      ))}

      {freeDays.length > 0 && (
        <button
          type="button"
          disabled={disabled}
          onClick={addRule}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:hover:bg-transparent"
        >
          <Plus className="w-4 h-4" />
          Weitere Zeit hinzufügen
        </button>
      )}
    </div>
  );
};
