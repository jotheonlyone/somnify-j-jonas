# Somnify – Intelligenter Schlafphasen- & Gewohnheitstracker

Ein moderner Schlaftracker im reduzierten Flat-Design mit deckenden Unifarben, der morgens den schnellen Einstieg über 3 Regler ermöglicht und durch statistische Korrelationsanalysen aufdeckt, wie Gewohnheiten und Kombinationen Tiefschlaf und REM-Schlaf beeinflussen.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> Die folgenden Entscheidungen wurden in Phase 1 geklärt und sind im System verankert:
> - **Bezeichnung für Aussagen**: Offizielle Bezeichnung in der Benutzeroberfläche ist **„Gewohnheiten & Einflüsse“**.
> - **Einheit für Schieberegler**: Intuitive Zeiteingabe in **Stunden und Minuten** (z. B. `7h 30m`, `1h 45m`) mit 15-Minuten-Raster für präzise, mühelose Handhabung.
> - **Test- & Beispieldaten**: Neue Accounts erhalten eine Option **„14 Tage Beispieldaten laden“**, um die statistischen Auswertungen und Synergiediagramme sofort live ausprobieren zu können.
> - **Design-Vorgabe**: Strenges **Flat-Design** mit deckenden Unifarben (keine Farbverläufe, keine 3D-Effekte, keine Glow-Schatten), weich abgerundete Karten (`rounded-2xl`), sattes modernes Grün als Primärfarbe und automatische Anpassung an Dark-/Light-Mode des Betriebssystems.

---

### 1. Overview & Core Concept

- **Was Somnify leistet**: Somnify beseitigt morgendlichen Erfassungsballast. Direkt nach dem Aufwachen öffnen Nutzer die App und sehen ausschließlich 3 Schieberegler (Gesamtschlaf, Tiefschlaf, REM-Schlaf). Im zweiten Schritt wählen sie ihre Vortages-Gewohnheiten. Auf der Statistik-Seite analysiert Somnify automatisch Korrelationen zwischen Gewohnheiten und nächtlicher Erholung – inklusive synergistischer Mehrfachkombinationen.
- **Zielgruppe**: Personen, die ihren Schlaf mit Wearables (z. B. Apple Watch, Garmin, Whoop, Oura) oder Schätzungen tracken und verstehen wollen, welche Verhaltensweisen ihren Tief- und REM-Schlaf messbar fördern oder hemmen.
- **Kernwert**: Klare Kausalitäten statt Datengräber. Der Nutzer erfährt nicht nur Durchschnittswerte, sondern z. B.: *„Koffein nach 14 Uhr senkt deinen Tiefschlaf um durchschnittlich 14%“* oder *„Alkohol in Kombination mit spätem Essen reduziert REM um 26%“*.

---

### 2. User Experience & Visual Design

#### A. Flow & Screen Architecture
1. **Welcome & Auth-Screen**:
   - Prominentes Somnify-Wortmarken-Logo in kräftiger, moderner Typografie im satten Grün.
   - Zwei klare Flat-Buttons: **Anmelden** & **Registrieren**.
   - Authentifizierung über Firebase Auth (E-Mail/Passwort) mit Überprüfung der Benutzername-Verfügbarkeit in Firestore.
2. **Morgendlicher 3-Regler-Fokus**:
   - Kein Ablenkungselement: Nur die 3 Slider für Gesamtschlaf (z. B. 4h bis 14h), Tiefschlaf (0h bis 4h) und REM-Schlaf (0h bis 4h).
   - Direkte Live-Anzeige der eingestellten Zeiten (`h` und `m`) sowie berechnete Leichtschlaf-/Wachphase.
   - Primärer Action-Button: **Weiter**.
3. **Gewohnheiten & Einflüsse (Schritt 2)**:
   - Übersichtliche Auswahlkarten für den Vortag (vorbelegt: *Koffein nach 14 Uhr*, *Alkohol getrunken*, *Sport gemacht* sowie alle vom Nutzer definierten Faktoren).
   - Beliebig viele per Fingertipp aktivierbar; Button **Weiter** schließt die Erfassung ab.
4. **Haupt-App mit unterer Navigationsleiste**:
   - **Heute**: Anzeige der heutigen Schlafmetriken und ausgewählten Faktoren mit direkter Editierfunktion.
   - **Statistik**: Automatisch generierte Korrelationsdiagramme nach Relevanz/Prozent-Delta geordnet, plus Erkennung von Verhaltenspaaren (Kombi-Effekte).
   - **Anpassen**: Verwalten, Erstellen und Löschen von individuellen Faktoren (Name, Symbol/Icon, Tag).

#### B. Visuelle Identität & Farbpalette (Flat Design)
- **Design-Philosophie**: 100% Flat Design. Reine deckende Unifarben (keine Gradients, keine Drop-Shadows oder Neumorphismus, saubere Hairline-Borders und flächige Kontraste).
- **Farben**:
  - **Primärgrün**: Modernes Forest/Emerald-Grün (`#15803d` / `#16a34a` / `#22c55e`).
  - **Akzentfarben**: Deckendes Ziegelrot für hemmende Einflüsse (`#dc2626`), sattes Bernstein für moderate Effekte (`#d97706`), solides Schieferblau für Schlafphasen (`#2563eb`).
  - **Hintergrund Light Mode**: Reines Weiß (`#ffffff`) mit neutralen Kartenflächen (`#f8fafc` / `#f1f5f9`) und dezenten Konturlinien (`#e2e8f0`).
  - **Hintergrund Dark Mode**: Tiefes Graphit/Nachtblau (`#090d16` / `#0f172a`) mit strukturierten Kartenflächen (`#1e293b`) und sauberen Abgrenzungen (`#334155`).
  - **Systemanpassung**: `dark:`-Klassen gekoppelt an `@media (prefers-color-scheme: dark)`.

