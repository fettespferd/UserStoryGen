import type {
  UserStoryDE,
  UserStoryEN,
  UserStory,
  BugReport,
  MarkdownHeadingLevel,
} from '../types/story';
import { stripAcPrefix } from './format';

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
}

export function toMarkdown(
  item: UserStoryDE | UserStoryEN | UserStory | BugReport,
  activeLang?: 'de' | 'en',
  options?: MarkdownOptions
): string {
  const h = options?.headingLevel ?? 'h3';
  if (item.type === 'bug-report') return bugReportToMarkdown(item, activeLang ?? 'de', h);
  if (item.type === 'user-story') {
    const lang = activeLang ?? 'de';
    return lang === 'de' ? userStoryDEToMarkdown(item.de, h, item.links) : userStoryENToMarkdown(item.en, h, item.links);
  }
  if (item.type === 'user-story-de') {
    const legacyLinks = [...(item.anhaenge ?? []), ...(item.jiraTicket?.trim() ? [item.jiraTicket] : [])];
    return userStoryDEToMarkdown(item, h, legacyLinks);
  }
  if (item.type === 'user-story-en') return userStoryENToMarkdown(item, h, item.resources ?? []);
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

function userStoryDEToMarkdown(
  story: UserStoryDE | import('../types/story').UserStoryDEContent,
  h: MarkdownHeadingLevel,
  links?: string[]
): string {
  const lines: string[] = [];

  lines.push(heading(h, '📝 Beschreibung'));
  lines.push('');
  lines.push(story.beschreibung);
  lines.push('');
  lines.push(heading(h, '✅ Akzeptanzkriterien'));
  lines.push('');
  story.akzeptanzkriterien.forEach((ac, i) => lines.push(`AC${i + 1}: ${stripAcPrefix(ac)}`));
  lines.push('');
  lines.push(heading(h, '🔑 Voraussetzungen'));
  lines.push('');
  (story.voraussetzungen ?? []).forEach((v) => lines.push(`- ${v}`));
  lines.push('');
  lines.push(heading(h, '🔀 Nutzerflows'));
  lines.push('');
  lines.push(heading(h, 'Happy Flow'));
  lines.push('');
  story.nutzerflows.happyFlow.forEach((step) => lines.push(step));
  if (story.nutzerflows.fehlerszenario && story.nutzerflows.fehlerszenario.length > 0) {
    lines.push('');
    lines.push(heading(h, 'Fehlerszenario'));
    lines.push('');
    story.nutzerflows.fehlerszenario.forEach((step) => lines.push(step));
  }
  lines.push('');
  lines.push(heading(h, '📚 Anhänge / Links'));
  lines.push('');
  (links ?? []).forEach((v) => lines.push(`- ${v}`));
  lines.push('');
  lines.push(heading(h, '🚫 Out of Scope'));
  lines.push('');
  (story.outOfScope ?? []).forEach((v) => lines.push(`- ${v}`));

  return lines.join('\n');
}

function userStoryENToMarkdown(
  story: UserStoryEN | import('../types/story').UserStoryENContent,
  h: MarkdownHeadingLevel,
  links?: string[]
): string {
  const lines: string[] = [];

  lines.push(heading(h, '📝 Description'));
  lines.push('');
  lines.push(story.description);
  lines.push('');
  lines.push(heading(h, '✅ Acceptance Criteria'));
  lines.push('');
  story.acceptanceCriteria.forEach((ac, i) => lines.push(`AC${i + 1}: ${stripAcPrefix(ac)}`));
  lines.push('');
  lines.push(heading(h, "🗒️ To-Do's (BE / FE / QA)"));
  lines.push('');
  lines.push('**BE**');
  lines.push('');
  lines.push('**FE**');
  lines.push('');
  lines.push('**QA**');
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
  lines.push(heading(h, 'Happy path'));
  lines.push('');
  story.userFlows.happyPath.forEach((step) => lines.push(step));
  if (story.userFlows.errorScenario && story.userFlows.errorScenario.length > 0) {
    lines.push('');
    lines.push(heading(h, 'Error scenario'));
    lines.push('');
    story.userFlows.errorScenario.forEach((step) => lines.push(step));
  }
  lines.push('');
  lines.push(heading(h, '📚 Resources / Links'));
  lines.push('');
  (links ?? []).forEach((v) => lines.push(`- ${v}`));
  lines.push('');
  lines.push(heading(h, '🚫 Out of Scope'));
  lines.push('');
  (story.outOfScope ?? []).forEach((v) => lines.push(`- ${v}`));

  return lines.join('\n');
}
