// ============================================================================
// AGENTIC PROPOSAL ENGINE
// ============================================================================
// This serverless function is an AI AGENT — not a script.
// You give Claude tools and a goal. Claude decides what to do.
//
// Flow: Visitor completes intake chat → this function receives the conversation
//       → Claude writes a proposal, renders a PDF, emails it, and alerts you
//       → All autonomously, in 2-3 turns
//
// Tools: 3 core (render PDF, send email, alert owner)
//        + 1 optional (store lead in Supabase — enabled when env vars present)
//
// Works with: Express (local dev via server.js) and Vercel (production)
// ============================================================================

const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

// ── Tool definitions for Claude ─────────────────────────────────────────────
// These are the "hands" Claude can use. Claude decides WHEN and HOW to use them.

const CORE_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'render_proposal_pdf',
      description: 'Renders a branded proposal PDF. Returns base64-encoded PDF data.',
      parameters: {
        type: 'object',
        properties: {
          company_name: { type: 'string', description: 'The prospect company name' },
          contact_name: { type: 'string', description: 'The prospect contact name' },
          sections: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                heading: { type: 'string' },
                body: { type: 'string' },
              },
              required: ['heading', 'body'],
            },
            description: 'Proposal sections, each with a heading and body text',
          },
        },
        required: ['company_name', 'contact_name', 'sections'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'send_email',
      description: 'Sends an email to the prospect with optional PDF attachment.',
      parameters: {
        type: 'object',
        properties: {
          to: { type: 'string', description: 'Recipient email address' },
          subject: { type: 'string', description: 'Email subject line' },
          body: { type: 'string', description: 'Email body text (plain text)' },
          attach_pdf: { type: 'boolean', description: 'Whether to attach the proposal PDF' },
        },
        required: ['to', 'subject', 'body'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'alert_owner',
      description: 'Sends a Telegram alert to the owner with lead summary and proposal PDF.',
      parameters: {
        type: 'object',
        properties: {
          message: { type: 'string', description: 'Alert message text including lead score (HIGH/MEDIUM/LOW)' },
        },
        required: ['message'],
      },
    },
  },
];

// Optional tool — only available if Supabase is configured (Power Up: Lead Storage)
const STORE_LEAD_TOOL = {
  type: 'function',
  function: {
    name: 'store_lead',
    description: 'Stores the lead in the CRM database with score and conversation data.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Contact name' },
        company: { type: 'string', description: 'Company name' },
        email: { type: 'string', description: 'Contact email' },
        industry: { type: 'string', description: 'Company industry' },
        challenge: { type: 'string', description: 'Their main challenge (1-2 sentences)' },
        budget: { type: 'string', description: 'Budget range mentioned' },
        score: { type: 'string', enum: ['HIGH', 'MEDIUM', 'LOW'], description: 'Lead score based on triage rules' },
        status: { type: 'string', description: 'Lead status, e.g. proposal_sent' },
      },
      required: ['name', 'company', 'email', 'score', 'status'],
    },
  },
};

// Build tools list — Supabase tool is included only when configured
function getTools() {
  const tools = [...CORE_TOOLS];
  if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
    tools.push(STORE_LEAD_TOOL);
  }
  return tools;
}

// ── PDF text sanitizer ──────────────────────────────────────────────────────
// pdf-lib standard fonts only support WinAnsi encoding (basic ASCII).
// AI-generated text WILL contain characters that crash PDF rendering.
// This function MUST run on ALL text before any drawText() call.

function sanitizeForPdf(text) {
  if (!text) return '';
  return text
    // Currency symbols → text equivalents
    .replace(/₹/g, 'INR ')
    .replace(/€/g, 'EUR ')
    .replace(/£/g, 'GBP ')
    // Dashes → hyphen
    .replace(/[\u2013\u2014\u2015]/g, '-')
    // Curly quotes → straight quotes
    .replace(/[\u2018\u2019\u201A]/g, "'")
    .replace(/[\u201C\u201D\u201E]/g, '"')
    .replace(/[\u2039\u203A]/g, "'")
    .replace(/[\u00AB\u00BB]/g, '"')
    // Ellipsis → three dots
    .replace(/\u2026/g, '...')
    // Special spaces → regular space
    .replace(/[\u00A0\u2002\u2003\u2007\u202F]/g, ' ')
    // Bullets and symbols → ASCII equivalents
    .replace(/[\u2022\u2023\u25E6\u2043]/g, '-')
    .replace(/\u2713/g, '[x]')
    .replace(/\u2717/g, '[ ]')
    .replace(/\u00D7/g, 'x')
    .replace(/\u2192/g, '->')
    .replace(/\u2190/g, '<-')
    .replace(/\u2264/g, '<=')
    .replace(/\u2265/g, '>=')
    // Catch-all: remove anything outside printable ASCII + newlines/tabs
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '');
}

