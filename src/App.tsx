import React, { useState, useEffect } from 'react';
import { UserProfile, SleepLog, Factor } from './types';
import { AuthScreen } from './components/AuthScreen';
import { MorningFlow } from './components/MorningFlow';
import { TodayTab } from './components/TodayTab';
import { StatisticsTab } from './components/StatisticsTab';
import { SettingsTab } from './components/SettingsTab';
import { SettingsModal, AppTheme, SettingsTabType } from './components/SettingsModal';
import { BottomNav, TabType } from './components/BottomNav';
import {
  auth,
  fetchSleepLogs,
  saveSleepLog,
  fetchUserFactors,
  saveUserFactors,
  signOutUser,
} from './lib/firebase';
import {
  DEFAULT_FACTORS,
  getTodayDateString,
  generateSampleLogs,
} from './lib/sleepAnalysis';
import { onAuthStateChanged } from 'firebase/auth';
import { Settings, Sliders, Bell, User, ChevronRight } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [factors, setFactors] = useState<Factor[]>(DEFAULT_FACTORS);
  const [logs, setLogs] = useState<SleepLog[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('heute');
  const [isEnteringMorningFlow, setIsEnteringMorningFlow] = useState<boolean>(false);
  const [isEditingExisting, setIsEditingExisting] = useState<boolean>(false);

  // Settings dropdown & fullscreen modal state
  const [isSettingsDropdownOpen, setIsSettingsDropdownOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [selectedSettingsTab, setSelectedSettingsTab] = useState<SettingsTabType>('allgemein');

  // Theme State: 'light' | 'dark' | 'system'
  const [currentTheme, setCurrentTheme] = useState<AppTheme>(() => {
    const saved = localStorage.getItem('somnify_theme') as AppTheme;
    return saved || 'system';
  });

  // Apply Theme effect cleanly to document root
  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = () => {
      const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const shouldBeDark = currentTheme === 'dark' || (currentTheme === 'system' && isSystemDark);

      if (shouldBeDark) {
        root.classList.add('dark');
        root.style.colorScheme = 'dark';
      } else {
        root.classList.remove('dark');
        root.style.colorScheme = 'light';
      }
    };

    applyTheme();
    localStorage.setItem('somnify_theme', currentTheme);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (currentTheme === 'system') applyTheme();
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [currentTheme]);

  // Monitor Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const localProf = localStorage.getItem(`somnify_profile_${fbUser.uid}`);
        let username = fbUser.displayName || (fbUser.email ? fbUser.email.split('@')[0] : 'schlaffreund');
        if (localProf) {
          try {
            username = JSON.parse(localProf).username || username;
          } catch (e) {}
        }
        setUser({
          uid: fbUser.uid,
          email: fbUser.email,
          username,
        });
      } else {
        const guestSession = localStorage.getItem('somnify_guest_session');
        if (guestSession) {
          try {
            setUser(JSON.parse(guestSession));
          } catch (e) {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      }
      setAuthChecked(true);
    });

    return () => unsubscribe();
  }, []);

  // Fetch factors and sleep logs whenever user changes
  useEffect(() => {
    if (!user) {
      setLogs([]);
      setFactors(DEFAULT_FACTORS);
      setIsEnteringMorningFlow(false);
      return;
    }

    const loadUserData = async () => {
      const userFactors = await fetchUserFactors(user.uid, DEFAULT_FACTORS);
      setFactors(userFactors);

      let userLogs = await fetchSleepLogs(user.uid);

      // In demo mode: pre-seed 14 days sample data automatically
      if (user.uid.startsWith('demo_') && userLogs.length === 0) {
        userLogs = generateSampleLogs(userFactors);
        for (const sLog of userLogs) {
          await saveSleepLog(user.uid, sLog);
        }
      }
      setLogs(userLogs);

      // Morning time window condition (02:00 to 11:00)
      const today = getTodayDateString();
      const hasTodayLog = userLogs.some((l) => l.date === today);
      const currentHour = new Date().getHours();
      const isMorningWindow = currentHour >= 2 && currentHour < 11;

      if (isMorningWindow && !hasTodayLog) {
        setIsEnteringMorningFlow(true);
        setIsEditingExisting(false);
      } else {
        setIsEnteringMorningFlow(false);
      }
    };

    loadUserData();
  }, [user]);

  // Auth success handler
  const handleAuthSuccess = async (profile: UserProfile, isDemo = false) => {
    setUser(profile);
    if (isDemo || profile.uid.startsWith('demo_')) {
      localStorage.setItem('somnify_guest_session', JSON.stringify(profile));
      const sampleLogs = generateSampleLogs(DEFAULT_FACTORS);
      for (const sLog of sampleLogs) {
        await saveSleepLog(profile.uid, sLog);
      }
      setLogs(sampleLogs);
    }
  };

  // Sign out handler
  const handleSignOut = async () => {
    localStorage.removeItem('somnify_guest_session');
    await signOutUser();
    setUser(null);
    setActiveTab('heute');
    setIsEnteringMorningFlow(false);
    setIsSettingsDropdownOpen(false);
    setIsSettingsModalOpen(false);
  };

  // Save morning flow log
  const handleMorningFlowComplete = async (log: SleepLog) => {
    if (!user) return;
    await saveSleepLog(user.uid, log);

    setLogs((prev) => {
      const filtered = prev.filter((l) => l.date !== log.date);
      return [log, ...filtered].sort((a, b) => b.date.localeCompare(a.date));
    });

    setIsEnteringMorningFlow(false);
    setIsEditingExisting(false);
    setActiveTab('heute');
  };

  // Factor management
  const handleAddFactor = async (newFactor: Factor) => {
    if (!user) return;
    const updated = [...factors, newFactor];
    setFactors(updated);
    await saveUserFactors(user.uid, updated);
  };

  const handleRemoveFactor = async (factorId: string) => {
    if (!user) return;
    const updated = factors.filter((f) => f.id !== factorId);
    setFactors(updated);
    await saveUserFactors(user.uid, updated);
  };

  const handleUpdateFactor = async (updatedFactor: Factor) => {
    if (!user) return;
    const updated = factors.map((f) => (f.id === updatedFactor.id ? updatedFactor : f));
    setFactors(updated);
    await saveUserFactors(user.uid, updated);
  };

  const handleReorderFactors = async (reordered: Factor[]) => {
    if (!user) return;
    setFactors(reordered);
    await saveUserFactors(user.uid, reordered);
  };

  const handleResetFactors = async () => {
    if (!user) return;
    setFactors(DEFAULT_FACTORS);
    await saveUserFactors(user.uid, DEFAULT_FACTORS);
  };

  // Open full-screen settings from dropdown selection
  const handleOpenSettingsFromDropdown = (tab: SettingsTabType) => {
    setIsSettingsDropdownOpen(false);
    setSelectedSettingsTab(tab);
    setIsSettingsModalOpen(true);
  };

  // Get today's log if present
  const todayStr = getTodayDateString();
  const todayLog = logs.find((l) => l.date === todayStr) || null;

  // 1. Initial Auth Loading State
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#090d16] flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold font-display uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            Somnify lädt...
          </span>
        </div>
      </div>
    );
  }

  // 2. Welcome & Auth Screen if not logged in
  if (!user) {
    return <AuthScreen onSuccess={handleAuthSuccess} />;
  }

  // 3. Morning Entry Flow
  if (isEnteringMorningFlow) {
    return (
      <MorningFlow
        factors={factors}
        initialLog={todayLog}
        isEditing={isEditingExisting}
        onComplete={handleMorningFlowComplete}
        onCancel={
          todayLog || logs.length > 0
            ? () => setIsEnteringMorningFlow(false)
            : undefined
        }
      />
    );
  }

  // 4. Main App Layout with Bottom Navigation (Heute, Statistik, Anpassen)
  return (
    <div className="min-h-screen bg-white dark:bg-[#090d16] text-slate-900 dark:text-slate-100 flex flex-col justify-between">
      {/* Top Brand Bar */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#090d16]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-lg mx-auto px-6 h-14 flex items-center justify-between relative">
          <span className="text-xl font-black font-display text-emerald-600 dark:text-emerald-500 tracking-tight">
            Somnify
          </span>

          {/* Settings Button */}
          <button
            onClick={() => setIsSettingsDropdownOpen(!isSettingsDropdownOpen)}
            title="Einstellungen"
            className="p-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1a2333] transition-colors cursor-pointer"
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* Dropdown Menu (Anchored top-right directly under settings button) */}
          {isSettingsDropdownOpen && (
            <>
              {/* Invisible Click-Outside Backdrop */}
              <div
                onClick={() => setIsSettingsDropdownOpen(false)}
                className="fixed inset-0 z-40 bg-transparent"
              />

              {/* Dropdown Card - Generous 260px width and shrink-0 on arrows */}
              <div className="absolute right-6 top-13 z-50 w-64 bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-1.5 space-y-1">
                {/* 1. Allgemein */}
                <button
                  type="button"
                  onClick={() => handleOpenSettingsFromDropdown('allgemein')}
                  className="w-full px-3.5 py-2.5 rounded-xl flex items-center justify-between text-left hover:bg-slate-100 dark:hover:bg-[#1a2333] text-slate-800 dark:text-slate-200 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <Sliders className="w-4 h-4 shrink-0" />
                    </div>
                    <span className="text-sm font-semibold truncate">Allgemein</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                </button>

                {/* 2. Benachrichtigungen */}
                <button
                  type="button"
                  onClick={() => handleOpenSettingsFromDropdown('benachrichtigungen')}
                  className="w-full px-3.5 py-2.5 rounded-xl flex items-center justify-between text-left hover:bg-slate-100 dark:hover:bg-[#1a2333] text-slate-800 dark:text-slate-200 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <Bell className="w-4 h-4 shrink-0" />
                    </div>
                    <span className="text-sm font-semibold truncate">Benachrichtigungen</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                </button>

                {/* 3. Konto */}
                <button
                  type="button"
                  onClick={() => handleOpenSettingsFromDropdown('konto')}
                  className="w-full px-3.5 py-2.5 rounded-xl flex items-center justify-between text-left hover:bg-slate-100 dark:hover:bg-[#1a2333] text-slate-800 dark:text-slate-200 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 shrink-0" />
                    </div>
                    <span className="text-sm font-semibold truncate">Konto</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Main Tab Views */}
      <main className="flex-1 w-full">
        {activeTab === 'heute' && (
          <TodayTab
            todayLog={todayLog}
            factors={factors}
            recentLogs={logs}
            onEditToday={() => {
              setIsEditingExisting(!!todayLog);
              setIsEnteringMorningFlow(true);
            }}
          />
        )}

        {activeTab === 'statistik' && (
          <StatisticsTab
            logs={logs}
            factors={factors}
          />
        )}

        {activeTab === 'anpassen' && (
          <SettingsTab
            factors={factors}
            onAddFactor={handleAddFactor}
            onRemoveFactor={handleRemoveFactor}
            onUpdateFactor={handleUpdateFactor}
            onReorderFactors={handleReorderFactors}
            onResetFactors={handleResetFactors}
          />
        )}
      </main>

      {/* Full-Screen Settings View (Allgemein, Benachrichtigungen, Konto) */}
      <SettingsModal
        user={user}
        isOpen={isSettingsModalOpen}
        initialTab={selectedSettingsTab}
        onClose={() => setIsSettingsModalOpen(false)}
        onUsernameUpdated={(newUsername) => {
          setUser((prev) => (prev ? { ...prev, username: newUsername } : null));
        }}
        onSignOut={handleSignOut}
        currentTheme={currentTheme}
        onThemeChange={(theme) => setCurrentTheme(theme)}
      />

      {/* Fixed Bottom Navigation (Heute, Statistik, Anpassen) */}
      <BottomNav activeTab={activeTab} onChangeTab={setActiveTab} />
    </div>
  );
}
