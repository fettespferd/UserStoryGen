import { useCallback, useState } from 'react';
import { Box, Paper, Typography, Button, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import type { StoryItem, Settings, MarkdownLinkTenant } from '../types/story';
import { toMarkdown } from '../utils/markdown';

interface MarkdownPreviewProps {
  item: StoryItem | null;
  activeLang?: 'de' | 'en';
  settings?: Settings | null;
  onCopy?: () => void;
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

export function MarkdownPreview({ item, activeLang, settings, onCopy }: MarkdownPreviewProps) {
  const headingLevel = settings?.markdownHeadingLevel ?? 'h3';
  const [linkTenant, setLinkTenant] = useState<MarkdownLinkTenant>(settings?.markdownLinkTenant ?? 'none');
  const lang = activeLang ?? 'de';

  const handleCopy = useCallback(() => {
    if (!item) return;
    let md = toMarkdown(item, activeLang, { headingLevel });
    const link = getAccessibilityLink(linkTenant, settings, lang);
    if (link) {
      const h = headingLevel === 'h1' ? '#' : headingLevel === 'h2' ? '##' : '###';
      md += `\n\n${h} **♿ Barrierefreiheit**\n\n${link}`;
    }
    navigator.clipboard.writeText(md);
    onCopy?.();
  }, [item, activeLang, headingLevel, linkTenant, settings, lang, onCopy]);

  if (!item) return null;

  let md = toMarkdown(item, activeLang, { headingLevel });
  const link = getAccessibilityLink(linkTenant, settings, lang);
  if (link) {
    const h = headingLevel === 'h1' ? '#' : headingLevel === 'h2' ? '##' : '###';
    md += `\n\n${h} **♿ Barrierefreiheit**\n\n${link}`;
  }
  const title =
    item.type === 'user-story'
      ? (lang === 'en' ? (item.titleEN ?? item.title) : item.title)
      : item.title;

  const handleCopyTitle = useCallback(() => {
    if (title) navigator.clipboard.writeText(title);
  }, [title]);

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
              <MenuItem value="aokn">Accessibility Page (AOKN)</MenuItem>
              <MenuItem value="vitagroup">Accessibility Page (Vitagroup)</MenuItem>
            </Select>
          </FormControl>
          {linkTenant !== 'none' && !link && (
            <Typography variant="caption" color="warning.main">
              URL in Einstellungen fehlt
            </Typography>
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
