import type {
  UserStoryDE,
  UserStoryEN,
  UserStory,
  BugReport,
  MarkdownHeadingLevel,
  CopyBookEntry,
} from '../types/story';
import { stripAcPrefix, stripFlowStepNumber } from './format';

const HEADING_PREFIX: Record<MarkdownHeadingLevel, string> = {
  h1: '#',
  h2: '##',
  h3: '###',
};

function heading(level: MarkdownHeadingLevel, text: string): string {
  const prefix = HEADING_PREFIX[level];
  return `${prefix} **${text}**`;
}

export interface MarkdownOptions {
  headingLevel?: MarkdownHeadingLevel;
  /** Design-Bilder (base64 data URLs) – werden als Markdown-Bilder eingefügt */
  images?: string[];
  /** Copy-Book-Tabelle (Element, DE, EN) einbinden */
  includeCopyBook?: boolean;
  copyBook?: CopyBookEntry[];
  /** To-Do's (BE/FE/QA) einbinden – kann leer sein */
  includeTodos?: boolean;
  /** Efforts (PD) einbinden – kann leer sein */
  includeEfforts?: boolean;
  efforts?: { be?: number; fe?: number; qa?: number };
}

export function toMarkdown(
  item: UserStoryDE | UserStoryEN | UserStory | BugReport,
  activeLang?: 'de' | 'en',
  options?: MarkdownOptions
): string {
  const h = options?.headingLevel ?? 'h3';
  const images = options?.images ?? (item.type === 'user-story' ? (item as UserStory).images : undefined);
  const includeCopyBook = options?.includeCopyBook ?? true;
  const copyBook = options?.copyBook ?? (item.type === 'user-story' ? (item as UserStory).copyBook : undefined);
  const includeTodos = options?.includeTodos ?? true;
  const includeEfforts = options?.includeEfforts ?? false;
  const efforts = options?.efforts ?? (item.type === 'user-story' ? (item as UserStory).efforts : undefined);
  if (item.type === 'bug-report') return bugReportToMarkdown(item, activeLang ?? 'de', h);
  if (item.type === 'user-story') {
    const lang = activeLang ?? 'de';
    const todos = item.en?.todos;
    return lang === 'de'
      ? userStoryDEToMarkdown(item.de, h, item.links, images, includeCopyBook ? copyBook : undefined, includeTodos, includeEfforts, todos, efforts)
      : userStoryENToMarkdown(item.en, h, item.links, images, includeCopyBook ? copyBook : undefined, includeTodos, includeEfforts, efforts);
  }
  if (item.type === 'user-story-de') {
    const legacyLinks = [...(item.anhaenge ?? []), ...(item.jiraTicket?.trim() ? [item.jiraTicket] : [])];
    return userStoryDEToMarkdown(item, h, legacyLinks, undefined, undefined, false, false, undefined, undefined);
  }
  if (item.type === 'user-story-en') return userStoryENToMarkdown(item, h, item.resources ?? [], undefined, undefined, true, false, undefined);
  return '';
}

const BUG_LABELS_DE = {
  title: 'Titel',
  description: 'Beschreibung',
  expectedResult: 'Erwartetes Ergebnis (SOLL)',
  actualResult: 'Tatsächliches Ergebnis (IST)',
  stepsToReproduce: 'Schritte zur Reproduktion',
  technicalDetails: 'Technische Details',
  severityPriority: 'Schweregrad / Priorität',
  resources: 'Ressourcen',
  outOfScope: 'Außerhalb des Scope',
};

const BUG_LABELS_EN = {
  title: 'Title',
  description: 'Description',
  expectedResult: 'Expected Result',
  actualResult: 'Actual Result',
  stepsToReproduce: 'Steps to Reproduce',
  technicalDetails: 'Technical Details',
  severityPriority: 'Severity / Priority',
  resources: 'Resources',
  outOfScope: 'Out of Scope',
};

