import type { StoryItem, UserStory, UserStoryDE, UserStoryEN, BugReport, BugReportContent, UserStoryENContent } from '../types/story';

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
  outOfScope: [''],
};

function mergeToLinks(
  de?: { anhaenge?: unknown; jiraTicket?: unknown },
  en?: { resources?: unknown }
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const add = (v: string) => {
    const s = v?.trim();
    if (s && !seen.has(s)) {
      seen.add(s);
      out.push(s);
    }
  };
  if (de?.anhaenge && Array.isArray(de.anhaenge)) de.anhaenge.forEach((x) => add(String(x)));
  if (de?.jiraTicket && String(de.jiraTicket).trim()) add(String(de.jiraTicket));
  if (en?.resources && Array.isArray(en.resources)) en.resources.forEach((x) => add(String(x)));
  return out;
}

export function migrateItem(raw: unknown): StoryItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;

  if (obj.type === 'bug-report') {
    const bug = raw as Record<string, unknown>;
    if (bug.de && bug.en) {
      return { ...bug, images: bug.images ?? [] } as BugReport;
    }
    const content: BugReportContent = {
      title: String(bug.title ?? ''),
      description: String(bug.description ?? ''),
      expectedResult: String(bug.expectedResult ?? ''),
      actualResult: String(bug.actualResult ?? ''),
      stepsToReproduce: Array.isArray(bug.stepsToReproduce) ? bug.stepsToReproduce.map(String) : [],
      technicalDetails: String(bug.technicalDetails ?? ''),
      severityPriority: String(bug.severityPriority ?? ''),
      resources: String(bug.resources ?? ''),
      outOfScope: String(bug.outOfScope ?? ''),
    };
    const lang = bug.lang === 'en' ? 'en' : 'de';
    const emptyContent: BugReportContent = {
      title: '', description: '', expectedResult: '', actualResult: '',
      stepsToReproduce: ['', '', ''], technicalDetails: '', severityPriority: '', resources: '', outOfScope: '',
    };
    return {
      id: String(bug.id),
      type: 'bug-report',
      createdAt: bug.createdAt as string | undefined,
      project: bug.project as BugReport['project'],
      images: (bug.images as string[]) ?? [],
      de: lang === 'de' ? content : emptyContent,
      en: lang === 'en' ? content : emptyContent,
    } as BugReport;
  }

  if (obj.type === 'user-story') {
    const story = raw as UserStory & { de?: Record<string, unknown>; en?: Record<string, unknown>; links?: string[] };
    const de = story.de as { anhaenge?: unknown; jiraTicket?: unknown; voraussetzungen?: unknown; outOfScope?: unknown } | undefined;
    const en = story.en as { resources?: unknown; prerequisites?: unknown; outOfScope?: unknown } | undefined;
    const links = Array.isArray(story.links) && story.links.length > 0
      ? story.links
      : mergeToLinks(de, en);
    return {
      ...story,
      copyBook: story.copyBook ?? [],
      images: story.images ?? [],
      links,
      de: story.de ? {
        beschreibung: story.de.beschreibung,
        akzeptanzkriterien: story.de.akzeptanzkriterien,
        voraussetzungen: toStrArray(de?.voraussetzungen),
        nutzerflows: story.de.nutzerflows,
        outOfScope: toStrArray(de?.outOfScope),
      } : undefined,
      en: story.en ? (() => {
        const { resources: _r, ...rest } = story.en as Record<string, unknown>;
        return {
          ...rest,
          prerequisites: toStrArray(en?.prerequisites),
          outOfScope: toStrArray(en?.outOfScope),
        };
      })() : undefined,
    } as UserStory;
  }

  if (obj.type === 'user-story-de') {
    const old = raw as UserStoryDE;
    const links = mergeToLinks(
      { anhaenge: old.anhaenge, jiraTicket: old.jiraTicket },
      undefined
    );
    return {
      id: old.id,
      type: 'user-story',
      title: old.beschreibung?.slice(0, 60) || 'User Story',
      de: {
        beschreibung: old.beschreibung,
        akzeptanzkriterien: old.akzeptanzkriterien,
        voraussetzungen: toStrArray(old.voraussetzungen),
        nutzerflows: old.nutzerflows,
        outOfScope: toStrArray(old.outOfScope),
      },
      en: DEFAULT_EN,
      links,
      copyBook: [],
      images: [],
    };
  }

  if (obj.type === 'user-story-en') {
    const old = raw as UserStoryEN;
    const links = mergeToLinks(undefined, { resources: old.resources });
    return {
      id: old.id,
      type: 'user-story',
      title: old.description?.slice(0, 60) || 'User Story',
      de: {
        beschreibung: 'Als [Rolle] möchte ich [Ziel], damit [Nutzen].',
        akzeptanzkriterien: ['…', '…', '…'],
        voraussetzungen: [''],
        nutzerflows: { happyFlow: ['1. User …', '2. System …'] },
        outOfScope: [''],
      },
      en: {
        description: old.description,
        acceptanceCriteria: old.acceptanceCriteria,
        todos: old.todos,
        roles: old.roles,
        prerequisites: toStrArray(old.prerequisites),
        userFlows: old.userFlows,
        outOfScope: toStrArray(old.outOfScope),
      },
      links,
      copyBook: [],
      images: [],
    };
  }

  // Unbekannter Typ – versuche zu retten statt still zu droppen
  const id = obj.id ?? obj.type;
  if (id && typeof id === 'string') {
    console.warn('[UserStoryGen] Unbekannter Story-Typ:', obj.type, '- wird als minimale User Story geladen');
    const links = mergeToLinks(
      { anhaenge: obj.anhaenge, jiraTicket: obj.jiraTicket },
      { resources: obj.resources }
    );
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
        outOfScope: toStrArray(obj.outOfScope),
      },
      en: DEFAULT_EN,
      links,
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
