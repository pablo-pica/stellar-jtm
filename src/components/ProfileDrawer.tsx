"use client";

import React, { useState } from "react";
import { X, Copy, Check, ExternalLink, ShieldCheck, Wallet, LogOut } from "lucide-react";

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  address: string | null;
  balance: string | null;
  disconnect: () => void;
  isLoading: boolean;
}

export default function ProfileDrawer({
  isOpen,
  onClose,
  address,
  balance,
  disconnect,
  isLoading,
}: ProfileDrawerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const truncateAddress = (addr: string) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-space-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="absolute inset-y-0 right-0 flex w-[80%]">
        {/* Drawer Panel */}
        <div className="w-full transform transition-transform duration-300 ease-out glass-panel border-l border-space-700/50 flex flex-col">
          {/* Header */}
          <div className="px-6 py-5 border-b border-space-700/30 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-slate-100 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary-indigo" />
              Wallet Account
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-space-800/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {address ? (
              <>
                {/* Account Address Card */}
                <div className="p-4 rounded-xl bg-space-900/50 border border-space-700/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Connected via Wallets Kit
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                      <ShieldCheck className="w-3 h-3" />
                      Testnet
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-space-950/60 p-3 rounded-lg border border-space-800">
                    <code className="text-xs font-mono text-slate-200">
                      {truncateAddress(address)}
                    </code>
                    <button
                      onClick={handleCopy}
                      className="p-1.5 rounded text-slate-400 hover:text-primary-cyan hover:bg-space-800 transition-all"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Balances Section */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
                    Token Balances
                  </h3>
                  <div className="space-y-2">
                    {/* XLM Balance */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-space-800/40 border border-space-700/20">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-indigo/10 border border-primary-indigo/30 flex items-center justify-center text-xs font-bold text-primary-indigo">
                          XLM
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-100">Stellar Lumens</p>
                          <p className="text-[10px] text-slate-400">Native Asset</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {isLoading ? (
                          <div className="w-16 h-4 rounded bg-space-800 animate-pulse" />
                        ) : (
                          <p className="text-sm font-bold font-mono text-slate-100">
                            {Number(balance).toLocaleString(undefined, {
                              minimumFractionDigits: 4,
                              maximumFractionDigits: 4,
                            })}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Mock USDC */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-space-800/10 border border-space-700/10 opacity-70">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-[10px] font-bold text-emerald-400">
                          USDC
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-200">Mock USD Coin</p>
                          <p className="text-[10px] text-slate-500">Soroban Token</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold font-mono text-slate-300">0.0000 (Mock)</p>
                      </div>
                    </div>

                    {/* Mock PHP */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-space-800/10 border border-space-700/10 opacity-70">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-blue/10 border border-primary-blue/30 flex items-center justify-center text-[10px] font-bold text-primary-blue">
                          PHP
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-200">Mock Philippine Peso</p>
                          <p className="text-[10px] text-slate-500">Soroban Token</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold font-mono text-slate-300">0.0000 (Mock)</p>
                      </div>
                    </div>

                    {/* Mock NGN */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-space-800/10 border border-space-700/10 opacity-70">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-cyan/10 border border-primary-cyan/30 flex items-center justify-center text-[10px] font-bold text-primary-cyan">
                          NGN
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-200">Mock Nigerian Naira</p>
                          <p className="text-[10px] text-slate-500">Soroban Token</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold font-mono text-slate-300">0.0000 (Mock)</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Developer Utilities */}
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
                    Developer Utilities
                  </h3>
                  <a
                    href="https://laboratory.stellar.org/#account-creator?network=testnet"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl bg-space-800/30 border border-space-700/30 hover:bg-space-800/60 hover:border-primary-indigo/30 transition-all text-slate-300 hover:text-slate-100 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-space-950 flex items-center justify-center text-xs font-bold">
                        🔧
                      </div>
                      <div>
                        <p className="text-xs font-semibold">Stellar Friendbot</p>
                        <p className="text-[10px] text-slate-400">Get Testnet XLM Funds</p>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                  </a>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-space-800 flex items-center justify-center text-slate-400 border border-space-700/50">
                  <Wallet className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">No Wallet Connected</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-[200px] mx-auto">
                    Connect a Stellar wallet to view balances and make transactions.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          {address && (
            <div className="p-6 border-t border-space-700/30 bg-space-950/30">
              <button
                onClick={() => {
                  disconnect();
                  onClose();
                }}
                className="w-full h-11 flex items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 font-semibold text-sm active:scale-[0.99] transition-all"
              >
                <LogOut className="w-4 h-4" />
                Disconnect Wallet
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
