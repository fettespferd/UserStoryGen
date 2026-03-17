import { useRef, useState } from 'react';
import {
  Paper,
  Typography,
  Button,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TextField,
  Alert,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ImageIcon from '@mui/icons-material/Image';
import type { UserStory, CopyBookEntry, Settings } from '../types/story';
import { useSnackbar } from '../contexts/SnackbarContext';
import type { UseStoryStoreReturn } from '../hooks/useStoryStore';
import type { UseAIGeneratorReturn } from '../hooks/useAIGenerator';
import { ImageLightbox } from './ImageLightbox';

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function toMarkdownTable(entries: CopyBookEntry[]): string {
  if (entries.length === 0) return '';
  const header = '| Element | Text DE | Text EN |';
  const separator = '| --- | --- | --- |';
  const rows = entries.map(
    (e) => `| ${e.elementName} | ${e.textDE.replace(/\|/g, '\\|')} | ${e.textEN.replace(/\|/g, '\\|')} |`
  );
  return [header, separator, ...rows].join('\n');
}

interface StoryCopyBookSectionProps {
  item: UserStory;
  store: UseStoryStoreReturn;
  ai: UseAIGeneratorReturn;
  settings: Settings | null;
}

export function StoryCopyBookSection({ item, store, ai, settings }: StoryCopyBookSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const extractInputRef = useRef<HTMLInputElement>(null);
  const snackbar = useSnackbar();
  const { updateUserStoryCopyBook, updateUserStoryImages } = store;

  const copyBook = item.copyBook ?? [];
  const images = item.images ?? [];
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const addRow = () => {
    updateUserStoryCopyBook([...copyBook, { elementName: '', textDE: '', textEN: '' }]);
  };

  const updateEntry = (index: number, field: keyof CopyBookEntry, value: string) => {
    const next = [...copyBook];
    next[index] = { ...next[index], [field]: value };
    updateUserStoryCopyBook(next);
  };

  const removeEntry = (index: number) => {
    updateUserStoryCopyBook(copyBook.filter((_, i) => i !== index));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(toMarkdownTable(copyBook));
    snackbar.showSuccess('In Zwischenablage kopiert');
  };

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
      updateUserStoryImages([...images, ...dataUrls].slice(0, 10));
    }
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    updateUserStoryImages(images.filter((_, i) => i !== index));
  };

  const handleExtractFromDesign = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length || !(settings?.apiKeyOpenAI || settings?.apiKeyAnthropic || settings?.apiKey)) return;
    const dataUrls: string[] = [];
    for (let i = 0; i < Math.min(files.length, 5); i++) {
      if (files[i].type.startsWith('image/')) {
        dataUrls.push(await fileToDataUrl(files[i]));
      }
    }
    if (dataUrls.length > 0) {
      const extracted = await ai.extractCopyBook(dataUrls, settings);
      if (extracted?.length) {
        updateUserStoryCopyBook([...extracted, ...copyBook]);
        updateUserStoryImages([...images, ...dataUrls].slice(0, 10));
      }
    }
    e.target.value = '';
  };

  const handleExtractFromExistingImages = async () => {
    if (!images.length || !(settings?.apiKeyOpenAI || settings?.apiKeyAnthropic || settings?.apiKey)) return;
    const extracted = await ai.extractCopyBook(images, settings);
    if (extracted?.length) {
      updateUserStoryCopyBook([...extracted, ...copyBook]);
    }
  };

  return (
    <Paper
      elevation={2}
      sx={{
        p: 3,
        bgcolor: 'background.paper',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Typography variant="h6" gutterBottom>
        Copy Book & Design-Bilder
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        UI-Texte und Bilder gehören zur Story – jederzeit neu extrahieren oder anpassen.
      </Typography>

      {/* Bilder */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          Design-Bilder
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
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
          <input
            ref={extractInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={handleExtractFromDesign}
          />
          <Tooltip title="Neue Bilder auswählen und UI-Texte extrahieren">
            <span>
              <Button
                variant="outlined"
                size="small"
                startIcon={
                  ai.isLoading ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <ImageIcon />
                  )
                }
                onClick={() => extractInputRef.current?.click()}
                disabled={!(settings?.apiKeyOpenAI || settings?.apiKeyAnthropic || settings?.apiKey) || ai.isLoading}
              >
                Aus Design extrahieren
              </Button>
            </span>
          </Tooltip>
          {images.length > 0 && (
            <Tooltip title="Text aus den bereits hochgeladenen Bildern extrahieren – kein erneuter Upload nötig">
              <span>
                <Button
                  variant="outlined"
                  size="small"
                  color="secondary"
                  startIcon={
                    ai.isLoading ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <ImageIcon />
                    )
                  }
                  onClick={handleExtractFromExistingImages}
                  disabled={!(settings?.apiKeyOpenAI || settings?.apiKeyAnthropic || settings?.apiKey) || ai.isLoading}
                >
                  Aus hochgeladenen Bildern extrahieren
                </Button>
              </span>
            </Tooltip>
          )}
        </Box>
        {images.length > 0 && (
          <>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              {images.length} Bild(er) vorhanden – Text extrahieren ohne erneuten Upload möglich.
            </Typography>
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
                  cursor: 'pointer',
                  '&:hover img': { opacity: 0.9 },
                }}
                onClick={() => setLightboxImage(dataUrl)}
              >
                <img
                  src={dataUrl}
                  alt={`Design ${i + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <IconButton
                  size="small"
                  onClick={(e) => { e.stopPropagation(); removeImage(i); }}
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
            <ImageLightbox
              open={!!lightboxImage}
              onClose={() => setLightboxImage(null)}
              src={lightboxImage ?? ''}
              alt="Design"
            />
          </>
        )}
      </Box>

      {!(settings?.apiKeyOpenAI || settings?.apiKeyAnthropic || settings?.apiKey) && (
        <Alert severity="info" sx={{ mb: 2 }}>
          API-Key in den Einstellungen für &quot;Aus Design extrahieren&quot; erforderlich.
        </Alert>
      )}

      {ai.error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {ai.error}
        </Alert>
      )}

      {/* Copy Book Tabelle */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={addRow}>
          Zeile hinzufügen
        </Button>
        <Button
          variant="contained"
          size="small"
          startIcon={<ContentCopyIcon />}
          onClick={handleCopy}
          disabled={copyBook.length === 0}
        >
          Als Tabelle kopieren
        </Button>
      </Box>

      <TableContainer sx={{ maxHeight: 280, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Element</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Text DE</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Text EN</TableCell>
              <TableCell width={48} />
            </TableRow>
          </TableHead>
          <TableBody>
            {copyBook.map((entry, index) => (
              <TableRow key={index}>
                <TableCell>
                  <TextField
                    value={entry.elementName}
                    onChange={(e) => updateEntry(index, 'elementName', e.target.value)}
                    placeholder="z.B. login_button"
                    size="small"
                    fullWidth
                    variant="standard"
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    value={entry.textDE}
                    onChange={(e) => updateEntry(index, 'textDE', e.target.value)}
                    placeholder="Deutscher Text"
                    size="small"
                    fullWidth
                    variant="standard"
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    value={entry.textEN}
                    onChange={(e) => updateEntry(index, 'textEN', e.target.value)}
                    placeholder="English text"
                    size="small"
                    fullWidth
                    variant="standard"
                  />
                </TableCell>
                <TableCell sx={{ verticalAlign: 'middle', width: 48 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IconButton size="small" onClick={() => removeEntry(index)} color="error" sx={{ flexShrink: 0 }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {copyBook.length === 0 && images.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
          Keine Einträge. Bilder hinzufügen und extrahieren, oder Zeile manuell hinzufügen.
        </Typography>
      )}
      {copyBook.length === 0 && images.length > 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
          Klicke auf &quot;Aus hochgeladenen Bildern extrahieren&quot;, um UI-Texte aus den vorhandenen Bildern zu extrahieren.
        </Typography>
      )}
    </Paper>
  );
}
