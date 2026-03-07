import { useState, useEffect, useCallback } from 'react';
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
  Drawer,
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
import SettingsIcon from '@mui/icons-material/Settings';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import { useStorage } from './hooks/useStorage';
import { useStoryStore } from './hooks/useStoryStore';
import { useAIGenerator } from './hooks/useAIGenerator';

import { StoryEditor } from './components/StoryEditor';
import { BugEditor } from './components/BugEditor';
import { Settings } from './components/Settings';
import { AIGenerator } from './components/AIGenerator';

import type { StoryItem, UserStory, BugReport, Settings as SettingsType } from './types/story';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#3B82F6' },
    background: { default: '#0F172A', paper: '#1E293B' },
    text: { primary: '#FFFFFF', secondary: '#94A3B8' },
  },
  components: {
    MuiButton: { styleOverrides: { root: { borderRadius: 8 } } },
    MuiPaper: { styleOverrides: { root: { borderRadius: 12 } } },
  },
});

function App() {
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));

  const storage = useStorage();
  const store = useStoryStore();
  const ai = useAIGenerator();

  const [settings, setSettings] = useState<SettingsType | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
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

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <AppBar position="static" color="transparent" elevation={0}>
          <Toolbar>
            <DescriptionIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              UserStoryGen
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <SettingsIcon
                sx={{ cursor: 'pointer' }}
                onClick={() => setSettingsOpen(true)}
              />
            </Box>
          </Toolbar>
        </AppBar>

        <Drawer anchor="right" open={settingsOpen} onClose={() => setSettingsOpen(false)}>
          <Box sx={{ width: 360, p: 2 }}>
            <Settings
              storage={storage}
              settings={settings}
              onSettingsChange={setSettings}
              onSettingsLoaded={setSettings}
              onFolderSelected={(handle) => {
                storage.loadStories(handle).then((items) => store.setItems(items));
              }}
            />
          </Box>
        </Drawer>

        <Container maxWidth={false} sx={{ py: 4, px: { xs: 1, sm: 3 } }}>
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
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                      {isStory ? 'User Story' : 'Bug Report'}
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, mb: 2 }} noWrap title={currentItem.type === 'user-story' ? (currentItem as UserStory).title : (currentItem as BugReport).title}>
                      {currentItem.type === 'user-story'
                        ? (currentItem as UserStory).title || 'Ohne Titel'
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
                          .map((item) => (
                            <ListItem key={item.id} disablePadding secondaryAction={
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
                            }>
                              <ListItemButton
                                onClick={() => {
                                  store.loadItem(item.id);
                                  setStoryLangTab(0);
                                }}
                              >
                                <ListItemText
                                  primary={
                                    item.type === 'bug-report'
                                      ? (item as BugReport).title || `Bug ${item.id.slice(-7)}`
                                      : (item as UserStory).title || `Story ${item.id.slice(-7)}`
                                  }
                                  primaryTypographyProps={{ variant: 'body2', noWrap: true }}
                                />
                              </ListItemButton>
                            </ListItem>
                          ))}
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
                <Box sx={{ bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ px: 2, pt: 2, pb: 1, fontWeight: 600 }}>
                    Gespeicherte Stories
                  </Typography>
                  <List dense disablePadding sx={{ pb: 2 }}>
                    {store.items.map((item) => (
                      <ListItem key={item.id} disablePadding secondaryAction={
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
                      }>
                        <ListItemButton
                          onClick={() => {
                            store.loadItem(item.id);
                            setStoryLangTab(0);
                          }}
                          sx={{ py: 1.5 }}
                        >
                          <ListItemText
                            primary={
                              item.type === 'bug-report'
                                ? (item as BugReport).title || `Bug ${item.id.slice(-7)}`
                                : (item as UserStory).title || `Story ${item.id.slice(-7)}`
                            }
                            secondary={item.type === 'user-story' ? 'User Story' : `Bug ${(item as BugReport).lang}`}
                            primaryTypographyProps={{ variant: 'body1', fontWeight: 500 }}
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
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
