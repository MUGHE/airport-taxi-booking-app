import { COMPANY_NAME } from "@/lib/company"
import type { AirportPageSeo } from "@/lib/destination-pages"
import { serializeJsonLd } from "@/lib/json-ld"
import { ORGANIZATION_ID, SITE_URL } from "@/lib/site"

function absoluteUrl(url: string) {
  return new URL(url, `${SITE_URL}/`).toString()
}

export function AirportPageStructuredData({ seo }: { seo: AirportPageSeo }) {
  const canonicalUrl = `${SITE_URL}${seo.canonical}`
  const graph = [
    {
      "@type": "Organization",
      "@id": ORGANIZATION_ID,
      name: COMPANY_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/icon-96x96.png`,
    },
    {
      "@type": "Airport",
      "@id": `${canonicalUrl}#airport`,
      name: seo.airport.officialName,
      iataCode: seo.airport.iataCode,
      address: seo.airport.address,
      geo: {
        "@type": "GeoCoordinates",
        latitude: seo.airport.latitude,
        longitude: seo.airport.longitude,
      },
    },
    {
      "@type": "TaxiService",
      "@id": `${canonicalUrl}#service`,
      name: `${seo.airport.displayName} Airport Taxi Service`,
      url: canonicalUrl,
      image: absoluteUrl(seo.socialImage.url),
      description: seo.description,
      areaServed: seo.airport.serviceArea,
      provider: { "@id": ORGANIZATION_ID },
      serviceType: "Airport taxi transfer",
      serviceLocation: { "@id": `${canonicalUrl}#airport` },
    },
  ]

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd({ "@context": "https://schema.org", "@graph": graph }) }}
    />
  )
}
