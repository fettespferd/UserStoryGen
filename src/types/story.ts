// ── Base Types ──

export type TicketType = 'user-story' | 'bug-report';

export type StoryItem = UserStory | BugReport;

// ── User Story Content (DE) ──

export interface UserStoryDEContent {
  beschreibung: string;
  akzeptanzkriterien: string[];
  voraussetzungen: string;
  nutzerflows: {
    happyFlow: string[];
    fehlerszenario?: string[];
  };
  anhaenge: string;
  outOfScope: string;
  jiraTicket: string;
}

// ── User Story Content (EN) ──

export interface UserStoryENContent {
  description: string;
  acceptanceCriteria: string[];
  todos: { be: string[]; fe: string[]; qa: string[] };
  roles: string;
  prerequisites: string;
  userFlows: {
    happyPath: string[];
    errorScenario?: string[];
  };
  resources: string;
  outOfScope: string;
}

// ── Copy Book (UI-Texte pro Story) ──

export interface CopyBookEntry {
  elementName: string;
  textDE: string;
  textEN: string;
}

// ── User Story (DE + EN kombiniert) ──

export interface UserStory {
  id: string;
  type: 'user-story';
  title: string;
  de: UserStoryDEContent;
  en: UserStoryENContent;
  /** UI-Texte (Element, DE, EN) – Teil der Story, neu generierbar */
  copyBook: CopyBookEntry[];
  /** Design-Bilder (base64) – für Extraktion und Regenerierung */
  images: string[];
}

// Legacy types (für Migration alter gespeicherter Stories)
export interface UserStoryDE {
  id: string;
  type: 'user-story-de';
  beschreibung: string;
  akzeptanzkriterien: string[];
  voraussetzungen: string;
  nutzerflows: { happyFlow: string[]; fehlerszenario?: string[] };
  anhaenge: string;
  outOfScope: string;
  jiraTicket: string;
}
export interface UserStoryEN {
  id: string;
  type: 'user-story-en';
  description: string;
  acceptanceCriteria: string[];
  todos: { be: string[]; fe: string[]; qa: string[] };
  roles: string;
  prerequisites: string;
  userFlows: { happyPath: string[]; errorScenario?: string[] };
  resources: string;
  outOfScope: string;
}

// ── Bug Report (DE/EN) ──

export interface BugReport {
  id: string;
  type: 'bug-report';
  lang: 'de' | 'en';
  /** Screenshots/Design-Bilder (base64) */
  images?: string[];
  title: string;
  description: string;
  expectedResult: string;
  actualResult: string;
  stepsToReproduce: string[];
  technicalDetails: string;
  severityPriority: string;
  resources: string;
  outOfScope: string;
}

// ── Settings ──

export type AIProvider = 'openai' | 'anthropic';

export type MarkdownHeadingLevel = 'h1' | 'h2' | 'h3';

export interface Settings {
  apiKey?: string;
  provider: AIProvider;
  defaultLang: 'de' | 'en';
  defaultTicketType: 'user-story' | 'bug';
  /** Optional: Custom system prompt for story generation. Overrides default when set. */
  customSystemPrompt?: string;
  /** Markdown-Überschriften: h1 (#), h2 (##), h3 (###). Standard: h3 für Jira/Confluence. */
  markdownHeadingLevel?: MarkdownHeadingLevel;
}
