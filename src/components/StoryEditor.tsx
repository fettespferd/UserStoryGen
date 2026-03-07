import { useState } from 'react';
import { Box, Paper, Typography, IconButton, Tabs, Tab, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { EditableField } from './EditableField';
import { MarkdownPreview } from './MarkdownPreview';
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
      if (Array.isArray(result)) {
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
                <EditableField value={ac} onChange={(v) => updateUserStoryArrayField('de', 'akzeptanzkriterien', i, v)} label={`AC${i + 1}`} multiline />
              </Box>
              <IconButton size="small" onClick={() => updateUserStoryField('de', 'akzeptanzkriterien', c.akzeptanzkriterien.filter((_, idx) => idx !== i))} color="error" title="Entfernen">
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Box>
        <Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            🔑 Voraussetzungen
          </Typography>
          <EditableField value={c.voraussetzungen} onChange={(v) => updateUserStoryField('de', 'voraussetzungen', v)} multiline />
        </Box>
        <Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
            🔀 Nutzerflows – Happy Flow
            <SectionRegenButton section="nutzerflows.happyFlow" />
          </Typography>
          {c.nutzerflows.happyFlow.map((step, i) => (
            <Box key={i} sx={{ mb: 1 }}>
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
          ))}
        </Box>
        {c.nutzerflows.fehlerszenario && c.nutzerflows.fehlerszenario.length > 0 && (
          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              🔀 Nutzerflows – Fehlerszenario
            </Typography>
            {c.nutzerflows.fehlerszenario.map((step, i) => (
              <Box key={i} sx={{ mb: 1 }}>
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
            ))}
          </Box>
        )}
        <Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            📚 Anhänge
          </Typography>
          <EditableField value={c.anhaenge} onChange={(v) => updateUserStoryField('de', 'anhaenge', v)} multiline />
        </Box>
        <Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            🚫 Out of Scope
          </Typography>
          <EditableField value={c.outOfScope} onChange={(v) => updateUserStoryField('de', 'outOfScope', v)} multiline />
        </Box>
        <Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            🎫 Jira Ticket
          </Typography>
          <EditableField value={c.jiraTicket} onChange={(v) => updateUserStoryField('de', 'jiraTicket', v)} />
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
              <EditableField value={ac} onChange={(v) => updateUserStoryArrayField('en', 'acceptanceCriteria', i, v)} label={`AC${i + 1}`} multiline />
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
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          🔑 Prerequisites
        </Typography>
        <EditableField value={c.prerequisites} onChange={(v) => updateUserStoryField('en', 'prerequisites', v)} multiline />
      </Box>
      <Box>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
          🔀 User Flows – Happy path
          <SectionRegenButton section="userFlows.happyPath" />
        </Typography>
        {c.userFlows.happyPath.map((step, i) => (
          <Box key={i} sx={{ mb: 1 }}>
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
        ))}
      </Box>
      {c.userFlows.errorScenario && c.userFlows.errorScenario.length > 0 && (
        <Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            🔀 User Flows – Error scenario
          </Typography>
          {c.userFlows.errorScenario.map((step, i) => (
            <Box key={i} sx={{ mb: 1 }}>
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
          ))}
        </Box>
      )}
      <Box>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          📚 Resources
        </Typography>
        <EditableField value={c.resources} onChange={(v) => updateUserStoryField('en', 'resources', v)} multiline />
      </Box>
      <Box>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          🚫 Out of Scope
        </Typography>
        <EditableField value={c.outOfScope} onChange={(v) => updateUserStoryField('en', 'outOfScope', v)} multiline />
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

export function StoryEditor({ item, store, ai, settings, onDelete }: StoryEditorProps) {
  const [tab, setTab] = useState(0);

  if (!item) return null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Paper elevation={2} sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="h5">User Story</Typography>
          <TextField
            value={item.title}
            onChange={(e) => store.updateField('title', e.target.value)}
            size="small"
            placeholder="Story-Titel"
            sx={{ maxWidth: 320, '& .MuiOutlinedInput-root': { bgcolor: 'action.hover' } }}
          />
          {onDelete && (
            <IconButton onClick={() => onDelete(item.id)} color="error" title="Löschen">
              <DeleteIcon />
            </IconButton>
          )}
        </Box>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab label="Deutsch" />
          <Tab label="English" />
        </Tabs>

        {tab === 0 && <StoryLangEditor lang="de" content={item.de} store={store} ai={ai} settings={settings} item={item} />}
        {tab === 1 && <StoryLangEditor lang="en" content={item.en} store={store} ai={ai} settings={settings} item={item} />}
      </Paper>

      <StoryCopyBookSection item={item} store={store} ai={ai} settings={settings} />

      <MarkdownPreview item={item} activeLang={tab === 0 ? 'de' : 'en'} settings={settings} />
    </Box>
  );
}
