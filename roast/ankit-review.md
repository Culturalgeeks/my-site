# Ankit Verma — Growth Marketer Review
**Reviewer:** Ankit Verma, Growth & Conversion Strategist (ex-Razorpay, now works with B2B services, consultants, and knowledge businesses in South and Southeast Asia)
**Focus:** Conversion architecture, SEO, lead generation, traffic-to-enquiry journey

---

## Overall Verdict

**5 / 10 — Beautiful marketing brochure. Zero conversion infrastructure.**

This site reads and looks excellent. If someone sends a warm referral to this URL, the site will hold up. But if the goal is to generate inbound enquiries from people who do not already know Ehtesham — and that has to be part of the goal — this site does almost no work. There is no conversion funnel, no lead capture below the form, no SEO foundation, no social proof that validates the price point, and the only way to "buy the book" is to fill in a contact form.

---

## What Is Working

### The Copy Quality Is High
The hero paragraph — the "wrong container" story — is the kind of content that actually gets shared and remembered. The "Twelve countries. One framework." shorthand in the book section is punchy. The copy is doing more for conversion than the structure is, which is unusual and worth preserving.

### The CTA Band
The three-card structure (Book a Call / Get the Book / Write to Ehtesham) is the right architecture. Three distinct actions with distinct use cases. If those three actions were actually wired up and tracked, this section would be a real conversion engine.

### The Form Itself
Six fields with a dropdown qualifier is smart for a consultancy — it filters intent before the first conversation. The placeholder text in the message field ("the more specific, the more useful our first conversation will be") sets the right expectation and likely increases message quality.

---

## What Is Broken

### The Contact Form Is a Black Hole
When a user submits the form, the message goes nowhere. The form uses a `setTimeout` simulation — there is no actual HTTP submission, no email delivery, no CRM entry. Every single person who fills in this form and clicks "Send Message" receives a success message, but Ehtesham receives nothing.

This is a P0 business-critical failure. If this site goes live as-is and someone fills out the form, **that lead is permanently lost.** Fix this before the site goes live. Formspree (free tier, 50 submissions/month) can be wired in within 20 minutes.

### "Get the Book" Goes to the Contact Form
The book section has two buttons: "Get the Book" and "Request a Preview" — both link to `#contact`. The book CTAs should go to a real purchase link (Amazon/Gumroad/whatever) or a dedicated book landing page, not a general contact form.

If the book is not yet published, be honest about that. A "Notify Me When Available" email capture is more credible than pretending a contact form is a purchase mechanism.

### No Email Capture Below the Contact Form
The site's only lead capture mechanism is a six-field contact form. This is a high-friction ask. The average visitor who is curious but not yet ready to book a call will leave without giving any contact information.

A simple email capture — "Get a chapter from the book" or "Sign up for the CulturalGeeks dispatch" — would capture the mid-funnel visitor and give Ehtesham an email list he can market to. This is the single highest-ROI missing element on the site.

### SEO: No Foundational Work Done
The meta description is present and reasonable. But:

- **No H1/H2 keyword targeting.** The hero H1 is "Decode. Adapt. Transcend." — evocative, but zero search volume. No one is Googling that phrase. The actual search demand is: "India market entry consultant," "intercultural communication training India," "cross-cultural business communication consultant."
- **No schema markup.** A Person schema and a Service schema would help Google understand who this site is about and surface it in relevant results.
- **No Open Graph tags.** When someone shares this URL on LinkedIn (the most likely sharing channel for this audience), the preview will be generic — no image, possibly just the URL. This kills social sharing as a growth channel.
- **Page title is the full name** — "Mohammad Ehteshamul Haque." The name will not be searched by someone who does not already know him. Consider: "CulturalGeeks | India Market Entry & Intercultural Business Consultant."

### No Social Proof Anchoring the Price Point
A senior executive considering a consultancy engagement — likely priced upwards of ₹5–15L for a market entry project — needs multiple validation signals before enquiring. Currently the site has:
- Three placeholder testimonials (no real names)
- Three credentials (strong, but standard for senior consultants)
- A book that has no reviews, ISBN, or publisher listed

What is missing:
- Real client names or company logos (even three logos from companies you have worked with)
- Quantified outcomes ("Helped X company establish operations in Y months")
- Media mentions, podcast appearances, or article bylines
- A number: how many companies, executives, countries

### The Analytics are Not Set Up
There is no Google Analytics, no Google Tag Manager, no Meta Pixel — nothing that would allow Ehtesham to know: where visitors come from, how long they stay, where they drop off, and whether the CG Guide chatbot is being used. Without measurement, there is no optimisation.

### LinkedIn Is Linked But There Is No Reinforcement
The target audience lives on LinkedIn. The site links to Ehtesham's LinkedIn profile in the footer area, but there is no LinkedIn social proof on the page (follower count, post engagement, recent activity signal), no CTA to follow/connect on LinkedIn, and no sharing mechanism for the hero copy or book content.

---

## Conversion Gap Summary

| Gap | Monthly Lead Cost | Fix |
|-----|-------------------|-----|
| Form not connected to email | All current leads lost | Formspree / Resend, 20 min |
| No low-friction email capture | Mid-funnel visitors lost | Email opt-in with book chapter |
| Book CTAs go to contact form | Book buyers confused or lost | Real purchase link or pre-order capture |
| No Open Graph tags | LinkedIn shares look broken | 5 lines of HTML |
| No analytics | Zero visibility into what works | GA4 script, 10 min |
| No schema markup | Invisible to Google | 30 lines of JSON-LD |

---

## One Recommendation If You Do Nothing Else

Wire up the contact form to a real email delivery service before this site goes live. Every day it exists with the fake form is a day that potential clients are submitting their details into a void. This is not a design or copy problem — it is a plumbing problem. Fix it first.
