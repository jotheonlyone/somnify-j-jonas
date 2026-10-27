import React, { useState, useEffect, useRef } from 'react';
import { Factor } from '../types';
import { renderHabitIcon, IconPickerModal } from '../lib/iconHelper';
import { Reorder, useDragControls } from 'motion/react';
import {
  Plus,
  Trash2,
  RotateCcw,
  Pencil,
  Check,
  X,
  GripVertical,
  AlertCircle,
} from 'lucide-react';

interface SettingsTabProps {
  factors: Factor[];
  archivedFactors?: Factor[];
  onAddFactor: (newFactor: Factor) => void;
  onRestoreFactor: (restoredFactor: Factor) => void;
  onRemoveFactor: (factorId: string) => void;
  onUpdateFactor: (updatedFactor: Factor) => void;
  onReorderFactors: (reordered: Factor[]) => void;
  onResetFactors: () => void;
}

interface HabitItemRowProps {
  factor: Factor;
  isEditingMode: boolean;
  existingFactorNames: string[];
  onOpenIconPicker: (id: string) => void;
  onUpdateFactor: (updatedFactor: Factor) => void;
  onRemove: (id: string) => void;
  onDragEnd: () => void;
}

const HabitItemRow: React.FC<HabitItemRowProps> = ({
  factor,
  isEditingMode,
  existingFactorNames,
  onOpenIconPicker,
  onUpdateFactor,
  onRemove,
  onDragEnd,
}) => {
  const controls = useDragControls();
  const [isDragging, setIsDragging] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renamedValue, setRenamedValue] = useState(factor.name);
  const [renameError, setRenameError] = useState<string | null>(null);

  const holdTimerRef = useRef<number | null>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!isEditingMode) {
      setIsRenaming(false);
      setRenameError(null);
      setRenamedValue(factor.name);
    }
  }, [isEditingMode, factor.name]);

  const clearHoldTimer = () => {
    if (holdTimerRef.current) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    startPosRef.current = null;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isEditingMode || isRenaming) return;
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input')) return;

    startPosRef.current = { x: e.clientX, y: e.clientY };
    holdTimerRef.current = window.setTimeout(() => {
      if (navigator.vibrate) {
        navigator.vibrate(35);
      }
      setIsDragging(true);
      controls.start(e);
    }, 200);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (startPosRef.current && holdTimerRef.current) {
      const dx = Math.abs(e.clientX - startPosRef.current.x);
      const dy = Math.abs(e.clientY - startPosRef.current.y);
      if (dx > 8 || dy > 8) {
        clearHoldTimer();
      }
    }
  };

  const handlePointerUp = () => {
    clearHoldTimer();
    setIsDragging(false);
  };

  useEffect(() => {
    const handleGlobalPointerUp = () => {
      clearHoldTimer();
      setIsDragging(false);
    };

    window.addEventListener('pointerup', handleGlobalPointerUp);
    window.addEventListener('pointercancel', handleGlobalPointerUp);
    return () => {
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('pointercancel', handleGlobalPointerUp);
    };
  }, []);

  const handleSaveRename = () => {
    const trimmed = renamedValue.trim();
    if (!trimmed) {
      setRenameError('Name darf nicht leer sein');
      return;
    }
    const isDuplicate = existingFactorNames.some(
      (name) =>
        name.toLowerCase() === trimmed.toLowerCase() &&
        name.toLowerCase() !== factor.name.toLowerCase()
    );
    if (isDuplicate) {
      setRenameError('Name existiert bereits');
      return;
    }
    onUpdateFactor({ ...factor, name: trimmed });
    setIsRenaming(false);
    setRenameError(null);
  };

  const handleCancelRename = () => {
    setRenamedValue(factor.name);
    setRenameError(null);
    setIsRenaming(false);
  };

  return (
    <Reorder.Item
      value={factor}
      id={factor.id}
      dragListener={false}
      dragControls={controls}
      onDragStart={() => {
        if (isEditingMode && !isRenaming) setIsDragging(true);
      }}
      onDragEnd={() => {
        setIsDragging(false);
        clearHoldTimer();
        onDragEnd();
      }}
      whileDrag={{
        scale: 1.03,
        boxShadow:
          '0 16px 36px -4px rgba(0, 0, 0, 0.28), 0 4px 12px -2px rgba(0, 0, 0, 0.16)',
        borderColor: '#10b981',
        zIndex: 50,
      }}
      transition={{ type: 'spring', damping: 25, stiffness: 320 }}
      className={`bg-slate-50 dark:bg-[#111726] border rounded-2xl px-4 py-3.5 flex items-center justify-between select-none transition-colors ${
        isDragging
          ? 'border-emerald-500 ring-2 ring-emerald-500/30 bg-white dark:bg-[#182235] shadow-xl'
          : 'border-slate-200 dark:border-slate-800'
      } ${isEditingMode && !isRenaming ? 'cursor-grab active:cursor-grabbing' : ''}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div className="flex items-center gap-3.5 flex-1 min-w-0 mr-2">
        {/* Symbol Button */}
        <button
          type="button"
          disabled={!isEditingMode}
          onClick={() => onOpenIconPicker(factor.id)}
          title={isEditingMode ? 'Klicken um Symbol zu ändern' : ''}
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            isEditingMode
              ? 'bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-400 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 cursor-pointer hover:scale-105 transition-transform'
              : 'bg-white dark:bg-[#1a2333] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
          }`}
        >
          {renderHabitIcon(factor.icon, 'w-5 h-5')}
        </button>

        {/* Name and Rename Input */}
        {isRenaming ? (
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={renamedValue}
                onChange={(e) => {
                  setRenamedValue(e.target.value);
                  setRenameError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSaveRename();
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    handleCancelRename();
                  }
                }}
                autoFocus
                className="w-full h-8 px-2.5 rounded-lg bg-white dark:bg-[#1a2333] border border-emerald-500 text-slate-900 dark:text-white text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
              <button
                type="button"
                onClick={handleSaveRename}
                title="Speichern"
                className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </button>
              <button
                type="button"
                onClick={handleCancelRename}
                title="Abbrechen"
                className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 shrink-0 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {renameError && (
              <span className="text-[10px] text-rose-600 dark:text-rose-400 font-medium block">
                {renameError}
              </span>
            )}
          </div>
        ) : (
          <div className="truncate flex-1">
            <div className="flex items-center gap-1.5">
              <span
                onClick={() => {
                  if (isEditingMode) {
                    setIsRenaming(true);
                    setRenamedValue(factor.name);
                  }
                }}
                className={`text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 truncate ${
                  isEditingMode
                    ? 'cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400'
                    : ''
                }`}
              >
                {factor.name}
              </span>
              {isEditingMode && (
                <button
                  type="button"
                  onClick={() => {
                    setIsRenaming(true);
                    setRenamedValue(factor.name);
                  }}
                  title="Gewohnheit umbenennen"
                  className="p-1 rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-[#1a2333] transition-colors shrink-0 cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {isEditingMode && (
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium block">
                Tippen zum Umbenennen
              </span>
            )}
          </div>
        )}
      </div>

      {/* Action Controls & Drag Handle (Only active in Editing Mode!) */}
      {isEditingMode && !isRenaming && (
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => onRemove(factor.id)}
            title="Gewohnheit entfernen"
            className="p-2 text-rose-600 hover:text-rose-800 dark:hover:text-rose-400 cursor-pointer rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* Dedicated Drag Handle for immediate touch/mouse grabbing */}
          <div
            onPointerDown={(e) => {
              e.preventDefault();
              if (navigator.vibrate) navigator.vibrate(30);
              setIsDragging(true);
              controls.start(e);
            }}
            style={{ touchAction: 'none' }}
            className="p-2 -mr-1.5 rounded-xl cursor-grab active:cursor-grabbing text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
            title="Gedrückt halten zum Verschieben"
          >
            <GripVertical className="w-5 h-5" />
          </div>
        </div>
      )}
    </Reorder.Item>
  );
};

