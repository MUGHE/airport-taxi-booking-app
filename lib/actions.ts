"use server"

import { cookies, headers } from "next/headers"
import { revalidatePath } from "next/cache"
import {
  findActivePromoCode,
  findBooking,
  findReviewByBooking,
  generateReference,
  markReviewRequested,
  saveReview,
  getReturnTripDiscount as getStoredReturnTripDiscount,
  getSitePromotion as getStoredSitePromotion,
  getStopPricing as getStoredStopPricing,
  listCongestionZones as listStoredCongestionZones,
  linkReturnTrip,
  listBookings,
  listActiveAddOns,
  listAddOns,
  listPromoCodes,
  listVehiclesWithPricing,
  markBookingAsPaid,
  replaceBooking,
  saveBooking,
  setBookingStatus,
  updateReturnTripDiscount as setReturnTripDiscount,
  updateSitePromotion as setSitePromotion,
  updateStopPricing as setStopPricing,
  upsertCongestionZone as saveCongestionZone,
  deleteCongestionZone as removeCongestionZone,
  updateVehiclePricing as setVehiclePricing,
  upsertAddOn as saveAddOn,
  deleteAddOn as removeAddOn,
  upsertPromoCode as savePromoCode,
  deletePromoCode as removePromoCode,
  createAdminUser,
  claimOtpAttempt,
  savePendingCustomer,
  updateCustomerVerification,
  updateCustomerAccount,
  applyPendingEmail,
  findCustomerCredentialsById,
  type CustomerCredentials,
  type OtpPurpose,
  setCustomerPassword,
  findAdminCredentials,
  findAdminUser,
  findCustomerCredentials,
  linkBookingAccounts,
  findCustomerByReferralCode,
  getReferralSettings as getStoredReferralSettings,
  updateReferralSettings as setReferralSettings,
  recordReferralCommission,
  deletePendingReferralCommission,
  isAllowedReceipt,
  recordReferralPayout,
  removeReferralReceipt,
  uploadReferralReceipt,
  listAdminUsers,
  updateAdminUser,
} from "./store"
import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto"
import { after } from "next/server"
import { z } from "zod"
import { CUSTOMER_HINT_COOKIE, REFERRAL_COOKIE } from "./session-config"
import { ADMIN_SESSION_COOKIE, CUSTOMER_SESSION_COOKIE, CUSTOMER_SESSION_MAX_AGE, SESSION_MAX_AGE, createSessionToken } from "./auth"
import { RESET_RESEND_MS, type PasswordResetState, clearPasswordResetState, getAdminUser, getCustomer, isAdminAuthenticated, readPasswordResetState, setSessionCookie, startCustomerSession, writePasswordResetState } from "./session"
import { hashPassword, verifyCredentials } from "./password"
import { passwordProblem } from "./password-policy"
import { isAdminRole, type AdminRole } from "./admin-roles"
import type { AdminUser, Booking, Customer, BookingAddOn, BookingStatus, CongestionZone, Destination, NewBookingInput, PaymentMethod, PromoCode, PromoDiscountType, ReturnTripDiscount, SitePromotion, StopPricing, VehicleClass } from "./types"
import { getStripeClient } from "./stripe"
import { calculateDrivingRoute } from "./google-distance"
import { applyPromotion, computeDiscount, computeFare, congestionChargeFor, MIN_DISTANCE_MILES, referralCommission } from "./fleet"
import { getGoogleReviewUrl, REVIEW_PUBLISH_THRESHOLD } from "./company"
import {
  sendBookingNotificationEmails,
  sendBookingUpdateEmail,
  sendCombinedBookingConfirmationEmails,
  sendInvoiceEmail,
  sendLowRatingAlertEmail,
  sendReviewRequestEmail,
  sendVerificationCodeEmail,
  sendPasswordChangedEmail,
} from "./email"
import { bulkPublishPlaceDrafts, getAdminDestinationPage, listAdminDestinationPages, listPlaceIdentityOptions, listReusableDestinationContent, reviewAdminDestinationPage, saveAdminDestinationPage, type BulkPublishSelection, type SaveAdminDestinationPageInput } from "./admin-destination-pages"
import { cloudinaryConfigError, createCloudinarySignature, getCloudinaryConfig } from "./cloudinary"
import { deleteCloudinaryAsset, listCloudinaryAssetUsage, listCloudinaryAssets, saveCloudinaryAsset, type CloudinaryAsset } from "./cloudinary-assets"
import type { CloudinaryImageKind } from "./cloudinary-validation"
import { listPublishedDestinationCandidates } from "./related-destinations"
import { setAirportFeatured } from "./airport-directory"
import { archiveAdminDestinationPage, deleteAdminDestinationDraft, publishAdminDestinationPage, restoreAdminDestinationPage, setAdminBookingAvailability, promoteCoveredLocalityToPlace } from "./admin-destination-pages"
import { invalidateSafePublishedAirportPageCache } from "./public-airport-page-cache"
import { invalidateSafePublishedPlacePageCache } from "./public-place-page-cache"
import { deleteAdminAirportFaq, listAdminAirportFaqs, saveAdminAirportFaq } from "./airport-faqs"


export interface LoginResult {
  ok: boolean
  error?: string
}

const emailSchema = z.email()

export async function loginAdmin(email: string, password: string): Promise<LoginResult> {
  if (!email?.trim() || !password) return { ok: false, error: "Enter your email and password." }
  const user = await findAdminCredentials(email)
  const valid = await verifyCredentials(password, user?.passwordHash)
  // Same message for unknown email, wrong password and deactivated account, so the form
  // can't be used to discover which staff emails exist.
  if (!user || !valid || !user.active) return { ok: false, error: "Incorrect email or password." }

  await setSessionCookie(ADMIN_SESSION_COOKIE, await createSessionToken("admin", user.id), SESSION_MAX_AGE)
  return { ok: true }
}

export async function logoutAdmin(): Promise<void> {
  const store = await cookies()
  store.delete(ADMIN_SESSION_COOKIE)
}

export async function listAdminUsersAction(): Promise<AdminUser[]> {
  if (!(await isAdminAuthenticated("users"))) return []
  return listAdminUsers()
}

export async function createAdminUserAction(input: { email: string; name: string; role: AdminRole; password: string }): Promise<{ ok: boolean; error?: string }> {
  if (!(await isAdminAuthenticated("users"))) return { ok: false, error: "Not authorized." }
  if (!emailSchema.safeParse(input.email?.trim()).success) return { ok: false, error: "Enter a valid email address." }
  if (!input.name?.trim()) return { ok: false, error: "Name is required." }
  if (!isAdminRole(input.role)) return { ok: false, error: "Choose a role." }
  const weak = passwordProblem(input.password, input.email)
  if (weak) return { ok: false, error: weak }
  const user = await createAdminUser({ ...input, passwordHash: await hashPassword(input.password) })
  if (!user) return { ok: false, error: "An admin user with this email already exists." }
  revalidatePath("/admin/users")
  return { ok: true }
}

export async function updateAdminUserAction(id: string, changes: { role?: AdminRole; active?: boolean; password?: string }): Promise<{ ok: boolean; error?: string }> {
  const actor = await getAdminUser()
  if (!actor || !(await isAdminAuthenticated("users"))) return { ok: false, error: "Not authorized." }
  // A super admin can't demote or deactivate themselves — that's how the last one
  // would lock everybody out of user management.
  if (id === actor.id && (changes.role !== undefined || changes.active !== undefined)) {
    return { ok: false, error: "You can't change your own role or deactivate yourself." }
  }
  if (changes.role !== undefined && !isAdminRole(changes.role)) return { ok: false, error: "Choose a role." }
  const target = await findAdminUser(id)
  if (!target) return { ok: false, error: "User not found." }
  if (changes.password !== undefined) {
    const weak = passwordProblem(changes.password, target.email)
    if (weak) return { ok: false, error: weak }
  }
  await updateAdminUser(id, {
    role: changes.role,
    active: changes.active,
    passwordHash: changes.password !== undefined ? await hashPassword(changes.password) : undefined,
    // A password set for someone else is temporary: they replace it on next sign-in.
    mustChangePassword: changes.password !== undefined ? id !== actor.id : undefined,
  })
  revalidatePath("/admin/users")
  return { ok: true }
}

/** Any signed-in staff member replacing their own password (required after a temporary one). */
export async function changeOwnAdminPasswordAction(currentPassword: string, newPassword: string): Promise<{ ok: boolean; error?: string }> {
  const user = await getAdminUser()
  if (!user) return { ok: false, error: "Your session has expired. Sign in again." }
  const credentials = await findAdminCredentials(user.email)
  if (!(await verifyCredentials(currentPassword ?? "", credentials?.passwordHash))) return { ok: false, error: "Your current password is incorrect." }
  if (newPassword === currentPassword) return { ok: false, error: "Choose a password different from your current one." }
  const weak = passwordProblem(newPassword, user.email)
  if (weak) return { ok: false, error: weak }
  await updateAdminUser(user.id, { passwordHash: await hashPassword(newPassword), mustChangePassword: false })
  return { ok: true }
}

/** `needsCode`: a verification code was emailed and the form should ask for it next. */
export interface CustomerAuthResult extends LoginResult {
  needsCode?: boolean
}