---

### 3. Key Product Decisions & Algorithmus

#### Der Korrelations- & Kombinations-Algorithmus
- **Baseline-Berechnung**:
  - Ermittlung des individuellen Gesamtmittelwerts für Gesamtschlafzeit ($T_{\text{avg}}$), Tiefschlafzeit ($D_{\text{avg}}$), Tiefschlafquote ($D\%_{\text{avg}}$), REM-Zeit ($R_{\text{avg}}$) und REM-Quote ($R\%_{\text{avg}}$).
- **Einzelfaktor-Analyse**:
  - Für jeden Faktor $F_i$ werden die Tage gefiltert, an denen $F_i$ aktiv war ($N_{F_i}$ Tage) vs. inaktiv ($N_{\neg F_i}$ Tage).
  - Berechnung der Differenz in Prozent:
    $$\Delta\% = \frac{\overline{\text{Wert}}_{F_i} - \overline{\text{Wert}}_{\text{Baseline}}}{\overline{\text{Wert}}_{\text{Baseline}}} \times 100$$
  - Statistische Relevanzbewertung und Sortierung nach absolutem Einfluss $|\Delta\%|$.
- **Paar- & Kombinationsanalyse (Synergie-Effekte)**:
  - Untersucht Tage mit zwei Faktoren gleichzeitig ($F_i \land F_j$).
  - Wenn der gemeinsame Effekt signifikant vom erwarteten Einzeleffekt abweicht (z. B. Summe der Einzeleffekte beträgt $-5\%$, aber kombiniert tritt $-22\%$ auf), wird dies als hervorstechende Synergie/Wechselwirkung markiert und als separater Kombinations-Chart dargestellt.
- **Robustheit bei wenig Daten**:
  - Konfidenzhinweise bei $<3$ Einträgen eines Faktors; voll funktionsfähiger Beispieldaten-Generator für 14 aufeinanderfolgende Tage mit realistischen Mustern.

---

### 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                      Firebase Backend                       │
│   ┌───────────────────────────┐ ┌───────────────────────┐   │
│   │       Firebase Auth       │ │   Cloud Firestore     │   │
│   │   (Email / Password)      │ │  - /users/{uid}       │   │
│   │                           │ │  - /usernames/{name}  │   │
│   │                           │ │  - /logs/{uid_date}   │   │
│   │                           │ │  - /factors/{uid_fid} │   │
│   └─────────────┬─────────────┘ └───────────┬───────────┘   │
└─────────────────┼───────────────────────────┼───────────────┘
                  │                           │
┌─────────────────▼───────────────────────────▼───────────────┐
│                    Somnify React Core                       │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │ Auth Guard / Welcome Screen                         │   │
│   │ (Somnify Logo, Login, Registration, Username-Check) │   │
│   └──────────────────────────┬──────────────────────────┘   │
│                              │ Authenticated                │
│   ┌──────────────────────────▼──────────────────────────┐   │
│   │ Daily Onboarding Gate                               │   │
│   │ ├─ Step 1: 3 Focus Sliders (Total, Deep, REM)       │   │
│   │ └─ Step 2: "Gewohnheiten & Einflüsse" Multiselect   │   │
│   └──────────────────────────┬──────────────────────────┘   │
│                              │ Completed                    │
│   ┌──────────────────────────▼──────────────────────────┐   │
│   │ Main Layout with Bottom Navigation                  │   │
│   │ ├─ [Heute]      Today's Sleep & Habit Status / Edit │   │
│   │ ├─ [Statistik]  Correlation & Synergies Engine      │   │
│   │ └─ [Anpassen]   Custom Factor Management            │   │
│   └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

#### Firestore-Datenstruktur (Keine Speicherung sensibler Daten):
- `/usernames/{usernameLower}`: `{ uid: string, createdAt: timestamp }` (zur eindeutigen Verfügbarkeitsprüfung).
- `/users/{uid}`: `{ username: string, createdAt: timestamp }`.
- `/users/{uid}/sleepLogs/{date}`: `{ date: 'YYYY-MM-DD', totalMinutes: number, deepMinutes: number, remMinutes: number, activeFactors: string[], updatedAt: timestamp }`.
- `/users/{uid}/factors/{factorId}`: `{ id: string, name: string, isDefault: boolean, createdAt: timestamp }`.

---

### 5. Verification & Test Plan

1. **Auth & Username-Validation**:
   - Registrierung mit doppeltem Nutzernamen verhindern, erfolgreiche Neuregistrierung und Login über Firebase Auth.
2. **Morning-Slider-Flow**:
   - Nur 3 Regler sichtbar beim ersten Öffnen, präzise Konvertierung in Stunden und Minuten, nahtloser Übergang zu den Gewohnheiten.
3. **Statistik & Korrelations-Engine**:
   - Überprüfung mathematischer Konsistenz der Prozentabweichungen (Einzelfaktoren + Kombinations-Synergien).
   - Test mit dem 14-Tage-Beispieldatensatz zur Validierung aller Diagramme.
4. **Flat Design & Dark Mode**:
   - Prüfung, dass keine Gradients oder 3D-Schatten vorhanden sind; Verifikation der automatischen System-Farbschema-Umschaltung.
5. **Code-Kompilierung**:
   - Ausführung von `compile_applet` zur Bestätigung fehlerfreier TypeScript- und Bundle-Erstellung.
