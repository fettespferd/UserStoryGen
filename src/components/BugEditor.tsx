import { useRef, useState } from 'react';
import { Box, Paper, Typography, IconButton, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Tabs, Tab } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { EditableField } from './EditableField';
import { MarkdownPreview } from './MarkdownPreview';
import type { BugReport, Settings } from '../types/story';
import type { UseStoryStoreReturn } from '../hooks/useStoryStore';
import type { UseAIGeneratorReturn } from '../hooks/useAIGenerator';

interface BugEditorProps {
  item: BugReport | null;
  store: UseStoryStoreReturn;
  ai: UseAIGeneratorReturn;
  settings?: Settings | null;
  onDelete?: (id: string) => void;
  activeLangTab?: number;
  onActiveLangTabChange?: (tab: number) => void;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const LABELS_DE = {
  description: 'Beschreibung',
  expectedResult: 'Erwartetes Ergebnis (SOLL)',
  actualResult: 'Tatsächliches Ergebnis (IST)',
  stepsToReproduce: 'Schritte zur Reproduktion',
  technicalDetails: 'Technische Details',
  severityPriority: 'Schweregrad / Priorität',
  resources: 'Ressourcen',
  outOfScope: 'Außerhalb des Scope',
  step: 'Schritt',
  screenshots: 'Screenshots / Bilder',
  addImages: 'Bilder hinzufügen',
};

const LABELS_EN = {
  description: 'Description',
  expectedResult: 'Expected Result',
  actualResult: 'Actual Result',
  stepsToReproduce: 'Steps to Reproduce',
  technicalDetails: 'Technical Details',
  severityPriority: 'Severity / Priority',
  resources: 'Resources',
  outOfScope: 'Out of Scope',
  step: 'Step',
  screenshots: 'Screenshots / Images',
  addImages: 'Add images',
};

export function BugEditor({ item, store, ai, settings, onDelete, activeLangTab = 0, onActiveLangTabChange }: BugEditorProps) {
  const { updateBugReportField, updateBugReportArrayField, updateBugReportImages } = store;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fullRegenOpen, setFullRegenOpen] = useState(false);
  const [fullRegenPrompt, setFullRegenPrompt] = useState('');
  const lang: 'de' | 'en' = activeLangTab === 1 ? 'en' : 'de';
  const labels = lang === 'de' ? LABELS_DE : LABELS_EN;
  const content = lang === 'de' ? item?.de : item?.en;

  const hasApiKey = Boolean(settings?.apiKeyOpenAI || settings?.apiKeyAnthropic || settings?.apiKey);
  const handleFullRegen = async () => {
    if (!item || !fullRegenPrompt.trim() || !hasApiKey) return;
    const updated = await ai.regenerateFullBugReport(item, fullRegenPrompt.trim(), settings ?? null);
    if (updated) {
      store.setCurrentItem(updated);
      store.setItems(store.items.map((i) => (i.id === updated.id ? updated : i)));
      setFullRegenOpen(false);
      setFullRegenPrompt('');
    }
  };

  if (!item || !content) return null;

  const images = item.images ?? [];

  const handleAddImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    const dataUrls: string[] = [];
    for (let i = 0; i < Math.min(files.length, 5); i++) {
      if (files[i].type.startsWith('image/')) {
        dataUrls.push(await fileToDataUrl(files[i]));
      }
    }
    if (dataUrls.length > 0) {
      updateBugReportImages([...images, ...dataUrls].slice(0, 10));
    }
    e.target.value = '';
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Paper elevation={2} sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="h5">Bug Report</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
            <Tabs value={activeLangTab} onChange={(_, v) => onActiveLangTabChange?.(v)} sx={{ minHeight: 36, '& .MuiTab-root': { minHeight: 36, py: 0.5 } }}>
              <Tab label="🇩🇪 Deutsch" />
              <Tab label="🇬🇧 English" />
            </Tabs>
            <TextField
              value={content.title}
              onChange={(e) => updateBugReportField(lang, 'title', e.target.value)}
              size="small"
              placeholder={lang === 'de' ? 'Titel' : 'Title'}
              sx={{ flex: 1, minWidth: 240, '& .MuiOutlinedInput-root': { bgcolor: 'action.hover' } }}
            />
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
              placeholder="z.B.: Beschreibung präzisieren, Schritte zur Reproduktion ergänzen..."
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

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              📝 {labels.description}
            </Typography>
            <EditableField
              value={content.description}
              onChange={(v) => updateBugReportField(lang, 'description', v)}
              multiline
              minRows={2}
            />
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              ✅ {labels.expectedResult}
            </Typography>
            <EditableField
              value={content.expectedResult}
              onChange={(v) => updateBugReportField(lang, 'expectedResult', v)}
              multiline
            />
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              ❌ {labels.actualResult}
            </Typography>
            <EditableField
              value={content.actualResult}
              onChange={(v) => updateBugReportField(lang, 'actualResult', v)}
              multiline
            />
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              🔁 {labels.stepsToReproduce}
            </Typography>
            {content.stepsToReproduce.map((step, i) => (
              <Box key={i} sx={{ mb: 1 }}>
                <EditableField
                  value={step}
                  onChange={(v) => updateBugReportArrayField(lang, 'stepsToReproduce', i, v)}
                  label={`${labels.step} ${i + 1}`}
                  multiline
                />
              </Box>
            ))}
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              🛠️ {labels.technicalDetails}
            </Typography>
            <EditableField
              value={content.technicalDetails}
              onChange={(v) => updateBugReportField(lang, 'technicalDetails', v)}
              multiline
            />
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              📊 {labels.severityPriority}
            </Typography>
            <EditableField
              value={content.severityPriority}
              onChange={(v) => updateBugReportField(lang, 'severityPriority', v)}
              multiline
            />
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              📚 {labels.resources}
            </Typography>
            <EditableField
              value={content.resources}
              onChange={(v) => updateBugReportField(lang, 'resources', v)}
              multiline
            />
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              🚫 {labels.outOfScope}
            </Typography>
            <EditableField
              value={content.outOfScope}
              onChange={(v) => updateBugReportField(lang, 'outOfScope', v)}
              multiline
            />
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              📷 {labels.screenshots}
            </Typography>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={handleAddImages}
            />
            <Button
              variant="outlined"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => fileInputRef.current?.click()}
            >
              {labels.addImages}
            </Button>
            {images.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {images.map((dataUrl, i) => (
                  <Box
                    key={i}
                    sx={{
                      position: 'relative',
                      width: 64,
                      height: 64,
                      borderRadius: 1,
                      overflow: 'hidden',
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <img
                      src={dataUrl}
                      alt={`Screenshot ${i + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => updateBugReportImages(images.filter((_, idx) => idx !== i))}
                      sx={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        bgcolor: 'rgba(0,0,0,0.6)',
                        color: 'white',
                        '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </Box>
      </Paper>

      <MarkdownPreview item={item} activeLang={lang} settings={settings} />
    </Box>
  );
}
