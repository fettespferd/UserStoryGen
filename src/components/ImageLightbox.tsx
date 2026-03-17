import { Dialog } from '@mui/material';

interface ImageLightboxProps {
  open: boolean;
  onClose: () => void;
  src: string;
  alt?: string;
}

export function ImageLightbox({ open, onClose, src, alt = 'Bild' }: ImageLightboxProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      onClick={onClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          bgcolor: 'transparent',
          boxShadow: 'none',
          maxWidth: '95vw',
          maxHeight: '95vh',
        },
      }}
      BackdropProps={{
        sx: { bgcolor: 'rgba(0,0,0,0.85)' },
      }}
    >
      <img
        src={src}
        alt={alt}
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '95vw',
          maxHeight: '95vh',
          objectFit: 'contain',
          cursor: 'zoom-out',
        }}
      />
    </Dialog>
  );
}
