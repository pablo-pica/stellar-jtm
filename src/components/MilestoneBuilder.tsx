"use client";

import React from "react";
import { Plus, Trash2, Scale, AlertTriangle, CheckCircle, SlidersHorizontal } from "lucide-react";
import { motion } from "framer-motion";
import CustomNumberInput from "./ui/CustomNumberInput";

export interface Milestone {
  description: string;
  payout_weight: number; // in basis points (e.g. 5000 = 50.00%)
  is_completed: boolean;
  is_disputed: boolean;
  submitted_at: number;
}

interface MilestoneBuilderProps {
  milestones: Milestone[];
  onChange: (milestones: Milestone[]) => void;
  onClose?: () => void;
  autoBalance?: boolean;
}

interface MilestoneRowProps {
  index: number;
  milestone: Milestone;
  autoBalance: boolean;
  onUpdateDescription: (desc: string) => void;
  onUpdateWeight: (percentVal: string) => void;
  onRemove: () => void;
}

function MilestoneRow({
  index,
  milestone,
  autoBalance,
  onUpdateDescription,
  onUpdateWeight,
  onRemove,
}: MilestoneRowProps) {
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);

  return (
    <div className="flex flex-col py-2 border-b border-space-800/80 last:border-b-0">
      <div className="flex gap-2 items-center">
        {/* Index number */}
        <span className="text-xs font-mono text-slate-500 w-5 text-right shrink-0">{index}.</span>

        {/* Description input */}
        <input
          type="text"
          value={milestone.description}
          onChange={(e) => onUpdateDescription(e.target.value)}
          placeholder="Milestone description"
          className="flex-1 min-w-0 h-12 bg-slate-900 border border-slate-800 focus:border-teal-500/35 rounded-xl px-3 text-sm text-slate-200 outline-none transition-all focus-ring"
        />

        {/* Toggle button */}
        <button
          type="button"
          onClick={() => setIsDrawerOpen(!isDrawerOpen)}
          className="p-2 text-slate-500 hover:text-teal-400 cursor-pointer transition-colors shrink-0"
          title="Toggle weight and delete panel"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Drawer panel: animated container */}
      <motion.div
        initial={false}
        animate={{
          height: isDrawerOpen ? "auto" : 0,
          opacity: isDrawerOpen ? 1 : 0,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        style={{ overflow: isDrawerOpen ? "visible" : "hidden" }}
        className="overflow-hidden"
      >
        <div className="flex items-center justify-between gap-4 mt-2 p-3 bg-slate-900/40 rounded-xl border border-slate-800/40">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Weight:</span>
            <div className="w-[136px]">
              <CustomNumberInput
                value={Number((milestone.payout_weight / 100).toFixed(2)).toString()}
                onChange={onUpdateWeight}
                min={0}
                max={100}
                step={1}
                size="lg"
                disabled={autoBalance}
              />
            </div>
            <span className="text-xs text-slate-500 font-mono select-none">%</span>
          </div>

          {/* Remove button */}
          <button
            type="button"
            onClick={onRemove}
            className="p-2 rounded-lg hover:bg-red-500/10 text-red-500 hover:text-red-400 active:scale-90 transition-all cursor-pointer focus-ring flex items-center gap-1.5 shrink-0"
          >
            <Trash2 className="w-4 h-4" />
            <span className="text-xs font-medium">Remove</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function MilestoneBuilder({
  milestones,
  onChange,
  onClose,
  autoBalance = false,
}: MilestoneBuilderProps) {
  const totalBps = milestones.reduce((sum, m) => sum + m.payout_weight, 0);
  const totalPercent = (totalBps / 100).toFixed(2);
  const isValid = totalBps === 10000;

  const balanceMilestones = (list: Milestone[]): Milestone[] => {
    if (list.length === 0) return [];
    const equalBps = Math.floor(10000 / list.length);
    let sum = 0;
    return list.map((m, i) => {
      const isLast = i === list.length - 1;
      const weight = isLast ? (10000 - sum) : equalBps;
      sum += weight;
      return {
        ...m,
        payout_weight: weight,
      };
    });
  };

  const handleUpdateDescription = (index: number, desc: string) => {
    const updated = [...milestones];
    updated[index] = { ...updated[index], description: desc };
    onChange(updated);
  };

  const handleUpdateWeight = (index: number, percentVal: string) => {
    const numeric = parseFloat(percentVal) || 0;
    const bps = Math.round(numeric * 100);
    const updated = [...milestones];
    updated[index] = { ...updated[index], payout_weight: bps };
    onChange(updated);
  };

  const handleAddMilestone = () => {
    const newMilestone: Milestone = {
      description: `Milestone ${milestones.length + 1}`,
      payout_weight: 0,
      is_completed: false,
      is_disputed: false,
      submitted_at: 0,
    };
    const updated = [...milestones, newMilestone];
    const remainingBps = Math.max(0, 10000 - totalBps);
    updated[updated.length - 1].payout_weight = remainingBps;
    onChange(updated);
  };

  const handleRemoveMilestone = (index: number) => {
    const updated = milestones.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleAutoBalance = () => {
    if (milestones.length === 0) return;
    onChange(balanceMilestones(milestones));
  };

  return (
    <div className="space-y-4 pt-4 border-t border-space-800 mt-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <span>Milestone Editor</span>
          <span className="text-xs font-normal text-slate-400">({milestones.length} milestones)</span>
        </h3>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleAutoBalance}
            disabled={milestones.length === 0}
            className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Scale className="w-3.5 h-3.5" />
            Split Evenly
          </button>
        </div>
      </div>

      {/* Progress bar visualizer */}
      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
        {milestones.map((m, idx) => {
          const pct = m.payout_weight / 100;
          if (pct <= 0) return null;
          const colors = [
            "bg-indigo-500",
            "bg-cyan-500",
            "bg-emerald-500",
            "bg-violet-500",
            "bg-sky-500",
          ];
          const colorClass = colors[idx % colors.length];
          return (
            <div
              key={idx}
              style={{ width: `${pct}%` }}
              className={`${colorClass} h-full border-r border-slate-900 last:border-r-0`}
              title={`${m.description}: ${pct}%`}
            />
          );
        })}
      </div>

      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
        {milestones.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-4">No milestones defined. Add one below.</p>
        ) : (
          milestones.map((m, idx) => (
            <MilestoneRow
              key={idx}
              index={idx + 1}
              milestone={m}
              autoBalance={autoBalance}
              onUpdateDescription={(desc) => handleUpdateDescription(idx, desc)}
              onUpdateWeight={(val) => handleUpdateWeight(idx, val)}
              onRemove={() => handleRemoveMilestone(idx)}
            />
          ))
        )}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleAddMilestone}
          className="flex-1 text-xs px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700/50 text-slate-200 flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Milestone
        </button>
      </div>

      {/* Validation status badge */}
      <div className={`p-3 rounded-xl border flex items-center gap-2 text-xs transition-all ${
        isValid
          ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400"
          : "bg-amber-500/5 border-amber-500/20 text-amber-400"
      }`}>
        {isValid ? (
          <>
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>Perfect! Total weight is exactly 100% (10,000 bps). Ready to lock escrow.</span>
          </>
        ) : (
          <>
            <AlertTriangle className="w-4 h-4 flex-shrink-0 animate-pulse" />
            <span>
              Total weight is {totalPercent}% ({totalBps} bps). Must sum to exactly 100.00% (10,000 bps).
            </span>
          </>
        )}
      </div>

      {/* Apply Milestones CTA button */}
      <button
        type="button"
        onClick={() => onClose?.()}
        className="w-full h-12 rounded-xl bg-gradient-to-r from-teal-400 to-primary-indigo text-xs font-bold text-white flex items-center justify-center gap-1.5 hover:shadow-lg hover:shadow-teal-500/10 active:scale-95 transition-all cursor-pointer mt-4"
      >
        Apply Milestones
      </button>
    </div>
  );
}
