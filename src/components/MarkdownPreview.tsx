import { useCallback, useEffect, useState } from 'react';
import { Box, Paper, Typography, Button, FormControl, InputLabel, Select, MenuItem, FormControlLabel, Checkbox } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import type { StoryItem, Settings, MarkdownLinkTenant, ProjectType, MarkdownHeadingLevel, UserStory, BugReport } from '../types/story';
import { toMarkdown } from '../utils/markdown';
import { useSnackbar } from '../contexts/SnackbarContext';

interface MarkdownPreviewProps {
  item: StoryItem | null;
  activeLang?: 'de' | 'en';
  settings?: Settings | null;
  onCopy?: () => void;
}

/** Tenant für Link basierend auf Story-Projekt: AOKN -> aokn, HealthMatch -> vitagroup */
function projectToTenant(project?: ProjectType): MarkdownLinkTenant | null {
  if (project === 'aokn') return 'aokn';
  if (project === 'healthmatch') return 'vitagroup';
  return null;
}

function getAccessibilityLink(
  tenant: MarkdownLinkTenant,
  settings: Settings | null | undefined,
  lang: 'de' | 'en'
): string | null {
  if (tenant === 'none' || !settings?.tenantLinks) return null;
  const url =
    tenant === 'aokn'
      ? settings.tenantLinks.aokn?.accessibilityPage
      : tenant === 'vitagroup'
        ? settings.tenantLinks.vitagroup?.accessibilityPage
        : null;
  if (!url?.trim()) return null;
  const label = lang === 'de' ? 'Barrierefreiheits-Seite' : 'Accessibility Page';
  return `[${label}](${url.trim()})`;
}

function getAccessibilitySectionTitle(lang: 'de' | 'en'): string {
  return lang === 'de' ? 'Barrierefreiheit' : 'Accessibility';
}

function appendAccessibilitySection(md: string, headingLevel: MarkdownHeadingLevel, lang: 'de' | 'en', link: string | null): string {
  const h = headingLevel === 'h1' ? '#' : headingLevel === 'h2' ? '##' : '###';
  const title = getAccessibilitySectionTitle(lang);
  md += `\n\n${h} **♿ ${title}**\n\n`;
  if (link) md += link;
  return md;
}

