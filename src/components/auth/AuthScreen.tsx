"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { ShieldCheck, Sparkles, CheckCircle2, Loader2 } from "lucide-react";
import { auth, googleProvider } from "@/lib/firebase/client";

export function AuthScreen() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Google sign-in failed."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      if (mode === "signin") {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Authentication failed."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass =
    "w-full bg-[#F0F4F9] hover:bg-[#E9EEF6] focus:bg-white text-[#1F1F1F] placeholder:text-[#747775] text-sm rounded-2xl px-4 py-3 border-0 outline-none focus:ring-2 focus:ring-[#0B57D0] transition-all";

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-[#F8FAFD]">
      {/* Left Pane: Full-Bleed Studio Visual */}
      <div className="lg:col-span-6 bg-gradient-to-br from-[#0B57D0] via-[#174EA6] to-[#0842A0] text-white p-8 sm:p-12 flex flex-col justify-between">
        <div className="flex items-center gap-3">
          <Image
            src="/studio-icon.svg"
            alt="Tilte Email Readiness Studio"
            width={40}
            height={40}
            className="h-10 w-auto object-contain"
            priority
          />
          <span className="font-medium text-base tracking-tight">
            Tilte Email Readiness Studio
          </span>
        </div>

        <div className="my-12 space-y-6 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            Pre-Flight Campaign QA Workspace
          </div>

          <h1 className="text-3xl sm:text-4xl font-medium tracking-tight leading-tight">
            Ship every client email campaign with deterministic confidence.
          </h1>

          <p className="text-sm text-white/80 leading-relaxed">
            Audit subject lines, copy tone, Figma exports, and inbox AI
            summaries against your client&apos;s Corporate CI before a single
            campaign goes live.
          </p>

          <div className="space-y-3 pt-2 text-sm text-white/90">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#C4EED0] shrink-0" />
              <span>Parallel 3-pillar Gemini copy, visual &amp; inbox audits</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#C4EED0] shrink-0" />
              <span>Private campaign report history scoped to your account</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#C4EED0] shrink-0" />
              <span>Context-locked assistant for instant copy &amp; layout fixes</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-white/70">
          <ShieldCheck className="w-4 h-4" />
          <span>Protected by Firebase Authentication &amp; Firestore</span>
        </div>
      </div>

      {/* Right Pane: Borderless Google Workspace Sign-In Card */}
      <div className="lg:col-span-6 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-[0_1px_3px_0_rgba(0,0,0,0.06)] space-y-6">
          <div>
            <h2 className="text-2xl font-medium text-[#1F1F1F]">
              {mode === "signin"
                ? "Sign in to Studio"
                : "Create manager account"}
            </h2>
            <p className="text-xs text-[#444746] mt-1">
              {mode === "signin"
                ? "Access your saved client audits and readiness tools."
                : "Set up your account to save and reload campaign reports."}
            </p>
          </div>

          {error && (
            <div className="p-3.5 text-xs text-[#B3261E] bg-[#F9DEDC] rounded-2xl">
              {error}
            </div>
          )}

          <button
            type="button"
            disabled={isLoading}
            onClick={handleGoogleSignIn}
            className="w-full h-12 rounded-full bg-[#F0F4F9] hover:bg-[#E9EEF6] text-[#1F1F1F] text-sm font-medium flex items-center justify-center gap-2.5 transition-colors cursor-pointer disabled:opacity-60"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="flex items-center gap-3 text-xs text-[#747775]">
            <div className="flex-1 h-px bg-[#E9EEF6]" />
            <span>or use email</span>
            <div className="flex-1 h-px bg-[#E9EEF6]" />
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="auth-email"
                className="block text-xs font-medium text-[#444746] px-1"
              >
                Work Email
              </label>
              <input
                id="auth-email"
                type="email"
                placeholder="name@tilte.cx"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="auth-password"
                className="block text-xs font-medium text-[#444746] px-1"
              >
                Password
              </label>
              <input
                id="auth-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                minLength={6}
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-full bg-[#0B57D0] hover:bg-[#0842A0] text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>
                {mode === "signin" ? "Sign In" : "Create Account"}
              </span>
            </button>
          </form>

          <div className="text-center text-xs text-[#444746]">
            {mode === "signin" ? (
              <>
                New to the studio?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setError(null);
                  }}
                  className="text-[#0B57D0] font-medium hover:underline cursor-pointer"
                >
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    setError(null);
                  }}
                  className="text-[#0B57D0] font-medium hover:underline cursor-pointer"
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