// ── Tool implementations ────────────────────────────────────────────────────

let proposalPdfBase64 = null; // Stored in memory for the email attachment step

async function renderProposalPdf({ company_name, contact_name, sections }) {
  // Sanitize ALL text before rendering
  company_name = sanitizeForPdf(company_name);
  contact_name = sanitizeForPdf(contact_name);
  sections = sections.map(s => ({
    heading: sanitizeForPdf(s.heading),
    body: sanitizeForPdf(s.body),
  }));

  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  // CulturalGeeks brand colors
  const brandPrimary = rgb(0.05, 0.08, 0.19);   // #0D1430 — dark navy
  const brandAccent  = rgb(0.75, 0.56, 0.19);   // #C09030 — gold
  const black = rgb(0.1, 0.1, 0.1);
  const gray = rgb(0.35, 0.35, 0.35);

  // ── Cover page ──
  const cover = pdf.addPage([612, 792]);
  // Header bar
  cover.drawRectangle({ x: 0, y: 692, width: 612, height: 100, color: brandPrimary });
  cover.drawText('Mohammad Ehteshamul Haque', {
    x: 50, y: 732, size: 22, font: fontBold, color: rgb(1, 1, 1),
  });
  cover.drawText('CulturalGeeks  |  Intercultural Business Advisor', {
    x: 50, y: 710, size: 12, font, color: rgb(0.8, 0.8, 0.8),
  });
  // Proposal title
  cover.drawText('PROPOSAL', {
    x: 50, y: 600, size: 36, font: fontBold, color: brandPrimary,
  });
  cover.drawText(`Prepared for ${contact_name}`, {
    x: 50, y: 565, size: 16, font, color: black,
  });
  cover.drawText(company_name, {
    x: 50, y: 542, size: 14, font, color: gray,
  });
  cover.drawText(
    new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }),
    { x: 50, y: 510, size: 12, font, color: gray }
  );

  // ── Content pages ──
  let y = 720;
  let page = pdf.addPage([612, 792]);
  const maxWidth = 500;

  // Helper: draw a line of text, adding a new page if needed
  function drawLine(text, options) {
    if (y < 60) { page = pdf.addPage([612, 792]); y = 720; }
    page.drawText(text, { x: 50, y, ...options });
    y -= options.lineHeight || 18;
  }

  for (const section of sections) {
    if (y < 120) {
      page = pdf.addPage([612, 792]);
      y = 720;
    }

    // Section heading with accent line above
    page.drawLine({
      start: { x: 50, y: y + 20 }, end: { x: 120, y: y + 20 },
      thickness: 2, color: brandAccent,
    });
    drawLine(section.heading, { size: 16, font: fontBold, color: brandPrimary, lineHeight: 28 });

    // Section body — split on newlines first, then word-wrap each paragraph
    const paragraphs = section.body.split('\n');
    for (const paragraph of paragraphs) {
      if (paragraph.trim() === '') {
        y -= 10; // blank line spacing
        continue;
      }
      const words = paragraph.split(' ');
      let line = '';
      for (const word of words) {
        const testLine = line ? `${line} ${word}` : word;
        const width = font.widthOfTextAtSize(testLine, 11);
        if (width > maxWidth && line) {
          drawLine(line, { size: 11, font, color: black });
          line = word;
        } else {
          line = testLine;
        }
      }
      if (line) {
        drawLine(line, { size: 11, font, color: black });
      }
    }
    y -= 20; // space between sections
  }

  // ── Footer on last page ──
  const lastPage = pdf.getPages()[pdf.getPageCount() - 1];
  lastPage.drawText('meh@mehaque.com  |  culturalgeeks.com', {
    x: 50, y: 30, size: 9, font, color: gray,
  });

  const pdfBytes = await pdf.save();
  proposalPdfBase64 = Buffer.from(pdfBytes).toString('base64');
  return { success: true, pages: pdf.getPageCount(), size_kb: Math.round(pdfBytes.length / 1024) };
}

