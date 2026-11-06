import React, { useState, useEffect } from 'react';
import {
  signInWithCustomToken,
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  collection,
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
  Palette,
  Eye,
  Target,
  MousePointer,
  Info,
  Sun,
  Moon,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Smartphone,
  X,
  Lock,
  User,
  LogOut,
  ShieldAlert,
  RotateCcw,
} from 'lucide-react';

import { auth, db, SUPER_ADMIN_EMAIL, APP_ID } from './firebase';

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
  { id: 'personalizationData', ruleId: 'r11', label: 'Personalization data, consent, and fallback behavior have been validated.' },
  { id: 'sendCadence', ruleId: 'r12', label: 'Lifecycle timing and frequency limits are configured for this audience.' },
  { id: 'aiReadability', ruleId: 'r13', label: 'Dates, amounts, and next steps are clear and accurate in the final rendered email.' },
  { id: 'measurement', ruleId: 'r14', label: 'Click and conversion tracking are configured and have been tested.' },
  { id: 'experimentation', ruleId: 'r15', label: 'A test hypothesis, audience split, and success measure are documented.' },
];

export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState('studio');
  const [auditStep, setAuditStep] = useState('metadata');
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('campaign_manager');
  const [authLoading, setAuthLoading] = useState(true);
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
  const [expandedPillars, setExpandedPillars] = useState({ 1: false, 2: false, 3: false });
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
  const [designFile, setDesignFile] = useState(null);
  const [designFileName, setDesignFileName] = useState('');
  const [designPreviewUrl, setDesignPreviewUrl] = useState('');
  const [designScanStatus, setDesignScanStatus] = useState('');
  const [isScanningDesign, setIsScanningDesign] = useState(false);
  const [creativeSubject, setCreativeSubject] = useState('');
  const [creativePreheader, setCreativePreheader] = useState('');
  const [designBriefContent, setDesignBriefContent] = useState('');
  const [creativeAuditRun, setCreativeAuditRun] = useState(false);
  const [creativeFindings, setCreativeFindings] = useState(null);

  const isCurrentUserAdmin = userRole === 'admin' || (user?.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase());

  useEffect(() => {
    if (!designPreviewUrl) return undefined;
    return () => URL.revokeObjectURL(designPreviewUrl);
  }, [designPreviewUrl]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setUser(null);
        setUserRole('campaign_manager');
        setAuthLoading(false);
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
      } finally {
        setAuthLoading(false);
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
            if (!selectedSource) setSelectedSource(data.sources[0]);
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

  const handleRunCreativeReview = async () => {
    if (!designFile) {
      setDesignScanStatus('Upload the final email design before running the scan.');
      return;
    }

    setIsScanningDesign(true);
    setDesignScanStatus('Preparing final design for scanning...');
    setCreativeAuditRun(false);
    setCreativeFindings(null);

    let worker;
    try {
      const canvases = [];
      if (designFile.type === 'application/pdf' || designFile.name.toLowerCase().endsWith('.pdf')) {
        const pdfjs = await import('pdfjs-dist');
        const pdfWorker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
        pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker.default;
        const pdf = await pdfjs.getDocument({ data: await designFile.arrayBuffer() }).promise;
        const pageCount = Math.min(pdf.numPages, 10);
        for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
          setDesignScanStatus(`Rendering PDF page ${pageNumber} of ${pageCount}...`);
          const page = await pdf.getPage(pageNumber);
          const baseViewport = page.getViewport({ scale: 1 });
          const viewport = page.getViewport({ scale: Math.min(1.5, 1600 / Math.max(baseViewport.width, baseViewport.height)) });
          const canvas = document.createElement('canvas');
          canvas.width = Math.ceil(viewport.width);
          canvas.height = Math.ceil(viewport.height);
          await page.render({ canvas, canvasContext: canvas.getContext('2d', { willReadFrequently: true }), viewport }).promise;
          canvases.push(canvas);
        }
        if (pdf.numPages > pageCount) {
          setDesignScanStatus(`Scanning the first ${pageCount} of ${pdf.numPages} PDF pages...`);
        }
      } else if (designFile.type.startsWith('image/')) {
        const imageUrl = URL.createObjectURL(designFile);
        try {
          const image = new Image();
          image.src = imageUrl;
          await image.decode();
          const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
          canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
          canvas.getContext('2d', { willReadFrequently: true }).drawImage(image, 0, 0, canvas.width, canvas.height);
          canvases.push(canvas);
        } finally {
          URL.revokeObjectURL(imageUrl);
        }
      } else {
        throw new Error('Use a PNG, JPG, WEBP, SVG, or PDF export for the design scan.');
      }

      const { createWorker } = await import('tesseract.js');
      worker = await createWorker('eng');
      const recognizedPages = [];
      const ctaCandidates = [];
      const visualCtaCandidates = [];
      const colorCounts = new Map();
      let totalConfidence = 0;
      const ctaPattern = /\b(start|shop|buy|register|subscribe|download|explore|discover|view|apply|donate|contact|reply|sign\s*up|learn|book|confirm|renew|review|schedule|claim|try|get|request|visit)\b/i;

      for (const [index, canvas] of canvases.entries()) {
        setDesignScanStatus(`Scanning text and colors on page ${index + 1} of ${canvases.length}...`);
        const result = await worker.recognize(canvas, {}, { blocks: true, tsv: true });
        recognizedPages.push(result.data.text.trim());
        totalConfidence += result.data.confidence || 0;
        const recognizedWords = result.data.words || result.data.blocks?.flatMap((block) =>
          block.paragraphs?.flatMap((paragraph) => paragraph.lines?.flatMap((line) => line.words || []) || []) || [],
        ) || [];
        const tsvWords = (result.data.tsv || '').split(/\r?\n/).slice(1).flatMap((row) => {
          const columns = row.split('\t');
          if (columns.length < 12 || columns[0] !== '5') return [];
          const [x, y, wordWidth, wordHeight, confidence] = columns.slice(6, 11).map(Number);
          const text = columns.slice(11).join('\t').trim();
          if (!text || !Number.isFinite(x) || !Number.isFinite(y)) return [];
          return [{ text, confidence, bbox: { x0: x, y0: y, x1: x + wordWidth, y1: y + wordHeight } }];
        });
        const ctaWords = (recognizedWords.length ? recognizedWords : tsvWords)
          .filter((word) => ctaPattern.test(word.text) && word.bbox && (word.confidence || 0) >= 30);
        if (ctaWords.length) {
          ctaCandidates.push(...ctaWords.map((word) => ({ text: word.text.trim(), canvas, bbox: word.bbox })));
        } else {
          const ctaLine = result.data.lines?.find((line) => ctaPattern.test(line.text));
          if (ctaLine?.bbox) ctaCandidates.push({ text: ctaLine.text.trim(), canvas, bbox: ctaLine.bbox });
        }

        const context = canvas.getContext('2d', { willReadFrequently: true });
        const { data, width, height } = context.getImageData(0, 0, canvas.width, canvas.height);
        const step = Math.max(1, Math.floor(Math.sqrt((width * height) / 40000)));
        const pageColorBounds = new Map();
        for (let y = 0; y < height; y += step) {
          for (let x = 0; x < width; x += step) {
            const pixelIndex = (y * width + x) * 4;
            if (data[pixelIndex + 3] < 180) continue;
            const color = [data[pixelIndex], data[pixelIndex + 1], data[pixelIndex + 2]]
              .map((channel) => Math.min(255, Math.floor(channel / 16) * 16 + 8));
            const hex = `#${color.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
            colorCounts.set(hex, (colorCounts.get(hex) || 0) + 1);
            const bounds = pageColorBounds.get(hex) || { count: 0, x0: x, y0: y, x1: x, y1: y };
            bounds.count += 1;
            bounds.x0 = Math.min(bounds.x0, x);
            bounds.y0 = Math.min(bounds.y0, y);
            bounds.x1 = Math.max(bounds.x1, x);
            bounds.y1 = Math.max(bounds.y1, y);
            pageColorBounds.set(hex, bounds);
          }
        }
        for (const [hex, bounds] of pageColorBounds) {
          const rgb = hex.match(/[0-9a-f]{2}/gi).map((channel) => parseInt(channel, 16));
          const boxWidth = bounds.x1 - bounds.x0 + step;
          const boxHeight = bounds.y1 - bounds.y0 + step;
          const gridArea = (Math.floor((bounds.x1 - bounds.x0) / step) + 1) * (Math.floor((bounds.y1 - bounds.y0) / step) + 1);
          const density = bounds.count / Math.max(1, gridArea);
          const chroma = Math.max(...rgb) - Math.min(...rgb);
          if (bounds.count >= 40 && density >= 0.62 && chroma >= 48 && boxWidth >= 48 && boxHeight >= 18 && boxWidth / boxHeight >= 1.25 && boxWidth / boxHeight <= 10) {
            visualCtaCandidates.push({
              text: '',
              canvas,
              bbox: { x0: bounds.x0, y0: bounds.y0, x1: bounds.x1 + step, y1: bounds.y1 + step },
              solidFill: { rgb, coverage: density },
            });
          }
        }
      }

      const recognizedText = recognizedPages.filter(Boolean).join('\n\n');
      const lines = recognizedText.split(/\n+/).map((line) => line.trim()).filter(Boolean);
      const fallbackCta = lines.find((line) => ctaPattern.test(line)) || '';
      const normalize = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
      const compareBriefCopy = (brief, finalCopy) => {
        const briefWords = new Set(normalize(brief).split(/\s+/).filter(Boolean));
        const finalWords = new Set(normalize(finalCopy).split(/\s+/).filter(Boolean));
        if (!briefWords.size || !finalWords.size) return null;
        const sharedWords = [...briefWords].filter((word) => finalWords.has(word)).length;
        return Math.round((sharedWords / new Set([...briefWords, ...finalWords]).size) * 100);
      };
      const subjectMatch = compareBriefCopy(subjectLine, creativeSubject);
      const preheaderMatch = compareBriefCopy(preHeader, creativePreheader);
      const copyScores = [subjectMatch, preheaderMatch].filter((score) => score !== null);
      const briefAlignmentScore = copyScores.length
        ? Math.round(copyScores.reduce((total, score) => total + score, 0) / copyScores.length)
        : null;

      const analyzeCtaButton = ({ canvas, bbox, solidFill }) => {
        const { data, width, height } = canvas.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, canvas.width, canvas.height);
        const textBox = {
          x0: Math.max(0, Math.floor(bbox.x0)),
          y0: Math.max(0, Math.floor(bbox.y0)),
          x1: Math.min(width, Math.ceil(bbox.x1)),
          y1: Math.min(height, Math.ceil(bbox.y1)),
        };
        const textHeight = Math.max(1, textBox.y1 - textBox.y0);
        const padX = Math.max(10, Math.round(textHeight * 0.8));
        const padY = Math.max(8, Math.round(textHeight * 0.45));
        const buttonBox = solidFill ? textBox : {
          x0: Math.max(0, textBox.x0 - padX),
          y0: Math.max(0, textBox.y0 - padY),
          x1: Math.min(width, textBox.x1 + padX),
          y1: Math.min(height, textBox.y1 + padY),
        };
        const outsideBox = {
          x0: Math.max(0, buttonBox.x0 - padX),
          y0: Math.max(0, buttonBox.y0 - padY),
          x1: Math.min(width, buttonBox.x1 + padX),
          y1: Math.min(height, buttonBox.y1 + padY),
        };
        const quantize = (pixelIndex) => [data[pixelIndex], data[pixelIndex + 1], data[pixelIndex + 2]]
          .map((channel) => Math.min(255, Math.floor(channel / 16) * 16 + 8));
        const colorKey = (rgb) => rgb.map((channel) => channel.toString(16).padStart(2, '0')).join('');
        const collectColors = (bounds, accept, excludeColor = null) => {
          const counts = new Map();
          const stride = Math.max(1, Math.floor(Math.max(bounds.x1 - bounds.x0, bounds.y1 - bounds.y0) / 80));
          for (let y = bounds.y0; y < bounds.y1; y += stride) {
            for (let x = bounds.x0; x < bounds.x1; x += stride) {
              if (!accept(x, y)) continue;
              const pixelIndex = (y * width + x) * 4;
              if (data[pixelIndex + 3] < 180) continue;
              const rgb = quantize(pixelIndex);
              if (excludeColor && Math.sqrt(rgb.reduce((total, channel, channelIndex) => total + (channel - excludeColor[channelIndex]) ** 2, 0)) < 60) continue;
              const key = colorKey(rgb);
              counts.set(key, (counts.get(key) || 0) + 1);
            }
          }
          const [key, count] = [...counts.entries()].sort((left, right) => right[1] - left[1])[0] || [];
          return { rgb: key ? key.match(/.{2}/g).map((channel) => parseInt(channel, 16)) : null, coverage: count && counts.size ? count / [...counts.values()].reduce((sum, value) => sum + value, 0) : 0 };
        };
        const inBox = (box, x, y) => x >= box.x0 && x < box.x1 && y >= box.y0 && y < box.y1;
        const fill = solidFill || collectColors(buttonBox, (x, y) => !inBox(textBox, x, y));
        const outer = collectColors(outsideBox, (x, y) => !inBox(buttonBox, x, y));
        const text = collectColors(textBox, (x, y) => inBox(textBox, x, y), fill.rgb);
        const colorDistance = (left, right) => left && right
          ? Math.sqrt(left.reduce((total, channel, index) => total + (channel - right[index]) ** 2, 0))
          : 0;
        const luminance = (rgb) => {
          const channels = rgb.map((channel) => channel / 255).map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
          return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
        };
        const textContrast = fill.rgb && text.rgb
          ? (Math.max(luminance(fill.rgb), luminance(text.rgb)) + 0.05) / (Math.min(luminance(fill.rgb), luminance(text.rgb)) + 0.05)
          : null;
        const standoutColor = Boolean(fill.rgb && outer.rgb && colorDistance(fill.rgb, outer.rgb) >= 55 && Math.max(...fill.rgb) - Math.min(...fill.rgb) >= 40);
        const buttonAspectRatio = (buttonBox.x1 - buttonBox.x0) / Math.max(1, buttonBox.y1 - buttonBox.y0);
        return {
          buttonLike: fill.coverage >= 0.55 && colorDistance(fill.rgb, outer.rgb) >= 55 && buttonAspectRatio >= 1.25,
          standoutColor,
          fillColor: fill.rgb ? `#${colorKey(fill.rgb)}` : null,
          textColor: text.rgb ? `#${colorKey(text.rgb)}` : null,
          contrastRatio: textContrast ? Math.round(textContrast * 100) / 100 : null,
        };
      };
      const analyzedCtas = [...ctaCandidates, ...visualCtaCandidates].map((candidate) => ({ ...candidate, analysis: analyzeCtaButton(candidate) }));
      analyzedCtas.sort((left, right) => Number(right.analysis.buttonLike) - Number(left.analysis.buttonLike)
        || Number(right.analysis.standoutColor) - Number(left.analysis.standoutColor)
        || Number(Boolean(right.text)) - Number(Boolean(left.text))
        || (right.analysis.contrastRatio || 0) - (left.analysis.contrastRatio || 0));
      const selectedCta = analyzedCtas[0];
      const callToAction = selectedCta?.text || (selectedCta?.analysis.buttonLike ? '' : fallbackCta);
      const ctaButton = selectedCta?.analysis || null;
      const detectedColors = [...colorCounts.entries()]
        .sort((left, right) => right[1] - left[1])
        .slice(0, 8)
        .map(([hex]) => hex);
      const expectedColors = [...new Set(designBriefContent.match(/#[0-9a-f]{6}\b/gi) || [])];
      const matchedColors = expectedColors.filter((expected) => {
        const expectedRgb = expected.match(/[0-9a-f]{2}/gi).map((channel) => parseInt(channel, 16));
        return detectedColors.some((detected) => {
          const detectedRgb = detected.match(/[0-9a-f]{2}/gi).map((channel) => parseInt(channel, 16));
          const distance = Math.sqrt(expectedRgb.reduce((sum, channel, channelIndex) => sum + (channel - detectedRgb[channelIndex]) ** 2, 0));
          return distance <= 48;
        });
      });
      const vagueCta = callToAction && /click here|learn more|explore more|find out more/i.test(callToAction);

      setCreativeFindings({
        pagesScanned: canvases.length,
        wordCount: recognizedText.split(/\s+/).filter(Boolean).length,
        confidence: Math.round(totalConfidence / canvases.length),
        recognizedText: recognizedText || 'No readable text was detected in the uploaded design.',
        detectedColors,
        briefAlignmentScore,
        subjectMatch,
        preheaderMatch,
        ctaText: callToAction || (ctaButton?.buttonLike ? 'Button-like block detected; CTA label not readable' : 'No CTA text detected'),
        ctaButton,
        colorAdherence: expectedColors.length
          ? `${matchedColors.length} of ${expectedColors.length} brief colors were found in the sampled design palette.`
          : 'No hex colors were specified in the client design brief, so palette matching was not assessed.',
        ctaRecommendation: callToAction
          ? vagueCta
            ? `The scan found "${callToAction}". Consider replacing it with a specific action tied to the campaign goal.`
            : `The scan found this possible call to action: "${callToAction}". Review the button-shape, standout-color, and contrast checks below.`
          : ctaButton?.buttonLike
            ? 'A solid, standout button-like region was detected, but its label was not readable. Review its copy manually.'
            : 'No recognizable CTA text or button-like color region was detected in the scanned design.',
        contentMatch: [
          subjectMatch === null ? 'Enter the brief and final subject in Audit Studio and Creative Review to compare them.' : `Subject keyword overlap with brief: ${subjectMatch}%.`,
          preheaderMatch === null ? 'Enter the brief and final pre-header in Audit Studio and Creative Review to compare them.' : `Pre-header keyword overlap with brief: ${preheaderMatch}%.`,
        ].join(' '),
      });
      setCreativeAuditRun(true);
      setDesignScanStatus('Design scan complete.');
    } catch (error) {
      setDesignScanStatus(error.message || 'The design could not be scanned.');
    } finally {
      if (worker) await worker.terminate();
      setIsScanningDesign(false);
    }
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

  const togglePillar = (pillarIndex) => {
    setExpandedPillars((current) => ({
      ...current,
      [pillarIndex]: !current[pillarIndex],
    }));
  };

  const handleDesignFile = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setDesignFile(file);
      setDesignFileName(file.name);
      setDesignPreviewUrl(URL.createObjectURL(file));
      setCreativeAuditRun(false);
      setCreativeFindings(null);
      setDesignScanStatus('Ready to scan.');
    }
  };

  const handleCalculateScore = () => {
    if (!emailCopy.trim()) {
      alert('Please add a subject line and email copy before running the audit.');
      return;
    }

    const hasClearCta = /\[(.*?)\]/.test(emailCopy) || /\b(start|shop|buy|register|subscribe|download|explore|discover|view|apply|donate|contact|reply|sign up|learn|book|confirm|renew|review|schedule|claim|try|get|request|visit)\b/i.test(emailCopy);

    const evaluatedRules = rules.map((rule) => {
      const checkpoint = MANUAL_CHECKPOINTS.find((item) => item.ruleId === rule.id);
      const pass = checkpoint ? manualChecks[checkpoint.id] : rule.id === 'r10' && hasClearCta;
      const status = pass ? 'pass' : 'warning';
      const earned = pass ? rule.weight : 0;
      const reason = checkpoint
        ? pass
          ? 'Confirmed by the reviewer using the manual checkpoint.'
          : 'Not confirmed; this criterion cannot be verified from the submitted copy alone.'
        : rule.id === 'r10'
          ? pass
            ? 'A possible call to action was found in the submitted copy; review its clarity and prominence.'
            : 'No recognizable call to action was found in the submitted copy.'
          : 'No verification method is configured for this criterion.';

      return {
        ...rule,
        status,
        earned,
        reason,
      };
    });

    const totalWeight = evaluatedRules.reduce((total, rule) => total + rule.weight, 0);
    const earnedWeight = evaluatedRules.reduce((total, rule) => total + rule.earned, 0);
    const score = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;

    const ratingBadge = score >= 85
      ? { label: 'Strong Match', bg: 'bg-emerald-500', text: 'text-white' }
      : score >= 70
        ? { label: 'Needs Refinement', bg: 'bg-amber-500', text: 'text-white' }
        : { label: 'High Risk', bg: 'bg-[#FF002D]', text: 'text-white' };

    setAuditResults({
      score,
      ratingBadge,
      evaluatedRules,
      simulations: {
        apple: 'Submitted email content reviewed for message clarity and primary action.',
        gemini: ['Key message identified', 'Primary call to action assessed', 'Content clarity reviewed'],
        copilot: 'Primary action and supporting details assessed from the submitted copy.',
        extractedDate: 'Not detected',
        extractedAmount: 'Not detected',
        extractedCta: 'Not detected',
      },
    });
    setHasCalculated(true);
  };

  const teamPermissionsOpen = () => setIsTeamModalOpen(true);

  return (
    <div className={`min-h-screen font-sans transition-colors duration-200 ${darkMode ? 'bg-[#002837] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <header className={`border-b sticky top-0 z-40 backdrop-blur-md transition-colors ${darkMode ? 'bg-[#002837]/90 border-[#405E69]/60' : 'bg-white/95 border-[#BFC9CE]'}`}>
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#741532] bg-[#4D1B34] shadow-md">
              <span className="text-base font-black tracking-tighter text-white">T</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-base font-extrabold tracking-tight sm:text-lg">Tilte</span>
              </div>
              <p className={`hidden text-[11px] sm:block ${darkMode ? 'text-[#80949B]' : 'text-slate-500'}`}>
                Email Campaign Readiness Studio
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            <nav className={`flex rounded-xl border p-1 text-xs font-semibold sm:text-sm ${darkMode ? 'border-[#405E69] bg-[#002837]' : 'border-[#BFC9CE] bg-slate-100'}`}>
              <button
                type="button"
                onClick={() => setActiveTab('studio')}
                className={`flex items-center space-x-1.5 rounded-lg px-3 py-1.5 transition-all ${activeTab === 'studio' ? 'bg-[#405E69] text-white shadow-sm' : darkMode ? 'text-[#80949B] hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Audit Studio</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('report')}
                className={`flex items-center space-x-1.5 rounded-lg px-3 py-1.5 transition-all ${activeTab === 'report' ? 'bg-[#405E69] text-white shadow-sm' : darkMode ? 'text-[#80949B] hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Client Report</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('methodology')}
                className={`flex items-center space-x-1.5 rounded-lg px-3 py-1.5 transition-all ${activeTab === 'methodology' ? 'bg-[#405E69] text-white shadow-sm' : darkMode ? 'text-[#80949B] hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span className="flex items-center space-x-1">
                  <span>Current Methodologies</span>
                  {userRole === 'admin' ? <span className="h-1.5 w-1.5 rounded-full bg-[#FF002D]" title="Admin Edit Rights Active" /> : null}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('creative')}
                className={`flex items-center space-x-1.5 rounded-lg px-3 py-1.5 transition-all ${activeTab === 'creative' ? 'bg-[#405E69] text-white shadow-sm' : darkMode ? 'text-[#80949B] hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
              >
                <Palette className="h-3.5 w-3.5" />
                <span>Creative Review</span>
              </button>
            </nav>

            <div className="flex items-center space-x-2 pl-1">
              {user && !user.isAnonymous ? (
                <div className="flex items-center space-x-1.5">
                  <span className={`hidden max-w-[110px] truncate text-[11px] md:inline ${darkMode ? 'text-[#80949B]' : 'text-slate-500'}`}>
                    {user.email}
                  </span>
                  <button type="button" onClick={handleSignOut} title="Sign Out" className={`rounded-lg border p-1.5 transition-colors ${darkMode ? 'border-[#405E69] text-[#80949B] hover:text-white' : 'border-[#BFC9CE] text-slate-600 hover:text-slate-900'}`}>
                    <LogOut className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => setShowAuthModal(true)} className="rounded-lg border border-[#741532] bg-[#405E69] px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-[#741532]">
                  Sign In
                </button>
              )}

              <button
                type="button"
                aria-label="Toggle theme"
                onClick={toggleTheme}
                className={`rounded-xl border p-2 transition-all ${darkMode ? 'border-[#405E69] bg-[#002837] text-amber-300 hover:bg-[#405E69]/50' : 'border-[#BFC9CE] bg-white text-slate-700 hover:bg-slate-100 shadow-sm'}`}
              >
                {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className={`w-full max-w-sm space-y-4 rounded-2xl border p-6 shadow-2xl transition-all ${darkMode ? 'border-[#405E69] bg-[#002837] text-white' : 'border-[#BFC9CE] bg-white text-slate-900'}`}>
            <div className="flex items-center justify-between border-b border-[#405E69]/40 pb-3">
              <div>
                <h3 className="text-sm font-bold">{authMode === 'login' ? 'Tilte Team Authentication' : 'Create Campaign Studio Account'}</h3>
                <p className={`text-[11px] ${darkMode ? 'text-[#80949B]' : 'text-slate-500'}`}>
                  Connect for real-time Firestore sync & role governance.
                </p>
              </div>
              <button type="button" onClick={() => setShowAuthModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {authError && <div className="rounded-lg border border-[#FF002D] bg-[#FF002D]/10 p-2.5 text-xs text-[#FF002D]">{authError}</div>}

            <form onSubmit={handleAuthSubmit} className="space-y-3 text-xs">
              <div>
                <label className="mb-1 block font-medium">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@tilte.com"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className={`w-full rounded-xl border p-2.5 focus:outline-none ${darkMode ? 'border-[#405E69] bg-[#002837] text-white' : 'border-[#BFC9CE] bg-slate-50 text-slate-900'}`}
                />
              </div>

              <div>
                <label className="mb-1 block font-medium">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className={`w-full rounded-xl border p-2.5 focus:outline-none ${darkMode ? 'border-[#405E69] bg-[#002837] text-white' : 'border-[#BFC9CE] bg-slate-50 text-slate-900'}`}
                />
              </div>

              <button type="submit" className="w-full rounded-xl bg-[#405E69] py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#741532] shadow">
                {authMode === 'login' ? 'Sign In' : 'Register Account'}
              </button>
            </form>

            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center">
                <div className={`w-full border-t ${darkMode ? 'border-[#405E69]' : 'border-slate-200'}`} />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className={`px-2 ${darkMode ? 'bg-[#002837] text-[#80949B]' : 'bg-white text-slate-400'}`}>Or</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              className={`flex w-full items-center justify-center space-x-2 rounded-xl border py-2.5 text-xs font-semibold transition-colors ${darkMode ? 'border-[#405E69] text-white hover:bg-[#405E69]/30' : 'border-[#BFC9CE] text-slate-800 hover:bg-slate-100'}`}
            >
              <span>Sign in with Google</span>
            </button>

            <div className="pt-2 text-center">
              <button type="button" onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} className="text-[11px] text-[#80949B] underline hover:text-[#BFC9CE]">
                {authMode === 'login' ? "Don't have an account? Create one" : 'Already have an account? Sign in'}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6 lg:px-8">
        {activeTab === 'studio' && (
          <div className="space-y-8">
            <div className={`grid grid-cols-3 rounded-xl border p-1 ${darkMode ? 'border-[#405E69] bg-[#002837]' : 'border-[#BFC9CE] bg-slate-100'}`} role="tablist" aria-label="Audit steps">
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
                  className={`flex min-h-14 items-center justify-center gap-2 rounded-lg px-2 py-2 text-center text-[11px] font-semibold transition-colors sm:text-xs ${auditStep === step.id ? 'bg-[#405E69] text-white shadow-sm' : darkMode ? 'text-[#80949B] hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  <span className="font-mono text-[10px] opacity-70">{step.number}</span>
                  <span>{step.label}</span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
              <div className="contents">
                {auditStep === 'metadata' && (
                <div className={`section-card space-y-4 rounded-2xl border p-5 lg:col-span-12 ${darkMode ? 'bg-[#002837]' : 'section-card-light bg-white'}`}>
                  <h3 className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#80949B]">
                    <Building2 className="h-4 w-4" />
                    <span>Campaign Metadata & Objectives</span>
                  </h3>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium">Client Name</label>
                      <input type="text" placeholder="e.g. Acme Group" value={clientName} onChange={(e) => setClientName(e.target.value)} className={`w-full rounded-xl border p-2.5 text-xs focus:outline-none transition-colors ${darkMode ? 'border-[#405E69] bg-[#002837] text-white focus:border-[#80949B]' : 'border-[#BFC9CE] bg-slate-50 text-slate-900 focus:border-slate-500'}`} />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium">Campaign Name</label>
                      <input type="text" placeholder="e.g. Spring Product Launch" value={campaignName} onChange={(e) => setCampaignName(e.target.value)} className={`w-full rounded-xl border p-2.5 text-xs focus:outline-none transition-colors ${darkMode ? 'border-[#405E69] bg-[#002837] text-white focus:border-[#80949B]' : 'border-[#BFC9CE] bg-slate-50 text-slate-900 focus:border-slate-500'}`} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium">Target Audience Segment</label>
                      <input type="text" placeholder="e.g. New subscribers" value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} className={`w-full rounded-xl border p-2.5 text-xs focus:outline-none transition-colors ${darkMode ? 'border-[#405E69] bg-[#002837] text-white focus:border-[#80949B]' : 'border-[#BFC9CE] bg-slate-50 text-slate-900 focus:border-slate-500'}`} />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium">Core Action / Desired Outcome</label>
                      <input type="text" placeholder="e.g. Drive product trial signups" value={coreGoal} onChange={(e) => setCoreGoal(e.target.value)} className={`w-full rounded-xl border p-2.5 text-xs focus:outline-none transition-colors ${darkMode ? 'border-[#405E69] bg-[#002837] text-white focus:border-[#80949B]' : 'border-[#BFC9CE] bg-slate-50 text-slate-900 focus:border-slate-500'}`} />
                    </div>
                  </div>

                </div>
                )}

                {auditStep === 'verification' && (
                <div className={`section-card rounded-2xl border p-5 lg:col-span-12 ${darkMode ? 'bg-[#002837]' : 'section-card-light bg-white'}`}>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#80949B]">Manual Verification Checkpoints</h3>
                  <p className={`text-xs ${darkMode ? 'text-[#80949B]' : 'text-slate-500'}`}>
                    Confirm these using your sending platform, DNS records, policy documentation, or rendered-email tests. Unchecked items receive no points.
                  </p>
                  <div className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
                    {MANUAL_CHECKPOINTS.map((checkpoint) => (
                      <label key={checkpoint.id} className="flex items-start gap-2 border-b border-[#405E69]/30 py-2 text-xs leading-relaxed">
                        <input
                          type="checkbox"
                          checked={manualChecks[checkpoint.id]}
                          onChange={(event) => {
                            setManualChecks((current) => ({ ...current, [checkpoint.id]: event.target.checked }));
                            setHasCalculated(false);
                            setAuditResults(null);
                          }}
                          className="mt-0.5 shrink-0 accent-[#FF002D]"
                        />
                        <span>{checkpoint.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                )}

                {auditStep === 'content' && (
                <div className={`section-card rounded-2xl border p-5 lg:col-span-12 ${darkMode ? 'bg-[#002837]' : 'section-card-light bg-white'}`}>
                  <h3 className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#80949B]">
                    <Mail className="h-4 w-4" />
                    <span>Email Content & Headers</span>
                  </h3>

                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <label className="text-xs font-medium">Briefed Subject Line</label>
                      <span className={`text-[10px] ${subjectLine.length > 65 ? 'font-bold text-[#FF002D]' : darkMode ? 'text-[#80949B]' : 'text-slate-400'}`}>
                        {subjectLine.length} chars (optimal 20–65)
                      </span>
                    </div>
                    <input type="text" placeholder="e.g. Discover what’s new this season" value={subjectLine} onChange={(e) => setSubjectLine(e.target.value)} className={`w-full rounded-xl border p-2.5 text-xs focus:outline-none transition-colors ${darkMode ? 'border-[#405E69] bg-[#002837] text-white focus:border-[#80949B]' : 'border-[#BFC9CE] bg-slate-50 text-slate-900 focus:border-slate-500'}`} />
                  </div>

                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <label className="text-xs font-medium">Briefed Pre-Header (Preview Text)</label>
                      <span className={`text-[10px] ${preHeader.length < 20 && preHeader.length > 0 ? 'text-[#FF002D]' : darkMode ? 'text-[#80949B]' : 'text-slate-400'}`}>
                        {preHeader.length} chars
                      </span>
                    </div>
                    <input type="text" placeholder="e.g. Explore the latest updates and find your next step." value={preHeader} onChange={(e) => setPreHeader(e.target.value)} className={`w-full rounded-xl border p-2.5 text-xs focus:outline-none transition-colors ${darkMode ? 'border-[#405E69] bg-[#002837] text-white focus:border-[#80949B]' : 'border-[#BFC9CE] bg-slate-50 text-slate-900 focus:border-slate-500'}`} />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium">Full Email Copy (Live Text or HTML)</label>
                    <textarea rows={10} placeholder="Paste complete message body text or HTML code here..." value={emailCopy} onChange={(e) => setEmailCopy(e.target.value)} className={`w-full rounded-xl border p-3 text-xs font-mono leading-relaxed focus:outline-none transition-colors ${darkMode ? 'border-[#405E69] bg-[#002837] text-slate-200 focus:border-[#80949B]' : 'border-[#BFC9CE] bg-slate-50 text-slate-800 focus:border-slate-500'}`} />
                  </div>
                  <div className="border-t border-[#405E69]/40 pt-4">
                    <button type="button" onClick={handleCalculateScore} className="flex w-full items-center justify-center space-x-2 rounded-2xl border border-[#741532] bg-gradient-to-r from-[#741532] via-[#405E69] to-[#002837] px-6 py-4 text-sm font-black uppercase tracking-wider text-white shadow-xl transition-all hover:from-[#FF002D] hover:to-[#741532] transform hover:-translate-y-0.5 active:translate-y-0">
                      <Zap className="h-4 w-4 fill-current text-[#FF002D]" />
                      <span>Generate Readiness Score</span>
                    </button>
                    <p className={`mt-2 text-center text-[11px] ${darkMode ? 'text-[#80949B]' : 'text-slate-500'}`}>
                      Scores and AI inbox simulations are calculated strictly upon clicking this CTA.
                    </p>
                  </div>
                </div>
                )}
              </div>

              {hasCalculated && auditResults && (
                <div className="lg:col-span-12">
                  <div className={`section-card rounded-2xl border p-5 transition-all ${darkMode ? 'bg-[#002837]' : 'section-card-light bg-white'}`}>
                    <div className="flex flex-col justify-between gap-4 border-b border-[#405E69]/50 pb-5 sm:flex-row sm:items-center">
                      <div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-[#80949B]' : 'text-slate-500'}`}>Tilte Readiness Scorecard</span>
                        <div className="mt-1 flex items-baseline space-x-2">
                          <span className="text-6xl font-black tracking-tight">{auditResults.score}</span>
                          <span className={`text-xl font-bold ${darkMode ? 'text-[#80949B]' : 'text-slate-400'}`}>/100</span>
                        </div>
                      </div>

                      <div className="space-y-1 sm:text-right">
                        <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${auditResults.ratingBadge.bg} ${auditResults.ratingBadge.text}`}>
                          {auditResults.ratingBadge.label}
                        </span>
                        <p className={`text-[11px] ${darkMode ? 'text-[#80949B]' : 'text-slate-500'}`}>
                          Evaluated against {rules.length} active 2027 rules
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      <div className="flex items-center justify-between md:col-span-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#80949B]">Pillar Breakdown</h4>
                        <span className="text-[10px] text-[#80949B]">Select a pillar to view its criteria</span>
                      </div>

                      {[
                        { index: 1, name: '01 / The Science of Getting In', icon: ShieldCheck },
                        { index: 2, name: '02 / The Art of Standing Out', icon: Smartphone },
                        { index: 3, name: '03 / The Intelligence Behind Results', icon: Cpu },
                      ].map((pillar) => {
                        const pillarRules = auditResults.evaluatedRules.filter((r) => r.pillarIndex === pillar.index);
                        const pillarEarned = pillarRules.reduce((acc, r) => acc + r.earned, 0);
                        const pillarMax = pillarRules.reduce((acc, r) => acc + r.weight, 0);
                        const isExpanded = !!expandedPillars[pillar.index];
                        const IconComponent = pillar.icon;

                        return (
                          <div key={pillar.index} className={`rounded-xl border transition-all ${darkMode ? 'border-[#405E69] bg-[#002837]/60' : 'border-[#BFC9CE] bg-slate-50'}`}>
                            <button type="button" onClick={() => togglePillar(pillar.index)} className="flex w-full items-center justify-between p-3.5 text-left focus:outline-none">
                              <div className="flex items-center space-x-2.5">
                                <div className={`rounded-lg p-1.5 ${darkMode ? 'bg-[#405E69]/40 text-[#BFC9CE]' : 'bg-slate-200 text-slate-700'}`}>
                                  <IconComponent className="h-4 w-4" />
                                </div>
                                <div>
                                  <span className="block text-xs font-bold">{pillar.name}</span>
                                  <span className={`text-[10px] ${darkMode ? 'text-[#80949B]' : 'text-slate-500'}`}>
                                    {pillarRules.length} criterion evaluated
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center space-x-3">
                                <span className="text-xs font-black text-[#405E69] dark:text-[#BFC9CE]">
                                  {pillarEarned} / {pillarMax} pts
                                </span>
                                {isExpanded ? <ChevronUp className="h-4 w-4 text-[#80949B]" /> : <ChevronDown className="h-4 w-4 text-[#80949B]" />}
                              </div>
                            </button>

                            {isExpanded && (
                              <div className="space-y-2 border-t border-[#405E69]/30 p-3 pt-0">
                                {pillarRules.map((rule) => (
                                  <div key={rule.id} className={`flex flex-col justify-between gap-2 rounded-lg border p-2.5 text-xs sm:flex-row sm:items-center ${darkMode ? 'border-[#405E69]/60 bg-[#002837]' : 'border-[#BFC9CE] bg-white'}`}>
                                    <div className="flex items-start space-x-2">
                                      <span className="mt-0.5 shrink-0">
                                        {rule.status === 'pass' && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
                                        {rule.status === 'warning' && <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
                                        {rule.status === 'alert' && <AlertOctagon className="h-3.5 w-3.5 text-[#FF002D]" />}
                                      </span>
                                      <div>
                                        <p className="text-xs font-semibold leading-snug">{rule.code}. {rule.title}</p>
                                        <p className={`text-[10px] ${darkMode ? 'text-[#80949B]' : 'text-slate-500'}`}>{rule.reason}</p>
                                      </div>
                                    </div>

                                    <div className="shrink-0 text-right">
                                      <span className={`font-mono text-xs font-bold ${rule.status === 'pass' ? 'text-emerald-500' : rule.status === 'warning' ? 'text-amber-500' : 'text-[#FF002D]'}`}>
                                        {rule.earned}/{rule.weight}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className={`section-card rounded-2xl border p-6 ${darkMode ? 'bg-[#002837]' : 'section-card-light bg-white'}`}>
              <div className="flex flex-col justify-between gap-3 border-b border-[#405E69]/40 pb-4 md:flex-row md:items-center">
                <div className="flex items-center space-x-2.5">
                  <div className="rounded-xl border border-[#741532] bg-[#4D1B34] p-2 text-white">
                    <Cpu className="h-5 w-5 text-amber-300" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider">Simulated AI Inbox Output & Summaries</h3>
                    <p className={`text-xs ${darkMode ? 'text-[#80949B]' : 'text-slate-500'}`}>
                      Side-by-side behavioral modeling across current generation AI inboxes.
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 rounded-lg border border-[#741532] bg-[#741532]/20 px-3 py-1.5 text-[11px] text-[#BFC9CE]">
                  <Info className="h-3.5 w-3.5 shrink-0 text-[#FF002D]" />
                  <span>
                    <strong>Disclaimer:</strong> Rough approximations based on observed LLM behavior (Apple Intelligence, Gemini, Outlook Copilot). Not guaranteed inbox placements.
                  </span>
                </div>
              </div>

              {hasCalculated && auditResults ? (
                <div className="grid grid-cols-1 gap-4 pt-2 md:grid-cols-3">
                  <div className={`flex flex-col justify-between space-y-3 rounded-xl border p-4 ${darkMode ? 'border-[#405E69] bg-[#002837]/80' : 'border-[#BFC9CE] bg-slate-50'}`}>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between border-b border-[#405E69]/30 pb-2">
                        <span className="text-xs font-bold text-slate-200 dark:text-white">Apple Mail (Apple Intelligence)</span>
                        <span className="rounded bg-slate-700/50 px-2 py-0.5 font-mono text-[10px] text-[#BFC9CE]">Notification Card</span>
                      </div>
                      <p className="text-xs italic leading-relaxed">"{auditResults.simulations.apple}"</p>
                    </div>
                    <div className={`border-t border-[#405E69]/30 pt-2 text-[10px] ${darkMode ? 'text-[#80949B]' : 'text-slate-500'}`}>
                      Extracted Deadline: <strong className="text-white dark:text-slate-200">{auditResults.simulations.extractedDate}</strong>
                    </div>
                  </div>

                  <div className={`flex flex-col justify-between space-y-3 rounded-xl border p-4 ${darkMode ? 'border-[#405E69] bg-[#002837]/80' : 'border-[#BFC9CE] bg-slate-50'}`}>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between border-b border-[#405E69]/30 pb-2">
                        <span className="text-xs font-bold text-blue-400">Gmail with Gemini</span>
                        <span className="rounded bg-blue-900/40 px-2 py-0.5 font-mono text-[10px] text-blue-300">Top-of-Thread</span>
                      </div>
                      <ul className="space-y-1.5 text-xs">
                        {auditResults.simulations.gemini.map((b, i) => (
                          <li key={i} className="flex items-start space-x-1.5">
                            <span className="font-bold text-blue-400">•</span>
                            <span className="leading-snug">{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className={`border-t border-[#405E69]/30 pt-2 text-[10px] ${darkMode ? 'text-[#80949B]' : 'text-slate-500'}`}>
                      Detected Amount: <strong className="text-white dark:text-slate-200">{auditResults.simulations.extractedAmount}</strong>
                    </div>
                  </div>

                  <div className={`flex flex-col justify-between space-y-3 rounded-xl border p-4 ${darkMode ? 'border-[#405E69] bg-[#002837]/80' : 'border-[#BFC9CE] bg-slate-50'}`}>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between border-b border-[#405E69]/30 pb-2">
                        <span className="text-xs font-bold text-purple-400">Outlook Copilot</span>
                        <span className="rounded bg-purple-900/40 px-2 py-0.5 font-mono text-[10px] text-purple-300">Summary Card</span>
                      </div>
                      <p className="text-xs leading-relaxed">{auditResults.simulations.copilot}</p>
                    </div>
                    <div className={`border-t border-[#405E69]/30 pt-2 text-[10px] ${darkMode ? 'text-[#80949B]' : 'text-slate-500'}`}>
                      Extracted CTA: <strong className="text-white dark:text-slate-200">{auditResults.simulations.extractedCta}</strong>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={`rounded-xl border border-dashed p-8 text-center ${darkMode ? 'border-[#405E69] text-[#80949B]' : 'border-[#BFC9CE] text-slate-400'}`}>
                  <p className="text-xs">Simulated AI inbox extractions will populate automatically when you generate the score above.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'report' && (
          <div className="space-y-6">
            <div className={`flex items-center justify-between rounded-2xl border p-4 print:hidden ${darkMode ? 'border-[#405E69] bg-[#002837]' : 'border-[#BFC9CE] bg-white shadow-sm'}`}>
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-[#80949B]" />
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider">Client Executive Summary Report</h3>
                  <p className={`text-[11px] ${darkMode ? 'text-[#80949B]' : 'text-slate-500'}`}>
                    Print-ready deliverable format. Free of commercial packages and pricing.
                  </p>
                </div>
              </div>

              <button type="button" onClick={() => window.print()} className="flex items-center space-x-2 rounded-xl bg-[#405E69] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[#741532] shadow">
                <Printer className="h-4 w-4" />
                <span>Print / Save PDF</span>
              </button>
            </div>

            <div className="section-card section-card-light rounded-2xl border border-slate-200 bg-white p-8 text-slate-900 shadow-xl print:border-none print:p-0 print:shadow-none sm:p-12">
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-6">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-black tracking-tighter text-[#002837]">TILTE</span>
                    <span className="rounded bg-[#002837] px-2 py-0.5 text-[11px] font-bold tracking-wide text-white">READINESS STUDIO</span>
                  </div>
                  <p className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-500">Email Campaign Audit & AI Inbox Performance Report</p>
                </div>

                <div className="space-y-0.5 text-right text-xs text-slate-600">
                  <p><strong className="text-slate-900">Client:</strong> {clientName || 'Not provided'}</p>
                  <p><strong className="text-slate-900">Campaign:</strong> {campaignName || 'Not provided'}</p>
                  <p><strong className="text-slate-900">Audited Date:</strong> {new Date().toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-1 gap-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 md:grid-cols-12">
                <div className="flex flex-col items-center justify-center border-slate-200 pr-6 text-center md:col-span-4 md:border-r">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Overall Readiness Index</span>
                  <div className="my-2 flex items-baseline space-x-1">
                    <span className="text-6xl font-black tracking-tight text-[#002837]">{hasCalculated && auditResults ? auditResults.score : '--'}</span>
                    <span className="text-xl font-bold text-slate-400">/100</span>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold text-white ${hasCalculated && auditResults ? auditResults.ratingBadge.bg : 'bg-slate-200'}`}>
                    {hasCalculated && auditResults ? auditResults.ratingBadge.label : 'Pending Evaluation'}
                  </span>
                </div>

                <div className="space-y-3 md:col-span-8">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Executive Evaluation Context</h4>
                  <p className="text-xs leading-relaxed text-slate-700">
                    This email was systematically tested against the 15 pillars of the 2027 Email Best Practices. With modern inboxes deploying automatic LLM summarizers, live-text clarity, clear deadlines, and single-intent actions are critical to prevent customer drop-off before opening.
                  </p>
                  <div className="flex items-center space-x-4 pt-2 text-xs font-semibold text-slate-600">
                    <span>Target Goal: {coreGoal || 'Not provided'}</span>
                    <span>•</span>
                    <span>Audience: {targetAudience || 'Not provided'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 space-y-3">
                <h3 className="border-b border-slate-200 pb-2 text-xs font-bold uppercase tracking-wider text-slate-900">Observed AI Inbox Extract Simulations</h3>
                <p className="text-[11px] italic text-slate-500">Note: Inbox summaries are estimated based on observed LLM behavior (Apple Intelligence, Gemini, Outlook Copilot).</p>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="space-y-1 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <strong className="block text-xs font-bold text-slate-900">Apple Mail Summary</strong>
                    <p className="text-xs text-slate-700 italic">"{hasCalculated && auditResults ? auditResults.simulations.apple : 'Pending generation.'}"</p>
                  </div>

                  <div className="space-y-1 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <strong className="block text-xs font-bold text-slate-900">Gmail Gemini Highlights</strong>
                    <ul className="space-y-1 text-xs text-slate-700">
                      {hasCalculated && auditResults ? auditResults.simulations.gemini.map((b, i) => <li key={i}>• {b}</li>) : <li>• Pending generation.</li>}
                    </ul>
                  </div>

                  <div className="space-y-1 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <strong className="block text-xs font-bold text-slate-900">Outlook Copilot Card</strong>
                    <p className="text-xs text-slate-700">{hasCalculated && auditResults ? auditResults.simulations.copilot : 'Pending generation.'}</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 space-y-3">
                <h3 className="border-b border-slate-200 pb-2 text-xs font-bold uppercase tracking-wider text-slate-900">Submitted Subject & Copy Breakdown</h3>

                <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs">
                  <p><strong>Subject:</strong> {subjectLine || 'N/A'}</p>
                  <p><strong>Pre-Header:</strong> {preHeader || 'N/A'}</p>
                  <div className="border-t border-slate-200 pt-2">
                    <strong className="mb-1 block">Body Text Content:</strong>
                    <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-slate-700">{emailCopy || 'No copy provided.'}</pre>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-6 text-[11px] text-slate-500">
                <span>© 2027 Tilte Email Campaign Readiness Studio. All rights reserved.</span>
                <span>Confidential QA Deliverable</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'methodology' && (
          <div className="space-y-6">
            <div className={`section-card flex flex-col justify-between gap-4 rounded-2xl border p-6 md:flex-row md:items-center ${darkMode ? 'bg-[#002837]' : 'section-card-light bg-white'}`}>
              <div>
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5 text-[#80949B]" />
                  <h2 className="text-lg font-black tracking-tight">Current Methodologies & Knowledge Base</h2>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${userRole === 'admin' ? 'border-[#FF002D] bg-[#741532]/40 text-rose-300' : 'border-[#405E69] bg-[#405E69]/30 text-[#BFC9CE]'}`}>
                    {userRole === 'admin' ? 'Editing Enabled' : 'View Only'}
                  </span>
                </div>
                <p className={`mt-0.5 text-xs ${darkMode ? 'text-[#80949B]' : 'text-slate-500'}`}>
                  NotebookLM-style split workspace. Global methodology updates are synchronized in Firestore.
                </p>
              </div>

              <div className="flex items-center space-x-2 self-start md:self-auto">
                {userRole === 'admin' ? (
                  <>
                    <button type="button" onClick={handleResetToDefaultMethodology} title="Reset rules to 2027 baseline" className={`rounded-xl border p-2 text-xs font-semibold transition-all ${darkMode ? 'border-[#405E69] text-[#80949B] hover:text-white' : 'border-[#BFC9CE] text-slate-600 hover:text-slate-900'}`}>
                      <RotateCcw className="h-4 w-4" />
                    </button>

                    <button type="button" onClick={() => setIsAddRuleModalOpen(true)} className="flex items-center space-x-2 rounded-xl bg-[#405E69] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[#741532] shadow">
                      <Plus className="h-4 w-4" />
                      <span>Add Methodology Rule</span>
                    </button>
                  </>
                ) : (
                  <div className="flex items-center space-x-1.5 rounded-lg border border-[#405E69]/40 bg-[#002837]/40 px-3 py-1.5 text-xs text-[#80949B]">
                    <Lock className="h-3.5 w-3.5" />
                    <span>Editing access is limited to approved administrators</span>
                  </div>
                )}
              </div>
            </div>

            {methodologyStatusMsg && (
              <div className="flex items-center space-x-2 rounded-xl border border-emerald-500 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-400">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>{methodologyStatusMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
              <div className={`section-card rounded-2xl border p-5 lg:col-span-4 ${darkMode ? 'bg-[#002837]' : 'section-card-light bg-white'}`}>
                <div className="flex items-center justify-between border-b border-[#405E69]/40 pb-3">
                  <h3 className="flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-[#80949B]">
                    <FileText className="h-4 w-4" />
                    <span>Grounding Sources ({sources.length})</span>
                  </h3>
                </div>

                <div className="space-y-2.5">
                  {sources.map((src) => (
                    <div key={src.id} onClick={() => setSelectedSource(src)} className={`cursor-pointer rounded-xl border p-3 text-xs transition-all ${selectedSource.id === src.id ? 'border-[#80949B] bg-[#405E69]/30' : darkMode ? 'border-[#405E69] hover:bg-[#405E69]/20' : 'border-[#BFC9CE] hover:bg-slate-50'}`}>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="rounded bg-[#4D1B34] px-2 py-0.5 text-[10px] font-bold text-white">{src.category}</span>
                        <span className={`text-[10px] ${darkMode ? 'text-[#80949B]' : 'text-slate-400'}`}>{src.date}</span>
                      </div>
                      <h4 className="font-bold leading-tight">{src.title}</h4>
                      <p className={`mt-1 text-[11px] leading-relaxed ${darkMode ? 'text-[#80949B]' : 'text-slate-500'}`}>{src.snippet}</p>
                    </div>
                  ))}
                </div>

                <div className={`space-y-2 rounded-xl border p-4 text-xs ${darkMode ? 'border-[#405E69] bg-[#002837]/60' : 'border-[#BFC9CE] bg-slate-50'}`}>
                  <span className="block text-[10px] font-bold uppercase text-[#80949B]">Selected Source Detail</span>
                  <h4 className="font-bold">{selectedSource.title}</h4>
                  <p className={`leading-relaxed ${darkMode ? 'text-[#80949B]' : 'text-slate-600'}`}>{selectedSource.snippet}</p>
                </div>
              </div>

              <div className={`section-card rounded-2xl border p-5 lg:col-span-8 ${darkMode ? 'bg-[#002837]' : 'section-card-light bg-white'}`}>
                <div className="flex items-center justify-between border-b border-[#405E69]/40 pb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#80949B]">Active Criteria & Scoring Weight Rules ({rules.length})</h3>
                  <div className="flex items-center space-x-3">
                    <span className={`text-[11px] ${darkMode ? 'text-[#80949B]' : 'text-slate-500'}`}>Total Max Weight: {rules.reduce((acc, r) => acc + r.weight, 0)} pts</span>
                    {userRole === 'admin' && <span className="text-[10px] font-mono font-bold text-[#FF002D]">• Cloud-Synced</span>}
                  </div>
                </div>

                <div className="space-y-2.5">
                  {rules.map((rule) => (
                    <div key={rule.id} className={`flex items-center justify-between gap-3 rounded-xl border p-3 text-xs transition-colors ${darkMode ? 'border-[#405E69] bg-[#002837] hover:border-[#80949B]' : 'border-[#BFC9CE] bg-white hover:border-slate-400'}`}>
                      <div className="flex items-center space-x-3">
                        <span className="rounded bg-[#405E69] px-2 py-1 text-xs font-black text-white">{rule.code}</span>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="font-bold">{rule.title}</h4>
                            <span className="rounded-full bg-[#405E69]/30 px-2 py-0.5 text-[10px] text-[#BFC9CE]">{rule.pillar}</span>
                          </div>
                          <p className={`mt-0.5 text-[11px] ${darkMode ? 'text-[#80949B]' : 'text-slate-500'}`}>{rule.desc}</p>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center space-x-3">
                        <span className="rounded border border-[#741532] bg-[#741532]/30 px-2 py-1 font-mono text-xs font-bold text-[#BFC9CE]">{rule.weight} pts</span>
                        {userRole === 'admin' ? (
                          <button type="button" onClick={() => handleDeleteRule(rule.id)} className="p-1 text-[#80949B] transition-colors hover:text-[#FF002D]" title="Remove rule (Admin)">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        ) : (
                          <span title="Read-only criteria"><Lock className="h-3.5 w-3.5 text-[#80949B]" /></span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {isAddRuleModalOpen && userRole === 'admin' && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                <div className={`w-full max-w-md space-y-4 rounded-2xl border p-6 shadow-2xl transition-all ${darkMode ? 'border-[#405E69] bg-[#002837] text-white' : 'border-[#BFC9CE] bg-white text-slate-900'}`}>
                  <div className="flex items-center justify-between border-b border-[#405E69]/40 pb-3">
                    <h3 className="text-sm font-bold">Add Custom Methodology Rule (Admin)</h3>
                    <button type="button" onClick={() => setIsAddRuleModalOpen(false)} className="text-slate-400 hover:text-white">
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <form onSubmit={handleAddRule} className="space-y-3 text-xs">
                    <div>
                      <label className="mb-1 block font-medium">Pillar Group</label>
                      <select value={newRule.pillarIndex} onChange={(e) => setNewRule({ ...newRule, pillarIndex: Number(e.target.value) })} className={`w-full rounded-xl border p-2.5 focus:outline-none ${darkMode ? 'border-[#405E69] bg-[#002837] text-white' : 'border-[#BFC9CE] bg-slate-50 text-slate-900'}`}>
                        <option value={1}>01 / The Science of Getting In</option>
                        <option value={2}>02 / The Art of Standing Out</option>
                        <option value={3}>03 / The Intelligence Behind Results</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block font-medium">Rule Title</label>
                      <input type="text" placeholder="e.g. BIMI SVG Logo Compliance" value={newRule.title} onChange={(e) => setNewRule({ ...newRule, title: e.target.value })} className={`w-full rounded-xl border p-2.5 focus:outline-none ${darkMode ? 'border-[#405E69] bg-[#002837] text-white' : 'border-[#BFC9CE] bg-slate-50 text-slate-900'}`} required />
                    </div>

                    <div>
                      <label className="mb-1 block font-medium">Description</label>
                      <textarea rows={2} placeholder="Explain evaluation criteria..." value={newRule.desc} onChange={(e) => setNewRule({ ...newRule, desc: e.target.value })} className={`w-full rounded-xl border p-2.5 focus:outline-none ${darkMode ? 'border-[#405E69] bg-[#002837] text-white' : 'border-[#BFC9CE] bg-slate-50 text-slate-900'}`} />
                    </div>

                    <div>
                      <label className="mb-1 block font-medium">Score Weight Points</label>
                      <input type="number" min="1" max="20" value={newRule.weight} onChange={(e) => setNewRule({ ...newRule, weight: e.target.value })} className={`w-full rounded-xl border p-2.5 focus:outline-none ${darkMode ? 'border-[#405E69] bg-[#002837] text-white' : 'border-[#BFC9CE] bg-slate-50 text-slate-900'}`} />
                    </div>

                    <div className="flex justify-end space-x-2 pt-2">
                      <button type="button" onClick={() => setIsAddRuleModalOpen(false)} className={`rounded-xl px-4 py-2 text-xs font-semibold ${darkMode ? 'bg-[#405E69]/40 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>
                        Cancel
                      </button>
                      <button type="submit" className="rounded-xl bg-[#405E69] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[#741532]">
                        Save & Sync Rule
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'creative' && (
          <div className="space-y-6">
            <div className={`section-card rounded-2xl border p-6 ${darkMode ? 'bg-[#002837]' : 'section-card-light bg-white'}`}>
              <div className="flex items-center space-x-2">
                <Palette className="h-5 w-5 text-[#80949B]" />
                <h2 className="text-lg font-black tracking-tight">Creative Review & CI Adherence Studio</h2>
              </div>
              <p className={`mt-1 text-xs ${darkMode ? 'text-[#80949B]' : 'text-slate-500'}`}>
                Preview the final design, compare final subject and pre-header copy with the Audit Studio brief, and inspect CTA button styling.
              </p>
            </div>

            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
              <div className={`section-card rounded-2xl border p-5 lg:col-span-6 ${darkMode ? 'bg-[#002837]' : 'section-card-light bg-white'}`}>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#80949B]">Final Email Design & Client Brief</h3>

                <div className={`rounded-xl border-2 border-dashed p-5 text-center ${darkMode ? 'border-[#405E69] bg-[#002837]/60' : 'border-[#BFC9CE] bg-slate-50'}`}>
                  <input type="file" id="designUploadInput" className="hidden" onChange={handleDesignFile} accept="image/png,image/jpeg,image/webp,image/svg+xml,.pdf" />
                  <label htmlFor="designUploadInput" className="block cursor-pointer space-y-2">
                    <Eye className="mx-auto h-6 w-6 text-[#80949B]" />
                    <p className="text-xs font-semibold">{designFileName || 'Upload Final Email Design (.png, .jpg, .webp, .svg, .pdf)'}</p>
                    <p className={`text-[10px] ${darkMode ? 'text-[#80949B]' : 'text-slate-400'}`}>The design is scanned in this browser; the file is not uploaded to a server.</p>
                  </label>
                </div>
                {designScanStatus && <p className={`text-[11px] ${designScanStatus.startsWith('The design could not') || designScanStatus.startsWith('Upload') ? 'text-rose-400' : darkMode ? 'text-[#80949B]' : 'text-slate-500'}`} role="status">{designScanStatus}</p>}

                {designPreviewUrl && (
                  <div className={`overflow-hidden rounded-xl border ${darkMode ? 'border-[#405E69] bg-[#001D29]' : 'border-[#BFC9CE] bg-slate-100'}`}>
                    <div className={`border-b px-3 py-2 text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'border-[#405E69] text-[#80949B]' : 'border-[#BFC9CE] text-slate-500'}`}>
                      Final Email Design Preview
                    </div>
                    {designFile?.type === 'application/pdf' || designFile?.name.toLowerCase().endsWith('.pdf') ? (
                      <iframe title="Final email design preview" src={designPreviewUrl} className="h-80 w-full bg-white" />
                    ) : (
                      <img src={designPreviewUrl} alt={`Preview of ${designFileName}`} className="max-h-[28rem] w-full bg-white object-contain" />
                    )}
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-xs font-medium">Client Design Brief</label>
                  <textarea rows={4} placeholder="Describe the intended layout, brand colors (include hex values), typography, imagery, accessibility needs, and CTA treatment." value={designBriefContent} onChange={(e) => setDesignBriefContent(e.target.value)} className={`w-full rounded-xl border p-2.5 text-xs focus:outline-none ${darkMode ? 'border-[#405E69] bg-[#002837] text-white' : 'border-[#BFC9CE] bg-slate-50 text-slate-900'}`} />
                </div>

                <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block font-medium">Final Subject</label>
                    <input type="text" placeholder="e.g. Product Update Announcement" value={creativeSubject} onChange={(e) => setCreativeSubject(e.target.value)} className={`w-full rounded-xl border p-2.5 focus:outline-none ${darkMode ? 'border-[#405E69] bg-[#002837] text-white' : 'border-[#BFC9CE] bg-slate-50 text-slate-900'}`} />
                  </div>
                  <div>
                    <label className="mb-1 block font-medium">Final Pre-Header</label>
                    <input type="text" placeholder="e.g. Action required by 28 Feb" value={creativePreheader} onChange={(e) => setCreativePreheader(e.target.value)} className={`w-full rounded-xl border p-2.5 focus:outline-none ${darkMode ? 'border-[#405E69] bg-[#002837] text-white' : 'border-[#BFC9CE] bg-slate-50 text-slate-900'}`} />
                  </div>
                </div>
                <p className={`text-[10px] ${darkMode ? 'text-[#80949B]' : 'text-slate-500'}`}>
                  These final values are compared with the briefed subject and pre-header entered under Email Content & Headers; they do not need to appear inside the Figma render.
                </p>

                <button type="button" onClick={handleRunCreativeReview} disabled={isScanningDesign} className="flex w-full items-center justify-center space-x-2 rounded-xl bg-[#405E69] px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#741532] shadow disabled:cursor-wait disabled:opacity-60">
                  <Target className="h-4 w-4" />
                  <span>{isScanningDesign ? 'Scanning Final Design...' : 'Run Creative & CI Alignment Review'}</span>
                </button>
              </div>

              <div className={`section-card rounded-2xl border p-5 lg:col-span-6 ${darkMode ? 'bg-[#002837]' : 'section-card-light bg-white'}`}>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#80949B]">Creative Review Audit Results</h3>

                {creativeAuditRun && creativeFindings ? (
                  <div className="space-y-4 text-xs animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-[#405E69]/40 pb-3">
                      <div>
                        <span className={`text-[10px] font-bold uppercase ${darkMode ? 'text-[#80949B]' : 'text-slate-500'}`}>Final Design Scan</span>
                        <div className="mt-1 text-xs font-semibold">{designFileName}</div>
                        <p className={`mt-1 text-[11px] ${darkMode ? 'text-[#80949B]' : 'text-slate-500'}`}>
                          {creativeFindings.pagesScanned} page(s), {creativeFindings.wordCount} words detected
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold">{creativeFindings.confidence}%</span>
                        <span className="block text-[10px] font-medium text-[#80949B]">OCR confidence</span>
                        <span className="mt-1 block text-lg font-black">{creativeFindings.briefAlignmentScore === null ? 'N/A' : `${creativeFindings.briefAlignmentScore}%`}</span>
                        <span className="block text-[10px] font-medium text-[#80949B]">Brief copy alignment</span>
                      </div>
                    </div>

                    <div className={`space-y-1.5 rounded-xl border p-4 ${darkMode ? 'border-[#741532] bg-[#4D1B34]/30' : 'border-rose-200 bg-rose-50'}`}>
                      <span className="flex items-center space-x-1.5 text-xs font-bold text-rose-300">
                        <Target className="h-3.5 w-3.5 text-[#FF002D]" />
                        <span>CTA Detected in Design</span>
                      </span>
                      <p className="leading-relaxed">{creativeFindings.ctaRecommendation}</p>
                      <div className="grid grid-cols-1 gap-2 border-t border-[#741532]/40 pt-2 sm:grid-cols-3">
                        <p>Button shape: <strong>{creativeFindings.ctaButton ? (creativeFindings.ctaButton.buttonLike ? 'detected' : 'not detected') : 'not assessable'}</strong></p>
                        <p>Standout fill: <strong>{creativeFindings.ctaButton ? (creativeFindings.ctaButton.standoutColor ? creativeFindings.ctaButton.fillColor : 'not detected') : 'not assessable'}</strong></p>
                        <p>Text contrast: <strong>{creativeFindings.ctaButton?.contrastRatio ? `${creativeFindings.ctaButton.contrastRatio}:1${creativeFindings.ctaButton.contrastRatio >= 4.5 ? ' (pass)' : ' (low)'}` : 'not assessable'}</strong></p>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <div className={`flex items-start space-x-2 rounded-xl border p-3 ${darkMode ? 'border-[#405E69] bg-[#002837]' : 'border-[#BFC9CE] bg-slate-50'}`}>
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                        <div>
                          <strong className="block">Brief Subject & Pre-Header Comparison:</strong>
                          <p className={`mt-0.5 text-[11px] ${darkMode ? 'text-[#80949B]' : 'text-slate-500'}`}>{creativeFindings.contentMatch}</p>
                        </div>
                      </div>

                      <div className={`flex items-start space-x-2 rounded-xl border p-3 ${darkMode ? 'border-[#405E69] bg-[#002837]' : 'border-[#BFC9CE] bg-slate-50'}`}>
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                        <div>
                          <strong className="block">Sampled Design Palette:</strong>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            {creativeFindings.detectedColors.map((color) => <span key={color} className="h-5 w-5 rounded border border-white/30" style={{ backgroundColor: color }} title={color} />)}
                            <span className={`text-[11px] ${darkMode ? 'text-[#80949B]' : 'text-slate-500'}`}>{creativeFindings.colorAdherence}</span>
                          </div>
                        </div>
                      </div>
                      <details className={`rounded-xl border p-3 ${darkMode ? 'border-[#405E69] bg-[#002837]' : 'border-[#BFC9CE] bg-slate-50'}`}>
                        <summary className="cursor-pointer text-xs font-semibold">View text detected in the final design</summary>
                        <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap text-[11px] leading-relaxed">{creativeFindings.recognizedText}</pre>
                      </details>
                    </div>
                  </div>
                ) : (
                  <div className={`rounded-xl border border-dashed p-8 text-center ${darkMode ? 'border-[#405E69] text-[#80949B]' : 'border-[#BFC9CE] text-slate-400'}`}>
                    <MousePointer className="mx-auto mb-2 h-8 w-8 opacity-50" />
                    <p className="text-xs">Upload the final email design, add the client brief and final subject details, then run the scan to inspect detected copy and colors.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