const OTP_TTL_MS = 10 * 60 * 1000
const OTP_RESEND_MS = 60 * 1000
const OTP_MAX_ATTEMPTS = 5
const hashOtp = (code: string) => createHash("sha256").update(code).digest()
/** Flows that email a code (the reset flow's later "verified" permission is never emailed). */
type CodePurpose = Exclude<OtpPurpose, "password_reset_verified">

/** Emails a fresh 6-digit code, unless one went out in the last minute (that one still works). */
async function sendCustomerOtp(customer: CustomerCredentials, purpose: CodePurpose, to = customer.email): Promise<CustomerAuthResult> {
  const lastSentAt = customer.otpExpiresAt ? Date.parse(customer.otpExpiresAt) - OTP_TTL_MS : 0
  // The throttle only covers a code for the same flow; a different flow always gets its own.
  if ((customer.otpPurpose ?? "signup") === purpose && Date.now() - lastSentAt < OTP_RESEND_MS) return { ok: true, needsCode: true }

  const code = String(randomInt(1_000_000)).padStart(6, "0")
  await updateCustomerVerification(customer.id, {
    otp_hash: hashOtp(code).toString("hex"),
    otp_expires_at: new Date(Date.now() + OTP_TTL_MS).toISOString(),
    otp_attempts: 0,
    otp_purpose: purpose,
  })
  const sent = await sendVerificationCodeEmail(to, customer.name, code, purpose)
  if (!sent.ok) return { ok: false, error: "We couldn't send your verification code. Please try again shortly." }
  return { ok: true, needsCode: true }
}

export async function registerCustomer(input: { name: string; email: string; phone: string; password: string }): Promise<CustomerAuthResult> {
  if (!input.name?.trim()) return { ok: false, error: "Name is required." }
  if (!emailSchema.safeParse(input.email?.trim()).success) return { ok: false, error: "Enter a valid email address." }
  if (!input.phone?.trim()) return { ok: false, error: "Phone is required." }
  const weak = passwordProblem(input.password, input.email)
  if (weak) return { ok: false, error: weak }
  const customer = await savePendingCustomer({ ...input, passwordHash: await hashPassword(input.password) })
  if (!customer) return { ok: false, error: "An account with this email already exists. Sign in instead." }
  return sendCustomerOtp(customer, "signup")
}

export async function resendCustomerCode(email: string): Promise<CustomerAuthResult> {
  const customer = await findCustomerCredentials(email ?? "")
  if (!customer || customer.emailVerified) return { ok: false, error: "There's no sign-up waiting for this email. Start again." }
  return sendCustomerOtp(customer, "signup")
}

/**
 * Checks a code against the customer's outstanding one, counting the guess against the
 * limit. Returns why it failed, or `null` when it matches.
 */
async function checkCustomerOtp(customer: CustomerCredentials, code: string, purpose: CodePurpose): Promise<string | null> {
  if (!customer.otpHash || !customer.otpExpiresAt || (customer.otpPurpose ?? "signup") !== purpose) return "This code isn't valid any more. Request a new one."
  if (Date.now() > Date.parse(customer.otpExpiresAt)) return "This code has expired. Request a new one."
  if (customer.otpAttempts >= OTP_MAX_ATTEMPTS || !(await claimOtpAttempt(customer.id, customer.otpAttempts))) {
    return "Too many attempts. Request a new code."
  }
  const expected = Buffer.from(customer.otpHash, "hex")
  const actual = hashOtp((code ?? "").trim())
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    const left = OTP_MAX_ATTEMPTS - customer.otpAttempts - 1
    return left > 0 ? `That code is incorrect. ${left} ${left === 1 ? "attempt" : "attempts"} left.` : "Too many attempts. Request a new code."
  }
  return null
}

export async function verifyCustomerEmail(email: string, code: string): Promise<CustomerAuthResult> {
  const customer = await findCustomerCredentials(email ?? "")
  if (!customer || customer.emailVerified) return { ok: false, error: "This code isn't valid any more. Request a new one." }
  const problem = await checkCustomerOtp(customer, code, "signup")
  if (problem) return { ok: false, error: problem }

  await updateCustomerVerification(customer.id, { email_verified: true, otp_hash: null, otp_expires_at: null, otp_attempts: 0, otp_purpose: null })
  await startCustomerSession(customer.id)
  return { ok: true }
}

export async function updateCustomerProfileAction(input: { name: string; phone: string }): Promise<LoginResult> {
  const customer = await getCustomer()
  if (!customer) return { ok: false, error: "Your session has expired. Sign in again." }
  if (!input.name?.trim()) return { ok: false, error: "Name is required." }
  if (!input.phone?.trim()) return { ok: false, error: "Phone is required." }
  await updateCustomerAccount(customer.id, { name: input.name.trim(), phone: input.phone.trim() })
  revalidatePath("/account", "layout")
  return { ok: true }
}

export async function changeCustomerPasswordAction(currentPassword: string, newPassword: string): Promise<LoginResult> {
  const customer = await getCustomer()
  if (!customer) return { ok: false, error: "Your session has expired. Sign in again." }
  const credentials = await findCustomerCredentialsById(customer.id)
  if (!credentials) return { ok: false, error: "Your session has expired. Sign in again." }
  // A Google-only account has no password yet, so its first one needs no current password.
  const hasPassword = credentials.passwordHash !== ""
  if (hasPassword && !(await verifyCredentials(currentPassword ?? "", credentials.passwordHash))) return { ok: false, error: "Your current password is incorrect." }
  if (hasPassword && newPassword === currentPassword) return { ok: false, error: "Choose a password different from your current one." }
  const weak = passwordProblem(newPassword, customer.email)
  if (weak) return { ok: false, error: weak }
  // Signs out every other device (see setCustomerPassword), then keeps this one signed in.
  await setCustomerPassword(customer.id, await hashPassword(newPassword))
  await startCustomerSession(customer.id)
  return { ok: true }
}

/**
 * Step 1 of changing the login email: confirms it's really them (current password), then
 * sends a code to the new address. Nothing changes until that code is entered.
 */
export async function requestCustomerEmailChangeAction(newEmail: string, currentPassword: string): Promise<CustomerAuthResult> {
  const customer = await getCustomer()
  if (!customer) return { ok: false, error: "Your session has expired. Sign in again." }
  const email = (newEmail ?? "").trim().toLowerCase()
  if (!emailSchema.safeParse(email).success) return { ok: false, error: "Enter a valid email address." }
  if (email === customer.email) return { ok: false, error: "That's already your email address." }
  const credentials = await findCustomerCredentialsById(customer.id)
  if (credentials && !credentials.passwordHash) return { ok: false, error: "Set a password first (below), then change your email." }
  if (!credentials || !(await verifyCredentials(currentPassword ?? "", credentials.passwordHash))) return { ok: false, error: "Your current password is incorrect." }
  if (await findCustomerCredentials(email)) return { ok: false, error: "An account with this email already exists." }

  // A different new address than last time needs a fresh code, not the throttled old one.
  const resend = credentials.pendingEmail === email ? credentials : { ...credentials, otpExpiresAt: null }
  await updateCustomerAccount(customer.id, { pending_email: email })
  return sendCustomerOtp(resend, "email_change", email)
}

/** Step 2: the code from the new inbox makes it the login email. */
export async function confirmCustomerEmailChangeAction(code: string): Promise<LoginResult> {
  const customer = await getCustomer()
  if (!customer) return { ok: false, error: "Your session has expired. Sign in again." }
  const credentials = await findCustomerCredentialsById(customer.id)
  if (!credentials?.pendingEmail) return { ok: false, error: "There's no email change waiting. Start again." }
  const problem = await checkCustomerOtp(credentials, code, "email_change")
  if (problem) return { ok: false, error: problem }
  if (!(await applyPendingEmail(customer.id, credentials.pendingEmail))) return { ok: false, error: "An account with this email already exists." }
  revalidatePath("/account", "layout")
  return { ok: true }
}

export async function loginCustomer(email: string, password: string): Promise<CustomerAuthResult> {
  if (!email?.trim() || !password) return { ok: false, error: "Enter your email and password." }
  const customer = await findCustomerCredentials(email)
  if (!(await verifyCredentials(password, customer?.passwordHash)) || !customer) {
    // Their email is already known to be registered by now (sign-up says so), so saying how
    // they sign in reveals nothing new and saves a dead end.
    if (customer?.googleSub && !customer.passwordHash) return { ok: false, error: "This account signs in with Google. Use \"Continue with Google\" above." }
    return { ok: false, error: "Incorrect email or password." }
  }
  // Right password but the sign-up was never finished: send them back to the code step.
  if (!customer.emailVerified) return sendCustomerOtp(customer, "signup")
  await startCustomerSession(customer.id)
  return { ok: true }
}

export async function logoutCustomer(): Promise<void> {
  const store = await cookies()
  store.delete(CUSTOMER_SESSION_COOKIE)
  store.delete(CUSTOMER_HINT_COOKIE)
}

// --- Forgot password ---------------------------------------------------------------
// Three steps on /account/forgot-password: email → emailed code → new password. Which step
// this browser is on is held server-side in a signed cookie (lib/session.ts), never in the
// URL, and only the browser tab that started the flow can move it on. Every step answers
// the same whether or not the email has an account, and codes go out after the response,
// so neither wording nor timing reveals who's registered.

