import React, { useState } from 'react';
import { UserProfile } from '../types';
import { loginUser, registerUser, isUsernameAvailable } from '../lib/firebase';
import { Moon, Check, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';

interface AuthScreenProps {
  onSuccess: (profile: UserProfile, isDemo?: boolean) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onSuccess }) => {
  const [mode, setMode] = useState<'welcome' | 'login' | 'register'>('welcome');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const checkUsernameLive = async (val: string) => {
    setUsername(val);
    const clean = val.trim().toLowerCase();
    if (clean.length < 3) {
      setUsernameStatus('idle');
      return;
    }
    setUsernameStatus('checking');
    try {
      const avail = await isUsernameAvailable(clean);
      setUsernameStatus(avail ? 'available' : 'taken');
    } catch {
      setUsernameStatus('idle');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Bitte E-Mail und Passwort eingeben.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const profile = await loginUser(email, password);
      onSuccess(profile, false);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('E-Mail oder Passwort ist nicht korrekt.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Ungültige E-Mail-Adresse.');
      } else {
        setError(err.message || 'Anmeldung fehlgeschlagen.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || username.trim().length < 3) {
      setError('Der Benutzername muss mindestens 3 Zeichen lang sein.');
      return;
    }
    if (!email || !password) {
      setError('Bitte alle Felder ausfüllen.');
      return;
    }
    if (password.length < 6) {
      setError('Das Passwort muss mindestens 6 Zeichen lang sein.');
      return;
    }
    if (usernameStatus === 'taken') {
      setError('Dieser Benutzername ist bereits vergeben.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const profile = await registerUser(email, password, username);
      onSuccess(profile, false);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Diese E-Mail wird bereits für ein Konto verwendet.');
      } else {
        setError(err.message || 'Registrierung fehlgeschlagen.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Instant demo option: pre-loads 14 days sample data directly
  const handleQuickDemo = () => {
    const guestProfile: UserProfile = {
      uid: 'demo_guest_user',
      email: 'demo@somnify.app',
      username: 'schlafforscher',
    };
    onSuccess(guestProfile, true);
  };

  return (
    <div className="min-h-screen w-full bg-white dark:bg-[#090d16] text-slate-900 dark:text-slate-100 flex flex-col justify-between max-w-lg mx-auto">
      {/* When in login or register mode: Top Somnify Header exactly as in authenticated state */}
      {mode !== 'welcome' ? (
        <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#090d16]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 h-14 flex items-center justify-between">
          <span className="text-xl font-black font-display text-emerald-600 dark:text-emerald-500 tracking-tight">
            Somnify
          </span>
          <button
            onClick={() => {
              setError(null);
              setMode('welcome');
            }}
            className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium cursor-pointer"
          >
            Zurück
          </button>
        </header>
      ) : (
        <div className="pt-8"></div>
      )}

      {/* Main Content Area */}
      <div className="w-full flex-1 flex flex-col items-center justify-center p-6 text-center">
        {mode === 'welcome' && (
          <div className="w-full flex flex-col items-center my-auto">
            {/* Minimal App Icon Badge */}
            <div className="w-20 h-20 rounded-3xl bg-emerald-600 flex items-center justify-center text-white mb-6">
              <Moon className="w-10 h-10 fill-white text-white" />
            </div>

            {/* Big Brand Logo in Bold Modern Green */}
            <h1 className="text-5xl sm:text-6xl font-black text-emerald-600 dark:text-emerald-500 tracking-tight font-display mb-3">
              Somnify
            </h1>
            
            <p className="text-slate-600 dark:text-slate-400 text-base max-w-xs mb-12">
              Erkenne deinen Schlafrhythmus. Verstehe deine Gewohnheiten.
            </p>

            {/* Exactly Two Buttons: Anmelden und Registrieren */}
            <div className="w-full space-y-3.5">
              <button
                onClick={() => {
                  setError(null);
                  setMode('login');
                }}
                className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-lg rounded-2xl transition-transform flex items-center justify-center cursor-pointer"
              >
                Anmelden
              </button>

              <button
                onClick={() => {
                  setError(null);
                  setMode('register');
                }}
                className="w-full h-14 bg-slate-100 dark:bg-[#1a2333] hover:bg-slate-200 dark:hover:bg-[#222e44] text-slate-900 dark:text-slate-100 font-bold text-lg rounded-2xl transition-colors border border-slate-200 dark:border-slate-800 flex items-center justify-center cursor-pointer"
              >
                Registrieren
              </button>

              {/* Quick Demo Preview Button */}
              <div className="pt-4">
                <button
                  onClick={handleQuickDemo}
                  className="text-xs text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium inline-flex items-center gap-1.5 py-2 px-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500" />
                  Schnell-Demo starten (mit Beispieldaten)
                </button>
              </div>
            </div>
          </div>
        )}

        {mode === 'login' && (
          <div className="w-full bg-slate-50 dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 text-left my-auto">
            <h2 className="text-2xl font-bold font-display text-slate-900 dark:text-white mb-1">
              Willkommen zurück
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Melde dich mit deiner E-Mail und deinem Passwort an.
            </p>

            {error && (
              <div className="mb-5 p-3.5 bg-rose-100 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-900 rounded-xl text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  E-Mail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@beispiel.de"
                  required
                  className="w-full h-12 px-4 rounded-xl bg-white dark:bg-[#182235] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-600 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Passwort
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full h-12 px-4 rounded-xl bg-white dark:bg-[#182235] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-600 text-sm"
                />
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-13 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-50 text-white font-bold rounded-xl transition-transform flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? 'Anmelden...' : 'Anmelden'}
                  {!loading && <ArrowRight className="w-4 h-4" />}
                </button>
              </div>
            </form>
          </div>
        )}

        {mode === 'register' && (
          <div className="w-full bg-slate-50 dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 text-left my-auto">
            <h2 className="text-2xl font-bold font-display text-slate-900 dark:text-white mb-1">
              Konto erstellen
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Wähle einen Benutzernamen für dein persönliches Profil.
            </p>

            {error && (
              <div className="mb-5 p-3.5 bg-rose-100 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-900 rounded-xl text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Benutzername
                  </label>
                  {usernameStatus === 'checking' && (
                    <span className="text-[11px] text-slate-400">Prüfe Verfügbarkeit...</span>
                  )}
                  {usernameStatus === 'available' && (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Verfügbar
                    </span>
                  )}
                  {usernameStatus === 'taken' && (
                    <span className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold">
                      Bereits vergeben
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => checkUsernameLive(e.target.value)}
                  placeholder="z. B. schlaffreund"
                  required
                  className="w-full h-12 px-4 rounded-xl bg-white dark:bg-[#182235] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-600 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  E-Mail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@beispiel.de"
                  required
                  className="w-full h-12 px-4 rounded-xl bg-white dark:bg-[#182235] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-600 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Passwort (min. 6 Zeichen)
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full h-12 px-4 rounded-xl bg-white dark:bg-[#182235] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-600 text-sm"
                />
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  disabled={loading || usernameStatus === 'taken'}
                  className="w-full h-13 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-50 text-white font-bold rounded-xl transition-transform flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? 'Konto wird erstellt...' : 'Konto registrieren'}
                  {!loading && <ArrowRight className="w-4 h-4" />}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Footer info: Privacy Notice */}
      <div className="pb-4 text-center px-6">
        <p className="text-[11px] text-slate-400 dark:text-slate-600">
          Firebase Auth geschützt · Keine Speicherung sensibler Passwörter in Firestore
        </p>
      </div>
    </div>
  );
};
