"use client";

import React, { useState } from "react";
import { Clock, ReceiptText, ExternalLink, ArrowRight, CheckCircle2, AlertCircle, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Milestone } from "./MilestoneBuilder";

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

interface ActivityTabProps {
  transactions: TransactionItem[];
  isConnected?: boolean;
  connect?: () => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

export default function ActivityTab({
  transactions,
  isConnected = true,
  connect,
}: ActivityTabProps) {
  const [expandedTxs, setExpandedTxs] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedTxs((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getLeftBarColor = (type: string) => {
    switch (type) {
      case "escrow":
        return "bg-teal-400";
      case "swap":
        return "bg-indigo-400";
      default:
        return "bg-cyan-400";
    }
  };

  const getBadgeStyles = (type: string) => {
    switch (type) {
      case "escrow":
        return "bg-teal-500/10 text-teal-400 border border-teal-500/20";
      case "swap":
        return "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20";
      default:
        return "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20";
    }
  };

  return (
    <div className="space-y-6" data-testid="activity-tab-root">
      <h3 className="text-xl font-semibold font-display text-slate-100 text-left px-1 mb-6 flex justify-between items-center w-full">
        <span>Transaction History</span>
        <span className="text-xs text-slate-400 font-bold flex items-center gap-1.5 bg-space-850 px-2.5 py-1 rounded-full border border-space-700/40 select-none normal-case">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Live</span>
        </span>
      </h3>

      {!isConnected ? (
        <div className="p-8 rounded-2xl glass-card text-center space-y-5" data-testid="disconnected-state">
          <div className="w-14 h-14 rounded-2xl bg-space-900/80 border border-space-700/50 flex items-center justify-center mx-auto shadow-md">
            <ReceiptText className="w-7 h-7 text-teal-400 animate-pulse-glow" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-100">
              Transaction History
            </h3>
            <p className="text-xs text-slate-400 max-w-[240px] mx-auto leading-relaxed">
              Connect your wallet to view your transaction history, swaps and escrow activities.
            </p>
          </div>
          {connect && (
            <button
              onClick={connect}
              type="button"
              className="w-full h-11 rounded-xl bg-gradient-to-r from-teal-400 to-primary-indigo text-xs font-bold text-white flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer focus-ring"
              data-testid="disconnected-connect-btn"
            >
              <ReceiptText className="w-4 h-4" />
              Connect Wallet
            </button>
          )}
        </div>
      ) : transactions.length === 0 ? (
        <div className="p-8 rounded-2xl glass-card text-center space-y-5" data-testid="activity-empty-state">
          <div className="w-14 h-14 rounded-2xl bg-space-900/80 border border-space-700/50 flex items-center justify-center mx-auto shadow-md">
            <ReceiptText className="w-7 h-7 text-teal-400 animate-pulse-glow" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-100">No transactions yet</h3>
            <p className="text-xs text-slate-400 max-w-[240px] mx-auto leading-relaxed">
              Send your first payment or lock milestones to see your transaction feed here.
            </p>
          </div>
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-3"
        >
          {transactions.map((tx) => {
            const isExpanded = expandedTxs[tx.id];
            const hasDetails = !!(tx.senderAddress || tx.receiverAddress || tx.escrowContract || (tx.milestones && tx.milestones.length > 0));
            const leftBarColor = getLeftBarColor(tx.type);
            const badgeStyle = getBadgeStyles(tx.type);

            return (
              <motion.div
                key={tx.id}
                variants={itemVariants}
                onClick={() => hasDetails && toggleExpand(tx.id)}
                className={`relative rounded-xl glass-card hover:border-teal-500/25 transition-[border-color,background-color] duration-200 overflow-hidden flex flex-col ${
                  hasDetails ? "cursor-pointer" : "cursor-default"
                } text-left focus-ring`}
                data-testid={`tx-card-${tx.id}`}
              >
                {/* Left side indicator bar */}
                <div className={`absolute top-0 bottom-0 left-0 w-1 ${leftBarColor}`} />

                <div className="p-4 pl-5 flex flex-col gap-2">
                  <div className="flex justify-between items-start w-full">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${badgeStyle}`}>
                          {tx.type}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">{tx.timestamp}</span>
                      </div>
                      <p className="text-xs font-bold text-slate-200">{tx.description}</p>
                    </div>

                    <div className="text-right shrink-0 flex items-center gap-3">
                      <div>
                        <div className="flex items-baseline justify-end gap-0.5">
                          <span className="text-xs font-bold text-slate-200">
                            {tx.amountIn}
                          </span>
                          <span className="text-[9px] font-mono text-slate-400">{tx.assetIn}</span>
                        </div>
                        {tx.amountOut && tx.assetOut && (
                          <div className="flex items-baseline justify-end gap-0.5 mt-0.5">
                            <span className="text-[9px] font-bold text-emerald-400">
                              → {tx.amountOut}
                            </span>
                            <span className="text-[8px] font-mono text-slate-500">{tx.assetOut}</span>
                          </div>
                        )}
                      </div>
                      {hasDetails && (
                        <ChevronDown
                          className={`w-4 h-4 text-slate-400 transition-transform duration-250 shrink-0 ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
                      )}
                    </div>
                  </div>

                  {tx.txHash && (
                    <div className="flex items-center justify-between w-full text-[9px] font-mono text-slate-400 mt-1 select-none">
                      <div className="flex items-center gap-1.5">
                        <span>Hash:</span>
                        <span className="text-slate-300 font-semibold">
                          {tx.txHash.length > 12
                            ? `${tx.txHash.slice(0, 4)}...${tx.txHash.slice(-4)}`
                            : tx.txHash}
                        </span>
                      </div>
                      <a
                        href={`https://stellar.expert/explorer/testnet/tx/${tx.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-teal-400 hover:text-teal-300 transition-colors p-1 -m-1 rounded hover:bg-space-800"
                        onClick={(e) => e.stopPropagation()}
                        title="View on Stellar.expert"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}

                  {/* Expand details view */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="pt-3 border-t border-space-800/80 space-y-2.5 text-[10px] font-mono text-slate-300">
                          {tx.senderAddress && (
                            <div className="flex justify-between items-center gap-2">
                              <span className="text-slate-500">From:</span>
                              <span className="truncate max-w-[200px]" title={tx.senderAddress}>
                                {tx.senderAddress}
                              </span>
                            </div>
                          )}
                          {tx.receiverAddress && (
                            <div className="flex justify-between items-center gap-2">
                              <span className="text-slate-500">To:</span>
                              <span className="truncate max-w-[200px]" title={tx.receiverAddress}>
                                {tx.receiverAddress}
                              </span>
                            </div>
                          )}
                          {tx.escrowContract && (
                            <div className="flex justify-between items-center gap-2">
                              <span className="text-slate-500">Escrow:</span>
                              <span className="truncate max-w-[200px]" title={tx.escrowContract}>
                                {tx.escrowContract}
                              </span>
                            </div>
                          )}
                          {tx.milestones && tx.milestones.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-space-800/80 space-y-3">
                              <span className="text-slate-400 font-bold uppercase tracking-wider text-[8px] select-none">Milestones Timeline</span>
                              <div className="relative pl-6 space-y-6 text-left border-l border-space-800 ml-3 mt-2">
                                {tx.milestones.map((m, idx) => {
                                  let statusText = "Pending";
                                  let statusColor = "text-slate-500";
                                  let dotColor = "bg-slate-500 shadow-[0_0_6px_rgba(100,116,139,0.3)]";
                                  let subTxHash = "";

                                  if (m.is_completed) {
                                    statusText = "Released";
                                    statusColor = "text-teal-400";
                                    dotColor = "bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.5)]";
                                    subTxHash = m.releaseTxHash || "";
                                  } else if (m.is_disputed) {
                                    statusText = "Disputed";
                                    statusColor = "text-rose-400";
                                    dotColor = "bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.5)]";
                                    subTxHash = m.disputeTxHash || "";
                                  } else if (m.submitted_at > 0) {
                                    statusText = "Work Submitted";
                                    statusColor = "text-amber-400";
                                    dotColor = "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]";
                                    subTxHash = m.submitTxHash || "";
                                  }

                                  return (
                                    <div key={idx} className="relative flex flex-col gap-1 group text-left">
                                      {/* State-colored glowing dot indicator */}
                                      <div className="absolute -left-[31px] top-1 flex items-center justify-center">
                                        <span className={`w-3 h-3 rounded-full ${dotColor} border-2 border-space-950 transition-all`} />
                                      </div>
                                      
                                      <div className="flex justify-between items-baseline gap-2">
                                        <span className="font-bold text-slate-200 text-[10px]">{idx + 1}. {m.description}</span>
                                        <span className={`text-[9px] font-bold tracking-wide uppercase ${statusColor}`}>{statusText}</span>
                                      </div>
                                      
                                      <div className="flex justify-between items-center text-[9px] text-slate-500">
                                        <span>Weight: {(m.payout_weight / 100).toFixed(0)}%</span>
                                        {subTxHash && (
                                          <a
                                            href={`https://stellar.expert/explorer/testnet/tx/${subTxHash}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-teal-400/80 hover:text-teal-400 flex items-center gap-0.5 hover:underline font-mono"
                                          >
                                            <span>Tx: {subTxHash.slice(0, 4)}...{subTxHash.slice(-4)}</span>
                                            <ExternalLink className="w-2.5 h-2.5" />
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
