import Link from "next/link"
import { MapPin } from "lucide-react"
import { listPublishedPlaceDirectory } from "@/lib/place-directory"

// Local towns around the Slough base. A chip links to the town's page once one is published.
const AREAS = [
  "Slough", "Windsor", "Eton", "Maidenhead", "Langley", "Burnham", "Datchet", "Stoke Poges",
  "Farnham Common", "Iver", "Gerrards Cross", "Beaconsfield", "Taplow", "Cookham", "Marlow",
  "High Wycombe", "Uxbridge", "West Drayton", "Hayes", "Staines", "Egham", "Ascot", "Bracknell",
  "Wokingham", "Reading", "Chalfont St Peter", "Amersham", "Wraysbury", "Colnbrook", "Denham",
]

const areaSlug = (name: string) => `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-taxi`

export async function AreasWeCover() {
  const { places } = await listPublishedPlaceDirectory()
  const published = new Set(places.map((place) => place.slug))
  return (
    <section className="landing-areas" aria-labelledby="landing-areas-title">
      <div className="landing-container">
        <span className="landing-eyebrow">Areas we cover</span>
        <h2 id="landing-areas-title">Taxis &amp; airport transfers from Slough and nearby towns</h2>
        <p>
          Based in Slough, we run local taxis and airport transfers across Berkshire, Buckinghamshire and West
          London to Heathrow, Gatwick, Stansted, Luton, London City, Birmingham and Southampton airports.
        </p>
        <ul className="landing-areas-list">
          {AREAS.map((name) => {
            const slug = areaSlug(name)
            const content = <><MapPin aria-hidden="true" />{name} taxi</>
            return (
              <li key={name}>
                {published.has(slug) ? <Link href={`/destinations/${slug}`}>{content}</Link> : <span>{content}</span>}
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
