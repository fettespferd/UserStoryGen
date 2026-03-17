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
  FormControlLabel,
  Switch,
  IconButton,
  CircularProgress,
} from '@mui/material';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import type { Settings as SettingsType, AIProvider, OpenAIModel, AnthropicModel, BackgroundColorKey, BackgroundImageKey, FontOption, ProjectType, PromptTemplate } from '../types/story';
import type { UseStorageReturn } from '../hooks/useStorage';
import type { UseAIGeneratorReturn } from '../hooks/useAIGenerator';
import { FolderAccessDialog } from './FolderAccessDialog';
import { getDefaultSystemPrompt } from '../hooks/useAIGenerator';
import { generateId } from '../utils/templates';
import bgAnnie from '../../assets/annie-spratt-QckxruozjRg-unsplash.jpg';
import bgEmile from '../../assets/emile-perron-xrVDYZRGdw4-unsplash.jpg';
import bgHoward from '../../assets/howard-bouchevereau-RSCirJ70NDM-unsplash.jpg';
import bgKari from '../../assets/kari-shea-1SAnrIxw5OY-unsplash.jpg';
import bgNubelson from '../../assets/nubelson-fernandes--Xqckh_XVU4-unsplash.jpg';

const BG_IMAGE_URLS: Record<BackgroundImageKey, string> = {
  annie: bgAnnie,
  emile: bgEmile,
  howard: bgHoward,
  kari: bgKari,
  nubelson: bgNubelson,
};

const BG_COLORS: Record<BackgroundColorKey, string> = {
  dark: '#1a1a1a',
  navy: '#0f172a',
  forest: '#0f1f12',
  burgundy: '#1a0f12',
  slate: '#1e293b',
  light: '#f0f0f0',
  cream: '#fef5e7',
  sky: '#e3f2fd',
  mint: '#e8f5e9',
  lavender: '#f3e5f5',
  peach: '#ffebe6',
  coral: '#FF4757',
  electric: '#00D4FF',
  sunset: '#FF6B35',
};

const BG_COLOR_LABELS: Record<BackgroundColorKey, string> = {
  dark: 'Dunkel',
  navy: 'Navy',
  forest: 'Wald',
  burgundy: 'Burgunder',
  slate: 'Schiefer',
  light: 'Hell',
  cream: 'Creme',
  sky: 'Himmel',
  mint: 'Minze',
  lavender: 'Lavendel',
  peach: 'Pfirsich',
  coral: 'Koralle',
  electric: 'Elektrisch',
  sunset: 'Sonnenuntergang',
};

const BG_IMAGE_LABELS: Record<BackgroundImageKey, string> = {
  annie: 'Annie',
  emile: 'Emile',
  howard: 'Howard',
  kari: 'Kari',
  nubelson: 'Nubelson',
};

