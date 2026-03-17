import { useState, useRef, useEffect } from 'react';
import {
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Box,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ImageIcon from '@mui/icons-material/Image';
import DeleteIcon from '@mui/icons-material/Delete';
import ClearIcon from '@mui/icons-material/Clear';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import type { Settings, StoryItem, ProjectType, TicketTypeChoice, CopyBookEntry } from '../types/story';
import type { UseAIGeneratorReturn } from '../hooks/useAIGenerator';
import { getPromptTemplates } from '../utils/templates';

function toMarkdownTable(entries: CopyBookEntry[]): string {
  if (entries.length === 0) return '';
  const header = '| Element | Text DE | Text EN |';
  const separator = '| --- | --- | --- |';
  const rows = entries.map(
    (e) => `| ${e.elementName} | ${e.textDE.replace(/\|/g, '\\|')} | ${e.textEN.replace(/\|/g, '\\|')} |`
  );
  return [header, separator, ...rows].join('\n');
}

interface AIGeneratorProps {
  ai: UseAIGeneratorReturn;
  settings: Settings | null;
  onGenerated: (item: StoryItem) => void;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function AIGenerator({ ai, settings, onGenerated }: AIGeneratorProps) {
  const [selectedType, setSelectedType] = useState<TicketTypeChoice>('user-story');
  const defaultProject = settings?.defaultProject ?? 'aokn';
  const showProjectOption = settings?.showProjectOption ?? true;
  const [project, setProject] = useState<ProjectType>(defaultProject);
  const [prompt, setPrompt] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copyResultDialog, setCopyResultDialog] = useState<CopyBookEntry[] | null>(null);

  useEffect(() => {
    setProject(defaultProject);
  }, [defaultProject]);

  const processFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const imageFiles = fileArray.filter((f) => f.type.startsWith('image/'));
    if (!imageFiles.length) return;
    const dataUrls: string[] = [];
    for (let i = 0; i < Math.min(imageFiles.length, 5 - images.length); i++) {
      dataUrls.push(await fileToDataUrl(imageFiles[i]));
    }
    setImages((prev) => [...prev, ...dataUrls].slice(0, 5));
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    await processFiles(files);
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (images.length < 5) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (!files?.length || images.length >= 5) return;
    await processFiles(files);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    if (selectedType === 'copy-table') {
      if (!images.length || !settings) return;
      const extracted = await ai.extractCopyBook(images, settings);
      if (extracted?.length) {
        setCopyResultDialog(extracted);
      }
      return;
    }
    if (!prompt.trim()) return;
    const projectToUse = showProjectOption ? project : defaultProject;
    const result = await ai.generate(
      prompt,
      selectedType,
      settings,
      images.length ? images : undefined,
      projectToUse
    );
    if (result) {
      onGenerated(result);
    }
  };

  const hasApiKey = Boolean(
    settings?.apiKeyOpenAI || settings?.apiKeyAnthropic || settings?.apiKey
  );
  const canGenerate =
    hasApiKey &&
    (selectedType === 'copy-table' ? images.length > 0 : prompt.trim().length > 0);
  const promptTemplates = getPromptTemplates(settings?.promptTemplates);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  useEffect(() => {
    const valid = promptTemplates.some((t) => t.id === selectedTemplateId);
    if (!valid && promptTemplates[0]) setSelectedTemplateId(promptTemplates[0].id);
  }, [promptTemplates, selectedTemplateId]);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        width: '100%',
        minWidth: 0,
        boxSizing: 'border-box',
        bgcolor: 'background.paper',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AddCircleOutlineIcon sx={{ color: 'primary.main', fontSize: 22 }} />
        {selectedType === 'copy-table' ? 'Copy Tabelle' : 'Neue Story erstellen'}
      </Typography>

      {!hasApiKey && (
        <Alert severity="info" sx={{ mb: 2 }}>
          API-Key in den Einstellungen hinterlegen, um die KI-Generierung zu nutzen.
        </Alert>
      )}

      <Box sx={{ mb: 2 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
          Typ
        </Typography>
        <ToggleButtonGroup
          value={selectedType}
          exclusive
          onChange={(_, v) => v && setSelectedType(v)}
          fullWidth
          size="small"
          sx={{
            bgcolor: 'action.hover',
            borderRadius: 1.5,
            p: 0.5,
            '& .MuiToggleButton-root': { border: 'none', py: 1, textTransform: 'none', fontWeight: 600 },
            '& .Mui-selected': { bgcolor: 'primary.main', color: 'primary.contrastText' },
          }}
        >
          <ToggleButton value="user-story">User Story</ToggleButton>
          <ToggleButton value="bug">Bug Report</ToggleButton>
          <ToggleButton value="copy-table">Copy Tabelle</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {showProjectOption && selectedType !== 'copy-table' && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
            Projekt
          </Typography>
          <ToggleButtonGroup
            value={project}
            exclusive
            onChange={(_, v) => v && setProject(v)}
            fullWidth
            size="small"
            sx={{
              bgcolor: 'action.hover',
              borderRadius: 1.5,
              p: 0.5,
              '& .MuiToggleButton-root': { border: 'none', py: 1, textTransform: 'none', fontWeight: 600 },
              '& .Mui-selected': { bgcolor: 'primary.main', color: 'primary.contrastText' },
            }}
          >
            <ToggleButton value="aokn">AOKN</ToggleButton>
            <ToggleButton value="healthmatch">HealthMatch</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      )}

      <Box
        sx={{
          mb: 2,
          p: 2,
          borderRadius: 2,
          border: '2px dashed',
          borderColor: isDragging ? 'primary.main' : 'divider',
          bgcolor: isDragging ? 'action.selected' : 'transparent',
          transition: 'border-color 0.2s, background-color 0.2s',
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          {selectedType === 'copy-table' ? 'Design-Bilder (erforderlich)' : 'Design-Bilder (optional)'}
        </Typography>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={handleImageSelect}
        />
        <Button
          variant="outlined"
          size="small"
          startIcon={<ImageIcon />}
          onClick={() => fileInputRef.current?.click()}
          disabled={images.length >= 5}
        >
          Bilder hochladen {images.length < 5 && 'oder hier ablegen'}
        </Button>
        {images.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
            {images.map((dataUrl, i) => (
              <Box
                key={i}
                sx={{
                  position: 'relative',
                  width: 56,
                  height: 56,
                  borderRadius: 1,
                  overflow: 'hidden',
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <img
                  src={dataUrl}
                  alt={`Upload ${i + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <IconButton
                  size="small"
                  onClick={() => removeImage(i)}
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

      {selectedType !== 'copy-table' && (
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            Vorlage für KI-Prompt
          </Typography>
          {prompt.trim() && (
            <Button
              size="small"
              startIcon={<ClearIcon />}
              onClick={() => setPrompt('')}
              sx={{ minWidth: 'auto', px: 1, color: 'text.secondary' }}
            >
              Leeren
            </Button>
          )}
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <FormControl size="small" fullWidth>
            <InputLabel>Vorlage</InputLabel>
            <Select
              value={selectedTemplateId || promptTemplates[0]?.id || ''}
              label="Vorlage"
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              sx={{ '& .MuiSelect-select': { overflow: 'hidden', textOverflow: 'ellipsis' } }}
            >
              {promptTemplates.map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  {t.nameLong || t.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            size="small"
            onClick={() => {
              const t = promptTemplates.find((x) => x.id === (selectedTemplateId || promptTemplates[0]?.id));
              if (t) setPrompt(t.prompt);
            }}
            disabled={ai.isLoading || !promptTemplates.length}
          >
            Einfügen
          </Button>
        </Box>
      </Box>
      )}

      {selectedType !== 'copy-table' && (
      <TextField
        label="Beschreibung / Stichpunkte"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        multiline
        minRows={4}
        fullWidth
        required
        placeholder="z.B.: Als Patient möchte ich meine Termine online buchen können..."
        sx={{ mb: 2 }}
      />
      )}

      {selectedType === 'copy-table' && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Lade Design-Bilder hoch und klicke auf Generieren. Die UI-Texte werden extrahiert – ohne User Story.
        </Typography>
      )}

      <Button
        variant="contained"
        fullWidth
        startIcon={ai.isLoading ? <CircularProgress size={20} color="inherit" /> : <AddCircleOutlineIcon />}
        onClick={handleGenerate}
        disabled={!canGenerate || ai.isLoading}
        sx={{ py: 1.5 }}
      >
        {ai.isLoading
          ? selectedType === 'copy-table'
            ? 'Wird extrahiert…'
            : 'Wird erstellt…'
          : selectedType === 'copy-table'
            ? 'Copy Tabelle generieren'
            : 'Story erstellen'}
      </Button>

      {ai.error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {ai.error}
        </Alert>
      )}

      <Dialog
        open={copyResultDialog !== null}
        onClose={() => setCopyResultDialog(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle>Copy Tabelle – generiert</DialogTitle>
        <DialogContent>
          {copyResultDialog && copyResultDialog.length > 0 && (
            <TableContainer sx={{ maxHeight: 360, border: '1px solid', borderColor: 'divider', borderRadius: 1, mt: 1 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Element</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Text DE</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Text EN</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {copyResultDialog.map((entry, index) => (
                    <TableRow key={index}>
                      <TableCell>{entry.elementName}</TableCell>
                      <TableCell>{entry.textDE}</TableCell>
                      <TableCell>{entry.textEN}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            variant="contained"
            startIcon={<ContentCopyIcon />}
            onClick={() => {
              if (copyResultDialog?.length) {
                navigator.clipboard.writeText(toMarkdownTable(copyResultDialog));
              }
            }}
            disabled={!copyResultDialog?.length}
          >
            Als Tabelle kopieren
          </Button>
          <Button onClick={() => setCopyResultDialog(null)}>Schließen</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
