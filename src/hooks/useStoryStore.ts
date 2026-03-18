import { useState, useCallback, useRef, useEffect } from 'react';
import type { StoryItem, CopyBookEntry, Folder } from '../types/story';
import { createUserStory, createBugReport, generateId } from '../utils/templates';

export function generateFolderId(): string {
  return `folder-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export interface UseStoryStoreReturn {
  currentItem: StoryItem | null;
  items: StoryItem[];
  folders: Folder[];
  setCurrentItem: (item: StoryItem | null) => void;
  setItems: (items: StoryItem[]) => void;
  setFolders: (folders: Folder[]) => void;
  createNew: (type: 'user-story' | 'bug-report', folderId?: string | null) => StoryItem;
  updateField: (field: string, value: unknown) => void;
  updateArrayField: (field: string, index: number, value: string) => void;
  updateUserStoryField: (lang: 'de' | 'en', field: string, value: unknown) => void;
  updateUserStoryArrayField: (lang: 'de' | 'en', field: string, index: number, value: string) => void;
  updateUserStoryNestedField: (lang: 'de' | 'en', field: string, subField: string, value: string[] | string[][]) => void;
  updateUserStoryCopyBook: (copyBook: CopyBookEntry[]) => void;
  updateUserStoryImages: (images: string[]) => void;
  updateUserStoryLinks: (links: string[]) => void;
  updateBugReportImages: (images: string[]) => void;
  updateBugReportField: (lang: 'de' | 'en', field: string, value: unknown) => void;
  updateBugReportArrayField: (lang: 'de' | 'en', field: string, index: number, value: string) => void;
  loadItem: (id: string) => void;
  deleteItem: (id: string) => void;
  createFolder: (name: string, parentId?: string | null) => Folder;
  updateFolder: (id: string, name: string) => void;
  deleteFolder: (id: string) => void;
  moveStoryToFolder: (itemId: string, folderId: string | null) => void;
  reorderItems: (draggedId: string, targetId: string | 'end', folderId: string | null) => void;
}

export function useStoryStore(): UseStoryStoreReturn {
  const [currentItem, setCurrentItem] = useState<StoryItem | null>(null);
  const [items, setItems] = useState<StoryItem[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const currentItemIdRef = useRef<string | null>(null);
  const foldersRef = useRef<Folder[]>([]);
  foldersRef.current = folders;

  useEffect(() => {
    currentItemIdRef.current = currentItem?.id ?? null;
  }, [currentItem?.id]);

  const createNew = useCallback(
    (type: 'user-story' | 'bug-report', folderId?: string | null): StoryItem => {
      const id = generateId();
      const item: StoryItem = type === 'user-story' ? createUserStory(id) : createBugReport(id);
      const withFolder = { ...item, folderId: folderId ?? null };
      setCurrentItem(withFolder);
      setItems((prev) => [withFolder, ...prev]);
      return withFolder;
    },
    []
  );

  const updateField = useCallback((field: string, value: unknown) => {
    setCurrentItem((prev) => {
      if (!prev) return prev;
      return { ...prev, [field]: value };
    });
    const id = currentItemIdRef.current ?? '';
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [field]: value } : i))
    );
  }, []);

  const updateArrayField = useCallback((_field: string, _index: number, _value: string) => {
    // Deprecated for BugReport – use updateBugReportArrayField
  }, []);

  const updateBugReportField = useCallback(
    (lang: 'de' | 'en', field: string, value: unknown) => {
      const id = currentItem?.id ?? '';
      setCurrentItem((prev) => {
        if (!prev || prev.type !== 'bug-report') return prev;
        return { ...prev, [lang]: { ...prev[lang], [field]: value } };
      });
      setItems((prev) =>
        prev.map((i) => {
          if (i.id !== id || i.type !== 'bug-report') return i;
          return { ...i, [lang]: { ...i[lang], [field]: value } };
        })
      );
    },
    [currentItem?.id]
  );

  const updateBugReportArrayField = useCallback(
    (lang: 'de' | 'en', field: string, index: number, value: string) => {
      const id = currentItem?.id ?? '';
      setCurrentItem((prev) => {
        if (!prev || prev.type !== 'bug-report') return prev;
        const arr = [...prev[lang][field as keyof typeof prev.de]];
        if (Array.isArray(arr)) {
          arr[index] = value;
          return { ...prev, [lang]: { ...prev[lang], [field]: arr } };
        }
        return prev;
      });
      setItems((prev) =>
        prev.map((i) => {
          if (i.id !== id || i.type !== 'bug-report') return i;
          const arr = [...(i[lang][field as keyof typeof i.de] as string[])];
          arr[index] = value;
          return { ...i, [lang]: { ...i[lang], [field]: arr } };
        })
      );
    },
    [currentItem?.id]
  );

  const updateUserStoryField = useCallback(
    (lang: 'de' | 'en', field: string, value: unknown) => {
      const id = currentItem?.id ?? '';
      setCurrentItem((prev) => {
        if (!prev || prev.type !== 'user-story') return prev;
        return { ...prev, [lang]: { ...prev[lang], [field]: value } };
      });
      setItems((prev) =>
        prev.map((i) => {
          if (i.id !== id || i.type !== 'user-story') return i;
          return { ...i, [lang]: { ...i[lang], [field]: value } };
        })
      );
    },
    [currentItem?.id]
  );

  const updateUserStoryArrayField = useCallback(
    (lang: 'de' | 'en', field: string, index: number, value: string) => {
      const id = currentItem?.id ?? '';
      setCurrentItem((prev) => {
        if (!prev || prev.type !== 'user-story') return prev;
        const arr = [...((prev[lang] as unknown as Record<string, unknown>)[field] as string[])];
        arr[index] = value;
        return { ...prev, [lang]: { ...prev[lang], [field]: arr } };
      });
      setItems((prev) =>
        prev.map((i) => {
          if (i.id !== id || i.type !== 'user-story') return i;
          const arr = [...((i[lang] as unknown as Record<string, unknown>)[field] as string[])];
          arr[index] = value;
          return { ...i, [lang]: { ...i[lang], [field]: arr } };
        })
      );
    },
    [currentItem?.id]
  );

  const updateUserStoryNestedField = useCallback(
    (lang: 'de' | 'en', field: string, subField: string, value: string[] | string[][]) => {
      const id = currentItem?.id ?? '';
      setCurrentItem((prev) => {
        if (!prev || prev.type !== 'user-story') return prev;
        const nested = ((prev[lang] as unknown as Record<string, unknown>)[field] as Record<string, string[] | string[][]>);
        return { ...prev, [lang]: { ...prev[lang], [field]: { ...nested, [subField]: value } } };
      });
      setItems((prev) =>
        prev.map((i) => {
          if (i.id !== id || i.type !== 'user-story') return i;
          const nested = ((i[lang] as unknown as Record<string, unknown>)[field] as Record<string, string[] | string[][]>);
          return { ...i, [lang]: { ...i[lang], [field]: { ...nested, [subField]: value } } };
        })
      );
    },
    [currentItem?.id]
  );

  const updateUserStoryCopyBook = useCallback((copyBook: CopyBookEntry[]) => {
    const id = currentItem?.id ?? '';
    setCurrentItem((prev) => {
      if (!prev || prev.type !== 'user-story') return prev;
      return { ...prev, copyBook };
    });
    setItems((prev) =>
      prev.map((i) => (i.id === id && i.type === 'user-story' ? { ...i, copyBook } : i))
    );
  }, [currentItem?.id]);

  const updateUserStoryImages = useCallback((images: string[]) => {
    const id = currentItem?.id ?? '';
    setCurrentItem((prev) => {
      if (!prev || prev.type !== 'user-story') return prev;
      return { ...prev, images };
    });
    setItems((prev) =>
      prev.map((i) => (i.id === id && i.type === 'user-story' ? { ...i, images } : i))
    );
  }, [currentItem?.id]);

  const updateUserStoryLinks = useCallback((links: string[]) => {
    const id = currentItem?.id ?? '';
    setCurrentItem((prev) => {
      if (!prev || prev.type !== 'user-story') return prev;
      return { ...prev, links };
    });
    setItems((prev) =>
      prev.map((i) => (i.id === id && i.type === 'user-story' ? { ...i, links } : i))
    );
  }, [currentItem?.id]);

  const updateBugReportImages = useCallback((images: string[]) => {
    const id = currentItem?.id ?? '';
    setCurrentItem((prev) => {
      if (!prev || prev.type !== 'bug-report') return prev;
      return { ...prev, images };
    });
    setItems((prev) =>
      prev.map((i) => (i.id === id && i.type === 'bug-report' ? { ...i, images } : i))
    );
  }, [currentItem?.id]);

  const loadItem = useCallback((id: string) => {
    const item = items.find((i) => i.id === id);
    if (item) setCurrentItem(item);
  }, [items]);

  const deleteItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    if (currentItem?.id === id) setCurrentItem(null);
  }, [currentItem?.id]);

  const createFolder = useCallback((name: string, parentId?: string | null): Folder => {
    const id = generateFolderId();
    const folder: Folder = { id, name, parentId: parentId ?? null };
    setFolders((prev) => [...prev, folder]);
    return folder;
  }, []);

  const updateFolder = useCallback((id: string, name: string) => {
    setFolders((prev) => prev.map((f) => (f.id === id ? { ...f, name } : f)));
  }, []);

  const deleteFolder = useCallback((id: string) => {
    const collectIds = (folderList: Folder[], parentId: string): Set<string> => {
      const ids = new Set<string>([parentId]);
      folderList.filter((f) => f.parentId === parentId).forEach((f) => collectIds(folderList, f.id).forEach((x) => ids.add(x)));
      return ids;
    };
    const toDelete = collectIds(foldersRef.current, id);
    setFolders((prev) => prev.filter((f) => !toDelete.has(f.id)));
    setItems((prev) =>
      prev.map((i) => (i.folderId && toDelete.has(i.folderId) ? { ...i, folderId: null as string | null } : i))
    );
  }, []);

  const moveStoryToFolder = useCallback((itemId: string, folderId: string | null) => {
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, folderId } : i))
    );
    if (currentItem?.id === itemId) {
      setCurrentItem((prev) => (prev ? { ...prev, folderId } : prev));
    }
  }, [currentItem?.id]);

  const reorderItems = useCallback((draggedId: string, targetId: string | 'end', folderId: string | null) => {
    if (draggedId === targetId) return;
    setItems((prev) => {
      const inFolder = prev.filter((i) => (i.folderId ?? null) === folderId);
      const sorted = [...inFolder].sort((a, b) => (a.order ?? 999999) - (b.order ?? 999999));
      const dragIdx = sorted.findIndex((i) => i.id === draggedId);
      const targetIdx = targetId === 'end' ? sorted.length : sorted.findIndex((i) => i.id === targetId);
      if (dragIdx < 0 || (targetId !== 'end' && targetIdx < 0)) return prev;
      const [removed] = sorted.splice(dragIdx, 1);
      sorted.splice(targetIdx, 0, removed);
      const withOrder = sorted.map((item, idx) => ({ ...item, order: idx }));
      const orderMap = new Map(withOrder.map((i) => [i.id, i.order]));
      return prev.map((i) => {
        const newOrder = orderMap.get(i.id);
        return newOrder !== undefined ? { ...i, order: newOrder } : i;
      });
    });
  }, []);

  return {
    currentItem,
    items,
    folders,
    setCurrentItem,
    setItems,
    setFolders,
    createNew,
    updateField,
    updateArrayField,
    updateUserStoryField,
    updateUserStoryArrayField,
    updateUserStoryNestedField,
    updateUserStoryCopyBook,
    updateUserStoryImages,
    updateUserStoryLinks,
    updateBugReportImages,
    updateBugReportField,
    updateBugReportArrayField,
    loadItem,
    deleteItem,
    createFolder,
    updateFolder,
    deleteFolder,
    moveStoryToFolder,
    reorderItems,
  };
}
