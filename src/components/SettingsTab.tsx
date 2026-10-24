import React, { useState } from 'react';
import { Factor } from '../types';
import { renderHabitIcon, IconPickerModal } from '../lib/iconHelper';
import {
  Plus,
  Trash2,
  RotateCcw,
  Pencil,
  Check,
  ChevronUp,
  ChevronDown,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface SettingsTabProps {
  factors: Factor[];
  onAddFactor: (newFactor: Factor) => void;
  onRemoveFactor: (factorId: string) => void;
  onUpdateFactor: (updatedFactor: Factor) => void;
  onReorderFactors: (reordered: Factor[]) => void;
  onResetFactors: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  factors,
  onAddFactor,
  onRemoveFactor,
  onUpdateFactor,
  onReorderFactors,
  onResetFactors,
}) => {
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newFactorName, setNewFactorName] = useState('');
  const [selectedIconForNew, setSelectedIconForNew] = useState('Moon');
  const [error, setError] = useState<string | null>(null);

  // Icon picker state
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [activeEditingFactorId, setActiveEditingFactorId] = useState<string | null>(null);

  // Reset confirmation state
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newFactorName.trim();
    if (!clean) {
      setError('Bitte einen Namen für die Gewohnheit eingeben.');
      return;
    }
    if (factors.some((f) => f.name.toLowerCase() === clean.toLowerCase())) {
      setError('Diese Gewohnheit existiert bereits.');
      return;
    }

    const newFactor: Factor = {
      id: `custom_${Date.now()}`,
      name: clean,
      isDefault: false,
      category: 'routine',
      icon: selectedIconForNew,
    };

    onAddFactor(newFactor);
    setNewFactorName('');
    setSelectedIconForNew('Moon');
    setIsAdding(false);
    setError(null);
  };

  // Reorder helpers
  const moveUp = (index: number) => {
    if (index === 0) return;
    const reordered = [...factors];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(index - 1, 0, moved);
    onReorderFactors(reordered);
  };

  const moveDown = (index: number) => {
    if (index === factors.length - 1) return;
    const reordered = [...factors];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(index + 1, 0, moved);
    onReorderFactors(reordered);
  };

  // Handle changing an existing factor's icon
  const handleOpenIconPickerForFactor = (factorId: string) => {
    setActiveEditingFactorId(factorId);
    setIconPickerOpen(true);
  };

  const handleIconSelected = (newIconKey: string) => {
    if (activeEditingFactorId === 'NEW_FACTOR') {
      setSelectedIconForNew(newIconKey);
    } else if (activeEditingFactorId) {
      const target = factors.find((f) => f.id === activeEditingFactorId);
      if (target) {
        onUpdateFactor({ ...target, icon: newIconKey });
      }
    }
    setIconPickerOpen(false);
    setActiveEditingFactorId(null);
  };

  return (
    <div className="p-5 sm:p-6 pb-24 max-w-lg mx-auto space-y-5">
      {/* Header: Pure Title */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-black font-display text-slate-900 dark:text-white tracking-tight">
          Gewohnheiten & Einflüsse
        </h1>

        <div className="flex items-center gap-2">
          {/* Edit/Pencil icon button to toggle reorder & symbol change & delete */}
          <button
            onClick={() => setIsEditingMode(!isEditingMode)}
            title={isEditingMode ? 'Bearbeitung beenden' : 'Bearbeiten & sortieren'}
            className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
              isEditingMode
                ? 'bg-emerald-600 border-emerald-600 text-white font-bold'
                : 'bg-slate-100 dark:bg-[#1a2333] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#232e42]'
            }`}
          >
            {isEditingMode ? <Check className="w-4 h-4 stroke-[3]" /> : <Pencil className="w-4 h-4" />}
          </button>

          {!isAdding && !isEditingMode && (
            <button
              onClick={() => {
                setError(null);
                setIsAdding(true);
              }}
              className="flex items-center gap-1 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-xs rounded-xl transition-transform cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Hinzufügen
            </button>
          )}
        </div>
      </div>

      {/* Add New Factor Card */}
      {isAdding && (
        <form
          onSubmit={handleCreate}
          className="bg-slate-50 dark:bg-[#111726] border-2 border-emerald-500 rounded-3xl p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Neue Gewohnheit anlegen
            </span>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setError(null);
              }}
              className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-white font-medium cursor-pointer"
            >
              Abbrechen
            </button>
          </div>

          {error && (
            <div className="p-2.5 bg-rose-100 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-900 rounded-xl text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center gap-3">
            {/* Symbol button to pick icon */}
            <button
              type="button"
              onClick={() => {
                setActiveEditingFactorId('NEW_FACTOR');
                setIconPickerOpen(true);
              }}
              title="Symbol ändern"
              className="w-12 h-12 rounded-2xl bg-white dark:bg-[#182235] border border-slate-300 dark:border-slate-700 flex items-center justify-center text-emerald-700 dark:text-emerald-400 shrink-0 cursor-pointer hover:border-emerald-600"
            >
              {renderHabitIcon(selectedIconForNew, "w-6 h-6")}
            </button>

            <input
              type="text"
              value={newFactorName}
              onChange={(e) => setNewFactorName(e.target.value)}
              placeholder="z. B. Bildschirmzeit vor dem Schlafen"
              autoFocus
              className="flex-1 h-12 px-4 rounded-xl bg-white dark:bg-[#182235] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-600 text-sm font-medium"
            />
          </div>

          <button
            type="submit"
            className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-xs rounded-xl transition-transform cursor-pointer"
          >
            Gewohnheit speichern
          </button>
        </form>
      )}

      {/* Habits List */}
      <div className="space-y-2.5">
        {factors.map((factor, index) => {
          return (
            <div
              key={factor.id}
              className={`bg-slate-50 dark:bg-[#111726] border rounded-2xl px-4 py-3.5 flex items-center justify-between transition-colors ${
                isEditingMode
                  ? 'border-emerald-500/50 dark:border-emerald-700/50'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-center gap-3.5 flex-1 min-w-0">
                {/* Symbol Button (Clickable in edit mode to change symbol) */}
                <button
                  type="button"
                  disabled={!isEditingMode}
                  onClick={() => handleOpenIconPickerForFactor(factor.id)}
                  title={isEditingMode ? "Klicken um Symbol zu ändern" : ""}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isEditingMode
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-400 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 cursor-pointer hover:scale-105 transition-transform'
                      : 'bg-white dark:bg-[#1a2333] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {renderHabitIcon(factor.icon, "w-5 h-5")}
                </button>

                <div className="truncate">
                  <span className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 block truncate">
                    {factor.name}
                  </span>
                  {isEditingMode && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                      Tippen zum Ändern des Symbols
                    </span>
                  )}
                </div>
              </div>

              {/* Action Controls */}
              {isEditingMode ? (
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  {/* Reorder Up */}
                  <button
                    type="button"
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>

                  {/* Reorder Down */}
                  <button
                    type="button"
                    onClick={() => moveDown(index)}
                    disabled={index === factors.length - 1}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {/* Delete Button (Can remove ANY factor now!) */}
                  <button
                    type="button"
                    onClick={() => onRemoveFactor(factor.id)}
                    title="Gewohnheit entfernen"
                    className="p-1.5 text-rose-600 hover:text-rose-800 dark:hover:text-rose-400 cursor-pointer rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 ml-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Reset to Defaults button with gentle confirmation */}
      <div className="pt-4">
        {!showResetConfirm ? (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium inline-flex items-center gap-1.5 py-1 px-2 rounded-lg cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Standard-Gewohnheiten wiederherstellen
          </button>
        ) : (
          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-2xl p-4 space-y-2.5">
            <span className="text-xs font-bold text-amber-900 dark:text-amber-200 block">
              Standard-Gewohnheiten wiederherstellen?
            </span>
            <p className="text-xs text-amber-800 dark:text-amber-300">
              Deine aktuellen Gewohnheiten werden auf Koffein, Alkohol und Sport zurückgesetzt.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => {
                  onResetFactors();
                  setShowResetConfirm(false);
                }}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Wiederherstellen
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-1.5 text-slate-600 dark:text-slate-400 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Abbrechen
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Icon Picker Modal */}
      {iconPickerOpen && (
        <IconPickerModal
          currentIcon={
            activeEditingFactorId === 'NEW_FACTOR'
              ? selectedIconForNew
              : factors.find((f) => f.id === activeEditingFactorId)?.icon
          }
          onSelect={handleIconSelected}
          onClose={() => {
            setIconPickerOpen(false);
            setActiveEditingFactorId(null);
          }}
        />
      )}
    </div>
  );
};
