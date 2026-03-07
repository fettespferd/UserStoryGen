import { useState, useCallback, useEffect } from 'react';
import type { StoryItem, Settings } from '../types/story';
import { migrateItem } from '../utils/migrate';
import { loadDirHandle, saveDirHandle } from '../utils/dirHandleStorage';

const STORIES_DIR = 'user-stories';
const SETTINGS_FILE = 'settings.json';
const SETTINGS_LOCAL_KEY = 'userstorygen-settings';

function isFileSystemAccessSupported(): boolean {
  return 'showDirectoryPicker' in window;
}

export interface UseStorageReturn {
  hasAccess: boolean;
  isSupported: boolean;
  requestFolderAccess: () => Promise<FileSystemDirectoryHandle | null>;
  loadStories: (handle?: FileSystemDirectoryHandle) => Promise<StoryItem[]>;
  saveStory: (item: StoryItem) => Promise<void>;
  deleteStory: (item: StoryItem) => Promise<void>;
  loadSettings: () => Promise<Settings | null>;
  saveSettings: (settings: Settings) => Promise<void>;
  folderName: string | null;
}

export function useStorage(): UseStorageReturn {
  const [dirHandle, setDirHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [folderName, setFolderName] = useState<string | null>(null);

  const isSupported = isFileSystemAccessSupported();

  useEffect(() => {
    if (!isSupported) return;
    loadDirHandle().then((handle) => {
      if (handle) {
        setDirHandle(handle);
        setFolderName(handle.name);
      }
    });
  }, [isSupported]);

  const requestFolderAccess = useCallback(async (): Promise<FileSystemDirectoryHandle | null> => {
    if (!isSupported) return null;
    try {
      const handle = await window.showDirectoryPicker({
        mode: 'readwrite',
      });
      setDirHandle(handle);
      setFolderName(handle.name);
      await saveDirHandle(handle);
      return handle;
    } catch (err) {
      if ((err as Error).name === 'AbortError') return null;
      throw err;
    }
  }, [isSupported]);

  const getOrCreateStoriesDir = useCallback(async (): Promise<FileSystemDirectoryHandle> => {
    if (!dirHandle) throw new Error('Kein Ordner ausgewählt');
    return await dirHandle.getDirectoryHandle(STORIES_DIR, { create: true });
  }, [dirHandle]);

  const loadStories = useCallback(async (handle?: FileSystemDirectoryHandle): Promise<StoryItem[]> => {
    const h = handle ?? dirHandle;
    if (!h) return [];
    try {
      const storiesDir = await h.getDirectoryHandle(STORIES_DIR, { create: true });
      const stories: StoryItem[] = [];
      for await (const entry of storiesDir.values()) {
        if (entry.kind === 'file' && entry.name.endsWith('.json')) {
          const file = await (entry as FileSystemFileHandle).getFile();
          const text = await file.text();
          try {
            const parsed = JSON.parse(text) as unknown;
            const migrated = migrateItem(parsed);
            if (migrated?.id) {
              stories.push(migrated);
            }
          } catch (err) {
            console.warn('[UserStoryGen] Story konnte nicht geladen werden:', entry.name, err);
          }
        }
      }
      return stories.sort((a, b) => (a.id < b.id ? 1 : -1));
    } catch {
      return [];
    }
  }, [dirHandle]);

  const saveStory = useCallback(
    async (item: StoryItem): Promise<void> => {
      if (!dirHandle) throw new Error('Kein Ordner ausgewählt');
      const storiesDir = await getOrCreateStoriesDir();
      const filename = `${item.type === 'bug-report' ? 'bug' : 'story'}-${item.id}.json`;
      const fileHandle = await storiesDir.getFileHandle(filename, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(JSON.stringify(item, null, 2));
      await writable.close();
    },
    [dirHandle, getOrCreateStoriesDir]
  );

  const deleteStory = useCallback(
    async (item: StoryItem): Promise<void> => {
      if (!dirHandle) return;
      try {
        const storiesDir = await getOrCreateStoriesDir();
        const filename = `${item.type === 'bug-report' ? 'bug' : 'story'}-${item.id}.json`;
        await storiesDir.removeEntry(filename);
      } catch {
        // ignore
      }
    },
    [dirHandle, getOrCreateStoriesDir]
  );

  const loadSettings = useCallback(async (): Promise<Settings | null> => {
    const fromLocal = (() => {
      try {
        const raw = localStorage.getItem(SETTINGS_LOCAL_KEY);
        return raw ? (JSON.parse(raw) as Settings) : null;
      } catch {
        return null;
      }
    })();

    try {
      if (dirHandle) {
        const fileHandle = await dirHandle.getFileHandle(SETTINGS_FILE, { create: false });
        const file = await fileHandle.getFile();
        const text = await file.text();
        const fromFolder = JSON.parse(text) as Settings;
        if (fromFolder) {
          const envKey = typeof import.meta.env.VITE_API_KEY === 'string' ? import.meta.env.VITE_API_KEY : undefined;
          const envKeyOpenAI = typeof import.meta.env.VITE_API_KEY_OPENAI === 'string' ? import.meta.env.VITE_API_KEY_OPENAI : undefined;
          const envKeyAnthropic = typeof import.meta.env.VITE_API_KEY_ANTHROPIC === 'string' ? import.meta.env.VITE_API_KEY_ANTHROPIC : undefined;
          const merged: Settings = {
            ...fromFolder,
            apiKey: fromFolder.apiKey || fromLocal?.apiKey || envKey || undefined,
            apiKeyOpenAI: fromFolder.apiKeyOpenAI || fromLocal?.apiKeyOpenAI || envKeyOpenAI || (fromFolder.provider === 'openai' ? (fromFolder.apiKey || envKey) : undefined) || undefined,
            apiKeyAnthropic: fromFolder.apiKeyAnthropic || fromLocal?.apiKeyAnthropic || envKeyAnthropic || (fromFolder.provider === 'anthropic' ? (fromFolder.apiKey || envKey) : undefined) || undefined,
            customSystemPrompt: fromFolder.customSystemPrompt || fromLocal?.customSystemPrompt || undefined,
            customSystemPromptDE: fromFolder.customSystemPromptDE ?? fromLocal?.customSystemPromptDE ?? (fromFolder.customSystemPrompt || fromLocal?.customSystemPrompt) ?? undefined,
            customSystemPromptEN: fromFolder.customSystemPromptEN ?? fromLocal?.customSystemPromptEN ?? (fromFolder.customSystemPrompt || fromLocal?.customSystemPrompt) ?? undefined,
          };
          localStorage.setItem(SETTINGS_LOCAL_KEY, JSON.stringify(merged));
          return merged;
        }
      }
    } catch {
      // folder load failed, fall through to localStorage
    }
    const envKey = typeof import.meta.env.VITE_API_KEY === 'string' ? import.meta.env.VITE_API_KEY : undefined;
    const envKeyOpenAI = typeof import.meta.env.VITE_API_KEY_OPENAI === 'string' ? import.meta.env.VITE_API_KEY_OPENAI : undefined;
    const envKeyAnthropic = typeof import.meta.env.VITE_API_KEY_ANTHROPIC === 'string' ? import.meta.env.VITE_API_KEY_ANTHROPIC : undefined;
    if (fromLocal) {
      return {
        ...fromLocal,
        apiKey: fromLocal.apiKey || envKey || undefined,
        apiKeyOpenAI: fromLocal.apiKeyOpenAI || envKeyOpenAI || (fromLocal.provider === 'openai' ? envKey : undefined) || undefined,
        apiKeyAnthropic: fromLocal.apiKeyAnthropic || envKeyAnthropic || (fromLocal.provider === 'anthropic' ? envKey : undefined) || undefined,
      } as Settings;
    }
    if (envKey || envKeyOpenAI || envKeyAnthropic) {
      return {
        provider: 'openai',
        defaultLang: 'de',
        defaultTicketType: 'user-story',
        apiKey: envKey || undefined,
        apiKeyOpenAI: envKeyOpenAI || envKey || undefined,
        apiKeyAnthropic: envKeyAnthropic || undefined,
      } as Settings;
    }
    return fromLocal;
  }, [dirHandle]);

  const saveSettings = useCallback(
    async (settings: Settings): Promise<void> => {
      try {
        localStorage.setItem(SETTINGS_LOCAL_KEY, JSON.stringify(settings));
      } catch {
        // quota exceeded etc.
      }
      if (dirHandle) {
        try {
          const fileHandle = await dirHandle.getFileHandle(SETTINGS_FILE, { create: true });
          const writable = await fileHandle.createWritable();
          await writable.write(JSON.stringify(settings, null, 2));
          await writable.close();
        } catch {
          // folder save failed, but localStorage succeeded
        }
      }
    },
    [dirHandle]
  );

  return {
    hasAccess: !!dirHandle,
    isSupported,
    requestFolderAccess,
    loadStories,
    saveStory,
    deleteStory,
    loadSettings,
    saveSettings,
    folderName,
  };
}
