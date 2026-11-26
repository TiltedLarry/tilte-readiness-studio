"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { Loader2, ArrowRight } from "lucide-react";
import { auth, googleProvider } from "@/lib/firebase/client";

export function SplitAuthScreen() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (mode === "signup") {
        const cred = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );
        if (fullName.trim()) {
          await updateProfile(cred.user, { displayName: fullName.trim() });
        }
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message.replace("Firebase: ", "")
          : "Authentication failed."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message.replace("Firebase: ", "")
          : "Google sign-in failed."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass =
    "w-full bg-[#F0F4F9] hover:bg-[#E9EEF6] focus:bg-white text-[#1F1F1F] placeholder:text-[#747775] text-sm rounded-2xl px-4 py-3.5 border-0 outline-none focus:ring-2 focus:ring-[#0B57D0] transition-all";

  return (
    <div className="min-h-screen w-full flex bg-[#F8FAFD]">
      {/* Left Half: Full-Height Visual Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#0B57D0]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/auth-hero.jpg"
          alt="Creative campaign workspace"
          className="absolute inset-0 w-full h-full object-cover opacity-85"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#001D35]/90 via-[#001D35]/35 to-transparent" />

        <div className="relative z-10 my-auto p-12 lg:p-16 text-white max-w-xl space-y-4">
          <h2 className="text-3xl font-bold leading-snug tracking-tight">
            Ship client campaigns with confidence. Every subject line, layout,
            and brand rule verified before send.
          </h2>
          <p className="text-sm text-white/80 leading-relaxed">
            Audit copy alignment, preview inbox AI summaries, and validate
            Figma exports against your client Corporate CI in one workspace.
          </p>
        </div>
      </div>

      {/* Right Half: Google Workspace Sign-In / Sign-Up Card */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 shadow-[0_1px_3px_0_rgba(0,0,0,0.06)] space-y-6">
          <div className="space-y-2">
            <Image
              src="/studio-icon.svg"
              alt="Tilte Email Readiness Studio"
              width={44}
              height={44}
              className="h-11 w-auto object-contain mb-4"
              priority
            />
            <h1 className="text-2xl font-normal text-[#1F1F1F] tracking-tight">
              {mode === "signin"
                ? "Sign in to Email Readiness Studio"
                : "Create your account"}
            </h1>
            <p className="text-sm text-[#444746]">
              {mode === "signin"
                ? "Access your client audits, saved scores, and brand guides."
                : "Set up an account manager workspace to save client reports."}
            </p>
          </div>

          {error && (
            <div className="p-3.5 text-xs text-[#B3261E] bg-[#F9DEDC] rounded-2xl">
              {error}
            </div>
          )}

          {/* Google SSO Pill Button */}
          <button
            type="button"
            disabled={isLoading}
            onClick={handleGoogleSignIn}
            className="w-full h-12 rounded-full bg-[#F0F4F9] hover:bg-[#E9EEF6] text-[#1F1F1F] text-sm font-medium flex items-center justify-center gap-3 transition-colors cursor-pointer"
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
            <div className="h-px flex-1 bg-[#E9EEF6]" />
            <span>or with work email</span>
            <div className="h-px flex-1 bg-[#E9EEF6]" />
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#444746] px-1">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., Thabo Ndlovu"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#444746] px-1">
                Work Email
              </label>
              <input
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#444746] px-1">
                Password
              </label>
              <input
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
              className="w-full h-12 rounded-full bg-[#0B57D0] hover:bg-[#0842A0] disabled:opacity-60 text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>
                    {mode === "signin" ? "Sign In" : "Create Account"}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setError(null);
              }}
              className="text-xs font-medium text-[#0B57D0] hover:underline cursor-pointer"
            >
              {mode === "signin"
                ? "New account manager? Create an account"
                : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
