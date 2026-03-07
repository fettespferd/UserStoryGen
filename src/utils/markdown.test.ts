import { describe, it, expect } from 'vitest';
import { toMarkdown } from './markdown';
import type { UserStoryDE, BugReport } from '../types/story';

describe('toMarkdown', () => {
  it('formats User Story DE correctly', () => {
    const story: UserStoryDE = {
      id: '1',
      type: 'user-story-de',
      beschreibung: 'Als Patient möchte ich Termine online buchen.',
      akzeptanzkriterien: ['AC1: Testbar', 'AC2: Messbar'],
      voraussetzungen: 'Login',
      nutzerflows: {
        happyFlow: ['1. User klickt Buchung', '2. System zeigt Kalender'],
        fehlerszenario: ['1. User …', '2. System erkennt Fehler'],
      },
      anhaenge: 'Design',
      outOfScope: 'Nichts',
      jiraTicket: 'PROJ-123',
    };
    const md = toMarkdown(story);
    expect(md).toContain('📝 Beschreibung');
    expect(md).toContain('### **✅ Akzeptanzkriterien**');
    expect(md).toContain('AC1: Testbar');
    expect(md).toContain('### **🎫 Jira Ticket**');
    expect(md).toContain('PROJ-123');
  });

  it('formats Bug Report correctly', () => {
    const bug: BugReport = {
      id: '2',
      type: 'bug-report',
      lang: 'de',
      title: 'Fehler beim Speichern',
      description: 'Beschreibung',
      expectedResult: 'Sollte speichern',
      actualResult: 'Speichert nicht',
      stepsToReproduce: ['1. Öffnen', '2. Klicken'],
      technicalDetails: 'Chrome',
      severityPriority: 'Hoch',
      resources: 'Screenshot',
      outOfScope: '-',
    };
    const md = toMarkdown(bug);
    expect(md).toContain('🏷️ Title');
    expect(md).toContain('Fehler beim Speichern');
    expect(md).toContain('✅ Expected Result (SOLL)');
  });
});
