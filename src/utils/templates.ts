import type { UserStory, UserStoryDE, UserStoryEN, BugReport, BugReportContent, StoryTemplate, PromptTemplate } from '../types/story';

const DE_CONTENT = {
  beschreibung: 'Als [Rolle] möchte ich [Ziel], damit [Nutzen].',
  akzeptanzkriterien: [
    '[Testbar, messbar, nachvollziehbar]',
    '[Beispiele/Randfälle einschließen]',
    '[Nicht-funktionale Anforderungen: Technik, UX, Performance, Sicherheit, Datenschutz]',
  ],
  voraussetzungen: ['[Feature Flags, Daten, Freigaben]'],
  nutzerflows: {
    happyFlow: ['1. User …', '2. System …', '3. System …', '4. System …'],
    fehlerszenario: [
      '1. User …',
      '2. System erkennt [Bedingung].',
      '3. System zeigt Fehlermeldung.',
      '4. Zurück zur Maske stellt Eingaben wieder her.',
    ],
  },
  outOfScope: ['[Explizit Nicht-Bestandteil]'],
};

const EN_CONTENT = {
  description: 'As a [role] I want [goal], so that [benefit].',
  acceptanceCriteria: [
    '[Testable, measurable, verifiable]',
    '[Include examples/edge cases]',
    '[Non-functional: tech, UX, performance, security, privacy]',
  ],
  todos: { be: [] as string[], fe: [] as string[], qa: [] as string[] },
  roles: '[Users, stakeholders]',
  prerequisites: ['[Feature flags, data, approvals]'],
  userFlows: {
    happyPath: ['1. User …', '2. System …', '3. System …', '4. System …'],
    errorScenario: [
      '1. User …',
      '2. System detects [condition].',
      '3. System shows error message.',
      '4. Back to form restores inputs.',
    ],
  },
  outOfScope: ['[Explicitly not included]'],
};

export function createUserStory(id: string, title = 'User Story'): UserStory {
  return {
    id,
    type: 'user-story',
    createdAt: new Date().toISOString(),
    title,
    de: { ...DE_CONTENT },
    en: { ...EN_CONTENT },
    links: [],
    copyBook: [],
    images: [],
  };
}

export function createUserStoryDE(id: string): UserStoryDE {
  return { id, type: 'user-story-de', ...DE_CONTENT, anhaenge: ['[Designs, APIs, Schemas]'], jiraTicket: '[Link oder Referenz]' };
}

export function createUserStoryEN(id: string): UserStoryEN {
  return { id, type: 'user-story-en', ...EN_CONTENT, resources: ['[Designs, APIs, schemas]'] };
}

const BUG_CONTENT_DE: BugReportContent = {
  title: '[Kurzer, präziser Fehlername]',
  description: '[Kurze Problembeschreibung; Kontext; betroffene Funktion]',
  expectedResult: '[Beschreibung des Soll-Verhaltens]',
  actualResult: '[Beschreibung des Ist-Verhaltens]',
  stepsToReproduce: ['[Konkreter Schritt mit Daten]', '[Umgebung, Build, Zeitstempel]', '[Erwartetes vs. tatsächliches Ergebnis]'],
  technicalDetails: '[Logs, Error Codes, Endpoints, Versionen, Device/OS, Feature Flags]',
  severityPriority: '[Business Impact, medizinische Relevanz, User Impact]',
  resources: '[Screenshots, Logs, Links]',
  outOfScope: '[Explizit Nicht-Bestandteil]',
};

const BUG_CONTENT_EN: BugReportContent = {
  title: '[Short, precise title]',
  description: '[Brief problem; context; affected function]',
  expectedResult: '[Description of expected behavior]',
  actualResult: '[Description of actual behavior]',
  stepsToReproduce: ['[Concrete step with data]', '[Environment, build, timestamp]', '[Expected vs actual result]'],
  technicalDetails: '[Logs, Error Codes, Endpoints, Versions, Device/OS, Feature Flags]',
  severityPriority: '[Business Impact, medical relevance, User Impact]',
  resources: '[Screenshots, Logs, Links]',
  outOfScope: '[Explicitly not included]',
};

