/** Entfernt "AC1:", "AC2:" etc. vom Anfang – für Anzeige und Markdown nach Verschieben */
export function stripAcPrefix(text: string): string {
  return text.replace(/^AC\d+:\s*/i, '').trim();
}

/** Entfernt führende Nummerierung (1. , 2. , 1., etc.) – Nutzerflow-Schritte werden im Markdown aus der Reihenfolge nummeriert */
export function stripFlowStepNumber(text: string): string {
  return text.replace(/^\d+\.\s*/, '').trim();
}

/** Formatiert Datum für Anzeige (z. B. "07.03.2025"). */
export function formatDate(isoOrId: string | undefined, fallbackId?: string): string {
  if (isoOrId && /^\d{4}-\d{2}-\d{2}/.test(isoOrId)) {
    const d = new Date(isoOrId);
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
  if (fallbackId) {
    const ts = parseInt(fallbackId.split('-')[0], 10);
    if (!isNaN(ts)) {
      return new Date(ts).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
  }
  return '—';
}
