// ── Base Types ──

export type TicketType = 'user-story' | 'bug-report';

export type ProjectType = 'aokn' | 'healthmatch';

export type StoryItem = UserStory | BugReport;

// ── User Story Content (DE) ──

export interface UserStoryDEContent {
  beschreibung: string;
  akzeptanzkriterien: string[];
  voraussetzungen: string[];
  nutzerflows: {
    happyFlow: string[];
    fehlerszenario?: string[];
  };
  outOfScope: string[];
}

// ── User Story Content (EN) ──

export interface UserStoryENContent {
  description: string;
  acceptanceCriteria: string[];
  todos: { be: string[]; fe: string[]; qa: string[] };
  roles: string;
  prerequisites: string[];
  userFlows: {
    happyPath: string[];
    errorScenario?: string[];
  };
  outOfScope: string[];
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
  project?: ProjectType;
  de: UserStoryDEContent;
  en: UserStoryENContent;
  /** Gemeinsame Links/Ressourcen (DE+EN) – ein Eintrag für Krankenkasse und Entwickler */
  links: string[];
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
  voraussetzungen: string[];
  nutzerflows: { happyFlow: string[]; fehlerszenario?: string[] };
  anhaenge: string[];
  outOfScope: string[];
  jiraTicket: string;
}
export interface UserStoryEN {
  id: string;
  type: 'user-story-en';
  description: string;
  acceptanceCriteria: string[];
  todos: { be: string[]; fe: string[]; qa: string[] };
  roles: string;
  prerequisites: string[];
  userFlows: { happyPath: string[]; errorScenario?: string[] };
  resources: string[];
  outOfScope: string[];
}

// ── Bug Report (DE/EN) ──

export interface BugReport {
  id: string;
  type: 'bug-report';
  lang: 'de' | 'en';
  project?: ProjectType;
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

/** Konfigurierbare Links pro Tenant (z.B. Barrierefreiheits-Seite). */
export interface TenantLinks {
  aokn?: { accessibilityPage?: string };
  vitagroup?: { accessibilityPage?: string };
}

export type MarkdownLinkTenant = 'none' | 'aokn' | 'vitagroup';

export interface Settings {
  apiKey?: string;
  provider: AIProvider;
  defaultLang: 'de' | 'en';
  defaultTicketType: 'user-story' | 'bug';
  /** Optional: Custom system prompt for story generation. Overrides default when set. */
  customSystemPrompt?: string;
  /** Markdown-Überschriften: h1 (#), h2 (##), h3 (###). Standard: h3 für Jira/Confluence. */
  markdownHeadingLevel?: MarkdownHeadingLevel;
  /** Konfigurierbare Links pro Tenant (AOKN, Vitagroup). */
  tenantLinks?: TenantLinks;
  /** Standard-Tenant für Markdown-Link (wird in MarkdownPreview überschrieben). */
  markdownLinkTenant?: MarkdownLinkTenant;
}
