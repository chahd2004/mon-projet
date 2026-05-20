/**
 * Extrait une liste depuis la réponse API.
 * Gère : tableau direct, Spring Page { content: T[] }, ou wrapper { data: T[] }.
 */
export function unwrapList<T>(response: unknown): T[] {
  if (Array.isArray(response)) {
    return response;
  }
  if (response && typeof response === 'object') {
    const obj = response as Record<string, unknown>;
    if (Array.isArray(obj['content'])) return obj['content'] as T[];
    if (Array.isArray(obj['data'])) return obj['data'] as T[];
  }
  return [];
}