const RESET_FLOW_MS = 15 * 60 * 1000
const RESET_PERMISSION_MS = 10 * 60 * 1000
const RESET_CODE_PROBLEM = "That code isn't right or has expired. Check the latest email and try again."
const RESET_ENDED = "Your reset session has ended. Enter your email to get a new code."

/** `restart`: the flow is over (expired, or opened in another tab) and the page should go back to step 1. */
type PasswordResetResult = LoginResult & { restart?: boolean }
const flowEnded: PasswordResetResult = { ok: false, error: RESET_ENDED, restart: true }

const isTabId = (value: unknown): value is string => typeof value === "string" && /^[A-Za-z0-9-]{16,64}$/.test(value)

/**
 * The flow state, but only for the tab that started it. Any other tab (including one
 * reopened after the original was closed) ends the flow instead of continuing it.
 */
async function readResetFlow(tabId: string): Promise<PasswordResetState | null> {
  const state = await readPasswordResetState()
  if (state && (!isTabId(tabId) || state.tabId !== tabId)) {
    await clearPasswordResetState()
    return null
  }
  return state
}

/** Emails a reset code if (and only if) this is a verified account — after the response is sent. */
function sendResetCodeLater(email: string) {
  after(async () => {
    const customer = await findCustomerCredentials(email)
    if (!customer?.emailVerified) return
    const result = await sendCustomerOtp(customer, "password_reset")
    if (!result.ok) console.error(`Password reset code not sent: ${result.error}`)
  })
}

/** Step 1. Always "succeeds", so the form can't be used to test which emails have accounts. */
export async function requestPasswordResetAction(email: string, tabId: string): Promise<PasswordResetResult> {
  const normalized = (email ?? "").trim().toLowerCase()
  if (!emailSchema.safeParse(normalized).success) return { ok: false, error: "Enter a valid email address." }
  if (!isTabId(tabId)) return { ok: false, error: "Something went wrong. Please reload the page." }
  await writePasswordResetState({ stage: "code", email: normalized, exp: Date.now() + RESET_FLOW_MS, sentAt: Date.now(), tabId })
  sendResetCodeLater(normalized)
  return { ok: true }
}

/** Resends to the email fixed at step 1 (never one supplied now), at most once a minute. */
export async function resendPasswordResetCodeAction(tabId: string): Promise<PasswordResetResult> {
  const state = await readResetFlow(tabId)
  if (state?.stage !== "code") return flowEnded
  // Matches the page's 60-second countdown, so clicking early (or scripting it) sends nothing.
  const wait = Math.ceil((state.sentAt + RESET_RESEND_MS - Date.now()) / 1000)
  if (wait > 0) return { ok: false, error: `You can request a new code in ${wait} seconds.` }
  await writePasswordResetState({ ...state, sentAt: Date.now() })
  sendResetCodeLater(state.email)
  return { ok: true }
}

/** Step 2. A correct code swaps the flow to a single-use, 10-minute permission to set a password. */
export async function verifyPasswordResetCodeAction(code: string, tabId: string): Promise<PasswordResetResult> {
  const state = await readResetFlow(tabId)
  if (state?.stage !== "code") return flowEnded
  const customer = await findCustomerCredentials(state.email)
  // One message for every failure (wrong, expired, too many tries, or no such account).
  if (!customer?.emailVerified || (await checkCustomerOtp(customer, code, "password_reset"))) return { ok: false, error: RESET_CODE_PROBLEM }

  const nonce = randomBytes(32).toString("base64url")
  const exp = Date.now() + RESET_PERMISSION_MS
  // Stored hashed, so the permission is spent (single use) once setCustomerPassword clears it.
  await updateCustomerVerification(customer.id, { otp_purpose: "password_reset_verified", otp_hash: hashOtp(nonce).toString("hex"), otp_expires_at: new Date(exp).toISOString(), otp_attempts: 0 })
  await writePasswordResetState({ stage: "verified", customerId: customer.id, nonce, exp, tabId: state.tabId })
  return { ok: true }
}

/** Step 3. Sets the password, signs the account out everywhere, and ends the flow. */
export async function resetPasswordAction(newPassword: string, tabId: string): Promise<PasswordResetResult> {
  const state = await readResetFlow(tabId)
  if (state?.stage !== "verified") return flowEnded
  const customer = await findCustomerCredentialsById(state.customerId)
  const expected = customer?.otpPurpose === "password_reset_verified" && customer.otpHash && customer.otpExpiresAt && Date.now() < Date.parse(customer.otpExpiresAt)
    ? Buffer.from(customer.otpHash, "hex")
    : null
  const presented = hashOtp(state.nonce)
  if (!customer || !expected || expected.length !== presented.length || !timingSafeEqual(expected, presented)) {
    await clearPasswordResetState()
    return flowEnded
  }
  const weak = passwordProblem(newPassword, customer.email)
  if (weak) return { ok: false, error: weak }

  await setCustomerPassword(customer.id, await hashPassword(newPassword))
  await clearPasswordResetState()
  after(() => sendPasswordChangedEmail(customer.email, customer.name))
  return { ok: true }
}

/**
 * Ends the flow. The page calls it itself when the reset session's time runs out, or when
 * it's opened in a tab that didn't start the flow (e.g. the original tab was closed).
 */
export async function endPasswordResetAction(): Promise<PasswordResetResult> {
  await clearPasswordResetState()
  return flowEnded
}

/**
 * No-op server action the idle-session warning calls when the admin clicks
 * "Stay signed in". It does nothing on its own — the point is the round trip
 * itself, which passes through `proxy.ts` and renews the sliding session
 * cookie the same way any other admin request would.
 */
export async function pingAdminSession(): Promise<boolean> {
  return !!(await getAdminUser())
}

export async function getAdminDestinationPages() {
  if (!(await isAdminAuthenticated("content"))) return []
  return listAdminDestinationPages()
}

export async function getAdminDestinationPageById(id: string) {
  if (!(await isAdminAuthenticated("content"))) return null
  return getAdminDestinationPage(id)
}

export async function getReusableDestinationContentAction() {
  if (!(await isAdminAuthenticated("content"))) return { serviceFacts: [], globalFaqs: [], reviews: [] }
  return listReusableDestinationContent()
}

export async function getAdminAirportFaqsAction() {
  if (!(await isAdminAuthenticated("content"))) return []
  return listAdminAirportFaqs()
}

export async function saveAdminAirportFaqAction(input: { id?: string; question: string; answer: string }) {
  if (!(await isAdminAuthenticated("content"))) return { ok: false as const, error: "Not authorized." }
  const result = await saveAdminAirportFaq(input)
  if (result.ok) {
    invalidateSafePublishedAirportPageCache()
    revalidatePath("/airport-transfers", "layout")
    revalidatePath("/admin/airport-faqs")
  }
  return result
}

export async function deleteAdminAirportFaqAction(id: string) {
  if (!(await isAdminAuthenticated("content"))) return { ok: false as const, error: "Not authorized." }
  const result = await deleteAdminAirportFaq(id)
  if (result.ok) {
    invalidateSafePublishedAirportPageCache()
    revalidatePath("/airport-transfers", "layout")
    revalidatePath("/admin/airport-faqs")
  }
  return result
}

export async function getRelatedDestinationCandidatesAction(pageId?: string) {
  if (!(await isAdminAuthenticated("content"))) return []
  return listPublishedDestinationCandidates(pageId)
}

export async function getPlaceIdentityOptionsAction() {
  if (!(await isAdminAuthenticated("content"))) return { groups: [], parents: [] }
  return listPlaceIdentityOptions()
}