function bugReportToMarkdown(bug: BugReport, activeLang: 'de' | 'en', h: MarkdownHeadingLevel): string {
  const labels = activeLang === 'de' ? BUG_LABELS_DE : BUG_LABELS_EN;
  const c = activeLang === 'de' ? bug.de : bug.en;
  const lines: string[] = [];

  lines.push(heading(h, `🏷️ ${labels.title}`));
  lines.push('');
  lines.push(c.title);
  lines.push('');
  lines.push(heading(h, `📝 ${labels.description}`));
  lines.push('');
  lines.push(c.description);
  lines.push('');
  lines.push(heading(h, `✅ ${labels.expectedResult}`));
  lines.push('');
  lines.push(c.expectedResult);
  lines.push('');
  lines.push(heading(h, `❌ ${labels.actualResult}`));
  lines.push('');
  lines.push(c.actualResult);
  lines.push('');
  lines.push(heading(h, `🔁 ${labels.stepsToReproduce}`));
  lines.push('');
  (c.stepsToReproduce ?? []).forEach((step) => lines.push(step));
  lines.push('');
  lines.push(heading(h, `🛠️ ${labels.technicalDetails}`));
  lines.push('');
  lines.push(c.technicalDetails);
  lines.push('');
  lines.push(heading(h, `📊 ${labels.severityPriority}`));
  lines.push('');
  lines.push(c.severityPriority);
  lines.push('');
  lines.push(heading(h, `📚 ${labels.resources}`));
  lines.push('');
  lines.push(c.resources);
  lines.push('');
  lines.push(heading(h, `🚫 ${labels.outOfScope}`));
  lines.push('');
  lines.push(c.outOfScope);

  return lines.join('\n');
}

function appendImagesSection(lines: string[], h: MarkdownHeadingLevel, images: string[], labelDE: string, labelEN: string, lang: 'de' | 'en'): void {
  if (!images?.length) return;
  const label = lang === 'de' ? labelDE : labelEN;
  lines.push('');
  lines.push(heading(h, label));
  lines.push('');
  images.forEach((dataUrl, i) => {
    lines.push(`![Design ${i + 1}](${dataUrl})`);
    lines.push('');
  });
}

function copyBookToMarkdownTable(entries: CopyBookEntry[]): string {
  if (!entries?.length) return '';
  const header = '| Element | Text DE | Text EN |';
  const separator = '| --- | --- | --- |';
  const rows = entries.map(
    (e) => `| ${e.elementName.replace(/\|/g, '\\|')} | ${e.textDE.replace(/\|/g, '\\|')} | ${e.textEN.replace(/\|/g, '\\|')} |`
  );
  return [header, separator, ...rows].join('\n');
}

function appendCopyBookSection(lines: string[], h: MarkdownHeadingLevel, copyBook: CopyBookEntry[] | undefined, labelDE: string, labelEN: string, lang: 'de' | 'en'): void {
  if (!copyBook?.length) return;
  const label = lang === 'de' ? labelDE : labelEN;
  lines.push('');
  lines.push(heading(h, label));
  lines.push('');
  lines.push(copyBookToMarkdownTable(copyBook));
}

function appendEffortsSection(lines: string[], h: MarkdownHeadingLevel, efforts: { be?: number; fe?: number; qa?: number } | undefined, lang: 'de' | 'en'): void {
  const label = lang === 'de' ? '⏱️ Aufwände (PD)' : '⏱️ Efforts (PD)';
  const be = efforts?.be ?? 0;
  const fe = efforts?.fe ?? 0;
  const qa = efforts?.qa ?? 0;
  const total = be + fe + qa;
  const areaLabel = lang === 'de' ? 'Bereich' : 'Area';
  const estLabel = lang === 'de' ? 'Schätzung (PD)' : 'Estimate (PD)';
  lines.push('');
  lines.push(heading(h, label));
  lines.push('');
  lines.push(`| ${areaLabel} | ${estLabel} |`);
  lines.push('| --- | --- |');
  lines.push(`| BE | ${be} |`);
  lines.push(`| FE | ${fe} |`);
  lines.push(`| QA | ${qa} |`);
  lines.push(`| ${lang === 'de' ? 'Gesamt' : 'Total'} | ${total} |`);
}

