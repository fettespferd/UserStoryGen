import { useState, useCallback } from 'react';
import type { StoryItem, UserStory, UserStoryDE, UserStoryEN, BugReport, BugReportContent, Settings, ProjectType } from '../types/story';
import { generateId } from '../utils/templates';
import { stripFlowStepNumber } from '../utils/format';

const SYSTEM_PROMPT_DE = `Du bist ein professioneller Product Owner. Erstelle User Stories und Bug Reports.

Leitplanken: Professionell, sachlich, strukturiert. Texte nicht unnötig ausgeschmückt.
Keine Fett-Formatierung für Fließtextinhalte. Kurze, klare Sätze in einfacher, verständlicher Sprache.
Kein unnötiges Fachgesimpel, keine komplizierten Satzstrukturen.
Keine Umgangssprache, keine KI-Floskeln. Direkt in Jira/Confluence nutzbar.

Für Akzeptanzkriterien: AC1:, AC2:, AC3: als Format (Überschrift und Punkte fett).
Nutzerflows: Happy Flow und Fehlerszenario nur wenn zur Story passend. Schritte OHNE Nummernprefix (z.B. "User öffnet..." nicht "1. User öffnet...") – die Reihenfolge ergibt die Nummerierung.
ACs sind Quelle der Wahrheit und überprüfbar. Funktionale und nicht-funktionale Anforderungen berücksichtigen.
UI-Texte nur in Anführungszeichen.

Antworte NUR mit gültigem JSON, kein anderer Text.`;

const SYSTEM_PROMPT_EN = `You are a professional Product Owner. Create User Stories and Bug Reports.

Guidelines: Professional, factual, structured. No unnecessary embellishments.
No bold formatting for body text. Short, clear sentences in simple, understandable language.
No unnecessary jargon, no complicated sentence structures.
No colloquialisms, no AI clichés. Ready for Jira/Confluence.

For Acceptance Criteria: AC1:, AC2:, AC3: format (heading and points bold).
User flows: Happy path and error scenario only when fitting the story. Steps WITHOUT number prefix (e.g. "User opens..." not "1. User opens...") – order determines numbering.
ACs are source of truth and verifiable. Consider functional and non-functional requirements.
UI texts in quotes only.

Respond ONLY with valid JSON, no other text.`;

export function getDefaultSystemPrompt(lang: 'de' | 'en'): string {
  return lang === 'de' ? SYSTEM_PROMPT_DE : SYSTEM_PROMPT_EN;
}

function getSystemPrompt(lang: 'de' | 'en', customDE?: string, customEN?: string): string {
  const custom = lang === 'de' ? customDE : customEN;
  if (custom?.trim()) return custom.trim();
  return getDefaultSystemPrompt(lang);
}

function mergeToLinks(de?: { anhaenge?: string[]; jiraTicket?: string }, en?: { resources?: string[] }): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const add = (v: string) => {
    const s = v?.trim();
    if (s && !seen.has(s)) {
      seen.add(s);
      out.push(s);
    }
  };
  if (de?.anhaenge) de.anhaenge.forEach(add);
  if (de?.jiraTicket) add(de.jiraTicket);
  if (en?.resources) en.resources.forEach(add);
  return out;
}

const USER_STORY_DE_SCHEMA = `{
  "type": "user-story-de",
  "title": "Kurzer, prägnanter Story-Titel (max. 60 Zeichen, z.B. 'Lebensphase in Einstellungen beenden')",
  "beschreibung": "Als [Rolle] möchte ich [Ziel], damit [Nutzen].",
  "akzeptanzkriterien": ["AC1: ...", "AC2: ...", "AC3: ..."],
  "voraussetzungen": "...",
  "nutzerflows": { "happyFlow": ["User …", "System …"], "fehlerszenario": ["User …", "System erkennt ..."] },
  "anhaenge": ["[Designs, APIs, Jira-Link]"],
  "outOfScope": "...",
  "jiraTicket": "..."
}`;

const USER_STORY_EN_SCHEMA = `{
  "type": "user-story-en",
  "title": "Short, concise story title (max. 60 chars, e.g. 'End life phase in settings')",
  "description": "As a [role] I want [goal], so that [benefit].",
  "acceptanceCriteria": ["AC1: ...", "AC2: ...", "AC3: ..."],
  "todos": { "be": [], "fe": [], "qa": [] },
  "roles": "...",
  "prerequisites": "...",
  "userFlows": { "happyPath": ["User …", "System …"], "errorScenario": ["User …", "System detects ..."] },
  "resources": ["[Designs, APIs, Jira link]"],
  "outOfScope": "..."
}`;

const BUG_SCHEMA = `{
  "type": "bug-report",
  "lang": "de" | "en",
  "title": "...",
  "description": "...",
  "expectedResult": "...",
  "actualResult": "...",
  "stepsToReproduce": ["...", "..."],
  "technicalDetails": "...",
  "severityPriority": "...",
  "resources": "...",
  "outOfScope": "..."
}`;