export async function reviewGooglePlaceAction(placeId: string) {
  if (!(await isAdminAuthenticated("content"))) return { ok: false as const, error: "Not authorized." }
  const apiKey = process.env.GOOGLE_MAPS_API_KEY ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!apiKey) return { ok: false as const, error: "Google Place review is not configured." }
  if (!placeId.trim()) return { ok: false as const, error: "Select a Google Place before reviewing it." }
  try {
    const response = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId.trim())}`, {
      headers: { "X-Goog-Api-Key": apiKey, "X-Goog-FieldMask": "id,formattedAddress,location" },
      cache: "no-store",
    })
    if (response.status === 400) return { ok: false as const, error: "This Google Place identifier is invalid. Select the place again." }
    if (response.status === 404) return { ok: false as const, error: "This Google Place identifier is obsolete. Search for the place and select its current result." }
    if (!response.ok) return { ok: false as const, error: "Google could not review this place right now. Try again later." }
    return { ok: true as const }
  } catch {
    return { ok: false as const, error: "Google could not review this place right now. Try again later." }
  }
}

export async function setAirportFeaturedAction(pageId: string, featured: boolean) {
  if (!(await isAdminAuthenticated("content"))) return { ok: false as const, error: "Not authorized." }
  const result = await setAirportFeatured(pageId, featured)
  if (result.ok) {
    invalidateSafePublishedAirportPageCache()
    invalidateSafePublishedPlacePageCache()
    revalidatePath("/", "layout")
    revalidatePath("/airport-transfers", "layout")
    revalidatePath("/admin/destination-pages")
    revalidatePath(`/admin/destination-pages/${pageId}`)
  }
  return result
}

export async function saveAdminDestinationPageAction(input: SaveAdminDestinationPageInput) {
  if (!(await isAdminAuthenticated("content"))) return { ok: false as const, error: "Not authorized." }
  const result = await saveAdminDestinationPage(input)
  if (result.ok) {
    invalidateSafePublishedAirportPageCache()
    invalidateSafePublishedPlacePageCache()
    revalidatePath("/admin/destination-pages")
    revalidatePath("/admin/destination-pages/new")
    revalidatePath(`/admin/destination-pages/${result.page.id}`)
  }
  return result
}

export async function publishAdminDestinationPageAction(pageId: string, override?: import("./admin-destination-pages").PublishOverride, traceId?: string) {
  const trace = traceId ? `[Destination publish] ${traceId}` : "[Destination publish]"
  console.info(`${trace} Server Action started.`, { pageId, warningOverride: Boolean(override) })
  if (!(await isAdminAuthenticated("content"))) {
    console.warn(`${trace} Server Action rejected: admin authentication failed.`)
    return { ok: false as const, error: "Not authorized." }
  }
  const result = await publishAdminDestinationPage(pageId, override, traceId)
  console.info(`${trace} Server Action completed.`, { ok: result.ok, slug: result.ok ? result.slug : undefined, blockerCount: result.ok ? 0 : result.blockers?.length ?? 0, warningCount: result.ok ? 0 : result.warnings?.length ?? 0 })
  if (result.ok) {
    console.info(`${trace} Refreshing public and admin page caches.`)
    invalidateSafePublishedAirportPageCache()
    invalidateSafePublishedPlacePageCache()
    revalidatePath("/", "layout")
    revalidatePath("/airport-transfers", "layout")
    revalidatePath(`/airport-transfers/${result.slug}`)
    revalidatePath("/destinations", "layout")
    revalidatePath(`/destinations/${result.slug}`)
    revalidatePath("/sitemap.xml")
    revalidatePath("/admin/destination-pages")
    revalidatePath(`/admin/destination-pages/${pageId}`)
    console.info(`${trace} Cache refresh requested.`)
  }
  return result
}

export async function reviewBulkPlacePublishAction(pageIds: string[]) {
  if (!(await isAdminAuthenticated("content"))) return { ok: false as const, error: "Not authorized." }
  const reviews = await Promise.all([...new Set(pageIds)].map((pageId) => reviewAdminDestinationPage(pageId)))
  return { ok: true as const, reviews }
}

export async function bulkPublishPlaceDraftsAction(selections: BulkPublishSelection[]) {
  if (!(await isAdminAuthenticated("content"))) return { ok: false as const, error: "Not authorized." }
  const report = await bulkPublishPlaceDrafts(selections)
  if (report.some((item) => item.status === "published")) {
    invalidateSafePublishedAirportPageCache()
    invalidateSafePublishedPlacePageCache()
    revalidatePath("/", "layout")
    revalidatePath("/airport-transfers", "layout")
    revalidatePath("/destinations", "layout")
    revalidatePath("/sitemap.xml")
    revalidatePath("/admin/destination-pages")
  }
  return { ok: true as const, report }
}

export async function restoreAdminDestinationPageAction(pageId: string) {
  if (!(await isAdminAuthenticated("content"))) return { ok: false as const, error: "Not authorized." }
  const result = await restoreAdminDestinationPage(pageId)
  if (result.ok) {
    invalidateSafePublishedAirportPageCache()
    invalidateSafePublishedPlacePageCache()
    revalidatePath("/admin/destination-pages")
    revalidatePath(`/admin/destination-pages/${pageId}`)
  }
  return result
}

export async function deleteAdminDestinationDraftAction(pageId: string) {
  if (!(await isAdminAuthenticated("content"))) return { ok: false as const, error: "Not authorized." }
  const result = await deleteAdminDestinationDraft(pageId)
  if (result.ok) {
    invalidateSafePublishedAirportPageCache()
    invalidateSafePublishedPlacePageCache()
    revalidatePath("/admin/destination-pages")
    revalidatePath(`/admin/destination-pages/${pageId}`)
  }
  return result
}

export async function archiveAdminDestinationPageAction(pageId: string, replacementSlug: string) {
  if (!(await isAdminAuthenticated("content"))) return { ok: false as const, error: "Not authorized." }
  const result = await archiveAdminDestinationPage(pageId, replacementSlug)
  if (result.ok) {
    invalidateSafePublishedAirportPageCache()
    invalidateSafePublishedPlacePageCache()
    revalidatePath("/", "layout")
    revalidatePath("/airport-transfers", "layout")
    revalidatePath("/destinations", "layout")
    revalidatePath("/sitemap.xml")
    revalidatePath("/admin/destination-pages")
    revalidatePath(`/admin/destination-pages/${pageId}`)
  }
  return result
}

export async function setAdminBookingAvailabilityAction(pageId: string, available: boolean) {
  if (!(await isAdminAuthenticated("content"))) return { ok: false as const, error: "Not authorized." }
  const result = await setAdminBookingAvailability(pageId, available)
  if (result.ok) {
    invalidateSafePublishedAirportPageCache()
    invalidateSafePublishedPlacePageCache()
    revalidatePath("/airport-transfers", "layout")
    revalidatePath(`/airport-transfers/${pageId}`)
    revalidatePath("/destinations", "layout")
    revalidatePath(`/destinations/${pageId}`)
    revalidatePath("/admin/destination-pages")
    revalidatePath(`/admin/destination-pages/${pageId}`)
  }
  return result
}

export async function promoteCoveredLocalityToPlaceAction(input: Parameters<typeof promoteCoveredLocalityToPlace>[0]) {
  if (!(await isAdminAuthenticated("content"))) return { ok: false as const, error: "Not authorized." }
  return promoteCoveredLocalityToPlace(input)
}

export async function getCloudinaryAssetsAction(kind?: CloudinaryImageKind) {
  if (!(await isAdminAuthenticated("content"))) return { ok: false as const, error: "Not authorized." }
  try {
    const [assets, usage] = await Promise.all([listCloudinaryAssets(kind), listCloudinaryAssetUsage()])
    return { ok: true as const, assets, usage: Object.fromEntries(usage) }
  }
  catch { return { ok: false as const, error: "The image library could not be loaded." } }
}

export async function deleteCloudinaryAssetAction(assetId: string, confirmed: boolean) {
  if (!(await isAdminAuthenticated("content"))) return { ok: false as const, error: "Not authorized." }
  const result = await deleteCloudinaryAsset(assetId, confirmed)
  if (result.ok) revalidatePath("/admin/media-library")
  return result
}

export async function requestCloudinaryUploadSignatureAction(kind: CloudinaryImageKind) {
  if (!(await isAdminAuthenticated("content"))) return { ok: false as const, error: "Not authorized." }
  if (kind !== "hero" && kind !== "content") return { ok: false as const, error: "Unsupported image type." }
  const config = getCloudinaryConfig()
  if (!config) return { ok: false as const, error: cloudinaryConfigError() }
  const timestamp = Math.floor(Date.now() / 1000)
  const folder = `${config.uploadFolder}/${kind}`
  return { ok: true as const, cloudName: config.cloudName, apiKey: config.apiKey, timestamp, folder, signature: createCloudinarySignature({ folder, timestamp }, config.apiSecret) }
}

export async function saveCloudinaryAssetAction(input: Omit<CloudinaryAsset, "id" | "uploadedAt" | "resourceType">) {
  if (!(await isAdminAuthenticated("content"))) return { ok: false as const, error: "Not authorized." }
  return saveCloudinaryAsset(input)
}

export interface CreateBookingResult {
  ok: boolean
  reference?: string
  error?: string
}

// Keeps routes reasonable and bounds the per-booking cost of extra Routes API stops.
const MAX_STOPS = 3

/**
 * The customer whose referral link brought this visitor (see ReferralCapture), while the
 * programme is on. A link covers one ride: the first booking made with it uses it up, so
 * later bookings (including a return leg booked alongside) aren't credited. Nobody earns
 * commission on their own rides.
 */
async function takeReferrer(customer: Customer | null, bookingEmail: string): Promise<Customer | null> {
  const store = await cookies()
  const code = store.get(REFERRAL_COOKIE)?.value
  if (!code) return null
  store.delete(REFERRAL_COOKIE)
  if (!(await getStoredReferralSettings()).active) return null
  const referrer = await findCustomerByReferralCode(code)
  if (!referrer || referrer.id === customer?.id || referrer.email === bookingEmail.trim().toLowerCase()) return null
  return referrer
}

/**
 * A referred ride earns its commission when it's marked completed, at the current rate on
 * the final fare. Moving it to any other status withdraws the commission if not yet paid.
 */
async function syncReferralCommission(booking: Booking): Promise<void> {
  if (!booking.referrerCustomerId) return
  if (booking.status !== "completed") return deletePendingReferralCommission(booking.reference)
  const { commissionPercent } = await getStoredReferralSettings()
  await recordReferralCommission(booking.reference, booking.referrerCustomerId, referralCommission(booking.fare, commissionPercent))
}

export async function updateReferralSettingsAction(active: boolean, commissionPercent: number): Promise<{ ok: boolean; error?: string }> {
  if (!(await isAdminAuthenticated("referrals"))) return { ok: false, error: "Not authorized." }
  if (!Number.isFinite(commissionPercent) || commissionPercent <= 0 || commissionPercent > 100) {
    return { ok: false, error: "Enter a commission between 0.01 and 100%." }
  }
  await setReferralSettings(active, Math.round(commissionPercent * 100) / 100)
  revalidatePath("/admin/referrals")
  return { ok: true }
}

/**
 * Records a payout for the owed commissions the admin saw, with the bank-transfer receipt
 * (required). Takes FormData because it carries the file: referrerId, references (JSON
 * array of booking references) and receipt.
 */
export async function markReferrerPaidAction(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const admin = await getAdminUser()
  if (!admin || !(await isAdminAuthenticated("referrals"))) return { ok: false, error: "Not authorized." }
  const referrerId = formData.get("referrerId")
  const receipt = formData.get("receipt")
  let references: unknown
  try { references = JSON.parse(String(formData.get("references"))) } catch { references = null }
  if (typeof referrerId !== "string" || !/^[0-9a-f-]{36}$/i.test(referrerId) || !Array.isArray(references) || references.length === 0 || references.some((reference) => typeof reference !== "string")) {
    return { ok: false, error: "Invalid request." }
  }
  if (!(receipt instanceof File) || receipt.size === 0) return { ok: false, error: "Attach the transfer receipt." }
  if (!(await isAllowedReceipt(receipt))) return { ok: false, error: "The receipt must be a JPG/JPEG image of 200 KB or less." }

  const receiptPath = await uploadReferralReceipt(referrerId, receipt)
  const payout = await recordReferralPayout(referrerId, references, receiptPath, admin.id).catch(async (error) => {
    await removeReferralReceipt(receiptPath)
    throw error
  })
  if (!payout) {
    await removeReferralReceipt(receiptPath)
    return { ok: false, error: "Nothing is owed for these rides any more. Refresh the page." }
  }
  revalidatePath("/admin/referrals")
  return { ok: true }
}

async function buildAndSaveBooking(
  input: NewBookingInput & { addOnIds: string[] },
  options: { extraDiscountPercent?: number; outboundTripReference?: string } = {},
): Promise<CreateBookingResult> {
  // Signed-in customers book under their verified account details, whatever the form sent.
  const customer = await getCustomer()
  // (A Google sign-up has no phone yet: the form asks for it, and it's saved to their profile.)
  if (customer) input = { ...input, customerName: customer.name, email: customer.email, phone: customer.phone || input.phone }
  if (customer && !customer.phone && input.phone?.trim()) await updateCustomerAccount(customer.id, { phone: input.phone.trim() })
  if (!input.customerName?.trim()) return { ok: false, error: "Name is required." }
  if (!input.email?.trim()) return { ok: false, error: "Email is required." }
  if (!input.phone?.trim()) return { ok: false, error: "Phone is required." }
  if (input.paymentMethod !== "card" && input.paymentMethod !== "cash") return { ok: false, error: "Please choose how you'd like to pay." }
  if (!input.vehicleId) return { ok: false, error: "Please complete your trip details." }
  if (!Number.isFinite(input.pickupLat) || !Number.isFinite(input.pickupLng) || !Number.isFinite(input.dropoffLat) || !Number.isFinite(input.dropoffLng)) {
    return { ok: false, error: "Please select both pickup and drop-off locations." }
  }
  if (!input.pickupDate || !input.pickupTime) {
    return { ok: false, error: "Please choose a pickup date and time." }
  }
  const serverToday = new Date().toISOString().slice(0, 10)
  if (input.pickupDate < serverToday) {
    return { ok: false, error: "Pickup date can't be in the past." }
  }
  const stops = (input.stops || []).slice(0, MAX_STOPS)
  if (stops.some((stop) => !stop.address?.trim() || !Number.isFinite(stop.lat) || !Number.isFinite(stop.lng))) {
    return { ok: false, error: "Please select a valid location for each stop." }
  }

  const vehicles = await listVehiclesWithPricing()
  const vehicle = vehicles.find((v) => v.id === input.vehicleId)
  if (!vehicle) return { ok: false, error: "Unknown vehicle." }
  if (input.passengers > vehicle.capacity || input.bags > vehicle.luggage) {
    return { ok: false, error: "Passenger or bag count exceeds this vehicle's capacity." }
  }

  const route = await calculateDrivingRoute(
    { lat: input.pickupLat!, lng: input.pickupLng! },
    { lat: input.dropoffLat!, lng: input.dropoffLng! },
    stops.map((stop) => ({ lat: stop.lat, lng: stop.lng })),
  )
  if (route == null) return { ok: false, error: "Unable to price this trip." }

  const quote = computeFare(vehicle, route.distanceMiles, route.durationMinutes)
  const promotion = await getStoredSitePromotion()
  let vehicleFare = promotion.active ? applyPromotion(quote.fare, promotion.discountPercent) : quote.fare
  // The return-trip discount (if any) stacks on top of the site-wide promotion — same
  // rule promo codes already follow below.
  if (options.extraDiscountPercent) vehicleFare = applyPromotion(vehicleFare, options.extraDiscountPercent)
  const availableAddOns = await listActiveAddOns()
  const selectedIds = new Set(input.addOnIds)
  const addOns = availableAddOns.filter((addOn) => selectedIds.has(addOn.id))
  const addOnsTotal = addOns.reduce((total, addOn) => total + addOn.price, 0)
  // Never trust a client-supplied per-stop price — always the current admin-set rate.
  const stopPricing = await getStoredStopPricing()
  const stopsTotal = stops.length * stopPricing.pricePerStop
  // Flat pass-through cost, so it sits outside every discount, like stops and add-ons.
  const congestionCharge = congestionChargeFor([{ lat: input.pickupLat!, lng: input.pickupLng! }, { lat: input.dropoffLat!, lng: input.dropoffLng! }, ...stops], await listStoredCongestionZones())
  const subtotal = vehicleFare + addOnsTotal + stopsTotal + congestionCharge

  // Never trust a client-supplied discount amount — re-look-up the code and recompute
  // server-side, since it may have been disabled or changed since the customer applied it.
  let discountAmount = 0
  let promoCode: string | undefined
  if (input.promoCode?.trim()) {
    const promo = await findActivePromoCode(input.promoCode)
    if (!promo) return { ok: false, error: "This promo code is no longer valid. Remove it to continue." }
    discountAmount = computeDiscount(subtotal, promo)
    promoCode = promo.code
  }

  const booking: Booking = {
    ...input,
    reference: generateReference(),
    // A card booking is "pending" until Stripe checkout completes; a cash booking has
    // nothing left to collect online, so it's confirmed immediately — the fare is paid
    // to the driver at the end of the journey instead.
    status: input.paymentMethod === "cash" ? "confirmed" : "pending",
    paymentStatus: "unpaid",
    fare: Math.max(0, subtotal - discountAmount),
    distanceMiles: quote.distanceMiles,
    addOns,
    addOnsTotal,
    stops,
    stopsTotal,
    promoCode,
    discountAmount,
    outboundTripReference: options.outboundTripReference,
    createdAt: new Date().toISOString(),
  }

  await saveBooking(booking)
  await linkBookingAccounts(booking.reference, { customerId: customer?.id, referrerId: (await takeReferrer(customer, booking.email))?.id })
  revalidatePath("/admin")

  // Cash bookings are confirmed the moment they're placed — nothing is left to collect
  // online — so the confirmation email goes out now. Card (online) bookings are still
  // "pending" at this point; their confirmation is sent later, only once Stripe reports
  // the payment as successful (see confirmBookingPayment), so a customer never gets a
  // "booking confirmed" email for a payment that failed or was abandoned.
  if (booking.paymentMethod === "cash") {
    // Don't let a slow/failing email provider hold up the booking response —
    // sendBookingNotificationEmails already swallows and logs its own errors.
    sendBookingNotificationEmails(booking).catch((error) => {
      console.error("Unexpected error sending booking emails:", error)
    })
  }

  return { ok: true, reference: booking.reference }
}

export async function createBooking(input: NewBookingInput & { addOnIds: string[] }): Promise<CreateBookingResult> {
  return buildAndSaveBooking(input)
}

/**
 * Books the return leg for an existing (outbound) booking. Route and fare are computed the
 * same way as any other booking — pickup/drop-off are simply reversed by the caller — with
 * the admin-configured return-trip discount (if active) applied on top.
 */
export async function createReturnBooking(
  outboundReference: string,
  input: NewBookingInput & { addOnIds: string[] },
): Promise<CreateBookingResult> {
  const outbound = await findBooking(outboundReference)
  if (!outbound) return { ok: false, error: "Outbound booking not found." }
  if (outbound.outboundTripReference) return { ok: false, error: "Can't attach a return trip to a return trip." }
  if (outbound.returnTripReference) return { ok: false, error: "This booking already has a return trip." }
  // Require the return leg's contact email to match the outbound booking's — the booking
  // flow always sends the same customer's email for both legs, so this is a no-op for
  // legitimate use, but stops a stranger who's merely guessed/obtained someone else's
  // reference from grafting an unrelated (discounted) booking onto that customer's record.
  if (outbound.email.trim().toLowerCase() !== input.email?.trim().toLowerCase()) {
    return { ok: false, error: "Outbound booking not found." }
  }

  const discount = await getStoredReturnTripDiscount()
  const result = await buildAndSaveBooking(input, {
    extraDiscountPercent: discount.active ? discount.discountPercent : 0,
    outboundTripReference: outboundReference,
  })
  if (result.ok && result.reference) {
    await linkReturnTrip(outboundReference, result.reference)
    revalidatePath(`/booking/${outboundReference}`)
  }
  return result
}

export interface StartCheckoutResult {
  ok: boolean
  url?: string
  error?: string
}

export async function startBookingCheckout(
  reference: string,
): Promise<StartCheckoutResult> {
  const normalizedReference = reference.trim().toUpperCase()
  if (!normalizedReference) {
    return { ok: false, error: "Missing booking reference." }
  }

  const booking = await findBooking(normalizedReference)
  if (!booking) {
    return { ok: false, error: "Booking not found." }
  }
  if (booking.paymentStatus === "paid") {
    return { ok: false, error: "This booking is already paid." }
  }
  if (booking.paymentMethod === "cash") {
    return { ok: false, error: "This booking is set to pay cash to the driver." }
  }

  // A return trip is booked as a second, linked booking (see createReturnBooking). When the
  // linked leg is still unpaid too, fold it into this same Stripe session — one charge, one
  // receipt — rather than sending the customer through a second, separate checkout for what
  // they experience as a single booking.
  const linkedReference = booking.returnTripReference || booking.outboundTripReference
  const linkedBooking = linkedReference ? await findBooking(linkedReference) : null
  const combineWithLinked = Boolean(
    linkedBooking && linkedBooking.paymentStatus !== "paid" && linkedBooking.paymentMethod === "card",
  )
  const legs = combineWithLinked && linkedBooking ? [booking, linkedBooking] : [booking]

  try {
    const stripe = getStripeClient()
    const appUrl = await getAppUrl()
    const currency = (process.env.STRIPE_CURRENCY || "usd").toLowerCase()

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: booking.email,
      success_url: `${appUrl}/booking/${booking.reference}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/booking/${booking.reference}?payment=cancelled`,
      payment_method_types: ["card"],
      metadata: {
        bookingReference: booking.reference,
        linkedBookingReference: combineWithLinked && linkedBooking ? linkedBooking.reference : "",
      },
      line_items: legs.map((leg) => ({
        quantity: 1,
        price_data: {
          currency,
          unit_amount: Math.round(leg.fare * 100),
          product_data: {
            name: `Airport transfer ${leg.reference}${leg.outboundTripReference ? " (return leg)" : leg.returnTripReference ? " (outbound leg)" : ""}`,
            description: `Pickup ${leg.pickupDate} ${leg.pickupTime}`,
          },
        },
      })),
    })

    if (!checkoutSession.url) {
      return { ok: false, error: "Unable to create checkout session." }
    }

    return { ok: true, url: checkoutSession.url }
  } catch (error) {
    if (error instanceof Error && error.message === "STRIPE_SECRET_KEY is missing.") {
      return {
        ok: false,
        error: "Payments are not configured. Add STRIPE_SECRET_KEY to the server environment and restart the app.",
      }
    }

    return {
      ok: false,
      error: "Payment is temporarily unavailable. Please try again.",
    }
  }
}

export async function confirmBookingPayment(
  reference: string,
  checkoutSessionId: string,
): Promise<Booking | null> {
  const normalizedReference = reference.trim().toUpperCase()
  if (!normalizedReference || !checkoutSessionId?.trim()) return null

  const booking = await findBooking(normalizedReference)
  if (!booking) return null
  if (booking.paymentStatus === "paid") return booking

  try {
    const stripe = getStripeClient()
    const session = await stripe.checkout.sessions.retrieve(checkoutSessionId)
    if (session.payment_status !== "paid") {
      console.warn(
        `confirmBookingPayment: session ${checkoutSessionId} for ${booking.reference} has payment_status "${session.payment_status}", not "paid" yet — leaving booking pending.`,
      )
      return booking
    }
    if (session.metadata?.bookingReference !== booking.reference) {
      console.error(
        `confirmBookingPayment: session ${checkoutSessionId} metadata.bookingReference "${session.metadata?.bookingReference}" does not match booking ${booking.reference} — refusing to confirm.`,
      )
      return null
    }

    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id

    // A return-trip checkout combines both legs into this one session (see
    // startBookingCheckout) — when that happened, metadata carries the linked leg's
    // reference too, and it still needs marking as paid here, from the same charge.
    const linkedReference = session.metadata?.linkedBookingReference?.trim() || undefined
    const linkedBooking = linkedReference ? await findBooking(linkedReference) : null

    const updated = await markBookingAsPaid(
      booking.reference,
      session.id,
      paymentIntentId,
    )
    const updatedLinked =
      linkedBooking && linkedBooking.paymentStatus !== "paid"
        ? await markBookingAsPaid(linkedBooking.reference, session.id, paymentIntentId)
        : linkedBooking
    // No revalidatePath() here: this function runs during the confirmation page's render
    // (Stripe redirects straight back to it), and Next.js forbids calling revalidatePath
    // during render — it throws "used revalidatePath during render which is unsupported",
    // which was aborting this function before the email below ever ran. It's also unneeded:
    // /admin is `force-dynamic` and this page is inherently dynamic (it reads searchParams),
    // so neither route is ever cached in the first place.

    // Online payment just succeeded — this is the first point a card booking is actually
    // confirmed, so send the "booking confirmed" email now (the early "already paid" return
    // above keeps this from firing again if the customer revisits the success page). This is
    // called from the confirmation page's render, not a long-lived request, so the email send
    // is awaited rather than fired-and-forgotten — otherwise the serverless function can be
    // frozen/torn down right after the page responds, before the email ever goes out.
    if (updated) {
      if (updatedLinked) {
        // One combined charge, one combined confirmation — not two separate
        // "booking confirmed" emails for what the customer paid for as a single trip.
        const [outboundBooking, returnBooking] = updated.outboundTripReference
          ? [updatedLinked, updated]
          : [updated, updatedLinked]
        await sendCombinedBookingConfirmationEmails(outboundBooking, returnBooking).catch((error) => {
          console.error("Unexpected error sending combined booking emails:", error)
        })
      } else {
        await sendBookingNotificationEmails(updated).catch((error) => {
          console.error("Unexpected error sending booking emails:", error)
        })
      }
    }

    return updated
  } catch (error) {
    console.error(`confirmBookingPayment: failed to confirm payment for ${booking.reference}:`, error)
    return booking
  }
}

async function getAppUrl(): Promise<string> {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (configuredUrl) {
    return configuredUrl.replace(/\/+$/, "")
  }

  const requestHeaders = await headers()
  const host =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? ""
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http"

  if (!host) {
    throw new Error("Unable to determine application URL.")
  }

  return `${protocol}://${host}`
}

