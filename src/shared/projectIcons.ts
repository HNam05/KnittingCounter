export const PROJECT_ICON_OPTIONS = [
  { id: 'b1', label: 'B1' },
  { id: 'b2', label: 'B2' },
  { id: 'b3', label: 'B3' },
  { id: 'c1', label: 'C1' },
  { id: 'c2', label: 'C2' },
  { id: 'f1', label: 'F1' },
  { id: 'f2', label: 'F2' },
  { id: 'f3', label: 'F3' },
  { id: 'f4', label: 'F4' },
  { id: 'f5', label: 'F5' },
  { id: 'h1', label: 'H1' },
  { id: 'h2', label: 'H2' },
  { id: 'h3', label: 'H3' }
] as const

export type ProjectIconId = (typeof PROJECT_ICON_OPTIONS)[number]['id']

const PROJECT_ICON_ID_SET = new Set<string>(PROJECT_ICON_OPTIONS.map((option) => option.id))

export function isProjectIconId(value: unknown): value is ProjectIconId {
  return typeof value === 'string' && PROJECT_ICON_ID_SET.has(value)
}