export interface UseAIGeneratorReturn {
  generate: (
    prompt: string,
    type: 'user-story' | 'bug',
    settings: Settings | null,
    images?: string[],
    project?: ProjectType
  ) => Promise<StoryItem | null>;
  regenerateSection: (
    lang: 'de' | 'en',
    section: string,
    prompt: string,
    settings: Settings | null
  ) => Promise<string | string[] | null>;
  generateSingleListItem: (
    item: UserStory,
    lang: 'de' | 'en',
    section: string,
    settings: Settings | null,
    prompt?: string,
    replaceAtIndex?: number
  ) => Promise<string | null>;
  regenerateFullStory: (
    item: UserStory,
    prompt: string,
    settings: Settings | null
  ) => Promise<UserStory | null>;
  syncDEToEN: (item: UserStory, settings: Settings | null) => Promise<UserStory | null>;
  regenerateFullBugReport: (
    item: BugReport,
    prompt: string,
    settings: Settings | null
  ) => Promise<BugReport | null>;
  extractCopyBook: (
    images: string[],
    settings: Settings | null
  ) => Promise<{ elementName: string; textDE: string; textEN: string }[] | null>;
  generatePromptFromDescription: (
    description: string,
    settings: Settings | null
  ) => Promise<string | null>;
  isLoading: boolean;
  error: string | null;
}

