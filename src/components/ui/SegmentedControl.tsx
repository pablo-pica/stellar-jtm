"use client";

import React from "react";
import { motion } from "framer-motion";

export interface SegmentedOption<T> {
  label: string;
  value: T;
  color?: string; // Tailwind bg class like bg-teal-500, bg-cyan-500, bg-purple-500
}

interface SegmentedControlProps<T> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (val: T) => void;
  className?: string;
  idPrefix?: string;
}

export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className = "",
  idPrefix = "segmented",
}: SegmentedControlProps<T>) {
  return (
    <div className={`flex p-1 rounded-xl bg-space-950/60 border border-space-700/50 relative overflow-hidden ${className}`}>
      {options.map((opt) => {
        const isActive = opt.value === value;
        const activeBgClass = opt.color || "bg-primary-indigo";
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`relative flex-1 py-2 text-xs font-bold transition-colors z-10 focus-ring rounded-lg cursor-pointer ${
              isActive ? "text-white" : "text-slate-400 hover:text-slate-200"
            }`}
            data-testid={`segmented-option-${opt.value}`}
          >
            {isActive && (
              <motion.div
                layoutId={`${idPrefix}-active-bg`}
                className={`absolute inset-0 rounded-lg -z-10 ${activeBgClass}`}
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                data-testid="segmented-active-pill"
              />
            )}
            <span className="relative z-20">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
