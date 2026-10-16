# Vien Noir: Google Analytics fertig einrichten

Mess-ID: `G-WDV9MK1299`  
Stand: 16. Oktober 2026

## 1. Vor dem Veröffentlichen

Die Website-Dateien sind vorbereitet. Einstellungen innerhalb eurer GA4-Property
wurden nicht geändert und müssen wie unten beschrieben eingerichtet werden.
Google Tag Manager und ein zusätzliches Cookie-Banner sind nicht erforderlich.
Den ursprünglich von Google angebotenen gtag-Code NICHT noch einmal einfügen:
Er würde die Einwilligung umgehen oder doppelte Messungen verursachen.

Das ZIP enthält den gesamten bereitgestellten Website-Code mit den Anpassungen.
Bilder und Videos waren bereits im Ausgangs-ZIP nicht enthalten. Kopiert den
INHALT des Ordners `viennoir-ga4` in das bestehende Website-Verzeichnis und
überschreibt die gleichnamigen Dateien. Bestehende Bilder, Videos und andere
Medien NICHT löschen. Nicht den neuen Ordner als zusätzliches Unterverzeichnis
veröffentlichen. Domain, CNAME, Formulare und bestehende Ticket-URLs bleiben erhalten.

Die Datenschutzhinweise wurden technisch-inhaltlich erweitert. Vor dem Livegang
müssen der Betreiber die Angaben, seine Google-Vertragsbedingungen und die
Drittlandübermittlungen prüfen beziehungsweise rechtlich prüfen lassen.
Die Implementierung ist keine pauschale Bestätigung der DSGVO-Konformität.
Es gibt eine lokale Einwilligungsverwaltung, kein externes CMP-Dashboard und
kein zusätzliches serverseitiges Einwilligungsarchiv.

## 2. GA4: Google-Signale aktivieren

Die passende Property öffnen, dann:

**Verwaltung > Datenerhebung und -änderung > Datenerhebung >
Datenerhebung durch Google-Signale aktivieren**.

Google-Signale einschalten, die angezeigten Voraussetzungen lesen und nur bei
Erfüllung bestätigen. Bei der Regionsauswahl insbesondere Österreich nicht
versehentlich ausschließen. Die Website erlaubt diese Funktion trotzdem nur
Besuchern, die zusätzlich „Demografie & Interessen“ zugestimmt haben.

Die Einstellung für **personalisierte Anzeigen** bitte ausgeschaltet lassen
beziehungsweise für alle relevanten Regionen deaktivieren. Sie ist von
Google-Signalen getrennt. Der Website-Code sendet immer
`ad_personalization: denied` und `allow_ad_personalization_signals: false`.
Für die jetzige Auswertung keine Google-Ads-/Remarketing-Verknüpfung einrichten.
Die Erhebung **von Nutzern bereitgestellter Daten** nicht aktivieren: Wir
übermitteln keine E-Mail-Adressen, User-IDs oder Formularinhalte für Google-Abgleiche.

Google-Signale liefern nur für einen Teil der Besucher Daten. Entscheidend sind
unter anderem deren Zustimmung und Google-Kontoeinstellungen. Bei kleinen
Datenmengen kann Google demografische Angaben ganz ausblenden. Ein leerer
Demografie-Bericht ist daher nicht automatisch ein technischer Fehler.

## 3. GA4: automatische Zusatzmessungen ausschalten

**Verwaltung > Datenstreams > Web-Datenstream mit der Mess-ID G-WDV9MK1299**.

Den Schalter **Optimierte Analysen / Enhanced Measurement ausschalten**.
Die Website sendet den Seitenaufruf und ihre ausgewählten Ereignisse selbst.
So entstehen keine zusätzlichen automatischen Klick-, Such-, Video- oder
Formularereignisse. Insbesondere keine separate GA4-Regel erstellen, die aus
jedem ausgehenden `click` zusätzlich ein `ticket_click` macht.
Automatische GA4-Basisereignisse wie `session_start`, `first_visit` oder
`user_engagement` sind davon zu unterscheiden und können weiter erscheinen.

