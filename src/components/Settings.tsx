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
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import type { Settings as SettingsType, AIProvider, OpenAIModel, AnthropicModel } from '../types/story';
import type { UseStorageReturn } from '../hooks/useStorage';
import { FolderAccessDialog } from './FolderAccessDialog';
import { getDefaultSystemPrompt } from '../hooks/useAIGenerator';

interface SettingsProps {
  storage: UseStorageReturn;
  settings: SettingsType | null;
  onSettingsChange: (settings: SettingsType) => void;
  onSettingsLoaded: (settings: SettingsType) => void;
  /** Wird aufgerufen, wenn ein Ordner erfolgreich ausgewählt wurde. Erhält den Handle zum sofortigen Laden der Stories. */
  onFolderSelected?: (handle: FileSystemDirectoryHandle) => void;
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
  onFolderSelected,
}: SettingsProps) {
  const [apiKeyOpenAI, setApiKeyOpenAI] = useState(settings?.apiKeyOpenAI ?? settings?.apiKey ?? '');
  const [apiKeyAnthropic, setApiKeyAnthropic] = useState(settings?.apiKeyAnthropic ?? '');
  const [modelOpenAI, setModelOpenAI] = useState<OpenAIModel>(settings?.modelOpenAI ?? 'gpt-4o-mini');
  const [modelAnthropic, setModelAnthropic] = useState<AnthropicModel>(settings?.modelAnthropic ?? 'claude-3-5-haiku-20241022');
  const [provider, setProvider] = useState<AIProvider>(settings?.provider ?? 'openai');
  const [defaultLang, setDefaultLang] = useState<'de' | 'en'>(settings?.defaultLang ?? 'de');
  const [defaultTicketType, setDefaultTicketType] = useState<'user-story' | 'bug'>(
    settings?.defaultTicketType ?? 'user-story'
  );
  const [customSystemPromptDE, setCustomSystemPromptDE] = useState(settings?.customSystemPromptDE ?? settings?.customSystemPrompt ?? '');
  const [customSystemPromptEN, setCustomSystemPromptEN] = useState(settings?.customSystemPromptEN ?? settings?.customSystemPrompt ?? '');
  const [aoknAccessibilityUrl, setAoknAccessibilityUrl] = useState(
    settings?.tenantLinks?.aokn?.accessibilityPage ?? ''
  );
  const [vitagroupAccessibilityUrl, setVitagroupAccessibilityUrl] = useState(
    settings?.tenantLinks?.vitagroup?.accessibilityPage ?? ''
  );
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [folderDialogLoading, setFolderDialogLoading] = useState(false);
  const [apiKeyExpanded, setApiKeyExpanded] = useState(false);
  const [resetPromptLang, setResetPromptLang] = useState<'de' | 'en' | null>(null);

  useEffect(() => {
    if (settings) {
      setApiKeyOpenAI(settings.apiKeyOpenAI ?? settings.apiKey ?? '');
      setApiKeyAnthropic(settings.apiKeyAnthropic ?? (settings.provider === 'anthropic' ? settings.apiKey : undefined) ?? '');
      setModelOpenAI(settings.modelOpenAI ?? 'gpt-4o-mini');
      setModelAnthropic(settings.modelAnthropic ?? 'claude-3-5-haiku-20241022');
      setProvider(settings.provider);
      setDefaultLang(settings.defaultLang);
      setDefaultTicketType(settings.defaultTicketType);
      setCustomSystemPromptDE(settings.customSystemPromptDE ?? settings.customSystemPrompt ?? '');
      setCustomSystemPromptEN(settings.customSystemPromptEN ?? '');
      setAoknAccessibilityUrl(settings.tenantLinks?.aokn?.accessibilityPage ?? '');
      setVitagroupAccessibilityUrl(settings.tenantLinks?.vitagroup?.accessibilityPage ?? '');
    }
  }, [settings]);

  const handleOpenFolderDialog = () => {
    setFolderDialogOpen(true);
  };

  const handleFolderDialogConfirm = async (): Promise<boolean> => {
    setFolderDialogLoading(true);
    try {
      const handle = await storage.requestFolderAccess();
      if (handle) {
        const loaded = await storage.loadSettings();
        if (loaded) {
          onSettingsLoaded(loaded);
        } else {
          onSettingsLoaded({ ...defaultSettings });
        }
        onFolderSelected?.(handle);
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
      apiKeyOpenAI: apiKeyOpenAI.trim() || undefined,
      apiKeyAnthropic: apiKeyAnthropic.trim() || undefined,
      modelOpenAI,
      modelAnthropic,
      provider,
      defaultLang,
      defaultTicketType,
      customSystemPromptDE: customSystemPromptDE.trim() || undefined,
      customSystemPromptEN: customSystemPromptEN.trim() || undefined,
      tenantLinks: {
        aokn: aoknAccessibilityUrl.trim() ? { accessibilityPage: aoknAccessibilityUrl.trim() } : undefined,
        vitagroup: vitagroupAccessibilityUrl.trim() ? { accessibilityPage: vitagroupAccessibilityUrl.trim() } : undefined,
      },
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
        <FormControl fullWidth size="small">
          <InputLabel>KI-Provider</InputLabel>
          <Select
            value={provider}
            label="KI-Provider"
            onChange={(e) => setProvider(e.target.value as AIProvider)}
          >
            <MenuItem value="openai">ChatGPT</MenuItem>
            <MenuItem value="anthropic">Claude</MenuItem>
          </Select>
        </FormControl>

        <Box>
          <Button
            size="small"
            variant="text"
            onClick={() => setApiKeyExpanded(!apiKeyExpanded)}
            sx={{ color: 'text.secondary', textTransform: 'none' }}
          >
            {apiKeyExpanded ? '▼' : '▶'} API-Keys & Modelle
            {apiKeyOpenAI || apiKeyAnthropic ? ' (teilweise gesetzt)' : ' (nicht gesetzt)'}
          </Button>
          <Collapse in={apiKeyExpanded}>
            <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  ChatGPT (OpenAI)
                </Typography>
                <TextField
                  label="API-Key"
                  type="password"
                  value={apiKeyOpenAI}
                  onChange={(e) => setApiKeyOpenAI(e.target.value)}
                  fullWidth
                  size="small"
                  placeholder="sk-..."
                  sx={{ mb: 1 }}
                />
                <FormControl fullWidth size="small">
                  <InputLabel>Modell</InputLabel>
                  <Select
                    value={modelOpenAI}
                    label="Modell"
                    onChange={(e) => setModelOpenAI(e.target.value as OpenAIModel)}
                  >
                    <MenuItem value="gpt-4o">GPT-4o (schnell, vision)</MenuItem>
                    <MenuItem value="gpt-4o-mini">GPT-4o mini (günstig, vision)</MenuItem>
                    <MenuItem value="gpt-4-turbo">GPT-4 Turbo</MenuItem>
                    <MenuItem value="gpt-4">GPT-4</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  Claude (Anthropic)
                </Typography>
                <TextField
                  label="API-Key"
                  type="password"
                  value={apiKeyAnthropic}
                  onChange={(e) => setApiKeyAnthropic(e.target.value)}
                  fullWidth
                  size="small"
                  placeholder="sk-ant-..."
                  sx={{ mb: 1 }}
                />
                <FormControl fullWidth size="small">
                  <InputLabel>Modell</InputLabel>
                  <Select
                    value={modelAnthropic}
                    label="Modell"
                    onChange={(e) => setModelAnthropic(e.target.value as AnthropicModel)}
                  >
                    <MenuItem value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</MenuItem>
                    <MenuItem value="claude-3-5-haiku-20241022">Claude 3.5 Haiku</MenuItem>
                    <MenuItem value="claude-3-opus-20240229">Claude 3 Opus</MenuItem>
                    <MenuItem value="claude-3-sonnet-20240229">Claude 3 Sonnet</MenuItem>
                    <MenuItem value="claude-3-haiku-20240307">Claude 3 Haiku</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Typography variant="caption" color="text.secondary">
                Speichern nicht vergessen! Alternativ: .env.local mit VITE_API_KEY_OPENAI=... und VITE_API_KEY_ANTHROPIC=... anlegen.
              </Typography>
            </Box>
          </Collapse>
        </Box>

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

        <Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Links für Markdown (Tenant-spezifisch)
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            Barrierefreiheits-Seite pro Tenant. Wird im Markdown als Link angehängt, wenn der entsprechende Tenant ausgewählt ist.
          </Typography>
          <TextField
            label="AOKN – Barrierefreiheits-Seite (URL)"
            value={aoknAccessibilityUrl}
            onChange={(e) => setAoknAccessibilityUrl(e.target.value)}
            fullWidth
            size="small"
            placeholder="https://..."
            sx={{ mb: 1 }}
          />
          <TextField
            label="Vitagroup – Barrierefreiheits-Seite (URL)"
            value={vitagroupAccessibilityUrl}
            onChange={(e) => setVitagroupAccessibilityUrl(e.target.value)}
            fullWidth
            size="small"
            placeholder="https://..."
          />
        </Box>

        <Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            System-Prompts (Leitplanken) für Story-Erstellung
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            User Story: DE-Prompt für den deutschen Teil, EN-Prompt für den englischen. Bug Report: je nach gewähltem Typ. Leer = Standard-Prompt. Muss mit „Antworte NUR mit gültigem JSON“ enden.
          </Typography>
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
              Deutsch
            </Typography>
            <TextField
              value={customSystemPromptDE || getDefaultSystemPrompt('de')}
              onChange={(e) => setCustomSystemPromptDE(e.target.value)}
              multiline
              minRows={4}
              fullWidth
              size="small"
              sx={{ mb: 1 }}
            />
            <Button size="small" variant="outlined" onClick={() => setResetPromptLang('de')}>
              Auf Standard zurücksetzen
            </Button>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
              Englisch
            </Typography>
            <TextField
              value={customSystemPromptEN || getDefaultSystemPrompt('en')}
              onChange={(e) => setCustomSystemPromptEN(e.target.value)}
              multiline
              minRows={4}
              fullWidth
              size="small"
              sx={{ mb: 1 }}
            />
            <Button size="small" variant="outlined" onClick={() => setResetPromptLang('en')}>
              Auf Standard zurücksetzen
            </Button>
          </Box>

        <Dialog open={!!resetPromptLang} onClose={() => setResetPromptLang(null)}>
          <DialogTitle>Auf Standard zurücksetzen?</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Der {resetPromptLang === 'de' ? 'deutsche' : 'englische'} System-Prompt wird auf den Standard zurückgesetzt. Nicht gespeicherte Änderungen gehen verloren.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setResetPromptLang(null)}>Abbrechen</Button>
            <Button
              onClick={() => {
                if (resetPromptLang === 'de') setCustomSystemPromptDE('');
                else if (resetPromptLang === 'en') setCustomSystemPromptEN('');
                setResetPromptLang(null);
              }}
              variant="contained"
            >
              Zurücksetzen
            </Button>
          </DialogActions>
        </Dialog>
        </Box>

        <Button variant="contained" onClick={handleSave}>
          Speichern
        </Button>
      </Box>
    </Paper>
  );
}
