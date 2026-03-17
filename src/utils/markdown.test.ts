import { describe, it, expect } from 'vitest';
import { toMarkdown } from './markdown';
import type { UserStoryDE, BugReport, UserStory } from '../types/story';

describe('toMarkdown', () => {
  it('formats User Story DE correctly', () => {
    const story: UserStoryDE = {
      id: '1',
      type: 'user-story-de',
      beschreibung: 'Als Patient möchte ich Termine online buchen.',
      akzeptanzkriterien: ['AC1: Testbar', 'AC2: Messbar'],
      voraussetzungen: ['Login'],
      nutzerflows: {
        happyFlow: ['1. User klickt Buchung', '2. System zeigt Kalender'],
        fehlerszenario: ['1. User …', '2. System erkennt Fehler'],
      },
      anhaenge: ['Design'],
      outOfScope: ['Nichts'],
      jiraTicket: 'PROJ-123',
    };
    const md = toMarkdown(story);
    expect(md).toContain('📝 Beschreibung');
    expect(md).toContain('### **✅ Akzeptanzkriterien**');
    expect(md).toContain('AC1: Testbar');
    expect(md).toContain('### **📚 Anhänge / Links**');
    expect(md).toContain('- Design');
    expect(md).toContain('- PROJ-123');
    expect(md).toContain('- Login');
    expect(md).toContain('- Nichts');
  });

  it('includes Design-Bilder section when UserStory has images', () => {
    const story: UserStory = {
      id: '1',
      type: 'user-story',
      title: 'Test',
      de: {
        beschreibung: 'Beschreibung',
        akzeptanzkriterien: ['AC1: Test'],
        voraussetzungen: [],
        nutzerflows: { happyFlow: ['1. Step'] },
        outOfScope: [],
      },
      en: {
        description: 'Description',
        acceptanceCriteria: ['AC1: Test'],
        todos: { be: [], fe: [], qa: [] },
        roles: 'User',
        prerequisites: [],
        userFlows: { happyPath: ['1. Step'] },
        outOfScope: [],
      },
      links: [],
      copyBook: [],
      images: ['data:image/png;base64,iVBORw0KGgo='],
    };
    const md = toMarkdown(story, 'de');
    expect(md).toContain('🖼️ Design-Bilder');
    expect(md).toContain('![Design 1](data:image/png;base64,iVBORw0KGgo=)');
  });

  it('formats Bug Report correctly', () => {
    const bug: BugReport = {
      id: '2',
      type: 'bug-report',
      de: {
        title: 'Fehler beim Speichern',
        description: 'Beschreibung',
        expectedResult: 'Sollte speichern',
        actualResult: 'Speichert nicht',
        stepsToReproduce: ['1. Öffnen', '2. Klicken'],
        technicalDetails: 'Chrome',
        severityPriority: 'Hoch',
        resources: 'Screenshot',
        outOfScope: '-',
      },
      en: {
        title: 'Error when saving',
        description: 'Description',
        expectedResult: 'Should save',
        actualResult: 'Does not save',
        stepsToReproduce: ['1. Open', '2. Click'],
        technicalDetails: 'Chrome',
        severityPriority: 'High',
        resources: 'Screenshot',
        outOfScope: '-',
      },
    };
    const md = toMarkdown(bug, 'de');
    expect(md).toContain('🏷️ Titel');
    expect(md).toContain('Fehler beim Speichern');
    expect(md).toContain('✅ Erwartetes Ergebnis (SOLL)');
  });
});