export async function lookupBooking(reference: string): Promise<Booking | null> {
  if (!reference?.trim()) return null
  return findBooking(reference)
}

export async function getAllBookings(): Promise<Booking[]> {
  // Defense in depth: middleware already gates the /admin route, but this
  // keeps the action itself from leaking data if ever called directly.
  if (!(await isAdminAuthenticated("bookings"))) return []
  return listBookings()
}

export async function updateBookingStatus(
  reference: string,
  status: BookingStatus,
): Promise<Booking | null> {
  if (!(await isAdminAuthenticated("bookings"))) return null
  const updated = await setBookingStatus(reference, status)
  if (updated) await syncReferralCommission(updated)
  revalidatePath("/admin")

  if (updated && status === "completed" && !updated.reviewRequestedAt) {
    const result = await sendReviewRequestEmail(updated)
    if (result.ok) {
      await markReviewRequested(reference)
    } else {
      // Left unmarked on purpose: re-marking the booking "completed" (e.g. after fixing
      // NEXT_PUBLIC_APP_URL/RESEND_API_KEY) will retry the send instead of being stuck forever.
      console.error(`Review request email not sent for ${reference}: ${result.error}`)
    }
  }

  return updated
}

export interface ReviewPageData {
  customerName: string
  alreadySubmitted: boolean
}

