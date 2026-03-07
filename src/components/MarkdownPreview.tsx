import { useCallback } from 'react';
import { Box, Paper, Typography, Button } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import type { StoryItem, Settings } from '../types/story';
import { toMarkdown } from '../utils/markdown';

interface MarkdownPreviewProps {
  item: StoryItem | null;
  activeLang?: 'de' | 'en';
  settings?: Settings | null;
  onCopy?: () => void;
}

export function MarkdownPreview({ item, activeLang, settings, onCopy }: MarkdownPreviewProps) {
  const headingLevel = settings?.markdownHeadingLevel ?? 'h3';

  const handleCopy = useCallback(() => {
    if (!item) return;
    const md = toMarkdown(item, activeLang, { headingLevel });
    navigator.clipboard.writeText(md);
    onCopy?.();
  }, [item, activeLang, headingLevel, onCopy]);

  if (!item) return null;

  const md = toMarkdown(item, activeLang, { headingLevel });

  return (
    <Paper elevation={2} sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Markdown (Jira/Confluence)</Typography>
        <Button
          variant="contained"
          size="small"
          startIcon={<ContentCopyIcon />}
          onClick={handleCopy}
        >
          Copy Markdown
        </Button>
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
