/** Entfernt "AC1:", "AC2:" etc. vom Anfang – für Anzeige und Markdown nach Verschieben */
export function stripAcPrefix(text: string): string {
  return text.replace(/^AC\d+:\s*/i, '').trim();
}