export function useAIGenerator(): UseAIGeneratorReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buildMessageContent = (
    prompt: string,
    images: string[] | undefined
  ): { type: string; text?: string; image_url?: { url: string }; source?: { type: string; media_type: string; data: string } }[] => {
    const parts: { type: string; text?: string; image_url?: { url: string }; source?: { type: string; media_type: string; data: string } }[] = [];
    if (images?.length) {
      images.forEach((dataUrl) => {
        parts.push({ type: 'image_url', image_url: { url: dataUrl } });
      });
    }
    parts.push({ type: 'text', text: prompt });
    return parts;
  };

  const generateSingle = useCallback(
    async (
      prompt: string,
      type: 'user-story-de' | 'user-story-en' | 'bug-de' | 'bug-en',
      settings: Settings,
      images?: string[],
      options?: { promptPrefix?: string }
    ): Promise<UserStoryDE | UserStoryEN | BugReportContent | null> => {
      const lang = type.includes('de') ? 'de' : 'en';
      const systemPrompt = getSystemPrompt(lang, settings.customSystemPromptDE ?? settings.customSystemPrompt, settings.customSystemPromptEN ?? settings.customSystemPrompt);
      let schema = '';
      if (type === 'user-story-de') schema = USER_STORY_DE_SCHEMA;
      else if (type === 'user-story-en') schema = USER_STORY_EN_SCHEMA;
      else schema = BUG_SCHEMA;
      const prefix = options?.promptPrefix ?? 'Erstelle basierend auf folgender Beschreibung:';
      const basePrompt = images?.length
        ? `Analysiere die angehängten Design-Bilder und erstelle basierend darauf sowie folgender Beschreibung:\n\n${prompt || '(Keine zusätzliche Beschreibung)'}`
        : `${prefix}\n\n${prompt}`;
      const userPrompt = `${basePrompt}\n\nAntworte mit JSON im folgenden Schema (id wird automatisch gesetzt):\n${schema}`;
      const userContent = images?.length ? buildMessageContent(userPrompt, images) : userPrompt;

      const apiKeyOpenAI = settings.apiKeyOpenAI ?? settings.apiKey;
      const apiKeyAnthropic = settings.apiKeyAnthropic ?? settings.apiKey;
      const modelOpenAI = settings.modelOpenAI ?? 'gpt-4o-mini';
      const modelAnthropic = settings.modelAnthropic ?? 'claude-3-5-haiku-20241022';

      if (settings.provider === 'openai') {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKeyOpenAI}` },
          body: JSON.stringify({
            model: modelOpenAI,
            messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userContent }],
            temperature: 0.3,
          }),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error?.message || `API Fehler: ${res.status}`);
        }
        const data = await res.json();
        return parseAIResponse(data.choices?.[0]?.message?.content?.trim() ?? '', type) as UserStoryDE | UserStoryEN | BugReportContent | null;
      }

      const hasImages = images?.length;
      const body: Record<string, unknown> = hasImages
        ? {
            model: modelAnthropic,
            max_tokens: 4096,
            system: systemPrompt,
            messages: [{
              role: 'user',
              content: [
                ...images!.map((dataUrl) => {
                  const [header, base64] = dataUrl.split(',');
                  const mediaType = header?.match(/data:(.+);base64/)?.[1] || 'image/png';
                  return { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } };
                }),
                { type: 'text', text: userPrompt },
              ],
            }],
          }
        : {
            model: modelAnthropic,
            max_tokens: 4096,
            system: systemPrompt,
            messages: [{ role: 'user', content: userPrompt }],
          };

        const res = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': apiKeyAnthropic!, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error?.message || `API Fehler: ${res.status}`);
      }
      const data = await res.json();
      return parseAIResponse(data.content?.[0]?.text?.trim() ?? '', type) as UserStoryDE | UserStoryEN | BugReportContent | null;
    },
    []
  );

  const generate = useCallback(
    async (
      prompt: string,
      type: 'user-story' | 'bug',
      settings: Settings | null,
      images?: string[],
      project?: ProjectType
    ): Promise<StoryItem | null> => {
      if (!settings) return null;
      const apiKey = settings.provider === 'openai'
        ? (settings.apiKeyOpenAI ?? settings.apiKey)
        : (settings.apiKeyAnthropic ?? settings.apiKey);
      if (!apiKey) {
        setError('API-Key fehlt. Bitte in den Einstellungen hinterlegen.');
        return null;
      }
      const projectPrefix = project ? `Kontext: Dies ist für Projekt ${project === 'aokn' ? 'AOKN' : 'HealthMatch'}.\n\n` : '';
      const fullPrompt = projectPrefix + prompt;
      setIsLoading(true);
      setError(null);
      try {
        if (type === 'user-story') {
          const deResult = await generateSingle(fullPrompt, 'user-story-de', settings, images) as UserStoryDE | null;
          const enResult = await generateSingle(fullPrompt, 'user-story-en', settings, images) as UserStoryEN | null;
          if (!deResult || !enResult) return null;
          const id = generateId();
          const title =
            (deResult as { title?: string }).title?.trim() ||
            deResult.beschreibung?.slice(0, 60) ||
            'User Story';
          const titleEN =
            (enResult as { title?: string }).title?.trim() ||
            (enResult as { description?: string }).description?.slice(0, 60) ||
            title;
          const links = mergeToLinks(deResult, enResult);
          const userStory: UserStory = {
            id,
            type: 'user-story',
            createdAt: new Date().toISOString(),
            title,
            titleEN,
            project,
            copyBook: [],
            images: images ?? [],
            links,
            de: {
              beschreibung: deResult.beschreibung,
              akzeptanzkriterien: deResult.akzeptanzkriterien,
              voraussetzungen: deResult.voraussetzungen,
              nutzerflows: deResult.nutzerflows,
              outOfScope: deResult.outOfScope,
            },
            en: {
              description: enResult.description,
              acceptanceCriteria: enResult.acceptanceCriteria,
              todos: enResult.todos,
              roles: enResult.roles,
              prerequisites: enResult.prerequisites,
              userFlows: enResult.userFlows,
              outOfScope: enResult.outOfScope,
            },
          };
          return userStory;
        }
        const deBug = (await generateSingle(fullPrompt, 'bug-de', settings, images)) as { title: string; description: string; expectedResult: string; actualResult: string; stepsToReproduce: string[]; technicalDetails: string; severityPriority: string; resources: string; outOfScope: string } | null;
        const enBug = (await generateSingle(fullPrompt, 'bug-en', settings, images)) as { title: string; description: string; expectedResult: string; actualResult: string; stepsToReproduce: string[]; technicalDetails: string; severityPriority: string; resources: string; outOfScope: string } | null;
        if (!deBug || !enBug) return null;
        const id = generateId();
        const bugReport: BugReport = {
          id,
          type: 'bug-report',
          createdAt: new Date().toISOString(),
          project,
          images: images ?? [],
          de: {
            title: deBug.title,
            description: deBug.description,
            expectedResult: deBug.expectedResult,
            actualResult: deBug.actualResult,
            stepsToReproduce: deBug.stepsToReproduce,
            technicalDetails: deBug.technicalDetails,
            severityPriority: deBug.severityPriority,
            resources: deBug.resources,
            outOfScope: deBug.outOfScope,
          },
          en: {
            title: enBug.title,
            description: enBug.description,
            expectedResult: enBug.expectedResult,
            actualResult: enBug.actualResult,
            stepsToReproduce: enBug.stepsToReproduce,
            technicalDetails: enBug.technicalDetails,
            severityPriority: enBug.severityPriority,
            resources: enBug.resources,
            outOfScope: enBug.outOfScope,
          },
        };
        return bugReport;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [generateSingle]
  );

  const buildStoryContext = (item: UserStory): string => {
    const d = item.de;
    const e = item.en;
    return `Aktueller Titel (DE): ${item.title}
Aktueller Titel (EN): ${item.titleEN || item.title}

Links (gemeinsam DE+EN): ${(item.links ?? []).join(' | ')}

Aktuelle Story (DE):
Beschreibung: ${d.beschreibung}
Akzeptanzkriterien: ${(d.akzeptanzkriterien ?? []).join(' | ')}
Voraussetzungen: ${(d.voraussetzungen ?? []).join(' | ')}
Happy Flow: ${(d.nutzerflows.happyFlow ?? []).join(' | ')}
Fehlerszenario: ${(d.nutzerflows.fehlerszenario ?? []).join(' | ')}
Out of Scope: ${(d.outOfScope ?? []).join(' | ')}

Aktuelle Story (EN):
Description: ${e.description}
Acceptance Criteria: ${(e.acceptanceCriteria ?? []).join(' | ')}
Prerequisites: ${(e.prerequisites ?? []).join(' | ')}
Happy Path: ${(e.userFlows.happyPath ?? []).join(' | ')}
Error Scenario: ${(e.userFlows.errorScenario ?? []).join(' | ')}
Out of Scope: ${(e.outOfScope ?? []).join(' | ')}`;
  };

  const regenerateFullStory = useCallback(
    async (item: UserStory, prompt: string, settings: Settings | null): Promise<UserStory | null> => {
      if (!settings || !prompt.trim()) return null;
      const apiKey = settings.provider === 'openai'
        ? (settings.apiKeyOpenAI ?? settings.apiKey)
        : (settings.apiKeyAnthropic ?? settings.apiKey);
      if (!apiKey) return null;
      setIsLoading(true);
      setError(null);
      try {
        const context = buildStoryContext(item);
        const updatePrompt = `Nimm folgende Anpassungen vor:\n\n${prompt}\n\n${context}`;
        const opts = { promptPrefix: 'Aktualisiere diese bestehende User Story.' };
        const deResult = (await generateSingle(updatePrompt, 'user-story-de', settings, undefined, opts)) as UserStoryDE | null;
        const enResult = (await generateSingle(updatePrompt, 'user-story-en', settings, undefined, opts)) as UserStoryEN | null;
        if (!deResult || !enResult) return null;
        const newTitle =
          (deResult as { title?: string }).title?.trim() ||
          item.title;
        const newTitleEN =
          (enResult as { title?: string }).title?.trim() ||
          item.titleEN ||
          item.title;
        const links = mergeToLinks(deResult, enResult);
        const updated: UserStory = {
          ...item,
          title: newTitle,
          titleEN: newTitleEN,
          links,
          de: {
            beschreibung: deResult.beschreibung,
            akzeptanzkriterien: deResult.akzeptanzkriterien,
            voraussetzungen: deResult.voraussetzungen,
            nutzerflows: deResult.nutzerflows,
            outOfScope: deResult.outOfScope,
          },
          en: {
            description: enResult.description,
            acceptanceCriteria: enResult.acceptanceCriteria,
            todos: enResult.todos,
            roles: enResult.roles,
            prerequisites: enResult.prerequisites,
            userFlows: enResult.userFlows,
            outOfScope: enResult.outOfScope,
          },
        };
        return updated;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [generateSingle]
  );

  const syncDEToEN = useCallback(
    async (item: UserStory, settings: Settings | null): Promise<UserStory | null> => {
      if (!settings) return null;
      const apiKey = settings.provider === 'openai'
        ? (settings.apiKeyOpenAI ?? settings.apiKey)
        : (settings.apiKeyAnthropic ?? settings.apiKey);
      if (!apiKey) return null;
      setIsLoading(true);
      setError(null);
      try {
        const d = item.de;
        const deContent = `Übersetze diese deutsche User Story ins Englische. Behalte die gleiche Struktur und Qualität. Übersetze auch den Titel ins Englische.

Deutsche Story:
Titel: ${item.title}
Beschreibung: ${d.beschreibung}
Akzeptanzkriterien: ${(d.akzeptanzkriterien ?? []).map((ac, i) => `AC${i + 1}: ${ac}`).join('\n')}
Voraussetzungen: ${(d.voraussetzungen ?? []).join('\n')}
Happy Flow: ${(d.nutzerflows.happyFlow ?? []).join('\n')}
Fehlerszenario: ${(d.nutzerflows.fehlerszenario ?? []).join('\n')}
Links (nicht übersetzen, bleiben gleich): ${(item.links ?? []).join('\n')}
Out of Scope: ${(d.outOfScope ?? []).join('\n')}`;
        const opts = { promptPrefix: 'Übersetze die folgende deutsche User Story ins Englische.' };
        const enResult = (await generateSingle(deContent, 'user-story-en', settings, undefined, opts)) as UserStoryEN | null;
        if (!enResult) return null;
        const titleEN = (enResult as { title?: string }).title?.trim() || item.title;
        return {
          ...item,
          titleEN,
          en: {
            description: enResult.description,
            acceptanceCriteria: enResult.acceptanceCriteria,
            todos: enResult.todos,
            roles: enResult.roles,
            prerequisites: enResult.prerequisites,
            userFlows: enResult.userFlows,
            outOfScope: enResult.outOfScope,
          },
        };
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [generateSingle]
  );

  const buildBugContext = (item: BugReport): string => {
    const d = item.de;
    const e = item.en;
    return `Aktueller Bug Report (DE):
Titel: ${d.title}
Beschreibung: ${d.description}
Erwartetes Ergebnis (SOLL): ${d.expectedResult}
Tatsächliches Ergebnis (IST): ${d.actualResult}
Schritte zur Reproduktion: ${(d.stepsToReproduce ?? []).join(' | ')}
Technische Details: ${d.technicalDetails}
Schweregrad/Priorität: ${d.severityPriority}
Ressourcen: ${d.resources}
Außerhalb des Scope: ${d.outOfScope}

Aktueller Bug Report (EN):
Title: ${e.title}
Description: ${e.description}
Expected Result: ${e.expectedResult}
Actual Result: ${e.actualResult}
Steps to Reproduce: ${(e.stepsToReproduce ?? []).join(' | ')}
Technical Details: ${e.technicalDetails}
Severity/Priority: ${e.severityPriority}
Resources: ${e.resources}
Out of Scope: ${e.outOfScope}`;
  };

  const regenerateFullBugReport = useCallback(
    async (item: BugReport, prompt: string, settings: Settings | null): Promise<BugReport | null> => {
      if (!settings || !prompt.trim()) return null;
      const apiKey = settings.provider === 'openai'
        ? (settings.apiKeyOpenAI ?? settings.apiKey)
        : (settings.apiKeyAnthropic ?? settings.apiKey);
      if (!apiKey) return null;
      setIsLoading(true);
      setError(null);
      try {
        const context = buildBugContext(item);
        const updatePrompt = `Nimm folgende Anpassungen vor:\n\n${prompt}\n\n${context}`;
        const opts = { promptPrefix: 'Aktualisiere diesen bestehenden Bug Report.' };
        const deResult = (await generateSingle(updatePrompt, 'bug-de', settings, undefined, opts)) as { title: string; description: string; expectedResult: string; actualResult: string; stepsToReproduce: string[]; technicalDetails: string; severityPriority: string; resources: string; outOfScope: string } | null;
        const enResult = (await generateSingle(updatePrompt, 'bug-en', settings, undefined, opts)) as { title: string; description: string; expectedResult: string; actualResult: string; stepsToReproduce: string[]; technicalDetails: string; severityPriority: string; resources: string; outOfScope: string } | null;
        if (!deResult || !enResult) return null;
        return {
          ...item,
          de: {
            title: deResult.title,
            description: deResult.description,
            expectedResult: deResult.expectedResult,
            actualResult: deResult.actualResult,
            stepsToReproduce: deResult.stepsToReproduce,
            technicalDetails: deResult.technicalDetails,
            severityPriority: deResult.severityPriority,
            resources: deResult.resources,
            outOfScope: deResult.outOfScope,
          },
          en: {
            title: enResult.title,
            description: enResult.description,
            expectedResult: enResult.expectedResult,
            actualResult: enResult.actualResult,
            stepsToReproduce: enResult.stepsToReproduce,
            technicalDetails: enResult.technicalDetails,
            severityPriority: enResult.severityPriority,
            resources: enResult.resources,
            outOfScope: enResult.outOfScope,
          },
        };
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [generateSingle]
  );

  const regenerateSection = useCallback(
    async (lang: 'de' | 'en', section: string, prompt: string, settings: Settings | null): Promise<string | string[] | null> => {
      if (!settings) return null;
      const apiKey = settings.provider === 'openai'
        ? (settings.apiKeyOpenAI ?? settings.apiKey)
        : (settings.apiKeyAnthropic ?? settings.apiKey);
      if (!apiKey) return null;
      setIsLoading(true);
      setError(null);
      try {
        const sysPrompt = getSystemPrompt(lang, settings.customSystemPromptDE ?? settings.customSystemPrompt, settings.customSystemPromptEN ?? settings.customSystemPrompt);
        const sectionLabel = section === 'links' ? 'Links/Ressourcen (Jira, Designs, APIs)' : section;
        const sectionPrompt = `Aktualisiere nur die Sektion "${sectionLabel}" basierend auf: ${prompt}\n\nAntworte NUR mit dem neuen Inhalt als JSON: für Einzeltext {"value":"..."}, für Array {"value":["...","..."]}.`;
        const modelOpenAI = settings.modelOpenAI ?? 'gpt-4o-mini';
        const modelAnthropic = settings.modelAnthropic ?? 'claude-3-5-haiku-20241022';
        let text = '';
        if (settings.provider === 'openai') {
          const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
            body: JSON.stringify({
              model: modelOpenAI,
              messages: [{ role: 'system', content: sysPrompt }, { role: 'user', content: sectionPrompt }],
              temperature: 0.3,
            }),
          });
          if (!res.ok) throw new Error('API Fehler');
          const data = await res.json();
          text = data.choices?.[0]?.message?.content?.trim() ?? '';
        } else {
          const res = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey!, 'anthropic-version': '2023-06-01' },
            body: JSON.stringify({
              model: modelAnthropic,
              max_tokens: 1024,
              system: sysPrompt,
              messages: [{ role: 'user', content: sectionPrompt }],
            }),
          });
          if (!res.ok) throw new Error('API Fehler');
          const data = await res.json();
          text = data.content?.[0]?.text?.trim() ?? '';
        }
        const match = text.match(/\{[^}]*"value"[^}]*\}/);
        if (!match) return null;
        const parsed = JSON.parse(match[0]) as { value: string | string[] };
        const value = parsed.value ?? null;
        if (Array.isArray(value) && (section.includes('Flow') || section.includes('flow') || section.includes('szenario') || section.includes('Scenario'))) {
          return value.map(stripFlowStepNumber);
        }
        return value;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const extractCopyBook = useCallback(
    async (
      images: string[],
      settings: Settings | null
    ): Promise<{ elementName: string; textDE: string; textEN: string }[] | null> => {
      if (!settings || !images.length) return null;
      const apiKey = settings.provider === 'openai'
        ? (settings.apiKeyOpenAI ?? settings.apiKey)
        : (settings.apiKeyAnthropic ?? settings.apiKey);
      if (!apiKey) return null;

      setIsLoading(true);
      setError(null);

      const systemPrompt = `Du bist ein UX-Experte. Analysiere die angehängten Design-Bilder (UI-Mockups, Screenshots) und extrahiere alle sichtbaren UI-Texte.
Erstelle eine Liste mit:
- elementName: technischer Bezeichner auf Englisch (z.B. login_button, header_title, error_message)
- textDE: der exakte Text wie im Design (falls Deutsch) oder deutsche Übersetzung
- textEN: der exakte Text wie im Design (falls Englisch) oder englische Übersetzung

Antworte NUR mit gültigem JSON-Array: [{"elementName":"...","textDE":"...","textEN":"..."}]
Keine anderen Texte.`;

      const modelOpenAI = settings.modelOpenAI ?? 'gpt-4o-mini';
      const modelAnthropic = settings.modelAnthropic ?? 'claude-3-5-haiku-20241022';
      try {
        if (settings.provider === 'openai') {
          const userContent = buildMessageContent(
            'Extrahiere alle UI-Texte aus den Bildern und gib sie als JSON-Array zurück.',
            images
          );
          const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: modelOpenAI,
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userContent },
              ],
              temperature: 0.2,
            }),
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error?.message || `API Fehler: ${res.status}`);
          }

          const data = await res.json();
          const text = data.choices?.[0]?.message?.content?.trim() ?? '';
          return parseCopyBookResponse(text);
        }

        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: modelAnthropic,
            max_tokens: 4096,
            system: systemPrompt,
            messages: [
              {
                role: 'user',
                content: [
                  ...images.map((dataUrl) => {
                    const [header, base64] = dataUrl.split(',');
                    const mediaType = header?.match(/data:(.+);base64/)?.[1] || 'image/png';
                    return {
                      type: 'image',
                      source: { type: 'base64', media_type: mediaType, data: base64 },
                    };
                  }),
                  { type: 'text', text: 'Extrahiere alle UI-Texte.' },
                ],
              },
            ],
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error?.message || `API Fehler: ${res.status}`);
        }

        const data = await res.json();
        const text = data.content?.[0]?.text?.trim() ?? '';
        return parseCopyBookResponse(text);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const getListForSection = (item: UserStory, lang: 'de' | 'en', section: string): string[] => {
    const content = lang === 'de' ? item.de : item.en;
    const obj = content as unknown as Record<string, unknown>;
    if (section.includes('.')) {
      const [field, subField] = section.split('.');
      const nested = obj[field] as Record<string, unknown> | undefined;
      return (nested?.[subField] as string[]) ?? [];
    }
    return (obj[section] as string[]) ?? [];
  };

  const generateSingleListItem = useCallback(
    async (
      item: UserStory,
      lang: 'de' | 'en',
      section: string,
      settings: Settings | null,
      prompt?: string,
      replaceAtIndex?: number
    ): Promise<string | null> => {
      if (!settings) return null;
      const apiKey = settings.provider === 'openai'
        ? (settings.apiKeyOpenAI ?? settings.apiKey)
        : (settings.apiKeyAnthropic ?? settings.apiKey);
      if (!apiKey) return null;

      const existingList = getListForSection(item, lang, section);
      const nextIndex = replaceAtIndex !== undefined ? replaceAtIndex + 1 : existingList.length + 1;
      const otherItems = replaceAtIndex !== undefined ? existingList.filter((_, i) => i !== replaceAtIndex) : existingList;

      const sectionLabels: Record<string, { de: string; en: string }> = {
        akzeptanzkriterien: { de: 'Akzeptanzkriterium', en: 'Acceptance criterion' },
        acceptanceCriteria: { de: 'Akzeptanzkriterium', en: 'Acceptance criterion' },
        'nutzerflows.happyFlow': { de: 'Happy-Flow-Schritt', en: 'Happy path step' },
        'nutzerflows.fehlerszenario': { de: 'Fehlerszenario-Schritt', en: 'Error scenario step' },
        'userFlows.happyPath': { de: 'Happy-Flow-Schritt', en: 'Happy path step' },
        'userFlows.errorScenario': { de: 'Fehlerszenario-Schritt', en: 'Error scenario step' },
        voraussetzungen: { de: 'Voraussetzung', en: 'Prerequisite' },
        prerequisites: { de: 'Voraussetzung', en: 'Prerequisite' },
        outOfScope: { de: 'Out-of-Scope-Punkt', en: 'Out-of-scope item' },
      };
      const label = sectionLabels[section]?.[lang] ?? 'Listenpunkt';
      const isAc = section === 'akzeptanzkriterien' || section === 'acceptanceCriteria';
      const isFlow = section.includes('Flow') || section.includes('flow') || section.includes('szenario') || section.includes('Scenario');
      const formatHint = isAc ? `Format: AC${nextIndex}: [Inhalt]` : isFlow ? (lang === 'de' ? 'Nur der Schritttext, KEIN Nummernprefix (z.B. "User öffnet..." nicht "1. User öffnet...")' : 'Step text only, NO number prefix (e.g. "User opens..." not "1. User opens...")') : 'Kurzer, prägnanter Satz.';
      const isReplace = replaceAtIndex !== undefined;
      const existingHint = isReplace
        ? (lang === 'de' ? `Ersetze den Punkt an Position ${replaceAtIndex! + 1}. Andere Punkte: ` : `Replace item at position ${replaceAtIndex! + 1}. Other items: `)
        : (lang === 'de' ? 'Bestehende Punkte: ' : 'Existing items: ');
      const context = buildStoryContext(item);
      const userPrompt = lang === 'de'
        ? `${isReplace ? 'Ersetze' : 'Erstelle'} genau EINEN ${label} für diese User Story. ${existingHint}${otherItems.join(' | ') || '(keine)'}. ${formatHint}. ${prompt ? `Zusätzliche Anweisung: ${prompt}` : ''}\n\n${context}\n\nAntworte NUR mit JSON: {"value":"..."} – nur der neue Punkt als value, kein anderer Text.`
        : `${isReplace ? 'Replace' : 'Create'} exactly ONE ${label} for this user story. ${existingHint}${otherItems.join(' | ') || '(none)'}. ${formatHint}. ${prompt ? `Additional instruction: ${prompt}` : ''}\n\n${context}\n\nRespond ONLY with JSON: {"value":"..."} – only the new item as value, no other text.`;

      setIsLoading(true);
      setError(null);
      try {
        const sysPrompt = getSystemPrompt(lang, settings.customSystemPromptDE ?? settings.customSystemPrompt, settings.customSystemPromptEN ?? settings.customSystemPrompt);
        const modelOpenAI = settings.modelOpenAI ?? 'gpt-4o-mini';
        const modelAnthropic = settings.modelAnthropic ?? 'claude-3-5-haiku-20241022';
        let text = '';
        if (settings.provider === 'openai') {
          const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
            body: JSON.stringify({
              model: modelOpenAI,
              messages: [{ role: 'system', content: sysPrompt }, { role: 'user', content: userPrompt }],
              temperature: 0.3,
            }),
          });
          if (!res.ok) throw new Error('API Fehler');
          const data = await res.json();
          text = data.choices?.[0]?.message?.content?.trim() ?? '';
        } else {
          const res = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey!, 'anthropic-version': '2023-06-01' },
            body: JSON.stringify({
              model: modelAnthropic,
              max_tokens: 512,
              system: sysPrompt,
              messages: [{ role: 'user', content: userPrompt }],
            }),
          });
          if (!res.ok) throw new Error('API Fehler');
          const data = await res.json();
          text = data.content?.[0]?.text?.trim() ?? '';
        }
        const match = text.match(/\{[^}]*"value"[^}]*\}/);
        if (!match) return null;
        const parsed = JSON.parse(match[0]) as { value?: string };
        const value = parsed?.value;
        return (typeof value === 'string' ? value.trim() : null) || null;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const generatePromptFromDescription = useCallback(
    async (description: string, settings: Settings | null): Promise<string | null> => {
      if (!settings || !description.trim()) return null;
      const apiKey = settings.provider === 'openai'
        ? (settings.apiKeyOpenAI ?? settings.apiKey)
        : (settings.apiKeyAnthropic ?? settings.apiKey);
      if (!apiKey) return null;

      setIsLoading(true);
      setError(null);

      const systemPrompt = `Du bist ein Product Owner. Erstelle einen Prompt-Vorlagentext für die KI-Generierung von User Stories oder Bug Reports.

Der Output soll ein mehrzeiliger Text sein, den der User als Vorlage in ein Beschreibungsfeld einfügen kann.
- Nutze Platzhalter in eckigen Klammern: [Rolle], [Ziel], [Kontext], etc.
- Strukturiere mit Überschriften oder Aufzählungen
- Kein JSON, nur Fließtext
- Professionell, sachlich, auf Jira/Confluence ausgerichtet`;

      const userPrompt = `Erstelle eine Prompt-Vorlage basierend auf:\n\n${description.trim()}`;

      const modelOpenAI = settings.modelOpenAI ?? 'gpt-4o-mini';
      const modelAnthropic = settings.modelAnthropic ?? 'claude-3-5-haiku-20241022';

      try {
        if (settings.provider === 'openai') {
          const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
            body: JSON.stringify({
              model: modelOpenAI,
              messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
              temperature: 0.3,
            }),
          });
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error?.message || `API Fehler: ${res.status}`);
          }
          const data = await res.json();
          return data.choices?.[0]?.message?.content?.trim() ?? null;
        }

        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey!, 'anthropic-version': '2023-06-01' },
          body: JSON.stringify({
            model: modelAnthropic,
            max_tokens: 2048,
            system: systemPrompt,
            messages: [{ role: 'user', content: userPrompt }],
          }),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error?.message || `API Fehler: ${res.status}`);
        }
        const data = await res.json();
        return data.content?.[0]?.text?.trim() ?? null;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { generate, regenerateSection, regenerateFullStory, regenerateFullBugReport, syncDEToEN, extractCopyBook, generatePromptFromDescription, generateSingleListItem, isLoading, error };
}

function parseAIResponse(
  content: string,
  type: 'user-story-de' | 'user-story-en' | 'bug-de' | 'bug-en'
): UserStoryDE | UserStoryEN | BugReportContent | null {
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  try {
    const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    const toStrArr = (v: unknown): string[] => {
      if (Array.isArray(v)) return v.map(String).filter(Boolean);
      if (typeof v === 'string' && v.trim()) return v.split(/\n/).map((s) => s.trim()).filter(Boolean);
      return [];
    };

    if (type === 'user-story-de') {
      const title = String(parsed.title ?? '').trim() || undefined;
      return {
        id,
        type: 'user-story-de',
        beschreibung: String(parsed.beschreibung ?? ''),
        akzeptanzkriterien: Array.isArray(parsed.akzeptanzkriterien) ? parsed.akzeptanzkriterien.map(String) : [],
        voraussetzungen: toStrArr(parsed.voraussetzungen),
        nutzerflows: {
          happyFlow: Array.isArray((parsed.nutzerflows as Record<string, unknown>)?.happyFlow)
            ? (parsed.nutzerflows as { happyFlow: string[] }).happyFlow.map(stripFlowStepNumber)
            : [],
          fehlerszenario: Array.isArray((parsed.nutzerflows as Record<string, unknown>)?.fehlerszenario)
            ? (parsed.nutzerflows as { fehlerszenario: string[] }).fehlerszenario.map(stripFlowStepNumber)
            : undefined,
        },
        anhaenge: toStrArr(parsed.anhaenge),
        outOfScope: toStrArr(parsed.outOfScope),
        jiraTicket: String(parsed.jiraTicket ?? ''),
        ...(title && { title }),
      } as UserStoryDE;
    }

    if (type === 'user-story-en') {
      const title = String(parsed.title ?? '').trim() || undefined;
      return {
        id,
        type: 'user-story-en',
        description: String(parsed.description ?? ''),
        acceptanceCriteria: Array.isArray(parsed.acceptanceCriteria) ? parsed.acceptanceCriteria.map(String) : [],
        todos: { be: [], fe: [], qa: [] },
        roles: String(parsed.roles ?? ''),
        prerequisites: toStrArr(parsed.prerequisites),
        userFlows: {
          happyPath: Array.isArray((parsed.userFlows as Record<string, unknown>)?.happyPath)
            ? (parsed.userFlows as { happyPath: string[] }).happyPath.map(stripFlowStepNumber)
            : [],
          errorScenario: Array.isArray((parsed.userFlows as Record<string, unknown>)?.errorScenario)
            ? (parsed.userFlows as { errorScenario: string[] }).errorScenario.map(stripFlowStepNumber)
            : undefined,
        },
        resources: toStrArr(parsed.resources),
        outOfScope: toStrArr(parsed.outOfScope),
        ...(title && { title }),
      } as UserStoryEN;
    }

    return {
      title: String(parsed.title ?? ''),
      description: String(parsed.description ?? ''),
      expectedResult: String(parsed.expectedResult ?? ''),
      actualResult: String(parsed.actualResult ?? ''),
      stepsToReproduce: Array.isArray(parsed.stepsToReproduce) ? parsed.stepsToReproduce.map(String) : [],
      technicalDetails: String(parsed.technicalDetails ?? ''),
      severityPriority: String(parsed.severityPriority ?? ''),
      resources: String(parsed.resources ?? ''),
      outOfScope: String(parsed.outOfScope ?? ''),
    };
  } catch {
    return null;
  }
}

function parseCopyBookResponse(
  content: string
): { elementName: string; textDE: string; textEN: string }[] | null {
  const arrayMatch = content.match(/\[[\s\S]*\]/);
  if (!arrayMatch) return null;
  try {
    const arr = JSON.parse(arrayMatch[0]) as unknown[];
    return arr
      .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
      .map((item) => ({
        elementName: String(item.elementName ?? ''),
        textDE: String(item.textDE ?? ''),
        textEN: String(item.textEN ?? ''),
      }))
      .filter((e) => e.elementName || e.textDE || e.textEN);
  } catch {
    return null;
  }
}
