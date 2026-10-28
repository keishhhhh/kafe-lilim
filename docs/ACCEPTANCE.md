# Replacing demonstration branding

The initial database is seeded by `prisma/seed.ts`. Every demo product description begins with `[Sample menu]`, and all seeded prices are sample amounts. Staff can update them at `/staff/menu`.

Change logo URL, café name, homepage tagline and hero photo, business hours, contact email/phone, store address, optional social URL, closure dates, and pickup instructions at `/staff/settings`. The café cannot enable online orders while the sample location or email remains configured.

Seed photographs currently use public `images.unsplash.com` image URLs commonly provided under Unsplash's freely usable license. Review license and image owner rights before a commercial launch, maintain credits as appropriate, and replace with approved first-party photographs using the product image upload feature. Update `app/page.tsx` and fallback image URLs in `components/customer/*.tsx` when rebranding. Replace PWA and favicon assets (`public/icon.svg`, `public/manifest.webmanifest`) with approved licensed assets.

The privacy notice and terms under `/privacy` and `/terms` are drafts, not legal attestations.
