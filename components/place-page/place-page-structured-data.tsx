import { COMPANY_NAME } from "@/lib/company"
import type { PublishedPlacePage } from "@/lib/destination-pages"
import { serializeJsonLd } from "@/lib/json-ld"
import { ORGANIZATION_ID, SITE_URL } from "@/lib/site"

function absoluteUrl(url: string) {
  return new URL(url, `${SITE_URL}/`).toString()
}

export function PlacePageStructuredData({ page }: { page: PublishedPlacePage }) {
  const canonicalUrl = absoluteUrl(page.metadata.canonical)
  const breadcrumbItems = [
    { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
    { "@type": "ListItem", position: 2, name: "Destinations", item: `${SITE_URL}/destinations` },
    { "@type": "ListItem", position: 3, name: page.presentation.displayName, item: canonicalUrl },
  ]
  const graph = [
    {
      "@type": "Organization",
      "@id": ORGANIZATION_ID,
      name: COMPANY_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/icon-96x96.png`,
    },
    {
      "@type": "WebPage",
      "@id": `${canonicalUrl}#webpage`,
      url: canonicalUrl,
      name: page.metadata.title,
      description: page.metadata.description,
      breadcrumb: { "@id": `${canonicalUrl}#breadcrumb` },
      mainEntity: { "@id": `${canonicalUrl}#service` },
      isPartOf: { "@id": `${SITE_URL}/#website` },
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${canonicalUrl}#breadcrumb`,
      itemListElement: breadcrumbItems,
    },
    {
      "@type": "Service",
      "@id": `${canonicalUrl}#service`,
      name: `${page.presentation.displayName} Airport Transfer Service`,
      url: canonicalUrl,
      image: absoluteUrl(page.metadata.socialImage.url),
      description: page.metadata.description,
      areaServed: page.presentation.displayName,
      provider: { "@id": ORGANIZATION_ID },
      serviceType: "Airport taxi transfer",
    },
  ]

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd({ "@context": "https://schema.org", "@graph": graph }) }}
    />
  )
}
