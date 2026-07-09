"use client";

import React, { useState } from "react";
import { Lock, AlertCircle, ChevronDown, ChevronUp, Clock, HelpCircle, Shield, Check, ArrowUpRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import CustomNumberInput from "./ui/CustomNumberInput";
import SegmentedControl, { SegmentedOption } from "./ui/SegmentedControl";
import { InlineConfirmationButton } from "./ui/ConfirmationDialog";
import MilestoneBuilder, { Milestone } from "./MilestoneBuilder";
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

interface EscrowTabProps {
  balance: string | null;
  isConnected: boolean;
  connect: () => void;
  transactions: TransactionItem[];
  expandedEscrows: Record<string, boolean>;
  toggleEscrowExpand: (id: string) => void;
  userRole: "client" | "freelancer" | "mediator" | "auto";
  setUserRole: (role: "client" | "freelancer" | "mediator" | "auto") => void;
  handleSubmitMilestone: (txId: string, idx: number) => Promise<void>;
  handleReleaseMilestone: (txId: string, idx: number) => Promise<void>;
  handleDisputeMilestone: (txId: string, idx: number) => Promise<void>;
  handleAutoReleaseMilestone: (txId: string, idx: number) => Promise<void>;
  handleRefundEscrow: (txId: string) => Promise<void>;
  onCreateEscrow: (recipient: string, amount: string, milestones: Milestone[]) => Promise<void>;
  showToast: (msg: string, type: "success" | "error" | "info") => void;
}

export default function EscrowTab({
  balance,
  isConnected,
  connect,
  transactions,
  expandedEscrows,
  toggleEscrowExpand,
  userRole,
  setUserRole,
  handleSubmitMilestone,
  handleReleaseMilestone,
  handleDisputeMilestone,
  handleAutoReleaseMilestone,
  handleRefundEscrow,
  onCreateEscrow,
  showToast,
}: EscrowTabProps) {
  const [formExpanded, setFormExpanded] = useState(true);
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [createLoading, setCreateLoading] = useState(false);

  const escrows = transactions.filter((tx) => tx.type === "escrow");

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient || !amount) {
      showToast("Please prefill recipient and amount fields.", "error");
      return;
    }
    if (!validateStellarAddress(recipient)) {
      showToast("Invalid recipient address format.", "error");
      return;
    }
    if (milestones.length === 0) {
      showToast("Please add at least one milestone.", "error");
      return;
    }
    const totalWeight = milestones.reduce((sum, m) => sum + m.payout_weight, 0);
    if (totalWeight !== 10000) {
      showToast(`Total weight must equal 100% (currently ${totalWeight / 100}%).`, "error");
      return;
    }

    setCreateLoading(true);
    try {
      await onCreateEscrow(recipient, amount, milestones);
      setRecipient("");
      setAmount("");
      setMilestones([]);
    } catch (err: any) {
      // error handled by parent/toast
    } finally {
      setCreateLoading(false);
    }
  };

  const getRoleOptionColor = (role: string) => {
    switch (role) {
      case "client":
        return "bg-teal-500";
      case "freelancer":
        return "bg-cyan-500";
      case "mediator":
        return "bg-purple-500";
      default:
        return "bg-slate-500";
    }
  };

  const getRoleHelpText = (role: string) => {
    switch (role) {
      case "client":
        return "As Client, you can Release milestones or Flag Disputes if work is incomplete.";
      case "freelancer":
        return "As Freelancer, you can Submit Work for milestones to request payout release.";
      case "mediator":
        return "As Mediator, you resolve conflicts by executing force-release or force-refunds.";
      default:
        return "Trigger auto-release parameters on submitted work once duration expires.";
    }
  };

  return (
    <div className="space-y-6" data-testid="escrow-tab-root">
      <h3 className="text-xl font-semibold font-display text-slate-100 text-left px-1 mb-6">
        Escrow Locks
      </h3>

      {isConnected ? (
        <>
          {/* Creation form section */}
          <div className="p-5 rounded-2xl glass-card space-y-4 text-left">
            <h4 className="text-base font-bold text-slate-200">Create Escrow Lock</h4>

            <form onSubmit={handleCreateSubmit} className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Recipient Address</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="G..."
                    className="w-full h-12 pl-4 pr-10 rounded-xl bg-space-900/50 border border-space-700/40 focus:border-teal-500/35 text-sm font-mono text-slate-100 placeholder-slate-500 outline-none transition-all focus-ring"
                  />
                  <div className="absolute right-3 top-3.5 text-slate-500">
                    <ArrowUpRight className="w-5 h-5" />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Lock Amount</label>
                <CustomNumberInput
                  value={amount}
                  onChange={setAmount}
                  suffix="XLM"
                  placeholder="0.00"
                />
              </div>

              <div className="pt-2">
                <MilestoneBuilder milestones={milestones} onChange={setMilestones} />
              </div>

              <button
                type="submit"
                disabled={createLoading}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-teal-400 to-primary-indigo text-xs font-bold text-white flex items-center justify-center gap-1.5 hover:shadow-lg hover:shadow-teal-500/10 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                {createLoading ? (
                  <span className="w-4 h-4 rounded-full border-2 border-slate-400 border-t-white animate-spin" />
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Create Escrow Lock</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Active escrows list header */}
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>Active Escrows</span>
              <span className="bg-space-800 border border-space-700 text-slate-300 text-[10px] px-2 py-0.5 rounded-full">
                {escrows.length}
              </span>
            </h3>
          </div>

          {/* Unified Escrow Role Selector panel */}
          <div className="p-4 rounded-xl bg-space-900/80 border border-space-800 space-y-3 text-left" data-testid="role-selector-panel">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-400 uppercase tracking-wider">
                Active Escrow Role Selector:
              </span>
              <span className="font-mono text-teal-400 uppercase font-bold">{userRole}</span>
            </div>
            <SegmentedControl
              value={userRole}
              onChange={setUserRole}
              options={[
                { label: "Client", value: "client", color: "bg-teal-500" },
                { label: "Freelancer", value: "freelancer", color: "bg-cyan-500" },
                { label: "Mediator", value: "mediator", color: "bg-purple-500" },
                { label: "Auto", value: "auto", color: "bg-slate-500" },
              ]}
              idPrefix="role-unified"
            />
            <div className="p-3 rounded-lg bg-space-950/50 border border-space-800 text-xs text-slate-400 leading-relaxed font-medium">
              <div className="font-bold text-slate-200 mb-1 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-teal-400" />
                <span>Active Role Duties ({userRole.toUpperCase()})</span>
              </div>
              {getRoleHelpText(userRole)}
            </div>
          </div>

          {/* Escrows container */}
          <div className="space-y-4">
            {escrows.length === 0 ? (
              <div className="p-8 rounded-2xl glass-card text-center space-y-5" data-testid="escrow-empty-state">
                <div className="w-14 h-14 rounded-2xl bg-space-900/80 border border-space-700/50 flex items-center justify-center mx-auto shadow-md">
                  <Lock className="w-7 h-7 text-teal-400 animate-pulse-glow" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-100">No active escrows yet</h3>
                  <p className="text-xs text-slate-400 max-w-[240px] mx-auto leading-relaxed">
                    Funded smart escrow contracts with release milestone schedules will appear here.
                  </p>
                </div>
              </div>
            ) : (
              escrows.map((escrow) => {
                const isExpanded = expandedEscrows[escrow.id];
                const completedCount = escrow.milestones?.filter((m) => m.is_completed).length || 0;
                const totalCount = escrow.milestones?.length || 0;
                const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

                return (
                  <div
                    key={escrow.id}
                    className="rounded-2xl glass-card overflow-hidden hover:border-teal-500/25 transition-all duration-300"
                    data-testid={`escrow-card-${escrow.id}`}
                  >
                    {/* Expandable Header */}
                    <button
                      type="button"
                      onClick={() => toggleEscrowExpand(escrow.id)}
                      className="w-full p-5 flex flex-col gap-3 hover:bg-space-850/30 transition-all cursor-pointer text-left focus-ring"
                    >
                      <div className="flex justify-between items-start w-full">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                            <code className="text-xs font-mono font-bold text-slate-300">
                              {escrow.escrowContract
                                ? `${escrow.escrowContract.slice(0, 6)}...${escrow.escrowContract.slice(-6)}`
                                : "Contract Lock"}
                            </code>
                          </div>
                          <p className="text-xs text-slate-400 font-mono">{escrow.timestamp}</p>
                        </div>

                        <div className="text-right flex items-center gap-3">
                          <div>
                            <span className="text-sm font-bold text-slate-200">
                              {escrow.amountIn} {escrow.assetIn}
                            </span>
                          </div>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                        </div>
                      </div>

                      {/* Horizontal progress indicators */}
                      <div className="space-y-1.5 w-full">
                        <div className="flex justify-between text-xs font-mono text-slate-400">
                          <span>Milestones Progress</span>
                          <span>{completedCount}/{totalCount} Completed</span>
                        </div>
                        <div className="w-full bg-space-950 h-1.5 rounded-full overflow-hidden border border-space-900">
                          <div
                            className="bg-gradient-to-r from-teal-500 to-cyan-400 h-full rounded-full transition-all duration-500"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                    </button>

                    {/* Collapsed Children Accordion Details */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-5 pt-4 border-t border-space-700/20 space-y-5 bg-space-950/15">
                            {/* Milestones Vertical Timeline */}
                            <div className="relative pl-6 space-y-6 text-left border-l border-space-800 ml-3 mt-2">
                              {escrow.milestones?.map((m, idx) => {
                                const isCompleted = m.is_completed;
                                const isDisputed = m.is_disputed;
                                const isSubmitted = m.submitted_at > 0;

                                // Status Color Mapping
                                const getMilestoneStatus = () => {
                                  if (isCompleted) return { text: "Released", dotColor: "bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.5)]", colorClass: "text-teal-400 bg-teal-500/10 border-teal-500/20" };
                                  if (isDisputed) return { text: "Disputed", dotColor: "bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.5)]", colorClass: "text-red-400 bg-red-500/10 border-red-500/20" };
                                  if (isSubmitted) return { text: "Submitted", dotColor: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]", colorClass: "text-amber-400 bg-amber-500/10 border-amber-500/20" };
                                  return { text: "Open", dotColor: "bg-slate-500 shadow-[0_0_6px_rgba(100,116,139,0.3)]", colorClass: "text-slate-400 bg-space-800 border-space-700/50" };
                                };

                                const status = getMilestoneStatus();

                                return (
                                  <div
                                    key={idx}
                                    className="relative flex items-center justify-between gap-4 group"
                                    data-testid={`milestone-card-${idx}`}
                                  >
                                    {/* State-colored glowing dot indicator */}
                                    <div className="absolute -left-[31px] top-1 flex items-center justify-center">
                                      <span className={`w-3.5 h-3.5 rounded-full ${status.dotColor} border-2 border-space-950 transition-all`} />
                                    </div>

                                    {/* Milestone details (ledger content) */}
                                    <div className="flex-1 space-y-1 min-w-0">
                                      <p className="text-xs font-bold text-slate-200 truncate">{m.description}</p>
                                      <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-400">
                                        <span>Weight: {m.payout_weight / 100}%</span>
                                        <span className="w-1 h-1 rounded-full bg-space-700" />
                                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${status.colorClass}`}>
                                          {status.text}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Milestone Actions with tiered inline confirmation */}
                                    {!isCompleted && (
                                      <div className="flex items-center gap-2 shrink-0">
                                        {userRole === "freelancer" && !isDisputed && !isSubmitted && (
                                          <InlineConfirmationButton
                                            actionText="Submit Work"
                                            confirmText="Confirm Submit?"
                                            onConfirm={() => handleSubmitMilestone(escrow.id, idx)}
                                            className="h-8 px-3 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-[10px] font-bold text-cyan-400 cursor-pointer"
                                          />
                                        )}

                                        {userRole === "client" && (
                                          <>
                                            <InlineConfirmationButton
                                              actionText="Release Funds"
                                              confirmText="Confirm Release?"
                                              onConfirm={() => handleReleaseMilestone(escrow.id, idx)}
                                              className="h-8 px-3 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-[10px] font-bold text-teal-400 cursor-pointer"
                                            />
                                            {!isDisputed && (
                                              <InlineConfirmationButton
                                                actionText="Flag Dispute"
                                                confirmText="Confirm Dispute?"
                                                onConfirm={() => handleDisputeMilestone(escrow.id, idx)}
                                                className="h-8 px-3 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-[10px] font-bold text-amber-400 cursor-pointer"
                                              />
                                            )}
                                          </>
                                        )}

                                        {userRole === "mediator" && (
                                          <>
                                            <InlineConfirmationButton
                                              actionText="Resolve: Release"
                                              confirmText="Confirm Resolve Release?"
                                              onConfirm={() => handleReleaseMilestone(escrow.id, idx)}
                                              className="h-8 px-3 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-[10px] font-bold text-purple-400 cursor-pointer"
                                            />
                                            <InlineConfirmationButton
                                              actionText="Resolve: Refund"
                                              confirmText="Confirm Resolve Refund?"
                                              onConfirm={() => handleRefundEscrow(escrow.id)}
                                              className="h-8 px-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-[10px] font-bold text-red-400 cursor-pointer"
                                            />
                                          </>
                                        )}

                                        {userRole === "auto" && isSubmitted && !isDisputed && (
                                          <InlineConfirmationButton
                                            actionText="Trigger Auto-Release"
                                            confirmText="Confirm Auto-Release?"
                                            onConfirm={() => handleAutoReleaseMilestone(escrow.id, idx)}
                                            className="h-8 px-3 rounded-lg bg-slate-500/10 hover:bg-slate-500/20 border border-slate-500/30 text-[10px] font-bold text-slate-400 cursor-pointer"
                                          />
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            {/* Refund expired escrow placed consistently as footer */}
                            {escrow.isExpired && escrow.milestones?.some((m) => !m.is_completed) && (
                              <div className="pt-2 border-t border-space-700/20">
                                <InlineConfirmationButton
                                  actionText="Refund Expired Escrow"
                                  confirmText="Confirm Entire Refund?"
                                  onConfirm={() => handleRefundEscrow(escrow.id)}
                                  className="w-full h-10 rounded-xl bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 text-[10px] font-bold text-red-400 flex items-center justify-center gap-1.5 cursor-pointer"
                                />
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            )}
          </div>
        </>
      ) : (
        /* Disconnected state */
        <div className="p-8 rounded-2xl glass-card text-center space-y-5" data-testid="disconnected-state">
          <div className="w-14 h-14 rounded-2xl bg-space-900/80 border border-space-700/50 flex items-center justify-center mx-auto shadow-md">
            <Lock className="w-7 h-7 text-teal-400 animate-pulse-glow" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-100">
              Escrow Locks
            </h3>
            <p className="text-xs text-slate-400 max-w-[240px] mx-auto leading-relaxed">
              Connect your wallet to configure milestones and lock smart contract escrows.
            </p>
          </div>
          <button
            onClick={connect}
            type="button"
            className="w-full h-11 rounded-xl bg-gradient-to-r from-teal-400 to-primary-indigo text-xs font-bold text-white flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer focus-ring"
            data-testid="disconnected-connect-btn"
          >
            <Lock className="w-4 h-4" />
            Connect Wallet
          </button>
        </div>
      )}
    </div>
  );
}
