import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Box,
  AppBar,
  Toolbar,
  Typography,
  Container,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  IconButton,
  useTheme,
  useMediaQuery,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DescriptionIcon from '@mui/icons-material/Description';
import BugReportIcon from '@mui/icons-material/BugReport';
import SettingsIcon from '@mui/icons-material/Settings';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import { useStorage } from './hooks/useStorage';
import { useStoryStore } from './hooks/useStoryStore';
import { useAIGenerator } from './hooks/useAIGenerator';

import { StoryEditor } from './components/StoryEditor';
import { BugEditor } from './components/BugEditor';
import { Settings } from './components/Settings';
import { AIGenerator } from './components/AIGenerator';

import type { StoryItem, UserStory, BugReport, Settings as SettingsType, FontOption } from './types/story';

import bgAnnie from '../assets/annie-spratt-QckxruozjRg-unsplash.jpg';
import bgEmile from '../assets/emile-perron-xrVDYZRGdw4-unsplash.jpg';
import bgHoward from '../assets/howard-bouchevereau-RSCirJ70NDM-unsplash.jpg';
import bgKari from '../assets/kari-shea-1SAnrIxw5OY-unsplash.jpg';
import bgNubelson from '../assets/nubelson-fernandes--Xqckh_XVU4-unsplash.jpg';

const BACKGROUND_IMAGES: Record<string, string> = {
  annie: bgAnnie,
  emile: bgEmile,
  howard: bgHoward,
  kari: bgKari,
  nubelson: bgNubelson,
};

const PLAIN_COLORS: Record<string, string> = {
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
};

const LIGHT_BACKGROUNDS = ['plain-light', 'plain-cream', 'plain-sky', 'plain-mint', 'plain-lavender', 'plain-peach'];

const FONT_FAMILIES: Record<FontOption, string> = {
  'source-sans-3': '"Source Sans 3", system-ui, sans-serif',
  inter: '"Inter", system-ui, sans-serif',
  'ibm-plex-sans': '"IBM Plex Sans", system-ui, sans-serif',
  'open-sans': '"Open Sans", system-ui, sans-serif',
  lato: '"Lato", system-ui, sans-serif',
  'work-sans': '"Work Sans", system-ui, sans-serif',
  nunito: '"Nunito", system-ui, sans-serif',
  'plus-jakarta-sans': '"Plus Jakarta Sans", system-ui, sans-serif',
  outfit: '"Outfit", system-ui, sans-serif',
  manrope: '"Manrope", system-ui, sans-serif',
};

function createAppTheme(font: FontOption, isLightMode: boolean) {
  return createTheme({
    typography: {
      fontFamily: FONT_FAMILIES[font] ?? FONT_FAMILIES['source-sans-3'],
    },
    palette: isLightMode
      ? {
          mode: 'light',
          primary: { main: '#8B6914' },
          secondary: { main: '#6B5344' },
          background: { default: '#f5f5f5', paper: '#ffffff' },
          text: { primary: '#1a1a1a', secondary: '#5c5c5c' },
        }
      : {
          mode: 'dark',
          primary: { main: '#C9A962' },
          secondary: { main: '#8B7355' },
          background: { default: '#141210', paper: '#1E1B18' },
          text: { primary: '#F5F0E8', secondary: '#A89F94' },
        },
    components: {
      MuiButton: { styleOverrides: { root: { borderRadius: 6, textTransform: 'none' } } },
      MuiPaper: { styleOverrides: { root: { borderRadius: 8 } } },
    },
  });
}

