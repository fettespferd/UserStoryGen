# UserStoryGen

Web-App zur Erstellung und Bearbeitung von User Stories und Bug Reports in Deutsch und Englisch. Im Stil von etf-profit (React, MUI, TypeScript, Dark Theme).

## Features

- **User Stories** (DE/EN) nach Jira/Confluence-Vorlagen
- **Bug Reports** (DE/EN) mit strukturiertem Format
- **Feldweise Bearbeitung** – jedes Feld einzeln editierbar
- **Markdown-Export** – Copy-Button für Jira/Confluence
- **KI-Generierung** – OpenAI oder Anthropic (optional)
- **Lokaler Ordner-Speicher** – File System Access API (Chrome/Edge)

## Voraussetzungen

- Node.js >= 18
- Chrome oder Edge (für Ordner-Speicher)

## Installation

```bash
npm install
```

## Entwicklung

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Tests

```bash
npm test
```

## Nutzung

1. **Ordner auswählen** – Klicke auf das Zahnrad (Einstellungen) und wähle einen Ordner für die Speicherung
2. **Neue Story erstellen** – Wähle User Story DE/EN oder Bug DE/EN
3. **Felder bearbeiten** – Klicke auf ein Feld zum Bearbeiten, speichere mit Häkchen
4. **Markdown kopieren** – Nutze den "Copy Markdown"-Button für Jira/Confluence
5. **KI-Generierung** (optional) – API-Key in Einstellungen hinterlegen, Stichpunkte eingeben, generieren

## Speicherstruktur

```
<UserStoryGen-Ordner>/
├── settings.json
└── user-stories/
    ├── story-xxx.json
    └── bug-yyy.json
```
