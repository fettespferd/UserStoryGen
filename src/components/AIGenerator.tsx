import { useState, useRef } from 'react';
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
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ImageIcon from '@mui/icons-material/Image';
import DeleteIcon from '@mui/icons-material/Delete';
import type { TicketTypeChoice } from './TicketTypeSelector';
import type { Settings, StoryItem, ProjectType } from '../types/story';
import type { UseAIGeneratorReturn } from '../hooks/useAIGenerator';

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
  const [project, setProject] = useState<ProjectType>('aokn');
  const [prompt, setPrompt] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    const dataUrls: string[] = [];
    for (let i = 0; i < Math.min(files.length, 5); i++) {
      if (files[i].type.startsWith('image/')) {
        dataUrls.push(await fileToDataUrl(files[i]));
      }
    }
    setImages((prev) => [...prev, ...dataUrls].slice(0, 5));
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    const result = await ai.generate(
      prompt,
      selectedType,
      settings,
      images.length ? images : undefined,
      project
    );
    if (result) {
      onGenerated(result);
    }
  };

  const canGenerate = settings?.apiKey && prompt.trim().length > 0;

  return (
    <Paper elevation={2} sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AutoAwesomeIcon color="primary" />
        Mit KI generieren
      </Typography>

      {!settings?.apiKey && (
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
          <ToggleButton value="bug-de">Bug Report</ToggleButton>
        </ToggleButtonGroup>
      </Box>

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

      <Box sx={{ mb: 2 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          Design-Bilder (optional)
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
          Bilder hochladen
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

      <Button
        variant="contained"
        fullWidth
        startIcon={ai.isLoading ? <CircularProgress size={20} color="inherit" /> : <AutoAwesomeIcon />}
        onClick={handleGenerate}
        disabled={!canGenerate || ai.isLoading}
        sx={{ py: 1.5 }}
      >
        {ai.isLoading ? 'Generiere...' : 'Generieren'}
      </Button>

      {ai.error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {ai.error}
        </Alert>
      )}
    </Paper>
  );
}