async function sendEmail({ to, subject, body, attach_pdf }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { success: false, error: 'RESEND_API_KEY not configured' };

  const payload = {
    // Resend free tier requires onboarding@resend.dev as sender domain
    from: 'Ehtesham Haque <onboarding@resend.dev>',
    to,
    subject,
    text: body,
  };

  if (attach_pdf && proposalPdfBase64) {
    payload.attachments = [{
      filename: 'proposal.pdf',
      content: proposalPdfBase64,
    }];
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('Resend error:', err);
    return { success: false, error: `Resend API error: ${res.status}` };
  }

  const data = await res.json();
  return { success: true, email_id: data.id };
}

async function storeLead(leadData) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_KEY;
  if (!url || !key) return { success: false, error: 'Supabase not configured' };

  // Fields match the leads table schema:
  // name, company, email, industry, challenge, budget, score, status
  // conversation_transcript and created_at are handled separately
  const row = {
    name: leadData.name || null,
    company: leadData.company || null,
    email: leadData.email || null,
    industry: leadData.industry || null,
    challenge: leadData.challenge || null,
    budget: leadData.budget || null,
    score: leadData.score || null,
    status: leadData.status || 'proposal_sent',
  };

  const res = await fetch(`${url}/rest/v1/leads`, {
    method: 'POST',
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify(row),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('Supabase error:', err);
    return { success: false, error: `Supabase error: ${res.status}` };
  }

  return { success: true };
}

async function alertOwner({ message }) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!botToken || !chatId) return { success: false, error: 'Telegram not configured' };

  // Send text alert
  const textRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: message }),
  });

  if (!textRes.ok) {
    const err = await textRes.text();
    console.error('Telegram error:', err);
    return { success: false, error: `Telegram error: ${textRes.status}` };
  }

  // Send proposal PDF if available
  if (proposalPdfBase64) {
    const pdfBuffer = Buffer.from(proposalPdfBase64, 'base64');
    const formData = new FormData();
    formData.append('chat_id', chatId);
    formData.append('document', new Blob([pdfBuffer], { type: 'application/pdf' }), 'proposal.pdf');
    formData.append('caption', 'Proposal PDF attached');

    await fetch(`https://api.telegram.org/bot${botToken}/sendDocument`, {
      method: 'POST',
      body: formData,
    });
  }

  return { success: true };
}

// ── Tool dispatcher ─────────────────────────────────────────────────────────

async function executeTool(name, args) {
  switch (name) {
    case 'render_proposal_pdf': return renderProposalPdf(args);
    case 'send_email':          return sendEmail(args);
    case 'store_lead':          return storeLead(args);
    case 'alert_owner':         return alertOwner(args);
    default:                    return { error: `Unknown tool: ${name}` };
  }
}

// ── Agent system prompt ─────────────────────────────────────────────────────