function userStoryDEToMarkdown(
  story: UserStoryDE | import('../types/story').UserStoryDEContent,
  h: MarkdownHeadingLevel,
  links?: string[],
  images?: string[],
  copyBook?: CopyBookEntry[],
  includeTodos?: boolean,
  includeEfforts?: boolean,
  todos?: { be?: string[]; fe?: string[]; qa?: string[] },
  efforts?: { be?: number; fe?: number; qa?: number }
): string {
  const lines: string[] = [];

  lines.push(heading(h, '📝 Beschreibung'));
  lines.push('');
  lines.push(story.beschreibung);
  lines.push('');
  lines.push(heading(h, '✅ Akzeptanzkriterien'));
  lines.push('');
  story.akzeptanzkriterien.forEach((ac, i) => lines.push(`- AC${i + 1}: ${stripAcPrefix(ac)}`));
  lines.push('');
  lines.push(heading(h, '🔑 Voraussetzungen'));
  lines.push('');
  (story.voraussetzungen ?? []).forEach((v) => lines.push(`- ${v}`));
  lines.push('');
  lines.push(heading(h, '🔀 Nutzerflows'));
  lines.push('');
  const nf = story.nutzerflows as { happyFlows?: string[][]; happyFlow?: string[] };
  const happyFlows: string[][] = (nf.happyFlows?.length ? nf.happyFlows : (nf.happyFlow?.length ? [nf.happyFlow.map(stripFlowStepNumber)] : []));
  happyFlows.forEach((flow, flowIdx) => {
    if (flowIdx > 0) lines.push('');
    lines.push(heading(h, happyFlows.length > 1 ? `Happy Flow ${flowIdx + 1}` : 'Happy Flow'));
    lines.push('');
    flow.forEach((step, i) => lines.push(`${i + 1}. ${stripFlowStepNumber(step)}`));
  });
  const nf2 = story.nutzerflows as { fehlerszenarien?: string[][]; fehlerszenario?: string[] };
  const fehlerszenarien: string[][] = (nf2.fehlerszenarien?.length ? nf2.fehlerszenarien : (nf2.fehlerszenario?.length ? [nf2.fehlerszenario.map(stripFlowStepNumber)] : []));
  if (fehlerszenarien.length > 0) {
    fehlerszenarien.forEach((flow, flowIdx) => {
      lines.push('');
      lines.push(heading(h, fehlerszenarien.length > 1 ? `Fehlerszenario ${flowIdx + 1}` : 'Fehlerszenario'));
      lines.push('');
      flow.forEach((step, i) => lines.push(`${i + 1}. ${stripFlowStepNumber(step)}`));
    });
  }
  lines.push('');
  lines.push(heading(h, '📚 Anhänge / Links'));
  lines.push('');
  (links ?? []).forEach((v) => lines.push(`- ${v}`));
  appendImagesSection(lines, h, images ?? [], '🖼️ Design-Bilder', '🖼️ Design Images', 'de');
  lines.push('');
  lines.push(heading(h, '🚫 Out of Scope'));
  lines.push('');
  (story.outOfScope ?? []).forEach((v) => lines.push(`- ${v}`));
  appendCopyBookSection(lines, h, copyBook, '📋 Copy Book (UI-Texte)', '📋 Copy Book (UI Texts)', 'de');
  if (includeTodos && todos) appendTodosSection(lines, h, todos, 'de');
  if (includeEfforts) appendEffortsSection(lines, h, efforts, 'de');

  return lines.join('\n');
}

