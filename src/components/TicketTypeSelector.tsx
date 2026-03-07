import { Paper, Typography, ToggleButton, ToggleButtonGroup } from '@mui/material';

export type TicketTypeChoice = 'user-story' | 'bug-de' | 'bug-en';

type Mode = 'user-story' | 'bug';

interface TicketTypeSelectorProps {
  value: TicketTypeChoice | null;
  onNewStory?: (type: TicketTypeChoice) => void;
  /** Nur Typ ändern, ohne zu erstellen (für expliziten Erstellen-Button) */
  onChange?: (type: TicketTypeChoice) => void;
}

function getModeFromValue(v: TicketTypeChoice | null): Mode {
  if (!v) return 'user-story';
  return v.startsWith('bug') ? 'bug' : 'user-story';
}

export function TicketTypeSelector({ value, onNewStory, onChange }: TicketTypeSelectorProps) {
  const mode = getModeFromValue(value);
  const handleChange = onChange ?? onNewStory ?? (() => {});

  const handleModeChange = (_: React.MouseEvent, newMode: Mode | null) => {
    if (newMode) {
      const type = newMode === 'user-story' ? 'user-story' : 'bug-de';
      handleChange(type);
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        bgcolor: 'background.paper',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5, fontWeight: 600, letterSpacing: 0.5 }}>
        Modus
      </Typography>
      <ToggleButtonGroup
        value={mode}
        exclusive
        onChange={handleModeChange}
        fullWidth
        sx={{
          mb: 2,
          bgcolor: 'action.hover',
          borderRadius: 2,
          p: 0.5,
          '& .MuiToggleButtonGroup-grouped': {
            border: 'none !important',
            borderRadius: '12px !important',
            transition: 'all 0.2s ease',
          },
          '& .MuiToggleButton-root': {
            border: 'none !important',
          },
        }}
      >
        <ToggleButton
          value="user-story"
          sx={{
            py: 1.5,
            px: 2,
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.95rem',
            '&.Mui-selected': {
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              boxShadow: '0 2px 8px rgba(59, 130, 246, 0.35)',
              '&:hover': {
                bgcolor: 'primary.dark',
                boxShadow: '0 2px 12px rgba(59, 130, 246, 0.45)',
              },
            },
            '&:not(.Mui-selected)': {
              color: 'text.secondary',
              '&:hover': {
                bgcolor: 'action.selected',
                color: 'text.primary',
              },
            },
          }}
        >
          User Story
        </ToggleButton>
        <ToggleButton
          value="bug"
          sx={{
            py: 1.5,
            px: 2,
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.95rem',
            '&.Mui-selected': {
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              boxShadow: '0 2px 8px rgba(59, 130, 246, 0.35)',
              '&:hover': {
                bgcolor: 'primary.dark',
                boxShadow: '0 2px 12px rgba(59, 130, 246, 0.45)',
              },
            },
            '&:not(.Mui-selected)': {
              color: 'text.secondary',
              '&:hover': {
                bgcolor: 'action.selected',
                color: 'text.primary',
              },
            },
          }}
        >
          Bug Report
        </ToggleButton>
      </ToggleButtonGroup>
    </Paper>
  );
}
