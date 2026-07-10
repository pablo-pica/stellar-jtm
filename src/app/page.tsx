"use client";

import React, { useState, useEffect, useCallback } from "react";
import { CheckCircle2, XCircle, AlertCircle, ExternalLink, ArrowUpRight } from "lucide-react";
import { useStellarWallet } from "@/hooks/useStellarWallet";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";

const WalletConnect = dynamic(() => import("@/components/WalletConnect"), {
  ssr: false,
});
import BottomNav, { TabId } from "@/components/BottomNav";
import ProfileDrawer from "@/components/ProfileDrawer";
import WalletPickerBottomSheet from "@/components/WalletPickerBottomSheet";
import SendTab from "@/components/SendTab";
import EscrowTab from "@/components/EscrowTab";
import ActivityTab from "@/components/ActivityTab";
import SettingsTab from "@/components/SettingsTab";
import { Toast, ToastContainer } from "@/components/ui/Toast";
import { Milestone } from "@/components/MilestoneBuilder";
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
  milestones?: Milestone[];
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
    submitMilestone,
    disputeMilestone,
    autoReleaseMilestone,
  } = useStellarWallet();

  // Tab routing view state
  const [activeTab, setActiveTab] = useState<TabId>("send");

  // Bottom sheets visibility
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isWalletPickerOpen, setIsWalletPickerOpen] = useState(false);

  // Send Form States
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [sendLoading, setSendLoading] = useState(false);
  const [txStatus, setTxStatus] = useState<"idle" | "sending" | "success" | "failed">("idle");
  const [txHash, setTxHash] = useState("");
  const [txError, setTxError] = useState("");
  const [isRouted, setIsRouted] = useState(true);

  // Simulated User Role for Escrow Milestones Actions
  const [userRole, setUserRole] = useState<"client" | "freelancer" | "mediator" | "auto">("client");

  // Settings states
  const [slippage, setSlippage] = useState("1.0");
  const [isAiEnabled, setIsAiEnabled] = useState(true);
  const [network, setNetwork] = useState("Testnet");

  // Toast Notification State & Action
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "info") => {
    const id = `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const handleDismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Listen to connection errors
  useEffect(() => {
    if (walletError) {
      showToast(walletError, "error");
    }
  }, [walletError, showToast]);

  const [expandedEscrows, setExpandedEscrows] = useState<Record<string, boolean>>({});

  const toggleEscrowExpand = (txId: string) => {
    setExpandedEscrows((prev) => ({ ...prev, [txId]: !prev[txId] }));
  };

  const handleRelease = async (txId: string, milestoneIndex: number) => {
    const tx = transactions.find((t) => t.id === txId);
    if (!tx || !tx.escrowContract || !tx.escrowId) {
      showToast("Escrow details not found.", "error");
      return;
    }
    try {
      showToast("Releasing milestone funds...", "info");
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

  const handleRefund = async (txId: string) => {
    const tx = transactions.find((t) => t.id === txId);
    if (!tx || !tx.escrowContract || !tx.escrowId) {
      showToast("Escrow details not found.", "error");
      return;
    }
    try {
      showToast("Executing refund_escrow...", "info");
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

  const handleSubmitWork = async (txId: string, milestoneIndex: number) => {
    const tx = transactions.find((t) => t.id === txId);
    if (!tx || !tx.escrowContract || !tx.escrowId) {
      showToast("Escrow details not found.", "error");
      return;
    }
    try {
      showToast("Submitting milestone work...", "info");
      await submitMilestone(tx.escrowContract, tx.escrowId, milestoneIndex);
      setTransactions((prev) =>
        prev.map((t) => {
          if (t.id === txId && t.milestones) {
            const updated = [...t.milestones];
            updated[milestoneIndex] = {
              ...updated[milestoneIndex],
              submitted_at: Math.floor(Date.now() / 1000),
            };
            return { ...t, milestones: updated };
          }
          return t;
        })
      );
      showToast("Milestone work submitted!", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to submit milestone", "error");
    }
  };

  const handleDispute = async (txId: string, milestoneIndex: number) => {
    const tx = transactions.find((t) => t.id === txId);
    if (!tx || !tx.escrowContract || !tx.escrowId) {
      showToast("Escrow details not found.", "error");
      return;
    }
    try {
      showToast("Flagging dispute...", "info");
      await disputeMilestone(tx.escrowContract, tx.escrowId, milestoneIndex);
      setTransactions((prev) =>
        prev.map((t) => {
          if (t.id === txId && t.milestones) {
            const updated = [...t.milestones];
            updated[milestoneIndex] = {
              ...updated[milestoneIndex],
              is_disputed: true,
            };
            return { ...t, milestones: updated };
          }
          return t;
        })
      );
      showToast("Milestone dispute flagged!", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to flag dispute", "error");
    }
  };

  const handleAutoRelease = async (txId: string, milestoneIndex: number) => {
    const tx = transactions.find((t) => t.id === txId);
    if (!tx || !tx.escrowContract || !tx.escrowId) {
      showToast("Escrow details not found.", "error");
      return;
    }
    try {
      showToast("Triggering auto-release...", "info");
      await autoReleaseMilestone(tx.escrowContract, tx.escrowId, milestoneIndex);
      setTransactions((prev) =>
        prev.map((t) => {
          if (t.id === txId && t.milestones) {
            const updated = [...t.milestones];
            updated[milestoneIndex] = {
              ...updated[milestoneIndex],
              is_completed: true,
              submitted_at: 0,
              is_disputed: false,
            };
            return { ...t, milestones: updated };
          }
          return t;
        })
      );
      showToast("Milestone auto-released!", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to auto-release milestone", "error");
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
        { description: "UI Design mockups", payout_weight: 3000, is_completed: false, is_disputed: false, submitted_at: 0 },
        { description: "Integration with Soroban", payout_weight: 7000, is_completed: false, is_disputed: false, submitted_at: 0 }
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
      txHash: "bf82d1c8f89e5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3f4e5a6b7c8d9e0f1",
    },
  ]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient || !amount) return;

    // Form input validation checks - inline alerts/toasts
    if (!validateStellarAddress(recipient)) {
      const errMsg = "Invalid recipient address format. Stellar public keys start with G.";
      setTxError(errMsg);
      setTxStatus("failed");
      showToast(errMsg, "error");
      return;
    }

    if (Number(amount) <= 0) {
      const errMsg = "Amount must be greater than zero.";
      setTxError(errMsg);
      setTxStatus("failed");
      showToast(errMsg, "error");
      return;
    }

    if (Number(amount) > Number(balance)) {
      const errMsg = "Insufficient XLM balance to complete transfer.";
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
        const USDC_SAC_ADDRESS = process.env.NEXT_PUBLIC_USDC_CONTRACT_ID || "CCW67W2SLF6JUAQAUBYDJUA22XYQEWDTING2RLOF7KKLUQXWZXYZOROP";
        const PHP_SAC_ADDRESS = process.env.NEXT_PUBLIC_PHP_CONTRACT_ID || "CDQA7W2SLF6JUAQAUBYDJUA22XYQEWDTING2RLOF7KKLUQXWZXYZOROP";
        const path = [XLM_SAC_ADDRESS, USDC_SAC_ADDRESS, PHP_SAC_ADDRESS];
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
      showToast("Transaction submitted successfully!", "success");
      
      // Add transaction to the activity log dynamically
      const newTx: TransactionItem = {
        id: `tx-${Date.now()}`,
        type: isRouted ? "swap" : "send",
        status: "success",
        timestamp: "Just now",
        amountIn: amount,
        assetIn: "XLM",
        amountOut: isRouted ? (parseFloat(amount) * 6.84).toFixed(2) : undefined,
        assetOut: isRouted ? "PHP" : undefined,
        txHash: hash,
        description: isRouted 
          ? `Routed payment to ${recipient.slice(0, 4)}...${recipient.slice(-4)}`
          : `Direct transfer to ${recipient.slice(0, 4)}...${recipient.slice(-4)}`,
        senderAddress: address || "",
        receiverAddress: recipient,
        isExpired: false,
      };
      setTransactions((prev) => [newTx, ...prev]);
    } catch (err: any) {
      console.error(err);
      const errMsg = err.message || "Transaction execution was cancelled or failed.";
      setTxError(errMsg);
      setTxStatus("failed");
      showToast(errMsg, "error");
    } finally {
      setSendLoading(false);
    }
  };

  const onCreateEscrow = async (escrowRecipient: string, escrowAmount: string, escrowMilestones: Milestone[]) => {
    if (!address) {
      showToast("Wallet is not connected.", "error");
      return;
    }
    setSendLoading(true);
    setTxStatus("sending");
    setTxError("");
    setTxHash("");

    try {
      const XLM_SAC_ADDRESS = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";
      const USDC_SAC_ADDRESS = process.env.NEXT_PUBLIC_USDC_CONTRACT_ID || "CCW67W2SLF6JUAQAUBYDJUA22XYQEWDTING2RLOF7KKLUQXWZXYZOROP";
      const PHP_SAC_ADDRESS = process.env.NEXT_PUBLIC_PHP_CONTRACT_ID || "CDQA7W2SLF6JUAQAUBYDJUA22XYQEWDTING2RLOF7KKLUQXWZXYZOROP";
      const path = [XLM_SAC_ADDRESS, USDC_SAC_ADDRESS, PHP_SAC_ADDRESS];
      const slipVal = parseFloat(slippage) || 1.0;
      const minAmountOut = (parseFloat(escrowAmount) * (100 - slipVal) / 100).toFixed(7);
      
      const escrowContract = process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ID || "CDXZR77ODWNHHP5BR4BCSRS66FNHQQMUGEHGEFTX2IK4HWOAMC43ZERO";
      const result = await routeToEscrow(escrowContract, escrowRecipient, path, escrowAmount, minAmountOut, escrowMilestones);
      const hash = result.hash;

      setTxHash(hash);
      setTxStatus("success");
      showToast("Escrow Lock created successfully!", "success");

      // Add to transaction log
      const newTx: TransactionItem = {
        id: `tx-${Date.now()}`,
        type: "escrow",
        status: "success",
        timestamp: "Just now",
        amountIn: escrowAmount,
        assetIn: "XLM",
        txHash: hash,
        description: `Milestone Escrow to ${escrowRecipient.slice(0, 4)}...${escrowRecipient.slice(-4)}`,
        escrowContract,
        escrowId: result.escrowId,
        senderAddress: address || "",
        receiverAddress: escrowRecipient,
        milestones: escrowMilestones,
        isExpired: false,
      };
      setTransactions((prev) => [newTx, ...prev]);
    } catch (err: any) {
      console.error(err);
      const errMsg = err.message || "Escrow lock creation failed.";
      setTxError(errMsg);
      setTxStatus("failed");
      showToast(errMsg, "error");
      throw err;
    } finally {
      setSendLoading(false);
    }
  };

  const handleSelectWallet = async (walletId: string) => {
    try {
      await connect(walletId);
    } catch (err) {
      // handled inside hook
    }
  };

  // Header border shadow scroll detection
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = (e: any) => {
      if (e.target.scrollTop > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    const mainEl = document.getElementById("main-content");
    mainEl?.addEventListener("scroll", handleScroll);
    return () => mainEl?.removeEventListener("scroll", handleScroll);
  }, []);

  const renderParticles = () => {
    return Array.from({ length: 12 }).map((_, i) => {
      const angle = (i * 360) / 12;
      const distance = 45 + Math.random() * 40;
      const delay = Math.random() * 0.15;
      const scale = 0.4 + Math.random() * 0.6;
      const color = i % 3 === 0 ? "bg-teal-400" : i % 3 === 1 ? "bg-indigo-400" : "bg-cyan-400";
      return (
        <motion.div
          key={i}
          initial={{ scale: 0, x: 0, y: 0 }}
          animate={{
            scale: [0, scale, 0],
            x: Math.cos((angle * Math.PI) / 180) * distance,
            y: Math.sin((angle * Math.PI) / 180) * distance,
          }}
          transition={{
            duration: 0.65,
            delay,
            ease: "easeOut",
          }}
          className={`absolute w-2 h-2 rounded-full ${color}`}
        />
      );
    });
  };

  return (
    <div className="min-h-screen bg-space-950 md:bg-slate-900 flex items-center justify-center p-0 md:p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-indigo/5 via-space-950 to-space-950 md:bg-none">
      {/* Mobile Device Mockup Frame */}
      <div className="w-full md:max-w-[420px] md:h-[840px] md:rounded-[40px] md:border md:border-space-700/50 md:shadow-[0_0_50px_rgba(0,0,0,0.8)] bg-space-950/80 backdrop-blur-xl relative overflow-hidden flex flex-col h-screen" data-testid="mobile-mockup-frame">
        
        {/* App Header (Frosted glass + Scroll Border effect) */}
        <header className={`px-6 pt-[calc(1.25rem+var(--sat))] pb-4 flex items-center justify-between bg-space-900/80 backdrop-blur-lg sticky top-0 z-30 transition-all duration-300 ${
          scrolled ? "border-b border-teal-500/10 shadow-lg shadow-black/15" : "border-b border-transparent"
        }`} data-testid="app-header">
          <div className="flex items-center gap-2 select-none min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-400 to-primary-indigo flex items-center justify-center font-display font-black text-white text-base shadow-lg shadow-teal-500/10">
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
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold text-slate-400 bg-space-800 border border-space-700/60 px-2 py-0.5 rounded-full select-none">
              Testnet
            </span>
            <WalletConnect
              isConnected={isConnected}
              address={address}
              connect={() => setIsWalletPickerOpen(true)}
              openDrawer={() => setIsDrawerOpen(true)}
              isLoading={walletLoading}
            />
          </div>
        </header>

        {/* Viewport Content */}
        <main id="main-content" className="flex-1 overflow-y-auto px-6 py-6 pb-24 space-y-6">
          
          {/* Broadcasting status modal block */}
          {txStatus === "sending" && (
            <div className="p-6 rounded-2xl border border-primary-indigo/35 bg-primary-indigo/5 text-center space-y-4" data-testid="tx-sending-block">
              <div className="relative w-16 h-16 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-primary-indigo/20" />
                <div className="absolute inset-0 rounded-full border-4 border-t-teal-400 animate-spin" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-slate-200">
                  Broadcasting Transaction
                </h3>
                <p className="text-xs text-slate-400 max-w-[240px] mx-auto leading-relaxed">
                  Sign payload inside extension and wait for confirmation.
                </p>
              </div>
            </div>
          )}

          {/* Success screen card + particle burst */}
          {txStatus === "success" && (
            <div className="p-6 rounded-2xl glass-card border-teal-500/20 text-center space-y-5 animate-pulse-glow relative flex flex-col items-center" data-testid="tx-success-block">
              <div className="relative w-16 h-16 flex items-center justify-center">
                {renderParticles()}
                <div className="w-14 h-14 rounded-full bg-teal-500/10 border border-teal-500/30 flex items-center justify-center z-10">
                  <CheckCircle2 className="w-8 h-8 text-teal-400" />
                </div>
              </div>
              
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-100 font-display">Payment Transmitted!</h3>
                <p className="text-xs text-slate-400">Your transaction has been processed on Testnet.</p>
              </div>

              {/* Summary card */}
              <div className="w-full bg-space-950/60 p-4 rounded-xl border border-space-850 space-y-2 text-xs font-mono text-left">
                <div className="flex justify-between">
                  <span className="text-slate-500">Amount:</span>
                  <span className="text-slate-100 font-bold">{amount || "Routed"} XLM</span>
                </div>
                {recipient && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Recipient:</span>
                    <span className="text-slate-100 truncate max-w-[140px]">{recipient}</span>
                  </div>
                )}
                {txHash && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">TX Hash:</span>
                    <span className="text-teal-400 font-bold">{txHash.slice(0, 8)}...{txHash.slice(-8)}</span>
                  </div>
                )}
              </div>

              {txHash && (
                <a
                  href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-10 rounded-xl bg-space-800 hover:bg-space-850 border border-space-700/40 text-xs font-bold text-slate-200 flex items-center justify-center gap-1.5 transition-all focus-ring"
                >
                  View on StellarExplorer
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}

              <button
                onClick={() => {
                  setTxStatus("idle");
                  setRecipient("");
                  setAmount("");
                }}
                className="text-xs font-bold text-teal-400 hover:text-teal-300 transition-colors focus-ring"
              >
                Back to Send Form
              </button>
            </div>
          )}

          {/* Failed transaction status overlay card */}
          {txStatus === "failed" && (
            <div className="p-6 rounded-2xl border border-red-500/20 bg-red-500/5 text-center space-y-4" data-testid="tx-failed-block">
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto">
                <XCircle className="w-6 h-6 text-red-400" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-slate-200">Transaction Failed</h3>
                <p className="text-xs text-red-400/95 max-w-[280px] mx-auto font-mono px-3 py-2 rounded bg-red-950/20 border border-red-900/30 text-left overflow-x-auto whitespace-pre-wrap">
                  {txError}
                </p>
              </div>
              <button
                onClick={() => setTxStatus("idle")}
                className="text-xs text-slate-400 hover:text-slate-200 font-semibold underline transition-colors cursor-pointer"
              >
                Dismiss and return
              </button>
            </div>
          )}

          {/* TAB 1: SEND / SWAP */}
          {activeTab === "send" && txStatus === "idle" && (
            <SendTab
              balance={balance}
              recipient={recipient}
              setRecipient={setRecipient}
              amount={amount}
              setAmount={setAmount}
              isRouted={isRouted}
              setIsRouted={setIsRouted}
              sendLoading={sendLoading}
              txStatus={txStatus}
              setTxStatus={setTxStatus}
              handleSend={handleSend}
              isAiEnabled={isAiEnabled}
              showToast={showToast}
              slippage={slippage}
              connect={() => setIsWalletPickerOpen(true)}
              isConnected={isConnected}
            />
          )}

          {/* TAB 2: ESCROW MILESTONES (NEW) */}
          {activeTab === "escrow" && txStatus === "idle" && (
            <EscrowTab
              balance={balance}
              isConnected={isConnected}
              connect={() => setIsWalletPickerOpen(true)}
              transactions={transactions}
              expandedEscrows={expandedEscrows}
              toggleEscrowExpand={toggleEscrowExpand}
              userRole={userRole}
              setUserRole={setUserRole}
              handleSubmitMilestone={handleSubmitWork}
              handleReleaseMilestone={handleRelease}
              handleDisputeMilestone={handleDispute}
              handleAutoReleaseMilestone={handleAutoRelease}
              handleRefundEscrow={handleRefund}
              onCreateEscrow={onCreateEscrow}
              showToast={showToast}
            />
          )}

          {/* TAB 3: ACTIVITY FEED */}
          {activeTab === "activity" && txStatus === "idle" && (
            <ActivityTab
              transactions={transactions}
              isConnected={isConnected}
              connect={() => setIsWalletPickerOpen(true)}
            />
          )}

          {/* TAB 4: SETTINGS PANEL */}
          {activeTab === "settings" && txStatus === "idle" && (
            <SettingsTab
              network={network}
              setNetwork={setNetwork}
              slippage={slippage}
              setSlippage={setSlippage}
              isAiEnabled={isAiEnabled}
              setIsAiEnabled={setIsAiEnabled}
            />
          )}

        </main>

        {/* Bottom Navigation */}
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Custom Toast Notifications Container */}
        <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />

        {/* Slide-up Profile Bottom Sheet */}
        <ProfileDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          address={address}
          balance={balance}
          disconnect={disconnect}
          isLoading={walletLoading}
        />

        {/* Custom Wallet Picker Bottom Sheet */}
        <WalletPickerBottomSheet
          isOpen={isWalletPickerOpen}
          onClose={() => setIsWalletPickerOpen(false)}
          onSelectWallet={handleSelectWallet}
        />

      </div>
    </div>
  );
}
