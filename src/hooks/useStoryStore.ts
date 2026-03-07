import { useState, useCallback } from 'react';
import type { StoryItem, CopyBookEntry } from '../types/story';
import { createUserStory, createBugReport, generateId } from '../utils/templates';

export interface UseStoryStoreReturn {
  currentItem: StoryItem | null;
  items: StoryItem[];
  setCurrentItem: (item: StoryItem | null) => void;
  setItems: (items: StoryItem[]) => void;
  createNew: (type: 'user-story' | 'bug-report', bugLang?: 'de' | 'en') => StoryItem;
  updateField: (field: string, value: unknown) => void;
  updateArrayField: (field: string, index: number, value: string) => void;
  updateUserStoryField: (lang: 'de' | 'en', field: string, value: unknown) => void;
  updateUserStoryArrayField: (lang: 'de' | 'en', field: string, index: number, value: string) => void;
  updateUserStoryNestedField: (lang: 'de' | 'en', field: string, subField: string, value: string[]) => void;
  updateUserStoryCopyBook: (copyBook: CopyBookEntry[]) => void;
  updateUserStoryImages: (images: string[]) => void;
  updateBugReportImages: (images: string[]) => void;
  loadItem: (id: string) => void;
  deleteItem: (id: string) => void;
}

export function useStoryStore(): UseStoryStoreReturn {
  const [currentItem, setCurrentItem] = useState<StoryItem | null>(null);
  const [items, setItems] = useState<StoryItem[]>([]);

  const createNew = useCallback(
    (type: 'user-story' | 'bug-report', bugLang: 'de' | 'en' = 'de'): StoryItem => {
      const id = generateId();
      const item: StoryItem = type === 'user-story' ? createUserStory(id) : createBugReport(id, bugLang);
      setCurrentItem(item);
      setItems((prev) => [item, ...prev]);
      return item;
    },
    []
  );

  const updateField = useCallback((field: string, value: unknown) => {
    setCurrentItem((prev) => {
      if (!prev) return prev;
      return { ...prev, [field]: value };
    });
    const id = currentItem?.id ?? '';
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [field]: value } : i))
    );
  }, [currentItem?.id]);

  const updateArrayField = useCallback((_field: string, index: number, value: string) => {
    const id = currentItem?.id ?? '';
    setCurrentItem((prev) => {
      if (!prev || prev.type !== 'bug-report') return prev;
      const arr = [...prev.stepsToReproduce];
      arr[index] = value;
      return { ...prev, stepsToReproduce: arr };
    });
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== id || i.type !== 'bug-report') return i;
        const arr = [...i.stepsToReproduce];
        arr[index] = value;
        return { ...i, stepsToReproduce: arr };
      })
    );
  }, [currentItem?.id]);

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
    (lang: 'de' | 'en', field: string, subField: string, value: string[]) => {
      const id = currentItem?.id ?? '';
      setCurrentItem((prev) => {
        if (!prev || prev.type !== 'user-story') return prev;
        const nested = ((prev[lang] as unknown as Record<string, unknown>)[field] as Record<string, string[]>);
        return { ...prev, [lang]: { ...prev[lang], [field]: { ...nested, [subField]: value } } };
      });
      setItems((prev) =>
        prev.map((i) => {
          if (i.id !== id || i.type !== 'user-story') return i;
          const nested = ((i[lang] as unknown as Record<string, unknown>)[field] as Record<string, string[]>);
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

  return {
    currentItem,
    items,
    setCurrentItem,
    setItems,
    createNew,
    updateField,
    updateArrayField,
    updateUserStoryField,
    updateUserStoryArrayField,
    updateUserStoryNestedField,
    updateUserStoryCopyBook,
    updateUserStoryImages,
    updateBugReportImages,
    loadItem,
    deleteItem,
  };
}