Unter **Datenentfernung / Redact data** die Erkennung von E-Mail-Adressen
aktivieren beziehungsweise aktiviert lassen. Zusätzlich können sensible
URL-Parameter wie `email`, `EMAIL`, `email_address`, `name`, `phone`, `message`
und `token` eingetragen werden. Der eigene Website-Code entfernt nicht
freigegebene URL-Parameter bereits vor seinen Ereignissen. Diese Einstellung
ist eine zusätzliche Absicherung, kein Ersatz für sorgfältige Datenminimierung.

**Vindobona und Eventjet NICHT als eigene Domains für domainübergreifendes
Tracking eintragen.** Es gibt keine entsprechende Integration in deren Shop.
Ein solcher Eintrag macht Ticketkäufe nicht sichtbar.

## 4. GA4: Aufbewahrung passend zum Datenschutzhinweis einstellen

Unter **Verwaltung > Datenerhebung und -änderung > Datenaufbewahrung**:

- Aufbewahrung der Nutzer-/Ereignisdaten: **2 Monate**.
- **Nutzerdaten bei neuer Aktivität zurücksetzen: aus**.

Diese Werte sind im beigefügten Datenschutzhinweis vorgesehen. Die
Aufbewahrungseinstellung betrifft nicht die gewöhnlichen aggregierten
Standardberichte; diese können länger verfügbar bleiben. Für eine spätere
Änderung auf 14 Monate müssten auch die Datenschutzhinweise angepasst werden.
Die lokalen Einwilligungen und die GA-Cookies haben getrennt davon eine
maximale Laufzeit von 180 Tagen. Cookie-Laufzeiten werden nicht bei jedem
Seitenaufruf automatisch verlängert; Browser können sie weiter verkürzen.

Unter den Kontoeinstellungen außerdem die geltenden
**Datenverarbeitungsbedingungen** prüfen/akzeptieren und erforderliche
Kontaktangaben ergänzen. Nicht benötigte Datenfreigaben für andere
Google-Produkte sollten deaktiviert bleiben.

## 5. Ereignisse und Berichte vorbereiten

Folgende Ereignisse werden nach Einwilligung gesendet:

| Ereignis | Bedeutung |
|---|---|
| `page_view` | Aufruf einer Inhaltsseite; einmal bei Aktivierung auf dieser Seite |
| `show_view` | Aufruf einer Show- oder einzelnen Terminseite |
| `ticket_interest` | Interner Ticket-Button, z. B. zur Terminliste; noch kein Shop-Aufruf |
| `ticket_click` | Klick auf einen externen Ticketlink zu Vindobona/Eventjet |

Markiert **nur `ticket_click` als Schlüsselereignis**:
**Verwaltung > Datenanzeige > Ereignisse**. Nach dem ersten Testereignis kann
es dort entsprechend markiert werden. Die GA4-Oberfläche kann auch erlauben,
ein neues Schlüsselereignis direkt unter dem exakten Namen `ticket_click`
anzulegen. Keine zusätzliche Erstellungsregel für dasselbe Ereignis verwenden.
Die Zählmethode „Einmal pro Ereignis“ kann bestehen bleiben.

Unter **Verwaltung > Datenanzeige > Benutzerdefinierte Definitionen >
Benutzerdefinierte Dimension erstellen** folgende Dimensionen registrieren.
Der Gültigkeitsbereich ist jeweils **Ereignis**. Die Parameter exakt wie
angegeben schreiben; Name und Groß-/Kleinschreibung sind wichtig.

| Anzeigename | Ereignisparameter | Beispiel |
|---|---|---|
| Show | `show_name` | Santa Baby |
| Vorstellungstermin | `show_date` | 2026-11-28 |
| Button-Position | `button_position` | show_dates |
| Seitensprache | `page_language` | de / en |
| Seitentyp (optional) | `page_type` | show / event_detail / programme |
| Link-Zieldomain (optional) | `link_domain` | vindobona.wien |

Falls ein Parameter noch nicht im Auswahlfeld angezeigt wird, kann sein Name
in der Regel eingegeben werden. Die Daten werden nicht rückwirkend durch
späteres Registrieren einer Dimension ergänzt. Neue benutzerdefinierte
Dimensionen stehen nicht immer sofort in Standardberichten bereit.