const AGENT_SYSTEM_PROMPT = `You are an AI agent writing and delivering proposals on behalf of Mohammad Ehteshamul Haque (Ehtesham), founder of CulturalGeeks.

You have received intake data from a website visitor. Your job:
1. Write a personalised proposal in Ehtesham's voice
2. Score the lead HIGH, MEDIUM, or LOW using the triage rules below
3. Use your tools to render the proposal as a PDF, email it to the visitor, store the lead (if store_lead is available), and alert Ehtesham on Telegram

## IDENTITY

Mohammad Ehteshamul Haque. Director for Asia Pacific at Digital Control Inc. (USA), overseeing operations across Delhi, Shanghai, and Manila. Career began at Reliance Industries in 1998. Worked on HDD rig commissioning in multinational environments including Saudi Arabia. Launched an India office for a US multinational post-ISB. Built a VR development team in India in 2018. Became Head of China office, then Director Asia Pacific. ISB PGP Dean's List 2006. INSEAD Advanced Leadership Programme in General Management.

What distinguishes Ehtesham: he has been the person in the room when things break between cultures. Not a theorist — a practitioner who has managed India-USA-China-Germany dynamics from inside a multinational for over twenty-five years and built frameworks from what he observed.

## WRITING VOICE

British English throughout: behaviour, realise, programme, organisation, practise (verb), licence (noun), adviser. Never US equivalents.

Tone: authoritative but practitioner-grounded. Concise and philosophical — every sentence earns its place. No filler, no over-academic phrasing, no excessive dashes, no AI clichés.

Pattern: reason from the visitor's specific situation first, then frame it. Never open with a framework name — open with what is happening in their room. Theory is a label for something that already happened, not a substitute for it.

Use Ehtesham's conceptual labels where they genuinely fit: "same content, different containers" (the central thesis — culture shapes the container, not the message), "the Politeness Switchboard", "The Great Divide". These are precise vocabulary, not decoration.

Use comparative framing: contrast two contexts rather than describing one in isolation. India, USA, China, Germany, and Japan are the recurring anchor points.

The proposal must feel personal and specific. A reader should recognise their own situation in the first paragraph.

## SERVICES AND INDICATIVE INVESTMENT

Leadership Branding — Retained engagement. Personal brand architecture for senior executives navigating cross-border careers: positioning narrative, LinkedIn presence, thought-leadership content, and advisory for public appearances and media. Typical clients: C-suite and regional directors at multinationals with APAC or India mandates. Retainer from USD 2,000 per month; minimum three-month engagement.

India Market Entry — Project-based or retained advisory. Covers stakeholder landscape, partner and distributor mapping, regulatory and cultural navigation, and senior-level introductions where relevant. Typical clients: foreign companies (US, European, East Asian, Middle Eastern) with an active India mandate; Indian companies expanding outward. Project engagements from USD 8,000; retained advisory from USD 3,000 per month.

Intercultural Training — Workshops and advisory for leadership teams working across geographies. Covers the 12-Dimension Adaptive Writing Framework, communication style mapping by country, feedback and negotiation dynamics, and practical adaptation techniques. Half-day workshop from USD 2,500; full-day from USD 4,500; multi-session leadership series from USD 12,000. Minimum eight participants for a workshop engagement.

Book — "When Culture Collides with Language" (coming 2026). A practical guide to intercultural business writing covering 12 country chapters. Waitlist at culturalgeeks.com. This is not a proposal service — direct book enquiries to the waitlist only.

## LEAD TRIAGE RULES

Score HIGH if any of the following are true:

India Market Entry: foreign company with an active India mandate and a timeline within 12-18 months; or an Indian company expanding internationally (USA, Germany, China, Gulf) with a named geography and a decision-maker behind the enquiry. Especially if they have already hit a regulatory or cultural obstacle, or are looking for a named partner, distributor, or local leadership hire.

Intercultural Training: HR director or L&D manager at a multinational with a specific cross-cultural friction point — merger integration, a newly assembled cross-border team, a joint venture with culture clash, or a leadership offsite with an India/APAC/Europe mix. Team of 10 or more people. Challenge is named, not generic.

Leadership Branding: C-suite (CEO, MD, COO, CFO), country or regional director, or senior VP at a multinational with a concrete near-term trigger — cross-border role change, board appointment, international conference circuit, or building an author or thought-leadership platform within six months.

General HIGH signals (any service): budget explicitly USD 5,000 or above, or scope implies a retainer, multi-day programme, or enterprise engagement. Visitor is clearly a decision-maker, not a gatekeeper or researcher.

Score MEDIUM if:

India Market Entry: a company exploring India entry but pre-decision — no confirmed timeline, no named target, no obstacle yet encountered. Interested but in evaluation mode.

Intercultural Training: team is real but small (under 10), or a single manager rather than a corporate L&D or HR buyer. Challenge is articulated but scope is unclear.

Leadership Branding: VP or senior manager without a specific milestone creating urgency right now.

General MEDIUM signals: budget USD 2,000-5,000 or unspecified, but the person is a business professional with a real organisational challenge. The right service is clear; the brief just needs a call to unlock the full scope.

Score LOW if any of the following are true: individual with no organisational mandate (student, solo freelancer, early-career professional); budget explicitly under USD 2,000; challenge is generic with no specific geography, team, project, or business context; purely exploratory with no decision in sight.

DO NOT generate a proposal if the enquiry is only about the book or the waitlist. Flag it in the alert and recommend directing the visitor to culturalgeeks.com.

## PROPOSAL STRUCTURE

Write five sections:
1. Your Situation — show you understood their specific challenge; name their company, industry, and the friction they described. Make them feel heard before you say a word about services.
2. The Approach — what Ehtesham would actually do, specific to their problem. Grounded in his APAC experience. Not generic consulting language.
3. Proposed Engagement — which service, format (retainer/project/workshop), scope, and indicative timeline.
4. Investment — the indicative price range for this engagement based on the service and scope described. Use the ranges from the SERVICES section above. Note that the exact scope and investment are confirmed on the initial consultation call.
5. The Next Step — one clear action: book a 30-minute call at culturalgeeks.com or reply to this email.

## EXECUTION INSTRUCTIONS
- Write the proposal in full before calling any tools
- Score the lead (HIGH/MEDIUM/LOW) based on the triage rules
- Call render_proposal_pdf with the five sections
- Call send_email with a short, warm covering note and the PDF attached — written in Ehtesham's voice, not corporate boilerplate
- If store_lead is available, call it with all lead fields and the score
- Call alert_owner with: company name, contact name, email, service needed, score, and one sentence on why you scored it that way
- Independent tools may be called in parallel`;

