# Product

<!-- impeccable:product-schema 1 -->

<!-- Written 2026-10-13 from what the project already knows (thread «نظام التسجيل», project memory);
     Eyad to confirm or correct. -->

## Platform

web

## Users

- **Page owners** in Syria and the wider Arab region: small businesses and professionals (doctors,
  lawyers, electricians, teachers), restaurants, shops, car showrooms. Most work from a phone, many
  are building their first web page, and they write and read Arabic (Syrian dialect in the UI).
- **Visitors** of those pages: local customers who search for food, online shopping, technicians and
  cars, order, book appointments and rate.
- **Owners' staff** (restaurant waiters, cashiers, kitchen screens) inside the paid apps.
- **Weelink's own team** (later: the admin panel).

## Product Purpose

Weelink lets anyone make a page for their work in minutes, with Wee AI asking a few questions and
building it, then grows it into a shop, restaurant or showroom with orders, bookings and ratings.
Visitors find these pages through Weelink's own search. Success: an owner publishes a page that
looks professional without a designer, and their customers act on it (call, WhatsApp, order, book).

## Positioning

Built for the Arab region first: Arabic and right-to-left everywhere, Syrian prices (SYP), works
with what is reachable from Syria (no SMS login, payment through an office in Syria), and the four
page types share one editor and one account.

## Operating Context

- Phones first, often slow or unstable connections; desktop for the editor.
- Visitors arrive from search, a QR code or a shared link (name.testweelink.de or the owner's domain).
- Owners manage everything from the admin, opened from their page's navbar or the editor.

## Capabilities and Constraints

- Page types: free page, shop, restaurant, car showroom; paid tiers (free, Pro, kind packages).
- Editor with slides and ready-made slide designs; Wee AI («ابن صفحتي») builds pages with Gemini.
- Bookings with email confirmations and reminders; ratings verified by email code.
- Stack: Vite + React + Tailwind, Firebase, Vercel functions, Resend email.
- Customer pages can use any of the editor's fonts; Weelink's own interface should not depend on them.

## Brand Commitments

- Name: Weelink (wordmark «weelink»), assistant name: Wee AI.
- Language: Arabic, Syrian dialect for UI copy; numbers and prices in SYP.
- The platform's own name must never appear on a customer's published page.

## Evidence on Hand

- No testimonials, customer counts or press yet; do not invent any.
- Photos: Unsplash (via /api/photos) and the unDraw illustrations already in the project.

## Product Principles

1. Arabic-first: every screen is designed in Arabic and RTL, not translated.
2. The owner's page is the hero; Weelink's interface stays out of its way.
3. Phone first, readable on cheap screens and slow networks.
4. One account, one editor, one visual language across all page types.

## Accessibility & Inclusion

Readable Arabic at phone sizes (no text below 12px), enough contrast on photos, touch targets for
thumbs, works with browser zoom.
