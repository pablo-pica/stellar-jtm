"use client";

import React from "react";
import { Plus, Trash2, Scale, AlertTriangle, CheckCircle } from "lucide-react";
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
}

export default function MilestoneBuilder({ milestones, onChange }: MilestoneBuilderProps) {
  const [autoBalance, setAutoBalance] = React.useState(false);

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
    if (autoBalance) return;
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
    if (autoBalance) {
      onChange(balanceMilestones(updated));
    } else {
      const remainingBps = Math.max(0, 10000 - totalBps);
      updated[updated.length - 1].payout_weight = remainingBps;
      onChange(updated);
    }
  };

  const handleRemoveMilestone = (index: number) => {
    const updated = milestones.filter((_, i) => i !== index);
    if (autoBalance) {
      onChange(balanceMilestones(updated));
    } else {
      onChange(updated);
    }
  };

  const handleAutoBalance = () => {
    if (milestones.length === 0) return;
    onChange(balanceMilestones(milestones));
  };

  const handleToggleAutoBalance = (checked: boolean) => {
    setAutoBalance(checked);
    if (checked && milestones.length > 0) {
      onChange(balanceMilestones(milestones));
    }
  };

  return (
    <div className="space-y-4 pt-4 border-t border-space-800 mt-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <span>Milestone Editor</span>
          <span className="text-xs font-normal text-slate-400">({milestones.length} milestones)</span>
        </h3>
        <div className="flex items-center gap-3">
          {/* Auto-Balance Toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <span className="text-xs text-slate-400 font-medium">Auto-Balance</span>
            <div className="relative flex items-center">
              <input
                type="checkbox"
                checked={autoBalance}
                onChange={(e) => handleToggleAutoBalance(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-7 h-4 bg-slate-800 rounded-full border border-slate-700 peer-checked:bg-teal-500/20 peer-checked:border-teal-500/40 transition-all duration-200"></div>
              <div className="absolute left-[3px] w-2 h-2 bg-slate-400 rounded-full peer-checked:translate-x-3 peer-checked:bg-teal-400 transition-all duration-200"></div>
            </div>
          </label>

          <button
            type="button"
            onClick={handleAutoBalance}
            disabled={autoBalance}
            className={`text-xs px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
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
            <div key={idx} className="flex gap-2 items-center py-2 border-b border-space-800/80 last:border-b-0">
              {/* Index number */}
              <span className="text-xs font-mono text-slate-500 w-5 text-right shrink-0">{idx + 1}.</span>

              {/* Description input */}
              <input
                type="text"
                value={m.description}
                onChange={(e) => handleUpdateDescription(idx, e.target.value)}
                placeholder="Milestone description"
                className="flex-1 min-w-0 h-10 bg-slate-900 border border-slate-800 focus:border-teal-500/35 rounded-xl px-3 text-xs text-slate-200 outline-none transition-all focus-ring"
              />

              {/* Weight input container */}
              <div className="flex items-center gap-1.5 shrink-0">
                <div className="w-[116px]">
                  <CustomNumberInput
                    value={Number((m.payout_weight / 100).toFixed(2)).toString()}
                    onChange={(val) => handleUpdateWeight(idx, val)}
                    min={0}
                    max={100}
                    step={1}
                    disabled={autoBalance}
                    compact={true}
                  />
                </div>
                <span className="text-xs text-slate-500 font-mono select-none">%</span>
              </div>

              {/* Remove button */}
              <button
                type="button"
                onClick={() => handleRemoveMilestone(idx)}
                className="p-2 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 active:scale-90 transition-all cursor-pointer focus-ring shrink-0"
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
