import React, { useState } from 'react';
import { APP_VERSION } from '../lib/appVersion';
import {
  X,
  ArrowLeft,
  Shield,
  FileText,
  ExternalLink,
  ChevronRight,
  Moon,
} from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

  if (!isOpen) return null;

  // Fullscreen Datenschutz (Privacy) View: rein funktional, ohne Schmuckelemente
  if (isPrivacyOpen) {
    return (
      <div className="fixed inset-0 z-50 bg-white dark:bg-[#090d16] text-slate-900 dark:text-slate-100 flex flex-col max-w-lg mx-auto animate-in slide-in-from-right duration-200">
        <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#090d16]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 h-14 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={() => setIsPrivacyOpen(false)}
            className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Zurück</span>
          </button>
          <span className="text-sm font-bold text-slate-900 dark:text-white">
            Datenschutzerklärung
          </span>
          <div className="w-8" />
        </header>

        <main className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-sans">
          <h1 className="text-base font-bold text-slate-900 dark:text-white pb-1 border-b border-slate-200 dark:border-slate-800">
            Datenschutzerklärung
          </h1>

          <p>
            Der Schutz deiner persönlichen Daten und insbesondere deiner Gesundheitsdaten hat für uns höchste Priorität.
            Nachfolgend informieren wir dich transparent über die Erhebung, Verarbeitung und Nutzung deiner Daten gemäß der
            Datenschutz-Grundverordnung (DSGVO).
          </p>

          <div className="space-y-1 pt-1">
            <h2 className="text-xs font-bold text-slate-900 dark:text-white">
              1. Verantwortliche Stelle
            </h2>
            <p>
              Verantwortlich für die Datenverarbeitung im Sinne der DSGVO ist der Betreiber von Somnify.
              Die Kontaktdaten und rechtlichen Angaben findest du im{' '}
              <a
                href="https://j-jonas.com/impressum"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 dark:text-emerald-400 underline font-medium"
              >
                Impressum (j-jonas.com/impressum)
              </a>
              .
            </p>
          </div>

          <div className="space-y-2 pt-1">
            <h2 className="text-xs font-bold text-slate-900 dark:text-white">
              2. Welche Daten verarbeitet werden
            </h2>

            <div className="space-y-1">
              <h3 className="font-semibold text-slate-900 dark:text-white">
                a) Benutzerkonto & Registrierung
              </h3>
              <p>
                Bei der Erstellung eines Kontos verarbeiten wir deine E-Mail-Adresse, deinen gewählten Benutzernamen, dein Passwort (verschlüsselt gehasht über Firebase Authentication) sowie eine systemische Nutzer-ID (UID).
              </p>
              <p className="text-slate-600 dark:text-slate-400">
                Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung zur Bereitstellung deines Kontos und zur geräteübergreifenden Synchronisation).
              </p>
            </div>

            <div className="space-y-1 pt-1">
              <h3 className="font-semibold text-slate-900 dark:text-white">
                b) Schlafaufzeichnungen & Gewohnheiten (Gesundheitsdaten nach Art. 9 DSGVO)
              </h3>
              <p>
                In Somnify trägst du freiwillig deine Schlafdauer und Schlafphasen (Gesamtschlafzeit, Tiefschlaf, REM-Schlaf und Leichtschlaf in Minuten) ein und markierst Gewohnheiten bzw. Einflussfaktoren (z. B. Koffein, Alkohol, Sport oder individuelle Routinen).
              </p>
              <p>
                Schlafdaten stellen besondere Kategorien personenbezogener Daten (Gesundheitsdaten) nach Art. 9 Abs. 1 DSGVO dar. Die Verarbeitung erfolgt ausschließlich auf Basis deiner ausdrücklichen Einwilligung nach Art. 9 Abs. 2 lit. a DSGVO in Verbindung mit Art. 6 Abs. 1 lit. a DSGVO, die du durch das bewusste Eintragen und Speichern deiner Daten erteilst.
              </p>
            </div>

            <div className="space-y-1 pt-1">
              <h3 className="font-semibold text-slate-900 dark:text-white">
                c) Lokale Gerätespeicherung (LocalStorage)
              </h3>
              <p>
                Einstellungen wie dein gewähltes Erscheinungsbild (Hell/Dunkel), Benachrichtigungszeiten und Wochentage sowie temporäre Ansichten werden lokal auf deinem Endgerät gespeichert.
              </p>
              <p className="text-slate-600 dark:text-slate-400">
                Rechtsgrundlage: Berechtigtes Interesse nach Art. 6 Abs. 1 lit. f DSGVO und § 25 Abs. 2 TDDDG zur Bereitstellung der App-Funktionen.
              </p>
            </div>

            <div className="space-y-1 pt-1">
              <h3 className="font-semibold text-slate-900 dark:text-white">
                d) Lokale Benachrichtigungen
              </h3>
              <p>
                Erinnerungen zur Morgenroutine oder zur Schlafenszeit werden direkt lokal vom Betriebssystem deines Geräts ausgeführt. Es werden keine Nachrichten über externe Push-Marketing-Server versendet.
              </p>
              <p className="text-slate-600 dark:text-slate-400">
                Rechtsgrundlage: Einwilligung nach Art. 6 Abs. 1 lit. a DSGVO durch Aktivierung der Benachrichtigungsfunktion.
              </p>
            </div>
          </div>

          <div className="space-y-1 pt-1">
            <h2 className="text-xs font-bold text-slate-900 dark:text-white">
              3. Cloud-Infrastruktur & Auftragsverarbeitung (Google Firebase)
            </h2>
            <p>
              Zur Bereitstellung der Authentifizierung und der Cloud-Datenbank nutzen wir Google Firebase (Cloud Firestore und Firebase Authentication) der Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland.
            </p>
            <p>
              Die Speicherung erfolgt standardmäßig auf Servern innerhalb der Europäischen Union. Mit Google besteht eine Vereinbarung zur Auftragsverarbeitung gemäß Art. 28 DSGVO. Soweit Daten in Drittländer (wie die USA) übertragen werden, erfolgt dies auf Grundlage der Standardvertragsklauseln der EU-Kommission bzw. des EU-U.S. Data Privacy Frameworks.
            </p>
          </div>

          <div className="space-y-1 pt-1">
            <h2 className="text-xs font-bold text-slate-900 dark:text-white">
              4. Keine Datenweitergabe & kein Werbetracking
            </h2>
            <p>
              Somnify enthält keine Werbenetzwerke und keine Tracking-Tools Dritter für Marketingzwecke. Deine Daten werden weder verkauft noch an Werbetreibende weitergegeben.
            </p>
          </div>

          <div className="space-y-1 pt-1">
            <h2 className="text-xs font-bold text-slate-900 dark:text-white">
              5. Speicherdauer & Kontolöschung
            </h2>
            <p>
              Deine Daten bleiben gespeichert, solange dein Benutzerkonto besteht. In den Einstellungen der App steht dir unter „Konto &rarr; Gesamtes Konto löschen“ eine Funktion zur Verfügung, mit der dein Profil, alle Schlafaufzeichnungen, deine Gewohnheiten und dein Benutzername unwiderruflich aus der Datenbank und Authentifizierung gelöscht werden.
            </p>
          </div>

          <div className="space-y-1 pt-1 pb-6">
            <h2 className="text-xs font-bold text-slate-900 dark:text-white">
              6. Deine Rechte nach DSGVO
            </h2>
            <p>Du hast jederzeit folgende gesetzliche Rechte:</p>
            <ul className="list-disc pl-4 space-y-1 text-slate-700 dark:text-slate-300">
              <li>Recht auf Auskunft über deine verarbeiteten Daten (Art. 15 DSGVO)</li>
              <li>Recht auf Berichtigung unrichtiger Daten (Art. 16 DSGVO)</li>
              <li>Recht auf Löschung („Recht auf Vergessenwerden“, Art. 17 DSGVO)</li>
              <li>Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
              <li>Recht auf Datenübertragbarkeit (Art. 20 DSGVO)</li>
              <li>Recht auf jederzeitigen Widerruf erteilter Einwilligungen (Art. 7 Abs. 3 DSGVO)</li>
              <li>Recht auf Beschwerde bei einer Datenschutzaufsichtsbehörde (Art. 77 DSGVO)</li>
            </ul>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-[#090d16] text-slate-900 dark:text-slate-100 flex flex-col max-w-lg mx-auto animate-in slide-in-from-bottom duration-200">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#090d16]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 h-14 flex items-center justify-between">
        <span className="text-xl font-black font-display text-emerald-600 dark:text-emerald-500 tracking-tight">
          Über Somnify
        </span>
        <button
          type="button"
          onClick={onClose}
          title="Schließen"
          className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1a2333] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 flex flex-col justify-between">
        <div className="space-y-6">
          {/* Logo & Intro */}
          <div className="text-center pt-4 pb-2 space-y-2">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-inner">
              <Moon className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black font-display text-slate-900 dark:text-white tracking-tight">
              Somnify
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
              Intelligente Schlafanalyse & Gewohnheitstracking
            </p>
          </div>

          {/* Links Card */}
          <div className="bg-slate-50 dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-200 dark:divide-slate-800">
            {/* 1. Datenschutz */}
            <button
              type="button"
              onClick={() => setIsPrivacyOpen(true)}
              className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-slate-100 dark:hover:bg-[#161f33] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Datenschutz
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            {/* 2. Impressum */}
            <a
              href="https://j-jonas.com/impressum"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-slate-100 dark:hover:bg-[#161f33] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Impressum
                </span>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-400" />
            </a>
          </div>
        </div>

        {/* Small Version Indicator at the very bottom (ONLY here in Über Somnify) */}
        <div className="text-center pb-4 pt-8">
          <span className="text-[11px] font-medium tracking-wider text-slate-400 dark:text-slate-600 uppercase select-none">
            V{APP_VERSION}
          </span>
        </div>
      </main>
    </div>
  );
};
