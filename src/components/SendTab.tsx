"use client";

import React, { useState, useEffect } from "react";
import { SendHorizontal, ArrowUpRight, Coins, Sparkles, Check, Copy, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import CustomNumberInput from "./ui/CustomNumberInput";
import { parseAiIntent } from "@/lib/aiParser";
import { validateStellarAddress } from "@/lib/utils";

interface SendTabProps {
  balance: string | null;
  recipient: string;
  setRecipient: (val: string) => void;
  amount: string;
  setAmount: (val: string) => void;
  isRouted: boolean;
  setIsRouted: (val: boolean) => void;
  sendLoading: boolean;
  txStatus: "idle" | "sending" | "success" | "failed";
  setTxStatus: (val: "idle" | "sending" | "success" | "failed") => void;
  handleSend: (e: React.FormEvent) => void;
  isAiEnabled: boolean;
  showToast: (msg: string, type: "success" | "error" | "info") => void;
  slippage: string;
  connect: () => void;
  isConnected: boolean;
}

export default function SendTab({
  balance,
  recipient,
  setRecipient,
  amount,
  setAmount,
  isRouted,
  setIsRouted,
  sendLoading,
  txStatus,
  setTxStatus,
  handleSend,
  isAiEnabled,
  showToast,
  slippage,
  connect,
  isConnected,
}: SendTabProps) {
  const [aiExpanded, setAiExpanded] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [copied, setCopied] = useState(false);

  const placeholders = [
    "Send 50 XLM to GBRP...",
    "Swap 100 XLM to USDC",
    "Pay 20 XLM to G...",
  ];
  const [phIdx, setPhIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setPhIdx((prev) => (prev + 1) % placeholders.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleAiParse = () => {
    if (!aiInput.trim()) return;
    try {
      const parsed = parseAiIntent(aiInput);
      if (parsed.recipient) setRecipient(parsed.recipient);
      if (parsed.amount) setAmount(parsed.amount);
      if (parsed.type === "escrow") {
        setIsRouted(true);
      } else {
        setIsRouted(false);
      }
      showToast("Form pre-filled successfully!", "success");
      setAiExpanded(false);
    } catch (err: any) {
      showToast("Parsing failed: " + err.message, "error");
    }
  };

  const displayRecipient = () => {
    if (!recipient) return "";
    if (isFocused || recipient.length <= 16) return recipient;
    return `${recipient.slice(0, 8)}...${recipient.slice(-8)}`;
  };

  const handleCopy = () => {
    if (recipient) {
      navigator.clipboard.writeText(recipient);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isValidAddress = validateStellarAddress(recipient);

  return (
    <div className="space-y-6" data-testid="send-tab-root">
      <h3 className="text-xl font-semibold font-display text-slate-100 text-left px-1 mb-6">
        Transfer Assets
      </h3>

      {/* 1. Balance Card (Gradient Border + Subtle Glow) */}
      {isConnected && balance !== null && (
        <div className="relative p-[1.5px] rounded-2xl overflow-hidden bg-gradient-to-r from-teal-400 via-primary-blue to-primary-indigo animate-gradient-spin shadow-lg shadow-teal-500/5" data-testid="balance-card">
          <div className="p-4 rounded-2xl bg-space-800 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Available Balance
              </span>
              <h2 className="text-3xl font-bold font-mono text-slate-100 flex items-baseline gap-1" data-testid="balance-value">
                {Number(balance).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
                <span className="text-sm text-teal-400 font-sans font-bold">XLM</span>
              </h2>
            </div>
            <div className="w-10 h-10 rounded-full bg-teal-500/10 border border-teal-500/30 flex items-center justify-center shadow-[0_0_12px_rgba(45,212,191,0.2)]">
              <Coins className="w-5 h-5 text-teal-400 animate-pulse-glow" />
            </div>
          </div>
        </div>
      )}

      {/* 2. AI Smart Strip (Teal-tinted glass card, collapsible) */}
      {isAiEnabled && isConnected && txStatus === "idle" && (
        <div
          className="rounded-xl border border-teal-500/15 hover:border-teal-500/35 bg-teal-950/10 hover:bg-teal-950/15 backdrop-blur-md overflow-hidden transition-all duration-200 hover:shadow-[0_0_12px_rgba(45,212,191,0.04)]"
          data-testid="ai-smart-strip"
        >
          <button
            type="button"
            onClick={() => setAiExpanded(!aiExpanded)}
            className="w-full h-12 px-4 flex items-center justify-between text-xs text-slate-300 hover:text-slate-100 focus-ring cursor-pointer transition-colors duration-200"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-400 animate-pulse-glow" />
              <span className="font-medium text-slate-400">
                AI Assist: <span className="text-slate-200">{placeholders[phIdx]}</span>
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <motion.span
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="text-[10px] text-teal-400 font-bold inline-block"
              >
                {aiExpanded ? "Collapse" : "Expand"}
              </motion.span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-teal-400 transition-transform duration-200 shrink-0 ${
                  aiExpanded ? "rotate-180" : ""
                }`}
              />
            </div>
          </button>

          <AnimatePresence initial={false}>
            {aiExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="p-3.5 pt-0 space-y-3">
                  <div className="sr-only">AI Smart Assist Console</div>
                  <textarea
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    placeholder="e.g. Send 50 XLM to GBRP..."
                    rows={2}
                    className="w-full p-2.5 rounded-xl bg-space-950/80 border border-space-700/60 focus:border-teal-500/30 text-xs text-slate-100 placeholder-slate-500 outline-none resize-none transition-all"
                  />
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="button"
                    onClick={handleAiParse}
                    className="w-full h-9 rounded-lg bg-teal-500/10 border border-teal-500/30 hover:bg-teal-500/20 text-xs font-bold text-teal-400 transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Parse Command
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* 3. Main Transfer Form */}
      {isConnected && txStatus === "idle" && (
        <form onSubmit={handleSend} className="p-5 rounded-2xl glass-card text-left space-y-5" data-testid="send-form">
          {/* Recipient Input (Middle Truncated on Blur) */}
          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <label className="text-xs font-bold text-slate-300">
                Recipient Address
              </label>
              {recipient && isValidAddress && (
                <button
                  type="button"
                  onClick={handleCopy}
                  className="text-[10px] text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  Copy Address
                </button>
              )}
            </div>
            <div className="relative">
              <input
                type="text"
                required
                value={displayRecipient()}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="G..."
                className="w-full h-12 pl-4 pr-10 rounded-xl bg-space-900/50 border border-space-700/40 focus:border-teal-500/35 text-sm font-mono text-slate-100 placeholder-slate-500 outline-none transition-all focus-ring"
                data-testid="recipient-input"
              />
              <div className="absolute right-3 top-3.5 text-slate-500">
                <ArrowUpRight className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Amount input using CustomNumberInput */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 px-1">
              Send Amount
            </label>
            <CustomNumberInput
              value={amount}
              onChange={setAmount}
              suffix="XLM"
              min={0.0000001}
              step={1}
              placeholder="0.00"
            />
          </div>

          {/* Route toggle */}
          <div className="p-3.5 rounded-xl bg-space-950/40 border border-space-800/80 flex items-center justify-between">
            <div className="space-y-0.5 text-left">
              <span className="text-xs font-bold text-slate-200">
                Route via Soroban Contract
              </span>
              <p className="text-[10px] text-slate-400">
                Swaps and executes payment through on-chain router
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsRouted(!isRouted)}
              className={`w-12 h-7 rounded-full transition-colors relative outline-none border border-space-700 cursor-pointer ${
                isRouted ? "bg-teal-500" : "bg-space-800"
              }`}
              data-testid="route-toggle-btn"
            >
              <span
                className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                  isRouted ? "left-6" : "left-1"
                }`}
              />
            </button>
          </div>

          {/* 4. Path routing visualization with flowing dots */}
          {isRouted && (
            <div className="p-4 rounded-2xl glass-card border-teal-500/20 bg-space-900/40 space-y-4" data-testid="route-visualizer">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-200 uppercase tracking-wider">
                  Router Route Path
                </span>
                <span className="text-[9px] text-emerald-400 font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  Optimal path found
                </span>
              </div>

              {/* SVG path visualization with flowing dots */}
              <div className="flex items-center justify-between bg-space-950/40 p-3.5 rounded-xl border border-space-850">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-teal-500/10 border border-teal-500/30 flex items-center justify-center font-bold text-teal-400 text-xs shadow-md shadow-teal-500/5">
                    XLM
                  </div>
                  <span className="text-[8px] text-slate-500 font-mono mt-1">Source</span>
                </div>

                <div className="flex-1 px-3 relative h-6 flex items-center justify-center">
                  <svg className="w-full h-2 absolute inset-0 my-auto" fill="none">
                    <line x1="0" y1="4" x2="100%" y2="4" className="stroke-teal-400/20 stroke-2" />
                    <line x1="0" y1="4" x2="100%" y2="4" className="stroke-teal-400 stroke-2 animate-flowing-dots" />
                  </svg>
                  <span className="text-[8px] text-slate-300 font-mono absolute -top-4 bg-slate-900 px-1 rounded border border-space-700/50">
                    Rate: 0.117
                  </span>
                </div>

                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center font-bold text-emerald-400 text-xs shadow-md shadow-emerald-500/5">
                    USDC
                  </div>
                  <span className="text-[8px] text-slate-500 font-mono mt-1">Hop</span>
                </div>

                <div className="flex-1 px-3 relative h-6 flex items-center justify-center">
                  <svg className="w-full h-2 absolute inset-0 my-auto" fill="none">
                    <line x1="0" y1="4" x2="100%" y2="4" className="stroke-teal-400/20 stroke-2" />
                    <line x1="0" y1="4" x2="100%" y2="4" className="stroke-teal-400 stroke-2 animate-flowing-dots" />
                  </svg>
                  <span className="text-[8px] text-slate-300 font-mono absolute -top-4 bg-slate-900 px-1 rounded border border-space-700/50">
                    Rate: 58.45
                  </span>
                </div>

                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-primary-cyan/10 border border-primary-cyan/30 flex items-center justify-center font-bold text-primary-cyan text-xs shadow-md shadow-primary-cyan/5">
                    PHP
                  </div>
                  <span className="text-[8px] text-slate-500 font-mono mt-1">Dest</span>
                </div>
              </div>

              {/* exchange rate safety limit info */}
              <div className="space-y-1 pt-1 text-[10px] text-slate-400 font-mono text-left">
                <div className="flex justify-between">
                  <span>Est. Exchange rate:</span>
                  <span className="text-slate-200">1 XLM = 6.84 Mock PHP</span>
                </div>
                <div className="flex justify-between">
                  <span>Slippage Safety Limit:</span>
                  <span className="text-slate-200 font-semibold">Min. Out: {amount ? (parseFloat(amount) * (100 - parseFloat(slippage)) / 100).toFixed(4) : "0.0000"} XLM</span>
                </div>
              </div>
            </div>
          )}

          {/* 5. Fee comparison cards */}
          {isRouted && (
            <div className="grid grid-cols-2 gap-3" data-testid="fee-comparison">
              <div className="p-3 rounded-xl bg-teal-500/5 border border-teal-500/20 flex flex-col justify-between text-left">
                <div>
                  <span className="text-[8px] font-bold text-teal-400 uppercase tracking-wider bg-teal-500/10 px-1.5 py-0.5 rounded">
                    Aethyr Routing
                  </span>
                  <p className="text-sm font-bold text-slate-100 mt-1.5">$0.0001</p>
                </div>
                <p className="text-[9px] text-slate-400 mt-1">Instant Settlement</p>
              </div>

              <div className="p-3 rounded-xl bg-space-850/50 border border-space-700/30 flex flex-col justify-between opacity-60 text-left">
                <div>
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                    Competitors
                  </span>
                  <p className="text-sm font-bold text-slate-400 line-through mt-1.5">$4.50</p>
                </div>
                <p className="text-[9px] text-slate-500 mt-1">1-3 Business Days</p>
              </div>
            </div>
          )}

          {/* 6. CTA Button */}
          <button
            type="submit"
            disabled={sendLoading}
            className={`w-full h-14 rounded-xl text-sm font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer ${
              sendLoading
                ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                : "bg-gradient-to-r from-teal-400 to-primary-indigo text-white hover:shadow-lg hover:shadow-teal-500/10"
            }`}
            data-testid="send-cta-btn"
          >
            {sendLoading ? (
              <span className="w-5 h-5 rounded-full border-2 border-slate-400 border-t-white animate-spin" />
            ) : (
              <>
                <span>Send Transaction</span>
                <ArrowUpRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}

      {/* Disconnected state */}
      {(!isConnected) && (
        <div className="p-8 rounded-2xl glass-card text-center space-y-5" data-testid="disconnected-state">
          <div className="w-14 h-14 rounded-2xl bg-space-900/80 border border-space-700/50 flex items-center justify-center mx-auto shadow-md">
            <Coins className="w-7 h-7 text-teal-400 animate-pulse-glow" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-100">
              Cross-Border Transfers
            </h3>
            <p className="text-xs text-slate-400 max-w-[240px] mx-auto leading-relaxed">
              Connect your wallet to routing transfers, swaps and milestones-based locks.
            </p>
          </div>
          <button
            onClick={connect}
            type="button"
            className="w-full h-11 rounded-xl bg-gradient-to-r from-teal-400 to-primary-indigo text-xs font-bold text-white flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer focus-ring"
            data-testid="disconnected-connect-btn"
          >
            <Coins className="w-4 h-4" />
            Connect Wallet
          </button>
        </div>
      )}
    </div>
  );
}
