import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
} from '@mui/material';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';

interface FolderAccessDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<boolean>;
  isLoading?: boolean;
}

export function FolderAccessDialog({
  open,
  onClose,
  onConfirm,
  isLoading = false,
}: FolderAccessDialogProps) {
  const handleConfirm = async () => {
    const success = await onConfirm();
    if (success) onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'background.paper',
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 0 }}>
        <FolderOpenIcon color="primary" sx={{ fontSize: 28 }} />
        <Typography variant="h6" component="span">
          Ordner für Speicherung auswählen
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ pt: 2, pb: 1 }}>
        <Typography variant="body1" color="text.secondary" paragraph>
          UserStoryGen speichert User Stories, Bug Reports und Einstellungen in einem Ordner auf Ihrem Computer.
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Klicken Sie auf &quot;Zulassen&quot;, um den Ordner-Auswahl-Dialog zu öffnen. Wählen Sie den gewünschten Speicherordner (z. B. &quot;StoryStorage&quot;) oder erstellen Sie einen neuen.
        </Typography>
        <Box
          sx={{
            mt: 2,
            p: 2,
            bgcolor: 'action.hover',
            borderRadius: 2,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Die Daten bleiben lokal auf Ihrem Gerät. Es wird keine Verbindung zu externen Servern hergestellt.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, pt: 1, gap: 1 }}>
        <Button onClick={onClose} color="inherit" disabled={isLoading}>
          Nicht zulassen
        </Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={18} color="inherit" /> : <FolderOpenIcon />}
        >
          {isLoading ? 'Wird geöffnet…' : 'Zulassen'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
