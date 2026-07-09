"use client";

import React from "react";
import SegmentedControl from "./ui/SegmentedControl";
import CustomNumberInput from "./ui/CustomNumberInput";
import InfoTooltip from "./ui/InfoTooltip";

interface SettingsTabProps {
  network: string;
  setNetwork: (val: string) => void;
  slippage: string;
  setSlippage: (val: string) => void;
  isAiEnabled: boolean;
  setIsAiEnabled: (val: boolean) => void;
}

export default function SettingsTab({
  network,
  setNetwork,
  slippage,
  setSlippage,
  isAiEnabled,
  setIsAiEnabled,
}: SettingsTabProps) {
  // Predefined slippage values
  const isCustomSlippage = !["0.5", "1.0", "3.0"].includes(slippage);

  return (
    <div className="space-y-6" data-testid="settings-tab-root">
      <h3 className="text-xl font-semibold font-display text-slate-100 text-left px-1 mb-6">
        App Settings
      </h3>

      {/* 1. Network Environment Group */}
      <div className="p-5 rounded-2xl glass-card text-left space-y-4" data-testid="settings-network-group">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <h4 className="text-base font-bold text-slate-200">Network Environment</h4>
              <InfoTooltip content="The active Stellar blockchain rail for executing router transactions." />
            </div>
            <p className="text-xs text-slate-400">Current active blockchain rail</p>
          </div>
          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full select-none" data-testid="active-network-badge">
            {network}
          </span>
        </div>

        <SegmentedControl
          value={network}
          onChange={setNetwork}
          options={[
            { label: "Testnet", value: "Testnet", color: "bg-teal-500" },
            { label: "Futurenet", value: "Futurenet", color: "bg-teal-500" },
            { label: "Local", value: "Local", color: "bg-teal-500" },
          ]}
          idPrefix="net"
        />
      </div>

      {/* 2. Trading/Slippage Group */}
      <div className="p-5 rounded-2xl glass-card text-left space-y-4" data-testid="settings-slippage-group">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <h4 className="text-base font-bold text-slate-200">Slippage Tolerance</h4>
            <InfoTooltip content="Allowed trade price impact. If pool conversion rate shifts beyond this threshold, transaction reverts." />
          </div>
          <p className="text-xs text-slate-400">Allowed trade price impact percentage</p>
        </div>

        <SegmentedControl
          value={isCustomSlippage ? "Custom" : slippage}
          onChange={(val) => {
            if (val !== "Custom") {
              setSlippage(val);
            }
          }}
          options={[
            { label: "0.5%", value: "0.5", color: "bg-teal-500" },
            { label: "1.0%", value: "1.0", color: "bg-teal-500" },
            { label: "3.0%", value: "3.0", color: "bg-teal-500" },
            { label: "Custom", value: "Custom", color: "bg-teal-500" },
          ]}
          idPrefix="slip"
        />

        {isCustomSlippage && (
          <div className="pt-2">
            <CustomNumberInput
              value={slippage}
              onChange={setSlippage}
              suffix="%"
              min={0.1}
              max={50}
              step={0.1}
              placeholder="1.0"
            />
          </div>
        )}
      </div>

      {/* 3. AI Features Group */}
      <div className="p-5 rounded-2xl glass-card text-left flex items-center justify-between" data-testid="settings-ai-group">
        <div className="space-y-1 min-w-0 pr-4">
          <div className="flex items-center gap-1.5">
            <h4 className="text-base font-bold text-slate-200">AI Intent Assist</h4>
            <InfoTooltip content="Enables the collapsible plain text payment command parsing strip on your Send tab." />
          </div>
          <p className="text-xs text-slate-400">Plain text payment commands parsing</p>
        </div>

        {/* 48x28px Toggle switch with 44px touch area wrapper */}
        <button
          type="button"
          onClick={() => setIsAiEnabled(!isAiEnabled)}
          className="relative flex items-center justify-center focus-ring cursor-pointer"
          style={{ minWidth: "48px", minHeight: "44px" }}
          aria-label="Toggle AI Assist"
          data-testid="ai-toggle-switch"
        >
          <div
            className={`w-12 h-7 rounded-full transition-colors relative ${
              isAiEnabled ? "bg-teal-500" : "bg-space-800 border border-space-700/60"
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white absolute top-1 transition-all shadow ${
                isAiEnabled ? "left-6" : "left-1"
              }`}
            />
          </div>
        </button>
      </div>

      {/* 4. About Group */}
      <div className="p-5 rounded-2xl glass-card text-left space-y-3" data-testid="settings-about-group">
        <h4 className="text-base font-bold text-slate-200">About Aethyr</h4>
        <div className="space-y-1 text-xs text-slate-400">
          <p className="font-semibold text-slate-300">Aethyr Protocol v0.2.0 (Redesign)</p>
          <p>Designed for Stellar JTM Hackathon</p>
        </div>
        <div className="flex gap-4 pt-2 text-xs font-bold text-teal-400">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline flex items-center gap-1 focus-ring"
          >
            GitHub ↗
          </a>
          <a
            href="https://stellar.org"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline flex items-center gap-1 focus-ring"
          >
            Documentation ↗
          </a>
        </div>
      </div>
    </div>
  );
}