/** Public — reachable only via the reference emailed in sendReviewRequestEmail. */
export async function getReviewPageDataAction(reference: string): Promise<ReviewPageData | null> {
  const booking = await findBooking(reference)
  if (!booking) return null
  const existing = await findReviewByBooking(booking.reference)
  return { customerName: booking.customerName, alreadySubmitted: Boolean(existing) }
}

export interface SubmitReviewResult {
  ok: boolean
  error?: string
  googleReviewUrl?: string | null
}

export async function submitReviewAction(reference: string, rating: number, comment: string): Promise<SubmitReviewResult> {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return { ok: false, error: "Please choose a rating from 1 to 5." }

  const booking = await findBooking(reference)
  if (!booking) return { ok: false, error: "We couldn't find that booking." }

  const existing = await findReviewByBooking(booking.reference)
  if (existing) return { ok: false, error: "You've already submitted a review for this trip." }

  const trimmedComment = comment.trim().slice(0, 2000)
  await saveReview({ bookingReference: booking.reference, rating, comment: trimmedComment, customerName: booking.customerName })

  if (rating <= 2) {
    void sendLowRatingAlertEmail(booking, rating, trimmedComment).catch((error) => console.error("Failed to send low rating alert email:", error))
  }

  const googleReviewUrl = rating >= REVIEW_PUBLISH_THRESHOLD ? getGoogleReviewUrl() : null
  return { ok: true, googleReviewUrl }
}

