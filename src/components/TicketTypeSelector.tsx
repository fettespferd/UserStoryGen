import { Box, Paper, Typography, ToggleButton, ToggleButtonGroup } from '@mui/material';
import BugReportIcon from '@mui/icons-material/BugReport';
import DescriptionIcon from '@mui/icons-material/Description';

export type TicketTypeChoice = 'user-story' | 'bug-de' | 'bug-en';

type Mode = 'user-story' | 'bug';
type Lang = 'de' | 'en';

interface TicketTypeSelectorProps {
  value: TicketTypeChoice | null;
  onNewStory: (type: TicketTypeChoice) => void;
}

const FLAGS = { de: '🇩🇪', en: '🇬🇧' } as const;

function getModeFromValue(v: TicketTypeChoice | null): Mode {
  if (!v) return 'user-story';
  return v.startsWith('bug') ? 'bug' : 'user-story';
}

function getLangFromValue(v: TicketTypeChoice | null): Lang {
  if (!v) return 'de';
  return v === 'bug-en' ? 'en' : 'de';
}

export function TicketTypeSelector({ value, onNewStory }: TicketTypeSelectorProps) {
  const mode = getModeFromValue(value);
  const lang = getLangFromValue(value);

  const handleModeChange = (_: React.MouseEvent, newMode: Mode | null) => {
    if (newMode) onNewStory(newMode === 'user-story' ? 'user-story' : (`bug-${lang}` as TicketTypeChoice));
  };

  const handleLangChange = (_: React.MouseEvent, newLang: Lang | null) => {
    if (newLang && mode === 'bug') onNewStory(`bug-${newLang}` as TicketTypeChoice);
  };

  return (
    <Paper
      elevation={2}
      sx={{
        p: 2,
        bgcolor: 'background.paper',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
        Modus
      </Typography>
      <ToggleButtonGroup
        value={mode}
        exclusive
        onChange={handleModeChange}
        fullWidth
        sx={{ mb: 2 }}
      >
        <ToggleButton
          value="user-story"
          sx={{
            py: 1.5,
            textTransform: 'none',
            borderRadius: 1,
            '&.Mui-selected': {
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              '&:hover': { bgcolor: 'primary.dark' },
            },
          }}
        >
          <DescriptionIcon sx={{ mr: 1, fontSize: 20 }} />
          User Story
        </ToggleButton>
        <ToggleButton
          value="bug"
          sx={{
            py: 1.5,
            textTransform: 'none',
            borderRadius: 1,
            '&.Mui-selected': {
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              '&:hover': { bgcolor: 'primary.dark' },
            },
          }}
        >
          <BugReportIcon sx={{ mr: 1, fontSize: 20 }} />
          Bug Report
        </ToggleButton>
      </ToggleButtonGroup>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
        Sprache {mode === 'bug' && '(für Bug Report)'}
      </Typography>
      <ToggleButtonGroup
        value={lang}
        exclusive
        onChange={handleLangChange}
        fullWidth
        disabled={mode === 'user-story'}
      >
        <ToggleButton
          value="de"
          sx={{
            py: 1.5,
            textTransform: 'none',
            borderRadius: 1,
            fontSize: '1rem',
            '&.Mui-selected': {
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              '&:hover': { bgcolor: 'primary.dark' },
            },
          }}
        >
          <Box component="span" sx={{ mr: 1, fontSize: '1.25rem' }}>
            {FLAGS.de}
          </Box>
          Deutsch
        </ToggleButton>
        <ToggleButton
          value="en"
          sx={{
            py: 1.5,
            textTransform: 'none',
            borderRadius: 1,
            fontSize: '1rem',
            '&.Mui-selected': {
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              '&:hover': { bgcolor: 'primary.dark' },
            },
          }}
        >
          <Box component="span" sx={{ mr: 1, fontSize: '1.25rem' }}>
            {FLAGS.en}
          </Box>
          English
        </ToggleButton>
      </ToggleButtonGroup>
    </Paper>
  );
}
