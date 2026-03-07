import type {
  UserStoryDE,
  UserStoryEN,
  UserStory,
  BugReport,
  MarkdownHeadingLevel,
} from '../types/story';

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
  if (item.type === 'bug-report') return bugReportToMarkdown(item, h);
  if (item.type === 'user-story') {
    const lang = activeLang ?? 'de';
    return lang === 'de' ? userStoryDEToMarkdown(item.de, h) : userStoryENToMarkdown(item.en, h);
  }
  if (item.type === 'user-story-de') return userStoryDEToMarkdown(item, h);
  return userStoryENToMarkdown(item, h);
}

function bugReportToMarkdown(bug: BugReport, h: MarkdownHeadingLevel): string {
  const lines: string[] = [];

  lines.push(heading(h, '🏷️ Title'));
  lines.push('');
  lines.push(bug.title);
  lines.push('');
  lines.push(heading(h, '📝 Description'));
  lines.push('');
  lines.push(bug.description);
  lines.push('');
  lines.push(heading(h, '✅ Expected Result (SOLL)'));
  lines.push('');
  lines.push(bug.expectedResult);
  lines.push('');
  lines.push(heading(h, '❌ Actual Result (IST)'));
  lines.push('');
  lines.push(bug.actualResult);
  lines.push('');
  lines.push(heading(h, '🔁 Steps to Reproduce'));
  lines.push('');
  bug.stepsToReproduce.forEach((step) => lines.push(step));
  lines.push('');
  lines.push(heading(h, '🛠️ Technical Details'));
  lines.push('');
  lines.push(bug.technicalDetails);
  lines.push('');
  lines.push(heading(h, '📊 Severity / Priority'));
  lines.push('');
  lines.push(bug.severityPriority);
  lines.push('');
  lines.push(heading(h, '📚 Resources'));
  lines.push('');
  lines.push(bug.resources);
  lines.push('');
  lines.push(heading(h, '🚫 Out of Scope'));
  lines.push('');
  lines.push(bug.outOfScope);

  return lines.join('\n');
}

function userStoryDEToMarkdown(
  story: UserStoryDE | import('../types/story').UserStoryDEContent,
  h: MarkdownHeadingLevel
): string {
  const lines: string[] = [];

  lines.push(heading(h, '📝 Beschreibung'));
  lines.push('');
  lines.push(story.beschreibung);
  lines.push('');
  lines.push(heading(h, '✅ Akzeptanzkriterien'));
  lines.push('');
  story.akzeptanzkriterien.forEach((ac) => lines.push(ac));
  lines.push('');
  lines.push(heading(h, '🔑 Voraussetzungen'));
  lines.push('');
  lines.push(story.voraussetzungen);
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
  lines.push(heading(h, '📚 Anhänge'));
  lines.push('');
  lines.push(story.anhaenge);
  lines.push('');
  lines.push(heading(h, '🚫 Out of Scope'));
  lines.push('');
  lines.push(story.outOfScope);
  lines.push('');
  lines.push(heading(h, '🎫 Jira Ticket'));
  lines.push('');
  lines.push(story.jiraTicket);

  return lines.join('\n');
}

function userStoryENToMarkdown(
  story: UserStoryEN | import('../types/story').UserStoryENContent,
  h: MarkdownHeadingLevel
): string {
  const lines: string[] = [];

  lines.push(heading(h, '📝 Description'));
  lines.push('');
  lines.push(story.description);
  lines.push('');
  lines.push(heading(h, '✅ Acceptance Criteria'));
  lines.push('');
  story.acceptanceCriteria.forEach((ac) => lines.push(ac));
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
  lines.push(story.prerequisites);
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
  lines.push(heading(h, '📚 Resources'));
  lines.push('');
  lines.push(story.resources);
  lines.push('');
  lines.push(heading(h, '🚫 Out of Scope'));
  lines.push('');
  lines.push(story.outOfScope);

  return lines.join('\n');
}