/** Fields support can correct from the admin control panel. */
export interface BookingEditInput {
  pickupAddress: string; pickupLat: number; pickupLng: number
  dropoffAddress: string; dropoffLat: number; dropoffLng: number
  stops: Destination[]
  vehicleId: string
  pickupDate: string; pickupTime: string
  flightNumber: string
  passengers: number
  bags: number
  customerName: string; email: string; phone: string; notes: string
  addOnIds: string[]
  paymentMethod: PaymentMethod
}

export interface UpdateBookingResult {
  ok: boolean
  booking?: Booking
  error?: string
}

/**
 * Lets an admin correct a booking's locations, stops, vehicle, add-ons, or contact details —
 * the fare is always fully recomputed from the current rate card so pricing stays accurate,
 * the same way a fresh booking is priced. The site-wide promotion and return-trip discount are
 * deliberately not re-applied here (they're customer-facing incentives for new bookings, not
 * something a support correction should silently add); an existing promo code is re-validated
 * and recomputed against the new subtotal.
 */
export async function updateBookingAction(reference: string, input: BookingEditInput): Promise<UpdateBookingResult> {
  if (!(await isAdminAuthenticated("bookings"))) return { ok: false, error: "Not authorized." }
  const existing = await findBooking(reference)
  if (!existing) return { ok: false, error: "Booking not found." }

  if (!input.customerName?.trim()) return { ok: false, error: "Name is required." }
  if (!input.email?.trim()) return { ok: false, error: "Email is required." }
  if (!input.phone?.trim()) return { ok: false, error: "Phone is required." }
  if (input.paymentMethod !== "card" && input.paymentMethod !== "cash") return { ok: false, error: "Please choose how the customer is paying." }
  if (!input.vehicleId) return { ok: false, error: "Please choose a vehicle." }
  if (!Number.isFinite(input.pickupLat) || !Number.isFinite(input.pickupLng) || !Number.isFinite(input.dropoffLat) || !Number.isFinite(input.dropoffLng)) {
    return { ok: false, error: "Please select both pickup and drop-off locations." }
  }
  if (!input.pickupDate || !input.pickupTime) return { ok: false, error: "Please choose a pickup date and time." }
  const stops = (input.stops || []).slice(0, MAX_STOPS)
  if (stops.some((stop) => !stop.address?.trim() || !Number.isFinite(stop.lat) || !Number.isFinite(stop.lng))) {
    return { ok: false, error: "Please select a valid location for each stop." }
  }

  const vehicles = await listVehiclesWithPricing()
  const vehicle = vehicles.find((v) => v.id === input.vehicleId)
  if (!vehicle) return { ok: false, error: "Unknown vehicle." }
  if (input.passengers > vehicle.capacity || input.bags > vehicle.luggage) {
    return { ok: false, error: "Passenger or bag count exceeds this vehicle's capacity." }
  }

  const route = await calculateDrivingRoute(
    { lat: input.pickupLat, lng: input.pickupLng },
    { lat: input.dropoffLat, lng: input.dropoffLng },
    stops.map((stop) => ({ lat: stop.lat, lng: stop.lng })),
  )
  if (route == null) return { ok: false, error: "Unable to price this trip." }

  const quote = computeFare(vehicle, route.distanceMiles, route.durationMinutes)
  // Look up by id against every add-on (including disabled ones) so a since-deactivated
  // add-on that's still on this booking keeps its price rather than disappearing.
  const allAddOns = await listAddOns()
  const selectedIds = new Set(input.addOnIds)
  const addOns: BookingAddOn[] = allAddOns.filter((addOn) => selectedIds.has(addOn.id)).map(({ id, name, price }) => ({ id, name, price }))
  const addOnsTotal = addOns.reduce((total, addOn) => total + addOn.price, 0)
  const stopPricing = await getStoredStopPricing()
  const stopsTotal = stops.length * stopPricing.pricePerStop
  const congestionCharge = congestionChargeFor([{ lat: input.pickupLat, lng: input.pickupLng }, { lat: input.dropoffLat, lng: input.dropoffLng }, ...stops], await listStoredCongestionZones())
  const subtotal = quote.fare + addOnsTotal + stopsTotal + congestionCharge

  let discountAmount = 0
  let promoCode = existing.promoCode
  if (promoCode) {
    const promo = await findActivePromoCode(promoCode)
    if (promo) discountAmount = computeDiscount(subtotal, promo)
    else promoCode = undefined
  }

  const updated: Booking = {
    ...existing,
    direction: "custom",
    airportId: "custom",
    pickupAddress: input.pickupAddress, pickupLat: input.pickupLat, pickupLng: input.pickupLng,
    dropoffAddress: input.dropoffAddress, dropoffLat: input.dropoffLat, dropoffLng: input.dropoffLng,
    destinationAddress: input.dropoffAddress, destinationLat: input.dropoffLat, destinationLng: input.dropoffLng,
    vehicleId: input.vehicleId,
    pickupDate: input.pickupDate, pickupTime: input.pickupTime,
    flightNumber: input.flightNumber.trim(), passengers: input.passengers, bags: input.bags,
    customerName: input.customerName.trim(), email: input.email.trim(), phone: input.phone.trim(), notes: input.notes.trim(),
    paymentMethod: input.paymentMethod,
    stops, stopsTotal, addOns, addOnsTotal,
    distanceMiles: route.distanceMiles,
    promoCode, discountAmount,
    fare: Math.max(0, subtotal - discountAmount),
  }

  const saved = await replaceBooking(updated)
  if (!saved) return { ok: false, error: "Could not save these changes." }
  revalidatePath("/admin")
  revalidatePath(`/booking/${saved.reference}`)

  // Don't let a slow/failing email provider hold up the admin's save —
  // sendBookingUpdateEmail already swallows and logs its own errors.
  sendBookingUpdateEmail(saved).catch((error) => {
    console.error("Unexpected error sending booking update email:", error)
  })

  return { ok: true, booking: saved }
}

export interface SendInvoiceResult {
  ok: boolean
  error?: string
}

/** Emails the customer an itemized invoice for a booking, on demand from the admin panel. */
export async function sendInvoiceAction(reference: string): Promise<SendInvoiceResult> {
  if (!(await isAdminAuthenticated("bookings"))) return { ok: false, error: "Not authorized." }
  const booking = await findBooking(reference)
  if (!booking) return { ok: false, error: "Booking not found." }

  const result = await sendInvoiceEmail(booking)
  if (!result.ok) return { ok: false, error: result.error || "Could not send the invoice." }
  return { ok: true }
}

export async function getVehicleFleet(): Promise<VehicleClass[]> {
  return listVehiclesWithPricing()
}

export async function getBookingAddOns(): Promise<BookingAddOn[]> {
  return listActiveAddOns()
}

export async function getAllBookingAddOns() {
  if (!(await isAdminAuthenticated("bookings")) && !(await isAdminAuthenticated("pricing"))) return []
  return listAddOns()
}

export async function upsertBookingAddOn(addOn: { id?: string; name: string; price: number; active: boolean }) {
  if (!(await isAdminAuthenticated("pricing"))) return { ok: false, error: "Not authorized." }
  const name = addOn.name.trim()
  if (!name) return { ok: false, error: "Add-on name is required." }
  if (!Number.isFinite(addOn.price) || addOn.price < 0) return { ok: false, error: "Enter a valid add-on price." }
  const saved = await saveAddOn({ id: addOn.id || crypto.randomUUID(), name, price: addOn.price, active: addOn.active })
  if (!saved) return { ok: false, error: "Could not save the add-on." }
  revalidatePath("/admin"); revalidatePath("/book"); revalidatePath("/")
  return { ok: true, addOn: saved }
}

export async function deleteBookingAddOnAction(id: string): Promise<{ ok: boolean; error?: string }> {
  if (!(await isAdminAuthenticated("pricing"))) return { ok: false, error: "Not authorized." }
  // Re-check server-side rather than trusting the client's view of the add-on's state — only
  // a disabled add-on can be deleted (an active one is still offered on the booking flow).
  const existing = (await listAddOns()).find((addOn) => addOn.id === id)
  if (!existing) return { ok: false, error: "Add-on not found." }
  if (existing.active) return { ok: false, error: "Disable this add-on before deleting it." }
  const deleted = await removeAddOn(id)
  if (!deleted) return { ok: false, error: "Could not delete the add-on." }
  revalidatePath("/admin"); revalidatePath("/book"); revalidatePath("/")
  return { ok: true }
}

export async function getAllPromoCodes(): Promise<PromoCode[]> {
  if (!(await isAdminAuthenticated("pricing"))) return []
  return listPromoCodes()
}

export interface UpsertPromoCodeResult {
  ok: boolean
  promoCode?: PromoCode
  error?: string
}

