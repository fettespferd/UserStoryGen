import { useRef } from 'react';
import { Box, Paper, Typography, IconButton, Button } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { EditableField } from './EditableField';
import { MarkdownPreview } from './MarkdownPreview';
import type { BugReport, Settings } from '../types/story';
import type { UseStoryStoreReturn } from '../hooks/useStoryStore';

interface BugEditorProps {
  item: BugReport | null;
  store: UseStoryStoreReturn;
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

export function BugEditor({ item, store, settings, onDelete }: BugEditorProps) {
  const { updateField, updateArrayField, updateBugReportImages } = store;
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!item) return null;

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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">Bug Report ({item.lang === 'de' ? 'Deutsch' : 'English'})</Typography>
          {onDelete && (
            <IconButton onClick={() => onDelete(item.id)} color="error" title="Löschen">
              <DeleteIcon />
            </IconButton>
          )}
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              🏷️ Title
            </Typography>
            <EditableField
              value={item.title}
              onChange={(v) => updateField('title', v)}
            />
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              📝 Description
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
              ✅ Expected Result (SOLL)
            </Typography>
            <EditableField
              value={item.expectedResult}
              onChange={(v) => updateField('expectedResult', v)}
              multiline
            />
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              ❌ Actual Result (IST)
            </Typography>
            <EditableField
              value={item.actualResult}
              onChange={(v) => updateField('actualResult', v)}
              multiline
            />
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              🔁 Steps to Reproduce
            </Typography>
            {item.stepsToReproduce.map((step, i) => (
              <Box key={i} sx={{ mb: 1 }}>
                <EditableField
                  value={step}
                  onChange={(v) => updateArrayField('stepsToReproduce', i, v)}
                  label={`Step ${i + 1}`}
                  multiline
                />
              </Box>
            ))}
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              🛠️ Technical Details
            </Typography>
            <EditableField
              value={item.technicalDetails}
              onChange={(v) => updateField('technicalDetails', v)}
              multiline
            />
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              📊 Severity / Priority
            </Typography>
            <EditableField
              value={item.severityPriority}
              onChange={(v) => updateField('severityPriority', v)}
              multiline
            />
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              📚 Resources
            </Typography>
            <EditableField
              value={item.resources}
              onChange={(v) => updateField('resources', v)}
              multiline
            />
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              🚫 Out of Scope
            </Typography>
            <EditableField
              value={item.outOfScope}
              onChange={(v) => updateField('outOfScope', v)}
              multiline
            />
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              📷 Screenshots / Bilder
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
              Bilder hinzufügen
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
