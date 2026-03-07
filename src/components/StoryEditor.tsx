import { useState } from 'react';
import { Box, Paper, Typography, IconButton, Tabs, Tab, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import TranslateIcon from '@mui/icons-material/Translate';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { EditableField } from './EditableField';
import { MarkdownPreview } from './MarkdownPreview';
import { stripAcPrefix } from '../utils/format';
import { StoryCopyBookSection } from './StoryCopyBookSection';
import type { UserStory } from '../types/story';
import type { UseStoryStoreReturn } from '../hooks/useStoryStore';
import type { UseAIGeneratorReturn } from '../hooks/useAIGenerator';
import type { Settings } from '../types/story';

interface StoryEditorProps {
  item: UserStory | null;
  store: UseStoryStoreReturn;
  ai: UseAIGeneratorReturn;
  settings: Settings | null;
  onDelete?: (id: string) => void;
  /** Kontrollierter Tab: 0 = Deutsch, 1 = English. Wenn nicht gesetzt, wird interner State verwendet. */
  activeLangTab?: number;
  onActiveLangTabChange?: (tab: number) => void;
}

function StoryLangEditor({
  lang,
  content,
  store,
  ai,
  settings,
  item,
}: {
  lang: 'de' | 'en';
  content: UserStory['de'] | UserStory['en'];
  store: UseStoryStoreReturn;
  ai: UseAIGeneratorReturn;
  settings: Settings | null;
  item: UserStory;
}) {
  const [regenSection, setRegenSection] = useState<string | null>(null);
  const [regenPrompt, setRegenPrompt] = useState('');

  const { updateUserStoryField, updateUserStoryArrayField, updateUserStoryNestedField } = store;

  const handleRegenSection = async () => {
    if (!regenSection || !settings?.apiKey) return;
    const result = await ai.regenerateSection(lang, regenSection, regenPrompt, settings);
    if (result && item.type === 'user-story') {
      if (regenSection === 'links' && Array.isArray(result)) {
        store.updateUserStoryLinks(result);
      } else if (Array.isArray(result)) {
        if (regenSection.includes('.')) {
          const [field, subField] = regenSection.split('.');
          store.updateUserStoryNestedField(lang, field, subField, result);
        } else {
          store.updateUserStoryField(lang, regenSection, result);
        }
      } else {
        store.updateUserStoryField(lang, regenSection, result);
      }
    }
    setRegenSection(null);
    setRegenPrompt('');
  };

  const SectionRegenButton = ({ section }: { section: string }) => (
    <Button
      size="small"
      startIcon={<AutoAwesomeIcon />}
      onClick={() => setRegenSection(section)}
      disabled={!settings?.apiKey}
      sx={{ ml: 1 }}
    >
      Mit KI anpassen
    </Button>
  );

  if (lang === 'de') {
    const c = content as UserStory['de'];
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
            📝 Beschreibung
            <SectionRegenButton section="beschreibung" />
          </Typography>
          <EditableField value={c.beschreibung} onChange={(v) => updateUserStoryField('de', 'beschreibung', v)} multiline minRows={2} />
        </Box>
        <Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            ✅ Akzeptanzkriterien
            <SectionRegenButton section="akzeptanzkriterien" />
            <Button size="small" startIcon={<AddIcon />} onClick={() => updateUserStoryField('de', 'akzeptanzkriterien', [...c.akzeptanzkriterien, ''])}>
              Hinzufügen
            </Button>
          </Typography>
          {c.akzeptanzkriterien.map((ac, i) => (
            <Box key={i} sx={{ mb: 1, display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', mt: 0.5 }}>
                <IconButton size="small" onClick={() => { const arr = [...c.akzeptanzkriterien]; if (i > 0) { [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]; updateUserStoryField('de', 'akzeptanzkriterien', arr); } }} disabled={i === 0} title="Nach oben">
                  <ArrowUpwardIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => { const arr = [...c.akzeptanzkriterien]; if (i < arr.length - 1) { [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]]; updateUserStoryField('de', 'akzeptanzkriterien', arr); } }} disabled={i === c.akzeptanzkriterien.length - 1} title="Nach unten">
                  <ArrowDownwardIcon fontSize="small" />
                </IconButton>
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <EditableField value={stripAcPrefix(ac)} onChange={(v) => updateUserStoryArrayField('de', 'akzeptanzkriterien', i, v)} label={`AC${i + 1}`} multiline />
              </Box>
              <IconButton size="small" onClick={() => updateUserStoryField('de', 'akzeptanzkriterien', c.akzeptanzkriterien.filter((_, idx) => idx !== i))} color="error" title="Entfernen">
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Box>
        <Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            🔑 Voraussetzungen
            <Button size="small" startIcon={<AddIcon />} onClick={() => updateUserStoryField('de', 'voraussetzungen', [...(c.voraussetzungen ?? []), ''])}>
              Hinzufügen
            </Button>
          </Typography>
          {(c.voraussetzungen ?? []).map((v, i) => (
            <Box key={i} sx={{ mb: 1, display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', mt: 0.5 }}>
                <IconButton size="small" onClick={() => { const arr = [...(c.voraussetzungen ?? [])]; if (i > 0) { [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]; updateUserStoryField('de', 'voraussetzungen', arr); } }} disabled={i === 0} title="Nach oben">
                  <ArrowUpwardIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => { const arr = [...(c.voraussetzungen ?? [])]; if (i < arr.length - 1) { [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]]; updateUserStoryField('de', 'voraussetzungen', arr); } }} disabled={i === (c.voraussetzungen?.length ?? 0) - 1} title="Nach unten">
                  <ArrowDownwardIcon fontSize="small" />
                </IconButton>
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <EditableField value={v} onChange={(val) => { const arr = [...(c.voraussetzungen ?? [])]; arr[i] = val; updateUserStoryField('de', 'voraussetzungen', arr); }} label={`${i + 1}`} multiline />
              </Box>
              <IconButton size="small" onClick={() => updateUserStoryField('de', 'voraussetzungen', (c.voraussetzungen ?? []).filter((_, idx) => idx !== i))} color="error" title="Entfernen">
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Box>
        <Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
            🔀 Nutzerflows – Happy Flow
            <SectionRegenButton section="nutzerflows.happyFlow" />
          </Typography>
          {c.nutzerflows.happyFlow.map((step, i) => (
            <Box key={i} sx={{ mb: 1, display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', mt: 0.5 }}>
                <IconButton size="small" onClick={() => { const arr = [...c.nutzerflows.happyFlow]; if (i > 0) { [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]; updateUserStoryNestedField('de', 'nutzerflows', 'happyFlow', arr); } }} disabled={i === 0} title="Nach oben">
                  <ArrowUpwardIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => { const arr = [...c.nutzerflows.happyFlow]; if (i < arr.length - 1) { [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]]; updateUserStoryNestedField('de', 'nutzerflows', 'happyFlow', arr); } }} disabled={i === c.nutzerflows.happyFlow.length - 1} title="Nach unten">
                  <ArrowDownwardIcon fontSize="small" />
                </IconButton>
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <EditableField
                  value={step}
                  onChange={(v) => {
                    const arr = [...c.nutzerflows.happyFlow];
                    arr[i] = v;
                    updateUserStoryNestedField('de', 'nutzerflows', 'happyFlow', arr);
                  }}
                  label={`Schritt ${i + 1}`}
                />
              </Box>
            </Box>
          ))}
        </Box>
        {c.nutzerflows.fehlerszenario && c.nutzerflows.fehlerszenario.length > 0 && (
          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              🔀 Nutzerflows – Fehlerszenario
            </Typography>
            {c.nutzerflows.fehlerszenario.map((step, i) => (
              <Box key={i} sx={{ mb: 1, display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', mt: 0.5 }}>
                  <IconButton size="small" onClick={() => { const arr = [...(c.nutzerflows.fehlerszenario ?? [])]; if (i > 0) { [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]; updateUserStoryNestedField('de', 'nutzerflows', 'fehlerszenario', arr); } }} disabled={i === 0} title="Nach oben">
                    <ArrowUpwardIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => { const arr = [...(c.nutzerflows.fehlerszenario ?? [])]; if (i < arr.length - 1) { [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]]; updateUserStoryNestedField('de', 'nutzerflows', 'fehlerszenario', arr); } }} disabled={i === (c.nutzerflows.fehlerszenario?.length ?? 0) - 1} title="Nach unten">
                    <ArrowDownwardIcon fontSize="small" />
                  </IconButton>
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <EditableField
                    value={step}
                    onChange={(v) => {
                      const arr = [...(c.nutzerflows.fehlerszenario ?? [])];
                      arr[i] = v;
                      updateUserStoryNestedField('de', 'nutzerflows', 'fehlerszenario', arr);
                    }}
                    label={`Schritt ${i + 1}`}
                  />
                </Box>
              </Box>
            ))}
          </Box>
        )}
        <Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            🚫 Out of Scope
            <Button size="small" startIcon={<AddIcon />} onClick={() => updateUserStoryField('de', 'outOfScope', [...(c.outOfScope ?? []), ''])}>
              Hinzufügen
            </Button>
          </Typography>
          {(c.outOfScope ?? []).map((v, i) => (
            <Box key={i} sx={{ mb: 1, display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', mt: 0.5 }}>
                <IconButton size="small" onClick={() => { const arr = [...(c.outOfScope ?? [])]; if (i > 0) { [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]; updateUserStoryField('de', 'outOfScope', arr); } }} disabled={i === 0} title="Nach oben">
                  <ArrowUpwardIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => { const arr = [...(c.outOfScope ?? [])]; if (i < arr.length - 1) { [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]]; updateUserStoryField('de', 'outOfScope', arr); } }} disabled={i === (c.outOfScope?.length ?? 0) - 1} title="Nach unten">
                  <ArrowDownwardIcon fontSize="small" />
                </IconButton>
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <EditableField value={v} onChange={(val) => { const arr = [...(c.outOfScope ?? [])]; arr[i] = val; updateUserStoryField('de', 'outOfScope', arr); }} label={`${i + 1}`} multiline />
              </Box>
              <IconButton size="small" onClick={() => updateUserStoryField('de', 'outOfScope', (c.outOfScope ?? []).filter((_, idx) => idx !== i))} color="error" title="Entfernen">
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Box>
        <Dialog open={!!regenSection} onClose={() => setRegenSection(null)} maxWidth="sm" fullWidth>
          <DialogTitle>Sektion mit KI anpassen</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              label="Anweisung / Prompt"
              fullWidth
              multiline
              minRows={3}
              value={regenPrompt}
              onChange={(e) => setRegenPrompt(e.target.value)}
              placeholder="z.B.: Der Happy Flow soll 5 Schritte haben und eine Fehlermeldung bei ungültiger Eingabe berücksichtigen."
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRegenSection(null)}>Abbrechen</Button>
            <Button onClick={handleRegenSection} variant="contained" disabled={!regenPrompt.trim()}>
              Generieren
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  const c = content as UserStory['en'];
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
          📝 Description
          <SectionRegenButton section="description" />
        </Typography>
        <EditableField value={c.description} onChange={(v) => updateUserStoryField('en', 'description', v)} multiline minRows={2} />
      </Box>
      <Box>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          ✅ Acceptance Criteria
          <SectionRegenButton section="acceptanceCriteria" />
          <Button size="small" startIcon={<AddIcon />} onClick={() => updateUserStoryField('en', 'acceptanceCriteria', [...c.acceptanceCriteria, ''])}>
            Add
          </Button>
        </Typography>
        {c.acceptanceCriteria.map((ac, i) => (
          <Box key={i} sx={{ mb: 1, display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', mt: 0.5 }}>
              <IconButton size="small" onClick={() => { const arr = [...c.acceptanceCriteria]; if (i > 0) { [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]; updateUserStoryField('en', 'acceptanceCriteria', arr); } }} disabled={i === 0} title="Move up">
                <ArrowUpwardIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => { const arr = [...c.acceptanceCriteria]; if (i < arr.length - 1) { [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]]; updateUserStoryField('en', 'acceptanceCriteria', arr); } }} disabled={i === c.acceptanceCriteria.length - 1} title="Move down">
                <ArrowDownwardIcon fontSize="small" />
              </IconButton>
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <EditableField value={stripAcPrefix(ac)} onChange={(v) => updateUserStoryArrayField('en', 'acceptanceCriteria', i, v)} label={`AC${i + 1}`} multiline />
            </Box>
            <IconButton size="small" onClick={() => updateUserStoryField('en', 'acceptanceCriteria', c.acceptanceCriteria.filter((_, idx) => idx !== i))} color="error" title="Remove">
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        ))}
      </Box>
      <Box>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          👥 Roles
        </Typography>
        <EditableField value={c.roles} onChange={(v) => updateUserStoryField('en', 'roles', v)} multiline />
      </Box>
      <Box>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          🔑 Prerequisites
          <Button size="small" startIcon={<AddIcon />} onClick={() => updateUserStoryField('en', 'prerequisites', [...(c.prerequisites ?? []), ''])}>
            Add
          </Button>
        </Typography>
        {(c.prerequisites ?? []).map((v, i) => (
          <Box key={i} sx={{ mb: 1, display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', mt: 0.5 }}>
              <IconButton size="small" onClick={() => { const arr = [...(c.prerequisites ?? [])]; if (i > 0) { [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]; updateUserStoryField('en', 'prerequisites', arr); } }} disabled={i === 0} title="Move up">
                <ArrowUpwardIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => { const arr = [...(c.prerequisites ?? [])]; if (i < arr.length - 1) { [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]]; updateUserStoryField('en', 'prerequisites', arr); } }} disabled={i === (c.prerequisites?.length ?? 0) - 1} title="Move down">
                <ArrowDownwardIcon fontSize="small" />
              </IconButton>
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <EditableField value={v} onChange={(val) => { const arr = [...(c.prerequisites ?? [])]; arr[i] = val; updateUserStoryField('en', 'prerequisites', arr); }} label={`${i + 1}`} multiline />
            </Box>
            <IconButton size="small" onClick={() => updateUserStoryField('en', 'prerequisites', (c.prerequisites ?? []).filter((_, idx) => idx !== i))} color="error" title="Remove">
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        ))}
      </Box>
      <Box>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
          🔀 User Flows – Happy path
          <SectionRegenButton section="userFlows.happyPath" />
        </Typography>
        {c.userFlows.happyPath.map((step, i) => (
          <Box key={i} sx={{ mb: 1, display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', mt: 0.5 }}>
              <IconButton size="small" onClick={() => { const arr = [...c.userFlows.happyPath]; if (i > 0) { [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]; updateUserStoryNestedField('en', 'userFlows', 'happyPath', arr); } }} disabled={i === 0} title="Move up">
                <ArrowUpwardIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => { const arr = [...c.userFlows.happyPath]; if (i < arr.length - 1) { [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]]; updateUserStoryNestedField('en', 'userFlows', 'happyPath', arr); } }} disabled={i === c.userFlows.happyPath.length - 1} title="Move down">
                <ArrowDownwardIcon fontSize="small" />
              </IconButton>
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <EditableField
                value={step}
                onChange={(v) => {
                  const arr = [...c.userFlows.happyPath];
                  arr[i] = v;
                  updateUserStoryNestedField('en', 'userFlows', 'happyPath', arr);
                }}
                label={`Step ${i + 1}`}
              />
            </Box>
          </Box>
        ))}
      </Box>
      {c.userFlows.errorScenario && c.userFlows.errorScenario.length > 0 && (
        <Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            🔀 User Flows – Error scenario
          </Typography>
          {c.userFlows.errorScenario.map((step, i) => (
            <Box key={i} sx={{ mb: 1, display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', mt: 0.5 }}>
                <IconButton size="small" onClick={() => { const arr = [...(c.userFlows.errorScenario ?? [])]; if (i > 0) { [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]; updateUserStoryNestedField('en', 'userFlows', 'errorScenario', arr); } }} disabled={i === 0} title="Move up">
                  <ArrowUpwardIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => { const arr = [...(c.userFlows.errorScenario ?? [])]; if (i < arr.length - 1) { [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]]; updateUserStoryNestedField('en', 'userFlows', 'errorScenario', arr); } }} disabled={i === (c.userFlows.errorScenario?.length ?? 0) - 1} title="Move down">
                  <ArrowDownwardIcon fontSize="small" />
                </IconButton>
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <EditableField
                  value={step}
                  onChange={(v) => {
                    const arr = [...(c.userFlows.errorScenario ?? [])];
                    arr[i] = v;
                    updateUserStoryNestedField('en', 'userFlows', 'errorScenario', arr);
                  }}
                  label={`Step ${i + 1}`}
                />
              </Box>
            </Box>
          ))}
        </Box>
      )}
      <Box>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          🚫 Out of Scope
          <Button size="small" startIcon={<AddIcon />} onClick={() => updateUserStoryField('en', 'outOfScope', [...(c.outOfScope ?? []), ''])}>
            Add
          </Button>
        </Typography>
        {(c.outOfScope ?? []).map((v, i) => (
          <Box key={i} sx={{ mb: 1, display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', mt: 0.5 }}>
              <IconButton size="small" onClick={() => { const arr = [...(c.outOfScope ?? [])]; if (i > 0) { [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]; updateUserStoryField('en', 'outOfScope', arr); } }} disabled={i === 0} title="Move up">
                <ArrowUpwardIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => { const arr = [...(c.outOfScope ?? [])]; if (i < arr.length - 1) { [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]]; updateUserStoryField('en', 'outOfScope', arr); } }} disabled={i === (c.outOfScope?.length ?? 0) - 1} title="Move down">
                <ArrowDownwardIcon fontSize="small" />
              </IconButton>
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <EditableField value={v} onChange={(val) => { const arr = [...(c.outOfScope ?? [])]; arr[i] = val; updateUserStoryField('en', 'outOfScope', arr); }} label={`${i + 1}`} multiline />
            </Box>
            <IconButton size="small" onClick={() => updateUserStoryField('en', 'outOfScope', (c.outOfScope ?? []).filter((_, idx) => idx !== i))} color="error" title="Remove">
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        ))}
      </Box>

      <Dialog open={!!regenSection} onClose={() => setRegenSection(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Regenerate section with AI</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            label="Instruction / Prompt"
            fullWidth
            multiline
            minRows={3}
            value={regenPrompt}
            onChange={(e) => setRegenPrompt(e.target.value)}
            placeholder="e.g.: The happy path should have 5 steps and consider an error message for invalid input."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRegenSection(null)}>Cancel</Button>
          <Button onClick={handleRegenSection} variant="contained" disabled={!regenPrompt.trim()}>
            Generate
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export function StoryEditor({ item, store, ai, settings, onDelete, activeLangTab, onActiveLangTabChange }: StoryEditorProps) {
  const [internalTab, setInternalTab] = useState(0);
  const tab = activeLangTab ?? internalTab;
  const setTab = onActiveLangTabChange ?? setInternalTab;
  const [fullRegenOpen, setFullRegenOpen] = useState(false);
  const [fullRegenPrompt, setFullRegenPrompt] = useState('');
  const [linksRegenOpen, setLinksRegenOpen] = useState(false);
  const [linksRegenPrompt, setLinksRegenPrompt] = useState('');

  const handleLinksRegen = async () => {
    if (!settings?.apiKey || !linksRegenPrompt.trim()) return;
    const result = await ai.regenerateSection('de', 'links', linksRegenPrompt, settings);
    if (result && Array.isArray(result) && item?.type === 'user-story') {
      store.updateUserStoryLinks(result);
      setLinksRegenOpen(false);
      setLinksRegenPrompt('');
    }
  };

  const handleFullRegen = async () => {
    if (!item || !fullRegenPrompt.trim() || !settings?.apiKey) return;
    const updated = await ai.regenerateFullStory(item, fullRegenPrompt.trim(), settings);
    if (updated) {
      store.setCurrentItem(updated);
      store.setItems(store.items.map((i) => (i.id === updated.id ? updated : i)));
      setFullRegenOpen(false);
      setFullRegenPrompt('');
    }
  };

  const handleSyncDEToEN = async () => {
    if (!item || !settings?.apiKey) return;
    const updated = await ai.syncDEToEN(item, settings);
    if (updated) {
      store.setCurrentItem(updated);
      store.setItems(store.items.map((i) => (i.id === updated.id ? updated : i)));
    }
  };

  if (!item) return null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Paper elevation={2} sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="h5">User Story</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
            <TextField
              value={tab === 0 ? item.title : (item.titleEN ?? item.title)}
              onChange={(e) => store.updateField(tab === 0 ? 'title' : 'titleEN', e.target.value)}
              size="small"
              placeholder={tab === 0 ? 'Titel (DE)' : 'Title (EN)'}
              sx={{ flex: 1, minWidth: 240, '& .MuiOutlinedInput-root': { bgcolor: 'action.hover' } }}
            />
            <Button
              size="small"
              startIcon={<AutoAwesomeIcon />}
              onClick={() => setFullRegenOpen(true)}
              disabled={!settings?.apiKey}
            >
              Alles mit KI anpassen
            </Button>
            {onDelete && (
              <IconButton onClick={() => onDelete(item.id)} color="error" title="Löschen">
                <DeleteIcon />
              </IconButton>
            )}
          </Box>
        </Box>

        <Dialog open={fullRegenOpen} onClose={() => setFullRegenOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Alles mit KI anpassen</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              label="Anpassungswunsch / Prompt"
              fullWidth
              multiline
              minRows={4}
              value={fullRegenPrompt}
              onChange={(e) => setFullRegenPrompt(e.target.value)}
              placeholder="z.B.: Akzeptanzkriterien präzisieren, Fehlerszenario ergänzen, Beschreibung kürzer fassen..."
              sx={{ mt: 1 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setFullRegenOpen(false)}>Abbrechen</Button>
            <Button onClick={handleFullRegen} variant="contained" disabled={!fullRegenPrompt.trim() || ai.isLoading}>
              {ai.isLoading ? 'Wird angepasst...' : 'Anpassen'}
            </Button>
          </DialogActions>
        </Dialog>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ flex: 1, minWidth: 0 }}>
            <Tab label="Deutsch" />
            <Tab label="English" />
          </Tabs>
          <Button
            size="small"
            variant="outlined"
            startIcon={ai.isLoading ? undefined : <TranslateIcon />}
            onClick={handleSyncDEToEN}
            disabled={!settings?.apiKey || ai.isLoading}
          >
            {ai.isLoading ? 'Wird übertragen…' : 'DE → EN übertragen'}
          </Button>
        </Box>

        {tab === 0 && <StoryLangEditor lang="de" content={item.de} store={store} ai={ai} settings={settings} item={item} />}
        {tab === 1 && <StoryLangEditor lang="en" content={item.en} store={store} ai={ai} settings={settings} item={item} />}

        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            🔗 Links / Ressourcen
            <Button size="small" startIcon={<AddIcon />} onClick={() => store.updateUserStoryLinks([...(item.links ?? []), ''])}>
              Hinzufügen
            </Button>
            <Button size="small" startIcon={<AutoAwesomeIcon />} onClick={() => setLinksRegenOpen(true)} disabled={!settings?.apiKey}>
              Mit KI anpassen
            </Button>
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
            Gemeinsam für DE (Krankenkasse) und EN (Entwickler) – ein Eintrag für beide
          </Typography>
          {(item.links ?? []).map((v, i) => (
            <Box key={i} sx={{ mb: 1, display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', mt: 0.5 }}>
                <IconButton size="small" onClick={() => { const arr = [...(item.links ?? [])]; if (i > 0) { [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]; store.updateUserStoryLinks(arr); } }} disabled={i === 0} title="Nach oben">
                  <ArrowUpwardIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => { const arr = [...(item.links ?? [])]; if (i < arr.length - 1) { [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]]; store.updateUserStoryLinks(arr); } }} disabled={i === (item.links?.length ?? 0) - 1} title="Nach unten">
                  <ArrowDownwardIcon fontSize="small" />
                </IconButton>
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <EditableField
                  value={v}
                  onChange={(val) => {
                    const arr = [...(item.links ?? [])];
                    arr[i] = val;
                    store.updateUserStoryLinks(arr);
                  }}
                  label={`${i + 1}`}
                  multiline
                />
              </Box>
              <IconButton size="small" onClick={() => store.updateUserStoryLinks((item.links ?? []).filter((_, idx) => idx !== i))} color="error" title="Entfernen">
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Box>

        <Dialog open={linksRegenOpen} onClose={() => setLinksRegenOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Links mit KI anpassen</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              label="Anweisung / Prompt"
              fullWidth
              multiline
              minRows={3}
              value={linksRegenPrompt}
              onChange={(e) => setLinksRegenPrompt(e.target.value)}
              placeholder="z.B.: Füge den Jira-Link PROJ-123 hinzu, entferne veraltete Design-Links."
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setLinksRegenOpen(false)}>Abbrechen</Button>
            <Button onClick={handleLinksRegen} variant="contained" disabled={!linksRegenPrompt.trim() || ai.isLoading}>
              {ai.isLoading ? 'Wird angepasst...' : 'Anpassen'}
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>

      <StoryCopyBookSection item={item} store={store} ai={ai} settings={settings} />

      <MarkdownPreview item={item} activeLang={tab === 0 ? 'de' : 'en'} settings={settings} />
    </Box>
  );
}