export async function upsertPromoCodeAction(promo: { code: string; discountType: PromoDiscountType; discountValue: number; active: boolean }): Promise<UpsertPromoCodeResult> {
  if (!(await isAdminAuthenticated("pricing"))) return { ok: false, error: "Not authorized." }
  const code = promo.code.trim().toUpperCase()
  if (!code) return { ok: false, error: "Promo code is required." }
  if (!/^[A-Z0-9_-]+$/.test(code)) return { ok: false, error: "Use letters, numbers, - or _ only." }
  if (!Number.isFinite(promo.discountValue) || promo.discountValue <= 0) return { ok: false, error: "Enter a valid discount value." }
  if (promo.discountType === "percent" && promo.discountValue > 100) return { ok: false, error: "Percentage discount can't exceed 100." }
  const saved = await savePromoCode({ ...promo, code })
  if (!saved) return { ok: false, error: "Could not save the promo code." }
  revalidatePath("/admin")
  return { ok: true, promoCode: saved }
}

export async function deletePromoCodeAction(code: string): Promise<{ ok: boolean; error?: string }> {
  if (!(await isAdminAuthenticated("pricing"))) return { ok: false, error: "Not authorized." }
  // Re-check server-side rather than trusting the client's view of the code's state — only
  // a disabled promo code can be deleted (an active one could still be applied at checkout).
  const existing = (await listPromoCodes()).find((promo) => promo.code === code.trim().toUpperCase())
  if (!existing) return { ok: false, error: "Promo code not found." }
  if (existing.active) return { ok: false, error: "Disable this promo code before deleting it." }
  const deleted = await removePromoCode(code)
  if (!deleted) return { ok: false, error: "Could not delete the promo code." }
  revalidatePath("/admin")
  return { ok: true }
}

export interface PreviewPromoCodeResult {
  ok: boolean
  code?: string
  discountType?: PromoDiscountType
  discountValue?: number
  discountAmount?: number
  error?: string
}

/** Client-side preview only — createBooking always re-validates and recomputes the discount itself. */
export async function previewPromoCode(code: string, subtotal: number): Promise<PreviewPromoCodeResult> {
  if (!code?.trim()) return { ok: false, error: "Enter a promo code." }
  if (!Number.isFinite(subtotal) || subtotal <= 0) return { ok: false, error: "Select a vehicle before applying a promo code." }
  const promo = await findActivePromoCode(code)
  if (!promo) return { ok: false, error: "Invalid or inactive promo code." }
  return { ok: true, code: promo.code, discountType: promo.discountType, discountValue: promo.discountValue, discountAmount: computeDiscount(subtotal, promo) }
}

export async function getSitePromotion(): Promise<SitePromotion> {
  return getStoredSitePromotion()
}

export interface UpdateSitePromotionResult {
  ok: boolean
  promotion?: SitePromotion
  error?: string
}

export async function updateSitePromotionAction(active: boolean, discountPercent: number): Promise<UpdateSitePromotionResult> {
  if (!(await isAdminAuthenticated("pricing"))) return { ok: false, error: "Not authorized." }
  if (!Number.isFinite(discountPercent) || discountPercent < 0 || discountPercent > 100) {
    return { ok: false, error: "Enter a discount percentage between 0 and 100." }
  }
  const promotion = await setSitePromotion(active, discountPercent)
  revalidatePath("/admin"); revalidatePath("/book"); revalidatePath("/")
  return { ok: true, promotion }
}

export async function getReturnTripDiscount(): Promise<ReturnTripDiscount> {
  return getStoredReturnTripDiscount()
}

export interface UpdateReturnTripDiscountResult {
  ok: boolean
  discount?: ReturnTripDiscount
  error?: string
}

export async function updateReturnTripDiscountAction(active: boolean, discountPercent: number): Promise<UpdateReturnTripDiscountResult> {
  if (!(await isAdminAuthenticated("pricing"))) return { ok: false, error: "Not authorized." }
  if (!Number.isFinite(discountPercent) || discountPercent < 0 || discountPercent > 100) {
    return { ok: false, error: "Enter a discount percentage between 0 and 100." }
  }
  const discount = await setReturnTripDiscount(active, discountPercent)
  revalidatePath("/admin"); revalidatePath("/book")
  return { ok: true, discount }
}

export async function getStopPricing(): Promise<StopPricing> {
  return getStoredStopPricing()
}

export interface UpdateStopPricingResult {
  ok: boolean
  pricing?: StopPricing
  error?: string
}

export async function updateStopPricingAction(pricePerStop: number): Promise<UpdateStopPricingResult> {
  if (!(await isAdminAuthenticated("pricing"))) return { ok: false, error: "Not authorized." }
  if (!Number.isFinite(pricePerStop) || pricePerStop < 0) {
    return { ok: false, error: "Enter a valid price per stop." }
  }
  const pricing = await setStopPricing(pricePerStop)
  revalidatePath("/admin"); revalidatePath("/book")
  return { ok: true, pricing }
}

export async function getCongestionZones(): Promise<CongestionZone[]> {
  return listStoredCongestionZones()
}

export interface UpsertCongestionZoneResult {
  ok: boolean
  zone?: CongestionZone
  error?: string
}

// Fee may be negative (a discount zone, e.g. around the company office) or positive (a
// surcharge zone) — unlike stop/add-on pricing, this one is deliberately not clamped to >= 0.
export async function upsertCongestionZoneAction(name: string, fee: number, zone: [number, number][]): Promise<UpsertCongestionZoneResult> {
  if (!(await isAdminAuthenticated("pricing"))) return { ok: false, error: "Not authorized." }
  if (!name.trim()) return { ok: false, error: "Enter a zone name." }
  if (!Number.isFinite(fee)) return { ok: false, error: "Enter a valid fee." }
  if (!Array.isArray(zone) || zone.length < 3 || zone.some((p) => !Array.isArray(p) || p.length !== 2 || !p.every((n) => Number.isFinite(n)))) {
    return { ok: false, error: "The zone needs at least three valid \"lat, lng\" points." }
  }
  const saved = await saveCongestionZone(name, fee, zone.map(([lat, lng]) => [lat, lng]))
  revalidatePath("/admin"); revalidatePath("/book")
  return { ok: true, zone: saved }
}

export async function deleteCongestionZoneAction(name: string): Promise<{ ok: boolean; error?: string }> {
  if (!(await isAdminAuthenticated("pricing"))) return { ok: false, error: "Not authorized." }
  await removeCongestionZone(name)
  revalidatePath("/admin"); revalidatePath("/book")
  return { ok: true }
}

export interface UpdateVehiclePricingResult {
  ok: boolean
  vehicle?: VehicleClass
  error?: string
}

export async function updateVehiclePricing(
  vehicleId: string,
  minFare: number,
  perMileAfter: number,
  perMinuteRate: number,
  longDistanceThresholdMiles: number,
  deadheadPerMile: number,
): Promise<UpdateVehiclePricingResult> {
  if (!(await isAdminAuthenticated("pricing"))) {
    return { ok: false, error: "Not authorized." }
  }
  if (!Number.isFinite(minFare) || minFare < 0) {
    return { ok: false, error: "Minimum fare must be a positive number." }
  }
  if (!Number.isFinite(perMileAfter) || perMileAfter < 0) {
    return { ok: false, error: "Per-mile rate must be a positive number." }
  }
  if (!Number.isFinite(perMinuteRate) || perMinuteRate < 0) {
    return { ok: false, error: "Per-minute rate must be a positive number." }
  }
  // A threshold below the minimum-fare distance would charge deadhead miles that the
  // minimum fare already covers, so the rate would start biting on short trips too.
  if (!Number.isFinite(longDistanceThresholdMiles) || longDistanceThresholdMiles < MIN_DISTANCE_MILES) {
    return { ok: false, error: `Long-distance threshold must be at least ${MIN_DISTANCE_MILES} miles.` }
  }
  if (!Number.isFinite(deadheadPerMile) || deadheadPerMile < 0) {
    return { ok: false, error: "Deadhead rate must be a positive number." }
  }
  const updated = await setVehiclePricing(vehicleId, minFare, perMileAfter, perMinuteRate, longDistanceThresholdMiles, deadheadPerMile)
  if (!updated) return { ok: false, error: "Vehicle not found." }
  revalidatePath("/admin")
  revalidatePath("/")
  revalidatePath("/book")
  return { ok: true, vehicle: updated }
}

export interface DistanceQuoteResult {
  ok: boolean
  distanceMiles?: number
  durationMinutes?: number
  error?: string
}

export async function getDistanceQuote(
  pickup: { lat: number; lng: number },
  dropoff: { lat: number; lng: number },
  stops: { lat: number; lng: number }[] = [],
): Promise<DistanceQuoteResult> {
  try {
    const route = await calculateDrivingRoute(
      pickup,
      dropoff,
      stops,
    )
    if (route == null) {
      return { ok: false, error: "Couldn't find a driving route to that address." }
    }
    return {
      ok: true,
      distanceMiles: Math.round(route.distanceMiles * 10) / 10,
      durationMinutes: route.durationMinutes,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : ""
    if (message === "GOOGLE_MAPS_SERVER_API_KEY is missing.") {
      return {
        ok: false,
        error: "Distance pricing is not configured. Add GOOGLE_MAPS_SERVER_API_KEY on the server.",
      }
    }
    if (message.startsWith("Google Routes API rejected")) {
      return { ok: false, error: message }
    }
    return { ok: false, error: "Distance service is temporarily unavailable." }
  }
}
