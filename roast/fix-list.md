# CulturalGeeks Site — Prioritised Fix List
**Based on:** 5-person expert panel review (Shreya / Marcus / Ankit / Meera / Rohit)
**Date:** March 2026
**Principle:** Fix what loses you money first. Polish what wins you trust second. Add what scales you third.

---

## P0 — Fix Before Launch (Revenue & Trust Failures)

These issues mean the site is losing leads, destroying credibility, or misleading visitors right now. Do not launch without addressing these.

### P0-1: Contact Form Has No Real Backend
**What:** The form uses a `setTimeout` fake submission. Every enquiry submitted returns a success message but delivers nothing.
**Impact:** Every lead is permanently lost. This is a revenue failure.
**Fix:** Integrate Formspree (free, 50 submissions/month) or Resend.
```html
<!-- Replace form action to: -->
<form action="https://formspree.io/f/YOUR_FORM_ID" method="POST">
```
Or use Resend + a Vercel serverless function for a fully branded solution.
**Effort:** 20–30 minutes.

### P0-2: "Get the Book" CTAs Lead to the Contact Form
**What:** "Get the Book" and "Request a Preview" and "Order Now" all link to `#contact`. The book appears to not be published. Visitors clicking to buy are confused and may leave.
**Impact:** Trust damage; misleads potential book buyers.
**Fix (Option A):** Replace buttons with "Notify Me When Available" + email input that goes to a Mailchimp/ConvertKit list.
**Fix (Option B):** Add a note "Coming [Q3 2026]" and a waitlist form inline in the book section.
**Effort:** 1–2 hours.

### P0-3: No Photograph of Ehtesham
**What:** There is no headshot anywhere on the site. This is a personal advisory brand.
**Impact:** Major trust deficit for senior executive prospects evaluating a long-term advisor.
**Fix:** Add a professional photograph to the About section — ideally full-width on the left column, replacing the timeline's current standalone position.
**Effort:** Design: 1 hour once photo is provided. Photo itself is a prerequisite.

### P0-4: Testimonials Are Anonymous and Unverifiable
**What:** All three testimonials use generic titles ("Senior Vice President, German Industrial Equipment Firm") with no names, no company, and copy that reads as self-authored.
**Impact:** Actively damages credibility with sophisticated buyers. Worse than no testimonials.
**Fix (Preferred):** Replace with real testimonials — first name + last initial + company sector + specific outcome. Even one real testimonial with a real name is worth more than three polished anonymous ones.
**Fix (Fallback):** Remove the testimonials section entirely until you have real quotes. Replace with a simple "Trusted by professionals in [list of industries/countries]" or a logo bar if you have permissions.
**Effort:** Content collection: days/weeks. Implementation: 1 hour.

---

## P1 — Fix in First Two Weeks (Conversion & Credibility Gaps)

These do not break the site, but they leave significant value on the table and will be noticed by the target audience.

### P1-1: No Open Graph / Social Sharing Tags
**What:** When someone shares the URL on LinkedIn (the primary channel for this audience), the preview card will be missing an image, may show the wrong title, and will look unpolished.
**Impact:** LinkedIn sharing is likely the main organic growth channel. Broken previews halve share value.
**Fix:** Add to `<head>`:
```html
<meta property="og:title" content="CulturalGeeks — Intercultural Business Consultant & Author" />
<meta property="og:description" content="Advisory for senior executives and companies navigating cultural complexity in Asia. By Mohammad Ehteshamul Haque." />
<meta property="og:image" content="https://yourdomain.com/og-image.jpg" />
<meta property="og:url" content="https://culturalgeeks.com" />
<meta name="twitter:card" content="summary_large_image" />
```
**Effort:** 30 minutes (plus creating a 1200×630 OG image).

### P1-2: No Analytics
**What:** No Google Analytics, GA4, or any measurement tool. Zero visibility into traffic, engagement, or conversion.
**Impact:** Cannot optimise what you cannot measure. Cannot demonstrate traction to investors or partners.
**Fix:** Add GA4 tracking snippet before `</head>`. Set up events for: form submission, CTA clicks, chatbot open.
**Effort:** 15 minutes.

### P1-3: Contact Form Validation Has No Visual Error States
**What:** Form fields have no CSS error styling when validation fails. Error feedback is text-only below the submit button.
**Impact:** Users do not know which field is wrong; may abandon the form.
**Fix:**
```css
.field input:invalid:not(:placeholder-shown),
.field select:invalid:not([value=""]),
.field textarea:invalid:not(:placeholder-shown) {
  border-color: #c0392b;
  box-shadow: 0 0 0 2px rgba(192,57,43,0.2);
}
```
Add individual field error messages using `setCustomValidity()` in the form JS.
**Effort:** 1 hour.

### P1-4: Mobile Nav Drawer Has No Close Button
**What:** The mobile drawer can only be closed by clicking a link. There is no ✕ button inside the drawer.
**Impact:** Users who open the drawer to explore, then decide not to navigate, are stuck.
**Fix:** Add a close button inside the drawer:
```html
<button onclick="closeDrawer()" aria-label="Close menu" class="drawer__close">&#x2715;</button>
```
**Effort:** 30 minutes.

