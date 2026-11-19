import { useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';

import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Printer,
  Mail,
  Cpu,
  Edit3,
  Building2,
  Zap,
  BookOpen,
  Plus,
  Trash2,
  Info,
  Sun,
  Moon,
  ShieldCheck,
  Smartphone,
  X,
  Lock,
  LogOut,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

import { auth, db, SUPER_ADMIN_EMAIL, APP_ID } from './firebase';
import CreativeScanner from './CreativeScanner';
import './App.css';

const DEFAULT_RULES = [
  { id: 'r1', pillar: '01 / Getting In', pillarIndex: 1, code: '01', title: 'Prove & Show Who You Are', desc: 'SPF, DKIM, DMARC alignment, plus BIMI brand logo verification.', weight: 7 },
  { id: 'r2', pillar: '01 / Getting In', pillarIndex: 1, code: '02', title: 'Permission Is Trust', desc: 'POPIA governance, direct marketing consent records, suppression lists.', weight: 7 },
  { id: 'r3', pillar: '01 / Getting In', pillarIndex: 1, code: '03', title: 'Easy Leaving', desc: 'Clear opt-out routes and 1-click unsubscribe headers for bulk senders.', weight: 6 },
  { id: 'r4', pillar: '01 / Getting In', pillarIndex: 1, code: '04', title: 'Reputation Beats Volume', desc: 'Focus on low complaints, clean lists, and steady volume delivery.', weight: 6 },
  { id: 'r5', pillar: '01 / Getting In', pillarIndex: 1, code: '05', title: 'Build For Everywhere', desc: 'Email-compatible HTML tested across Outlook, Gmail, and Apple Mail.', weight: 7 },
  { id: 'r6', pillar: '02 / Standing Out', pillarIndex: 2, code: '06', title: 'Design For Smallest Screen', desc: 'Mobile-first layout, logical content stacking, and 44px+ tap targets.', weight: 7 },
  { id: 'r7', pillar: '02 / Standing Out', pillarIndex: 2, code: '07', title: 'Balance Visuals with Live Text', desc: 'Core headlines and offers readable even if image loading is blocked.', weight: 8 },
  { id: 'r8', pillar: '02 / Standing Out', pillarIndex: 2, code: '08', title: 'Accessibility Is Good Design', desc: 'Meaningful alt text, adequate text contrast ratios, and dark mode resilience.', weight: 6 },
  { id: 'r9', pillar: '02 / Standing Out', pillarIndex: 2, code: '09', title: 'Win Inbox Before Open', desc: 'Sender identity, subject line, and pre-header text work synergistically.', weight: 8 },
  { id: 'r10', pillar: '02 / Standing Out', pillarIndex: 2, code: '10', title: 'One Message. One Clear Action.', desc: 'Single focal message goal with an obvious, uncompeting primary CTA.', weight: 8 },
  { id: 'r11', pillar: '03 / Intelligence', pillarIndex: 3, code: '11', title: 'Purposeful Personalisation', desc: 'Meaningful 1st-party customer context instead of token name tags.', weight: 5 },
  { id: 'r12', pillar: '03 / Intelligence', pillarIndex: 3, code: '12', title: 'Right Message. Right Moment.', desc: 'Lifecycle cadence, automated milestones, and smart frequency limits.', weight: 5 },
  { id: 'r13', pillar: '03 / Intelligence', pillarIndex: 3, code: '13', title: 'Design For AI-Powered Inbox', desc: 'Clear front-loaded dates, figures, and next steps parseable by inbox LLMs.', weight: 10 },
  { id: 'r14', pillar: '03 / Intelligence', pillarIndex: 3, code: '14', title: 'Measure Actions, Not Opens', desc: 'Prioritise qualified clicks and downstream conversions over cached opens.', weight: 5 },
  { id: 'r15', pillar: '03 / Intelligence', pillarIndex: 3, code: '15', title: 'Test. Learn. Improve. Repeat.', desc: 'Disciplined hypothesis-driven split testing with recorded learning loops.', weight: 5 },
];

const DEFAULT_SOURCES = [
  { id: 's1', title: '2027 Tilte Email Best Practices Reference Guide', category: 'Internal IP', date: '2027-01-15', snippet: 'Framework establishing the 15 pillars of modern email effectiveness across deliverability, human engagement, and AI comprehension.' },
  { id: 's2', title: 'POPIA Direct Marketing & National Opt-Out Mandates', category: 'Regulatory', date: '2026-11-20', snippet: 'South African statutory requirements for unsolicited electronic communications and automated suppression protocols.' },
  { id: 's3', title: 'Inbox LLM Parsing Benchmarks (Apple, Gemini, Copilot)', category: 'Technical QA', date: '2027-02-04', snippet: 'Empirical testing observations documenting how email headers and live-text HTML elements are extracted into conversational cards.' },
];

const MANUAL_CHECKPOINTS = [
  { id: 'senderAuthentication', ruleId: 'r1', label: 'SPF, DKIM, DMARC, and BIMI records are configured and verified.' },
  { id: 'consentAndSuppression', ruleId: 'r2', label: 'Consent records and suppression lists are current and applied to this send.' },
  { id: 'unsubscribe', ruleId: 'r3', label: 'The unsubscribe link works and one-click unsubscribe headers are configured where required.' },
  { id: 'senderReputation', ruleId: 'r4', label: 'Sender reputation, complaint rates, list quality, and sending volume have been reviewed.' },
  { id: 'clientRendering', ruleId: 'r5', label: 'The email has been rendered and tested in the target email clients.' },
  { id: 'mobileExperience', ruleId: 'r6', label: 'The email has been checked on mobile devices, including layout and tap targets.' },
  { id: 'imageFallback', ruleId: 'r7', label: 'The message remains understandable when images are blocked.' },
  { id: 'accessibility', ruleId: 'r8', label: 'Accessibility, contrast, alt text, and dark-mode behavior have been checked.' },
  { id: 'senderIdentity', ruleId: 'r9', label: 'The from name and sending domain are recognizable and aligned with the brand.' },
  { id: 'clearAction', ruleId: 'r10', label: 'Primary call-to-action is clear, focused, and uncompeting.' },
  { id: 'personalizationData', ruleId: 'r11', label: 'Personalization data, consent, and fallback behavior have been validated.' },
  { id: 'sendCadence', ruleId: 'r12', label: 'Lifecycle timing and frequency limits are configured for this audience.' },
  { id: 'aiReadability', ruleId: 'r13', label: 'Dates, amounts, and next steps are clear and accurate in the final rendered email.' },
  { id: 'measurement', ruleId: 'r14', label: 'Click and conversion tracking are configured and have been tested.' },
  { id: 'experimentation', ruleId: 'r15', label: 'A test hypothesis, audience split, and success measure are documented.' },
];

// ─── Gemini-powered inbox simulation ───────────────────────────────────────
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

async function callGemini(systemPrompt, userContent) {
  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: userContent }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: { temperature: 0.4, maxOutputTokens: 400 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';
}

const APPLE_SYSTEM_PROMPT = `You are Apple Intelligence inside Apple Mail. Your job is to generate a single-sentence email summary that appears on the iOS/macOS notification card and in the mailbox list view.

Rules:
- Maximum 1 sentence, ideally under 20 words.
- Plain, natural English — no corporate jargon.
- Action-first: start with what the recipient needs to do or what is happening.
- Never mention sender names, brand names, or marketing language.
- Do not include emojis, quotes, or punctuation beyond a period.
- Output ONLY the summary sentence, nothing else.`;

const GMAIL_SYSTEM_PROMPT = `You are Gmail's Gemini AI summary engine. Generate a "top-of-thread" summary displayed above the email body in Gmail.

Rules:
- Return exactly 3 bullet points, each under 15 words.
- Each bullet captures one key piece of information: the main message, a key detail (date, amount, deadline), and the primary action.
- Bullet format: plain text starting with a verb or key noun. No hyphens or symbols — just the text.
- Tone: informational, neutral, slightly formal.
- Output ONLY the 3 bullets separated by newlines, nothing else.`;

const OUTLOOK_SYSTEM_PROMPT = `You are Microsoft Copilot inside Outlook. Generate a "Copilot Summary" card shown at the top of the email reading pane.

Rules:
- 2–3 sentences maximum.
- Professional, concise, direct.
- Mention the core subject, any key dates or figures, and the recommended next step.
- Do not use bullet points — write flowing prose.
- Output ONLY the summary paragraph, nothing else.`;

// ─── Color, Contrast & WCAG Calculations ────────────────────────────────────
function parseCssColor(colorStr) {
  if (!colorStr || typeof colorStr !== 'string') return null;
  const s = colorStr.trim().toLowerCase();

  const NAMED_COLORS = {
    white: [255, 255, 255],
    black: [0, 0, 0],
    red: [255, 0, 0],
    green: [0, 128, 0],
    blue: [0, 0, 255],
    yellow: [255, 255, 0],
    orange: [255, 165, 0],
    purple: [128, 0, 128],
    navy: [0, 0, 128],
    darkblue: [0, 0, 139],
    teal: [0, 128, 128],
    gray: [128, 128, 128],
    grey: [128, 128, 128],
    lightgray: [211, 211, 211],
    lightgrey: [211, 211, 211],
    darkgray: [169, 169, 169],
    darkgrey: [169, 169, 169],
    silver: [192, 192, 192],
    crimson: [220, 20, 60],
  };
  if (NAMED_COLORS[s]) return NAMED_COLORS[s];

  const cleanHex = s.startsWith('#') ? s.slice(1) : (s.length === 3 || s.length === 6) && /^[0-9a-f]+$/i.test(s) ? s : null;
  if (cleanHex) {
    if (cleanHex.length === 3) {
      return [
        parseInt(cleanHex[0] + cleanHex[0], 16),
        parseInt(cleanHex[1] + cleanHex[1], 16),
        parseInt(cleanHex[2] + cleanHex[2], 16),
      ];
    }
    if (cleanHex.length >= 6) {
      return [
        parseInt(cleanHex.slice(0, 2), 16),
        parseInt(cleanHex.slice(2, 4), 16),
        parseInt(cleanHex.slice(4, 6), 16),
      ];
    }
  }

  const rgbMatch = s.match(/rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgbMatch) {
    return [parseInt(rgbMatch[1], 10), parseInt(rgbMatch[2], 10), parseInt(rgbMatch[3], 10)];
  }

  return null;
}

function calculateLuminance([r, g, b]) {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function calculateWcagContrast(rgbA, rgbB) {
  if (!rgbA || !rgbB) return null;
  const l1 = calculateLuminance(rgbA);
  const l2 = calculateLuminance(rgbB);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  const ratio = (lighter + 0.05) / (darker + 0.05);
  return Math.round(ratio * 100) / 100;
}

function evaluateWcagCompliance(ratio) {
  if (!ratio || typeof ratio !== 'number' || !Number.isFinite(ratio)) {
    return {
      level: 'unverified',
      label: 'Unverified',
      pass: false,
      badgeClass: 'rating-badge-pending',
      description: 'Visual contrast unverified — pending HTML button styles.',
    };
  }
  if (ratio >= 7.0) {
    return {
      level: 'aaa',
      label: 'WCAG AAA (Enhanced)',
      pass: true,
      badgeClass: 'rating-badge-strong',
      description: 'Exceptional contrast. Readable across all screen brightness settings and lighting environments.',
    };
  }
  if (ratio >= 4.5) {
    return {
      level: 'aa',
      label: 'WCAG AA Pass',
      pass: true,
      badgeClass: 'rating-badge-strong',
      description: 'Meets WCAG 2.1 AA requirements (≥4.5:1) for standard text and interactive buttons.',
    };
  }
  if (ratio >= 3.0) {
    return {
      level: 'aa_large_only',
      label: 'Large Text Only (≥3.0:1)',
      pass: false,
      badgeClass: 'rating-badge-warn',
      description: 'Borderline. Passes WCAG AA only for large text (≥18pt bold or ≥24pt regular); fails standard text.',
    };
  }
  return {
    level: 'fail',
    label: 'WCAG Fail (<3.0:1)',
    pass: false,
    badgeClass: 'rating-badge-risk',
    description: 'Fails WCAG accessibility standards. Illegible contrast (<3:1) causing reader disengagement.',
  };
}

// ─── Robust Email CTA & Placement Analysis Engine ───────────────────────────
function analyzeEmailCta(emailCopy = '') {
  const copy = (emailCopy || '').trim();
  if (!copy) {
    return {
      isDetected: false,
      primaryCtaText: 'No CTA detected',
      type: 'none',
      foldVerdict: 'none',
      placementPercent: 0,
      placementBadge: 'No CTA Found',
      placementGuidance: 'Please paste email copy or HTML to analyze call to action placement and contrast.',
      contrastRatio: null,
      contrastStatus: 'unverified',
      wcag: evaluateWcagCompliance(null),
      textColor: null,
      fillColor: null,
      contrastSource: 'none',
      clarityRating: 'Missing Action',
      isVague: false,
      competingCtas: [],
      competingCount: 0,
      totalCtasFound: 0,
      flawReason: 'No recognizable CTA found in copy.',
    };
  }

  const UTILITY_LINK_REGEX = /\b(unsubscribe|opt[\s-]*out|privacy|terms|preferences|browser|view[\s-]*online|forward|manage|cookie|login|sign[\s-]*in|log[\s-]*in|help|support|contact|policy|facebook|twitter|instagram|linkedin|youtube|tiktok|pinterest|threads|x\.com)\b/i;
  const VAGUE_PHRASES = ['click here', 'learn more', 'read more', 'find out more', 'more info', 'continue', 'submit', 'go here', 'here', 'see more', 'view more'];

  const candidates = [];
  const copyLength = copy.length;

  // 1. Parse HTML if tags present
  const isHtml = /<[a-z][\s\S]*>/i.test(copy);
  if (isHtml) {
    let parsedWithDom = false;
    if (typeof DOMParser !== 'undefined') {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(copy, 'text/html');
        const interactiveElements = doc.querySelectorAll('a, button, [role="button"], [class*="btn"], [class*="button"], td[bgcolor]');

        interactiveElements.forEach((el) => {
          const text = (el.textContent || '').trim();
          const href = el.getAttribute('href') || '';
          const style = el.getAttribute('style') || '';
          const rawHtml = el.outerHTML;

          if (!text || text.length < 2 || text.length > 80) return;
          if (UTILITY_LINK_REGEX.test(text) || UTILITY_LINK_REGEX.test(href)) return;
          if (href.startsWith('mailto:') || href.startsWith('tel:')) return;

          let fillColorStr = el.getAttribute('bgcolor') || null;
          let textColorStr = null;

          const bgMatch = style.match(/(?:background(?:-color)?)\s*:\s*([^;!]+)/i);
          if (bgMatch) fillColorStr = bgMatch[1].trim();

          const colorMatch = style.match(/(?:^|;)\s*color\s*:\s*([^;!]+)/i);
          if (colorMatch) textColorStr = colorMatch[1].trim();

          if (!fillColorStr && el.parentElement) {
            const parentBg = el.parentElement.getAttribute('bgcolor') || el.parentElement.getAttribute('style')?.match(/(?:background(?:-color)?)\s*:\s*([^;!]+)/i)?.[1];
            if (parentBg) fillColorStr = parentBg.trim();
          }

          const rgbFill = parseCssColor(fillColorStr);
          const rgbText = parseCssColor(textColorStr);
          const contrastRatio = (rgbFill && rgbText) ? calculateWcagContrast(rgbFill, rgbText) : null;

          const charIndex = copy.indexOf(rawHtml);
          const positionPercent = charIndex >= 0 ? Math.round((charIndex / Math.max(1, copyLength)) * 100) : 50;
          const isVague = VAGUE_PHRASES.some((v) => text.toLowerCase().includes(v));

          candidates.push({
            text,
            type: el.tagName.toLowerCase() === 'button' || style.includes('background') || el.className.includes('btn') ? 'html_button' : 'html_link',
            positionPercent,
            charIndex: charIndex >= 0 ? charIndex : copyLength / 2,
            isVague,
            styleColors: {
              fillColor: fillColorStr,
              textColor: textColorStr,
              contrastRatio,
              rgbFill,
              rgbText,
            },
          });
        });
        parsedWithDom = candidates.length > 0;
      } catch (e) {
        console.warn('DOMParser warning:', e);
      }
    }

    // Regex HTML fallback if DOMParser is unavailable or found no candidates
    if (!parsedWithDom) {
      const tagRegex = /<(a|button)\b([^>]*)>([\s\S]*?)<\/\1>/gi;
      let tMatch;
      while ((tMatch = tagRegex.exec(copy)) !== null) {
        const tag = tMatch[1].toLowerCase();
        const attrs = tMatch[2];
        const inner = tMatch[3];
        const text = inner.replace(/<[^>]+>/g, '').trim();

        if (!text || text.length < 2 || text.length > 80) continue;
        if (UTILITY_LINK_REGEX.test(text) || UTILITY_LINK_REGEX.test(attrs)) continue;

        let fillColorStr = null;
        let textColorStr = null;

        const bgMatch = attrs.match(/(?:background(?:-color)?)\s*:\s*([^;"'!]+)/i) || attrs.match(/bgcolor=["']?([^"'\s>]+)/i);
        if (bgMatch) fillColorStr = bgMatch[1].trim();

        const colorMatch = attrs.match(/(?:^|;|\s)color\s*:\s*([^;"'!]+)/i);
        if (colorMatch) textColorStr = colorMatch[1].trim();

        const rgbFill = parseCssColor(fillColorStr);
        const rgbText = parseCssColor(textColorStr);
        const contrastRatio = (rgbFill && rgbText) ? calculateWcagContrast(rgbFill, rgbText) : null;

        const positionPercent = Math.round((tMatch.index / Math.max(1, copyLength)) * 100);
        const isVague = VAGUE_PHRASES.some((v) => text.toLowerCase().includes(v));

        candidates.push({
          text,
          type: tag === 'button' || fillColorStr ? 'html_button' : 'html_link',
          positionPercent,
          charIndex: tMatch.index,
          isVague,
          styleColors: {
            fillColor: fillColorStr,
            textColor: textColorStr,
            contrastRatio,
            rgbFill,
            rgbText,
          },
        });
      }
    }
  }

  // 2. Markdown links: [Text](url)
  const mdLinkRegex = /\[([^\]]{2,80})\]\(([^)]+)\)/g;
  let mdMatch;
  while ((mdMatch = mdLinkRegex.exec(copy)) !== null) {
    const text = mdMatch[1].trim();
    const url = mdMatch[2].trim();
    if (UTILITY_LINK_REGEX.test(text) || UTILITY_LINK_REGEX.test(url)) continue;
    const isVague = VAGUE_PHRASES.some((v) => text.toLowerCase().includes(v));
    const positionPercent = Math.round((mdMatch.index / Math.max(1, copyLength)) * 100);
    candidates.push({
      text,
      type: 'markdown_link',
      positionPercent,
      charIndex: mdMatch.index,
      isVague,
      styleColors: null,
    });
  }

  // 3. Bracketed CTAs: [Shop Now], >> Register Today <<, CTA: Claim Offer
  const bracketRegex = /\[([A-Za-z0-9\s!?'\-$%]{3,60})\]|>>\s*([A-Za-z0-9\s!?'\-$%]{3,60})\s*<<|CTA:\s*([A-Za-z0-9\s!?'\-$%]{3,60})/g;
  let bMatch;
  while ((bMatch = bracketRegex.exec(copy)) !== null) {
    const text = (bMatch[1] || bMatch[2] || bMatch[3] || '').trim();
    if (!text || UTILITY_LINK_REGEX.test(text)) continue;
    const isVague = VAGUE_PHRASES.some((v) => text.toLowerCase().includes(v));
    const positionPercent = Math.round((bMatch.index / Math.max(1, copyLength)) * 100);
    candidates.push({
      text,
      type: 'bracket_cta',
      positionPercent,
      charIndex: bMatch.index,
      isVague,
      styleColors: null,
    });
  }

  // 4. Action phrases in text
  const actionPhraseRegex = /\b(shop|buy|order|get|claim|grab|start|try|sign\s*up|register|join|book|reserve|schedule|download|access|discover|explore|renew|upgrade|confirm|verify|donate|apply|enroll|save|unlock|request)\b\s+([A-Za-z0-9!?'\-$%]{2,20}(?:\s+[A-Za-z0-9!?'\-$%]{2,20}){0,5})/gi;
  let aMatch;
  while ((aMatch = actionPhraseRegex.exec(copy)) !== null) {
    const phrase = aMatch[0].trim();
    if (phrase.length > 50) continue;
    const prefix = copy.slice(Math.max(0, aMatch.index - 15), aMatch.index).toLowerCase();
    if (/\b(we|you can|you will|they|i|when|if|as|how to)\s*$/i.test(prefix)) continue;

    const isVague = VAGUE_PHRASES.some((v) => phrase.toLowerCase().includes(v));
    const positionPercent = Math.round((aMatch.index / Math.max(1, copyLength)) * 100);
    candidates.push({
      text: phrase,
      type: 'action_phrase',
      positionPercent,
      charIndex: aMatch.index,
      isVague,
      styleColors: null,
    });
  }

  // 5. Standalone vague phrases
  const vagueRegex = /\b(click\s+here|learn\s+more|read\s+more|find\s+out\s+more|more\s+info|continue|submit|view\s+more|see\s+more)\b/gi;
  let vMatch;
  while ((vMatch = vagueRegex.exec(copy)) !== null) {
    const phrase = vMatch[0].trim();
    const positionPercent = Math.round((vMatch.index / Math.max(1, copyLength)) * 100);
    candidates.push({
      text: phrase,
      type: 'vague_phrase',
      positionPercent,
      charIndex: vMatch.index,
      isVague: true,
      styleColors: null,
    });
  }

  // Deduplicate candidates
  const uniqueCandidates = [];
  const seenTexts = new Set();
  for (const c of candidates) {
    const norm = c.text.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!norm || seenTexts.has(norm)) continue;
    seenTexts.add(norm);
    uniqueCandidates.push(c);
  }

  // Rank candidates
  uniqueCandidates.sort((a, b) => {
    const typeScore = (item) => {
      if (item.type === 'html_button') return 100;
      if (item.type === 'bracket_cta' || item.type === 'markdown_link') return 80;
      if (item.type === 'html_link') return 70;
      if (item.type === 'action_phrase' && !item.isVague) return 60;
      if (item.isVague) return 20;
      return 10;
    };
    const diff = typeScore(b) - typeScore(a);
    if (diff !== 0) return diff;
    return a.charIndex - b.charIndex;
  });

  const primaryCandidate = uniqueCandidates[0] || null;
  const competingCtas = uniqueCandidates.slice(1);

  if (!primaryCandidate) {
    return {
      isDetected: false,
      primaryCtaText: 'No CTA detected',
      type: 'none',
      foldVerdict: 'none',
      placementPercent: 0,
      placementBadge: 'No CTA Found',
      placementGuidance: 'No recognizable button, link, or action phrase detected in the submitted copy.',
      contrastRatio: null,
      contrastStatus: 'unverified',
      wcag: evaluateWcagCompliance(null),
      textColor: null,
      fillColor: null,
      contrastSource: 'none',
      clarityRating: 'Missing Action',
      isVague: false,
      competingCtas: [],
      competingCount: 0,
      totalCtasFound: 0,
      flawReason: 'No recognizable CTA found in copy.',
    };
  }

  // Placement determination
  const placementPercent = primaryCandidate.positionPercent;

  let foldVerdict = 'above_fold';
  let placementBadge = `Above the Fold (Top ${placementPercent}%)`;
  let placementGuidance = 'Optimal placement — positioned early in the reading flow (top 40%). Recipients see the primary action on mobile screens before scrolling.';

  if (placementPercent > 70) {
    foldVerdict = 'below_fold';
    placementBadge = `Below the Fold (${placementPercent}% down)`;
    placementGuidance = 'High drop-off risk — positioned in the bottom 30% of the email. Up to 60% of mobile users disengage before scrolling this deep. Recommend moving a primary CTA higher into the top 40%.';
  } else if (placementPercent > 40) {
    foldVerdict = 'mid_body';
    placementBadge = `Mid-Body (${placementPercent}% down)`;
    placementGuidance = 'Acceptable placement — positioned after initial value proposition. Works well for considered decisions, but testing an earlier anchor button in the top 35% is advised for mobile readers.';
  }

  // Contrast determination
  let contrastRatio = null;
  let textColor = null;
  let fillColor = null;
  let contrastSource = 'none';

  if (primaryCandidate.styleColors?.contrastRatio) {
    contrastRatio = primaryCandidate.styleColors.contrastRatio;
    textColor = primaryCandidate.styleColors.textColor;
    fillColor = primaryCandidate.styleColors.fillColor;
    contrastSource = 'html_styles';
  }

  const wcag = evaluateWcagCompliance(contrastRatio);
  const contrastStatus = contrastRatio !== null
    ? (wcag.pass ? 'pass' : wcag.level === 'aa_large_only' ? 'warning' : 'fail')
    : 'unverified';

  // Clarity rating
  const clarityRating = primaryCandidate.isVague
    ? `Vague / Generic Action ("${primaryCandidate.text}")`
    : `Action-Oriented & Specific ("${primaryCandidate.text}")`;

  // Flaw reason
  let flawReason = '';
  if (foldVerdict === 'below_fold') flawReason = 'CTA is placed too deep (>70% down) risking mobile drop-off';
  else if (primaryCandidate.isVague) flawReason = 'CTA phrasing is generic and lacks specific conversion incentive';
  else if (competingCtas.length >= 3) flawReason = `${competingCtas.length + 1} competing CTAs cause decision fatigue`;

  return {
    isDetected: true,
    primaryCtaText: primaryCandidate.text,
    type: primaryCandidate.type,
    foldVerdict,
    placementPercent,
    placementBadge,
    placementGuidance,
    contrastRatio,
    contrastStatus,
    wcag,
    textColor,
    fillColor,
    contrastSource,
    clarityRating,
    isVague: primaryCandidate.isVague,
    competingCtas: competingCtas.map((c) => c.text),
    competingCount: competingCtas.length,
    totalCtasFound: uniqueCandidates.length,
    flawReason,
  };
}

function generateDeterministicEmailSummaries(subjectLine = '', preHeader = '', emailCopy = '') {
  // Strip HTML and normalize whitespace
  const cleanText = (emailCopy || '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();

  const subject = (subjectLine || '').trim();
  const preheader = (preHeader || '').trim();

  // Extract clean sentences
  const sentences = cleanText
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 12 && !/unsubscribe|privacy policy|view in browser|terms of service|preferences/i.test(s));

  // Extract key entities: Deadlines, Dates, Amounts
  const dateMatch = cleanText.match(/\b(?:by|until|before|on|expires|deadline:?)\s+([A-Za-z]+ \d{1,2}(?:st|nd|rd|th)?(?:,?\s*\d{4})?|\d{1,2}[\s/-]\w+[\s/-]\d{2,4}|\w+day(?:\s+\w+\s+\d{1,2})?)\b/i)
    || cleanText.match(/\b(\d{1,2}[\s/-]\w+[\s/-]\d{2,4}|\w+ \d{1,2},?\s*\d{4}|by \w+ \d{1,2}(?:st|nd|rd|th)?)\b/i);
  const extractedDate = dateMatch ? dateMatch[0].replace(/^(by|until|before|on|expires|deadline:?)\s+/i, '') : 'Not detected';

  const amountMatch = cleanText.match(/([R$€£¥]\s?[\d,]+(?:\.\d{2})?|\b\d+%\s*off\b|\bfree\s+(?:shipping|trial|gift)\b)/i);
  const extractedAmount = amountMatch ? amountMatch[0] : 'Not detected';

  const ctaResult = analyzeEmailCta(emailCopy);
  const primaryCta = ctaResult.isDetected && ctaResult.primaryCtaText !== 'No CTA detected'
    ? ctaResult.primaryCtaText
    : null;

  const leadTopic = subject || (sentences[0] ? sentences[0].replace(/[.!?]+$/, '') : 'Email update');

  // 1. Apple Intelligence: Concise 1-sentence lock-screen / notification summary
  let apple;
  if (primaryCta && extractedDate !== 'Not detected') {
    apple = `${leadTopic} — ${primaryCta.toLowerCase()} by ${extractedDate}.`;
  } else if (primaryCta) {
    apple = `${leadTopic} with action requested to ${primaryCta.toLowerCase()}.`;
  } else if (extractedDate !== 'Not detected') {
    apple = `${leadTopic}, with key deadlines effective through ${extractedDate}.`;
  } else if (sentences[0]) {
    apple = `${leadTopic}: ${sentences[0].slice(0, 100).replace(/[.!?]+$/, '')}.`;
  } else {
    apple = leadTopic.endsWith('.') ? leadTopic : `${leadTopic}.`;
  }
  const appleWords = apple.split(/\s+/);
  if (appleWords.length > 24) {
    apple = `${appleWords.slice(0, 23).join(' ')}...`;
  }

  // 2. Gmail Gemini: 3 informational bullet points summarizing the actual email
  const gemini = [];
  gemini.push(
    subject
      ? `${subject.replace(/[.!?]+$/, '')}${preheader ? ` — ${preheader.replace(/[.!?]+$/, '')}` : ''}`
      : sentences[0] || 'Core announcement and campaign updates.'
  );

  if (extractedAmount !== 'Not detected' && extractedDate !== 'Not detected') {
    gemini.push(`Features ${extractedAmount} with response requested by ${extractedDate}.`);
  } else if (extractedAmount !== 'Not detected') {
    gemini.push(`Includes offer details: ${extractedAmount}.`);
  } else if (extractedDate !== 'Not detected') {
    gemini.push(`Notices effective through ${extractedDate}.`);
  } else if (preheader && preheader !== subject) {
    gemini.push(preheader.replace(/[.!?]+$/, '') + '.');
  } else if (sentences[1]) {
    gemini.push(sentences[1].slice(0, 95).replace(/[.!?]+$/, '') + '.');
  } else {
    gemini.push('Full details, terms, and context provided in message body.');
  }

  if (primaryCta) {
    gemini.push(`Primary action: ${primaryCta.replace(/[.!?]+$/, '')} using the link provided.`);
  } else if (sentences[2]) {
    gemini.push(sentences[2].slice(0, 95).replace(/[.!?]+$/, '') + '.');
  } else {
    gemini.push('Recipients are directed to review instructions and follow up online.');
  }

  // 3. Outlook Copilot: 2-3 sentence executive paragraph
  const copilotIntro = `This message provides an update regarding ${subject ? `"${subject}"` : 'the submitted communication'}${preheader ? `, noting that ${preheader.toLowerCase()}` : ''}.`;
  const copilotDetail = extractedDate !== 'Not detected' || extractedAmount !== 'Not detected'
    ? ` It highlights ${extractedAmount !== 'Not detected' ? `an offer of ${extractedAmount}` : 'relevant schedule details'}${extractedDate !== 'Not detected' ? ` with a deadline of ${extractedDate}` : ''}.`
    : sentences[1] ? ` ${sentences[1].slice(0, 110).replace(/[.!?]+$/, '')}.` : '';
  const copilotAction = primaryCta
    ? ` The sender requests that recipients ${primaryCta.toLowerCase()} via the included link.`
    : ' Review the message body for full details and next steps.';
  const copilot = `${copilotIntro}${copilotDetail}${copilotAction}`;

  return {
    apple,
    gemini: gemini.slice(0, 3),
    copilot,
    extractedDate,
    extractedAmount,
    extractedCta: primaryCta || 'Not detected',
  };
}

async function generateInboxSimulations(subjectLine, preHeader, emailCopy) {
  if (!GEMINI_API_KEY) {
    return generateDeterministicEmailSummaries(subjectLine, preHeader, emailCopy);
  }

  const emailContext = `Subject: ${subjectLine || '(no subject)'}
Pre-header: ${preHeader || '(none)'}
Body:
${emailCopy}`;

  try {
    const [appleRaw, gmailRaw, outlookRaw] = await Promise.all([
      callGemini(APPLE_SYSTEM_PROMPT, emailContext),
      callGemini(GMAIL_SYSTEM_PROMPT, emailContext),
      callGemini(OUTLOOK_SYSTEM_PROMPT, emailContext),
    ]);

    const geminiBullets = gmailRaw
      .split('\n')
      .map((l) => l.replace(/^[-•*]\s*/, '').trim())
      .filter(Boolean)
      .slice(0, 3);

    const deterministic = generateDeterministicEmailSummaries(subjectLine, preHeader, emailCopy);

    return {
      apple: appleRaw || deterministic.apple,
      gemini: geminiBullets.length >= 2 ? geminiBullets : deterministic.gemini,
      copilot: outlookRaw || deterministic.copilot,
      extractedDate: deterministic.extractedDate,
      extractedAmount: deterministic.extractedAmount,
      extractedCta: deterministic.extractedCta,
    };
  } catch (err) {
    console.warn('Gemini API call failed, falling back to deterministic email summary:', err);
    return generateDeterministicEmailSummaries(subjectLine, preHeader, emailCopy);
  }
}
// ───────────────────────────────────────────────────────────────────────────

export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState('studio');
  const [auditStep, setAuditStep] = useState('metadata');
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('campaign_manager');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [rules, setRules] = useState(DEFAULT_RULES);
  const [sources, setSources] = useState(DEFAULT_SOURCES);
  const [selectedSource, setSelectedSource] = useState(DEFAULT_SOURCES[0]);
  const [isAddRuleModalOpen, setIsAddRuleModalOpen] = useState(false);
  const [newRule, setNewRule] = useState({ pillarIndex: 1, title: '', desc: '', weight: 7 });
  const [isSavingMethodology, setIsSavingMethodology] = useState(false);
  const [methodologyStatusMsg, setMethodologyStatusMsg] = useState('');
  const [manualChecks, setManualChecks] = useState(() => Object.fromEntries(MANUAL_CHECKPOINTS.map(({ id }) => [id, false])));
  const [clientName, setClientName] = useState('');
  const [campaignName, setCampaignName] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [coreGoal, setCoreGoal] = useState('');
  const [subjectLine, setSubjectLine] = useState('');
  const [preHeader, setPreHeader] = useState('');
  const [emailCopy, setEmailCopy] = useState('');
  const [hasCalculated, setHasCalculated] = useState(false);
  const [auditResults, setAuditResults] = useState(null);
  const [simulationsLoading, setSimulationsLoading] = useState(false);
  const [simulationsError, setSimulationsError] = useState(null);
  const isCurrentUserAdmin = userRole === 'admin' || (user?.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase());

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setUser(null);
        setUserRole('campaign_manager');
        return;
      }

      const isSuperAdmin = currentUser.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
      const userDocRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'users', currentUser.uid);

      try {
        const snap = await getDoc(userDocRef);
        if (!snap.exists()) {
          const initialData = {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName || currentUser.email?.split('@')[0] || '',
            photoURL: currentUser.photoURL || '',
            role: isSuperAdmin ? 'admin' : 'campaign_manager',
            isSuperAdmin,
            createdAt: serverTimestamp(),
          };
          await setDoc(userDocRef, initialData);
          setUserRole(initialData.role);
        } else {
          const userData = snap.data();
          if (isSuperAdmin && userData.role !== 'admin') {
            await updateDoc(userDocRef, { role: 'admin', isSuperAdmin: true });
            setUserRole('admin');
          } else {
            setUserRole(userData.role || 'campaign_manager');
          }
        }
      } catch (error) {
        console.error('Could not load the signed-in user profile:', error);
        setUserRole(isSuperAdmin ? 'admin' : 'campaign_manager');
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const methodologyDocRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'methodology', 'global_rules_2027');

    const unsubscribe = onSnapshot(
      methodologyDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.rules && Array.isArray(data.rules) && data.rules.length > 0) {
            setRules(data.rules);
          }
          if (data.sources && Array.isArray(data.sources) && data.sources.length > 0) {
            setSources(data.sources);
            setSelectedSource((current) => current || data.sources[0]);
          }
        } else {
          setDoc(methodologyDocRef, {
            rules: DEFAULT_RULES,
            sources: DEFAULT_SOURCES,
            lastUpdated: new Date().toISOString(),
            updatedBy: user.email || 'system',
          }).catch((err) => console.warn('Could not auto-seed methodology doc:', err));
        }
      },
      (error) => {
        console.error('Firestore Methodology Snapshot Error:', error);
      },
    );

    return () => unsubscribe();
  }, [user]);

  const saveMethodologyToFirestore = async (updatedRules, updatedSources) => {
    const canWriteMethodology = isCurrentUserAdmin || user?.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();

    if (!user || !canWriteMethodology) {
      alert('Permission Denied: Only users with the Admin role can publish changes to the global 2027 methodology.');
      return;
    }

    setIsSavingMethodology(true);
    setMethodologyStatusMsg('Publishing updates to Firestore...');

    try {
      const methodologyDocRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'methodology', 'global_rules_2027');
      await setDoc(
        methodologyDocRef,
        {
          rules: updatedRules || rules,
          sources: updatedSources || sources,
          lastUpdated: new Date().toISOString(),
          updatedBy: user.email || user.uid,
        },
        { merge: true },
      );

      setMethodologyStatusMsg('Successfully published to global methodology!');
      setTimeout(() => setMethodologyStatusMsg(''), 4000);
    } catch (err) {
      console.error('Save methodology error:', err);
      setMethodologyStatusMsg('Error saving to cloud. Changes kept locally.');
    } finally {
      setIsSavingMethodology(false);
    }
  };

  const handleResetToDefaultMethodology = () => {
    if (!isCurrentUserAdmin) {
      alert('Admin rights required to reset global methodology.');
      return;
    }
    setRules(DEFAULT_RULES);
    setSources(DEFAULT_SOURCES);
    saveMethodologyToFirestore(DEFAULT_RULES, DEFAULT_SOURCES);
  };

  const handleAddRule = (e) => {
    e.preventDefault();
    if (!isCurrentUserAdmin) {
      alert('Admin rights required to add rules.');
      return;
    }
    if (!newRule.title.trim()) return;

    const pTitles = {
      1: '01 / Getting In',
      2: '02 / Standing Out',
      3: '03 / Intelligence',
    };

    const nextId = `r-${Date.now()}`;
    const code = (rules.length + 1).toString().padStart(2, '0');
    const created = {
      id: nextId,
      pillar: pTitles[newRule.pillarIndex],
      pillarIndex: Number(newRule.pillarIndex),
      code,
      title: newRule.title,
      desc: newRule.desc || 'Custom team rule for campaign readiness testing.',
      weight: Number(newRule.weight) || 5,
    };

    const updated = [...rules, created];
    setRules(updated);
    setNewRule({ pillarIndex: 1, title: '', desc: '', weight: 7 });
    setIsAddRuleModalOpen(false);
    saveMethodologyToFirestore(updated, sources);
  };

  const handleDeleteRule = (ruleId) => {
    if (!isCurrentUserAdmin) {
      alert('Admin rights required to delete rules.');
      return;
    }
    const updated = rules.filter((r) => r.id !== ruleId);
    setRules(updated);
    saveMethodologyToFirestore(updated, sources);
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (authMode === 'login') {
        await signInWithEmailAndPassword(auth, authEmail, authPassword);
      } else {
        const cred = await createUserWithEmailAndPassword(auth, authEmail, authPassword);
        const userDocRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'users', cred.user.uid);
        const defaultRole = cred.user.email && (cred.user.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() || cred.user.email.endsWith('@tilte.com')) ? 'admin' : 'campaign_manager';
        await setDoc(userDocRef, {
          uid: cred.user.uid,
          email: cred.user.email,
          displayName: cred.user.displayName || cred.user.email.split('@')[0],
          photoURL: cred.user.photoURL || '',
          role: defaultRole,
          isSuperAdmin: cred.user.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase(),
          createdAt: serverTimestamp(),
        });
        setUserRole(defaultRole);
      }
      setShowAuthModal(false);
      setAuthEmail('');
      setAuthPassword('');
      setActiveTab('studio');
    } catch (err) {
      setAuthError(err.message || 'Authentication failed. Please verify credentials.');
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError('');
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      const userDocRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'users', cred.user.uid);
      const snap = await getDoc(userDocRef);
      if (!snap.exists()) {
        const defaultRole = cred.user.email && (cred.user.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() || cred.user.email.endsWith('@tilte.com')) ? 'admin' : 'campaign_manager';
        await setDoc(userDocRef, {
          uid: cred.user.uid,
          email: cred.user.email,
          displayName: cred.user.displayName || cred.user.email.split('@')[0],
          photoURL: cred.user.photoURL || '',
          role: defaultRole,
          isSuperAdmin: cred.user.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase(),
          createdAt: serverTimestamp(),
        });
        setUserRole(defaultRole);
      }
      setShowAuthModal(false);
      setActiveTab('studio');
    } catch (err) {
      setAuthError(err.message || 'Google Sign-in failed.');
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setUserRole('campaign_manager');
  };

  const toggleTheme = () => {
    setDarkMode((current) => !current);
  };

  const handleCalculateScore = async () => {
    if (!emailCopy.trim()) {
      alert('Please add a subject line and email copy before running the audit.');
      return;
    }

    const ctaAnalysis = analyzeEmailCta(emailCopy);

    const evaluatedRules = rules.map((rule) => {
      const checkpoint = MANUAL_CHECKPOINTS.find((item) => item.ruleId === rule.id);
      let pass = checkpoint ? manualChecks[checkpoint.id] : false;
      let status = pass ? 'pass' : 'warning';
      let earned = pass ? rule.weight : 0;
      let reason = checkpoint
        ? pass
          ? 'Confirmed by the reviewer using the manual checkpoint.'
          : 'Not confirmed; this criterion cannot be verified from the submitted copy alone.'
        : 'No verification method is configured for this criterion.';

      // Rule 10: One Message. One Clear Action.
      if (rule.id === 'r10') {
        if (checkpoint && manualChecks[checkpoint.id]) {
          pass = true;
          status = 'pass';
          earned = rule.weight;
          reason = 'Confirmed by the reviewer using the manual checkpoint.';
        } else if (ctaAnalysis && ctaAnalysis.isDetected) {
          if (!ctaAnalysis.isVague && ctaAnalysis.competingCount <= 1) {
            pass = true;
            status = 'pass';
            earned = rule.weight;
            reason = `Optimal: Primary CTA "${ctaAnalysis.primaryCtaText}" detected and focused.`;
          } else {
            pass = false;
            status = 'warning';
            earned = Math.round(rule.weight * 0.5);
            reason = `CTA "${ctaAnalysis.primaryCtaText}" detected. Review placement and clarity.`;
          }
        } else {
          pass = false;
          status = 'warning';
          earned = Math.round(rule.weight * 0.5);
          reason = 'Not confirmed; review CTA clarity and ensure a single primary action.';
        }
      }

      // Rule 8: Accessibility Is Good Design
      if (rule.id === 'r8') {
        if (checkpoint && manualChecks[checkpoint.id]) {
          pass = true;
          status = 'pass';
          earned = rule.weight;
          reason = 'Confirmed by the reviewer using the manual checkpoint.';
        } else if (ctaAnalysis && ctaAnalysis.contrastRatio !== null) {
          if (ctaAnalysis.contrastRatio < 3.0) {
            pass = false;
            status = 'alert';
            earned = 0;
            reason = `Accessibility alert: HTML CTA contrast (${ctaAnalysis.contrastRatio}:1) fails WCAG AA minimum threshold (4.5:1).`;
          } else if (ctaAnalysis.contrastRatio >= 4.5) {
            pass = true;
            status = 'pass';
            earned = rule.weight;
            reason = `Confirmed: HTML CTA contrast (${ctaAnalysis.contrastRatio}:1) satisfies WCAG 2.1 AA requirements.`;
          } else {
            pass = false;
            status = 'warning';
            earned = Math.round(rule.weight * 0.5);
            reason = `HTML CTA contrast (${ctaAnalysis.contrastRatio}:1) is below WCAG AA standard (4.5:1).`;
          }
        } else {
          pass = false;
          status = 'warning';
          earned = Math.round(rule.weight * 0.5);
          reason = 'Accessibility, contrast, alt text, and dark-mode behavior require verification.';
        }
      }

      return {
        ...rule,
        pass,
        status,
        earned,
        reason,
      };
    });

    const totalWeight = evaluatedRules.reduce((total, rule) => total + rule.weight, 0);
    const earnedWeight = evaluatedRules.reduce((total, rule) => total + rule.earned, 0);
    const score = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;

    const ratingBadge = score >= 85
      ? { label: 'Strong Match', badgeClass: 'rating-badge-strong' }
      : score >= 70
        ? { label: 'Needs Refinement', badgeClass: 'rating-badge-warn' }
        : { label: 'High Risk', badgeClass: 'rating-badge-risk' };

    // Set score immediately; simulations load asynchronously
    setAuditResults({
      score,
      ratingBadge,
      evaluatedRules,
      simulations: null,
      ctaAnalysis,
    });
    setHasCalculated(true);
    setSimulationsLoading(true);
    setSimulationsError(null);

    try {
      const simulations = await generateInboxSimulations(subjectLine, preHeader, emailCopy);
      setAuditResults((prev) => ({ ...prev, simulations }));
    } catch (err) {
      console.warn('Simulation error, using deterministic extractor:', err);
      const fallbackSimulations = generateDeterministicEmailSummaries(subjectLine, preHeader, emailCopy);
      setAuditResults((prev) => ({ ...prev, simulations: fallbackSimulations }));
    } finally {
      setSimulationsLoading(false);
    }
  };

  return (
    <div className={`app-shell ${darkMode ? 'theme-dark' : 'theme-light'}`}>
      <header className="app-header">
        <div className="app-header-inner">
          <div className="brand-group">
            <div className="brand-logo">
              <span>T</span>
            </div>
            <div>
              <span className="brand-title">Tilte</span>
              <p className="brand-subtitle">
                Email Campaign Readiness Studio
              </p>
            </div>
          </div>

          <div className="header-actions">
            <nav className="nav-tabs">
              <button
                type="button"
                onClick={() => setActiveTab('studio')}
                className={`nav-tab ${activeTab === 'studio' ? 'nav-tab-active' : ''}`}
              >
                <Edit3 className="icon-xs" />
                <span>Audit Studio</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('report')}
                className={`nav-tab ${activeTab === 'report' ? 'nav-tab-active' : ''}`}
              >
                <FileText className="icon-xs" />
                <span>Client Report</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('methodology')}
                className={`nav-tab ${activeTab === 'methodology' ? 'nav-tab-active' : ''}`}
              >
                <BookOpen className="icon-xs" />
                <span className="nav-tab-label">
                  <span>Current Methodologies</span>
                  {userRole === 'admin' ? <span className="admin-dot" title="Admin Edit Rights Active" /> : null}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('design')}
                className={`nav-tab ${activeTab === 'design' ? 'nav-tab-active' : ''}`}
              >
                <Sparkles className="icon-xs" />
                <span>Design Review</span>
              </button>
            </nav>

            <div className="user-controls">
              {user && !user.isAnonymous ? (
                <div className="user-badge">
                  <span className="user-email">
                    {user.email}
                  </span>
                  <button type="button" onClick={handleSignOut} title="Sign Out" className="icon-btn">
                    <LogOut className="icon-xs" />
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => setShowAuthModal(true)} className="btn-primary-sm">
                  Sign In
                </button>
              )}

              <button
                type="button"
                aria-label="Toggle theme"
                onClick={toggleTheme}
                className="theme-toggle-btn"
              >
                {darkMode ? <Sun className="icon-sm" /> : <Moon className="icon-sm" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {showAuthModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <h3 className="modal-title">{authMode === 'login' ? 'Tilte Team Authentication' : 'Create Campaign Studio Account'}</h3>
                <p className="modal-subtitle">
                  Connect for real-time Firestore sync &amp; role governance.
                </p>
              </div>
              <button type="button" onClick={() => setShowAuthModal(false)} className="modal-close-btn">
                <X className="icon-md" />
              </button>
            </div>

            {authError && <div className="auth-error-banner">{authError}</div>}

            <form onSubmit={handleAuthSubmit} className="modal-form">
              <div className="form-field">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@tilte.com"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-field">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="form-input"
                />
              </div>

              <button type="submit" className="btn-submit-full">
                {authMode === 'login' ? 'Sign In' : 'Register Account'}
              </button>
            </form>

            <div className="divider-row">
              <div className="divider-line" />
              <span className="divider-label">Or</span>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="btn-secondary-full"
            >
              <span>Sign in with Google</span>
            </button>

            <div className="auth-switch-row">
              <button type="button" onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} className="auth-switch-btn">
                {authMode === 'login' ? "Don't have an account? Create one" : 'Already have an account? Sign in'}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="app-main">
        {activeTab === 'studio' && (
          <div className="tab-section">
            <div className="stepper-bar" role="tablist" aria-label="Audit steps">
              {[
                { id: 'metadata', label: 'Campaign Metadata & Objectives', number: '01' },
                { id: 'verification', label: 'Manual Verification Checkpoints', number: '02' },
                { id: 'content', label: 'Email Content & Headers', number: '03' },
              ].map((step) => (
                <button
                  key={step.id}
                  type="button"
                  role="tab"
                  aria-selected={auditStep === step.id}
                  onClick={() => setAuditStep(step.id)}
                  className={`stepper-tab ${auditStep === step.id ? 'stepper-tab-active' : ''}`}
                >
                  <span className="stepper-num">{step.number}</span>
                  <span>{step.label}</span>
                </button>
              ))}
            </div>

            {auditStep === 'metadata' && (
              <div className="section-card">
                <h3 className="section-heading">
                  <Building2 className="icon-sm" />
                  <span>Campaign Metadata &amp; Objectives</span>
                </h3>

                <div className="form-grid-2">
                  <div className="form-field">
                    <label className="form-label">Client Name</label>
                    <input type="text" placeholder="e.g. Acme Group" value={clientName} onChange={(e) => setClientName(e.target.value)} className="form-input" />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Campaign Name</label>
                    <input type="text" placeholder="e.g. Spring Product Launch" value={campaignName} onChange={(e) => setCampaignName(e.target.value)} className="form-input" />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-field">
                    <label className="form-label">Target Audience Segment</label>
                    <input type="text" placeholder="e.g. New subscribers" value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} className="form-input" />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Core Action / Desired Outcome</label>
                    <input type="text" placeholder="e.g. Drive product trial signups" value={coreGoal} onChange={(e) => setCoreGoal(e.target.value)} className="form-input" />
                  </div>
                </div>
              </div>
            )}

            {auditStep === 'verification' && (
              <div className="section-card">
                <div>
                  <h3 className="section-heading">Manual Verification Checkpoints</h3>
                  <p className="section-desc">
                    Confirm these using your sending platform, DNS records, policy documentation, or rendered-email tests. Unchecked items receive no points.
                  </p>
                </div>
                <div className="checkpoints-grid">
                  {MANUAL_CHECKPOINTS.map((checkpoint) => (
                    <label key={checkpoint.id} className="checkpoint-item">
                      <input
                        type="checkbox"
                        checked={manualChecks[checkpoint.id]}
                        onChange={(event) => {
                          setManualChecks((current) => ({ ...current, [checkpoint.id]: event.target.checked }));
                          setHasCalculated(false);
                          setAuditResults(null);
                        }}
                        className="checkpoint-checkbox"
                      />
                      <span>{checkpoint.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {auditStep === 'content' && (
              <div className="section-card">
                <h3 className="section-heading">
                  <Mail className="icon-sm" />
                  <span>Email Content &amp; Headers</span>
                </h3>

                <div className="form-field">
                  <div className="form-field-header">
                    <label className="form-label">Briefed Subject Line</label>
                    <span className={subjectLine.length > 65 ? 'char-counter-alert' : 'char-counter'}>
                      {subjectLine.length} chars (optimal 20–65)
                    </span>
                  </div>
                  <input type="text" placeholder="e.g. Discover what’s new this season" value={subjectLine} onChange={(e) => setSubjectLine(e.target.value)} className="form-input" />
                </div>

                <div className="form-field">
                  <div className="form-field-header">
                    <label className="form-label">Briefed Pre-Header (Preview Text)</label>
                    <span className={preHeader.length < 20 && preHeader.length > 0 ? 'char-counter-alert' : 'char-counter'}>
                      {preHeader.length} chars
                    </span>
                  </div>
                  <input type="text" placeholder="e.g. Explore the latest updates and find your next step." value={preHeader} onChange={(e) => setPreHeader(e.target.value)} className="form-input" />
                </div>

                <div className="form-field">
                  <label className="form-label">Full Email Copy (Live Text or HTML)</label>
                  <textarea rows={10} placeholder="Paste complete message body text or HTML code here..." value={emailCopy} onChange={(e) => setEmailCopy(e.target.value)} className="form-textarea" />
                </div>
                <div className="cta-submit-wrap">
                  <button type="button" onClick={handleCalculateScore} className="btn-generate-score">
                    <Zap className="zap-icon" />
                    <span>Generate Readiness Score</span>
                  </button>
                  <p className="cta-submit-note">
                    Scores and AI inbox simulations are calculated strictly upon clicking this CTA.
                  </p>
                </div>
              </div>
            )}

            {hasCalculated && auditResults && (
              <div className="section-card">
                <div className="scorecard-header">
                  <div>
                    <span className="scorecard-eyebrow">Tilte Readiness Scorecard</span>
                    <div className="scorecard-value-row">
                      <span className="scorecard-number">{auditResults.score}</span>
                      <span className="scorecard-max">/100</span>
                    </div>
                  </div>

                  <div className="scorecard-meta">
                    <span className={`rating-badge ${auditResults.ratingBadge.badgeClass}`}>
                      {auditResults.ratingBadge.label}
                    </span>
                    <p className="scorecard-subtext">
                      Evaluated against {rules.length} active 2027 rules
                    </p>
                  </div>
                </div>

                <div className="pillars-header">
                  <h4 className="pillars-title">Pillar Breakdown</h4>
                  <span className="pillars-subtitle">All 15 criteria evaluated across 3 strategic pillars</span>
                </div>

                <div className="pillars-grid">
                  {[
                    { index: 1, name: '01 / The Science of Getting In', icon: ShieldCheck },
                    { index: 2, name: '02 / The Art of Standing Out', icon: Smartphone },
                    { index: 3, name: '03 / The Intelligence Behind Results', icon: Cpu },
                  ].map((pillar) => {
                    const pillarRules = auditResults.evaluatedRules.filter((r) => r.pillarIndex === pillar.index);
                    const pillarEarned = pillarRules.reduce((acc, r) => acc + r.earned, 0);
                    const pillarMax = pillarRules.reduce((acc, r) => acc + r.weight, 0);
                    const IconComponent = pillar.icon;

                    return (
                      <div key={pillar.index} className="pillar-card">
                        <div className="pillar-card-header">
                          <div className="pillar-title-group">
                            <div className="pillar-icon-box">
                              <IconComponent className="icon-sm" />
                            </div>
                            <div>
                              <span className="pillar-name">{pillar.name}</span>
                              <span className="pillar-count">
                                {pillarRules.length} criteria evaluated
                              </span>
                            </div>
                          </div>

                          <span className="pillar-points-badge">
                            {pillarEarned} / {pillarMax} pts
                          </span>
                        </div>

                        <div className="pillar-rules-list">
                          {pillarRules.map((rule) => (
                            <div key={rule.id} className="rule-eval-card">
                              <div className="rule-eval-left">
                                <span className="rule-eval-status">
                                  {rule.status === 'pass' && <CheckCircle2 className="icon-xs status-pass" />}
                                  {rule.status === 'warning' && <AlertTriangle className="icon-xs status-warning" />}
                                  {rule.status === 'alert' && <AlertOctagon className="icon-xs status-alert" />}
                                </span>
                                <div>
                                  <p className="rule-eval-title">{rule.code}. {rule.title}</p>
                                  <p className="rule-eval-reason">{rule.reason}</p>
                                </div>
                              </div>

                              <div className="rule-eval-score">
                                <span className={rule.status === 'pass' ? 'status-pass' : rule.status === 'warning' ? 'status-warning' : 'status-alert'}>
                                  {rule.earned}/{rule.weight}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="section-card">
              <div className="sim-header">
                <div className="sim-title-group">
                  <div className="sim-icon-box">
                    <Cpu className="icon-md" />
                  </div>
                  <div>
                    <h3 className="sim-heading">Simulated AI Inbox Output &amp; Summaries</h3>
                    <p className="section-desc">
                      Side-by-side behavioral modeling across current generation AI inboxes.
                    </p>
                  </div>
                </div>

                <div className="sim-disclaimer">
                  <Info className="icon-xs status-alert" />
                  <span>
                    <strong>Disclaimer:</strong> Rough approximations based on observed LLM behavior (Apple Intelligence, Gemini, Outlook Copilot). Not guaranteed inbox placements.
                  </span>
                </div>
              </div>

              {hasCalculated && auditResults ? (
                <div className="sim-grid">
                  {/* ── Apple Mail ── */}
                  <div className="sim-card">
                    <div className="sim-card-top">
                      <div className="sim-card-header">
                        <span className="sim-provider-apple">Apple Mail (Apple Intelligence)</span>
                        <span className="sim-badge sim-badge-apple">Notification Card</span>
                      </div>
                      {simulationsLoading ? (
                        <div className="sim-loading">
                          <svg className="sim-spinner" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
                            <path fill="currentColor" d="M4 12a8 8 0 018-8v8z" opacity="0.75" />
                          </svg>
                          <span>Apple Intelligence is summarising…</span>
                        </div>
                      ) : (
                        <p className="sim-quote">&ldquo;{auditResults.simulations?.apple}&rdquo;</p>
                      )}
                    </div>
                    <div className="sim-card-footer">
                      Extracted Deadline: <strong>{auditResults.simulations?.extractedDate ?? '—'}</strong>
                    </div>
                  </div>

                  {/* ── Gmail / Gemini ── */}
                  <div className="sim-card">
                    <div className="sim-card-top">
                      <div className="sim-card-header">
                        <span className="sim-provider-gmail">Gmail with Gemini</span>
                        <span className="sim-badge sim-badge-gmail">Top-of-Thread</span>
                      </div>
                      {simulationsLoading ? (
                        <div className="sim-loading">
                          <svg className="sim-spinner" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
                            <path fill="currentColor" d="M4 12a8 8 0 018-8v8z" opacity="0.75" />
                          </svg>
                          <span>Gemini is generating highlights…</span>
                        </div>
                      ) : (
                        <ul className="sim-bullets">
                          {(auditResults.simulations?.gemini ?? []).map((b, i) => (
                            <li key={i} className="sim-bullet-item">
                              <span className="sim-bullet-dot">•</span>
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="sim-card-footer">
                      Detected Amount: <strong>{auditResults.simulations?.extractedAmount ?? '—'}</strong>
                    </div>
                  </div>

                  {/* ── Outlook Copilot ── */}
                  <div className="sim-card">
                    <div className="sim-card-top">
                      <div className="sim-card-header">
                        <span className="sim-provider-outlook">Outlook Copilot</span>
                        <span className="sim-badge sim-badge-outlook">Summary Card</span>
                      </div>
                      {simulationsLoading ? (
                        <div className="sim-loading">
                          <svg className="sim-spinner" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
                            <path fill="currentColor" d="M4 12a8 8 0 018-8v8z" opacity="0.75" />
                          </svg>
                          <span>Copilot is drafting the summary card…</span>
                        </div>
                      ) : (
                        <p className="sim-prose">{auditResults.simulations?.copilot}</p>
                      )}
                    </div>
                    <div className="sim-card-footer">
                      Extracted CTA: <strong>{auditResults.simulations?.extractedCta ?? '—'}</strong>
                    </div>
                  </div>

                  {/* ── Error / API key notice ── */}
                  {simulationsError && (
                    <div className="sim-error-banner">
                      <Info className="icon-xs" />
                      <span>{simulationsError}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="sim-empty-state">
                  <p>Simulated AI inbox extractions will populate automatically when you generate the score above.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'report' && (
          <div className="tab-section">
            <div className="report-toolbar print-hidden">
              <div className="report-toolbar-info">
                <FileText className="icon-md" />
                <div>
                  <h3 className="section-heading">Client Executive Summary Report</h3>
                  <p className="section-desc">
                    Print-ready deliverable format. Free of commercial packages and pricing.
                  </p>
                </div>
              </div>

              <button type="button" onClick={() => window.print()} className="btn-print">
                <Printer className="icon-sm" />
                <span>Print / Save PDF</span>
              </button>
            </div>

            <div className="report-sheet">
              <div className="report-header">
                <div>
                  <div className="report-brand-row">
                    <span className="report-brand-name">TILTE</span>
                    <span className="report-brand-tag">READINESS STUDIO</span>
                  </div>
                  <p className="report-subtitle">Email Campaign Audit &amp; AI Inbox Performance Report</p>
                </div>

                <div className="report-meta">
                  <p><strong>Client:</strong> {clientName || 'Not provided'}</p>
                  <p><strong>Campaign:</strong> {campaignName || 'Not provided'}</p>
                  <p><strong>Audited Date:</strong> {new Date().toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                </div>
              </div>

              <div className="report-summary-box">
                <div className="report-score-col">
                  <span className="scorecard-eyebrow">Overall Readiness Index</span>
                  <div className="scorecard-value-row">
                    <span className="report-score-num">{hasCalculated && auditResults ? auditResults.score : '--'}</span>
                    <span className="report-score-max">/100</span>
                  </div>
                  <span className={`rating-badge ${hasCalculated && auditResults ? auditResults.ratingBadge.badgeClass : 'rating-badge-pending'}`}>
                    {hasCalculated && auditResults ? auditResults.ratingBadge.label : 'Pending Evaluation'}
                  </span>
                </div>

                <div className="report-context-col">
                  <h4 className="report-context-title">Executive Evaluation Context</h4>
                  <p className="report-context-text">
                    This email was systematically tested against the 15 pillars of the 2027 Email Best Practices. With modern inboxes deploying automatic LLM summarizers, live-text clarity, clear deadlines, and single-intent actions are critical to prevent customer drop-off before opening.
                  </p>
                  <div className="report-targets-row">
                    <span>Target Goal: {coreGoal || 'Not provided'}</span>
                    <span>•</span>
                    <span>Audience: {targetAudience || 'Not provided'}</span>
                  </div>
                </div>
              </div>

              <div className="report-section">
                <h3 className="report-section-title">Observed AI Inbox Extract Simulations</h3>
                <p className="report-note">Note: Inbox summaries are estimated based on observed LLM behavior (Apple Intelligence, Gemini, Outlook Copilot).</p>

                <div className="report-sim-grid">
                  <div className="report-sim-box">
                    <strong>Apple Mail Summary</strong>
                    {simulationsLoading ? (
                      <p className="report-note">Generating…</p>
                    ) : (
                      <p className="sim-quote">&ldquo;{hasCalculated && auditResults ? auditResults.simulations?.apple : 'Pending generation.'}&rdquo;</p>
                    )}
                  </div>

                  <div className="report-sim-box">
                    <strong>Gmail Gemini Highlights</strong>
                    <ul className="report-sim-list">
                      {simulationsLoading ? (
                        <li className="report-note">Generating…</li>
                      ) : hasCalculated && auditResults ? (
                        auditResults.simulations?.gemini.map((b, i) => <li key={i}>• {b}</li>)
                      ) : (
                        <li>• Pending generation.</li>
                      )}
                    </ul>
                  </div>

                  <div className="report-sim-box">
                    <strong>Outlook Copilot Card</strong>
                    {simulationsLoading ? (
                      <p className="report-note">Generating…</p>
                    ) : (
                      <p className="sim-prose">{hasCalculated && auditResults ? auditResults.simulations?.copilot : 'Pending generation.'}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="report-section">
                <h3 className="report-section-title">Submitted Subject &amp; Copy Breakdown</h3>

                <div className="report-copy-box">
                  <p><strong>Subject:</strong> {subjectLine || 'N/A'}</p>
                  <p><strong>Pre-Header:</strong> {preHeader || 'N/A'}</p>
                  <div className="report-copy-body">
                    <strong>Body Text Content:</strong>
                    <pre className="report-pre">{emailCopy || 'No copy provided.'}</pre>
                  </div>
                </div>
              </div>

              <div className="report-footer">
                <span>© 2027 Tilte Email Campaign Readiness Studio. All rights reserved.</span>
                <span>Confidential QA Deliverable</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'methodology' && (
          <div className="tab-section">
            <div className="section-card">
              <div className="methodology-header">
                <div>
                  <div className="methodology-title-row">
                    <BookOpen className="icon-md" />
                    <h2 className="methodology-heading">Current Methodologies &amp; Knowledge Base</h2>
                    <span className={`role-badge ${userRole === 'admin' ? 'role-badge-admin' : 'role-badge-viewer'}`}>
                      {userRole === 'admin' ? 'Editing Enabled' : 'View Only'}
                    </span>
                  </div>
                  <p className="section-desc">
                    NotebookLM-style split workspace. Global methodology updates are synchronized in Firestore.
                  </p>
                </div>

                <div className="methodology-actions">
                  {userRole === 'admin' ? (
                    <>
                      <button type="button" onClick={handleResetToDefaultMethodology} title="Reset rules to 2027 baseline" className="icon-btn">
                        <RotateCcw className="icon-sm" />
                      </button>

                      <button type="button" onClick={() => setIsAddRuleModalOpen(true)} className="btn-print">
                        <Plus className="icon-sm" />
                        <span>Add Methodology Rule</span>
                      </button>
                    </>
                  ) : (
                    <div className="readonly-notice">
                      <Lock className="icon-xs" />
                      <span>Editing access is limited to approved administrators</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {(isSavingMethodology || methodologyStatusMsg) && (
              <div className="save-banner">
                <CheckCircle2 className="icon-sm" />
                <span>{methodologyStatusMsg || 'Saving methodology...'}</span>
              </div>
            )}

            <div className="methodology-grid">
              <div className="section-card sources-col">
                <div className="col-header">
                  <h3 className="section-heading">
                    <FileText className="icon-sm" />
                    <span>Grounding Sources ({sources.length})</span>
                  </h3>
                </div>

                <div className="sources-list">
                  {sources.map((src) => (
                    <div
                      key={src.id}
                      onClick={() => setSelectedSource(src)}
                      className={`source-card ${selectedSource.id === src.id ? 'source-card-active' : ''}`}
                    >
                      <div className="source-card-top">
                        <span className="source-category-tag">{src.category}</span>
                        <span className="source-date">{src.date}</span>
                      </div>
                      <h4 className="source-title">{src.title}</h4>
                      <p className="source-snippet">{src.snippet}</p>
                    </div>
                  ))}
                </div>

                <div className="source-detail-box">
                  <span className="source-detail-eyebrow">Selected Source Detail</span>
                  <h4 className="source-title">{selectedSource.title}</h4>
                  <p className="source-snippet">{selectedSource.snippet}</p>
                </div>
              </div>

              <div className="section-card rules-col">
                <div className="col-header">
                  <h3 className="section-heading">Active Criteria &amp; Scoring Weight Rules ({rules.length})</h3>
                  <div className="methodology-actions">
                    <span className="scorecard-subtext">Total Max Weight: {rules.reduce((acc, r) => acc + r.weight, 0)} pts</span>
                    {userRole === 'admin' && <span className="cloud-sync-tag">• Cloud-Synced</span>}
                  </div>
                </div>

                <div className="rules-list">
                  {rules.map((rule) => (
                    <div key={rule.id} className="methodology-rule-card">
                      <div className="methodology-rule-left">
                        <span className="rule-code-badge">{rule.code}</span>
                        <div>
                          <div className="methodology-rule-title-row">
                            <h4 className="source-title">{rule.title}</h4>
                            <span className="rule-pillar-pill">{rule.pillar}</span>
                          </div>
                          <p className="source-snippet">{rule.desc}</p>
                        </div>
                      </div>

                      <div className="methodology-rule-right">
                        <span className="rule-weight-badge">{rule.weight} pts</span>
                        {userRole === 'admin' ? (
                          <button type="button" onClick={() => handleDeleteRule(rule.id)} className="btn-delete-rule" title="Remove rule (Admin)">
                            <Trash2 className="icon-sm" />
                          </button>
                        ) : (
                          <span title="Read-only criteria"><Lock className="icon-xs" /></span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {isAddRuleModalOpen && userRole === 'admin' && (
              <div className="modal-backdrop">
                <div className="modal-card modal-card-md">
                  <div className="modal-header">
                    <h3 className="modal-title">Add Custom Methodology Rule (Admin)</h3>
                    <button type="button" onClick={() => setIsAddRuleModalOpen(false)} className="modal-close-btn">
                      <X className="icon-md" />
                    </button>
                  </div>

                  <form onSubmit={handleAddRule} className="modal-form">
                    <div className="form-field">
                      <label className="form-label">Pillar Group</label>
                      <select value={newRule.pillarIndex} onChange={(e) => setNewRule({ ...newRule, pillarIndex: Number(e.target.value) })} className="form-select">
                        <option value={1}>01 / The Science of Getting In</option>
                        <option value={2}>02 / The Art of Standing Out</option>
                        <option value={3}>03 / The Intelligence Behind Results</option>
                      </select>
                    </div>

                    <div className="form-field">
                      <label className="form-label">Rule Title</label>
                      <input type="text" placeholder="e.g. BIMI SVG Logo Compliance" value={newRule.title} onChange={(e) => setNewRule({ ...newRule, title: e.target.value })} className="form-input" required />
                    </div>

                    <div className="form-field">
                      <label className="form-label">Description</label>
                      <textarea rows={2} placeholder="Explain evaluation criteria..." value={newRule.desc} onChange={(e) => setNewRule({ ...newRule, desc: e.target.value })} className="form-textarea" />
                    </div>

                    <div className="form-field">
                      <label className="form-label">Score Weight Points</label>
                      <input type="number" min="1" max="20" value={newRule.weight} onChange={(e) => setNewRule({ ...newRule, weight: e.target.value })} className="form-input" />
                    </div>

                    <div className="modal-actions">
                      <button type="button" onClick={() => setIsAddRuleModalOpen(false)} className="btn-cancel">
                        Cancel
                      </button>
                      <button type="submit" className="btn-save-rule">
                        Save &amp; Sync Rule
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'design' && (
          <CreativeScanner />
        )}
      </main>
    </div>
  );
}