function appendTodosSection(lines: string[], h: MarkdownHeadingLevel, todos: { be?: string[]; fe?: string[]; qa?: string[] }, lang: 'de' | 'en'): void {
  const label = lang === 'de' ? "🗒️ To-Do's (BE / FE / QA)" : "🗒️ To-Do's (BE / FE / QA)";
  lines.push('');
  lines.push(heading(h, label));
  lines.push('');
  lines.push('**BE**');
  lines.push('');
  (todos.be ?? []).forEach((t) => lines.push(`- ${t}`));
  lines.push('');
  lines.push('**FE**');
  lines.push('');
  (todos.fe ?? []).forEach((t) => lines.push(`- ${t}`));
  lines.push('');
  lines.push('**QA**');
  lines.push('');
  (todos.qa ?? []).forEach((t) => lines.push(`- ${t}`));
}

function userStoryENToMarkdown(
  story: UserStoryEN | import('../types/story').UserStoryENContent,
  h: MarkdownHeadingLevel,
  links?: string[],
  images?: string[],
  copyBook?: CopyBookEntry[],
  includeTodos?: boolean,
  includeEfforts?: boolean,
  efforts?: { be?: number; fe?: number; qa?: number }
): string {
  const lines: string[] = [];
  const todos = story.todos ?? { be: [], fe: [], qa: [] };

  lines.push(heading(h, '📝 Description'));
  lines.push('');
  lines.push(story.description);
  lines.push('');
  lines.push(heading(h, '✅ Acceptance Criteria'));
  lines.push('');
  story.acceptanceCriteria.forEach((ac, i) => lines.push(`- AC${i + 1}: ${stripAcPrefix(ac)}`));
  lines.push('');
  lines.push(heading(h, '👥 Roles'));
  lines.push('');
  lines.push(story.roles);
  lines.push('');
  lines.push(heading(h, '🔑 Prerequisites'));
  lines.push('');
  (story.prerequisites ?? []).forEach((v) => lines.push(`- ${v}`));
  lines.push('');
  lines.push(heading(h, '🔀 User Flows'));
  lines.push('');
  const uf = story.userFlows as { happyPaths?: string[][]; happyPath?: string[] };
  const happyPaths: string[][] = (uf.happyPaths?.length ? uf.happyPaths : (uf.happyPath?.length ? [uf.happyPath.map(stripFlowStepNumber)] : []));
  happyPaths.forEach((flow, flowIdx) => {
    if (flowIdx > 0) lines.push('');
    lines.push(heading(h, happyPaths.length > 1 ? `Happy path ${flowIdx + 1}` : 'Happy path'));
    lines.push('');
    flow.forEach((step, i) => lines.push(`${i + 1}. ${stripFlowStepNumber(step)}`));
  });
  const uf2 = story.userFlows as { errorScenarios?: string[][]; errorScenario?: string[] };
  const errorScenarios: string[][] = (uf2.errorScenarios?.length ? uf2.errorScenarios : (uf2.errorScenario?.length ? [uf2.errorScenario.map(stripFlowStepNumber)] : []));
  if (errorScenarios.length > 0) {
    errorScenarios.forEach((flow, flowIdx) => {
      lines.push('');
      lines.push(heading(h, errorScenarios.length > 1 ? `Error scenario ${flowIdx + 1}` : 'Error scenario'));
      lines.push('');
      flow.forEach((step, i) => lines.push(`${i + 1}. ${stripFlowStepNumber(step)}`));
    });
  }
  lines.push('');
  lines.push(heading(h, '📚 Resources / Links'));
  lines.push('');
  (links ?? []).forEach((v) => lines.push(`- ${v}`));
  appendImagesSection(lines, h, images ?? [], '🖼️ Design-Bilder', '🖼️ Design Images', 'en');
  lines.push('');
  lines.push(heading(h, '🚫 Out of Scope'));
  lines.push('');
  (story.outOfScope ?? []).forEach((v) => lines.push(`- ${v}`));
  appendCopyBookSection(lines, h, copyBook, '📋 Copy Book (UI-Texte)', '📋 Copy Book (UI Texts)', 'en');
  if (includeTodos) appendTodosSection(lines, h, todos, 'en');
  if (includeEfforts) appendEffortsSection(lines, h, efforts, 'en');

  return lines.join('\n');
}
