// ── Base Types ──

export type TicketType = 'user-story' | 'bug-report';

/** Auswahl für KI-Generierung: User Story, Bug Report oder Copy Tabelle. */
export type TicketTypeChoice = 'user-story' | 'bug' | 'copy-table';

/** Detaillierungsgrad bei der KI-Generierung: beeinflusst Anzahl der ACs und Umfang der Flows. */
export type DetailLevel = 'compact' | 'standard' | 'detailed';

export type ProjectType = 'aokn' | 'healthmatch';

export type StoryItem = UserStory | BugReport;

/** Ordner für die Strukturierung von Stories. */
export interface Folder {
  id: string;
  name: string;
  /** null = Root-Ordner. */
  parentId: string | null;
}

/** Ein Flow ist eine Liste von Schritten. Mehrere Flows pro Typ möglich. */
export type FlowSteps = string[];

/** Nutzerflows (DE): happyFlows und fehlerszenarien sind Arrays von Flows. */
export interface NutzerflowsDE {
  /** Mehrere Happy Flows möglich (jeder Flow = Array von Schritten). */
  happyFlows: FlowSteps[];
  /** Mehrere Fehlerszenario-Flows möglich. */
  fehlerszenarien?: FlowSteps[];
}

/** User Flows (EN): happyPaths und errorScenarios sind Arrays von Flows. */
export interface UserFlowsEN {
  /** Mehrere Happy Paths möglich (jeder Flow = Array von Schritten). */
  happyPaths: FlowSteps[];
  /** Mehrere Error-Scenario-Flows möglich. */
  errorScenarios?: FlowSteps[];
}

// ── User Story Content (DE) ──

export interface UserStoryDEContent {
  beschreibung: string;
  akzeptanzkriterien: string[];
  voraussetzungen: string[];
  nutzerflows: NutzerflowsDE;
  outOfScope: string[];
}

// ── User Story Content (EN) ──

export interface UserStoryENContent {
  description: string;
  acceptanceCriteria: string[];
  todos: { be: string[]; fe: string[]; qa: string[] };
  roles: string;
  prerequisites: string[];
  userFlows: UserFlowsEN;
  outOfScope: string[];
}

// ── Story Template (für leere User Stories) ──

export interface StoryTemplate {
  id: string;
  name: string;
  de: UserStoryDEContent;
  en: UserStoryENContent;
}

/** Prompt-Vorlage: Füllt das KI-Eingabefeld mit vordefiniertem Text. */
export interface PromptTemplate {
  id: string;
  /** Kurzer Anzeigename (für Buttons). */
  name: string;
  /** Vollständiger Name (für Tooltip). */
  nameLong?: string;
  prompt: string;
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
  /** Erstellungsdatum (ISO-String). */
  createdAt?: string;
  title: string;
  titleEN?: string;
  project?: ProjectType;
  de: UserStoryDEContent;
  en: UserStoryENContent;
  /** Gemeinsame Links/Ressourcen (DE+EN) – ein Eintrag für Krankenkasse und Entwickler */
  links: string[];
  /** Jira-Ticket (z.B. PROJ-123 oder URL) – optionaler Abschnitt im Markdown */
  jiraTicket?: string;
  /** Aufwandsschätzung (PD) – optionaler Abschnitt, kann leer sein */
  efforts?: { be?: number; fe?: number; qa?: number };
  /** UI-Texte (Element, DE, EN) – Teil der Story, neu generierbar */
  copyBook: CopyBookEntry[];
  /** Design-Bilder (base64) – für Extraktion und Regenerierung */
  images: string[];
  /** Ordner-ID für die Zuordnung zu einem Ordner. null/undefined = Root. */
  folderId?: string | null;
  /** Sortierreihenfolge innerhalb des Ordners (niedriger = weiter oben). */
  order?: number;
}

// Legacy types (für Migration alter gespeicherter Stories / AI-Response)
export interface UserStoryDE {
  id: string;
  type: 'user-story-de';
  beschreibung: string;
  akzeptanzkriterien: string[];
  voraussetzungen: string[];
  nutzerflows: NutzerflowsDE | { happyFlow?: string[]; fehlerszenario?: string[] };
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
  userFlows: UserFlowsEN | { happyPath?: string[]; errorScenario?: string[] };
  resources: string[];
  outOfScope: string[];
}

// ── Bug Report (DE + EN) ──

