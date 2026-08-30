// Legal/company details shown on customer-facing documents (currently just invoices sent
// from the admin panel). Configure via env vars so they can be corrected without a code
// change — see .env.example. Falls back to the same contact details used elsewhere on the
// site when a dedicated invoicing value isn't set.

import { CALL_NUMBER, CONTACT_EMAIL } from "./contact"

export const COMPANY_NAME = process.env.COMPANY_NAME?.trim() || "ONE Airport Taxi"
export const COMPANY_ADDRESS = process.env.COMPANY_ADDRESS?.trim() || ""
export const COMPANY_PHONE = process.env.COMPANY_PHONE?.trim() || CALL_NUMBER
export const COMPANY_EMAIL = process.env.COMPANY_EMAIL?.trim() || CONTACT_EMAIL
/** Company registration / VAT number, if applicable. Left blank hides the line entirely. */
export const COMPANY_REGISTRATION_NUMBER = process.env.COMPANY_REGISTRATION_NUMBER?.trim() || ""
