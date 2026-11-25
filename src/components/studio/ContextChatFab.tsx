"use client";

import React, { useState } from "react";
import { Sparkles, Send, Loader2, X } from "lucide-react";

interface Message {
  role: "user" | "model";
  text: string;
}

interface ContextChatFabProps {
  reportId: string;
  styleGuideId: string;
}

export function ContextChatFab({
  reportId,
  styleGuideId,
}: ContextChatFabProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "model",
      text: "I'm locked to this campaign's Audit Report and Brand Style Guide. Ask me how to rewrite flagged copy or fix visual compliance issues.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const updatedMessages: Message[] = [
      ...messages,
      { role: "user", text: input.trim() },
    ];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId,
          styleGuideId,
          messages: updatedMessages,
        }),
      });

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: data.reply || data.error || "Unable to respond right now.",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "model", text: "Network error reaching assistant." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Google Workspace Extended FAB */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 px-6 rounded-full bg-[#C2E7FF] hover:bg-[#B3D7EF] text-[#001D35] font-medium text-sm shadow-md hover:shadow-lg flex items-center gap-2.5 transition-all z-50 cursor-pointer"
        >
          <Sparkles className="w-5 h-5 text-[#0B57D0]" />
          <span>Ask Audit Assistant</span>
        </button>
      )}

      {/* Borderless Floating Workspace Side Card */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[380px] sm:w-[420px] h-[540px] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden z-50">
          {/* Header */}
          <div className="px-5 py-4 bg-[#F0F4F9] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#0B57D0]" />
              <div>
                <h3 className="text-sm font-medium text-[#1F1F1F]">
                  Readiness Assistant
                </h3>
                <p className="text-[11px] text-[#444746]">
                  Scoped to active report & brand rules
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full hover:bg-[#E1E6EE] flex items-center justify-center text-[#444746] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-[#0B57D0] text-white rounded-3xl rounded-br-md ml-10"
                    : "bg-[#F0F4F9] text-[#1F1F1F] rounded-3xl rounded-bl-md mr-8"
                }`}
              >
                {msg.text}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-[#444746] px-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0B57D0]" />
                Checking report...
              </div>
            )}
          </div>

          {/* Borderless Pill Input Bar */}
          <form onSubmit={sendMessage} className="p-3 bg-white flex gap-2">
            <input
              type="text"
              placeholder="Ask how to fix a flagged rule..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 h-11 px-4 rounded-full bg-[#F0F4F9] focus:bg-[#E9EEF6] text-sm text-[#1F1F1F] placeholder:text-[#747775] border-0 outline-none"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="w-11 h-11 rounded-full bg-[#0B57D0] hover:bg-[#0842A0] disabled:opacity-40 text-white flex items-center justify-center shrink-0 transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
