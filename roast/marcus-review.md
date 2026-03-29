# Marcus Tan — Product Designer Review
**Reviewer:** Marcus Tan, Lead Product Designer (ex-Figma, now runs a design consultancy in Singapore — specialises in consultant and knowledge-brand sites)
**Focus:** UX, visual hierarchy, interaction design, component behaviour, mobile experience

---

## Overall Verdict

**6.5 / 10 — Visually strong, experientially rough.**

The design has a genuine aesthetic identity, which is rare and worth protecting. The dark editorial palette, the compass background element, the typographic logo — these are intentional choices that work. But the experience of *using* the site has several friction points that a paying client would notice before they ever reach the contact form. The gap between "looks premium" and "functions premium" is where this version falls short.

---

## What Is Working

### The Design System Is Consistent
CSS custom properties are used throughout, spacing is rhythmic, and the font stack (Cormorant + Lora + Josefin Sans) is well-chosen and well-applied. Sections breathe. The service pillar cards are clean and scannable.

### The Book Mockup
The CSS-rendered book cover (with the flag chips for the 12 countries) is a smart design solution given that there is no real cover image yet. It communicates "real book" without being a placeholder rectangle.

### Scroll Reveal Animations
The IntersectionObserver-based fade-ins with staggered delays work well and add a sense of quality to the page load experience. They are not overdone.

### The Hero Compass
As an ambient background element, the SVG compass works — it reinforces the brand metaphor without competing with the headline hierarchy.

---

## What Is Broken

### Navigation: The Logo Is Doing Too Much Work
The SVG logo in the nav renders at 56px height — which is large for a nav. On screens below 1200px, this competes with the nav links for horizontal space and can cause the links to collapse to the hamburger earlier than necessary.

More critically: the SVG relies on Google Fonts loading. If the font does not load (corporate proxies, slow connections, first paint), the "Cultural" text falls back to Georgia/Palatino, which changes the layout metrics of the SVG entirely — the text may overflow or be clipped because the SVG has a fixed viewBox. Test this on a throttled connection.

### The Hero Takes 100vh But Delivers Proportionally Little
The hero occupies the full viewport height with only a headline, two paragraphs, and two buttons — centred, leaving substantial empty space above and below. On a 1440px display, you see a lot of dark navy and not much content.

The scroll indicator ("Scroll") is present, but on mobile, where the section is shorter, the scroll label overlaps with the hero buttons at smaller viewport heights. Test at 375px width.

### No Visual Hierarchy Between CTAs
The site has multiple competing CTAs that are visually equal in weight: "Explore the Work," "Discover the Book," "Schedule a Call," "Get the Book," "Order Now," "Write to Ehtesham." None of them has a clear primary/secondary treatment across sections.

The design convention here is: **one primary action per section, maximum.** Currently the book section has two gold buttons of equal weight ("Get the Book" + "Request a Preview"), the hero has two equal-weight buttons, and the CTA band has three cards all at the same visual level. The user eye does not know where to rest.

### The Contact Form Has No Error State Styling
Field validation messages appear via JavaScript but the error state has no CSS treatment — no red border, no icon, no accessible colour change. The only feedback is text below the button. This is a UX failure point; users who submit an incomplete form will not immediately see *which* field failed.

### Testimonials Section: No Visual Anchoring
The testimonials live in a grid but each card has only text and a tag. There are no visual anchors — no quotation marks large enough to register as a decorative element, no dividers, no subtle background treatment to distinguish the cards from the surrounding section. They read as floating paragraphs. The design of the card does not signal "this is a quote from a real person."

Combined with the credibility issue (no names), the section reads as filler.

### Mobile: The Drawer Has No Close Affordance Inside Itself
The hamburger opens the drawer. Closing the drawer requires clicking a nav link. There is no ✕ button inside the drawer. A user who opens the drawer to explore and then wants to close it without navigating must tap outside — which may not be obvious, especially since the overlay behaviour is not entirely clear on first interaction.

### The Chatbot FAB Is Always Visible
The "CG Guide" floating action button sits above the footer at all times. This is fine, but on mobile, it occupies valuable screen real estate and may obscure content near the footer. More importantly, the chat window appears to have no ARIA focus trap — when opened, focus is not moved into the window, which is both an accessibility failure and a usability issue on mobile where keyboard is not applicable but focus management still matters for screen readers.

### Footer: The Wordmark Is Redundant
The footer renders "Cultural**Geeks**" as text. This is the third place the brand name appears (nav logo, page title, footer). The footer wordmark adds nothing that the copyright notice does not already cover. Replace it with a meaningful link (LinkedIn, or the email address) or remove it.

---

## Component Issues Summary

| Component | Issue | Priority |
|-----------|-------|----------|
| SVG logo | Font-load dependency; may break on slow connections | P0 |
| Contact form | No CSS error states on validation failure | P1 |
| Mobile nav drawer | No close button inside drawer | P1 |
| Hero section | Excessive height on large screens; scroll label overlaps on mobile | P1 |
| Testimonials | No visual treatment; reads as filler | P1 |
| CTA buttons | No consistent primary/secondary hierarchy across sections | P1 |
| Chat FAB | No focus trap; always-visible on mobile | P2 |
| Footer wordmark | Redundant; occupies space without purpose | P2 |

---

## One Recommendation If You Do Nothing Else

Add CSS error states to the contact form fields — `border-color: var(--gold)` on focus is already done; add `border-color: #c0392b` with a `::after` content message on `:invalid` post-submission attempt. This single change moves the form from "looks functional" to "actually trustworthy" in the hands of a prospective client.
