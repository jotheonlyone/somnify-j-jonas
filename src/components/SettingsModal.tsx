import React, { useState, useEffect } from 'react';
import { UserProfile, NotificationSettings } from '../types';
import {
  changeUsername,
  changeUserPassword,
  changeUserEmail,
  deleteEntireAccount,
} from '../lib/firebase';
import {
  scheduleAppNotifications,
  requestNotificationPermissions,
  cancelAllScheduledNotifications,
  DEFAULT_NOTIFICATIONS,
} from '../lib/notifications';
import {
  X,
  Sliders,
  Bell,
  User,
  Check,
  AlertCircle,
  Sun,
  Moon,
  Monitor,
  Trash2,
  LogOut,
  Clock,
  ShieldAlert,
} from 'lucide-react';

export type AppTheme = 'light' | 'dark' | 'system';
export type SettingsTabType = 'allgemein' | 'benachrichtigungen' | 'konto';

interface SettingsModalProps {
  user: UserProfile;
  isOpen: boolean;
  initialTab?: SettingsTabType;
  onClose: () => void;
  onUsernameUpdated: (newUsername: string) => void;
  onSignOut: () => void;
  currentTheme: AppTheme;
  onThemeChange: (theme: AppTheme) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  user,
  isOpen,
  initialTab = 'allgemein',
  onClose,
  onUsernameUpdated,
  onSignOut,
  currentTheme,
  onThemeChange,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTabType>(initialTab);

