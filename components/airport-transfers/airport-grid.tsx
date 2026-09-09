import type { AirportDirectoryEntry } from "@/lib/airport-directory"
import { AirportDirectory } from "@/components/airport-transfers/airport-directory"

export function AirportGrid({ airports }: { airports: AirportDirectoryEntry[] }) {
  return <AirportDirectory airports={airports} />
}
