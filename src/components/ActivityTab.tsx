"use client";

import React, { useState } from "react";
import { Clock, ReceiptText, ExternalLink, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

interface Milestone {
  description: string;
  payout_weight: number;
  is_completed: boolean;
  is_disputed: boolean;
  submitted_at: number;
}

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

export default function ActivityTab({ transactions }: ActivityTabProps) {
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

      {transactions.length === 0 ? (
        <div className="p-8 rounded-2xl glass-card text-center space-y-4" data-testid="activity-empty-state">
          <div className="w-12 h-12 rounded-full bg-space-900 border border-space-700/50 flex items-center justify-center mx-auto text-slate-400">
            <ReceiptText className="w-6 h-6 text-teal-400/70" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-200">No transactions yet</p>
            <p className="text-[10px] text-slate-400 max-w-[200px] mx-auto leading-relaxed">
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
            const leftBarColor = getLeftBarColor(tx.type);
            const badgeStyle = getBadgeStyles(tx.type);

            return (
              <motion.div
                key={tx.id}
                variants={itemVariants}
                onClick={() => toggleExpand(tx.id)}
                className="relative rounded-xl glass-card hover:border-teal-500/25 transition-all overflow-hidden flex flex-col cursor-pointer text-left focus-ring"
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

                    <div className="text-right shrink-0">
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
                  </div>

                  {tx.txHash && (
                    <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-400">
                      <span>Hash:</span>
                      <span className="text-slate-300 font-semibold">
                        {tx.txHash.length > 12
                          ? `${tx.txHash.slice(0, 4)}...${tx.txHash.slice(-4)}`
                          : tx.txHash}
                      </span>
                    </div>
                  )}

                  {/* Expand details view */}
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-3 pt-3 border-t border-space-700/20 space-y-2.5 text-[10px] font-mono text-slate-300"
                      onClick={(e) => e.stopPropagation()}
                    >
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
                      {tx.txHash && (
                        <div className="pt-1.5 flex justify-end">
                          <a
                            href={`https://stellar.expert/explorer/testnet/tx/${tx.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 h-7 px-2.5 rounded bg-space-800 hover:bg-space-700 border border-space-700/50 text-[9px] font-semibold text-teal-400 transition-colors"
                          >
                            <span>Explorer ↗</span>
                          </a>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
