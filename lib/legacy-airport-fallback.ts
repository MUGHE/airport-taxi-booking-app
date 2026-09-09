export function allowLegacyAirportFallback(nodeEnv = process.env.NODE_ENV): boolean {
  return nodeEnv !== "production"
}
