import { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import type { Settings as SettingsType, AIProvider, MarkdownHeadingLevel } from '../types/story';
import type { UseStorageReturn } from '../hooks/useStorage';
import { FolderAccessDialog } from './FolderAccessDialog';
import { getDefaultSystemPrompt } from '../hooks/useAIGenerator';

interface SettingsProps {
  storage: UseStorageReturn;
  settings: SettingsType | null;
  onSettingsChange: (settings: SettingsType) => void;
  onSettingsLoaded: (settings: SettingsType) => void;
}

const defaultSettings: SettingsType = {
  provider: 'openai',
  defaultLang: 'de',
  defaultTicketType: 'user-story',
};

export function Settings({
  storage,
  settings,
  onSettingsChange,
  onSettingsLoaded,
}: SettingsProps) {
  const [apiKey, setApiKey] = useState(settings?.apiKey ?? '');
  const [provider, setProvider] = useState<AIProvider>(settings?.provider ?? 'openai');
  const [defaultLang, setDefaultLang] = useState<'de' | 'en'>(settings?.defaultLang ?? 'de');
  const [defaultTicketType, setDefaultTicketType] = useState<'user-story' | 'bug'>(
    settings?.defaultTicketType ?? 'user-story'
  );
  const [customSystemPrompt, setCustomSystemPrompt] = useState(settings?.customSystemPrompt ?? '');
  const [markdownHeadingLevel, setMarkdownHeadingLevel] = useState<MarkdownHeadingLevel>(
    settings?.markdownHeadingLevel ?? 'h3'
  );
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [folderDialogLoading, setFolderDialogLoading] = useState(false);

  useEffect(() => {
    if (settings) {
      setApiKey(settings.apiKey ?? '');
      setProvider(settings.provider);
      setDefaultLang(settings.defaultLang);
      setDefaultTicketType(settings.defaultTicketType);
      setCustomSystemPrompt(settings.customSystemPrompt ?? '');
      setMarkdownHeadingLevel(settings.markdownHeadingLevel ?? 'h3');
    }
  }, [settings]);

  const handleOpenFolderDialog = () => {
    setFolderDialogOpen(true);
  };

  const handleFolderDialogConfirm = async (): Promise<boolean> => {
    setFolderDialogLoading(true);
    try {
      const ok = await storage.requestFolderAccess();
      if (ok && storage.hasAccess) {
        const loaded = await storage.loadSettings();
        if (loaded) {
          onSettingsLoaded(loaded);
        } else {
          onSettingsLoaded({ ...defaultSettings });
        }
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      setFolderDialogLoading(false);
    }
  };

  const handleSave = async () => {
    const next: SettingsType = {
      apiKey: apiKey || undefined,
      provider,
      defaultLang,
      defaultTicketType,
      customSystemPrompt: customSystemPrompt.trim() || undefined,
      markdownHeadingLevel,
    };
    onSettingsChange(next);
    if (storage.hasAccess) {
      try {
        await storage.saveSettings(next);
      } catch (err) {
        console.error('Failed to save settings', err);
      }
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom>
        Einstellungen
      </Typography>

      {!storage.isSupported && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Die File System Access API wird von diesem Browser nicht unterstützt (Chrome/Edge erforderlich).
          Stories können nur in der Session gespeichert werden.
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box>
          <Button
            variant="outlined"
            startIcon={<FolderOpenIcon />}
            onClick={handleOpenFolderDialog}
            disabled={!storage.isSupported}
          >
            Ordner auswählen
          </Button>
          <FolderAccessDialog
            open={folderDialogOpen}
            onClose={() => setFolderDialogOpen(false)}
            onConfirm={handleFolderDialogConfirm}
            isLoading={folderDialogLoading}
          />
          {storage.folderName && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Aktueller Ordner: {storage.folderName}
            </Typography>
          )}
        </Box>

        <TextField
          label="API-Key (OpenAI / Anthropic)"
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          fullWidth
          size="small"
          placeholder="sk-... oder aus .env.local (VITE_API_KEY)"
          helperText="Speichern nicht vergessen! Alternativ: .env.local mit VITE_API_KEY=... anlegen und Dev-Server neu starten."
        />

        <FormControl fullWidth size="small">
          <InputLabel>KI-Provider</InputLabel>
          <Select
            value={provider}
            label="KI-Provider"
            onChange={(e) => setProvider(e.target.value as AIProvider)}
          >
            <MenuItem value="openai">OpenAI (GPT)</MenuItem>
            <MenuItem value="anthropic">Anthropic (Claude)</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth size="small">
          <InputLabel>Standard-Sprache</InputLabel>
          <Select
            value={defaultLang}
            label="Standard-Sprache"
            onChange={(e) => setDefaultLang(e.target.value as 'de' | 'en')}
          >
            <MenuItem value="de">Deutsch</MenuItem>
            <MenuItem value="en">English</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth size="small">
          <InputLabel>Standard-Ticket-Typ</InputLabel>
          <Select
            value={defaultTicketType}
            label="Standard-Ticket-Typ"
            onChange={(e) => setDefaultTicketType(e.target.value as 'user-story' | 'bug')}
          >
            <MenuItem value="user-story">User Story</MenuItem>
            <MenuItem value="bug">Bug Report</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth size="small">
          <InputLabel>Markdown-Überschriften</InputLabel>
          <Select
            value={markdownHeadingLevel}
            label="Markdown-Überschriften"
            onChange={(e) => setMarkdownHeadingLevel(e.target.value as MarkdownHeadingLevel)}
          >
            <MenuItem value="h1">H1 (#)</MenuItem>
            <MenuItem value="h2">H2 (##)</MenuItem>
            <MenuItem value="h3">H3 (###) – Standard für Jira/Confluence</MenuItem>
          </Select>
        </FormControl>

        <Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            System-Prompt (Leitplanken) für Story-Erstellung
          </Typography>
          <TextField
            value={customSystemPrompt}
            onChange={(e) => setCustomSystemPrompt(e.target.value)}
            multiline
            minRows={6}
            fullWidth
            size="small"
            placeholder="Leer = Standard-Prompt. Hier eigene Leitplanken eintragen, die die KI bei der Story-Erstellung befolgen soll."
            helperText="Überschreibt den Standard-Prompt. Muss mit 'Antworte NUR mit gültigem JSON' enden, damit die Ausgabe funktioniert."
          />
          <Button
            size="small"
            onClick={() => setCustomSystemPrompt(getDefaultSystemPrompt('de'))}
            sx={{ mt: 1 }}
          >
            Standard (DE) laden
          </Button>
          <Button
            size="small"
            onClick={() => setCustomSystemPrompt(getDefaultSystemPrompt('en'))}
            sx={{ mt: 1, ml: 1 }}
          >
            Standard (EN) laden
          </Button>
        </Box>

        <Button variant="contained" onClick={handleSave}>
          Speichern
        </Button>
      </Box>
    </Paper>
  );
}
