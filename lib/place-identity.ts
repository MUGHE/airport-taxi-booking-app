export type PlaceIdentityTerms = {
  names: string[]
  aliases: string[]
  coveredLocalities: string[]
}

export function normalizePlaceIdentity(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("en-GB")
}

export function findPlaceIdentityConflict(terms: PlaceIdentityTerms): string | null {
  const seen = new Set<string>()
  for (const value of [...terms.names, ...terms.aliases, ...terms.coveredLocalities]) {
    const normalized = normalizePlaceIdentity(value)
    if (!normalized) continue
    if (seen.has(normalized)) return normalized
    seen.add(normalized)
  }
  return null
}

export function wouldCreateParentCycle(pageId: string, parentId: string | null, parents: ReadonlyMap<string, string | null>): boolean {
  const visited = new Set([pageId])
  let current = parentId
  while (current) {
    if (visited.has(current)) return true
    visited.add(current)
    current = parents.get(current) ?? null
  }
  return false
}
