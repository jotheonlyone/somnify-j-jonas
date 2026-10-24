import React from 'react';
import {
  Coffee,
  Wine,
  Activity,
  Moon,
  Sun,
  Smartphone,
  BookOpen,
  Utensils,
  Cigarette,
  Pill,
  Dumbbell,
  HeartPulse,
  Tv,
  Flame,
  Snowflake,
  Bath,
  Music,
  Bed,
  Brain,
  GlassWater,
  Footprints,
  Smile,
  Frown,
  Sparkles,
  Wind,
  Bell,
  Zap,
  BatteryCharging,
  Headphones,
  VolumeX,
  Eye,
  Apple,
  Cookie,
  Laptop,
  Heart,
  Droplet,
  Compass,
  Watch,
  X
} from 'lucide-react';

export const HABIT_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Coffee,
  Wine,
  Activity,
  Moon,
  Sun,
  Smartphone,
  BookOpen,
  Utensils,
  Cigarette,
  Pill,
  Dumbbell,
  HeartPulse,
  Tv,
  Flame,
  Snowflake,
  Bath,
  Music,
  Bed,
  Brain,
  GlassWater,
  Footprints,
  Smile,
  Frown,
  Sparkles,
  Wind,
  Bell,
  Zap,
  BatteryCharging,
  Headphones,
  VolumeX,
  Eye,
  Apple,
  Cookie,
  Laptop,
  Heart,
  Droplet,
  Compass,
  Watch,
};

export const AVAILABLE_ICON_KEYS = Object.keys(HABIT_ICON_MAP);

export function renderHabitIcon(iconName?: string, className = "w-5 h-5") {
  if (iconName && HABIT_ICON_MAP[iconName]) {
    const IconComponent = HABIT_ICON_MAP[iconName];
    return <IconComponent className={className} />;
  }
  return <Moon className={className} />;
}

interface IconPickerProps {
  currentIcon?: string;
  onSelect: (iconKey: string) => void;
  onClose: () => void;
}

export const IconPickerModal: React.FC<IconPickerProps> = ({ currentIcon, onSelect, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 max-w-sm w-full shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-bold text-slate-900 dark:text-white">
            Symbol auswählen
          </span>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-6 gap-2 max-h-64 overflow-y-auto p-1">
          {AVAILABLE_ICON_KEYS.map((key) => {
            const isSelected = currentIcon === key;
            const IconComp = HABIT_ICON_MAP[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  onSelect(key);
                  onClose();
                }}
                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 dark:bg-[#1a2333] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#253249]'
                }`}
              >
                <IconComp className="w-5 h-5" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
