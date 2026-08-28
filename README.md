# airport-taxi-booking-app

## Supabase database setup

1. Create a Supabase project, then run **every** SQL file in `supabase/migrations/` in filename order in its SQL Editor. If the project already exists, run every migration added after your last setup—not only the custom-route migration. In particular, the booking add-ons, promo codes, and site promotion features require the `20260828000001`, `20260828000002`, and `20260828000003` migrations. Missing one of these tables makes Supabase return a 404 for that feature.
2. Copy `.env.example` to `.env.local`, and set `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from the project's API settings.
3. Restart the development server.

Bookings and vehicle pricing are now stored in Supabase. The service-role key is used only in server-side code; never expose it to the browser or commit it to git.

## Google Maps route pricing

The map picker and the driving-distance quote use separate Google Maps APIs. Set both keys in `.env.local` and restart the server:

```bash
# Maps JavaScript API + Places API (New); restrict this key to your site URL.
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_browser_key

# Routes API; keep this server-only and restrict it to the server IP in production.
GOOGLE_MAPS_SERVER_API_KEY=your_server_key
```

Enable **Maps JavaScript API**, **Places API (New)**, and **Routes API** in the same Google Cloud project with billing enabled. A working map only confirms the browser key; without the server Routes key, the app cannot calculate a driving distance or distance-based fare.

This is a [Next.js](https://nextjs.org) project bootstrapped with [v0](https://v0.app).

[Continue working on v0 →](https://v0.app/chat/projects/prj_X2Mpp5N4XB3AAQorNWs0Vgqky4sV)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Stripe Card Payments (Hosted Checkout)

This app uses Stripe Checkout for card payments. Customers are redirected to Stripe's secure hosted page, then returned to the booking page.

### 1) Create a Stripe account

1. Go to [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
2. Complete account verification
3. Open **Developers -> API keys**
4. Copy:
	- **Publishable key** (starts with `pk_test_...`)
	- **Secret key** (starts with `sk_test_...`)

### 2) Configure environment variables

Create a `.env.local` file in the project root:

```bash
STRIPE_SECRET_KEY=sk_test_your_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
STRIPE_CURRENCY=usd
```

Notes:

- `STRIPE_SECRET_KEY` must stay server-side only.
- `NEXT_PUBLIC_APP_URL` should match the exact public URL where the app runs.
- `STRIPE_CURRENCY` is optional and defaults to `usd`.

### 3) Install dependencies

If Stripe is not installed yet, run one of:

```bash
npm install
# or
pnpm install
```

### 4) Test the flow

1. Create a booking from `/book`
2. On the booking page, click **Pay securely**
3. Complete payment in Stripe Checkout using a test card:
	- Card number: `4242 4242 4242 4242`
	- Any future expiry date
	- Any 3-digit CVC
	- Any ZIP/postal code

After success, Stripe redirects back to the booking page and the booking is marked as paid/confirmed.

## Booking Confirmation Emails

When a booking is created, a confirmation email is sent to the customer and a notification email is sent to support staff. Emails are sent via [Resend](https://resend.com).

### 1) Create a Resend account and API key

1. Go to [https://resend.com](https://resend.com) and sign up
2. Open **API Keys** and create a new key
3. To send from your own address (e.g. `info@oneairporttaxi.com`), go to **Domains → Add Domain**, enter `oneairporttaxi.com`, and add the SPF/DKIM (and DMARC) DNS records Resend gives you at your domain registrar. Sending from that address won't work until the domain shows as **Verified** in Resend.

### 2) Configure environment variables

Add to `.env.local`:

```bash
RESEND_API_KEY=re_your_key
EMAIL_FROM="One Airport Taxi <info@oneairporttaxi.com>"
SUPPORT_EMAIL=info@oneairporttaxi.com
```

Notes:

- `RESEND_API_KEY` must stay server-side only.
- `EMAIL_FROM` must be an address on a domain verified with Resend. Until `oneairporttaxi.com` is verified, use the shared `onboarding@resend.dev` test address instead so emails still send.
- `SUPPORT_EMAIL` is where the new-booking notification is sent. If unset, only the customer email is sent.
- If `RESEND_API_KEY` is unset, booking creation still succeeds — emails are simply skipped (a warning is logged).

## Learn More

To learn more, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [v0 Documentation](https://v0.app/docs) - learn about v0 and how to use it.