Die Button-Positionen sind bewusst auf beiden Sprachen gleich:
`homepage_show_card`, `show_hero`, `show_dates`, `programme_dates`, `event_hero`
und `content`. Das ermöglicht gemeinsame Auswertungen für DE und EN.
Der Termin wird nur mitgegeben, wenn er aus dem Link beziehungsweise der
Terminzeile eindeutig zugeordnet werden kann. Unbekannte Termine werden
nicht erfunden.

Für einen Marketingbericht eignet sich eine explorative Tabelle mit
`show_name`, `show_date` und `button_position`, gefiltert auf
`event_name = ticket_click`. Als Kennzahlen `Ereignisanzahl` und `Nutzer`
nebeneinander verwenden: Eine Person kann mehrere Ticketklicks erzeugen.
Die Herkunft lässt sich mit Sitzung-Quelle/Medium beziehungsweise
Sitzung-Kampagne vergleichen. Keine Kaufquote aus diesen Klicks berechnen.

## 6. Marketinglinks zu eurer Website kennzeichnen

Beispiel für einen Instagram-Link zur Santa-Baby-Seite:

```text
https://viennoir.com/santa-baby-dinner-show/?utm_source=instagram&utm_medium=social&utm_campaign=santa_baby_2026&utm_content=reel_01
```

UTM-Parameter an Links VON Instagram, Newsletter usw. ZU eurer Website setzen,
nicht an interne Navigationslinks. Der Code erlaubt Kampagnenwerte aus
Buchstaben, Zahlen, Punkt, Unterstrich und Bindestrich mit maximal 100 Zeichen;
lange rein numerische Folgen werden verworfen. Einfache einheitliche Werte
wie `instagram`, `social`, `santa_baby_2026` und `reel_01` verwenden.

Keine Namen, E-Mail-Adressen, individuellen Kontaktkennungen oder andere
personenbezogenen Daten in Kampagnennamen verwenden. Fremde Query-Parameter,
URL-Fragmente und Werbeklick-IDs werden durch unsere eigene URL-Aufbereitung
nicht an die eigenen Ereignisse weitergegeben. Diese Variante ist bewusst
für UTM-basierte Auswertung ausgelegt, nicht für Google-Ads-Autotagging.

Die Messung startet erst auf der Seite, auf der Zustimmung erteilt wird.
Besuche oder Klicks vor der Zustimmung werden nicht nachträglich erfasst.

## 7. Live-Test nach dem Upload

1. Die veröffentlichte Website mit einem frischen Browserprofil öffnen.
   Ohne Interaktion mit dem Banner darf kein GA4-Skript geladen werden.
   In den Entwicklertools nach `gtag/js`, `google-analytics` oder `g/collect`
   filtern. Google-Fonts-Verbindungen gehören NICHT zu GA4 und sind
   unabhängig vom Banner bereits im ursprünglichen Projekt enthalten.
2. „Ablehnen“: Seite neu aufrufen und auf EN wechseln. Das Banner bleibt
   geschlossen, Google Analytics bleibt aus. Cloudflare bleibt unverändert.
3. Im Footer „Datenschutzeinstellungen“ öffnen. Nur „Statistik“
   einschalten und speichern. In GA4 unter Echtzeit die neuen Ereignisse
   kontrollieren. Werbe-/Google-Signale bleiben bei dieser Auswahl aus.
4. Eine Showseite und dann einen Ticketbutton aufrufen. `show_view` und
   `ticket_click` samt Show und Termin kontrollieren. Ein interner Sprung
   zur Terminliste muss stattdessen `ticket_interest` liefern.
5. Für DebugView die Website mit `?vn_debug=1` aufrufen, z. B.
   `https://viennoir.com/santa-baby-dinner-show/?vn_debug=1`.
   Auch dort ist vorherige Einwilligung erforderlich. Die Ereignisse
   tragen dann `debug_mode: true`. Den Parameter nicht für normale
   Kampagnenlinks verwenden.
6. Zusätzlich „Demografie & Interessen“ aktivieren. Die Consent-Werte
   für `ad_storage` und `ad_user_data` müssen auf `granted` wechseln;
   `ad_personalization` bleibt absichtlich `denied`.
7. Zustimmung im Footer wieder zurücknehmen. Die Seite wird neu geladen,
   die neue Seite darf GA4 nicht mehr laden. Zusätzlich in einem zweiten
   offenen Tab und auf einem echten iPhone prüfen. Beim Widerruf können
   nicht abgesendete Formulareingaben durch das Neuladen verloren gehen.

