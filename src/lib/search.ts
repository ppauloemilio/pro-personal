export function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function matchesSearch(
  query: string | undefined,
  ...fields: (string | null | undefined)[]
): boolean {
  const normalized = normalizeSearchText(query || "");
  if (!normalized) return true;
  return fields.some(
    (field) => field && normalizeSearchText(field).includes(normalized)
  );
}
