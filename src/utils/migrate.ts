import type { StoryItem, UserStory, UserStoryDE, UserStoryEN, BugReport, BugReportContent, UserStoryENContent, NutzerflowsDE, UserFlowsEN } from '../types/story';
import { stripFlowStepNumber } from './format';

function toStrArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String).filter(Boolean);
  if (typeof v === 'string' && v.trim()) return v.split(/\n/).map((s) => s.trim()).filter(Boolean);
  return [];
}

/** Prüft ob ein Array ein Flow (string[]) ist (nicht verschachtelt). */
function isFlowSteps(arr: unknown): arr is string[] {
  return Array.isArray(arr) && arr.every((x) => typeof x === 'string');
}

/** Migriert alte Nutzerflows (happyFlow/fehlerszenario) zu neuem Format (happyFlows/fehlerszenarien). */
export function normalizeNutzerflows(raw: unknown): NutzerflowsDE {
  const n = raw as Record<string, unknown> | undefined;
  if (!n) return { happyFlows: [['User …', 'System …']], fehlerszenarien: [] };

  let happyFlows: string[][] = [];
  if (Array.isArray(n.happyFlows) && n.happyFlows.every(isFlowSteps)) {
    happyFlows = n.happyFlows.map((f: string[]) => f.map(stripFlowStepNumber));
  } else if (Array.isArray((n as { happyFlow?: string[] }).happyFlow)) {
    const hf = (n as { happyFlow: string[] }).happyFlow.map(stripFlowStepNumber);
    happyFlows = hf.length ? [hf] : [['User …', 'System …']];
  } else {
    happyFlows = [['User …', 'System …']];
  }

  let fehlerszenarien: string[][] | undefined;
  if (Array.isArray(n.fehlerszenarien) && n.fehlerszenarien.every(isFlowSteps)) {
    fehlerszenarien = n.fehlerszenarien.map((f: string[]) => f.map(stripFlowStepNumber));
  } else if (Array.isArray((n as { fehlerszenario?: string[] }).fehlerszenario)) {
    const fs = (n as { fehlerszenario: string[] }).fehlerszenario.map(stripFlowStepNumber);
    fehlerszenarien = fs.length ? [fs] : undefined;
  }

  return { happyFlows, fehlerszenarien };
}

/** Migriert alte User Flows (happyPath/errorScenario) zu neuem Format (happyPaths/errorScenarios). */
export function normalizeUserFlows(raw: unknown): UserFlowsEN {
  const u = raw as Record<string, unknown> | undefined;
  if (!u) return { happyPaths: [['User …', 'System …']], errorScenarios: [] };

  let happyPaths: string[][] = [];
  if (Array.isArray(u.happyPaths) && u.happyPaths.every(isFlowSteps)) {
    happyPaths = u.happyPaths.map((f: string[]) => f.map(stripFlowStepNumber));
  } else if (Array.isArray((u as { happyPath?: string[] }).happyPath)) {
    const hp = (u as { happyPath: string[] }).happyPath.map(stripFlowStepNumber);
    happyPaths = hp.length ? [hp] : [['User …', 'System …']];
  } else {
    happyPaths = [['User …', 'System …']];
  }

  let errorScenarios: string[][] | undefined;
  if (Array.isArray(u.errorScenarios) && u.errorScenarios.every(isFlowSteps)) {
    errorScenarios = u.errorScenarios.map((f: string[]) => f.map(stripFlowStepNumber));
  } else if (Array.isArray((u as { errorScenario?: string[] }).errorScenario)) {
    const es = (u as { errorScenario: string[] }).errorScenario.map(stripFlowStepNumber);
    errorScenarios = es.length ? [es] : undefined;
  }

  return { happyPaths, errorScenarios };
}

const DEFAULT_EN: UserStoryENContent = {
  description: 'As a [role] I want [goal], so that [benefit].',
  acceptanceCriteria: ['…', '…', '…'],
  todos: { be: [], fe: [], qa: [] },
  roles: '',
  prerequisites: [''],
  userFlows: { happyPaths: [['User …', 'System …']], errorScenarios: [] },
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
        nutzerflows: normalizeNutzerflows(story.de.nutzerflows),
        outOfScope: toStrArray(de?.outOfScope),
      } : undefined,
      en: story.en ? (() => {
        const { resources: _r, ...rest } = story.en as Record<string, unknown>;
        return {
          ...rest,
          userFlows: normalizeUserFlows((story.en as { userFlows?: unknown }).userFlows),
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
        nutzerflows: normalizeNutzerflows(old.nutzerflows),
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
        nutzerflows: { happyFlows: [['1. User …', '2. System …']] },
        outOfScope: [''],
      },
      en: {
        description: old.description,
        acceptanceCriteria: old.acceptanceCriteria,
        todos: old.todos,
        roles: old.roles,
        prerequisites: toStrArray(old.prerequisites),
        userFlows: normalizeUserFlows(old.userFlows),
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
        nutzerflows: normalizeNutzerflows(obj.nutzerflows),
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