function App() {
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));

  const storage = useStorage();
  const store = useStoryStore();
  const ai = useAIGenerator();

  const [settings, setSettings] = useState<SettingsType | null>(null);
  const [currentView, setCurrentView] = useState<'main' | 'settings'>('main');
  const [storyLangTab, setStoryLangTab] = useState(0);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    storage.loadSettings().then((s) => s && setSettings(s));
  }, []);

  useEffect(() => {
    if (storage.hasAccess) {
      storage.loadSettings().then((s) => s && setSettings(s));
      storage.loadStories().then((items) => store.setItems(items));
    }
  }, [storage.hasAccess]);

  const handleAIGenerated = useCallback(
    async (item: StoryItem) => {
      store.setCurrentItem(item);
      const newItems = [item, ...store.items.filter((i) => i.id !== item.id)];
      store.setItems(newItems);
      if (storage.hasAccess) {
        try {
          await storage.saveStory(item);
        } catch (err) {
          console.error('[UserStoryGen] Speichern fehlgeschlagen:', err);
        }
      }
    },
    [store, storage]
  );

  const handleDelete = useCallback(async (id: string) => {
    const item = store.items.find((i) => i.id === id);
    if (item && storage.hasAccess) {
      await storage.deleteStory(item);
    }
    store.deleteItem(id);
    setDeleteConfirmId(null);
  }, [store, storage]);

  const handleDeleteClick = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteConfirmId(id);
  }, []);

  useEffect(() => {
    if (!store.currentItem || !storage.hasAccess) return;
    const item = store.currentItem;
    const t = setTimeout(() => {
      storage.saveStory(item).catch((err) => console.error('[UserStoryGen] Speichern fehlgeschlagen:', err));
    }, 1000);
    return () => clearTimeout(t);
  }, [store.currentItem, storage.hasAccess, storage.saveStory]);

  const currentItem = store.currentItem;
  const isStory = currentItem?.type === 'user-story';
  const isBug = currentItem?.type === 'bug-report';

  const isLightMode = LIGHT_BACKGROUNDS.includes(settings?.background ?? '');
  const theme = useMemo(
    () => createAppTheme((settings?.font ?? 'source-sans-3') as FontOption, isLightMode),
    [settings?.font, settings?.background]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          position: 'relative',
          ...(function () {
            const bg = settings?.background ?? 'plain-dark';
            if (bg.startsWith('plain-')) {
              const color = PLAIN_COLORS[bg.replace('plain-', '')] ?? PLAIN_COLORS.dark;
              return { bgcolor: color };
            }
            const imgKey = bg.replace('image-', '');
            const imgUrl = BACKGROUND_IMAGES[imgKey];
            if (imgUrl) {
              return {
                '&::before': {
                  content: '""',
                  position: 'fixed',
                  inset: 0,
                  backgroundImage: `linear-gradient(180deg, rgba(20,18,16,0.92) 0%, rgba(20,18,16,0.85) 50%, rgba(20,18,16,0.95) 100%), url(${imgUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  pointerEvents: 'none',
                  zIndex: 0,
                },
              };
            }
            return { bgcolor: PLAIN_COLORS.dark };
          })(),
        }}
      >
        <AppBar
          position="static"
          color="transparent"
          elevation={0}
          sx={{
            position: 'relative',
            zIndex: 1,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Toolbar>
            {currentView === 'settings' ? (
              <IconButton
                edge="start"
                color="inherit"
                onClick={() => setCurrentView('main')}
                sx={{ mr: 1 }}
                title="Zurück"
              >
                <ArrowBackIcon />
              </IconButton>
            ) : null}
            <Box
              component="button"
              onClick={() => setCurrentView('main')}
              sx={{
                display: 'flex',
                alignItems: 'center',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                color: 'inherit',
                mr: 1,
              }}
            >
              <DescriptionIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
              <Typography variant="h6" component="span">
                UserStoryGen
              </Typography>
            </Box>
            <Box sx={{ flexGrow: 1 }} />
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton
                color="inherit"
                onClick={() => setCurrentView(currentView === 'settings' ? 'main' : 'settings')}
                title="Einstellungen"
                sx={{ opacity: currentView === 'settings' ? 1 : 0.8 }}
              >
                <SettingsIcon />
              </IconButton>
            </Box>
          </Toolbar>
        </AppBar>

        {currentView === 'settings' ? (
          <Container maxWidth="md" sx={{ py: 4, px: { xs: 2, sm: 3 }, position: 'relative', zIndex: 1 }}>
            <Settings
              storage={storage}
              settings={settings}
              onSettingsChange={setSettings}
              onSettingsLoaded={setSettings}
              onFolderSelected={(handle) => {
                storage.loadStories(handle).then((items) => store.setItems(items));
              }}
            />
          </Container>
        ) : (
        <Container maxWidth={false} sx={{ py: 4, px: { xs: 1, sm: 3 }, position: 'relative', zIndex: 1 }}>
          {!storage.hasAccess && storage.isSupported && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Ordner auswählen (Einstellungen → Ordner auswählen), damit Stories im Dateisystem gespeichert werden. Ohne Ordner gehen alle Daten bei Reload verloren.
            </Alert>
          )}

          <Box sx={{ display: 'flex', gap: 3, flexDirection: isMobile ? 'column' : 'row' }}>
            <Box
              sx={{
                flex: isMobile ? 'none' : '0 0 280px',
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              {currentItem ? (
                <>
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: 'background.paper',
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Button
                      size="small"
                      startIcon={<ArrowBackIcon />}
                      onClick={() => store.setCurrentItem(null)}
                      sx={{ mb: 1.5, color: 'text.secondary' }}
                    >
                      Zurück
                    </Button>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      {isStory ? (
                        <DescriptionIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      ) : (
                        <BugReportIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      )}
                      <Typography variant="subtitle2" color="text.secondary">
                        {isStory ? 'User Story' : 'Bug Report'}
                      </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ fontWeight: 600, mb: 2 }} noWrap title={currentItem.type === 'user-story' ? ((currentItem as UserStory).titleEN ?? (currentItem as UserStory).title) : (currentItem as BugReport).title}>
                      {currentItem.type === 'user-story'
                        ? (storyLangTab === 1 ? (currentItem as UserStory).titleEN ?? (currentItem as UserStory).title : (currentItem as UserStory).title) || 'Ohne Titel'
                        : (currentItem as BugReport).title || 'Ohne Titel'}
                    </Typography>
                    {isStory && (
                      <ToggleButtonGroup
                        value={storyLangTab}
                        exclusive
                        onChange={(_, v) => v !== null && setStoryLangTab(v)}
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
                        <ToggleButton value={0}>🇩🇪 Deutsch</ToggleButton>
                        <ToggleButton value={1}>🇬🇧 English</ToggleButton>
                      </ToggleButtonGroup>
                    )}
                  </Box>
                  {store.items.length > 1 && (
                    <Box sx={{ flex: 1, minHeight: 0 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
                        Wechseln zu
                      </Typography>
                      <List dense sx={{ maxHeight: 200, overflow: 'auto' }}>
                        {store.items
                          .filter((i) => i.id !== currentItem.id)
                          .slice(0, 8)
                          .map((item) => {
                            const isBug = item.type === 'bug-report';
                            const title = isBug
                              ? (item as BugReport).title || `Bug ${item.id.slice(-7)}`
                              : (item as UserStory).title || `Story ${item.id.slice(-7)}`;
                            const TypeIcon = isBug ? BugReportIcon : DescriptionIcon;
                            return (
                              <ListItem
                                key={item.id}
                                disablePadding
                                secondaryAction={
                                  <IconButton
                                    edge="end"
                                    size="small"
                                    onClick={(e) => handleDeleteClick(e, item.id)}
                                    color="error"
                                    sx={{ opacity: 0.7, '&:hover': { opacity: 1 } }}
                                    title="Löschen"
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                }
                                sx={{ alignItems: 'stretch' }}
                              >
                                <ListItemButton
                                  onClick={() => {
                                    store.loadItem(item.id);
                                    setStoryLangTab(0);
                                  }}
                                  sx={{ py: 1, gap: 1.5 }}
                                >
                                  <TypeIcon sx={{ fontSize: 20, color: 'text.secondary', flexShrink: 0 }} />
                                  <ListItemText
                                    primary={title}
                                    secondary={isBug ? `Bug ${(item as BugReport).lang}` : 'User Story'}
                                    primaryTypographyProps={{ variant: 'body2', noWrap: true, fontWeight: 500 }}
                                    secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                                  />
                                </ListItemButton>
                              </ListItem>
                            );
                          })}
                      </List>
                    </Box>
                  )}
                </>
              ) : (
                <AIGenerator ai={ai} settings={settings} onGenerated={handleAIGenerated} />
              )}
            </Box>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              {currentItem ? (
                <>
                  {isStory && (
                    <StoryEditor
                      item={currentItem as UserStory}
                      store={store}
                      ai={ai}
                      settings={settings}
                      onDelete={handleDelete}
                      activeLangTab={storyLangTab}
                      onActiveLangTabChange={setStoryLangTab}
                    />
                  )}
                  {isBug && (
                    <BugEditor
                      item={currentItem as BugReport}
                      store={store}
                      ai={ai}
                      settings={settings}
                      onDelete={handleDelete}
                    />
                  )}
                </>
              ) : store.items.length > 0 ? (
                <Box
                sx={{
                  bgcolor: 'background.paper',
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  overflow: 'hidden',
                }}
                >
                  <Typography variant="subtitle2" color="text.secondary" sx={{ px: 2, pt: 2, pb: 1, fontWeight: 600 }}>
                    Gespeicherte Stories
                  </Typography>
                  <List dense disablePadding sx={{ pb: 2 }}>
                    {store.items.map((item) => {
                      const isBug = item.type === 'bug-report';
                      const title = isBug
                        ? (item as BugReport).title || `Bug ${item.id.slice(-7)}`
                        : (item as UserStory).title || `Story ${item.id.slice(-7)}`;
                      const TypeIcon = isBug ? BugReportIcon : DescriptionIcon;
                      return (
                        <ListItem
                          key={item.id}
                          disablePadding
                          secondaryAction={
                            <IconButton
                              edge="end"
                              size="small"
                              onClick={(e) => handleDeleteClick(e, item.id)}
                              color="error"
                              sx={{ mr: 1, opacity: 0.7, '&:hover': { opacity: 1 } }}
                              title="Löschen"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          }
                          sx={{ alignItems: 'stretch' }}
                        >
                          <ListItemButton
                            onClick={() => {
                              store.loadItem(item.id);
                              setStoryLangTab(0);
                            }}
                            sx={{ py: 1.5, gap: 1.5 }}
                          >
                            <TypeIcon sx={{ fontSize: 22, color: 'text.secondary', flexShrink: 0 }} />
                            <ListItemText
                              primary={title}
                              secondary={isBug ? `Bug ${(item as BugReport).lang}` : 'User Story'}
                              primaryTypographyProps={{ variant: 'body1', fontWeight: 500, noWrap: true }}
                              secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                            />
                          </ListItemButton>
                        </ListItem>
                      );
                    })}
                  </List>
                </Box>
              ) : (
                <Box
                  sx={{
                    p: 4,
                    textAlign: 'center',
                    color: 'text.secondary',
                    bgcolor: 'background.paper',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Typography variant="body1" gutterBottom>
                    Noch keine Stories vorhanden.
                  </Typography>
                  <Typography variant="body2">
                    Nutze die KI-Generierung links, um eine neue User Story oder einen Bug Report zu erstellen.
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Container>
        )}
      </Box>

      <Dialog open={!!deleteConfirmId} onClose={() => setDeleteConfirmId(null)}>
        <DialogTitle>Story löschen?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Möchtest du diese Story wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmId(null)}>Abbrechen</Button>
          <Button onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)} color="error" variant="contained">
            Löschen
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
}

export default App;
