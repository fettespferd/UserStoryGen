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
  Drawer,
  useTheme,
  useMediaQuery,
  Alert,
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import SettingsIcon from '@mui/icons-material/Settings';

import { useStorage } from './hooks/useStorage';
import { useStoryStore } from './hooks/useStoryStore';
import { useAIGenerator } from './hooks/useAIGenerator';

import { TicketTypeSelector, type TicketTypeChoice } from './components/TicketTypeSelector';
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

  const [, setTab] = useState(0);
  const [settings, setSettings] = useState<SettingsType | null>(null);
  const [selectedType, setSelectedType] = useState<TicketTypeChoice>('user-story');
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    storage.loadSettings().then((s) => s && setSettings(s));
  }, []);

  useEffect(() => {
    if (storage.hasAccess) {
      storage.loadSettings().then((s) => s && setSettings(s));
      storage.loadStories().then((items) => store.setItems(items));
    }
  }, [storage.hasAccess]);

  const handleNewStory = useCallback(
    async (type: TicketTypeChoice) => {
      setSelectedType(type);
      const item =
        type === 'user-story'
          ? store.createNew('user-story')
          : type === 'bug-de'
          ? store.createNew('bug-report', 'de')
          : store.createNew('bug-report', 'en');
      setTab(1);
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

  const handleAIGenerated = useCallback(
    async (item: StoryItem) => {
      store.setCurrentItem(item);
      const newItems = [item, ...store.items.filter((i) => i.id !== item.id)];
      store.setItems(newItems);
      setTab(1);
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
  }, [store, storage]);

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
              {storage.hasAccess && (
                <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
                  {storage.folderName}
                </Typography>
              )}
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
            />
          </Box>
        </Drawer>

        <Container maxWidth={false} sx={{ py: 4, px: { xs: 1, sm: 3 } }}>
          <Typography
            variant="h3"
            component="h1"
            gutterBottom
            align="center"
            sx={{ mb: 4, color: 'text.primary', display: { xs: 'none', sm: 'block' } }}
          >
            User Stories & Bug Reports
          </Typography>

          {!storage.hasAccess && storage.isSupported && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Ordner auswählen (Einstellungen → Ordner auswählen), damit Stories im Dateisystem gespeichert werden. Ohne Ordner gehen alle Daten bei Reload verloren.
            </Alert>
          )}

          <Box sx={{ display: 'flex', gap: 3, flexDirection: isMobile ? 'column' : 'row' }}>
            <Box sx={{ flex: isMobile ? 'none' : '0 0 280px' }}>
              <TicketTypeSelector
                value={selectedType}
                onNewStory={handleNewStory}
              />

              <Box sx={{ mt: 2 }}>
                <AIGenerator
                  ai={ai}
                  settings={settings}
                  onGenerated={handleAIGenerated}
                  selectedType={selectedType}
                />
              </Box>

              {store.items.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Gespeicherte Stories
                  </Typography>
                  <List dense>
                    {store.items.map((item) => (
                      <ListItem key={item.id} disablePadding>
                        <ListItemButton
                          selected={currentItem?.id === item.id}
                          onClick={() => {
                            store.loadItem(item.id);
                            setSelectedType(
                              item.type === 'user-story' ? 'user-story' : (item as BugReport).lang === 'de' ? 'bug-de' : 'bug-en'
                            );
                            setTab(1);
                          }}
                        >
                          <ListItemText
                            primary={
                              item.type === 'bug-report'
                                ? (item as BugReport).title || `Bug ${item.id.slice(-7)}`
                                : (item as UserStory).title || `Story ${item.id.slice(-7)}`
                            }
                            secondary={item.type === 'user-story' ? 'user-story' : `bug-${(item as BugReport).lang}`}
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </Box>
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
                    />
                  )}
                  {isBug && (
                    <BugEditor
                      item={currentItem as BugReport}
                      store={store}
                      settings={settings}
                      onDelete={handleDelete}
                    />
                  )}
                </>
              ) : (
                <Box
                  sx={{
                    p: 4,
                    textAlign: 'center',
                    color: 'text.secondary',
                    bgcolor: 'background.paper',
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="h6" gutterBottom>
                    Keine Story ausgewählt
                  </Typography>
                  <Typography variant="body2">
                    Erstelle eine neue User Story oder einen Bug Report, oder wähle eine vorhandene aus der Liste.
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
