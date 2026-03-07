import { useState, useCallback } from 'react';
import type { StoryItem, UserStory, UserStoryDE, UserStoryEN, BugReport, Settings } from '../types/story';
import { generateId } from '../utils/templates';

const SYSTEM_PROMPT_DE = `Du bist ein professioneller Product Owner. Erstelle User Stories und Bug Reports.

Leitplanken: Professionell, sachlich, strukturiert. Texte nicht unnötig ausgeschmückt.
Keine Fett-Formatierung für Fließtextinhalte. Kurze, klare Sätze in einfacher, verständlicher Sprache.
Kein unnötiges Fachgesimpel, keine komplizierten Satzstrukturen.
Keine Umgangssprache, keine KI-Floskeln. Direkt in Jira/Confluence nutzbar.

Für Akzeptanzkriterien: AC1:, AC2:, AC3: als Format (Überschrift und Punkte fett).
Nutzerflows: Happy Flow und Fehlerszenario nur wenn zur Story passend.
ACs sind Quelle der Wahrheit und überprüfbar. Funktionale und nicht-funktionale Anforderungen berücksichtigen.
UI-Texte nur in Anführungszeichen.

Antworte NUR mit gültigem JSON, kein anderer Text.`;

const SYSTEM_PROMPT_EN = `You are a professional Product Owner. Create User Stories and Bug Reports.

Guidelines: Professional, factual, structured. No unnecessary embellishments.
No bold formatting for body text. Short, clear sentences in simple, understandable language.
No unnecessary jargon, no complicated sentence structures.
No colloquialisms, no AI clichés. Ready for Jira/Confluence.

For Acceptance Criteria: AC1:, AC2:, AC3: format (heading and points bold).
User flows: Happy path and error scenario only when fitting the story.
ACs are source of truth and verifiable. Consider functional and non-functional requirements.
UI texts in quotes only.

Respond ONLY with valid JSON, no other text.`;

export function getDefaultSystemPrompt(lang: 'de' | 'en'): string {
  return lang === 'de' ? SYSTEM_PROMPT_DE : SYSTEM_PROMPT_EN;
}

function getSystemPrompt(lang: 'de' | 'en', customPrompt?: string): string {
  if (customPrompt?.trim()) return customPrompt.trim();
  return getDefaultSystemPrompt(lang);
}

const USER_STORY_DE_SCHEMA = `{
  "type": "user-story-de",
  "beschreibung": "Als [Rolle] möchte ich [Ziel], damit [Nutzen].",
  "akzeptanzkriterien": ["AC1: ...", "AC2: ...", "AC3: ..."],
  "voraussetzungen": "...",
  "nutzerflows": { "happyFlow": ["1. User …", "2. System …"], "fehlerszenario": ["1. User …", "2. System erkennt ..."] },
  "anhaenge": "...",
  "outOfScope": "...",
  "jiraTicket": "..."
}`;

