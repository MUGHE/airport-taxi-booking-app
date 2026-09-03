import { CALL_NUMBER, CONTACT_EMAIL } from "@/lib/contact"
import {
  COMPANY_CITY,
  COMPANY_COUNTRY,
  COMPANY_NAME,
  COMPANY_POSTCODE,
  COMPANY_STREET_ADDRESS,
} from "@/lib/company"
import { SITE_URL } from "@/lib/site"

// Renders LocalBusiness JSON-LD so Google can show rich results (address, phone, hours).
export function LocalBusinessSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: COMPANY_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/icon-96x96.png`,
    image: `${SITE_URL}/icon-96x96.png`,
    telephone: CALL_NUMBER,
    email: CONTACT_EMAIL,
    address: {
      "@type": "PostalAddress",
      streetAddress: COMPANY_STREET_ADDRESS,
      addressLocality: COMPANY_CITY,
      postalCode: COMPANY_POSTCODE,
      addressCountry: COMPANY_COUNTRY,
    },
    areaServed: "GB",
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      opens: "00:00",
      closes: "23:59",
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