interface SettingsProps {
  storage: UseStorageReturn;
  settings: SettingsType | null;
  onSettingsChange: (settings: SettingsType) => void;
  onSettingsLoaded: (settings: SettingsType) => void;
  /** Wird aufgerufen, wenn ein Ordner erfolgreich ausgewählt wurde. Erhält den Handle zum sofortigen Laden der Stories. */
  onFolderSelected?: (handle: FileSystemDirectoryHandle) => void;
  /** Wird bei Speicherfehlern aufgerufen. */
  onStorageError?: (message: string) => void;
  /** Wird bei erfolgreichem Speichern aufgerufen (z.B. für Toast-Feedback). */
  onSaveSuccess?: () => void;
  ai?: UseAIGeneratorReturn | null;
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
  onStorageError,
  onSaveSuccess,
  ai,
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
  const [backgroundImage, setBackgroundImage] = useState<BackgroundImageKey | null>(
    settings?.backgroundImage ?? (settings?.background?.startsWith('image-') ? (settings.background.replace('image-', '') as BackgroundImageKey) : null)
  );
  const [backgroundColor, setBackgroundColor] = useState<BackgroundColorKey>(
    (settings?.backgroundColor ?? (settings?.background?.startsWith('plain-') ? settings.background.replace('plain-', '') : 'dark')) as BackgroundColorKey
  );
  const [font, setFont] = useState<FontOption>(settings?.font ?? 'source-sans-3');
  const [defaultProject, setDefaultProject] = useState<ProjectType>(settings?.defaultProject ?? 'aokn');
  const [showProjectOption, setShowProjectOption] = useState(settings?.showProjectOption ?? true);
  const [markdownIncludeImages, setMarkdownIncludeImages] = useState(settings?.markdownIncludeImages !== false);
  const [markdownIncludeCopyBook, setMarkdownIncludeCopyBook] = useState(settings?.markdownIncludeCopyBook !== false);
  const [promptTemplates, setPromptTemplates] = useState<PromptTemplate[]>(settings?.promptTemplates ?? []);
  const [saveLoading, setSaveLoading] = useState(false);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [folderDialogLoading, setFolderDialogLoading] = useState(false);
  const [apiKeyExpanded, setApiKeyExpanded] = useState(false);
  const [resetPromptLang, setResetPromptLang] = useState<'de' | 'en' | null>(null);
  const [generateForId, setGenerateForId] = useState<string | null>(null);
  const [generateDescription, setGenerateDescription] = useState('');

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
      const validColors: BackgroundColorKey[] = ['dark','navy','forest','burgundy','slate','light','cream','sky','mint','lavender','peach','coral','electric','sunset'];
      const validImages: BackgroundImageKey[] = ['annie','emile','howard','kari','nubelson'];
      const img = settings.backgroundImage ?? (settings.background?.startsWith('image-') ? settings.background.replace('image-', '') : null);
      setBackgroundImage(img && validImages.includes(img as BackgroundImageKey) ? (img as BackgroundImageKey) : null);
      const col = settings.backgroundColor ?? (settings.background?.startsWith('plain-') ? settings.background.replace('plain-', '') : 'dark');
      setBackgroundColor(validColors.includes(col as BackgroundColorKey) ? (col as BackgroundColorKey) : 'dark');
      setFont(settings.font ?? 'source-sans-3');
      setDefaultProject(settings.defaultProject ?? 'aokn');
      setShowProjectOption(settings.showProjectOption ?? true);
      setMarkdownIncludeImages(settings.markdownIncludeImages !== false);
      setMarkdownIncludeCopyBook(settings.markdownIncludeCopyBook !== false);
      setPromptTemplates(settings.promptTemplates ?? []);
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
    setSaveLoading(true);
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
      backgroundImage: backgroundImage ?? undefined,
      backgroundColor,
      font,
      defaultProject,
      showProjectOption,
      markdownIncludeImages,
      markdownIncludeCopyBook,
      promptTemplates: promptTemplates.length > 0 ? promptTemplates : undefined,
    };
    onSettingsChange(next);
    try {
      if (storage.hasAccess) {
        await storage.saveSettings(next);
      }
      onSaveSuccess?.();
    } catch (err) {
      onStorageError?.('Einstellungen speichern fehlgeschlagen: ' + (err instanceof Error ? err.message : 'Unbekannter Fehler'));
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        bgcolor: 'background.paper',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
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
                    <MenuItem value="gpt-5.4">GPT-5.4 (neuestes, Reasoning)</MenuItem>
                    <MenuItem value="gpt-4.1">GPT-4.1 (Flagship)</MenuItem>
                    <MenuItem value="gpt-4.1-mini">GPT-4.1 mini (schnell, günstig)</MenuItem>
                    <MenuItem value="o4-mini">o4-mini (Reasoning, effizient)</MenuItem>
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
                    <MenuItem value="claude-sonnet-4-6">Claude Sonnet 4.6 (neuestes)</MenuItem>
                    <MenuItem value="claude-opus-4-6">Claude Opus 4.6 (Flagship)</MenuItem>
                    <MenuItem value="claude-haiku-4-5">Claude Haiku 4.5 (leicht)</MenuItem>
                    <MenuItem value="claude-sonnet-4">Claude Sonnet 4</MenuItem>
                    <MenuItem value="claude-opus-4">Claude Opus 4</MenuItem>
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

        <Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Hintergrund
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            Bild (optional) und Farbe. Ohne Bild: Vollton. Mit Bild: Farbe als Overlay.
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
            Bild
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            <Box
              onClick={() => setBackgroundImage(null)}
              sx={{
                width: 48,
                height: 48,
                flexShrink: 0,
                borderRadius: 1,
                bgcolor: 'action.hover',
                border: '2px solid',
                borderColor: backgroundImage === null ? 'primary.main' : 'divider',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                color: 'text.secondary',
                textAlign: 'center',
                px: 0.5,
                '&:hover': { opacity: 0.9 },
              }}
              title="Kein Bild"
            >
              Kein
            </Box>
            {(['annie', 'emile', 'howard', 'kari', 'nubelson'] as const).map((opt) => (
              <Box
                key={opt}
                component="img"
                src={BG_IMAGE_URLS[opt]}
                alt=""
                onClick={() => setBackgroundImage(opt)}
                sx={{
                  width: 48,
                  height: 48,
                  flexShrink: 0,
                  borderRadius: 1,
                  objectFit: 'cover',
                  border: '2px solid',
                  borderColor: backgroundImage === opt ? 'primary.main' : 'transparent',
                  cursor: 'pointer',
                  '&:hover': { opacity: 0.9 },
                }}
                title={BG_IMAGE_LABELS[opt]}
              />
            ))}
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
            Farbe
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {(['dark', 'navy', 'forest', 'burgundy', 'slate', 'light', 'cream', 'sky', 'mint', 'lavender', 'peach', 'coral', 'electric', 'sunset'] as const).map((opt) => (
              <Box
                key={opt}
                onClick={() => setBackgroundColor(opt)}
                sx={{
                  width: 48,
                  height: 48,
                  flexShrink: 0,
                  borderRadius: 1,
                  bgcolor: BG_COLORS[opt],
                  border: '2px solid',
                  borderColor: backgroundColor === opt ? 'primary.main' : ['light','cream','sky','mint','lavender','peach'].includes(opt) ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.15)',
                  cursor: 'pointer',
                  '&:hover': { opacity: 0.9 },
                }}
                title={BG_COLOR_LABELS[opt]}
              />
            ))}
          </Box>
        </Box>

        <FormControl fullWidth size="small">
          <InputLabel>Schriftart</InputLabel>
          <Select
            value={font}
            label="Schriftart"
            onChange={(e) => setFont(e.target.value as FontOption)}
            sx={{ '& .MuiSelect-select': { fontFamily: 'inherit' } }}
          >
            <MenuItem value="source-sans-3" sx={{ fontFamily: '"Source Sans 3", sans-serif' }}>Source Sans 3</MenuItem>
            <MenuItem value="inter" sx={{ fontFamily: '"Inter", sans-serif' }}>Inter</MenuItem>
            <MenuItem value="ibm-plex-sans" sx={{ fontFamily: '"IBM Plex Sans", sans-serif' }}>IBM Plex Sans</MenuItem>
            <MenuItem value="open-sans" sx={{ fontFamily: '"Open Sans", sans-serif' }}>Open Sans</MenuItem>
            <MenuItem value="lato" sx={{ fontFamily: '"Lato", sans-serif' }}>Lato</MenuItem>
            <MenuItem value="work-sans" sx={{ fontFamily: '"Work Sans", sans-serif' }}>Work Sans</MenuItem>
            <MenuItem value="nunito" sx={{ fontFamily: '"Nunito", sans-serif' }}>Nunito</MenuItem>
            <MenuItem value="plus-jakarta-sans" sx={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>Plus Jakarta Sans</MenuItem>
            <MenuItem value="outfit" sx={{ fontFamily: '"Outfit", sans-serif' }}>Outfit</MenuItem>
            <MenuItem value="manrope" sx={{ fontFamily: '"Manrope", sans-serif' }}>Manrope</MenuItem>
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

        <Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Projekt (bei neuer Story)
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            Standard-Projekt und ob die Auswahl angezeigt wird. Nicht alle Product Owner benötigen AOKN/HealthMatch.
          </Typography>
          <FormControl fullWidth size="small" sx={{ mb: 1 }}>
            <InputLabel>Standard-Projekt</InputLabel>
            <Select
              value={defaultProject}
              label="Standard-Projekt"
              onChange={(e) => setDefaultProject(e.target.value as ProjectType)}
            >
              <MenuItem value="aokn">AOKN</MenuItem>
              <MenuItem value="healthmatch">HealthMatch</MenuItem>
            </Select>
          </FormControl>
          <FormControlLabel
            control={
              <Switch
                checked={showProjectOption}
                onChange={(e) => setShowProjectOption(e.target.checked)}
              />
            }
            label="Projekt-Auswahl bei neuer Story anzeigen"
          />
        </Box>

        <Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Prompt-Vorlagen (benutzerdefiniert)
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            Eigene Vorlagen für das KI-Eingabefeld. Name und Inhalt bearbeiten. Mit KI generieren erstellt den Inhalt aus einer kurzen Beschreibung.
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {promptTemplates.map((t) => (
              <Paper
                key={t.id}
                variant="outlined"
                sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1.5 }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <TextField
                    size="small"
                    value={t.name}
                    onChange={(e) =>
                      setPromptTemplates((prev) =>
                        prev.map((x) => (x.id === t.id ? { ...x, name: e.target.value } : x))
                      )
                    }
                    placeholder="Vorlagenname (z.B. Feature-Request)"
                    sx={{ flex: 1, maxWidth: 280 }}
                  />
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={ai?.isLoading && generateForId === t.id ? undefined : <AutoAwesomeIcon />}
                    onClick={() => {
                      setGenerateForId(t.id);
                      setGenerateDescription('');
                    }}
                    disabled={!ai || !settings?.apiKeyOpenAI && !settings?.apiKeyAnthropic && !settings?.apiKey}
                  >
                    {ai?.isLoading && generateForId === t.id ? '…' : 'Mit KI generieren'}
                  </Button>
                  <IconButton size="small" color="error" onClick={() => setPromptTemplates((prev) => prev.filter((x) => x.id !== t.id))} title="Vorlage löschen">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
                <TextField
                  size="small"
                  value={t.prompt}
                  onChange={(e) =>
                    setPromptTemplates((prev) =>
                      prev.map((x) => (x.id === t.id ? { ...x, prompt: e.target.value } : x))
                    )
                  }
                  placeholder="Inhalt der Vorlage (wird ins Beschreibungsfeld eingefügt)..."
                  multiline
                  minRows={3}
                  fullWidth
                  sx={{ '& .MuiInputBase-root': { bgcolor: 'background.paper' } }}
                />
              </Paper>
            ))}
            <Button
              size="small"
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() =>
                setPromptTemplates((prev) => [
                  ...prev,
                  { id: generateId(), name: 'Neue Vorlage', prompt: '' },
                ])
              }
            >
              Vorlage hinzufügen
            </Button>
          </Box>
        </Box>

        <Dialog open={!!generateForId} onClose={() => setGenerateForId(null)} maxWidth="sm" fullWidth>
          <DialogTitle>Inhalt mit KI generieren</DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ mb: 2 }}>
              Kurz beschreiben, welche Art von Vorlage gewünscht ist (z.B. „Feature-Request für externe Partner“ oder „Technische Anforderung für API-Integration“).
            </DialogContentText>
            <TextField
              autoFocus
              label="Beschreibung"
              fullWidth
              multiline
              minRows={3}
              value={generateDescription}
              onChange={(e) => setGenerateDescription(e.target.value)}
              placeholder="z.B.: Vorlage für Feature-Requests an externe Systempartner mit Platzhaltern für Kontext, Ziel und Abhängigkeiten"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setGenerateForId(null)}>Abbrechen</Button>
            <Button
              variant="contained"
              onClick={async () => {
                if (!generateForId || !ai || !settings) return;
                const generated = await ai.generatePromptFromDescription(generateDescription.trim() || 'Allgemeine User-Story-Vorlage', settings);
                if (generated) {
                  setPromptTemplates((prev) =>
                    prev.map((x) => (x.id === generateForId ? { ...x, prompt: generated } : x))
                  );
                }
                setGenerateForId(null);
                setGenerateDescription('');
              }}
              disabled={ai?.isLoading}
            >
              {ai?.isLoading ? 'Wird generiert…' : 'Generieren'}
            </Button>
          </DialogActions>
        </Dialog>

        <Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Markdown (Jira/Confluence)
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={markdownIncludeImages}
                onChange={(e) => setMarkdownIncludeImages(e.target.checked)}
              />
            }
            label="Design-Bilder standardmäßig einbinden"
            sx={{ display: 'block', mb: 1 }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            Beim Kopieren des Markdowns werden Bilder als Base64 eingebettet. Deaktivieren für Jira (unterstützt keine Base64-Bilder).
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={markdownIncludeCopyBook}
                onChange={(e) => setMarkdownIncludeCopyBook(e.target.checked)}
              />
            }
            label="Copy-Book-Tabelle (UI-Texte) standardmäßig einbinden"
            sx={{ display: 'block' }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
            Tabelle mit Element, Text DE, Text EN für ein Copy-Paste zu Jira.
          </Typography>
        </Box>

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

        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saveLoading}
          startIcon={saveLoading ? <CircularProgress size={18} color="inherit" /> : undefined}
        >
          {saveLoading ? 'Speichern…' : 'Speichern'}
        </Button>
      </Box>
    </Paper>
  );
}