### P1-5: Services Section Has No Format or Scope Signals
**What:** Each service describes *what* it is but not *what engagement looks like*. A prospective client cannot self-qualify without a discovery call.
**Impact:** Increases friction; every moderately interested visitor must book a call just to find out if it is appropriate.
**Fix:** Add one sentence of format context per service pillar, e.g.:
- Leadership Branding: *"Typically delivered as a 6–12 week retained engagement."*
- India Market Entry: *"Project-based advisory or retained, typically 3–6 months."*
- Intercultural Training: *"Half-day and full-day workshop formats for leadership teams of 8–25."*
**Effort:** 30 minutes.

### P1-6: No Low-Friction Email Capture
**What:** The only lead capture is a 6-field contact form. Mid-funnel visitors who are curious but not ready to enquire have no way to stay connected.
**Impact:** Losing the middle of the funnel entirely.
**Fix:** Add a minimal email capture to the footer or between the testimonials and CTA band:
```
"Get a chapter from When Culture Collides with Language — practical frameworks for your most important market."
[Email field] [Get It]
```
Delivers a real chapter from the book; builds an email list for launch.
**Effort:** 2 hours (design + Mailchimp/ConvertKit integration).

### P1-7: Hero Section Height and Mobile Overlap
**What:** On large screens, the hero is padded to 100vh but the content does not fill it. On small screens (<400px), the scroll label may overlap with the CTA buttons.
**Fix:** Change `min-height: 100vh` to `min-height: 85vh`. Add `padding-bottom: 80px` to the hero content wrapper to ensure the scroll label never overlaps.
**Effort:** 15 minutes.

---

## P2 — Next Iteration (Polish, SEO, Scale)

These are improvements that matter at scale or for long-term growth. They are not urgent but will compound over time.

### P2-1: SEO — Page Title and Meta Strategy
**Current title:** "CulturalGeeks — Mohammad Ehteshamul Haque"
**Better:** "CulturalGeeks | India Market Entry & Intercultural Business Consultant — Ehtesham"
Add keyword-targeted H2s: "India Market Entry Advisory," "Intercultural Communication Training," rather than just conceptual labels.

### P2-2: Schema Markup
Add `Person` schema for Ehtesham and `Service` schema for each pillar. Helps Google understand the business and surface it in relevant searches.

### P2-3: Add Traction Signals
Client logos (with permission), engagement count, countries served, or company-types served. Even "Trusted by professionals from [Industry A], [Industry B], and [Industry C]" is better than nothing.

### P2-4: Book Section — Real Content
Once available: ISBN, publisher, publication date, table of contents, one downloadable sample chapter. The book is the top of the funnel and the primary credibility signal. It deserves a full treatment.

### P2-5: CG Guide Chatbot — Sharper Opening Message
The chatbot's first message should demonstrate expertise immediately, not just offer generic help. Suggest: *"Hello — I'm CG Guide. I can help you understand the specific cultural dynamics affecting your market, team, or leadership brand. Which region is your most pressing context right now?"* This signals depth and prompts a useful answer.

### P2-6: SVG Logo — Font-Load Resilience
The inline SVG logo depends on Google Fonts loading. Add `font-display: swap` and test the fallback rendering (Georgia + Arial) at slower connection speeds. If the fallback looks acceptable, no further action. If it breaks the layout, switch the logo to a preloaded WOFF2 or a static SVG with outlined paths.

### P2-7: Footer — Replace Wordmark With a Useful Link
The "Cultural**Geeks**" CSS footer wordmark is redundant. Replace with the email address (`meh@mehaque.com`) and the LinkedIn link — more useful, less decorative filler.

---

## Summary Table

| ID | Issue | Priority | Effort | Category |
|----|-------|----------|--------|----------|
| P0-1 | Form not connected to email | **P0** | 30 min | Revenue |
| P0-2 | Book CTAs mislead (not published) | **P0** | 2 hr | Trust |
| P0-3 | No headshot | **P0** | 1 hr + photo | Trust |
| P0-4 | Fake testimonials | **P0** | Days/weeks | Trust |
| P1-1 | No Open Graph tags | P1 | 30 min | Growth |
| P1-2 | No analytics | P1 | 15 min | Growth |
| P1-3 | No CSS form error states | P1 | 1 hr | UX |
| P1-4 | No close button in mobile drawer | P1 | 30 min | UX |
| P1-5 | No engagement format in services | P1 | 30 min | Conversion |
| P1-6 | No low-friction email capture | P1 | 2 hr | Growth |
| P1-7 | Hero height / mobile overlap | P1 | 15 min | UX |
| P2-1 | SEO title and meta strategy | P2 | 1 hr | SEO |
| P2-2 | Schema markup | P2 | 1 hr | SEO |
| P2-3 | Traction signals | P2 | Variable | Trust |
| P2-4 | Book section — real content | P2 | Variable | Trust |
| P2-5 | Chatbot opening message | P2 | 30 min | Product |
| P2-6 | SVG logo font resilience | P2 | 1 hr | Technical |
| P2-7 | Footer wordmark removal | P2 | 15 min | UX |

---

## What To Do Tomorrow Morning

1. Connect the contact form to Formspree. 30 minutes. Do it first.
2. Add `og:image`, `og:title`, `og:description` tags to `<head>`. 30 minutes.
3. Add GA4. 15 minutes.
4. Update book CTAs to reflect actual book status (coming soon / waitlist). 1 hour.

Those four changes require less than three hours total and eliminate the most damaging failures on the site. Everything else is an improvement. These are a correction.