export interface BugReportContent {
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

export interface BugReport {
  id: string;
  type: 'bug-report';
  /** Erstellungsdatum (ISO-String). */
  createdAt?: string;
  project?: ProjectType;
  /** Ordner-ID für die Zuordnung zu einem Ordner. null/undefined = Root. */
  folderId?: string | null;
  /** Sortierreihenfolge innerhalb des Ordners (niedriger = weiter oben). */
  order?: number;
  /** Screenshots/Design-Bilder (base64) */
  images?: string[];
  de: BugReportContent;
  en: BugReportContent;
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

/** Hintergrund der Hauptansicht: Plain-Farben oder Bild-Assets. @deprecated Nutze backgroundImage + backgroundColor. */
export type BackgroundOption =
  | 'plain-dark'
  | 'plain-navy'
  | 'plain-forest'
  | 'plain-burgundy'
  | 'plain-slate'
  | 'plain-light'
  | 'plain-cream'
  | 'plain-sky'
  | 'plain-mint'
  | 'plain-lavender'
  | 'plain-peach'
  | 'plain-coral'
  | 'plain-electric'
  | 'plain-sunset'
  | 'image-annie'
  | 'image-emile'
  | 'image-howard'
  | 'image-kari'
  | 'image-nubelson';

/** Farbe für Hintergrund (ohne Bild) oder als Overlay über Bild. */
export type BackgroundColorKey =
  | 'dark'
  | 'navy'
  | 'forest'
  | 'burgundy'
  | 'slate'
  | 'light'
  | 'cream'
  | 'sky'
  | 'mint'
  | 'lavender'
  | 'peach'
  | 'coral'
  | 'electric'
  | 'sunset';

/** Bild-Asset für Hintergrund (optional, kann mit Farbe kombiniert werden). */
export type BackgroundImageKey = 'annie' | 'emile' | 'howard' | 'kari' | 'nubelson';

/** Schriftart-Optionen für die Oberfläche. */
export type FontOption =
  | 'source-sans-3'
  | 'inter'
  | 'ibm-plex-sans'
  | 'open-sans'
  | 'lato'
  | 'work-sans'
  | 'nunito'
  | 'plus-jakarta-sans'
  | 'outfit'
  | 'manrope';

/** OpenAI-Modelle (Vision-fähig für Bildanalyse). */
export type OpenAIModel =
  | 'gpt-5.4'
  | 'gpt-4.1'
  | 'gpt-4.1-mini'
  | 'o4-mini'
  | 'gpt-4o'
  | 'gpt-4o-mini'
  | 'gpt-4-turbo'
  | 'gpt-4';

/** Claude-Modelle (Vision-fähig). */
export type AnthropicModel =
  | 'claude-sonnet-4-6'
  | 'claude-opus-4-6'
  | 'claude-haiku-4-5'
  | 'claude-sonnet-4'
  | 'claude-opus-4'
  | 'claude-3-5-sonnet-20241022'
  | 'claude-3-5-haiku-20241022'
  | 'claude-3-opus-20240229'
  | 'claude-3-sonnet-20240229'
  | 'claude-3-haiku-20240307';

export interface Settings {
  /** @deprecated Nutze apiKeyOpenAI / apiKeyAnthropic. Fallback für Migration. */
  apiKey?: string;
  apiKeyOpenAI?: string;
  apiKeyAnthropic?: string;
  modelOpenAI?: OpenAIModel;
  modelAnthropic?: AnthropicModel;
  provider: AIProvider;
  defaultLang: 'de' | 'en';
  defaultTicketType: 'user-story' | 'bug';
  /** Standard-Projekt bei neuer Story. */
  defaultProject?: ProjectType;
  /** Projekt-Auswahl bei neuer Story anzeigen (false = nur defaultProject verwenden). */
  showProjectOption?: boolean;
  /** @deprecated Migration: wird in customSystemPromptDE/EN übernommen. */
  customSystemPrompt?: string;
  /** Angepasster System-Prompt für Deutsch. Leer = Standard-Prompt. */
  customSystemPromptDE?: string;
  /** Angepasster System-Prompt für Englisch. Leer = Standard-Prompt. */
  customSystemPromptEN?: string;
  /** Markdown-Überschriften: h1 (#), h2 (##), h3 (###). Standard: h3 für Jira/Confluence. */
  markdownHeadingLevel?: MarkdownHeadingLevel;
  /** Konfigurierbare Links pro Tenant (AOKN, Vitagroup). */
  tenantLinks?: TenantLinks;
  /** Standard-Tenant für Markdown-Link (wird in MarkdownPreview überschrieben). */
  markdownLinkTenant?: MarkdownLinkTenant;
  /** Standard: Design-Bilder beim Markdown-Kopieren einbinden. false = Bilder aus (z.B. für Jira). */
  markdownIncludeImages?: boolean;
  /** Standard: Copy-Book-Tabelle (UI-Texte) beim Markdown-Kopieren einbinden. */
  markdownIncludeCopyBook?: boolean;
  /** Standard: Jira-Ticket-Abschnitt beim Markdown-Kopieren einbinden. */
  markdownIncludeJiraTicket?: boolean;
  /** Standard: To-Do's (BE/FE/QA) beim Markdown-Kopieren einbinden. */
  markdownIncludeTodos?: boolean;
  /** Standard: Aufwände (PD) beim Markdown-Kopieren einbinden. */
  markdownIncludeEfforts?: boolean;
  /** @deprecated Migration: Nutze backgroundImage + backgroundColor. */
  background?: BackgroundOption;
  /** Bild-Asset für Hintergrund (null/undefined = kein Bild). Kann mit backgroundColor kombiniert werden. */
  backgroundImage?: BackgroundImageKey | null;
  /** Farbe: als Vollton (ohne Bild) oder als Overlay über Bild. */
  backgroundColor?: BackgroundColorKey;
  /** Schriftart der Oberfläche. */
  font?: FontOption;
  /** Benutzerdefinierte Vorlagen für leere User Stories. */
  templates?: StoryTemplate[];
  /** Benutzerdefinierte Prompt-Vorlagen (füllen das KI-Eingabefeld). */
  promptTemplates?: PromptTemplate[];
  /** E-Mail-Adresse des Nutzers (für Vorschläge und Admin-Erkennung). */
  userEmail?: string;
}
