import { useState } from 'react';
import { Box, Paper, Typography, IconButton, Tabs, Tab, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, CircularProgress } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import TranslateIcon from '@mui/icons-material/Translate';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import KeyboardDoubleArrowUpIcon from '@mui/icons-material/KeyboardDoubleArrowUp';
import KeyboardDoubleArrowDownIcon from '@mui/icons-material/KeyboardDoubleArrowDown';
import { EditableField } from './EditableField';
import { MarkdownPreview } from './MarkdownPreview';
import { stripAcPrefix } from '../utils/format';
import { StoryCopyBookSection } from './StoryCopyBookSection';
import type { UserStory } from '../types/story';
import type { UseStoryStoreReturn } from '../hooks/useStoryStore';
import type { UseAIGeneratorReturn } from '../hooks/useAIGenerator';
import type { Settings } from '../types/story';
import { useSnackbar } from '../contexts/SnackbarContext';

interface StoryEditorProps {
  item: UserStory | null;
  store: UseStoryStoreReturn;
  ai: UseAIGeneratorReturn;
  settings: Settings | null;
  onDelete?: (id: string) => void;
  onSave?: () => Promise<void>;
  saveLoading?: boolean;
  hasStorageAccess?: boolean;
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
  hideTodos,
}: {
  lang: 'de' | 'en';
  content: UserStory['de'] | UserStory['en'];
  store: UseStoryStoreReturn;
  ai: UseAIGeneratorReturn;
  settings: Settings | null;
  item: UserStory;
  hideTodos?: boolean;
}) {
  const [regenSection, setRegenSection] = useState<string | null>(null);
  const [regenPrompt, setRegenPrompt] = useState('');

  const { updateUserStoryField, updateUserStoryArrayField, updateUserStoryNestedField } = store;

  const hasApiKey = Boolean(settings?.apiKeyOpenAI || settings?.apiKeyAnthropic || settings?.apiKey);
  const handleRegenSection = async () => {
    if (!regenSection || !hasApiKey) return;
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
      disabled={!hasApiKey}
      sx={{ ml: 1 }}
    >
      Mit KI anpassen
    </Button>
  );

  const getSectionForListType = (listType: string): string => {
    if (listType === 'happyFlow') return lang === 'de' ? 'nutzerflows.happyFlow' : 'userFlows.happyPath';
    if (listType === 'fehlerszenario') return lang === 'de' ? 'nutzerflows.fehlerszenario' : 'userFlows.errorScenario';
    return listType;
  };

  const SingleItemGenButton = ({
    listType,
    index,
    onGenerated,
  }: {
    listType: 'akzeptanzkriterien' | 'acceptanceCriteria' | 'voraussetzungen' | 'prerequisites' | 'outOfScope' | 'happyFlow' | 'fehlerszenario' | 'happyPath' | 'errorScenario';
    index: number;
    onGenerated: (value: string) => void;
  }) => {
    const handleGen = async () => {
      const section = getSectionForListType(listType);
      const result = await ai.generateSingleListItem(item, lang, section, settings, undefined, index);
      if (result) onGenerated(result);
    };
    return (
      <IconButton size="small" onClick={handleGen} disabled={!hasApiKey || ai.isLoading} title={lang === 'de' ? 'Mit KI generieren' : 'Generate with AI'}>
        <AutoAwesomeIcon fontSize="small" />
      </IconButton>
    );
  };

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
            <Button size="small" startIcon={<AutoAwesomeIcon />} onClick={async () => { const v = await ai.generateSingleListItem(item, 'de', 'akzeptanzkriterien', settings); if (v) updateUserStoryField('de', 'akzeptanzkriterien', [...c.akzeptanzkriterien, v]); }} disabled={!hasApiKey || ai.isLoading}>
              Mit KI
            </Button>
          </Typography>
          {c.akzeptanzkriterien.map((ac, i) => (
            <Box key={i} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <IconButton size="small" onClick={() => { const arr = [...c.akzeptanzkriterien]; const [item] = arr.splice(i, 1); arr.unshift(item); updateUserStoryField('de', 'akzeptanzkriterien', arr); }} disabled={i === 0} title="Ganz nach oben">
                  <KeyboardDoubleArrowUpIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => { const arr = [...c.akzeptanzkriterien]; if (i > 0) { [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]; updateUserStoryField('de', 'akzeptanzkriterien', arr); } }} disabled={i === 0} title="Nach oben">
                  <ArrowUpwardIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => { const arr = [...c.akzeptanzkriterien]; if (i < arr.length - 1) { [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]]; updateUserStoryField('de', 'akzeptanzkriterien', arr); } }} disabled={i === c.akzeptanzkriterien.length - 1} title="Nach unten">
                  <ArrowDownwardIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => { const arr = [...c.akzeptanzkriterien]; const [item] = arr.splice(i, 1); arr.push(item); updateUserStoryField('de', 'akzeptanzkriterien', arr); }} disabled={i === c.akzeptanzkriterien.length - 1} title="Ganz nach unten">
                  <KeyboardDoubleArrowDownIcon fontSize="small" />
                </IconButton>
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <EditableField value={stripAcPrefix(ac)} onChange={(v) => updateUserStoryArrayField('de', 'akzeptanzkriterien', i, v)} label={`AC${i + 1}`} multiline />
              </Box>
              <SingleItemGenButton listType="akzeptanzkriterien" index={i} onGenerated={(v) => { const arr = [...c.akzeptanzkriterien]; arr[i] = v; updateUserStoryField('de', 'akzeptanzkriterien', arr); }} />
              <IconButton size="small" onClick={() => updateUserStoryField('de', 'akzeptanzkriterien', c.akzeptanzkriterien.filter((_, idx) => idx !== i))} color="error" title="Entfernen" sx={{ flexShrink: 0 }}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
          <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
            <Button size="small" startIcon={<AddIcon />} onClick={() => updateUserStoryField('de', 'akzeptanzkriterien', [...c.akzeptanzkriterien, ''])}>
              Hinzufügen
            </Button>
            <Button size="small" startIcon={<AutoAwesomeIcon />} onClick={async () => { const v = await ai.generateSingleListItem(item, 'de', 'akzeptanzkriterien', settings); if (v) updateUserStoryField('de', 'akzeptanzkriterien', [...c.akzeptanzkriterien, v]); }} disabled={!hasApiKey || ai.isLoading}>
              Mit KI
            </Button>
          </Box>
        </Box>
        <Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            🔑 Voraussetzungen
            <Button size="small" startIcon={<AddIcon />} onClick={() => updateUserStoryField('de', 'voraussetzungen', [...(c.voraussetzungen ?? []), ''])}>
              Hinzufügen
            </Button>
            <Button size="small" startIcon={<AutoAwesomeIcon />} onClick={async () => { const v = await ai.generateSingleListItem(item, 'de', 'voraussetzungen', settings); if (v) updateUserStoryField('de', 'voraussetzungen', [...(c.voraussetzungen ?? []), v]); }} disabled={!hasApiKey || ai.isLoading}>
              Mit KI
            </Button>
          </Typography>
          {(c.voraussetzungen ?? []).map((v, i) => (
            <Box key={i} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
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
              <SingleItemGenButton listType="voraussetzungen" index={i} onGenerated={(val) => { const arr = [...(c.voraussetzungen ?? [])]; arr[i] = val; updateUserStoryField('de', 'voraussetzungen', arr); }} />
              <IconButton size="small" onClick={() => updateUserStoryField('de', 'voraussetzungen', (c.voraussetzungen ?? []).filter((_, idx) => idx !== i))} color="error" title="Entfernen" sx={{ flexShrink: 0 }}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Box>
        <Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            🔀 Nutzerflows – Happy Flow
            <SectionRegenButton section="nutzerflows.happyFlow" />
            <Button size="small" startIcon={<AddIcon />} onClick={() => updateUserStoryNestedField('de', 'nutzerflows', 'happyFlow', [...c.nutzerflows.happyFlow, ''])}>
              Hinzufügen
            </Button>
            <Button size="small" startIcon={<AutoAwesomeIcon />} onClick={async () => { const v = await ai.generateSingleListItem(item, 'de', 'nutzerflows.happyFlow', settings); if (v) updateUserStoryNestedField('de', 'nutzerflows', 'happyFlow', [...c.nutzerflows.happyFlow, v]); }} disabled={!hasApiKey || ai.isLoading}>
              Mit KI
            </Button>
          </Typography>
          {c.nutzerflows.happyFlow.map((step, i) => (
            <Box key={i} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
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
              <SingleItemGenButton listType="happyFlow" index={i} onGenerated={(v) => { const arr = [...c.nutzerflows.happyFlow]; arr[i] = v; updateUserStoryNestedField('de', 'nutzerflows', 'happyFlow', arr); }} />
              <IconButton size="small" onClick={() => updateUserStoryNestedField('de', 'nutzerflows', 'happyFlow', c.nutzerflows.happyFlow.filter((_, idx) => idx !== i))} color="error" title="Entfernen" sx={{ flexShrink: 0 }}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Box>
        <Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            🔀 Nutzerflows – Fehlerszenario
            <SectionRegenButton section="nutzerflows.fehlerszenario" />
            <Button size="small" startIcon={<AddIcon />} onClick={() => updateUserStoryNestedField('de', 'nutzerflows', 'fehlerszenario', [...(c.nutzerflows.fehlerszenario ?? []), ''])}>
              Hinzufügen
            </Button>
            <Button size="small" startIcon={<AutoAwesomeIcon />} onClick={async () => { const v = await ai.generateSingleListItem(item, 'de', 'nutzerflows.fehlerszenario', settings); if (v) updateUserStoryNestedField('de', 'nutzerflows', 'fehlerszenario', [...(c.nutzerflows.fehlerszenario ?? []), v]); }} disabled={!hasApiKey || ai.isLoading}>
              Mit KI
            </Button>
          </Typography>
          {(c.nutzerflows.fehlerszenario ?? []).map((step, i) => (
            <Box key={i} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
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
              <SingleItemGenButton listType="fehlerszenario" index={i} onGenerated={(v) => { const arr = [...(c.nutzerflows.fehlerszenario ?? [])]; arr[i] = v; updateUserStoryNestedField('de', 'nutzerflows', 'fehlerszenario', arr); }} />
              <IconButton size="small" onClick={() => updateUserStoryNestedField('de', 'nutzerflows', 'fehlerszenario', (c.nutzerflows.fehlerszenario ?? []).filter((_, idx) => idx !== i))} color="error" title="Entfernen" sx={{ flexShrink: 0 }}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Box>
        <Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            🚫 Out of Scope
            <Button size="small" startIcon={<AddIcon />} onClick={() => updateUserStoryField('de', 'outOfScope', [...(c.outOfScope ?? []), ''])}>
              Hinzufügen
            </Button>
            <Button size="small" startIcon={<AutoAwesomeIcon />} onClick={async () => { const v = await ai.generateSingleListItem(item, 'de', 'outOfScope', settings); if (v) updateUserStoryField('de', 'outOfScope', [...(c.outOfScope ?? []), v]); }} disabled={!hasApiKey || ai.isLoading}>
              Mit KI
            </Button>
          </Typography>
          {(c.outOfScope ?? []).map((v, i) => (
            <Box key={i} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
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
              <SingleItemGenButton listType="outOfScope" index={i} onGenerated={(val) => { const arr = [...(c.outOfScope ?? [])]; arr[i] = val; updateUserStoryField('de', 'outOfScope', arr); }} />
              <IconButton size="small" onClick={() => updateUserStoryField('de', 'outOfScope', (c.outOfScope ?? []).filter((_, idx) => idx !== i))} color="error" title="Entfernen" sx={{ flexShrink: 0 }}>
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
          <Button size="small" startIcon={<AutoAwesomeIcon />} onClick={async () => { const v = await ai.generateSingleListItem(item, 'en', 'acceptanceCriteria', settings); if (v) updateUserStoryField('en', 'acceptanceCriteria', [...c.acceptanceCriteria, v]); }} disabled={!hasApiKey || ai.isLoading}>
            With AI
          </Button>
        </Typography>
        {c.acceptanceCriteria.map((ac, i) => (
          <Box key={i} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <IconButton size="small" onClick={() => { const arr = [...c.acceptanceCriteria]; const [item] = arr.splice(i, 1); arr.unshift(item); updateUserStoryField('en', 'acceptanceCriteria', arr); }} disabled={i === 0} title="Move to top">
                <KeyboardDoubleArrowUpIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => { const arr = [...c.acceptanceCriteria]; if (i > 0) { [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]; updateUserStoryField('en', 'acceptanceCriteria', arr); } }} disabled={i === 0} title="Move up">
                <ArrowUpwardIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => { const arr = [...c.acceptanceCriteria]; if (i < arr.length - 1) { [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]]; updateUserStoryField('en', 'acceptanceCriteria', arr); } }} disabled={i === c.acceptanceCriteria.length - 1} title="Move down">
                <ArrowDownwardIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => { const arr = [...c.acceptanceCriteria]; const [item] = arr.splice(i, 1); arr.push(item); updateUserStoryField('en', 'acceptanceCriteria', arr); }} disabled={i === c.acceptanceCriteria.length - 1} title="Move to bottom">
                <KeyboardDoubleArrowDownIcon fontSize="small" />
              </IconButton>
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <EditableField value={stripAcPrefix(ac)} onChange={(v) => updateUserStoryArrayField('en', 'acceptanceCriteria', i, v)} label={`AC${i + 1}`} multiline />
            </Box>
            <SingleItemGenButton listType="acceptanceCriteria" index={i} onGenerated={(v) => { const arr = [...c.acceptanceCriteria]; arr[i] = v; updateUserStoryField('en', 'acceptanceCriteria', arr); }} />
            <IconButton size="small" onClick={() => updateUserStoryField('en', 'acceptanceCriteria', c.acceptanceCriteria.filter((_, idx) => idx !== i))} color="error" title="Remove" sx={{ flexShrink: 0 }}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        ))}
        <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
          <Button size="small" startIcon={<AddIcon />} onClick={() => updateUserStoryField('en', 'acceptanceCriteria', [...c.acceptanceCriteria, ''])}>
            Add
          </Button>
          <Button size="small" startIcon={<AutoAwesomeIcon />} onClick={async () => { const v = await ai.generateSingleListItem(item, 'en', 'acceptanceCriteria', settings); if (v) updateUserStoryField('en', 'acceptanceCriteria', [...c.acceptanceCriteria, v]); }} disabled={!hasApiKey || ai.isLoading}>
            With AI
          </Button>
        </Box>
      </Box>
      {!hideTodos && (
        <Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            🗒️ To-Do's (BE / FE / QA)
          </Typography>
          {(['be', 'fe', 'qa'] as const).map((area) => (
            <Box key={area} sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                {area.toUpperCase()}
              </Typography>
              {(c.todos?.[area] ?? []).map((t, i) => (
                <Box key={i} sx={{ mb: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <EditableField
                      value={t}
                      onChange={(v) => {
                        const arr = [...(c.todos?.[area] ?? [])];
                        arr[i] = v;
                        updateUserStoryNestedField('en', 'todos', area, arr);
                      }}
                      label=""
                    />
                  </Box>
                  <IconButton size="small" onClick={() => updateUserStoryNestedField('en', 'todos', area, (c.todos?.[area] ?? []).filter((_, idx) => idx !== i))} color="error" title="Remove">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
              <Button size="small" startIcon={<AddIcon />} onClick={() => updateUserStoryNestedField('en', 'todos', area, [...(c.todos?.[area] ?? []), ''])} sx={{ mt: 0.5 }}>
                Add
              </Button>
            </Box>
          ))}
        </Box>
      )}
      <Box>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          👥 Roles
        </Typography>
        <EditableField value={c.roles} onChange={(v) => updateUserStoryField('en', 'roles', v)} multiline />
        <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
          <Button size="small" startIcon={<AddIcon />} onClick={() => updateUserStoryField('en', 'roles', (c.roles?.trim() ? `${c.roles}\n• ` : '• '))}>
            Add
          </Button>
        </Box>
      </Box>
      <Box>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          🔑 Prerequisites
          <Button size="small" startIcon={<AddIcon />} onClick={() => updateUserStoryField('en', 'prerequisites', [...(c.prerequisites ?? []), ''])}>
            Add
          </Button>
          <Button size="small" startIcon={<AutoAwesomeIcon />} onClick={async () => { const v = await ai.generateSingleListItem(item, 'en', 'prerequisites', settings); if (v) updateUserStoryField('en', 'prerequisites', [...(c.prerequisites ?? []), v]); }} disabled={!hasApiKey || ai.isLoading}>
            With AI
          </Button>
        </Typography>
        {(c.prerequisites ?? []).map((v, i) => (
          <Box key={i} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
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
            <SingleItemGenButton listType="prerequisites" index={i} onGenerated={(val) => { const arr = [...(c.prerequisites ?? [])]; arr[i] = val; updateUserStoryField('en', 'prerequisites', arr); }} />
            <IconButton size="small" onClick={() => updateUserStoryField('en', 'prerequisites', (c.prerequisites ?? []).filter((_, idx) => idx !== i))} color="error" title="Remove" sx={{ flexShrink: 0 }}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        ))}
      </Box>
      <Box>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          🔀 User Flows – Happy path
          <SectionRegenButton section="userFlows.happyPath" />
          <Button size="small" startIcon={<AddIcon />} onClick={() => updateUserStoryNestedField('en', 'userFlows', 'happyPath', [...c.userFlows.happyPath, ''])}>
            Add
          </Button>
          <Button size="small" startIcon={<AutoAwesomeIcon />} onClick={async () => { const v = await ai.generateSingleListItem(item, 'en', 'userFlows.happyPath', settings); if (v) updateUserStoryNestedField('en', 'userFlows', 'happyPath', [...c.userFlows.happyPath, v]); }} disabled={!hasApiKey || ai.isLoading}>
            With AI
          </Button>
        </Typography>
        {c.userFlows.happyPath.map((step, i) => (
          <Box key={i} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
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
            <SingleItemGenButton listType="happyPath" index={i} onGenerated={(v) => { const arr = [...c.userFlows.happyPath]; arr[i] = v; updateUserStoryNestedField('en', 'userFlows', 'happyPath', arr); }} />
            <IconButton size="small" onClick={() => updateUserStoryNestedField('en', 'userFlows', 'happyPath', c.userFlows.happyPath.filter((_, idx) => idx !== i))} color="error" title="Remove" sx={{ flexShrink: 0 }}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        ))}
      </Box>
      <Box>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          🔀 User Flows – Error scenario
          <SectionRegenButton section="userFlows.errorScenario" />
          <Button size="small" startIcon={<AddIcon />} onClick={() => updateUserStoryNestedField('en', 'userFlows', 'errorScenario', [...(c.userFlows.errorScenario ?? []), ''])}>
            Add
          </Button>
          <Button size="small" startIcon={<AutoAwesomeIcon />} onClick={async () => { const v = await ai.generateSingleListItem(item, 'en', 'userFlows.errorScenario', settings); if (v) updateUserStoryNestedField('en', 'userFlows', 'errorScenario', [...(c.userFlows.errorScenario ?? []), v]); }} disabled={!hasApiKey || ai.isLoading}>
            With AI
          </Button>
        </Typography>
        {(c.userFlows.errorScenario ?? []).map((step, i) => (
          <Box key={i} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
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
            <SingleItemGenButton listType="errorScenario" index={i} onGenerated={(v) => { const arr = [...(c.userFlows.errorScenario ?? [])]; arr[i] = v; updateUserStoryNestedField('en', 'userFlows', 'errorScenario', arr); }} />
            <IconButton size="small" onClick={() => updateUserStoryNestedField('en', 'userFlows', 'errorScenario', (c.userFlows.errorScenario ?? []).filter((_, idx) => idx !== i))} color="error" title="Remove" sx={{ flexShrink: 0 }}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        ))}
      </Box>
      <Box>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          🚫 Out of Scope
          <Button size="small" startIcon={<AddIcon />} onClick={() => updateUserStoryField('en', 'outOfScope', [...(c.outOfScope ?? []), ''])}>
            Add
          </Button>
          <Button size="small" startIcon={<AutoAwesomeIcon />} onClick={async () => { const v = await ai.generateSingleListItem(item, 'en', 'outOfScope', settings); if (v) updateUserStoryField('en', 'outOfScope', [...(c.outOfScope ?? []), v]); }} disabled={!hasApiKey || ai.isLoading}>
            With AI
          </Button>
        </Typography>
        {(c.outOfScope ?? []).map((v, i) => (
          <Box key={i} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
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
            <SingleItemGenButton listType="outOfScope" index={i} onGenerated={(val) => { const arr = [...(c.outOfScope ?? [])]; arr[i] = val; updateUserStoryField('en', 'outOfScope', arr); }} />
            <IconButton size="small" onClick={() => updateUserStoryField('en', 'outOfScope', (c.outOfScope ?? []).filter((_, idx) => idx !== i))} color="error" title="Remove" sx={{ flexShrink: 0 }}>
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

export function StoryEditor({ item, store, ai, settings, onDelete, onSave, saveLoading, hasStorageAccess, activeLangTab, onActiveLangTabChange }: StoryEditorProps) {
  const snackbar = useSnackbar();
  const [internalTab, setInternalTab] = useState(0);
  const tab = activeLangTab ?? internalTab;
  const setTab = onActiveLangTabChange ?? setInternalTab;
  const [fullRegenOpen, setFullRegenOpen] = useState(false);
  const [fullRegenPrompt, setFullRegenPrompt] = useState('');
  const [linksRegenOpen, setLinksRegenOpen] = useState(false);
  const [linksRegenPrompt, setLinksRegenPrompt] = useState('');
  const [todoPasteOpen, setTodoPasteOpen] = useState<'be' | 'fe' | 'qa' | null>(null);
  const [todoPasteText, setTodoPasteText] = useState('');
  const hasApiKey = Boolean(settings?.apiKeyOpenAI || settings?.apiKeyAnthropic || settings?.apiKey);

  const parsePastedTodoList = (text: string): string[] => {
    return text
      .split(/\r?\n/)
      .map((line) => line.replace(/^(\s*[\-•*·]\s*|\s*\d+\.\s*)+/, '').trim())
      .filter((line) => line.length > 0);
  };

  const handleTodoPasteApply = (area: 'be' | 'fe' | 'qa') => {
    const items = parsePastedTodoList(todoPasteText);
    if (items.length > 0) {
      store.updateUserStoryNestedField('en', 'todos', area, [...(item.en?.todos?.[area] ?? []), ...items]);
    }
    setTodoPasteOpen(null);
    setTodoPasteText('');
  };

  const handleLinksRegen = async () => {
    if (!hasApiKey || !linksRegenPrompt.trim()) return;
    const result = await ai.regenerateSection('de', 'links', linksRegenPrompt, settings);
    if (result && Array.isArray(result) && item?.type === 'user-story') {
      store.updateUserStoryLinks(result);
      setLinksRegenOpen(false);
      setLinksRegenPrompt('');
    }
  };

  const handleFullRegen = async () => {
    if (!item || !fullRegenPrompt.trim() || !hasApiKey) return;
    const updated = await ai.regenerateFullStory(item, fullRegenPrompt.trim(), settings);
    if (updated) {
      store.setCurrentItem(updated);
      store.setItems(store.items.map((i) => (i.id === updated.id ? updated : i)));
      setFullRegenOpen(false);
      setFullRegenPrompt('');
    }
  };

  const handleSyncDEToEN = async () => {
    if (!item || !hasApiKey) return;
    const updated = await ai.syncDEToEN(item, settings);
    if (updated) {
      store.setCurrentItem(updated);
      store.setItems(store.items.map((i) => (i.id === updated.id ? updated : i)));
      snackbar.showSuccess('DE → EN übertragen');
    }
  };

  const handleSyncENToDE = async () => {
    if (!item || !hasApiKey) return;
    const updated = await ai.syncENToDE(item, settings);
    if (updated) {
      store.setCurrentItem(updated);
      store.setItems(store.items.map((i) => (i.id === updated.id ? updated : i)));
      snackbar.showSuccess('EN → DE übertragen');
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
            {onSave && (
              <Button
                size="small"
                variant="contained"
                startIcon={saveLoading ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
                onClick={onSave}
                disabled={saveLoading || !hasStorageAccess}
                sx={{ flexShrink: 0 }}
              >
                {saveLoading ? 'Speichern…' : 'Speichern'}
              </Button>
            )}
            <Button
              size="small"
              startIcon={<AutoAwesomeIcon />}
              onClick={() => setFullRegenOpen(true)}
              disabled={!hasApiKey}
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
          {tab === 0 && (
            <Button
              size="small"
              variant="outlined"
              startIcon={ai.isLoading ? <CircularProgress size={18} color="inherit" /> : <TranslateIcon />}
              onClick={handleSyncDEToEN}
              disabled={!hasApiKey || ai.isLoading || !item.de?.beschreibung?.trim()}
            >
              {ai.isLoading ? 'Wird übertragen…' : 'DE → EN'}
            </Button>
          )}
          {tab === 1 && (
            <Button
              size="small"
              variant="outlined"
              startIcon={ai.isLoading ? <CircularProgress size={18} color="inherit" /> : <TranslateIcon />}
              onClick={handleSyncENToDE}
              disabled={!hasApiKey || ai.isLoading || !item.en?.description?.trim()}
            >
              {ai.isLoading ? 'Wird übertragen…' : 'EN → DE'}
            </Button>
          )}
        </Box>

        {tab === 0 && <StoryLangEditor lang="de" content={item.de} store={store} ai={ai} settings={settings} item={item} />}
        {tab === 1 && <StoryLangEditor lang="en" content={item.en} store={store} ai={ai} settings={settings} item={item} hideTodos />}

        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            🗒️ To-Do's (BE / FE / QA)
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
            Optional – werden im Markdown angezeigt, wenn der Toggle aktiv ist.
          </Typography>
          {(['be', 'fe', 'qa'] as const).map((area) => (
            <Box key={area} sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                {area.toUpperCase()}
              </Typography>
              {(item.en?.todos?.[area] ?? []).map((t, i) => (
                <Box key={i} sx={{ mb: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <EditableField
                      value={t}
                      onChange={(v) => {
                        const arr = [...(item.en?.todos?.[area] ?? [])];
                        arr[i] = v;
                        store.updateUserStoryNestedField('en', 'todos', area, arr);
                      }}
                      label=""
                    />
                  </Box>
                  <IconButton
                    size="small"
                    onClick={async () => {
                      const v = await ai.generateSingleListItem(item, 'en', `todos.${area}`, settings, undefined, i);
                      if (v) {
                        const arr = [...(item.en?.todos?.[area] ?? [])];
                        arr[i] = v;
                        store.updateUserStoryNestedField('en', 'todos', area, arr);
                      }
                    }}
                    disabled={!hasApiKey || ai.isLoading}
                    title="Mit KI ersetzen"
                  >
                    <AutoAwesomeIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => store.updateUserStoryNestedField('en', 'todos', area, (item.en?.todos?.[area] ?? []).filter((_, idx) => idx !== i))} color="error" title="Entfernen">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
              <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                <Button size="small" startIcon={<AddIcon />} onClick={() => store.updateUserStoryNestedField('en', 'todos', area, [...(item.en?.todos?.[area] ?? []), ''])}>
                  Hinzufügen
                </Button>
                <Button
                  size="small"
                  startIcon={<PlaylistAddIcon />}
                  onClick={() => {
                    setTodoPasteOpen(area);
                    setTodoPasteText('');
                  }}
                >
                  Liste einfügen
                </Button>
                <Button
                  size="small"
                  startIcon={<AutoAwesomeIcon />}
                  onClick={async () => {
                    const v = await ai.generateSingleListItem(item, 'en', `todos.${area}`, settings);
                    if (v) store.updateUserStoryNestedField('en', 'todos', area, [...(item.en?.todos?.[area] ?? []), v]);
                  }}
                  disabled={!hasApiKey || ai.isLoading}
                >
                  Mit KI
                </Button>
              </Box>
            </Box>
          ))}
        </Box>

        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            🔗 Links / Ressourcen
            <Button size="small" startIcon={<AddIcon />} onClick={() => store.updateUserStoryLinks([...(item.links ?? []), ''])}>
              Hinzufügen
            </Button>
            <Button size="small" startIcon={<AutoAwesomeIcon />} onClick={() => setLinksRegenOpen(true)} disabled={!(settings?.apiKeyOpenAI || settings?.apiKeyAnthropic || settings?.apiKey)}>
              Mit KI anpassen
            </Button>
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
            Gemeinsam für DE (Krankenkasse) und EN (Entwickler) – ein Eintrag für beide
          </Typography>
          <TextField
            size="small"
            label="Jira Ticket"
            placeholder="z.B. PROJ-123 oder https://jira.example.com/browse/PROJ-123"
            value={item.jiraTicket ?? ''}
            onChange={(e) => store.updateField('jiraTicket', e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
            <TextField
              size="small"
              type="number"
              label="Aufwand BE (PD)"
              value={item.efforts?.be ?? ''}
              onChange={(e) => {
                const n = parseFloat(e.target.value);
                const v = e.target.value === '' || isNaN(n) ? undefined : n;
                store.updateField('efforts', { ...item.efforts, be: v });
              }}
              inputProps={{ min: 0, step: 0.5 }}
              sx={{ width: 120 }}
            />
            <TextField
              size="small"
              type="number"
              label="Aufwand FE (PD)"
              value={item.efforts?.fe ?? ''}
              onChange={(e) => {
                const n = parseFloat(e.target.value);
                const v = e.target.value === '' || isNaN(n) ? undefined : n;
                store.updateField('efforts', { ...item.efforts, fe: v });
              }}
              inputProps={{ min: 0, step: 0.5 }}
              sx={{ width: 120 }}
            />
            <TextField
              size="small"
              type="number"
              label="Aufwand QA (PD)"
              value={item.efforts?.qa ?? ''}
              onChange={(e) => {
                const n = parseFloat(e.target.value);
                const v = e.target.value === '' || isNaN(n) ? undefined : n;
                store.updateField('efforts', { ...item.efforts, qa: v });
              }}
              inputProps={{ min: 0, step: 0.5 }}
              sx={{ width: 120 }}
            />
          </Box>
          {(item.links ?? []).map((v, i) => (
            <Box key={i} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
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
              <IconButton size="small" onClick={() => store.updateUserStoryLinks((item.links ?? []).filter((_, idx) => idx !== i))} color="error" title="Entfernen" sx={{ flexShrink: 0 }}>
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

        <Dialog
          open={todoPasteOpen !== null}
          onClose={() => { setTodoPasteOpen(null); setTodoPasteText(''); }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Liste einfügen – {todoPasteOpen ? todoPasteOpen.toUpperCase() : ''}</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              label="Liste mit Aufzählungszeichen"
              fullWidth
              multiline
              minRows={6}
              value={todoPasteText}
              onChange={(e) => setTodoPasteText(e.target.value)}
              placeholder={`z.B.:
- Erste Aufgabe
- Zweite Aufgabe
• Oder mit Bullet-Points
1. Oder nummeriert`}
            />
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              Ein Zeile pro Punkt. Aufzählungszeichen (-, •, *, 1.) werden automatisch entfernt.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { setTodoPasteOpen(null); setTodoPasteText(''); }}>Abbrechen</Button>
            <Button
              variant="contained"
              onClick={() => todoPasteOpen && handleTodoPasteApply(todoPasteOpen)}
              disabled={!todoPasteText.trim()}
            >
              Einfügen
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>

      <StoryCopyBookSection item={item} store={store} ai={ai} settings={settings} />

      <MarkdownPreview item={item} activeLang={tab === 0 ? 'de' : 'en'} settings={settings} />
    </Box>
  );
}
