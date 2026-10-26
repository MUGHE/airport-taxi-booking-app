// Contact numbers for the floating help button (components/help-button.tsx).
// WhatsApp and Call intentionally support different numbers since they're
// often routed to different lines/devices.
//
// Configure via env vars (see .env.example):
//   NEXT_PUBLIC_WHATSAPP_NUMBER — digits only, with country code, no "+" or spaces
//   NEXT_PUBLIC_CALL_NUMBER     — digits only, with country code, no "+" or spaces

const DEFAULT_WHATSAPP_NUMBER = "447546624242"
const DEFAULT_CALL_NUMBER = "+447441485225"

/** Digits-only number (with country code) used to build the wa.me link. */
export const WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim() || DEFAULT_WHATSAPP_NUMBER

/** E.164 number used to build the tel: link. */
export const CALL_NUMBER =
  process.env.NEXT_PUBLIC_CALL_NUMBER?.trim() || DEFAULT_CALL_NUMBER

export const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER.replace(/[^\d]/g, "")}`
export const CALL_LINK = `tel:${CALL_NUMBER}`

export const CONTACT_EMAIL = "contact@oneairporttaxi.com"
export const EMAIL_LINK = `mailto:${CONTACT_EMAIL}`

/** Official social profiles: footer icons and the schema.org `sameAs` list. */
export const SOCIAL_LINKS = [
  { name: "Facebook", href: "https://www.facebook.com/profile.php?id=61593948787388" },
  { name: "Instagram", href: "https://www.instagram.com/oneairporttaxi/" },
  { name: "YouTube", href: "https://www.youtube.com/@OneAirportTaxi" },
] as const

export const SOCIAL_PROFILE_URLS = SOCIAL_LINKS.map((link) => link.href)