Bei Browser-Erweiterungen, Tracking-Schutz oder blockiertem Google-Skript
können trotz Zustimmung Ereignisse fehlen. Das ist nicht mit einem
funktionslosen Ticketlink gleichzusetzen. Cloudflare- und GA4-Zahlen werden
wegen der unterschiedlichen Erhebungsmethoden und Einwilligungen abweichen.

Die lokale Dateivorschau (`file://`) und normale localhost-Aufrufe senden
keine GA4-Daten. Für einen bewusst gestarteten localhost-Debug-Test steht
`?vn_debug=1` zur Verfügung; auch dieser benötigt eine Zustimmung.

## Technischer Umfang und Wartung

- 38 Inhaltsseiten sind eingebunden; 27 reine Weiterleitungsseiten bleiben
  ohne Tracking, damit ein Redirect nicht als zweiter Aufruf gezählt wird.
- 58 externe Ticket-Links und 26 interne Ticket-/Terminlinks sind markiert.
- Neu: `assets/js/privacy-analytics.js` und `assets/css/privacy-consent.css`.
- Geändert: HTML-Einbindung, ein Footer-Link je Inhaltsseite und die
  Datenschutzhinweise in DE/EN. Bestehende Website-JavaScriptdateien,
  sonstige CSS-Dateien, Formularziele und Ticket-URLs bleiben unverändert.
- Detaillierte Dateiliste: `tools/GA4-GEAENDERTE-DATEIEN.txt`.
- Bekannte Ticketzuordnungen: `tools/GA4-TICKET-ZUORDNUNG.json`.
  Achtung: Manche Vindobona-URLs enthalten „ladies-of-bond“, obwohl
  die Seite sie Season of Desire zuordnet. Die Implementierung übernimmt
  die im gelieferten Website-Code vorhandene Zuordnung, nicht den Slug.
- Bei neuen Shows/Terminen die `data-vn-*` Attribute prüfen und die
  Zuordnungstabelle im JavaScript bei Bedarf ergänzen. Die sichtbaren
  `data-event-start-at` Terminzeilen haben bei der Datumszuordnung Vorrang.
- Bei wesentlichen Zweckänderungen die Einwilligungstexte und
  `POLICY_VERSION` im JavaScript aktualisieren, damit neu gefragt wird.
- Das Banner setzt keine externe CMP-Bibliothek ein und benötigt keinen Server.

### Testumfang dieser Lieferung

DOM- und Layouttests mit Chromium, einschließlich Smartphone- und
Querformat-Ansichten, wurden ausgeführt. Dabei waren Browser-URL,
Speicherung, Reload und der Google-Skriptlader in der Testumgebung simuliert,
weil echte Browsernavigation hier gesperrt ist. Die produktiven Dateien
enthalten keine dieser Test-Doubles. Der Google-Code wurde nicht live
gegen eure Property getestet und es wurden keine Testdaten an GA4 gesendet.
Safari/WebKit beziehungsweise ein echtes iPhone konnten hier nicht getestet
werden. Das maschinenlesbare Protokoll nennt diese Grenzen ausdrücklich.

## Offizielle Dokumentation

Google-Signale und unabhängige Einstellung für personalisierte Anzeigen:
https://support.google.com/analytics/answer/9445345?hl=de

Basic Consent Mode:
https://developers.google.com/tag-platform/security/concepts/consent-mode

Consent-Implementierung und Referenz:
https://developers.google.com/tag-platform/security/guides/consent
https://support.google.com/analytics/answer/13802165?hl=en

Konfiguration von Cookies, URLs und Google-Signalen:
https://developers.google.com/analytics/devguides/collection/ga4/reference/config

Optimierte Analysen:
https://support.google.com/analytics/answer/9216061?hl=de

Benutzerdefinierte Dimensionen und Schlüsselereignisse:
https://support.google.com/analytics/answer/14240153?hl=de
https://support.google.com/analytics/answer/13366706?hl=de

Datenaufbewahrung und Datenentfernung:
https://support.google.com/analytics/answer/7667196?hl=de
https://support.google.com/analytics/answer/13544947?hl=de

Datenschutzhinweise der österreichischen Datenschutzbehörde:
https://dsb.gv.at/faqs/datenschutz-cookies
