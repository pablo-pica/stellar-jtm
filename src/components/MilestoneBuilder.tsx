"use client";

import React from "react";
import { Plus, Trash2, Scale, AlertTriangle, CheckCircle } from "lucide-react";

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
}

export default function MilestoneBuilder({ milestones, onChange }: MilestoneBuilderProps) {
  const totalBps = milestones.reduce((sum, m) => sum + m.payout_weight, 0);
  const totalPercent = (totalBps / 100).toFixed(2);
  const isValid = totalBps === 10000;

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
    const remainingBps = Math.max(0, 10000 - totalBps);
    const updated = [
      ...milestones,
      {
        description: `Milestone ${milestones.length + 1}`,
        payout_weight: remainingBps,
        is_completed: false,
        is_disputed: false,
        submitted_at: 0,
      },
    ];
    onChange(updated);
  };

  const handleRemoveMilestone = (index: number) => {
    const updated = milestones.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleAutoBalance = () => {
    if (milestones.length === 0) return;
    const equalBps = Math.floor(10000 / milestones.length);
    let sum = 0;
    const updated = milestones.map((m, i) => {
      const isLast = i === milestones.length - 1;
      const weight = isLast ? (10000 - sum) : equalBps;
      sum += weight;
      return {
        ...m,
        payout_weight: weight,
      };
    });
    onChange(updated);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <span>Milestone Editor</span>
          <span className="text-xs font-normal text-slate-400">({milestones.length} milestones)</span>
        </h3>
        <button
          type="button"
          onClick={handleAutoBalance}
          className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
        >
          <Scale className="w-3.5 h-3.5" />
          Auto-Balance
        </button>
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

      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
        {milestones.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-4">No milestones defined. Add one below.</p>
        ) : (
          milestones.map((m, idx) => (
            <div key={idx} className="flex gap-2 items-center bg-slate-950 p-2.5 border border-slate-800 rounded-xl">
              <span className="text-xs font-mono text-slate-500 w-5 text-right">{idx + 1}.</span>
              <input
                type="text"
                value={m.description}
                onChange={(e) => handleUpdateDescription(idx, e.target.value)}
                placeholder="Milestone description"
                className="flex-1 bg-slate-900 border border-slate-800 focus:border-indigo-500/50 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none transition-all"
              />
              <div className="flex items-center gap-1 w-24">
                <input
                  type="number"
                  step="0.01"
                  value={Number((m.payout_weight / 100).toFixed(2))}
                  onChange={(e) => handleUpdateWeight(idx, e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500/50 rounded-lg px-2 py-1.5 text-xs text-slate-200 font-mono text-right outline-none transition-all"
                />
                <span className="text-xs text-slate-500 font-mono">%</span>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveMilestone(idx)}
                className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 active:scale-90 transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
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
    </div>
  );
}