export function MarkdownPreview({ item, activeLang, settings, onCopy }: MarkdownPreviewProps) {
  const snackbar = useSnackbar();
  const headingLevel = (settings?.markdownHeadingLevel ?? 'h3') as MarkdownHeadingLevel;
  const lang = activeLang ?? 'de';
  const project = item?.type === 'user-story' ? (item as UserStory).project : item?.type === 'bug-report' ? (item as BugReport).project : undefined;
  const suggestedTenant = projectToTenant(project);
  const [linkTenant, setLinkTenant] = useState<MarkdownLinkTenant>(() => suggestedTenant ?? settings?.markdownLinkTenant ?? 'none');
  const hasImages = item?.type === 'user-story' && (item as UserStory).images?.length > 0;
  const hasCopyBook = item?.type === 'user-story' && (item as UserStory).copyBook?.length > 0;
  const [includeImages, setIncludeImages] = useState(settings?.markdownIncludeImages !== false);
  const [includeCopyBook, setIncludeCopyBook] = useState(settings?.markdownIncludeCopyBook !== false);

  useEffect(() => {
    if (suggestedTenant) {
      setLinkTenant(suggestedTenant);
    }
  }, [suggestedTenant]);

  useEffect(() => {
    setIncludeImages(settings?.markdownIncludeImages !== false);
    setIncludeCopyBook(settings?.markdownIncludeCopyBook !== false);
  }, [settings?.markdownIncludeImages, settings?.markdownIncludeCopyBook, item?.id]);

  const handleCopy = useCallback(() => {
    if (!item) return;
    const imagesOpt = hasImages && includeImages ? (item as UserStory).images : [];
    const copyBookOpt = hasCopyBook && includeCopyBook ? (item as UserStory).copyBook : undefined;
    let md = toMarkdown(item, activeLang, {
      headingLevel,
      images: imagesOpt,
      includeCopyBook: !!copyBookOpt,
      copyBook: copyBookOpt,
    });
    const link = getAccessibilityLink(linkTenant, settings, lang);
    md = appendAccessibilitySection(md, headingLevel, lang, link);
    navigator.clipboard.writeText(md);
    snackbar.showSuccess('In Zwischenablage kopiert');
    onCopy?.();
  }, [item, activeLang, headingLevel, linkTenant, settings, lang, onCopy, hasImages, includeImages, hasCopyBook, includeCopyBook, snackbar]);

  if (!item) return null;

  const imagesOpt = hasImages && includeImages ? (item as UserStory).images : [];
  const copyBookOpt = hasCopyBook && includeCopyBook ? (item as UserStory).copyBook : undefined;
  let md = toMarkdown(item, activeLang, {
    headingLevel,
    images: imagesOpt,
    includeCopyBook: !!copyBookOpt,
    copyBook: copyBookOpt,
  });
  const link = getAccessibilityLink(linkTenant, settings, lang);
  md = appendAccessibilitySection(md, headingLevel, lang, link);
  const title =
    item.type === 'user-story'
      ? (lang === 'en' ? (item.titleEN ?? item.title) : item.title)
      : item.type === 'bug-report'
        ? (lang === 'en' ? item.en?.title : item.de?.title) ?? item.de?.title ?? item.en?.title ?? ''
        : '';

  const handleCopyTitle = useCallback(() => {
    if (title) {
      navigator.clipboard.writeText(title);
      snackbar.showSuccess('In Zwischenablage kopiert');
    }
  }, [title, snackbar]);

  return (
    <Paper elevation={2} sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
      {title && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            Titel
          </Typography>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              p: 1.5,
              bgcolor: 'action.hover',
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography sx={{ flex: 1, fontSize: '0.9rem' }}>{title}</Typography>
            <Button size="small" startIcon={<ContentCopyIcon />} onClick={handleCopyTitle}>
              Kopieren
            </Button>
          </Box>
        </Box>
      )}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h6">Markdown (Jira/Confluence)</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Link hinzufügen</InputLabel>
            <Select
              value={linkTenant}
              label="Link hinzufügen"
              onChange={(e) => setLinkTenant(e.target.value as MarkdownLinkTenant)}
            >
              <MenuItem value="none">Kein Link</MenuItem>
              {(!suggestedTenant || suggestedTenant === 'aokn') && (
                <MenuItem value="aokn">Accessibility Page (AOKN)</MenuItem>
              )}
              {(!suggestedTenant || suggestedTenant === 'vitagroup') && (
                <MenuItem value="vitagroup">Accessibility Page (HealthMatch)</MenuItem>
              )}
            </Select>
          </FormControl>
          {linkTenant !== 'none' && !link && (
            <Typography variant="caption" color="warning.main">
              URL in Einstellungen fehlt
            </Typography>
          )}
          {hasImages && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={includeImages}
                  onChange={(e) => setIncludeImages(e.target.checked)}
                  size="small"
                />
              }
              label="Bilder einbinden"
            />
          )}
          {hasCopyBook && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={includeCopyBook}
                  onChange={(e) => setIncludeCopyBook(e.target.checked)}
                  size="small"
                />
              }
              label="Copy-Book-Tabelle einbinden"
            />
          )}
          <Button
          variant="contained"
          size="small"
          startIcon={<ContentCopyIcon />}
            onClick={handleCopy}
          >
            Copy Markdown
          </Button>
        </Box>
      </Box>
      <Box
        component="pre"
        sx={{
          p: 2,
          bgcolor: 'action.hover',
          borderRadius: 1,
          overflow: 'auto',
          maxHeight: 400,
          fontSize: '0.875rem',
          fontFamily: 'monospace',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {md}
      </Box>
    </Paper>
  );
}
