import { useRef, useState } from 'react';
import { Box, Paper, Typography, IconButton, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import TranslateIcon from '@mui/icons-material/Translate';
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
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function BugEditor({ item, store, ai, settings, onDelete }: BugEditorProps) {
  const { updateField, updateArrayField, updateBugReportImages } = store;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fullRegenOpen, setFullRegenOpen] = useState(false);
  const [fullRegenPrompt, setFullRegenPrompt] = useState('');

  const handleFullRegen = async () => {
    if (!item || !fullRegenPrompt.trim() || !settings?.apiKey) return;
    const updated = await ai.regenerateFullBugReport(item, fullRegenPrompt.trim(), settings);
    if (updated) {
      store.setCurrentItem(updated);
      store.setItems(store.items.map((i) => (i.id === updated.id ? updated : i)));
      setFullRegenOpen(false);
      setFullRegenPrompt('');
    }
  };

  const handleTranslateTitle = async () => {
    if (!item || !settings?.apiKey) return;
    const updated = await ai.translateBugTitleToEN(item, settings);
    if (updated) {
      store.setCurrentItem(updated);
      store.setItems(store.items.map((i) => (i.id === updated.id ? updated : i)));
    }
  };

  if (!item) return null;

  const isDe = item.lang === 'de';
  const labels = isDe
    ? {
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
      }
    : {
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
          <Typography variant="h5">Bug Report ({item.lang === 'de' ? 'Deutsch' : 'English'})</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
            <TextField
              value={item.title}
              onChange={(e) => updateField('title', e.target.value)}
              size="small"
              placeholder="Titel"
              sx={{ flex: 1, minWidth: 240, '& .MuiOutlinedInput-root': { bgcolor: 'action.hover' } }}
            />
            {isDe && (
              <Button
                size="small"
                variant="outlined"
                startIcon={ai.isLoading ? undefined : <TranslateIcon />}
                onClick={handleTranslateTitle}
                disabled={!settings?.apiKey || ai.isLoading}
                title="Titel ins Englische übersetzen"
              >
                {ai.isLoading ? '…' : 'Titel übersetzen'}
              </Button>
            )}
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
              value={item.description}
              onChange={(v) => updateField('description', v)}
              multiline
              minRows={2}
            />
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              ✅ {labels.expectedResult}
            </Typography>
            <EditableField
              value={item.expectedResult}
              onChange={(v) => updateField('expectedResult', v)}
              multiline
            />
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              ❌ {labels.actualResult}
            </Typography>
            <EditableField
              value={item.actualResult}
              onChange={(v) => updateField('actualResult', v)}
              multiline
            />
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              🔁 {labels.stepsToReproduce}
            </Typography>
            {item.stepsToReproduce.map((step, i) => (
              <Box key={i} sx={{ mb: 1 }}>
                <EditableField
                  value={step}
                  onChange={(v) => updateArrayField('stepsToReproduce', i, v)}
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
              value={item.technicalDetails}
              onChange={(v) => updateField('technicalDetails', v)}
              multiline
            />
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              📊 {labels.severityPriority}
            </Typography>
            <EditableField
              value={item.severityPriority}
              onChange={(v) => updateField('severityPriority', v)}
              multiline
            />
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              📚 {labels.resources}
            </Typography>
            <EditableField
              value={item.resources}
              onChange={(v) => updateField('resources', v)}
              multiline
            />
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              🚫 {labels.outOfScope}
            </Typography>
            <EditableField
              value={item.outOfScope}
              onChange={(v) => updateField('outOfScope', v)}
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

      <MarkdownPreview item={item} settings={settings} />
    </Box>
  );
}
