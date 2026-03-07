import type { StoryItem, UserStory, UserStoryDE, UserStoryEN, BugReport, UserStoryENContent } from '../types/story';

function toStrArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String).filter(Boolean);
  if (typeof v === 'string' && v.trim()) return v.split(/\n/).map((s) => s.trim()).filter(Boolean);
  return [];
}

const DEFAULT_EN: UserStoryENContent = {
  description: 'As a [role] I want [goal], so that [benefit].',
  acceptanceCriteria: ['…', '…', '…'],
  todos: { be: [], fe: [], qa: [] },
  roles: '',
  prerequisites: [''],
  userFlows: { happyPath: ['1. User …', '2. System …'] },
  resources: [''],
  outOfScope: [''],
};

export function migrateItem(raw: unknown): StoryItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;

  if (obj.type === 'bug-report') {
    const bug = raw as BugReport;
    return { ...bug, images: bug.images ?? [] };
  }

  if (obj.type === 'user-story') {
    const story = raw as UserStory & { de?: Record<string, unknown>; en?: Record<string, unknown> };
    return {
      ...story,
      copyBook: story.copyBook ?? [],
      images: story.images ?? [],
      de: story.de ? {
        ...story.de,
        voraussetzungen: toStrArray(story.de.voraussetzungen),
        anhaenge: toStrArray(story.de.anhaenge),
        outOfScope: toStrArray(story.de.outOfScope),
      } : undefined,
      en: story.en ? {
        ...story.en,
        prerequisites: toStrArray(story.en.prerequisites),
        resources: toStrArray(story.en.resources),
        outOfScope: toStrArray(story.en.outOfScope),
      } : undefined,
    } as UserStory;
  }

  if (obj.type === 'user-story-de') {
    const old = raw as UserStoryDE;
    return {
      id: old.id,
      type: 'user-story',
      title: old.beschreibung?.slice(0, 60) || 'User Story',
      de: {
        beschreibung: old.beschreibung,
        akzeptanzkriterien: old.akzeptanzkriterien,
        voraussetzungen: toStrArray(old.voraussetzungen),
        nutzerflows: old.nutzerflows,
        anhaenge: toStrArray(old.anhaenge),
        outOfScope: toStrArray(old.outOfScope),
        jiraTicket: old.jiraTicket,
      },
      en: DEFAULT_EN,
      copyBook: [],
      images: [],
    };
  }

  if (obj.type === 'user-story-en') {
    const old = raw as UserStoryEN;
    return {
      id: old.id,
      type: 'user-story',
      title: old.description?.slice(0, 60) || 'User Story',
      de: {
        beschreibung: 'Als [Rolle] möchte ich [Ziel], damit [Nutzen].',
        akzeptanzkriterien: ['…', '…', '…'],
        voraussetzungen: [''],
        nutzerflows: { happyFlow: ['1. User …', '2. System …'] },
        anhaenge: [''],
        outOfScope: [''],
        jiraTicket: '',
      },
      en: {
        description: old.description,
        acceptanceCriteria: old.acceptanceCriteria,
        todos: old.todos,
        roles: old.roles,
        prerequisites: toStrArray(old.prerequisites),
        userFlows: old.userFlows,
        resources: toStrArray(old.resources),
        outOfScope: toStrArray(old.outOfScope),
      },
      copyBook: [],
      images: [],
    };
  }

  // Unbekannter Typ – versuche zu retten statt still zu droppen
  const id = obj.id ?? obj.type;
  if (id && typeof id === 'string') {
    console.warn('[UserStoryGen] Unbekannter Story-Typ:', obj.type, '- wird als minimale User Story geladen');
    return {
      id: String(id),
      type: 'user-story',
      title: String(obj.title ?? obj.beschreibung ?? obj.description ?? 'Story').slice(0, 60) || 'User Story',
      de: {
        beschreibung: String(obj.beschreibung ?? obj.description ?? ''),
        akzeptanzkriterien: Array.isArray(obj.akzeptanzkriterien) ? obj.akzeptanzkriterien.map(String) : ['AC1: …'],
        voraussetzungen: toStrArray(obj.voraussetzungen ?? obj.prerequisites),
        nutzerflows: {
          happyFlow: Array.isArray((obj.nutzerflows as { happyFlow?: string[] })?.happyFlow)
            ? (obj.nutzerflows as { happyFlow: string[] }).happyFlow
            : ['1. User …', '2. System …'],
          fehlerszenario: undefined,
        },
        anhaenge: toStrArray(obj.anhaenge),
        outOfScope: toStrArray(obj.outOfScope),
        jiraTicket: String(obj.jiraTicket ?? ''),
      },
      en: DEFAULT_EN,
      copyBook: Array.isArray(obj.copyBook)
        ? obj.copyBook.filter(
            (e: unknown): e is { elementName: string; textDE: string; textEN: string } =>
              !!e && typeof e === 'object' && 'elementName' in e
          )
        : [],
      images: Array.isArray(obj.images) ? obj.images.filter((x: unknown): x is string => typeof x === 'string') : [],
    } as UserStory;
  }
  return null;
}
