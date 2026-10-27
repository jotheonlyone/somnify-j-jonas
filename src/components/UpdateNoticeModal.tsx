import React, { useState } from 'react';
import { Download } from 'lucide-react';

interface UpdateNoticeModalProps {
  isOpen: boolean;
  latestVersion: string;
  currentVersion: string;
  onConfirm: (dontShowAgain: boolean) => void;
}

export const UpdateNoticeModal: React.FC<UpdateNoticeModalProps> = ({
  isOpen,
  latestVersion,
  currentVersion,
  onConfirm,
}) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
        {/* Header Title (Arrow icon completely removed) */}
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-0.5">
            Hinweis
          </span>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
            Update verfügbar
          </h3>
        </div>

        {/* Message */}
        <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>
            Es ist eine neuere Version von Somnify verfügbar:{' '}
            <span className="font-bold text-slate-900 dark:text-white">
              V{latestVersion}
            </span>
            .
          </p>
          <p className="text-slate-500 dark:text-slate-400">
            Deine aktuell installierte Version ist{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              V{currentVersion}
            </span>
            .
          </p>
        </div>

        {/* Download Button */}
        <div className="pt-1">
          <a
            href="https://go.j-jonas.com/somnify"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-600/20 text-center"
          >
            <Download className="w-4 h-4" />
            Neue Version herunterladen
          </a>
        </div>

        {/* Checkbox: Nicht erneut anzeigen */}
        <label className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none pt-1">
          <input
            type="checkbox"
            checked={dontShowAgain}
            onChange={(e) => setDontShowAgain(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-emerald-600 accent-emerald-600 focus:ring-emerald-500 cursor-pointer"
          />
          <span>Für diese Version nicht mehr anzeigen</span>
        </label>

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={() => onConfirm(dontShowAgain)}
          className="w-full py-2.5 bg-slate-100 dark:bg-[#1a2333] hover:bg-slate-200 dark:hover:bg-[#222e44] text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
        >
          Okay
        </button>
      </div>
    </div>
  );
};
