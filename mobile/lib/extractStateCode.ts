const US_STATES = new Set([
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS',
  'KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY',
  'NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC',
])

/** Extract a US state code from an address string, skipping street abbreviations like ST, NE */
export function extractStateCode(address: string | null): string | null {
  if (!address) return null
  const matches = address.match(/\b([A-Z]{2})\b/g)
  if (!matches) return null
  for (let i = matches.length - 1; i >= 0; i--) {
    if (US_STATES.has(matches[i])) return matches[i]
  }
  return null
}