export function createBugReport(id: string, _lang?: 'de' | 'en'): BugReport {
  return {
    id,
    type: 'bug-report',
    createdAt: new Date().toISOString(),
    de: { ...BUG_CONTENT_DE },
    en: { ...BUG_CONTENT_EN },
  };
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Standard-Vorlage für leere User Stories. */
export function getDefaultTemplate(): StoryTemplate {
  return {
    id: 'default',
    name: 'Standard',
    de: { ...DE_CONTENT },
    en: { ...EN_CONTENT },
  };
}

/** Standard-Prompt-Vorlagen für die KI-Generierung. */
const DEFAULT_PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: 'new-feature',
    name: 'Neue Funktion',
    nameLong: 'Neue Funktionalität',
    prompt: 'Als [Rolle] möchte ich [neue Funktionalität], damit [Nutzen].\n\nKontext: [Beschreibung des Features]\nBetroffene Bereiche: [z.B. UI, Backend, API]\nAbhängigkeiten: [z.B. andere Stories, externe Systeme]',
  },
  {
    id: 'api-integration',
    name: 'API Integration',
    prompt: 'Integration einer externen API:\n\n- API/System: [Name, z.B. FHIR, REST-API]\n- Zweck: [Was soll die Integration ermöglichen?]\n- Datenfluss: [Welche Daten werden ausgetauscht?]\n- Authentifizierung: [OAuth, API-Key, etc.]\n- Fehlerbehandlung: [Retry, Fallback, Fehlermeldungen]',
  },
  {
    id: 'bug-report',
    name: 'Bug Report',
    prompt: 'Bug-Beschreibung:\n\n- Betroffene Funktion: [Wo tritt der Fehler auf?]\n- Erwartetes Verhalten: [Was sollte passieren?]\n- Tatsächliches Verhalten: [Was passiert stattdessen?]\n- Schritte zur Reproduktion: [1. … 2. … 3. …]\n- Umgebung: [Browser, OS, Version]',
  },
  {
    id: 'data-privacy',
    name: 'Datenschutz',
    nameLong: 'Datenschutz / DSGVO',
    prompt: 'Datenschutz-Anforderung:\n\n- Verarbeitete Daten: [Welche personenbezogenen Daten?]\n- Rechtsgrundlage: [Einwilligung, Vertrag, etc.]\n- Speicherdauer: [Wie lange werden Daten gehalten?]\n- Betroffenenrechte: [Auskunft, Löschung, etc.]\n- Technische Maßnahmen: [Verschlüsselung, Zugriffskontrolle]',
  },
  {
    id: 'ui-improvement',
    name: 'UI/UX',
    nameLong: 'UI/UX Verbesserung',
    prompt: 'UI/UX Anpassung:\n\n- Betroffener Bereich: [z.B. Formular, Navigation, Dashboard]\n- Aktueller Zustand: [Was ist das Problem?]\n- Gewünschter Zustand: [Wie soll es aussehen/funktionieren?]\n- Zielgruppe: [Für wen?]\n- Barrierefreiheit: [Anforderungen]',
  },
  {
    id: 'migration',
    name: 'Migration',
    nameLong: 'Migration / Umstellung',
    prompt: 'Migration/Umstellung:\n\n- Von: [Altes System/Format]\n- Nach: [Neues System/Format]\n- Betroffene Daten: [Welche Daten werden migriert?]\n- Downtime: [Geplant? Vermeidbar?]\n- Rollback-Strategie: [Bei Fehlern]',
  },
  {
    id: 'accessibility',
    name: 'Barrierefreiheit',
    prompt: 'Barrierefreiheit (WCAG):\n\n- Betroffener Bereich: [z.B. Formular, Navigation, PDF]\n- Anforderungen: [WCAG 2.1 Level AA, BFSG, etc.]\n- Besonderheiten: [Screenreader, Tastatur, Kontrast]\n- Prüfmethoden: [Manuell, axe, Lighthouse]',
  },
];

/** Liefert alle Prompt-Vorlagen (Standard + benutzerdefiniert). */
export function getPromptTemplates(custom?: PromptTemplate[]): PromptTemplate[] {
  return [...DEFAULT_PROMPT_TEMPLATES, ...(custom ?? [])];
}

/** Erstellt eine User Story aus einer Vorlage. */
export function createUserStoryFromTemplate(id: string, template: StoryTemplate, title = 'User Story'): UserStory {
  return {
    id,
    type: 'user-story',
    createdAt: new Date().toISOString(),
    title,
    de: { ...template.de },
    en: { ...template.en },
    links: [],
    copyBook: [],
    images: [],
  };
}
