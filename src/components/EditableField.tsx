import React, { useState, useCallback } from 'react';
import { Box, TextField, IconButton, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';

interface EditableFieldProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  multiline?: boolean;
  placeholder?: string;
  onCopy?: () => void;
  minRows?: number;
}

export function EditableField({
  value,
  onChange,
  label,
  multiline = false,
  placeholder = '',
  onCopy,
  minRows = 1,
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  const handleStartEdit = useCallback(() => {
    setEditValue(value);
    setIsEditing(true);
  }, [value]);

  const handleSave = useCallback(() => {
    onChange(editValue);
    setIsEditing(false);
  }, [editValue, onChange]);

  const handleCancel = useCallback(() => {
    setEditValue(value);
    setIsEditing(false);
  }, [value]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !multiline) {
        e.preventDefault();
        handleSave();
      }
      if (e.key === 'Escape') {
        handleCancel();
      }
    },
    [handleSave, handleCancel, multiline]
  );

  const handleCopy = useCallback(() => {
    if (onCopy) {
      onCopy();
    } else {
      navigator.clipboard.writeText(value);
    }
  }, [onCopy, value]);

  if (isEditing) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, width: '100%' }}>
        <TextField
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          multiline={multiline}
          minRows={multiline ? minRows : 1}
          placeholder={placeholder}
          fullWidth
          size="small"
          autoFocus
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: 'background.paper',
            },
          }}
        />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <IconButton size="small" onClick={handleSave} color="primary" title="Speichern">
            <CheckIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={handleCancel} title="Abbrechen">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1,
        width: '100%',
        p: 1.5,
        borderRadius: 1,
        border: '1px solid transparent',
        '&:hover': {
          borderColor: 'divider',
          bgcolor: 'action.hover',
        },
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {label && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            {label}
          </Typography>
        )}
        <Typography
          variant="body1"
          sx={{
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {value || placeholder || '(leer)'}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
        <IconButton size="small" onClick={handleCopy} title="Kopieren">
          <ContentCopyIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" onClick={handleStartEdit} title="Bearbeiten">
          <EditIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
}
