# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Four customer groups, all booking a London airport transfer in advance, often on a phone:

- **Holiday and family travellers**: leisure trips with luggage and children, flying out from home or returning to it.
- **Business travellers**: they want the Executive Car, a car that turns up on time, and repeat bookings.
- **Visitors landing in London**: international arrivals who need meet & greet and a known price before they land.
- **Groups**: 5–8 people who need an MPV or minibus.

Second audience: the internal team working in `/admin`. Roles are super admin, admin, dispatcher (bookings only) and content editor (destination pages and media only). Their job is running bookings, pricing, destination/SEO content, FAQs, referrals and admin users.

## Product Purpose

ONE Airport Taxi books fixed-price, door-to-door transfers to and from the six London airports: Heathrow, Gatwick, Stansted, Luton, London City and Southend. A customer enters a route and time, sees an instant fixed fare, picks a vehicle, pays by card through Stripe Checkout, and receives a confirmation email. Success means the customer books confidently the first time and the driver is there when they arrive.

## Positioning

- **Fixed price, known upfront.** The quoted fare is the fare. There is no meter and no surge.
- **Airport-specialist care as standard.** Every airport pickup includes flight tracking, free waiting time and meet & greet.
- **Price.** The service aims to cost less than the big names for the same journey. No price comparison data is on hand, so future work must not state specific savings or name competitors' prices.

## Operating Context

- The booking flow lives at `/book`. It has map-based route selection (Google Maps Places and Routes), a distance-based quote, vehicle choice, add-ons, promo codes, an optional return leg at a discount, and Stripe hosted checkout.
- Customers can look up a booking at `/track`, leave a review at `/review`, and use accounts at `/account` (email or Google sign-in, settings, referrals).
- Referrals: each verified customer gets a code. Bookings made through their link earn the customer a commission on completed rides. Admins pay commissions outside the app and record the payouts in admin.
- SEO is a core acquisition channel. Airport pages, destination/place pages, and airport FAQs are edited in admin.
- The UI is British English (`en-GB`), prices are in pounds, and the brand's own support address is info@oneairporttaxi.com.

## Capabilities and Constraints

- Vehicle classes are Saloon Car, Executive Car, Estate, MPV (4 and 6 seats) and Minibus (8 seats). Each has a minimum fare covering the first 10 miles, then a per-mile rate. The source of truth is `lib/fleet.ts`, and pricing in Supabase can be edited from admin.
- Congestion zones, stop pricing, return-trip discounts, promo codes and site promotions are all managed in admin.
- Stack: Next.js (App Router), Supabase, Stripe, Resend and Cloudinary. The site is light theme only.
- Admin sections are restricted by role (`lib/admin-roles.ts`). New admin surfaces must respect those roles.

## Brand Commitments

- The name is **ONE Airport Taxi**, with "ONE" in capitals. The logo mark is `public/brand/logo-mark.png`.
- Voice, as it appears in the current copy: calm, reassuring and plain-spoken. It talks about getting rid of travel uncertainty ("One less thing to think about", "No last-minute surprises"), not about luxury.

## Evidence on Hand

- Vehicle photos are in `public/vehicles/`. Airport imagery is in `public/airport-transfers/` (one image per airport, a hero image and a fleet guidance image). The main hero image is `public/hero-airport-transfer.png`.
- Service facts are backed by the code: flight tracking, free 60-minute wait on airport pickups, meet & greet, and child seats on request.
- **Testimonials are placeholders.** The three homepage reviews (Sophie M., Daniel K., Priya S.) are not from real customers. Never present them or any invented review, rating, customer count or press mention as genuine. Real reviews come in through `/review`.
- There is no price comparison data, no licensing or accreditation claims, and no trip-volume figures. Don't invent any of these.

## Product Principles

1. **The price is the promise.** Show the fixed fare early and clearly, and never let a later step contradict it.
2. **Reduce travel anxiety.** Every surface should answer "will someone be there, where, and for how much?"
3. **Mobile-first booking.** Customers book on phones, often in transit. The flow must work one-handed on a small screen.
4. **Standard, not upsold.** Flight tracking, waiting time and meet & greet are part of the fare, not premium extras.
5. **Admin is for operators under time pressure.** Dispatchers and editors need speed and clarity over decoration.