  // Sync activeTab when initialTab changes on open
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Account State
  const [usernameInput, setUsernameInput] = useState(user.username);
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [usernameSuccess, setUsernameSuccess] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  // Password State
  const [currentPassForPass, setCurrentPassForPass] = useState('');
  const [newPassInput, setNewPassInput] = useState('');
  const [passLoading, setPassLoading] = useState(false);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);
  const [passError, setPassError] = useState<string | null>(null);

  // Email State
  const [currentPassForEmail, setCurrentPassForEmail] = useState('');
  const [newEmailInput, setNewEmailInput] = useState(user.email || '');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Delete Account State
  const [deletePassInput, setDeletePassInput] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Notifications State
  const [notifications, setNotifications] = useState<NotificationSettings>(() => {
    const saved = localStorage.getItem('somnify_notifications');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return DEFAULT_NOTIFICATIONS;
  });
  const [notifFeedback, setNotifFeedback] = useState<{
    text: string;
    type: 'success' | 'warning';
  } | null>(null);

  useEffect(() => {
    setUsernameInput(user.username);
  }, [user.username]);

  if (!isOpen) return null;

  // Change Username Handler
  const handleSaveUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    setUsernameError(null);
    setUsernameSuccess(null);

    if (user.uid.startsWith('demo_')) {
      onUsernameUpdated(usernameInput.trim().toLowerCase());
      setUsernameSuccess('Benutzername in der Demo aktualisiert.');
      return;
    }

    setUsernameLoading(true);
    try {
      const updated = await changeUsername(user.username, usernameInput);
      onUsernameUpdated(updated);
      setUsernameSuccess('Benutzername erfolgreich geändert.');
    } catch (err: any) {
      setUsernameError(err.message || 'Fehler beim Ändern des Benutzernamens.');
    } finally {
      setUsernameLoading(false);
    }
  };

  // Change Password Handler
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(null);

    if (user.uid.startsWith('demo_')) {
      setPassError('Im Gastmodus kann das Passwort nicht geändert werden.');
      return;
    }

    setPassLoading(true);
    try {
      await changeUserPassword(currentPassForPass, newPassInput);
      setPassSuccess('Passwort erfolgreich aktualisiert.');
      setCurrentPassForPass('');
      setNewPassInput('');
    } catch (err: any) {
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setPassError('Das aktuelle Passwort ist nicht korrekt.');
      } else if (err.code === 'auth/weak-password') {
        setPassError('Das neue Passwort ist zu schwach (mind. 6 Zeichen).');
      } else {
        setPassError(err.message || 'Passwort konnte nicht geändert werden.');
      }
    } finally {
      setPassLoading(false);
    }
  };

  // Change Email Handler
  const handleSaveEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);
    setEmailSuccess(null);

    if (user.uid.startsWith('demo_')) {
      setEmailError('Im Gastmodus kann die E-Mail nicht geändert werden.');
      return;
    }

    setEmailLoading(true);
    try {
      await changeUserEmail(currentPassForEmail, newEmailInput);
      setEmailSuccess('Bestätigungslink versendet! Bitte prüfe dein Postfach, um die neue E-Mail zu bestätigen.');
      setCurrentPassForEmail('');
    } catch (err: any) {
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setEmailError('Das aktuelle Passwort ist nicht korrekt.');
      } else if (err.code === 'auth/email-already-in-use') {
        setEmailError('Diese E-Mail-Adresse wird bereits verwendet.');
      } else {
        setEmailError(err.message || 'E-Mail konnte nicht aktualisiert werden.');
      }
    } finally {
      setEmailLoading(false);
    }
  };

  // Delete Account Handler
  const handleDeleteAccount = async () => {
    setDeleteError(null);

    if (user.uid.startsWith('demo_')) {
      onSignOut();
      onClose();
      return;
    }

    if (!deletePassInput) {
      setDeleteError('Bitte dein Passwort zur Bestätigung eingeben.');
      return;
    }

    setDeleteLoading(true);
    try {
      await deleteEntireAccount(deletePassInput, user.username);
      onSignOut();
      onClose();
    } catch (err: any) {
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setDeleteError('Das Passwort zur Bestätigung ist nicht korrekt.');
      } else {
        setDeleteError(err.message || 'Konto konnte nicht gelöscht werden. Bitte erneut versuchen.');
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  // Notification Toggle Handler
  const handleToggleNotifications = async (enabled: boolean) => {
    if (enabled) {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        // Warning feedback in amber/orange matching standard reset style
        setNotifFeedback({
          type: 'warning',
          text: 'Die Benachrichtigungsberechtigung konnte im Browser bzw. System nicht erteilt werden.',
        });
        return;
      }
    } else {
      await cancelAllScheduledNotifications();
    }

    const updated = { ...notifications, enabled };
    setNotifications(updated);
    localStorage.setItem('somnify_notifications', JSON.stringify(updated));
    await scheduleAppNotifications(updated);
    setNotifFeedback({
      type: 'success',
      text: enabled ? 'Benachrichtigungen wurden erfolgreich aktiviert.' : 'Benachrichtigungen deaktiviert.',
    });
    setTimeout(() => setNotifFeedback(null), 4000);
  };

  const handleUpdateNotifTime = async (key: 'morningTime' | 'bedtimeTime', val: string) => {
    const updated = { ...notifications, [key]: val };
    setNotifications(updated);
    localStorage.setItem('somnify_notifications', JSON.stringify(updated));
    if (notifications.enabled) {
      await scheduleAppNotifications(updated);
    }
  };

  const handleToggleSpecificNotif = async (key: 'morningEnabled' | 'bedtimeEnabled', val: boolean) => {
    const updated = { ...notifications, [key]: val };
    setNotifications(updated);
    localStorage.setItem('somnify_notifications', JSON.stringify(updated));
    if (notifications.enabled) {
      await scheduleAppNotifications(updated);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-[#090d16] text-slate-900 dark:text-slate-100 flex flex-col max-w-lg mx-auto">
      {/* Top Header Bar with Close X */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#090d16]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 h-14 flex items-center justify-between">
        <span className="text-xl font-black font-display text-emerald-600 dark:text-emerald-500 tracking-tight">
          Somnify
        </span>
        <button
          onClick={onClose}
          title="Schließen"
          className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1a2333] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* Top Tabs to switch between Allgemein, Benachrichtigungen, and Konto */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#111726]">
        <button
          onClick={() => setActiveTab('allgemein')}
          className={`flex-1 py-3.5 text-xs font-bold transition-colors cursor-pointer border-b-2 flex items-center justify-center gap-1.5 ${
            activeTab === 'allgemein'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-[#090d16]'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Allgemein
        </button>

        <button
          onClick={() => setActiveTab('benachrichtigungen')}
          className={`flex-1 py-3.5 text-xs font-bold transition-colors cursor-pointer border-b-2 flex items-center justify-center gap-1.5 ${
            activeTab === 'benachrichtigungen'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-[#090d16]'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Bell className="w-4 h-4" />
          Benachrichtigungen
        </button>

        <button
          onClick={() => setActiveTab('konto')}
          className={`flex-1 py-3.5 text-xs font-bold transition-colors cursor-pointer border-b-2 flex items-center justify-center gap-1.5 ${
            activeTab === 'konto'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-[#090d16]'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <User className="w-4 h-4" />
          Konto
        </button>
      </div>

      {/* Tab Content (Full Height Scrollable) */}
      <div className="p-6 overflow-y-auto space-y-6 flex-1 pb-16">
        {/* TAB 1: ALLGEMEIN */}
        {activeTab === 'allgemein' && (
          <div className="space-y-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2.5">
                Erscheinungsbild
              </span>
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  onClick={() => onThemeChange('light')}
                  className={`p-3.5 rounded-2xl border text-center flex flex-col items-center gap-2 cursor-pointer transition-colors ${
                    currentTheme === 'light'
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 font-bold'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151c2c] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1a2333]'
                  }`}
                >
                  <Sun className="w-5 h-5 text-amber-500" />
                  <span className="text-xs">Hell</span>
                </button>

                <button
                  onClick={() => onThemeChange('dark')}
                  className={`p-3.5 rounded-2xl border text-center flex flex-col items-center gap-2 cursor-pointer transition-colors ${
                    currentTheme === 'dark'
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 font-bold'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151c2c] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1a2333]'
                  }`}
                >
                  <Moon className="w-5 h-5 text-blue-500" />
                  <span className="text-xs">Dunkel</span>
                </button>

                <button
                  onClick={() => onThemeChange('system')}
                  className={`p-3.5 rounded-2xl border text-center flex flex-col items-center gap-2 cursor-pointer transition-colors ${
                    currentTheme === 'system'
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 font-bold'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151c2c] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1a2333]'
                  }`}
                >
                  <Monitor className="w-5 h-5 text-slate-500" />
                  <span className="text-xs">System</span>
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-2.5">
                „System“ passt sich automatisch den Einstellungen deines Android-Geräts an.
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: BENACHRICHTIGUNGEN */}
        {activeTab === 'benachrichtigungen' && (
          <div className="space-y-4">
            {/* Warning Message in Orange / Amber matching the reset confirmation style */}
            {notifFeedback && notifFeedback.type === 'warning' && (
              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-2xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-200 block">
                    Berechtigung nicht erteilt
                  </span>
                  <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                    {notifFeedback.text}
                  </p>
                </div>
              </div>
            )}

            {/* Success Message in Green */}
            {notifFeedback && notifFeedback.type === 'success' && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{notifFeedback.text}</span>
              </div>
            )}

            {/* Master Switch */}
            <div className="bg-slate-50 dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-sm font-bold text-slate-900 dark:text-white block">
                  Erinnerungen aktivieren
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Lokale Benachrichtigungen auf deinem Gerät
                </span>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.enabled}
                  onChange={(e) => handleToggleNotifications(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {/* Sub-Notification: Morgenroutine */}
            <div className={`space-y-3 p-4 rounded-2xl border transition-opacity ${
              notifications.enabled
                ? 'bg-slate-50 dark:bg-[#111726] border-slate-200 dark:border-slate-800'
                : 'bg-slate-50/50 dark:bg-[#111726]/50 border-slate-200/50 dark:border-slate-800/50 opacity-60'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Morgenroutine
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    „Guten Morgen! Trage jetzt deine Daten ein um Gewohnheiten zu erkennen.“
                  </span>
                </div>
                <input
                  type="checkbox"
                  disabled={!notifications.enabled}
                  checked={notifications.morningEnabled}
                  onChange={(e) => handleToggleSpecificNotif('morningEnabled', e.target.checked)}
                  className="w-4 h-4 accent-emerald-600 cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Uhrzeit:</span>
                <input
                  type="time"
                  disabled={!notifications.enabled || !notifications.morningEnabled}
                  value={notifications.morningTime}
                  onChange={(e) => handleUpdateNotifTime('morningTime', e.target.value)}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#090d16] border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Sub-Notification: Schlafenszeit */}
            <div className={`space-y-3 p-4 rounded-2xl border transition-opacity ${
              notifications.enabled
                ? 'bg-slate-50 dark:bg-[#111726] border-slate-200 dark:border-slate-800'
                : 'bg-slate-50/50 dark:bg-[#111726]/50 border-slate-200/50 dark:border-slate-800/50 opacity-60'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Schlafenszeit
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    „Es ist Zeit zu Schlafen. Mach dich Bettfertig.“
                  </span>
                </div>
                <input
                  type="checkbox"
                  disabled={!notifications.enabled}
                  checked={notifications.bedtimeEnabled}
                  onChange={(e) => handleToggleSpecificNotif('bedtimeEnabled', e.target.checked)}
                  className="w-4 h-4 accent-emerald-600 cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Uhrzeit:</span>
                <input
                  type="time"
                  disabled={!notifications.enabled || !notifications.bedtimeEnabled}
                  value={notifications.bedtimeTime}
                  onChange={(e) => handleUpdateNotifTime('bedtimeTime', e.target.value)}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#090d16] border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: KONTO */}
        {activeTab === 'konto' && (
          <div className="space-y-6">
            {/* 1. Benutzername ändern */}
            <form onSubmit={handleSaveUsername} className="bg-slate-50 dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white block">
                Benutzername ändern
              </span>

              {usernameSuccess && (
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  <span>{usernameSuccess}</span>
                </div>
              )}
              {usernameError && (
                <div className="p-2.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-900 rounded-xl text-rose-800 dark:text-rose-200 text-xs flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{usernameError}</span>
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  required
                  className="flex-1 h-10 px-3 rounded-xl bg-white dark:bg-[#090d16] border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600"
                />
                <button
                  type="submit"
                  disabled={usernameLoading || usernameInput.trim() === user.username}
                  className="px-4 h-10 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  {usernameLoading ? 'Speichern...' : 'Speichern'}
                </button>
              </div>
            </form>

            {/* 2. Passwort ändern */}
            <form onSubmit={handleSavePassword} className="bg-slate-50 dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white block">
                Passwort ändern
              </span>

              {passSuccess && (
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  <span>{passSuccess}</span>
                </div>
              )}
              {passError && (
                <div className="p-2.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-900 rounded-xl text-rose-800 dark:text-rose-200 text-xs flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{passError}</span>
                </div>
              )}

              <input
                type="password"
                value={currentPassForPass}
                onChange={(e) => setCurrentPassForPass(e.target.value)}
                placeholder="Aktuelles Passwort"
                required
                className="w-full h-10 px-3 rounded-xl bg-white dark:bg-[#090d16] border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600"
              />

              <input
                type="password"
                value={newPassInput}
                onChange={(e) => setNewPassInput(e.target.value)}
                placeholder="Neues Passwort (mind. 6 Zeichen)"
                required
                minLength={6}
                className="w-full h-10 px-3 rounded-xl bg-white dark:bg-[#090d16] border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600"
              />

              <button
                type="submit"
                disabled={passLoading}
                className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                {passLoading ? 'Wird geändert...' : 'Passwort aktualisieren'}
              </button>
            </form>

            {/* 3. E-Mail-Adresse ändern */}
            <form onSubmit={handleSaveEmail} className="bg-slate-50 dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white block">
                E-Mail-Adresse ändern
              </span>

              {emailSuccess && (
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>{emailSuccess}</span>
                </div>
              )}
              {emailError && (
                <div className="p-2.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-900 rounded-xl text-rose-800 dark:text-rose-200 text-xs flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{emailError}</span>
                </div>
              )}

              <input
                type="password"
                value={currentPassForEmail}
                onChange={(e) => setCurrentPassForEmail(e.target.value)}
                placeholder="Aktuelles Passwort"
                required
                className="w-full h-10 px-3 rounded-xl bg-white dark:bg-[#090d16] border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600"
              />

              <input
                type="email"
                value={newEmailInput}
                onChange={(e) => setNewEmailInput(e.target.value)}
                placeholder="Neue E-Mail-Adresse"
                required
                className="w-full h-10 px-3 rounded-xl bg-white dark:bg-[#090d16] border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600"
              />

              <button
                type="submit"
                disabled={emailLoading}
                className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                {emailLoading ? 'Wird überprüft...' : 'Neue E-Mail anfordern'}
              </button>
            </form>

            {/* 4. Abmelden Button */}
            <div className="pt-2">
              <button
                onClick={() => {
                  onClose();
                  onSignOut();
                }}
                className="w-full h-11 bg-slate-100 dark:bg-[#111726] hover:bg-slate-200 dark:hover:bg-[#1b253b] text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer border border-slate-200 dark:border-slate-800"
              >
                <LogOut className="w-4 h-4 text-slate-500" />
                Von Somnify abmelden
              </button>
            </div>

            {/* 5. Ganzes Konto löschen */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full h-10 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Konto unwiderruflich löschen
                </button>
              ) : (
                <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-900 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-rose-800 dark:text-rose-200 text-xs font-bold">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    <span>Konto und alle Daten restlos löschen?</span>
                  </div>

                  <p className="text-[11px] text-rose-700 dark:text-rose-300">
                    Alle deine Schlafeinträge, Gewohnheiten und dein Firebase-Login werden dauerhaft gelöscht.
                  </p>

                  {deleteError && (
                    <div className="p-2 bg-white dark:bg-rose-950 rounded-lg text-rose-700 dark:text-rose-200 text-[11px]">
                      {deleteError}
                    </div>
                  )}

                  <input
                    type="password"
                    value={deletePassInput}
                    onChange={(e) => setDeletePassInput(e.target.value)}
                    placeholder="Passwort zur Bestätigung"
                    className="w-full h-9 px-3 rounded-xl bg-white dark:bg-[#090d16] border border-rose-300 dark:border-rose-800 text-xs text-slate-900 dark:text-white"
                  />

                  <div className="flex gap-2">
                    <button
                      onClick={handleDeleteAccount}
                      disabled={deleteLoading}
                      className="flex-1 h-9 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl cursor-pointer"
                    >
                      {deleteLoading ? 'Löschen...' : 'Jetzt endgültig löschen'}
                    </button>
                    <button
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeleteError(null);
                      }}
                      className="px-3 h-9 text-slate-600 dark:text-slate-400 text-xs font-semibold rounded-xl cursor-pointer"
                    >
                      Abbrechen
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