const USER_STORY_EN_SCHEMA = `{
  "type": "user-story-en",
  "description": "As a [role] I want [goal], so that [benefit].",
  "acceptanceCriteria": ["AC1: ...", "AC2: ...", "AC3: ..."],
  "todos": { "be": [], "fe": [], "qa": [] },
  "roles": "...",
  "prerequisites": "...",
  "userFlows": { "happyPath": ["1. User …", "2. System …"], "errorScenario": ["1. User …", "2. System detects ..."] },
  "resources": "...",
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
    type: 'user-story' | 'bug-de' | 'bug-en',
    settings: Settings | null,
    images?: string[]
  ) => Promise<StoryItem | null>;
  regenerateSection: (
    lang: 'de' | 'en',
    section: string,
    prompt: string,
    settings: Settings | null
  ) => Promise<string | string[] | null>;
  extractCopyBook: (
    images: string[],
    settings: Settings | null
  ) => Promise<{ elementName: string; textDE: string; textEN: string }[] | null>;
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
      images?: string[]
    ): Promise<UserStoryDE | UserStoryEN | BugReport | null> => {
      const lang = type.includes('de') ? 'de' : 'en';
      const systemPrompt = getSystemPrompt(lang, settings.customSystemPrompt);
      let schema = '';
      if (type === 'user-story-de') schema = USER_STORY_DE_SCHEMA;
      else if (type === 'user-story-en') schema = USER_STORY_EN_SCHEMA;
      else schema = BUG_SCHEMA;
      const basePrompt = images?.length
        ? `Analysiere die angehängten Design-Bilder und erstelle basierend darauf sowie folgender Beschreibung:\n\n${prompt || '(Keine zusätzliche Beschreibung)'}`
        : `Erstelle basierend auf folgender Beschreibung:\n\n${prompt}`;
      const userPrompt = `${basePrompt}\n\nAntworte mit JSON im folgenden Schema (id wird automatisch gesetzt):\n${schema}`;
      const userContent = images?.length ? buildMessageContent(userPrompt, images) : userPrompt;

      if (settings.provider === 'openai') {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${settings.apiKey}` },
          body: JSON.stringify({
            model: images?.length ? 'gpt-4o' : 'gpt-4o-mini',
            messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userContent }],
            temperature: 0.3,
          }),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error?.message || `API Fehler: ${res.status}`);
        }
        const data = await res.json();
        return parseAIResponse(data.choices?.[0]?.message?.content?.trim() ?? '', type) as UserStoryDE | UserStoryEN | BugReport | null;
      }

      const hasImages = images?.length;
      const body: Record<string, unknown> = hasImages
        ? {
            model: 'claude-3-5-sonnet-20241022',
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
            model: 'claude-3-haiku-20240307',
            max_tokens: 4096,
            system: systemPrompt,
            messages: [{ role: 'user', content: userPrompt }],
          };

        const res = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': settings.apiKey!, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error?.message || `API Fehler: ${res.status}`);
      }
      const data = await res.json();
      return parseAIResponse(data.content?.[0]?.text?.trim() ?? '', type) as UserStoryDE | UserStoryEN | BugReport | null;
    },
    []
  );

  const generate = useCallback(
    async (
      prompt: string,
      type: 'user-story' | 'bug-de' | 'bug-en',
      settings: Settings | null,
      images?: string[]
    ): Promise<StoryItem | null> => {
      if (!settings?.apiKey) {
        setError('API-Key fehlt. Bitte in den Einstellungen hinterlegen.');
        return null;
      }
      setIsLoading(true);
      setError(null);
      try {
        if (type === 'user-story') {
          const deResult = await generateSingle(prompt, 'user-story-de', settings, images) as UserStoryDE | null;
          const enResult = await generateSingle(prompt, 'user-story-en', settings, images) as UserStoryEN | null;
          if (!deResult || !enResult) return null;
          const id = generateId();
          const userStory: UserStory = {
            id,
            type: 'user-story',
            title: deResult.beschreibung?.slice(0, 60) || 'User Story',
            copyBook: [],
            images: images ?? [],
            de: {
              beschreibung: deResult.beschreibung,
              akzeptanzkriterien: deResult.akzeptanzkriterien,
              voraussetzungen: deResult.voraussetzungen,
              nutzerflows: deResult.nutzerflows,
              anhaenge: deResult.anhaenge,
              outOfScope: deResult.outOfScope,
              jiraTicket: deResult.jiraTicket,
            },
            en: {
              description: enResult.description,
              acceptanceCriteria: enResult.acceptanceCriteria,
              todos: enResult.todos,
              roles: enResult.roles,
              prerequisites: enResult.prerequisites,
              userFlows: enResult.userFlows,
              resources: enResult.resources,
              outOfScope: enResult.outOfScope,
            },
          };
          return userStory;
        }
        const bugResult = (await generateSingle(prompt, type, settings, images)) as BugReport | null;
        if (bugResult && images?.length) {
          return { ...bugResult, images } as StoryItem;
        }
        return bugResult as StoryItem | null;
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
      if (!settings?.apiKey) return null;
      setIsLoading(true);
      setError(null);
      try {
        const sysPrompt = getSystemPrompt(lang, settings.customSystemPrompt);
        const sectionPrompt = `Aktualisiere nur die Sektion "${section}" basierend auf: ${prompt}\n\nAntworte NUR mit dem neuen Inhalt als JSON: für Einzeltext {"value":"..."}, für Array {"value":["...","..."]}.`;
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${settings.apiKey}` },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'system', content: sysPrompt }, { role: 'user', content: sectionPrompt }],
            temperature: 0.3,
          }),
        });
        if (!res.ok) throw new Error('API Fehler');
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content?.trim() ?? '';
        const match = text.match(/\{[^}]*"value"[^}]*\}/);
        if (!match) return null;
        const parsed = JSON.parse(match[0]) as { value: string | string[] };
        return parsed.value ?? null;
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
      if (!settings?.apiKey || !images.length) return null;

      setIsLoading(true);
      setError(null);

      const systemPrompt = `Du bist ein UX-Experte. Analysiere die angehängten Design-Bilder (UI-Mockups, Screenshots) und extrahiere alle sichtbaren UI-Texte.
Erstelle eine Liste mit:
- elementName: technischer Bezeichner auf Englisch (z.B. login_button, header_title, error_message)
- textDE: der exakte Text wie im Design (falls Deutsch) oder deutsche Übersetzung
- textEN: der exakte Text wie im Design (falls Englisch) oder englische Übersetzung

Antworte NUR mit gültigem JSON-Array: [{"elementName":"...","textDE":"...","textEN":"..."}]
Keine anderen Texte.`;

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
              Authorization: `Bearer ${settings.apiKey}`,
            },
            body: JSON.stringify({
              model: 'gpt-4o',
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
            'x-api-key': settings.apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
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

  return { generate, regenerateSection, extractCopyBook, isLoading, error };
}

function parseAIResponse(
  content: string,
  type: 'user-story-de' | 'user-story-en' | 'bug-de' | 'bug-en'
): UserStoryDE | UserStoryEN | BugReport | null {
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  try {
    const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    if (type === 'user-story-de') {
      return {
        id,
        type: 'user-story-de',
        beschreibung: String(parsed.beschreibung ?? ''),
        akzeptanzkriterien: Array.isArray(parsed.akzeptanzkriterien) ? parsed.akzeptanzkriterien.map(String) : [],
        voraussetzungen: String(parsed.voraussetzungen ?? ''),
        nutzerflows: {
          happyFlow: Array.isArray((parsed.nutzerflows as Record<string, unknown>)?.happyFlow)
            ? (parsed.nutzerflows as { happyFlow: string[] }).happyFlow
            : [],
          fehlerszenario: Array.isArray((parsed.nutzerflows as Record<string, unknown>)?.fehlerszenario)
            ? (parsed.nutzerflows as { fehlerszenario: string[] }).fehlerszenario
            : undefined,
        },
        anhaenge: String(parsed.anhaenge ?? ''),
        outOfScope: String(parsed.outOfScope ?? ''),
        jiraTicket: String(parsed.jiraTicket ?? ''),
      };
    }

    if (type === 'user-story-en') {
      return {
        id,
        type: 'user-story-en',
        description: String(parsed.description ?? ''),
        acceptanceCriteria: Array.isArray(parsed.acceptanceCriteria) ? parsed.acceptanceCriteria.map(String) : [],
        todos: { be: [], fe: [], qa: [] },
        roles: String(parsed.roles ?? ''),
        prerequisites: String(parsed.prerequisites ?? ''),
        userFlows: {
          happyPath: Array.isArray((parsed.userFlows as Record<string, unknown>)?.happyPath)
            ? (parsed.userFlows as { happyPath: string[] }).happyPath
            : [],
          errorScenario: Array.isArray((parsed.userFlows as Record<string, unknown>)?.errorScenario)
            ? (parsed.userFlows as { errorScenario: string[] }).errorScenario
            : undefined,
        },
        resources: String(parsed.resources ?? ''),
        outOfScope: String(parsed.outOfScope ?? ''),
      };
    }

    return {
      id,
      type: 'bug-report',
      lang: type === 'bug-de' ? 'de' : 'en',
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
