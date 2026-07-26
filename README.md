# airport-taxi-booking-app

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

## Learn More

To learn more, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [v0 Documentation](https://v0.app/docs) - learn about v0 and how to use it.
