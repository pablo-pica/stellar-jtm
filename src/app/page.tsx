"use client";

import React, { useState } from "react";
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

  // Settings states
  const [slippage, setSlippage] = useState("1.0");
  const [isAiEnabled, setIsAiEnabled] = useState(true);
  const [network, setNetwork] = useState("Testnet");

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
      txHash: "a809f4b93478...",
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
      setTxError("Invalid recipient address. Stellar addresses start with 'G' followed by 55 characters.");
      setTxStatus("failed");
      return;
    }

    if (Number(amount) <= 0) {
      setTxError("Amount must be greater than 0.");
      setTxStatus("failed");
      return;
    }

    if (Number(amount) > Number(balance)) {
      setTxError("Insufficient XLM balance.");
      setTxStatus("failed");
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
        const XLM_SAC_ADDRESS = "CDLZFC3SYJYDZT7K67VZ75HPJGWGN6XXU25MQKERUGYDUYZ6IPPGLURK";
        const path = [XLM_SAC_ADDRESS, XLM_SAC_ADDRESS];
        const slipVal = parseFloat(slippage) || 1.0;
        const minAmountOut = (parseFloat(amount) * (100 - slipVal) / 100).toFixed(7);
        
        const result = await routePayment(recipient, path, amount, minAmountOut);
        hash = result.hash;
      } else {
        // Direct XLM payment
        const result = await sendXLM(recipient, amount);
        hash = result.hash;
      }

      setTxHash(hash);
      setTxStatus("success");
      
      // Add transaction to the activity log dynamically
      const newTx: TransactionItem = {
        id: `tx-${Date.now()}`,
        type: isRouted ? "swap" : "send",
        status: "success",
        timestamp: "Just now",
        amountIn: amount,
        assetIn: "XLM",
        amountOut: isRouted ? amount : undefined,
        assetOut: isRouted ? "XLM" : undefined,
        txHash: hash,
        description: isRouted 
          ? `Routed payment to ${recipient.slice(0, 4)}...${recipient.slice(-4)}`
          : `Direct transfer to ${recipient.slice(0, 4)}...${recipient.slice(-4)}`,
      };
      setTransactions((prev) => [newTx, ...prev]);

      // Reset form on success
      setRecipient("");
      setAmount("");
    } catch (err: any) {
      console.error(err);
      setTxError(err.message || "Transaction failed or user rejected the signing request.");
      setTxStatus("failed");
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
                      onClick={() => setIsRouted(!isRouted)}
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
                </div>

                {/* Send Button */}
                  <button
                    type="submit"
                    disabled={sendLoading}
                    className="w-full h-12 rounded-xl neon-button text-sm font-bold text-white flex items-center justify-center gap-2 active:scale-[0.99] transition-all cursor-pointer"
                  >
                    <SendHorizontal className="w-4 h-4" />
                    Send Transaction
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
                    className="p-4 rounded-2xl glass-card border-space-700/20 hover:border-space-700/40 transition-all flex justify-between items-start"
                  >
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
                    <div className="text-right">
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
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setNetwork("Testnet")}
                    className={`h-8 rounded-lg text-[10px] font-bold border transition-all ${
                      network === "Testnet"
                        ? "bg-primary-indigo/10 border-primary-indigo/40 text-primary-indigo"
                        : "bg-space-950/40 border-space-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Testnet
                  </button>
                  <button
                    type="button"
                    disabled
                    className="h-8 rounded-lg text-[10px] font-bold border bg-space-950/10 border-space-900 text-slate-600 cursor-not-allowed flex items-center justify-center gap-1"
                  >
                    Mainnet (Locked)
                  </button>
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
