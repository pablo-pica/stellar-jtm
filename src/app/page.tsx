"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  SendHorizontal,
  Coins,
  ArrowUpRight,
  TrendingUp,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  Clock,
  Sparkles,
  Settings2,
  Layers,
  Search,
} from "lucide-react";
import { useStellarWallet } from "@/hooks/useStellarWallet";
import { parseAiIntent } from "@/lib/aiParser";
import dynamic from "next/dynamic";
const WalletConnect = dynamic(() => import("@/components/WalletConnect"), {
  ssr: false,
});
import BottomNav, { TabId } from "@/components/BottomNav";
import ProfileDrawer from "@/components/ProfileDrawer";
import { validateStellarAddress } from "@/lib/utils";

interface TransactionItem {
  id: string;
  type: "send" | "swap" | "escrow";
  status: "success" | "pending" | "failed";
  timestamp: string;
  amountIn: string;
  assetIn: string;
  amountOut?: string;
  assetOut?: string;
  txHash?: string;
  description: string;
  escrowContract?: string;
  escrowId?: string;
  senderAddress?: string;
  receiverAddress?: string;
  milestones?: { description: string; payout_weight: number; is_completed: boolean }[];
  isExpired?: boolean;
}


export default function Dashboard() {
  const {
    isConnected,
    address,
    balance,
    error: walletError,
    isLoading: walletLoading,
    connect,
    disconnect,
    sendXLM,
    routePayment,
    routeToEscrow,
    releaseMilestone,
    refundEscrow,
  } = useStellarWallet();

  // Tab routing view state
  const [activeTab, setActiveTab] = useState<TabId>("send");

  // Profile drawer visibility
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Send Form States
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [sendLoading, setSendLoading] = useState(false);
  const [txStatus, setTxStatus] = useState<"idle" | "sending" | "success" | "failed">("idle");
  const [txHash, setTxHash] = useState("");
  const [txError, setTxError] = useState("");
  const [isRouted, setIsRouted] = useState(true);

  // AI Assist & Milestones State
  const [aiInput, setAiInput] = useState("");
  const [milestones, setMilestones] = useState<{ description: string; payout_weight: number; is_completed: boolean }[]>([]);
  const [expandedEscrows, setExpandedEscrows] = useState<Record<string, boolean>>({});

  // Settings states
  const [slippage, setSlippage] = useState("1.0");
  const [isAiEnabled, setIsAiEnabled] = useState(true);
  const [network, setNetwork] = useState("Testnet");

  // Toast Notification State & Action
  const [toasts, setToasts] = useState<{ id: string; message: string; type: "success" | "error" | "info" }[]>([]);

  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "info") => {
    const id = `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  // Listen to connection errors
  useEffect(() => {
    if (walletError) {
      showToast(walletError, "error");
    }
  }, [walletError, showToast]);

  const toggleEscrowExpand = (txId: string) => {
    setExpandedEscrows((prev) => ({ ...prev, [txId]: !prev[txId] }));
  };

  const handleAiParse = () => {
    if (!aiInput.trim()) return;
    try {
      const parsed = parseAiIntent(aiInput);
      if (parsed.recipient) setRecipient(parsed.recipient);
      if (parsed.amount) setAmount(parsed.amount);
      
      if (parsed.type === "escrow") {
        setIsRouted(true);
        if (parsed.milestones && parsed.milestones.length > 0) {
          setMilestones(parsed.milestones);
        } else {
          setMilestones([
            { description: "Milestone 1", payout_weight: 5000, is_completed: false },
            { description: "Milestone 2", payout_weight: 5000, is_completed: false }
          ]);
        }
      } else {
        setIsRouted(false);
        setMilestones([]);
      }

      let summary = `Parsed intent: ${parsed.type.toUpperCase()}.`;
      if (parsed.amount) {
        summary += ` Amount: ${parsed.amount} ${parsed.asset || "XLM"}.`;
      }
      if (parsed.recipient) {
        summary += ` Recipient populated.`;
      }
      if (parsed.milestones.length > 0) {
        summary += ` Loaded ${parsed.milestones.length} milestones.`;
      }
      showToast(summary, "success");
    } catch (err: any) {
      showToast("Parsing failed: " + err.message, "error");
    }
  };

  const handleReleaseMilestone = async (txId: string, milestoneIndex: number) => {
    const tx = transactions.find((t) => t.id === txId);
    if (!tx || !tx.escrowContract || !tx.escrowId) {
      showToast("Escrow details not found.", "error");
      return;
    }

    try {
      showToast("Executing release_milestone on-chain...", "info");
      await releaseMilestone(tx.escrowContract, tx.escrowId, milestoneIndex);
      
      setTransactions((prev) =>
        prev.map((t) => {
          if (t.id === txId && t.milestones) {
            const updated = [...t.milestones];
            updated[milestoneIndex] = { ...updated[milestoneIndex], is_completed: true };
            return { ...t, milestones: updated };
          }
          return t;
        })
      );
      showToast("Milestone successfully released!", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to release milestone", "error");
    }
  };

  const handleRefundEscrow = async (txId: string) => {
    const tx = transactions.find((t) => t.id === txId);
    if (!tx || !tx.escrowContract || !tx.escrowId) {
      showToast("Escrow details not found.", "error");
      return;
    }

    try {
      showToast("Executing refund_escrow on-chain...", "info");
      await refundEscrow(tx.escrowContract, tx.escrowId);
      
      setTransactions((prev) =>
        prev.map((t) => {
          if (t.id === txId) {
            return { ...t, status: "failed", description: `${t.description} (Refunded)` };
          }
          return t;
        })
      );
      showToast("Escrow successfully refunded!", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to refund escrow", "error");
    }
  };

  // Dynamic Transaction Log
  const [transactions, setTransactions] = useState<TransactionItem[]>([
    {
      id: "tx-1",
      type: "escrow",
      status: "success",
      timestamp: "Today, 11:20 AM",
      amountIn: "250.00",
      assetIn: "USDC",
      description: "Milestone Escrow #1 (USD to PHP)",
      txHash: "a809f4b93478d5e6f7a8b9c0d1e2f3f4e5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0",
      escrowContract: "CDXZR77ODWNHHP5BR4BCSRS66FNHQQMUGEHGEFTX2IK4HWOAMC43ZERO",
      escrowId: "8a92b3c4d5e6f7a8b9c0d1e2f3f4e5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2",
      senderAddress: "GBRPYHIL2CIYAOSRIWRMQHEBOZJ7PAGB37NMQ22FQGSNLUY65VOUAIV2",
      receiverAddress: "GBRPYHIL2CIYAOSRIWRMQHEBOZJ7PAGB37NMQ22FQGSNLUY65VOUAIV2",
      milestones: [
        { description: "UI Design mockups", payout_weight: 3000, is_completed: false },
        { description: "Integration with Soroban", payout_weight: 7000, is_completed: false }
      ],
      isExpired: true,
    },
    {
      id: "tx-2",
      type: "swap",
      status: "success",
      timestamp: "Yesterday, 3:15 PM",
      amountIn: "50.00",
      assetIn: "XLM",
      amountOut: "5.85",
      assetOut: "USDC",
      description: "Asset Swap (DEX Routing)",
      txHash: "bf82d1c8f89e...",
    },
  ]);




  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient || !amount) return;

    if (!validateStellarAddress(recipient)) {
      const errMsg = "Invalid recipient address. Stellar addresses start with 'G' followed by 55 characters.";
      setTxError(errMsg);
      setTxStatus("failed");
      showToast(errMsg, "error");
      return;
    }

    if (Number(amount) <= 0) {
      const errMsg = "Amount must be greater than 0.";
      setTxError(errMsg);
      setTxStatus("failed");
      showToast(errMsg, "error");
      return;
    }

    if (Number(amount) > Number(balance)) {
      const errMsg = "Insufficient XLM balance.";
      setTxError(errMsg);
      setTxStatus("failed");
      showToast(errMsg, "error");
      return;
    }

    setSendLoading(true);
    setTxStatus("sending");
    setTxError("");
    setTxHash("");

    try {
      let hash = "";
      if (isRouted) {
        // Routed contract call
        const XLM_SAC_ADDRESS = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";
        const path = [XLM_SAC_ADDRESS, XLM_SAC_ADDRESS];
        const slipVal = parseFloat(slippage) || 1.0;
        const minAmountOut = (parseFloat(amount) * (100 - slipVal) / 100).toFixed(7);
        
        if (milestones.length > 0) {
          // Verify total weight is exactly 100% (10000 bps)
          const totalWeight = milestones.reduce((sum, m) => sum + m.payout_weight, 0);
          if (totalWeight !== 10000) {
            throw new Error(`Total milestone weight must equal exactly 100% (currently ${totalWeight / 100}%). Click "Auto-balance weights" to fix.`);
          }
          const escrowContract = process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ID || "CDXZR77ODWNHHP5BR4BCSRS66FNHQQMUGEHGEFTX2IK4HWOAMC43ZERO";
          const result = await routeToEscrow(escrowContract, recipient, path, amount, minAmountOut, milestones);
          hash = result.hash;
        } else {
          const result = await routePayment(recipient, path, amount, minAmountOut);
          hash = result.hash;
        }
      } else {
        // Direct XLM payment
        const result = await sendXLM(recipient, amount);
        hash = result.hash;
      }

      setTxHash(hash);
      setTxStatus("success");
      showToast("Transaction submitted successfully!", "success");
      
      // Add transaction to the activity log dynamically
      const newTx: TransactionItem = {
        id: `tx-${Date.now()}`,
        type: (isRouted && milestones.length > 0) ? "escrow" : (isRouted ? "swap" : "send"),
        status: "success",
        timestamp: "Just now",
        amountIn: amount,
        assetIn: "XLM",
        amountOut: isRouted ? amount : undefined,
        assetOut: isRouted ? "XLM" : undefined,
        txHash: hash,
        description: (isRouted && milestones.length > 0)
          ? `Routed Escrow to ${recipient.slice(0, 4)}...${recipient.slice(-4)}`
          : (isRouted 
            ? `Routed payment to ${recipient.slice(0, 4)}...${recipient.slice(-4)}`
            : `Direct transfer to ${recipient.slice(0, 4)}...${recipient.slice(-4)}`),
        escrowContract: process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ID || "CDXZR77ODWNHHP5BR4BCSRS66FNHQQMUGEHGEFTX2IK4HWOAMC43ZERO",
        escrowId: "8a92b3c4d5e6f7a8b9c0d1e2f3f4e5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2", // simulated for UI
        senderAddress: address || "",
        receiverAddress: recipient,
        milestones: (isRouted && milestones.length > 0) ? milestones : undefined,
        isExpired: false,
      };
      setTransactions((prev) => [newTx, ...prev]);

      // Reset form and UI helper states on success
      setRecipient("");
      setAmount("");
      setMilestones([]);
      setAiInput("");
    } catch (err: any) {
      console.error(err);
      const errMsg = err.message || "Transaction failed or user rejected the signing request.";
      setTxError(errMsg);
      setTxStatus("failed");
      showToast(errMsg, "error");
    } finally {
      setSendLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-space-950 md:bg-slate-900 flex items-center justify-center p-0 md:p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-indigo/5 via-space-950 to-space-950 md:bg-none">
      {/* Mobile Device Mockup Frame */}
      <div className="w-full md:max-w-[420px] md:h-[840px] md:rounded-[40px] md:border md:border-space-700/50 md:shadow-[0_0_50px_rgba(0,0,0,0.8)] bg-space-950/80 backdrop-blur-xl relative overflow-hidden flex flex-col h-screen">
        
        {/* App Header */}
        <header className="px-6 pt-[calc(1.25rem+var(--sat))] pb-4 border-b border-space-700/30 flex items-center justify-between bg-space-900/40 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-2 select-none min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary-indigo to-primary-cyan flex items-center justify-center font-display font-black text-white text-base shadow-lg shadow-primary-indigo/20">
              Æ
            </div>
            <div>
              <h1 className="font-display font-bold text-sm tracking-wide text-slate-100">
                AETHYR
              </h1>
              <p className="text-[9px] text-slate-400 font-mono tracking-widest leading-none">
                ROUTING PROTOCOL
              </p>
            </div>
          </div>
          <WalletConnect
            isConnected={isConnected}
            address={address}
            connect={connect}
            openDrawer={() => setIsDrawerOpen(true)}
            isLoading={walletLoading}
          />
        </header>

        {/* Viewport Content */}
        <main className="flex-1 overflow-y-auto px-6 py-6 pb-24 space-y-6">
          
          {/* TAB 1: SEND / SWAP */}
          {activeTab === "send" && (
            <div className="space-y-6">
              
              {/* Wallet Info Display */}
              {isConnected && address && (
                <div className="p-4 rounded-2xl glass-card flex items-center justify-between border-primary-indigo/20 bg-[linear-gradient(135deg,_rgba(99,102,241,0.05)_0%,_rgba(9,13,22,0.6)_100%)]">
                  <div className="space-y-1 min-w-0">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                      Available Balance
                    </span>
                    <h2 className="text-xl font-bold font-mono text-slate-100 flex items-baseline gap-1">
                      {Number(balance).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                      <span className="text-xs text-primary-indigo font-sans font-semibold">XLM</span>
                    </h2>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-space-800/80 border border-space-700/50 flex items-center justify-center">
                    <Coins className="w-5 h-5 text-primary-cyan animate-pulse-glow" />
                  </div>
                </div>
              )}

              {/* Transaction Status Overlay/Cards */}
              {txStatus === "sending" && (
                <div className="p-6 rounded-2xl border border-primary-indigo/30 bg-primary-indigo/5 text-center space-y-4">
                  <div className="relative w-16 h-16 mx-auto">
                    <div className="absolute inset-0 rounded-full border-4 border-primary-indigo/20" />
                    <div className="absolute inset-0 rounded-full border-4 border-t-primary-indigo animate-spin" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-slate-200">
                      Broadcasting Transaction
                    </h3>
                    <p className="text-xs text-slate-400 max-w-[240px] mx-auto">
                      Please sign the transaction payload in Freighter and wait for confirmation.
                    </p>
                  </div>
                </div>
              )}

              {txStatus === "success" && (
                <div className="p-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 text-center space-y-4 animate-pulse-glow">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-200">Payment Transmitted!</h3>
                    <p className="text-xs text-slate-400">Your funds were sent successfully on Stellar Testnet.</p>
                  </div>
                  {txHash && (
                    <div className="bg-space-950/60 p-3 rounded-xl border border-space-800 flex flex-col gap-2">
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="text-slate-400 min-w-0">TX Hash:</span>
                        <span className="text-slate-200 font-bold">{txHash.slice(0, 10)}...{txHash.slice(-10)}</span>
                      </div>
                      <a
                        href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-8 rounded-lg bg-space-800/80 hover:bg-space-800 border border-space-700/40 text-[10px] font-semibold text-slate-200 flex items-center justify-center gap-1.5 transition-all"
                      >
                        View on StellarExplorer
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                  <button
                    onClick={() => setTxStatus("idle")}
                    className="text-xs text-primary-indigo hover:text-primary-blue font-semibold transition-colors"
                  >
                    Send another transaction
                  </button>
                </div>
              )}

              {txStatus === "failed" && (
                <div className="p-6 rounded-2xl border border-red-500/20 bg-red-500/5 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto">
                    <XCircle className="w-6 h-6 text-red-400" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-slate-200">Transaction Failed</h3>
                    <p className="text-xs text-red-400/90 max-w-[280px] mx-auto font-mono px-2 py-1 rounded bg-red-950/20 border border-red-900/30">
                      {txError}
                    </p>
                  </div>
                  <button
                    onClick={() => setTxStatus("idle")}
                    className="text-xs text-slate-400 hover:text-slate-200 font-semibold underline transition-colors"
                  >
                    Dismiss and return
                  </button>
                </div>
              )}

              {/* AI Smart Assist Console */}
              {isAiEnabled && isConnected && address && txStatus === "idle" && (
                <div className="p-4 rounded-2xl glass-card border-primary-indigo/20 bg-space-900/40 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                    <Sparkles className="w-4 h-4 text-primary-cyan animate-pulse-glow" />
                    <span>AI Smart Assist Console</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Type a command in plain English to auto-populate the payment form (e.g. "Send 50 XLM to G..." or "Escrow 100 USDC to G... with milestones: 30% UI, 70% backend").
                  </p>
                  <div className="relative">
                    <textarea
                      value={aiInput}
                      onChange={(e) => setAiInput(e.target.value)}
                      placeholder="Type pay or escrow instructions..."
                      rows={2}
                      className="w-full p-3 rounded-xl bg-space-950/80 border border-space-800 focus:ring-1 focus:ring-primary-indigo focus:border-primary-indigo text-xs text-slate-100 placeholder-slate-500 outline-none resize-none transition-all focus:shadow-[0_0_10px_rgba(99,102,241,0.15)]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAiParse}
                    className="w-full h-9 rounded-xl bg-primary-indigo/10 border border-primary-indigo/30 hover:bg-primary-indigo/20 text-xs font-bold text-primary-indigo active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Parse Command
                  </button>
                </div>
              )}

              {/* Main Transfer Form (Connected state) */}
              {isConnected && address && txStatus === "idle" && (
                <form onSubmit={handleSend} className="space-y-5">
                  <div className="space-y-4">
                    {/* Destination Address Input */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-300 px-1">
                        Recipient Address
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={recipient}
                          onChange={(e) => setRecipient(e.target.value)}
                          placeholder="G..."
                          className="w-full h-12 pl-4 pr-10 rounded-xl bg-space-900/50 border border-space-700/50 focus:ring-2 focus:ring-primary-indigo/30 focus:border-primary-indigo/80 text-sm font-mono text-slate-100 placeholder-slate-500 outline-none transition-all"
                        />
                        <div className="absolute right-3 top-3.5 text-slate-500">
                          <ArrowUpRight className="w-5 h-5" />
                        </div>
                      </div>
                    </div>

                    {/* Amount Input */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-300 px-1">
                        Send Amount
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.0000001"
                          required
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full h-12 pl-4 pr-16 rounded-xl bg-space-900/50 border border-space-700/50 focus:ring-2 focus:ring-primary-indigo/30 focus:border-primary-indigo/80 text-sm font-mono text-slate-100 placeholder-slate-500 outline-none transition-all"
                        />
                        <div className="absolute right-4 top-3.5 text-xs font-bold text-primary-indigo">
                          XLM
                        </div>
                      </div>
                    </div>

                    {/* Routing Type Selection */}
                    <div className="p-3.5 rounded-xl bg-space-900/40 border border-space-700/30 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-xs font-semibold text-slate-200">
                          Route via Soroban Contract
                        </span>
                        <p className="text-[10px] text-slate-400">
                          Swaps and executes payment through on-chain router
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const routeVal = !isRouted;
                          setIsRouted(routeVal);
                          if (!routeVal) {
                            setMilestones([]);
                          }
                        }}
                        className={`w-10 h-6 rounded-full transition-colors relative outline-none border border-space-700 ${
                          isRouted ? "bg-primary-indigo" : "bg-space-850"
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${
                            isRouted ? "left-5" : "left-1"
                          }`}
                        />
                      </button>
                    </div>

                    {/* Milestones list for Escrow payments */}
                    {isRouted && (
                      <div className="space-y-3 p-4 rounded-xl bg-space-900/60 border border-space-800">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-300">Milestones Config (Total: 100%)</span>
                          <button
                            type="button"
                            onClick={() => {
                              setMilestones([...milestones, { description: `Milestone ${milestones.length + 1}`, payout_weight: 0, is_completed: false }]);
                            }}
                            className="text-[10px] font-bold text-primary-cyan hover:underline"
                          >
                            + Add Milestone
                          </button>
                        </div>
                        {milestones.length === 0 ? (
                          <p className="text-[10px] text-slate-500 italic">No milestones defined. A standard routed payment will be made.</p>
                        ) : (
                          <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                            {milestones.map((m, idx) => (
                              <div key={idx} className="flex gap-2 items-center">
                                <input
                                  type="text"
                                  value={m.description}
                                  onChange={(e) => {
                                    const copy = [...milestones];
                                    copy[idx].description = e.target.value;
                                    setMilestones(copy);
                                  }}
                                  placeholder="Description"
                                  className="flex-1 h-8 px-2 text-xs rounded bg-space-950 border border-space-800 text-slate-200 outline-none focus:border-primary-indigo"
                                />
                                <input
                                  type="number"
                                  value={m.payout_weight ? m.payout_weight / 100 : ""}
                                  onChange={(e) => {
                                    const copy = [...milestones];
                                    copy[idx].payout_weight = Math.round(parseFloat(e.target.value || "0") * 100);
                                    setMilestones(copy);
                                  }}
                                  placeholder="%"
                                  className="w-16 h-8 px-2 text-xs rounded bg-space-950 border border-space-800 text-slate-200 text-center outline-none focus:border-primary-indigo"
                                />
                                <span className="text-[10px] text-slate-500">%</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMilestones(milestones.filter((_, i) => i !== idx));
                                  }}
                                  className="text-red-400 hover:text-red-300 text-xs px-1"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                            {/* Helper button to auto-balance weights */}
                            <div className="flex justify-between items-center pt-1.5 border-t border-space-800/40">
                              <span className="text-[9px] text-slate-400">
                                Sum: {milestones.reduce((s, m) => s + m.payout_weight, 0) / 100}%
                              </span>
                              <button
                                  type="button"
                                  onClick={() => {
                                    if (milestones.length === 0) return;
                                    const equal = Math.floor(10000 / milestones.length);
                                    let sum = 0;
                                    const balanced = milestones.map((m, i) => {
                                      const w = i === milestones.length - 1 ? (10000 - sum) : equal;
                                      sum += w;
                                      return { ...m, payout_weight: w };
                                    });
                                    setMilestones(balanced);
                                  }}
                                  className="text-[9px] text-primary-indigo font-bold hover:underline"
                                >
                                  Auto-balance weights
                                </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Path Routing Visualization */}
                    {isRouted && (
                      <div className="p-4 rounded-2xl glass-card border-primary-cyan/20 bg-[linear-gradient(135deg,_rgba(6,182,212,0.03)_0%,_rgba(9,13,22,0.5)_100%)] space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-primary-cyan" />
                            <span className="text-[10px] font-bold text-slate-200 uppercase tracking-wider">Router Route Path</span>
                          </div>
                          <span className="text-[9px] text-emerald-400 font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">Optimal path found</span>
                        </div>

                        {/* sleek multi-hop pathway */}
                        <div className="flex items-center justify-between bg-space-950/40 p-3 rounded-xl border border-space-850">
                          <div className="flex flex-col items-center">
                            <span className="text-xs font-bold text-slate-100">XLM</span>
                            <span className="text-[8px] text-slate-500 font-mono">Source</span>
                          </div>
                          <div className="flex-1 flex flex-col items-center px-1">
                            <span className="text-[8px] text-slate-400 font-mono">Rate: 0.117</span>
                            <span className="text-slate-500 text-xs">➔</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-xs font-bold text-slate-100">USDC</span>
                            <span className="text-[8px] text-slate-500 font-mono">Hop</span>
                          </div>
                          <div className="flex-1 flex flex-col items-center px-1">
                            <span className="text-[8px] text-slate-400 font-mono">Rate: 58.45</span>
                            <span className="text-slate-500 text-xs">➔</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-xs font-bold text-slate-100">Mock PHP</span>
                            <span className="text-[8px] text-slate-500 font-mono">Destination</span>
                          </div>
                        </div>

                        {/* exchange rates and slippage safety limit */}
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                          <span>Est. Exchange rate:</span>
                          <span className="text-slate-200">1 XLM = 6.84 Mock PHP</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                          <span>Slippage Safety Limit:</span>
                          <span className="text-slate-200 font-semibold">Min. Out: {amount ? (parseFloat(amount) * (100 - parseFloat(slippage)) / 100).toFixed(4) : "0.0000"} XLM</span>
                        </div>

                        {/* fee savings comparison chart/indicator */}
                        <div className="space-y-2 pt-2 border-t border-space-850">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-semibold text-slate-300">Transaction Fees Savings</span>
                            <span className="text-emerald-400 font-bold">Save $4.4999</span>
                          </div>
                          
                          <div className="space-y-1.5">
                            <div>
                              <div className="flex justify-between text-[8px] text-slate-400 mb-0.5">
                                <span>Stellar (Aethyr)</span>
                                <span className="text-emerald-400 font-mono font-bold">$0.0001 (Instant)</span>
                              </div>
                              <div className="w-full bg-space-950 h-1.5 rounded-full overflow-hidden border border-space-900">
                                <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full" style={{ width: "0.1%" }} />
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-[8px] text-slate-400 mb-0.5">
                                <span>Wise / Western Union</span>
                                <span className="text-red-400 font-mono font-bold">$4.50 (1-3 Days)</span>
                              </div>
                              <div className="w-full bg-space-950 h-1.5 rounded-full overflow-hidden border border-space-900">
                                <div className="bg-red-500/80 h-full rounded-full" style={{ width: "100%" }} />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Send Button */}
                  <button
                    type="submit"
                    disabled={sendLoading}
                    className="w-full h-12 rounded-xl neon-button text-sm font-bold text-white flex items-center justify-center gap-2 active:scale-[0.99] transition-all cursor-pointer"
                  >
                    <SendHorizontal className="w-4 h-4" />
                    {milestones.length > 0 ? "Create Escrow Lock" : "Send Transaction"}
                  </button>
                </form>
              )}

              {/* Wallet Not Connected Empty State */}
              {(!isConnected || !address) && (
                <div className="p-8 rounded-2xl glass-card text-center space-y-5 border-space-700/30">
                  <div className="w-14 h-14 rounded-2xl bg-space-900/80 border border-space-700/50 flex items-center justify-center mx-auto">
                    <Coins className="w-7 h-7 text-primary-indigo" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-slate-100">
                      Cross-Border Remittances
                    </h3>
                    <p className="text-xs text-slate-400 max-w-[240px] mx-auto">
                      Connect your Freighter wallet to start pathfinding routing transfers.
                    </p>
                  </div>
                  <button
                    onClick={connect}
                    className="w-full h-11 rounded-xl neon-button text-xs font-bold text-white flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <Coins className="w-4 h-4" />
                    Connect Freighter
                  </button>
                </div>
              )}

              {/* AI assist preview bar */}
              <div className="p-4 rounded-xl border border-space-700/20 bg-space-900/20 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <Sparkles className="w-4 h-4 text-primary-cyan animate-pulse-glow" />
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    AI Assist Enabled
                  </span>
                </div>
                <div className="w-2 h-2 rounded-full bg-primary-cyan animate-ping" />
              </div>

            </div>
          )}

          {/* TAB 2: ACTIVITY FEED */}
          {activeTab === "activity" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider min-w-0">
                  Transaction History
                </h3>
                <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Live Syncing
                </span>
              </div>

              {/* Transactions List */}
              <div className="space-y-3">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-4 rounded-2xl glass-card border-space-700/20 hover:border-space-700/40 transition-all flex flex-col gap-2"
                  >
                    <div className="flex justify-between items-start w-full">
                      <div className="space-y-2 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              tx.type === "escrow"
                                ? "bg-primary-indigo/10 text-primary-indigo border border-primary-indigo/20"
                                : tx.type === "swap"
                                ? "bg-primary-cyan/10 text-primary-cyan border border-primary-cyan/20"
                                : "bg-primary-blue/10 text-primary-blue border border-primary-blue/20"
                            }`}
                          >
                            {tx.type}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {tx.timestamp}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-200">
                          {tx.description}
                        </p>
                        {tx.txHash && (
                          <div className="flex items-center gap-1 text-[9px] font-mono text-slate-400">
                            <span>Hash:</span>
                            <span className="text-slate-300">
                              {tx.txHash.length > 8
                                ? `${tx.txHash.slice(0, 4)}...${tx.txHash.slice(-4)}`
                                : tx.txHash}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <div className="flex items-baseline justify-end gap-0.5">
                          <span className="text-xs font-bold text-slate-200">
                            {tx.amountIn}
                          </span>
                          <span className="text-[9px] font-mono text-slate-400">
                            {tx.assetIn}
                          </span>
                        </div>
                        {tx.amountOut && tx.assetOut && (
                          <div className="flex items-baseline justify-end gap-0.5 mt-0.5">
                            <span className="text-[10px] font-semibold text-emerald-400">
                              → {tx.amountOut}
                            </span>
                            <span className="text-[8px] font-mono text-slate-500">
                              {tx.assetOut}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {tx.type === "escrow" && (
                      <div className="mt-1">
                        <button
                          type="button"
                          onClick={() => toggleEscrowExpand(tx.id)}
                          className="text-[10px] font-bold text-primary-cyan hover:underline flex items-center gap-1 focus:outline-none"
                        >
                          {expandedEscrows[tx.id] ? "▼ Hide Milestones" : "▶ Show Milestones"}
                        </button>

                        {expandedEscrows[tx.id] && tx.milestones && (
                          <div className="mt-3 pt-3 border-t border-space-800 space-y-3">
                            <div className="flex justify-between items-center text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                              <span>Milestones Ledger</span>
                              <span className="font-mono">
                                Completed: {tx.milestones.filter(m => m.is_completed).length}/{tx.milestones.length}
                              </span>
                            </div>

                            <div className="space-y-2">
                              {tx.milestones.map((m, mIdx) => (
                                <div
                                  key={mIdx}
                                  className="p-2.5 rounded-xl bg-space-950/60 border border-space-850 flex items-center justify-between gap-3"
                                >
                                  <div className="space-y-0.5 min-w-0">
                                    <p className="text-xs font-semibold text-slate-200 truncate">
                                      {m.description}
                                    </p>
                                    <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-400">
                                      <span>Weight: {m.payout_weight / 100}%</span>
                                      <span className="w-1 h-1 rounded-full bg-space-700" />
                                      <span
                                        className={`font-bold ${
                                          m.is_completed ? "text-emerald-400" : "text-amber-400"
                                        }`}
                                      >
                                        {m.is_completed ? "Completed" : "Pending"}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Release button: if not completed and payer/sender */}
                                  {!m.is_completed &&
                                    (tx.senderAddress === address ||
                                      tx.senderAddress === "GBRPYHIL2CIYAOSRIWRMQHEBOZJ7PAGB37NMQ22FQGSNLUY65VOUAIV2") && (
                                      <button
                                        type="button"
                                        onClick={() => handleReleaseMilestone(tx.id, mIdx)}
                                        className="h-7 px-3 rounded-lg bg-primary-indigo/20 hover:bg-primary-indigo/35 border border-primary-indigo/40 hover:border-primary-indigo/60 text-[9px] font-bold text-primary-indigo active:scale-95 transition-all cursor-pointer"
                                      >
                                        Release
                                      </button>
                                    )}
                                </div>
                              ))}
                            </div>

                            {/* Refund button: visible for expired escrows (or simulated expired) with pending milestones */}
                            {tx.isExpired && tx.milestones.some((m) => !m.is_completed) && (
                              <div className="pt-1 flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => handleRefundEscrow(tx.id)}
                                  className="h-8 px-3 rounded-xl bg-red-950/40 hover:bg-red-950/60 border border-red-500/30 text-[9px] font-bold text-red-400 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                                >
                                  <AlertCircle className="w-3.5 h-3.5" />
                                  Refund Expired Escrow
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: SETTINGS PANEL */}
          {activeTab === "settings" && (
            <div className="space-y-5">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
                App Settings
              </h3>

              {/* Network Config */}
              <div className="p-4 rounded-xl bg-space-900/40 border border-space-700/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-200">Network Environment</p>
                    <p className="text-[10px] text-slate-400">Current active blockchain rail</p>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                    {network}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {["Testnet", "Futurenet", "Local"].map((net) => (
                    <button
                      key={net}
                      type="button"
                      onClick={() => setNetwork(net)}
                      className={`h-8 rounded-lg text-[10px] font-bold border transition-all ${
                        network === net
                          ? "bg-primary-indigo/10 border-primary-indigo/40 text-primary-indigo"
                          : "bg-space-950/40 border-space-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {net}
                    </button>
                  ))}
                </div>
              </div>

              {/* Slippage Settings */}
              <div className="p-4 rounded-xl bg-space-900/40 border border-space-700/20 space-y-3">
                <div>
                  <p className="text-xs font-semibold text-slate-200">Slippage Tolerance</p>
                  <p className="text-[10px] text-slate-400">Allowed trade price impact percentage</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {["0.5", "1.0", "3.0"].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setSlippage(val)}
                      className={`h-8 rounded-lg text-[10px] font-bold border transition-all ${
                        slippage === val
                          ? "bg-primary-indigo/10 border-primary-indigo/40 text-primary-indigo"
                          : "bg-space-950/40 border-space-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {val}%
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-space-850">
                  <span className="text-[10px] text-slate-400">Custom Slippage:</span>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="50"
                    value={["0.5", "1.0", "3.0"].includes(slippage) ? "" : slippage}
                    onChange={(e) => setSlippage(e.target.value || "1.0")}
                    placeholder="Custom %"
                    className="w-20 h-7 px-2 text-[10px] rounded bg-space-950 border border-space-800 text-slate-200 focus:outline-none focus:border-primary-indigo"
                  />
                  <span className="text-[10px] text-slate-400">%</span>
                </div>
              </div>

              {/* AI assist switch */}
              <div className="p-4 rounded-xl bg-space-900/40 border border-space-700/20 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-200">AI Intent Assist</p>
                  <p className="text-[10px] text-slate-400">Plain text payment commands parsing</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAiEnabled(!isAiEnabled)}
                  className={`w-11 h-6 rounded-full p-1 transition-all duration-300 relative ${
                    isAiEnabled ? "bg-primary-indigo" : "bg-space-800 border border-space-700/40"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-all shadow ${
                      isAiEnabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Versioning and developer tags */}
              <div className="text-center text-[10px] text-slate-500 pt-4 font-mono space-y-1">
                <p>Aethyr Client v0.1.0 (Alpha)</p>
                <p>Designed for Stellar JTM</p>
              </div>

            </div>
          )}

        </main>

        {/* Bottom Navigation */}
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Toast Notifications Container */}
        <div className="absolute bottom-[calc(5.5rem+var(--sab))] left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2 pointer-events-none w-full max-w-[320px] px-4">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`p-3 rounded-xl shadow-lg border text-[10px] font-semibold flex items-center gap-2 pointer-events-auto backdrop-blur-md transition-all duration-300 animate-slide-in ${
                toast.type === "success"
                  ? "bg-emerald-950/85 border-emerald-500/20 text-slate-100 shadow-emerald-500/5"
                  : toast.type === "error"
                  ? "bg-red-950/85 border-red-500/20 text-slate-100 shadow-red-500/5"
                  : "bg-space-900/85 border-space-700/20 text-slate-100"
              }`}
            >
              {toast.type === "success" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
              {toast.type === "error" && <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />}
              {toast.type === "info" && <AlertCircle className="w-3.5 h-3.5 text-primary-indigo shrink-0" />}
              <span>{toast.message}</span>
            </div>
          ))}
        </div>

        {/* Slide-out Profile Drawer */}
        <ProfileDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          address={address}
          balance={balance}
          disconnect={disconnect}
          isLoading={walletLoading}
        />

      </div>
    </div>
  );
}
