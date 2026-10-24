import React from 'react';
import { Moon, BarChart2, Sliders } from 'lucide-react';

export type TabType = 'heute' | 'statistik' | 'anpassen';

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChangeTab }) => {
  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    {
      id: 'heute',
      label: 'Heute',
      icon: <Moon className="w-5 h-5" />,
    },
    {
      id: 'statistik',
      label: 'Statistik',
      icon: <BarChart2 className="w-5 h-5" />,
    },
    {
      id: 'anpassen',
      label: 'Anpassen',
      icon: <Sliders className="w-5 h-5" />,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-[#0c121e] border-t border-slate-200 dark:border-slate-800">
      <div className="max-w-lg mx-auto grid grid-cols-3 h-16 px-4">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChangeTab(tab.id)}
              className={`flex flex-col items-center justify-center min-h-[48px] py-1 cursor-pointer transition-colors ${
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
              }`}
            >
              <div
                className={`p-1 rounded-xl transition-colors ${
                  isActive ? 'bg-emerald-50 dark:bg-emerald-950/60' : ''
                }`}
              >
                {tab.icon}
              </div>
              <span className="text-[11px] tracking-tight mt-0.5">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
