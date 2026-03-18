import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Menu,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DescriptionIcon from '@mui/icons-material/Description';
import SearchIcon from '@mui/icons-material/Search';
import BugReportIcon from '@mui/icons-material/BugReport';
import SettingsIcon from '@mui/icons-material/Settings';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FolderIcon from '@mui/icons-material/Folder';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

import { useStorage } from './hooks/useStorage';
import { useStoryStore } from './hooks/useStoryStore';
import { useAIGenerator } from './hooks/useAIGenerator';

import { StoryEditor } from './components/StoryEditor';
import { BugEditor } from './components/BugEditor';
import { Settings } from './components/Settings';
import { AIGenerator } from './components/AIGenerator';
import { SnackbarProvider, useSnackbar } from './contexts/SnackbarContext';

import type { StoryItem, UserStory, BugReport, Settings as SettingsType, FontOption, Folder } from './types/story';
import { formatDate } from './utils/format';

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
  coral: '#FF4757',
  electric: '#00D4FF',
  sunset: '#FF6B35',
};

const LIGHT_BACKGROUND_COLORS = ['light', 'cream', 'sky', 'mint', 'lavender', 'peach'];

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

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

function AppContent({
  settings,
  setSettings,
  storage,
}: {
  settings: SettingsType | null;
  setSettings: React.Dispatch<React.SetStateAction<SettingsType | null>>;
  storage: ReturnType<typeof useStorage>;
}) {
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  const store = useStoryStore();
  const ai = useAIGenerator();
  const snackbar = useSnackbar();

  const [currentView, setCurrentView] = useState<'main' | 'settings'>('main');
  const [storyLangTab, setStoryLangTab] = useState(0);
  const [bugLangTab, setBugLangTab] = useState(0);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'title'>('date');
  const [filterType, setFilterType] = useState<'all' | 'user-story' | 'bug-report'>('all');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null | 'all'>('all');
  const [newFolderName, setNewFolderName] = useState('');
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [folderDialogParentId, setFolderDialogParentId] = useState<string | null>(null);
  const [moveMenuAnchor, setMoveMenuAnchor] = useState<{ el: HTMLElement; itemId: string } | null>(null);
  const [deleteFolderConfirmId, setDeleteFolderConfirmId] = useState<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null | undefined>(undefined);
  const [dragOverStoryId, setDragOverStoryId] = useState<string | undefined>(undefined);
  const [isDragging, setIsDragging] = useState(false);
  const [foldersLoaded, setFoldersLoaded] = useState(false);

  const handleSaveStory = useCallback(async () => {
    const item = store.currentItem;
    if (!item || !storage.hasAccess) {
      if (!storage.hasAccess && storage.isSupported) {
        snackbar.showError('Ordner auswählen (Einstellungen), um zu speichern');
      }
      return;
    }
    setSaveLoading(true);
    try {
      await storage.saveStory(item);
      snackbar.showSuccess('Story gespeichert');
    } catch (err) {
      snackbar.showError('Speichern fehlgeschlagen: ' + (err instanceof Error ? err.message : 'Unbekannter Fehler'));
    } finally {
      setSaveLoading(false);
    }
  }, [store.currentItem, storage, snackbar]);

  const loadIdRef = useRef(0);
  const foldersRef = useRef<Folder[]>([]);
  foldersRef.current = store.folders;

  useEffect(() => {
    if (!storage.hasAccess) {
      setFoldersLoaded(false);
      return;
    }
    const loadId = ++loadIdRef.current;
    storage.loadSettings().then((s) => s && setSettings(s));
    storage.loadStories().then((items) => store.setItems(items));
    storage.loadFolders().then((folders) => {
      if (loadId !== loadIdRef.current) return;
      if (folders.length === 0 && foldersRef.current.length > 0) {
        setFoldersLoaded(true);
        return;
      }
      store.setFolders(folders);
      setFoldersLoaded(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storage.hasAccess]);

  const saveFoldersToStorage = useCallback(
    async (folders: Folder[]) => {
      if (!storage.hasAccess) return;
      try {
        await storage.saveFolders(folders);
      } catch (err) {
        snackbar.showError('Ordner speichern fehlgeschlagen: ' + (err instanceof Error ? err.message : 'Unbekannter Fehler'));
      }
    },
    [storage, snackbar]
  );

  const handleAIGenerated = useCallback(
    async (item: StoryItem) => {
      store.setCurrentItem(item);
      const newItems = [item, ...store.items.filter((i) => i.id !== item.id)];
      store.setItems(newItems);
      if (storage.hasAccess) {
        try {
          await storage.saveStory(item);
          snackbar.showSuccess('Story gespeichert');
        } catch (err) {
          snackbar.showError('Speichern fehlgeschlagen: ' + (err instanceof Error ? err.message : 'Unbekannter Fehler'));
        }
      }
    },
    [store, storage, snackbar]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      setDeleteLoading(true);
      const item = store.items.find((i) => i.id === id);
      try {
        if (item && storage.hasAccess) {
          await storage.deleteStory(item);
        }
        store.deleteItem(id);
        snackbar.showSuccess('Story gelöscht');
      } catch (err) {
        snackbar.showError('Löschen fehlgeschlagen: ' + (err instanceof Error ? err.message : 'Unbekannter Fehler'));
        setDeleteConfirmId(null);
        return;
      } finally {
        setDeleteLoading(false);
        setDeleteConfirmId(null);
      }
    },
    [store, storage, snackbar]
  );

  const handleDeleteClick = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteConfirmId(id);
  }, []);

  useEffect(() => {
    if (!store.currentItem || !storage.hasAccess) return;
    const item = store.currentItem;
    const t = setTimeout(() => {
      storage.saveStory(item).catch((err) => {
        snackbar.showError('Speichern fehlgeschlagen: ' + (err instanceof Error ? err.message : 'Unbekannter Fehler'));
      });
    }, 1000);
    return () => clearTimeout(t);
  }, [store.currentItem, storage.hasAccess, storage.saveStory, snackbar]);

  const currentItem = store.currentItem;
  const isStory = currentItem?.type === 'user-story';
  const isBug = currentItem?.type === 'bug-report';

  const filteredAndSortedItems = useMemo(() => {
    let items = store.items;
    if (selectedFolderId !== 'all') {
      items = items.filter((i) => (i.folderId ?? null) === selectedFolderId);
    }
    if (filterType !== 'all') {
      items = items.filter((i) => i.type === filterType);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      items = items.filter((item) => {
        const title = item.type === 'user-story'
          ? ((item as UserStory).title ?? '') + ' ' + ((item as UserStory).titleEN ?? '') + ' ' + ((item as UserStory).de?.beschreibung ?? '')
          : ((item as BugReport).de?.title ?? '') + ' ' + ((item as BugReport).en?.title ?? '') + ' ' + ((item as BugReport).de?.description ?? '') + ' ' + ((item as BugReport).en?.description ?? '');
        return title.toLowerCase().includes(q);
      });
    }
    const sorted = [...items];
    const isFolderView = selectedFolderId !== 'all' && selectedFolderId !== null;
    if (isFolderView) {
      sorted.sort((a, b) => {
        const orderA = a.order ?? 999999;
        const orderB = b.order ?? 999999;
        if (orderA !== orderB) return orderA - orderB;
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : parseInt(a.id.split('-')[0], 10) || 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : parseInt(b.id.split('-')[0], 10) || 0;
        return dateB - dateA;
      });
    } else if (sortBy === 'title') {
      sorted.sort((a, b) => {
        const ta = a.type === 'user-story' ? (a as UserStory).title ?? '' : (a as BugReport).de?.title ?? (a as BugReport).en?.title ?? '';
        const tb = b.type === 'user-story' ? (b as UserStory).title ?? '' : (b as BugReport).de?.title ?? (b as BugReport).en?.title ?? '';
        return ta.localeCompare(tb);
      });
    } else {
      sorted.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : parseInt(a.id.split('-')[0], 10) || 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : parseInt(b.id.split('-')[0], 10) || 0;
        return dateB - dateA;
      });
    }
    return sorted;
  }, [store.items, filterType, searchQuery, sortBy, selectedFolderId]);

  const folderTree = useMemo(() => {
    const byParent = new Map<string | null, Folder[]>();
    byParent.set(null, []);
    for (const f of store.folders) {
      const pid = f.parentId ?? null;
      if (!byParent.has(pid)) byParent.set(pid, []);
      byParent.get(pid)!.push(f);
    }
    for (const arr of byParent.values()) arr.sort((a, b) => a.name.localeCompare(b.name));
    return byParent;
  }, [store.folders]);

  const hasStoriesWithoutFolder = store.items.some((i) => !i.folderId);

  useEffect(() => {
    if (selectedFolderId === null && !hasStoriesWithoutFolder) {
      setSelectedFolderId('all');
    }
  }, [selectedFolderId, hasStoriesWithoutFolder]);

  useEffect(() => {
    const onDragStart = (e: DragEvent) => {
      if ((e.target as HTMLElement).closest('[data-story-drag-handle]')) {
        setIsDragging(true);
      }
    };
    const onDragEnd = () => setIsDragging(false);
    document.addEventListener('dragstart', onDragStart);
    document.addEventListener('dragend', onDragEnd);
    return () => {
      document.removeEventListener('dragstart', onDragStart);
      document.removeEventListener('dragend', onDragEnd);
    };
  }, []);

  const handleCreateFolder = useCallback(async () => {
    const name = newFolderName.trim();
    if (!name) return;
    const folder = store.createFolder(name, folderDialogParentId);
    setNewFolderName('');
    setFolderDialogOpen(false);
    setFolderDialogParentId(null);
    const newFolders = [...store.folders, folder];
    await saveFoldersToStorage(newFolders);
    snackbar.showSuccess('Ordner erstellt');
  }, [newFolderName, folderDialogParentId, store, snackbar, saveFoldersToStorage]);

  const handleMoveToFolder = useCallback(
    async (itemId: string, folderId: string | null) => {
      const item = store.items.find((i) => i.id === itemId);
      if (!item) return;
      store.moveStoryToFolder(itemId, folderId);
      const updated = { ...item, folderId };
      if (storage.hasAccess) {
        try {
          await storage.saveStory(updated);
          snackbar.showSuccess('Story verschoben');
        } catch {
          snackbar.showError('Speichern fehlgeschlagen');
        }
      }
    },
    [store, storage, snackbar]
  );

  const handleDropOnFolder = useCallback(
    (e: React.DragEvent, folderId: string | null) => {
      e.preventDefault();
      setDragOverFolderId(undefined);
      setDragOverStoryId(undefined);
      const itemId = e.dataTransfer.getData('text/plain');
      if (itemId) handleMoveToFolder(itemId, folderId);
    },
    [handleMoveToFolder]
  );

  const handleReorderStories = useCallback(
    async (draggedId: string, targetId: string) => {
      const folderId = selectedFolderId === 'all' || selectedFolderId === null ? null : selectedFolderId;
      const inFolder = store.items.filter((i) => (i.folderId ?? null) === folderId);
      const sorted = [...inFolder].sort((a, b) => (a.order ?? 999999) - (b.order ?? 999999));
      const dragIdx = sorted.findIndex((i) => i.id === draggedId);
      const targetIdx = sorted.findIndex((i) => i.id === targetId);
      if (dragIdx < 0 || targetIdx < 0) return;
      const [removed] = sorted.splice(dragIdx, 1);
      sorted.splice(targetIdx, 0, removed);
      const toSave = sorted.map((item, idx) => ({ ...item, order: idx }));
      store.reorderItems(draggedId, targetId, folderId);
      setDragOverStoryId(undefined);
      if (storage.hasAccess && toSave.length) {
        try {
          for (const item of toSave) {
            await storage.saveStory(item);
          }
          snackbar.showSuccess('Reihenfolge gespeichert');
        } catch {
          snackbar.showError('Speichern fehlgeschlagen');
        }
      }
    },
    [store, storage, snackbar, selectedFolderId]
  );

  const handleDeleteFolder = useCallback(
    async (folderId: string) => {
      const affectedItems = store.items.filter((i) => i.folderId === folderId);
      const newFolders = store.folders.filter((f) => f.id !== folderId);
      store.deleteFolder(folderId);
      if (selectedFolderId === folderId) setSelectedFolderId('all');
      if (storage.hasAccess) {
        try {
          await saveFoldersToStorage(newFolders);
          for (const item of affectedItems) {
            await storage.saveStory({ ...item, folderId: null });
          }
          snackbar.showSuccess(
            affectedItems.length > 0
              ? `Ordner gelöscht – ${affectedItems.length} Story/Stories zu „Ohne Ordner“ verschoben`
              : 'Ordner gelöscht'
          );
        } catch {
          snackbar.showError('Speichern fehlgeschlagen');
        }
      } else {
        snackbar.showSuccess('Ordner gelöscht');
      }
      setDeleteFolderConfirmId(null);
    },
    [store, storage, snackbar, selectedFolderId, saveFoldersToStorage]
  );

  const bgColorKey = settings?.backgroundColor ?? (settings?.background?.startsWith('plain-') ? settings.background.replace('plain-', '') : 'dark');
  const bgImageKey = settings?.backgroundImage ?? (settings?.background?.startsWith('image-') ? settings.background.replace('image-', '') : null);
  const bgPlainColor = PLAIN_COLORS[bgColorKey] ?? PLAIN_COLORS.dark;
  const bgImageUrl = bgImageKey ? BACKGROUND_IMAGES[bgImageKey] : null;
  const theme = useTheme();

  return (
    <>
      <Box
        sx={{
          minHeight: '100vh',
          position: 'relative',
          bgcolor: bgPlainColor ?? PLAIN_COLORS.dark,
        }}
      >
        {bgImageUrl && (
          <Box
            component="div"
            aria-hidden
            sx={{
              position: 'fixed',
              inset: 0,
              zIndex: 0,
              pointerEvents: 'none',
              backgroundImage: `linear-gradient(180deg, ${hexToRgba(bgPlainColor, 0.92)} 0%, ${hexToRgba(bgPlainColor, 0.85)} 50%, ${hexToRgba(bgPlainColor, 0.95)} 100%), url(${bgImageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        )}
        <Box sx={{ position: 'relative', zIndex: 1, isolation: 'isolate' }}>
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
                User Story Generator
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
                loadIdRef.current += 1;
                Promise.all([
                  storage.loadStories(handle),
                  storage.loadFolders(handle),
                ]).then(([items, folders]) => {
                  store.setItems(items);
                  store.setFolders(folders);
                  setFoldersLoaded(true);
                  snackbar.showSuccess('Ordner ausgewählt – Stories geladen');
                });
              }}
              onStorageError={(msg) => snackbar.showError(msg)}
              onSaveSuccess={() => snackbar.showSuccess('Einstellungen gespeichert')}
              ai={ai}
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
                minWidth: isMobile ? undefined : 280,
                width: isMobile ? undefined : 280,
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
                    <Typography variant="body1" sx={{ fontWeight: 600, mb: 2 }} noWrap title={currentItem.type === 'user-story' ? ((currentItem as UserStory).titleEN ?? (currentItem as UserStory).title) : ((currentItem as BugReport).de?.title ?? (currentItem as BugReport).en?.title)}>
                      {currentItem.type === 'user-story'
                        ? (storyLangTab === 1 ? (currentItem as UserStory).titleEN ?? (currentItem as UserStory).title : (currentItem as UserStory).title) || 'Ohne Titel'
                        : (bugLangTab === 1 ? (currentItem as BugReport).en?.title : (currentItem as BugReport).de?.title) ?? (currentItem as BugReport).en?.title ?? (currentItem as BugReport).de?.title ?? 'Ohne Titel'}
                    </Typography>
                    {(isStory || isBug) && (
                      <ToggleButtonGroup
                        value={isStory ? storyLangTab : bugLangTab}
                        exclusive
                        onChange={(_, v) => v !== null && (isStory ? setStoryLangTab(v) : setBugLangTab(v))}
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
                        {filteredAndSortedItems
                          .filter((i) => i.id !== currentItem.id)
                          .slice(0, 8)
                          .map((item) => {
                            const isBug = item.type === 'bug-report';
                            const title = isBug
                              ? (item as BugReport).de?.title ?? (item as BugReport).en?.title ?? `Bug ${item.id.slice(-7)}`
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
                                    sx={{ opacity: 0.7, '&:hover': { opacity: 1 }, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    title="Löschen"
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                }
                                sx={{ alignItems: 'center' }}
                              >
                                <ListItemButton
                                  onClick={() => {
                                    store.loadItem(item.id);
                                    setStoryLangTab(0);
                                    setBugLangTab(0);
                                  }}
                                  sx={{ py: 1, gap: 1.5 }}
                                >
                                  <TypeIcon sx={{ fontSize: 20, color: 'text.secondary', flexShrink: 0 }} />
                                  <ListItemText
                                    primary={title}
                                    secondary={`${isBug ? 'Bug Report' : 'User Story'} • ${formatDate(item.createdAt, item.id)}`}
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
                <AIGenerator ai={ai} settings={settings} folders={store.folders} onGenerated={handleAIGenerated} />
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
                      onSave={handleSaveStory}
                      saveLoading={saveLoading}
                      hasStorageAccess={storage.hasAccess}
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
                      onSave={handleSaveStory}
                      saveLoading={saveLoading}
                      hasStorageAccess={storage.hasAccess}
                      activeLangTab={bugLangTab}
                      onActiveLangTabChange={setBugLangTab}
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
                  display: 'flex',
                  flexDirection: isMobile ? 'column' : 'row',
                  minHeight: 400,
                }}
                >
                  <Box
                    sx={{
                      width: isMobile ? '100%' : 220,
                      minWidth: isMobile ? undefined : 220,
                      borderRight: isMobile ? 'none' : '1px solid',
                      borderBottom: isMobile ? '1px solid' : 'none',
                      borderColor: 'divider',
                      p: 1.5,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 0.5,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                        Ordner
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => { setFolderDialogParentId(null); setFolderDialogOpen(true); }}
                        title="Neuer Ordner"
                        sx={{ color: 'text.secondary' }}
                      >
                        <CreateNewFolderIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', borderRadius: 1, height: 32 }}>
                      <ListItemButton
                        dense
                        selected={selectedFolderId === 'all'}
                        onClick={() => setSelectedFolderId('all')}
                        sx={{ borderRadius: 1, py: 0, minHeight: 'unset', height: 32, flex: 1 }}
                      >
                        <FolderIcon sx={{ mr: 1.5, fontSize: 20, color: 'text.secondary' }} />
                        <ListItemText primary="Alle Stories" primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }} />
                      </ListItemButton>
                    </Box>
                    {store.items.some((i) => !i.folderId) && (
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          borderRadius: 1,
                          height: 32,
                          bgcolor: dragOverFolderId === null ? 'action.hover' : 'transparent',
                          transition: 'background-color 0.15s',
                        }}
                        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOverFolderId(null); setDragOverStoryId(undefined); }}
                        onDragLeave={() => setDragOverFolderId(undefined)}
                        onDrop={(e) => handleDropOnFolder(e, null)}
                      >
                        <ListItemButton
                          dense
                          selected={selectedFolderId === null}
                          onClick={() => setSelectedFolderId(null)}
                          sx={{ borderRadius: 1, py: 0, minHeight: 'unset', height: 32, flex: 1 }}
                        >
                          <FolderIcon sx={{ mr: 1.5, fontSize: 20, color: 'text.secondary', opacity: 0.6 }} />
                          <ListItemText primary="Ohne Ordner" primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }} />
                        </ListItemButton>
                      </Box>
                    )}
                    {(folderTree.get(null) ?? []).map((f) => (
                      <Box
                        key={f.id}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          borderRadius: 1,
                          position: 'relative',
                          height: 32,
                          bgcolor: dragOverFolderId === f.id ? 'action.hover' : 'transparent',
                          transition: 'background-color 0.15s',
                        }}
                        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOverFolderId(f.id); setDragOverStoryId(undefined); }}
                        onDragLeave={() => setDragOverFolderId(undefined)}
                        onDrop={(e) => handleDropOnFolder(e, f.id)}
                      >
                        <ListItemButton
                          dense
                          selected={selectedFolderId === f.id}
                          onClick={() => setSelectedFolderId(f.id)}
                          sx={{ borderRadius: 1, py: 0.25, minHeight: 'unset', height: 32, flex: 1 }}
                        >
                          <FolderIcon sx={{ mr: 1.5, fontSize: 20, color: 'primary.main' }} />
                          <ListItemText primary={f.name} primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }} />
                        </ListItemButton>
                        <IconButton
                          size="small"
                          onClick={(e) => { e.stopPropagation(); setDeleteFolderConfirmId(f.id); }}
                          sx={{ opacity: 0.6, '&:hover': { opacity: 1 }, flexShrink: 0 }}
                          title="Ordner löschen"
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                    {store.folders.length === 0 && (
                      <Typography variant="caption" color="text.secondary" sx={{ px: 1.5, py: 1 }}>
                        Noch keine Ordner. Klicke auf + um einen zu erstellen.
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <Box sx={{ px: 2, pt: 2, pb: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                        {selectedFolderId === 'all'
                          ? 'Alle Stories'
                          : selectedFolderId === null
                            ? 'Stories ohne Ordner'
                            : store.folders.find((f) => f.id === selectedFolderId)?.name ?? 'Stories'}
                      </Typography>
                    </Box>
                    <TextField
                      size="small"
                      placeholder="Suchen..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon fontSize="small" />
                          </InputAdornment>
                        ),
                      }}
                      sx={{ maxWidth: 280 }}
                    />
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      <FormControl size="small" sx={{ minWidth: 100 }}>
                        <InputLabel>Filter</InputLabel>
                        <Select value={filterType} label="Filter" onChange={(e) => setFilterType(e.target.value as typeof filterType)}>
                          <MenuItem value="all">Alle</MenuItem>
                          <MenuItem value="user-story">User Stories</MenuItem>
                          <MenuItem value="bug-report">Bug Reports</MenuItem>
                        </Select>
                      </FormControl>
                      <FormControl size="small" sx={{ minWidth: 100 }}>
                        <InputLabel>Sortierung</InputLabel>
                        <Select value={sortBy} label="Sortierung" onChange={(e) => setSortBy(e.target.value as typeof sortBy)}>
                          <MenuItem value="date">Neueste zuerst</MenuItem>
                          <MenuItem value="title">Titel A–Z</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                  </Box>
                  <List dense disablePadding sx={{ pb: 2 }}>
                    {filteredAndSortedItems.map((item, index) => {
                      const isBug = item.type === 'bug-report';
                      const title = isBug
                        ? (item as BugReport).de?.title ?? (item as BugReport).en?.title ?? `Bug ${item.id.slice(-7)}`
                        : (item as UserStory).title || `Story ${item.id.slice(-7)}`;
                      const TypeIcon = isBug ? BugReportIcon : DescriptionIcon;
                      const isDropTarget = selectedFolderId !== 'all' && dragOverStoryId === item.id;
                      return (
                        <Box key={item.id}>
                          {selectedFolderId !== 'all' && (
                            <Box
                              onDragOver={(e) => {
                                e.preventDefault();
                                e.dataTransfer.dropEffect = 'move';
                                setDragOverStoryId(item.id);
                                setDragOverFolderId(undefined);
                              }}
                              onDragLeave={() => setDragOverStoryId(undefined)}
                              onDrop={(e) => {
                                e.preventDefault();
                                const draggedId = e.dataTransfer.getData('text/plain');
                                if (draggedId && draggedId !== item.id) {
                                  handleReorderStories(draggedId, item.id);
                                }
                                setDragOverStoryId(undefined);
                              }}
                              sx={{
                                height: 6,
                                mx: 1,
                                borderRadius: 1,
                                bgcolor: 'primary.main',
                                opacity: isDragging ? (isDropTarget ? 0.7 : 0.2) : 0,
                                transition: 'opacity 0.15s',
                              }}
                            />
                          )}
                          <ListItem
                            disablePadding
                            onDragOver={
                              selectedFolderId !== 'all'
                                ? (e) => {
                                    e.preventDefault();
                                    e.dataTransfer.dropEffect = 'move';
                                    setDragOverStoryId(item.id);
                                    setDragOverFolderId(undefined);
                                  }
                                : undefined
                            }
                            onDragLeave={
                              selectedFolderId !== 'all'
                                ? () => setDragOverStoryId(undefined)
                                : undefined
                            }
                            onDrop={
                              selectedFolderId !== 'all'
                                ? (e) => {
                                    e.preventDefault();
                                    const draggedId = e.dataTransfer.getData('text/plain');
                                    if (draggedId && draggedId !== item.id) {
                                      handleReorderStories(draggedId, item.id);
                                    }
                                    setDragOverStoryId(undefined);
                                  }
                                : undefined
                            }
                            sx={{ alignItems: 'center' }}
                          secondaryAction={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              {store.folders.length > 0 && (
                                <Box
                                  data-story-drag-handle
                                  draggable
                                  onDragStart={(e) => {
                                    e.dataTransfer.setData('text/plain', item.id);
                                    e.dataTransfer.effectAllowed = 'move';
                                    const img = document.createElement('div');
                                    img.textContent = title.length > 40 ? title.slice(0, 40) + '…' : title;
                                    img.style.cssText = 'position:absolute;top:-9999px;padding:8px 12px;background:rgba(0,0,0,0.8);color:white;border-radius:6px;font-size:14px;white-space:nowrap;max-width:200px;overflow:hidden;';
                                    document.body.appendChild(img);
                                    e.dataTransfer.setDragImage(img, 0, 0);
                                    requestAnimationFrame(() => document.body.removeChild(img));
                                  }}
                                  sx={{
                                    cursor: 'grab',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    p: 0.5,
                                    borderRadius: 1,
                                    color: 'primary.main',
                                    bgcolor: 'action.hover',
                                    '&:hover': { bgcolor: 'action.selected', color: 'primary.main' },
                                    '&:active': { cursor: 'grabbing' },
                                  }}
                                  title={selectedFolderId !== 'all' ? 'Ziehen zum Verschieben oder Sortieren' : 'Ziehen in Ordner ablegen'}
                                >
                                  <DragIndicatorIcon sx={{ fontSize: 22 }} />
                                </Box>
                              )}
                              <IconButton
                                edge="end"
                                size="small"
                                onClick={(e) => { e.stopPropagation(); setMoveMenuAnchor({ el: e.currentTarget, itemId: item.id }); }}
                                sx={{ opacity: 0.8, '&:hover': { opacity: 1 } }}
                                title={store.folders.length > 0 ? 'Aktionen (verschieben, löschen)' : 'Löschen'}
                              >
                                <MoreVertIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          }
                        >
                          <ListItemButton
                            onClick={() => {
                              store.loadItem(item.id);
                              setStoryLangTab(0);
                              setBugLangTab(0);
                            }}
                            sx={{ py: 1.5, gap: 1.5 }}
                          >
                            <TypeIcon sx={{ fontSize: 22, color: 'text.secondary', flexShrink: 0 }} />
                            <ListItemText
                              primary={title}
                              secondary={`${isBug ? 'Bug Report' : 'User Story'} • ${formatDate(item.createdAt, item.id)}`}
                              primaryTypographyProps={{ variant: 'body1', fontWeight: 500, noWrap: true }}
                              secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                            />
                          </ListItemButton>
                        </ListItem>
                        </Box>
                      );
                    })}
                  </List>
                  </Box>
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
      </Box>

      <Menu
        anchorEl={moveMenuAnchor?.el}
        open={!!moveMenuAnchor}
        onClose={() => setMoveMenuAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ sx: { minWidth: 200 } }}
      >
        {store.folders.length > 0 ? (
          <>
            <Typography variant="caption" sx={{ px: 2, py: 1, color: 'text.secondary', display: 'block' }}>
              In Ordner verschieben
            </Typography>
            <MenuItem
              onClick={() => {
                if (moveMenuAnchor) handleMoveToFolder(moveMenuAnchor.itemId, null);
                setMoveMenuAnchor(null);
              }}
            >
              <FolderIcon sx={{ mr: 1.5, fontSize: 18, opacity: 0.6 }} />
              Ohne Ordner
            </MenuItem>
            {store.folders.map((f) => (
              <MenuItem
                key={f.id}
                onClick={() => {
                  if (moveMenuAnchor) handleMoveToFolder(moveMenuAnchor.itemId, f.id);
                  setMoveMenuAnchor(null);
                }}
              >
                <FolderIcon sx={{ mr: 1.5, fontSize: 18, color: 'primary.main' }} />
                {f.name}
              </MenuItem>
            ))}
            <Box component="hr" sx={{ border: 'none', borderTop: 1, borderColor: 'divider', my: 1 }} />
          </>
        ) : null}
        <MenuItem
          onClick={() => {
            if (moveMenuAnchor) setDeleteConfirmId(moveMenuAnchor.itemId);
            setMoveMenuAnchor(null);
          }}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon sx={{ mr: 1.5, fontSize: 18 }} />
          Löschen
        </MenuItem>
      </Menu>

      <Dialog open={folderDialogOpen} onClose={() => { setFolderDialogOpen(false); setNewFolderName(''); }}>
        <DialogTitle>Neuer Ordner</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Ordnername"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setFolderDialogOpen(false); setNewFolderName(''); }}>Abbrechen</Button>
          <Button variant="contained" onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
            Erstellen
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deleteFolderConfirmId} onClose={() => setDeleteFolderConfirmId(null)}>
        <DialogTitle>Ordner löschen?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Der Ordner wird gelöscht. Die enthaltenen Stories werden zu „Ohne Ordner“ verschoben und bleiben erhalten.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteFolderConfirmId(null)}>Abbrechen</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => deleteFolderConfirmId && handleDeleteFolder(deleteFolderConfirmId)}
          >
            Ordner löschen
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deleteConfirmId} onClose={() => !deleteLoading && setDeleteConfirmId(null)}>
        <DialogTitle>Story löschen?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Möchtest du diese Story wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmId(null)} disabled={deleteLoading}>
            Abbrechen
          </Button>
          <Button
            onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
            color="error"
            variant="contained"
            disabled={deleteLoading}
            startIcon={deleteLoading ? <CircularProgress size={18} color="inherit" /> : undefined}
          >
            {deleteLoading ? 'Wird gelöscht…' : 'Löschen'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

function App() {
  const storage = useStorage();
  const [settings, setSettings] = useState<SettingsType | null>(null);

  useEffect(() => {
    storage.loadSettings().then((s) => s && setSettings(s));
  }, [storage]);

  const bgColorKey = settings?.backgroundColor ?? (settings?.background?.startsWith('plain-') ? settings.background.replace('plain-', '') : 'dark');
  const isLightMode = LIGHT_BACKGROUND_COLORS.includes(bgColorKey);
  const theme = useMemo(
    () => createAppTheme((settings?.font ?? 'source-sans-3') as FontOption, isLightMode),
    [settings?.font, settings?.backgroundColor, settings?.background]
  );

  return (
    <ThemeProvider theme={theme}>
      <SnackbarProvider>
        <CssBaseline />
        <AppContent settings={settings} setSettings={setSettings} storage={storage} />
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App;
