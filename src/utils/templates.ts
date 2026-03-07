import type { UserStory, UserStoryDE, UserStoryEN, BugReport } from '../types/story';

const DE_CONTENT = {
  beschreibung: 'Als [Rolle] möchte ich [Ziel], damit [Nutzen].',
  akzeptanzkriterien: [
    'AC1: [Testbar, messbar, nachvollziehbar]',
    'AC2: [Beispiele/Randfälle einschließen]',
    'AC3: [Nicht-funktionale Anforderungen: Technik, UX, Performance, Sicherheit, Datenschutz]',
  ],
  voraussetzungen: '[Feature Flags, Daten, Freigaben]',
  nutzerflows: {
    happyFlow: ['1. User …', '2. System …', '3. System …', '4. System …'],
    fehlerszenario: [
      '1. User …',
      '2. System erkennt [Bedingung].',
      '3. System zeigt Fehlermeldung.',
      '4. Zurück zur Maske stellt Eingaben wieder her.',
    ],
  },
  anhaenge: '[Designs, APIs, Schemas]',
  outOfScope: '[Explizit Nicht-Bestandteil]',
  jiraTicket: '[Link oder Referenz]',
};

const EN_CONTENT = {
  description: 'As a [role] I want [goal], so that [benefit].',
  acceptanceCriteria: [
    'AC1: [Testable, measurable, verifiable]',
    'AC2: [Include examples/edge cases]',
    'AC3: [Non-functional: tech, UX, performance, security, privacy]',
  ],
  todos: { be: [] as string[], fe: [] as string[], qa: [] as string[] },
  roles: '[Users, stakeholders]',
  prerequisites: '[Feature flags, data, approvals]',
  userFlows: {
    happyPath: ['1. User …', '2. System …', '3. System …', '4. System …'],
    errorScenario: [
      '1. User …',
      '2. System detects [condition].',
      '3. System shows error message.',
      '4. Back to form restores inputs.',
    ],
  },
  resources: '[Designs, APIs, schemas]',
  outOfScope: '[Explicitly not included]',
};

export function createUserStory(id: string, title = 'User Story'): UserStory {
  return {
    id,
    type: 'user-story',
    title,
    de: { ...DE_CONTENT },
    en: { ...EN_CONTENT },
    copyBook: [],
    images: [],
  };
}

export function createUserStoryDE(id: string): UserStoryDE {
  return { id, type: 'user-story-de', ...DE_CONTENT };
}

export function createUserStoryEN(id: string): UserStoryEN {
  return { id, type: 'user-story-en', ...EN_CONTENT };
}

export function createBugReport(id: string, lang: 'de' | 'en'): BugReport {
  const base = {
    id,
    type: 'bug-report' as const,
    lang,
    title: '',
    description: '',
    expectedResult: '',
    actualResult: '',
    stepsToReproduce: ['', '', ''],
    technicalDetails: '',
    severityPriority: '',
    resources: '',
    outOfScope: '',
  };

  if (lang === 'de') {
    return {
      ...base,
      title: '[Kurzer, präziser Fehlername]',
      description: '[Kurze Problembeschreibung; Kontext; betroffene Funktion]',
      expectedResult: '[Beschreibung des Soll-Verhaltens]',
      actualResult: '[Beschreibung des Ist-Verhaltens]',
      stepsToReproduce: [
        '[Konkreter Schritt mit Daten]',
        '[Umgebung, Build, Zeitstempel]',
        '[Erwartetes vs. tatsächliches Ergebnis]',
      ],
      technicalDetails: '[Logs, Error Codes, Endpoints, Versionen, Device/OS, Feature Flags]',
      severityPriority: '[Business Impact, medizinische Relevanz, User Impact]',
      resources: '[Screenshots, Logs, Links]',
      outOfScope: '[Explizit Nicht-Bestandteil]',
    };
  }

  return {
    ...base,
    title: '[Short, precise title]',
    description: '[Brief problem; context; affected function]',
    expectedResult: '[Description of expected behavior]',
    actualResult: '[Description of actual behavior]',
    stepsToReproduce: [
      '[Concrete step with data]',
      '[Environment, build, timestamp]',
      '[Expected vs actual result]',
    ],
    technicalDetails: '[Logs, Error Codes, Endpoints, Versions, Device/OS, Feature Flags]',
    severityPriority: '[Business Impact, medical relevance, User Impact]',
    resources: '[Screenshots, Logs, Links]',
    outOfScope: '[Explicitly not included]',
  };
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
