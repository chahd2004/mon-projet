function extractYear(value?: string | null): number {
  if (!value) {
    return new Date().getFullYear();
  }

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.getFullYear();
  }

  const yearMatch = String(value).match(/(19|20)\d{2}/);
  return yearMatch ? Number(yearMatch[0]) : new Date().getFullYear();
}

function extractSequence(value?: string | null, fallbackId?: number): number {
  const raw = String(value || '').trim();

  const normalized = raw.match(/^[A-Z]+-(\d{4})-(\d{1,6})$/i);
  if (normalized) {
    return Number(normalized[2]);
  }

  const yearSuffix = raw.match(/(19|20)\d{2}[-_/](\d{1,6})$/);
  if (yearSuffix) {
    return Number(yearSuffix[2]);
  }

  const trailingDigits = raw.match(/(\d{1,6})$/);
  if (trailingDigits) {
    return Number(trailingDigits[1]);
  }

  return Number.isFinite(fallbackId) && (fallbackId || 0) > 0 ? Number(fallbackId) : 1;
}

export function formatDocumentReference(
  prefix: 'DEVIS' | 'BC' | 'CMD' | 'BL' | 'FACT',
  raw?: string | null,
  dateSource?: string | null,
  fallbackId?: number
): string {
  const year = extractYear(dateSource || raw || null);
  const seq = extractSequence(raw, fallbackId);

  return `${prefix}-${year}-${String(seq).padStart(4, '0')}`;
}
