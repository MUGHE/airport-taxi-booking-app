import { COMPANY_NAME } from "@/lib/company"
import { SOCIAL_PROFILE_URLS } from "@/lib/contact"
import { serializeJsonLd } from "@/lib/json-ld"
import type { RoutePagePresentation } from "@/lib/route-pages"
import { ORGANIZATION_ID, SITE_URL } from "@/lib/site"

export function RoutePageStructuredData({ page }: { page: RoutePagePresentation }) {
  const url = `${SITE_URL}/${page.slug}`
  const routeName = `${page.a.name} ⇄ ${page.b.name}`
  const graph: Record<string, unknown>[] = [
    { "@type": "Organization", "@id": ORGANIZATION_ID, name: COMPANY_NAME, url: SITE_URL, logo: `${SITE_URL}/icon-96x96.png`, sameAs: SOCIAL_PROFILE_URLS },
    {
      "@type": "WebPage",
      "@id": `${url}#webpage`,
      url,
      name: page.seoTitle,
      description: page.seoDescription,
      breadcrumb: { "@id": `${url}#breadcrumb` },
      mainEntity: { "@id": `${url}#service` },
      isPartOf: { "@id": `${SITE_URL}/#website` },
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${url}#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
        { "@type": "ListItem", position: 2, name: routeName, item: url },
      ],
    },
    {
      "@type": "Service",
      "@id": `${url}#service`,
      name: page.heading,
      url,
      description: page.seoDescription,
      serviceType: "Private taxi transfer",
      provider: { "@id": ORGANIZATION_ID },
      areaServed: [page.a.name, page.b.name],
      ...(page.fromFare != null ? { offers: { "@type": "AggregateOffer", priceCurrency: "GBP", lowPrice: page.fromFare, highPrice: page.fares[page.fares.length - 1]?.fare ?? page.fromFare, offerCount: page.fares.length } } : {}),
    },
  ]
  if (page.faqs.length) graph.push({
    "@type": "FAQPage",
    "@id": `${url}#faq`,
    mainEntity: page.faqs.map((faq) => ({ "@type": "Question", name: faq.question, acceptedAnswer: { "@type": "Answer", text: faq.answer } })),
  })
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd({ "@context": "https://schema.org", "@graph": graph }) }} />
}
