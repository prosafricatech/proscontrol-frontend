/**
 * Field errors from a backend 422 envelope: `data: { field: [messages] }`.
 */
export function backendFieldErrors(payload: any): Record<string, string> {
  const data = payload?.data;
  if (!data || typeof data !== 'object' || Array.isArray(data)) return {};

  return Object.fromEntries(
    Object.entries(data)
      .filter(([, messages]) => Array.isArray(messages) && typeof messages[0] === 'string')
      .map(([field, messages]) => [field, (messages as string[])[0]]),
  );
}

export function firstBackendError(payload: any, fallback: string): string {
  return Object.values(backendFieldErrors(payload))[0] || payload?.message || fallback;
}