export const SettingsTab: React.FC<SettingsTabProps> = ({
  factors,
  archivedFactors = [],
  onAddFactor,
  onRestoreFactor,
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

  // State for "Gewohnheit wiedererkannt" modal
  const [recognizedFactor, setRecognizedFactor] = useState<Factor | null>(null);

  // Local state for smooth real-time visual reordering
  const [orderedFactors, setOrderedFactors] = useState<Factor[]>(factors);

  useEffect(() => {
    setOrderedFactors(factors);
  }, [factors]);

  // Icon picker state
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [activeEditingFactorId, setActiveEditingFactorId] = useState<string | null>(null);

  // Reset confirmation state
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const existingNames = factors.map((f) => f.name);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newFactorName.trim();
    if (!clean) {
      setError('Bitte einen Namen für die Gewohnheit eingeben.');
      return;
    }

    // Check if active in factors already
    if (factors.some((f) => f.name.toLowerCase() === clean.toLowerCase())) {
      setError('Diese Gewohnheit existiert bereits.');
      return;
    }

    // Check if previously archived
    const matchingArchived = archivedFactors.find(
      (f) => f.name.toLowerCase() === clean.toLowerCase()
    );

    if (matchingArchived) {
      // Trigger "Gewohnheit wiedererkannt" dialog!
      setRecognizedFactor(matchingArchived);
      return;
    }

    // Normal new factor creation
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

  // Reorder handlers
  const handleReorder = (newOrder: Factor[]) => {
    setOrderedFactors(newOrder);
  };

  const handleCommitReorder = () => {
    onReorderFactors(orderedFactors);
  };

  // Icon picker handler
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
          {/* Edit/Pencil icon button to toggle reordering, renaming, symbol change & delete */}
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
              {renderHabitIcon(selectedIconForNew, 'w-6 h-6')}
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

      {/* Habits List with Drag & Drop & Renaming */}
      <Reorder.Group
        axis="y"
        values={orderedFactors}
        onReorder={handleReorder}
        className="space-y-2.5"
      >
        {orderedFactors.map((factor) => (
          <HabitItemRow
            key={factor.id}
            factor={factor}
            isEditingMode={isEditingMode}
            existingFactorNames={existingNames}
            onOpenIconPicker={handleOpenIconPickerForFactor}
            onUpdateFactor={onUpdateFactor}
            onRemove={onRemoveFactor}
            onDragEnd={handleCommitReorder}
          />
        ))}
      </Reorder.Group>

      {isEditingMode && (
        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 text-center pt-1 font-medium">
          Tipp: Halte eine Gewohnheit gedrückt oder ziehe am Griff rechts zum Verschieben. Tippe auf Namen oder Symbol zum Ändern.
        </p>
      )}

      {/* Reset to Defaults button with gentle confirmation */}
      <div className="pt-2">
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

      {/* "Gewohnheit wiedererkannt" Modal */}
      {recognizedFactor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-400 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                {renderHabitIcon(recognizedFactor.icon || selectedIconForNew, 'w-6 h-6')}
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                  Gewohnheit wiedererkannt
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400 block truncate">
                  Frühere Daten gefunden
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Du hattest <strong>„{recognizedFactor.name}“</strong> bereits früher verwendet. Möchtest du deine bisherigen Schlafdaten und Statistiken für diese Gewohnheit wiederherstellen oder als komplett neue Gewohnheit starten?
            </p>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  const clean = newFactorName.trim();
                  onRestoreFactor({
                    ...recognizedFactor,
                    name: clean || recognizedFactor.name,
                    icon: selectedIconForNew !== 'Moon' ? selectedIconForNew : (recognizedFactor.icon || 'Moon'),
                  });
                  setRecognizedFactor(null);
                  setNewFactorName('');
                  setSelectedIconForNew('Moon');
                  setIsAdding(false);
                  setError(null);
                }}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-600/20"
              >
                <RotateCcw className="w-4 h-4" />
                Alte Daten wiederherstellen
              </button>

              <button
                type="button"
                onClick={() => {
                  const clean = newFactorName.trim();
                  const newFactor: Factor = {
                    id: `custom_${Date.now()}`,
                    name: clean || recognizedFactor.name,
                    isDefault: false,
                    category: 'routine',
                    icon: selectedIconForNew,
                  };
                  onAddFactor(newFactor);
                  setRecognizedFactor(null);
                  setNewFactorName('');
                  setSelectedIconForNew('Moon');
                  setIsAdding(false);
                  setError(null);
                }}
                className="w-full py-2.5 px-4 bg-slate-100 dark:bg-[#1a2333] hover:bg-slate-200 dark:hover:bg-[#232e42] text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Als neue Gewohnheit anlegen (ohne Verlauf)
              </button>

              <button
                type="button"
                onClick={() => setRecognizedFactor(null)}
                className="w-full py-2 text-center text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-medium cursor-pointer"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}

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