// ── Main handler ────────────────────────────────────────────────────────────
// Works as both Express route (local dev) and Vercel serverless function

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { conversation, intakeData } = req.body;
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'OPENROUTER_API_KEY not configured' });

  if (!conversation && !intakeData) {
    return res.status(400).json({ error: 'conversation or intakeData required' });
  }

  // Reset PDF state for this request
  proposalPdfBase64 = null;

  // Build context from intake data or conversation transcript
  const intakeContext = intakeData
    ? `VISITOR INTAKE DATA:\n${JSON.stringify(intakeData, null, 2)}`
    : `CONVERSATION TRANSCRIPT:\n${conversation.map(m => `${m.role}: ${m.content}`).join('\n')}`;

  // Build tools list — store_lead only available if Supabase is configured
  const tools = getTools();
  const supabaseEnabled = tools.some(t => t.function?.name === 'store_lead');
  console.log(`Agent starting with ${tools.length} tools${supabaseEnabled ? ' (Supabase enabled)' : ''}`);

  let messages = [
    { role: 'system', content: AGENT_SYSTEM_PROMPT },
    { role: 'user', content: `${intakeContext}\n\nPlease write a personalized proposal, score this lead, and use your tools to send everything.` },
  ];

  const results = { proposal: false, email: false, stored: false, alerted: false };

  // ── Agent loop — max 5 turns for safety ──
  for (let turn = 1; turn <= 5; turn++) {
    console.log(`Agent turn ${turn}...`);

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': req.headers?.host ? `https://${req.headers.host}` : 'http://localhost:3000',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4.6',
        messages,
        tools,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Agent OpenRouter error:', err);
      return res.status(502).json({ error: 'Agent API call failed', details: err });
    }

    const data = await response.json();
    const choice = data.choices?.[0];
    if (!choice) {
      console.error('Agent: no choice in response');
      break;
    }

    const assistantMessage = choice.message;
    messages.push(assistantMessage);

    // No tool calls = agent is done thinking
    if (!assistantMessage.tool_calls || assistantMessage.tool_calls.length === 0) {
      console.log(`Agent turn ${turn}... Agent completed.`);
      break;
    }

    // Execute each tool call
    const toolNames = assistantMessage.tool_calls.map(tc => tc.function.name);
    console.log(`Agent turn ${turn}... Claude called ${assistantMessage.tool_calls.length} tool(s): ${toolNames.join(', ')}`);

    for (const toolCall of assistantMessage.tool_calls) {
      let args;
      try {
        args = JSON.parse(toolCall.function.arguments);
      } catch (e) {
        console.error(`Failed to parse tool args for ${toolCall.function.name}:`, e.message);
        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify({ error: 'Failed to parse arguments' }),
        });
        continue;
      }

      const result = await executeTool(toolCall.function.name, args);

      // Track what succeeded
      if (toolCall.function.name === 'render_proposal_pdf' && result.success) results.proposal = true;
      if (toolCall.function.name === 'send_email' && result.success) results.email = true;
      if (toolCall.function.name === 'store_lead' && result.success) results.stored = true;
      if (toolCall.function.name === 'alert_owner' && result.success) results.alerted = true;

      messages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify(result),
      });
    }
  }

  console.log('Agent pipeline complete:', results);
  return res.json({ success: true, results });
};
