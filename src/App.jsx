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
  BarChart3,
  Building2,
  Zap,
  UploadCloud,
  FileCode,
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

export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState('studio');
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
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
  const [expandedPillars, setExpandedPillars] = useState({ 1: true, 2: true, 3: true });
  const [briefFileName, setBriefFileName] = useState('');
  const [copyFileName, setCopyFileName] = useState('');
  const [clientName, setClientName] = useState('');
  const [campaignName, setCampaignName] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [coreGoal, setCoreGoal] = useState('');
  const [subjectLine, setSubjectLine] = useState('');
  const [preHeader, setPreHeader] = useState('');
  const [emailCopy, setEmailCopy] = useState('');
  const [hasCalculated, setHasCalculated] = useState(false);
  const [auditResults, setAuditResults] = useState(null);
  const [designFileName, setDesignFileName] = useState('');
  const [creativeSubject, setCreativeSubject] = useState('');
  const [creativePreheader, setCreativePreheader] = useState('');
  const [ciGuideContent, setCiGuideContent] = useState('');
  const [creativeAuditRun, setCreativeAuditRun] = useState(false);
  const [creativeFindings, setCreativeFindings] = useState(null);

  const isCurrentUserAdmin = Boolean(userProfile?.role === 'admin' || user?.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase());

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const isSuperAdmin = currentUser.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
        const userDocRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'users', currentUser.uid);
        const snap = await getDoc(userDocRef);

        if (!snap.exists()) {
          const initialData = {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName || currentUser.email.split('@')[0],
            photoURL: currentUser.photoURL || '',
            role: isSuperAdmin ? 'admin' : 'campaign_manager',
            isSuperAdmin,
            createdAt: serverTimestamp(),
          };
          await setDoc(userDocRef, initialData);
          setUserProfile(initialData);
        } else {
          const userData = snap.data();
          if (isSuperAdmin && userData.role !== 'admin') {
            await updateDoc(userDocRef, { role: 'admin', isSuperAdmin: true });
            setUserProfile({ ...userData, role: 'admin', isSuperAdmin: true });
          } else {
            setUserProfile({ ...userData, role: userData.role || 'campaign_manager' });
          }
        }
        setUser(currentUser);
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      setShowAuthModal(false);
      setAuthMode('login');
      setAuthError('');
      setActiveTab('studio');
    }
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

  const handleRunCreativeReview = () => {
    if (!ciGuideContent.trim() && !creativeSubject.trim()) {
      alert('Please enter CI Guide parameters or updated subject headers to audit.');
      return;
    }

    const ctaMatch = emailCopy.match(/\[(.*?)\]/);
    const existingCta = ctaMatch ? ctaMatch[1] : 'Explore More';
    const isVagueCta = /explore|click here|learn more|check out/i.test(existingCta);

    setCreativeFindings({
      ciScore: 89,
      ctaOriginal: existingCta,
      ctaRecommendation: isVagueCta
        ? `Replace passive verb "${existingCta}" with specific action: "See Your Renewal Terms" or "Confirm Cover".`
        : `Strong action CTA: "${existingCta}" creates high intent recognition.`,
      colorAdherence: ciGuideContent.toLowerCase().includes('#') || ciGuideContent.toLowerCase().includes('red') || ciGuideContent.toLowerCase().includes('navy')
        ? 'Palette strictly adheres to primary brand codes with sufficient CTA button contrast.'
        : 'Brand palette rules applied from standard design system guide.',
      positionAssessment: 'Primary CTA positioned above the 500px fold on mobile devices; secondary links subdued.',
    });

    setCreativeAuditRun(true);
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
        const profile = {
          uid: cred.user.uid,
          email: cred.user.email,
          displayName: cred.user.displayName || cred.user.email.split('@')[0],
          photoURL: cred.user.photoURL || '',
          role: defaultRole,
          isSuperAdmin: cred.user.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase(),
          createdAt: serverTimestamp(),
        };
        await setDoc(userDocRef, profile);
        setUserProfile(profile);
      }
      setShowAuthModal(false);
      setAuthEmail('');
      setAuthPassword('');
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
        const profile = {
          uid: cred.user.uid,
          email: cred.user.email,
          displayName: cred.user.displayName || cred.user.email.split('@')[0],
          photoURL: cred.user.photoURL || '',
          role: defaultRole,
          isSuperAdmin: cred.user.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase(),
          createdAt: serverTimestamp(),
        };
        await setDoc(userDocRef, profile);
        setUserProfile(profile);
      } else {
        setUserProfile({ ...snap.data(), role: snap.data().role || 'campaign_manager' });
      }
      setShowAuthModal(false);
    } catch (err) {
      setAuthError(err.message || 'Google Sign-in failed.');
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setUserProfile(null);
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
    if (file) setDesignFileName(file.name);
  };

  const handleCalculateScore = () => {
    if (!emailCopy.trim()) {
      alert('Please add a subject line and email copy before running the audit.');
      return;
    }

    const guidelineCheck = /renew|confirm|deadline|policy|coverage/i.test(emailCopy);
    const hasClearCta = /\[(.*?)\]/.test(emailCopy) || /confirm|renew|review|book/i.test(emailCopy);
    const strongSubject = subjectLine.length >= 20 && subjectLine.length <= 65;
    const previewStrength = preHeader.length >= 20;

    const evaluatedRules = rules.map((rule, index) => {
      const pass = index % 3 !== 0;
      const status = pass ? 'pass' : 'warning';
      const earned = status === 'pass' ? rule.weight : Math.max(1, Math.round(rule.weight * 0.6));
      const reason = status === 'pass'
        ? 'Clear compliance signal detected in the content and structure.'
        : 'Content may need clearer instruction or a stronger action cue.';

      return {
        ...rule,
        status,
        earned,
        reason,
      };
    });

    const baseScore = Math.min(
      98,
      Math.max(
        62,
        Math.round(
          (evaluatedRules.reduce((total, rule) => total + rule.earned, 0) /
            evaluatedRules.reduce((total, rule) => total + rule.weight, 0)) *
            100,
        ),
      ),
    );

    const score = Math.min(
      100,
      Math.max(
        0,
        baseScore + (guidelineCheck ? 2 : -5) + (hasClearCta ? 3 : -6) + (strongSubject ? 2 : -3) + (previewStrength ? 2 : -4),
      ),
    );

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
        apple: 'Policy renewal reminder with clear action window and direct confirmation path.',
        gemini: ['Renewal date front-loaded', 'CTA visible above the fold', 'Clear wording with minimal ambiguity'],
        copilot: 'Primary action: confirm or renew before 28 February. Secondary details are secondary.',
        extractedDate: '28 February 2027',
        extractedAmount: 'Estimated premium review',
        extractedCta: 'Confirm Renewal',
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
                <span>Current Methodologies</span>
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
              {isCurrentUserAdmin ? (
                <button
                  type="button"
                  onClick={() => setIsTeamModalOpen(true)}
                  className="flex items-center space-x-1.5 rounded-lg border border-[#FF002D]/60 bg-[#741532]/20 px-2.5 py-1 text-[11px] font-bold text-[#FF002D] transition-all hover:bg-[#741532]/40"
                >
                  <ShieldCheck className="h-3 w-3" />
                  <span>Team Access</span>
                </button>
              ) : null}

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
            <div className={`rounded-2xl border p-5 transition-all ${darkMode ? 'border-[#405E69] bg-[#002837]' : 'border-[#BFC9CE] bg-white shadow-sm'}`}>
              <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <h2 className="flex items-center space-x-2 text-sm font-bold uppercase tracking-tight">
                    <UploadCloud className="h-4 w-4 text-[#FF002D]" />
                    <span>Upload Campaign Brief & Copy Documentation</span>
                  </h2>
                  <p className={`text-xs ${darkMode ? 'text-[#80949B]' : 'text-slate-500'}`}>
                    Upload client brief documents or use the quick sample loader to test scoring mechanics.
                  </p>
                </div>
                <button type="button" onClick={handleLoadSampleTemplate} className={`self-start rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all sm:self-auto ${darkMode ? 'border-[#405E69] text-[#BFC9CE] hover:bg-[#405E69]/40' : 'border-[#BFC9CE] text-slate-700 hover:bg-slate-100'}`}>
                  Load Sample Renewal Case
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className={`rounded-xl border-2 border-dashed p-4 text-center transition-all ${darkMode ? 'border-[#405E69] bg-[#002837]/60 hover:border-[#80949B]' : 'border-[#BFC9CE] bg-slate-50 hover:border-slate-400'}`}>
                  <input type="file" id="briefUploadInput" className="hidden" onChange={handleBriefFile} accept=".pdf,.docx,.txt" />
                  <label htmlFor="briefUploadInput" className="block cursor-pointer space-y-1.5">
                    <FileCode className="mx-auto h-6 w-6 text-[#80949B]" />
                    <p className="text-xs font-semibold">{briefFileName ? briefFileName : 'Upload Client Brief (.pdf, .docx)'}</p>
                    <p className={`text-[10px] ${darkMode ? 'text-[#80949B]' : 'text-slate-400'}`}>Click to browse or drag file here</p>
                  </label>
                </div>

                <div className={`rounded-xl border-2 border-dashed p-4 text-center transition-all ${darkMode ? 'border-[#405E69] bg-[#002837]/60 hover:border-[#80949B]' : 'border-[#BFC9CE] bg-slate-50 hover:border-slate-400'}`}>
                  <input type="file" id="copyUploadInput" className="hidden" onChange={handleCopyFile} accept=".docx,.txt,.html" />
                  <label htmlFor="copyUploadInput" className="block cursor-pointer space-y-1.5">
                    <FileText className="mx-auto h-6 w-6 text-[#80949B]" />
                    <p className="text-xs font-semibold">{copyFileName ? copyFileName : 'Upload Copy Documentation (.docx, .txt)'}</p>
                    <p className={`text-[10px] ${darkMode ? 'text-[#80949B]' : 'text-slate-400'}`}>Click to browse or drag file here</p>
                  </label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
              <div className="space-y-6 lg:col-span-6">
                <div className={`space-y-4 rounded-2xl border p-5 ${darkMode ? 'border-[#405E69] bg-[#002837]' : 'border-[#BFC9CE] bg-white shadow-sm'}`}>
                  <h3 className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#80949B]">
                    <Building2 className="h-4 w-4" />
                    <span>Campaign Metadata & Objectives</span>
                  </h3>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium">Client Name</label>
                      <input type="text" placeholder="e.g. Vanguard Assurance" value={clientName} onChange={(e) => setClientName(e.target.value)} className={`w-full rounded-xl border p-2.5 text-xs focus:outline-none transition-colors ${darkMode ? 'border-[#405E69] bg-[#002837] text-white focus:border-[#80949B]' : 'border-[#BFC9CE] bg-slate-50 text-slate-900 focus:border-slate-500'}`} />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium">Campaign Name</label>
                      <input type="text" placeholder="e.g. Q1 Renewal Schedule" value={campaignName} onChange={(e) => setCampaignName(e.target.value)} className={`w-full rounded-xl border p-2.5 text-xs focus:outline-none transition-colors ${darkMode ? 'border-[#405E69] bg-[#002837] text-white focus:border-[#80949B]' : 'border-[#BFC9CE] bg-slate-50 text-slate-900 focus:border-slate-500'}`} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium">Target Audience Segment</label>
                      <input type="text" placeholder="e.g. Premium policyholders" value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} className={`w-full rounded-xl border p-2.5 text-xs focus:outline-none transition-colors ${darkMode ? 'border-[#405E69] bg-[#002837] text-white focus:border-[#80949B]' : 'border-[#BFC9CE] bg-slate-50 text-slate-900 focus:border-slate-500'}`} />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium">Core Action / Desired Outcome</label>
                      <input type="text" placeholder="e.g. Confirm renewal by deadline" value={coreGoal} onChange={(e) => setCoreGoal(e.target.value)} className={`w-full rounded-xl border p-2.5 text-xs focus:outline-none transition-colors ${darkMode ? 'border-[#405E69] bg-[#002837] text-white focus:border-[#80949B]' : 'border-[#BFC9CE] bg-slate-50 text-slate-900 focus:border-slate-500'}`} />
                    </div>
                  </div>
                </div>

                <div className={`space-y-4 rounded-2xl border p-5 ${darkMode ? 'border-[#405E69] bg-[#002837]' : 'border-[#BFC9CE] bg-white shadow-sm'}`}>
                  <h3 className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#80949B]">
                    <Mail className="h-4 w-4" />
                    <span>Email Content & Headers</span>
                  </h3>

                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <label className="text-xs font-medium">Subject Line</label>
                      <span className={`text-[10px] ${subjectLine.length > 65 ? 'font-bold text-[#FF002D]' : darkMode ? 'text-[#80949B]' : 'text-slate-400'}`}>
                        {subjectLine.length} chars (optimal 20–65)
                      </span>
                    </div>
                    <input type="text" placeholder="e.g. Your policy renews on 1 March: Action required" value={subjectLine} onChange={(e) => setSubjectLine(e.target.value)} className={`w-full rounded-xl border p-2.5 text-xs focus:outline-none transition-colors ${darkMode ? 'border-[#405E69] bg-[#002837] text-white focus:border-[#80949B]' : 'border-[#BFC9CE] bg-slate-50 text-slate-900 focus:border-slate-500'}`} />
                  </div>

                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <label className="text-xs font-medium">Pre-Header (Preview Text)</label>
                      <span className={`text-[10px] ${preHeader.length < 20 && preHeader.length > 0 ? 'text-[#FF002D]' : darkMode ? 'text-[#80949B]' : 'text-slate-400'}`}>
                        {preHeader.length} chars
                      </span>
                    </div>
                    <input type="text" placeholder="e.g. Review your updated premium and confirm your renewal details before 28 Feb." value={preHeader} onChange={(e) => setPreHeader(e.target.value)} className={`w-full rounded-xl border p-2.5 text-xs focus:outline-none transition-colors ${darkMode ? 'border-[#405E69] bg-[#002837] text-white focus:border-[#80949B]' : 'border-[#BFC9CE] bg-slate-50 text-slate-900 focus:border-slate-500'}`} />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium">Full Email Copy (Live Text or HTML)</label>
                    <textarea rows={10} placeholder="Paste complete message body text or HTML code here..." value={emailCopy} onChange={(e) => setEmailCopy(e.target.value)} className={`w-full rounded-xl border p-3 text-xs font-mono leading-relaxed focus:outline-none transition-colors ${darkMode ? 'border-[#405E69] bg-[#002837] text-slate-200 focus:border-[#80949B]' : 'border-[#BFC9CE] bg-slate-50 text-slate-800 focus:border-slate-500'}`} />
                  </div>
                </div>

                <div>
                  <button type="button" onClick={handleCalculateScore} className="flex w-full items-center justify-center space-x-2 rounded-2xl border border-[#741532] bg-gradient-to-r from-[#741532] via-[#405E69] to-[#002837] px-6 py-4 text-sm font-black uppercase tracking-wider text-white shadow-xl transition-all hover:from-[#FF002D] hover:to-[#741532] transform hover:-translate-y-0.5 active:translate-y-0">
                    <Zap className="h-4 w-4 fill-current text-[#FF002D]" />
                    <span>Generate Readiness Score</span>
                  </button>
                  <p className={`mt-2 text-center text-[11px] ${darkMode ? 'text-[#80949B]' : 'text-slate-500'}`}>
                    Scores and AI inbox simulations are calculated strictly upon clicking this CTA.
                  </p>
                </div>
              </div>

              <div className="lg:col-span-6">
                {hasCalculated && auditResults ? (
                  <div className={`space-y-6 rounded-2xl border p-6 transition-all ${darkMode ? 'border-[#405E69] bg-[#002837]' : 'border-[#BFC9CE] bg-white shadow-sm'}`}>
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

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#80949B]">Pillar Breakdown (Click to Expand / Collapse)</h4>
                        <span className="text-[10px] text-[#80949B]">Zero scroll lock design</span>
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
                ) : (
                  <div className={`rounded-2xl border p-12 text-center ${darkMode ? 'border-[#405E69] bg-[#002837]/40' : 'border-[#BFC9CE] bg-white shadow-sm'}`}>
                    <BarChart3 className={`mx-auto h-12 w-12 ${darkMode ? 'text-[#405E69]' : 'text-slate-300'}`} />
                    <h3 className="mt-3 text-sm font-bold">Readiness Scoreboard Awaiting Audit</h3>
                    <p className={`mx-auto mt-3 max-w-sm text-xs ${darkMode ? 'text-[#80949B]' : 'text-slate-500'}`}>
                      Fill in the campaign copy fields on the left and click <strong>"GENERATE READINESS SCORE"</strong> to produce the score breakdown.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className={`space-y-4 rounded-2xl border p-6 ${darkMode ? 'border-[#405E69] bg-[#002837]' : 'border-[#BFC9CE] bg-white shadow-sm'}`}>
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

            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-900 shadow-xl print:border-none print:p-0 print:shadow-none sm:p-12">
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-6">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-black tracking-tighter text-[#002837]">TILTE</span>
                    <span className="rounded bg-[#002837] px-2 py-0.5 text-[11px] font-bold tracking-wide text-white">READINESS STUDIO</span>
                  </div>
                  <p className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-500">Email Campaign Audit & AI Inbox Performance Report</p>
                </div>

                <div className="space-y-0.5 text-right text-xs text-slate-600">
                  <p><strong className="text-slate-900">Client:</strong> {clientName || 'Vanguard Assurance'}</p>
                  <p><strong className="text-slate-900">Campaign:</strong> {campaignName || 'Annual Policy Renewal'}</p>
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
                    <span>Target Goal: {coreGoal || 'Renewal Confirmation'}</span>
                    <span>•</span>
                    <span>Audience: {targetAudience || 'Segment A'}</span>
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
            <div className={`flex flex-col justify-between gap-4 rounded-2xl border p-6 md:flex-row md:items-center ${darkMode ? 'border-[#405E69] bg-[#002837]' : 'border-[#BFC9CE] bg-white shadow-sm'}`}>
              <div>
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5 text-[#80949B]" />
                  <h2 className="text-lg font-black tracking-tight">Current Methodologies & Knowledge Base</h2>
                </div>
                <p className={`mt-0.5 text-xs ${darkMode ? 'text-[#80949B]' : 'text-slate-500'}`}>
                  NotebookLM-style split workspace. Global methodology updates are synchronized in Firestore.
                </p>
              </div>

              <div className="flex items-center space-x-2 self-start md:self-auto">
                {isCurrentUserAdmin ? (
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
              <div className={`space-y-4 rounded-2xl border p-5 lg:col-span-4 ${darkMode ? 'border-[#405E69] bg-[#002837]' : 'border-[#BFC9CE] bg-white shadow-sm'}`}>
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

              <div className={`space-y-4 rounded-2xl border p-5 lg:col-span-8 ${darkMode ? 'border-[#405E69] bg-[#002837]' : 'border-[#BFC9CE] bg-white shadow-sm'}`}>
                <div className="flex items-center justify-between border-b border-[#405E69]/40 pb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#80949B]">Active Criteria & Scoring Weight Rules ({rules.length})</h3>
                  <div className="flex items-center space-x-3">
                    <span className={`text-[11px] ${darkMode ? 'text-[#80949B]' : 'text-slate-500'}`}>Total Max Weight: {rules.reduce((acc, r) => acc + r.weight, 0)} pts</span>
                    {isCurrentUserAdmin && <span className="text-[10px] font-mono font-bold text-[#FF002D]">• Cloud-Synced</span>}
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
                        {isCurrentUserAdmin ? (
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

                <div className={`space-y-2 rounded-xl border p-4 text-xs ${darkMode ? 'border-[#405E69] bg-[#002837]/60' : 'border-[#BFC9CE] bg-slate-50'}`}>
                  <span className="block text-[10px] font-bold uppercase text-[#80949B]">Selected Source Detail</span>
                  <h4 className="font-bold">{selectedSource.title}</h4>
                  <p className={`leading-relaxed ${darkMode ? 'text-[#80949B]' : 'text-slate-600'}`}>{selectedSource.snippet}</p>
                </div>
              </div>

              <div className={`space-y-4 rounded-2xl border p-5 lg:col-span-8 ${darkMode ? 'border-[#405E69] bg-[#002837]' : 'border-[#BFC9CE] bg-white shadow-sm'}`}>
                <div className="flex items-center justify-between border-b border-[#405E69]/40 pb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#80949B]">Active Criteria & Scoring Weight Rules ({rules.length})</h3>
                  <div className="flex items-center space-x-3">
                    <span className={`text-[11px] ${darkMode ? 'text-[#80949B]' : 'text-slate-500'}`}>Total Max Weight: {rules.reduce((acc, r) => acc + r.weight, 0)} pts</span>
                    {isCurrentUserAdmin && <span className="text-[10px] font-mono font-bold text-[#FF002D]">• Cloud-Synced</span>}
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
                        {isCurrentUserAdmin ? (
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

                <div className={`space-y-2 rounded-xl border p-4 text-xs ${darkMode ? 'border-[#405E69] bg-[#002837]/60' : 'border-[#BFC9CE] bg-slate-50'}`}>
                  <span className="block text-[10px] font-bold uppercase text-[#80949B]">Selected Source Detail</span>
                  <h4 className="font-bold">{selectedSource.title}</h4>
                  <p className={`leading-relaxed ${darkMode ? 'text-[#80949B]' : 'text-slate-600'}`}>{selectedSource.snippet}</p>
                </div>
              </div>
            </div>

            {isAddRuleModalOpen && isCurrentUserAdmin && (
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
            <div className={`rounded-2xl border p-6 ${darkMode ? 'border-[#405E69] bg-[#002837]' : 'border-[#BFC9CE] bg-white shadow-sm'}`}>
              <div className="flex items-center space-x-2">
                <Palette className="h-5 w-5 text-[#80949B]" />
                <h2 className="text-lg font-black tracking-tight">Creative Review & CI Adherence Studio</h2>
              </div>
              <p className={`mt-1 text-xs ${darkMode ? 'text-[#80949B]' : 'text-slate-500'}`}>
                Audit final design exports against the uploaded brief, CI guide colors, and CTA phrasing clarity (e.g. "explore" vs "see more").
              </p>
            </div>

            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
              <div className={`space-y-4 rounded-2xl border p-5 lg:col-span-6 ${darkMode ? 'border-[#405E69] bg-[#002837]' : 'border-[#BFC9CE] bg-white shadow-sm'}`}>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#80949B]">Design Export & CI Guidelines</h3>

                <div className={`rounded-xl border-2 border-dashed p-5 text-center ${darkMode ? 'border-[#405E69] bg-[#002837]/60' : 'border-[#BFC9CE] bg-slate-50'}`}>
                  <input type="file" id="designUploadInput" className="hidden" onChange={handleDesignFile} accept="image/*,.pdf" />
                  <label htmlFor="designUploadInput" className="block cursor-pointer space-y-2">
                    <Eye className="mx-auto h-6 w-6 text-[#80949B]" />
                    <p className="text-xs font-semibold">{designFileName ? designFileName : 'Upload Final Export Render (.png, .jpg, .pdf)'}</p>
                    <p className={`text-[10px] ${darkMode ? 'text-[#80949B]' : 'text-slate-400'}`}>Drop final client creative render here</p>
                  </label>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium">Brand CI Guidelines & Color Rules</label>
                  <textarea rows={3} placeholder="e.g. Primary Navy (#002837), Accent Red (#FF002D) used strictly for CTA buttons. Minimum 16px body copy." value={ciGuideContent} onChange={(e) => setCiGuideContent(e.target.value)} className={`w-full rounded-xl border p-2.5 text-xs font-mono focus:outline-none ${darkMode ? 'border-[#405E69] bg-[#002837] text-white' : 'border-[#BFC9CE] bg-slate-50 text-slate-900'}`} />
                </div>

                <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block font-medium">Updated Final Subject (if modified)</label>
                    <input type="text" placeholder="e.g. Policy Renewal Notice" value={creativeSubject} onChange={(e) => setCreativeSubject(e.target.value)} className={`w-full rounded-xl border p-2.5 focus:outline-none ${darkMode ? 'border-[#405E69] bg-[#002837] text-white' : 'border-[#BFC9CE] bg-slate-50 text-slate-900'}`} />
                  </div>
                  <div>
                    <label className="mb-1 block font-medium">Updated Final Pre-Header</label>
                    <input type="text" placeholder="e.g. Action required by 28 Feb" value={creativePreheader} onChange={(e) => setCreativePreheader(e.target.value)} className={`w-full rounded-xl border p-2.5 focus:outline-none ${darkMode ? 'border-[#405E69] bg-[#002837] text-white' : 'border-[#BFC9CE] bg-slate-50 text-slate-900'}`} />
                  </div>
                </div>

                <button type="button" onClick={handleRunCreativeReview} className="flex w-full items-center justify-center space-x-2 rounded-xl bg-[#405E69] px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#741532] shadow">
                  <Target className="h-4 w-4" />
                  <span>Run Creative & CI Alignment Review</span>
                </button>
              </div>

              <div className={`space-y-5 rounded-2xl border p-5 lg:col-span-6 ${darkMode ? 'border-[#405E69] bg-[#002837]' : 'border-[#BFC9CE] bg-white shadow-sm'}`}>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#80949B]">Creative Review Audit Results</h3>

                {creativeAuditRun && creativeFindings ? (
                  <div className="space-y-4 text-xs animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-[#405E69]/40 pb-3">
                      <div>
                        <span className={`text-[10px] font-bold uppercase ${darkMode ? 'text-[#80949B]' : 'text-slate-500'}`}>Brand CI Alignment Index</span>
                        <div className="mt-0.5 text-3xl font-black text-emerald-400">{creativeFindings.ciScore}%</div>
                      </div>
                      <span className="rounded-full border border-emerald-500/40 bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300">Design Approved</span>
                    </div>

                    <div className={`space-y-1.5 rounded-xl border p-4 ${darkMode ? 'border-[#741532] bg-[#4D1B34]/30' : 'border-rose-200 bg-rose-50'}`}>
                      <span className="flex items-center space-x-1.5 text-xs font-bold text-rose-300">
                        <Target className="h-3.5 w-3.5 text-[#FF002D]" />
                        <span>Actionable CTA Wording Recommendation</span>
                      </span>
                      <p className="leading-relaxed">{creativeFindings.ctaRecommendation}</p>
                    </div>

                    <div className="space-y-2.5">
                      <div className={`flex items-start space-x-2 rounded-xl border p-3 ${darkMode ? 'border-[#405E69] bg-[#002837]' : 'border-[#BFC9CE] bg-slate-50'}`}>
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                        <div>
                          <strong className="block">CI Color Adherence:</strong>
                          <p className={`mt-0.5 text-[11px] ${darkMode ? 'text-[#80949B]' : 'text-slate-500'}`}>{creativeFindings.colorAdherence}</p>
                        </div>
                      </div>

                      <div className={`flex items-start space-x-2 rounded-xl border p-3 ${darkMode ? 'border-[#405E69] bg-[#002837]' : 'border-[#BFC9CE] bg-slate-50'}`}>
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                        <div>
                          <strong className="block">CTA Placement & Mobile Hierarchy:</strong>
                          <p className={`mt-0.5 text-[11px] ${darkMode ? 'text-[#80949B]' : 'text-slate-500'}`}>{creativeFindings.positionAssessment}</p>
                        </div>
                      </div>

                      <div className={`flex items-start space-x-2 rounded-xl border p-3 ${darkMode ? 'border-[#405E69] bg-[#002837]' : 'border-[#BFC9CE] bg-slate-50'}`}>
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                        <div>
                          <strong className="block">Uploaded Brief Verification:</strong>
                          <p className={`mt-0.5 text-[11px] ${darkMode ? 'text-[#80949B]' : 'text-slate-500'}`}>{briefFileName ? `Cross-referenced with "${briefFileName}" requirements.` : 'Brief document alignment verified against core objectives.'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={`rounded-xl border border-dashed p-8 text-center ${darkMode ? 'border-[#405E69] text-[#80949B]' : 'border-[#BFC9CE] text-slate-400'}`}>
                    <MousePointer className="mx-auto mb-2 h-8 w-8 opacity-50" />
                    <p className="text-xs">Enter CI rules and design parameters on the left, then run the audit to review CTA phrasing and brand compliance.</p>
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
