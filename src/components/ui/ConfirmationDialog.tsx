"use client";

import React, { useState, useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Modal-based Confirmation
interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "success" | "info";
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "info",
}: ConfirmationDialogProps) {
  const getColors = () => {
    switch (type) {
      case "danger":
        return {
          iconColor: "text-red-400",
          bgColor: "bg-red-500/10",
          btnColor: "bg-red-500 hover:bg-red-600 focus:ring-red-400/50",
        };
      case "warning":
        return {
          iconColor: "text-amber-400",
          bgColor: "bg-amber-500/10",
          btnColor: "bg-amber-500 hover:bg-amber-600 focus:ring-amber-400/50",
        };
      case "success":
        return {
          iconColor: "text-emerald-400",
          bgColor: "bg-emerald-500/10",
          btnColor: "bg-emerald-500 hover:bg-emerald-600 focus:ring-emerald-400/50",
        };
      default:
        return {
          iconColor: "text-primary-indigo",
          bgColor: "bg-primary-indigo/10",
          btnColor: "bg-primary-indigo hover:bg-primary-indigo-dark focus:ring-primary-indigo/50",
        };
    }
  };

  const colors = getColors();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" data-testid="confirm-dialog-overlay">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            data-testid="confirm-dialog-backdrop"
          />

          {/* Modal Card content */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative w-full max-w-[340px] bg-space-800 border border-space-700/50 rounded-2xl p-5 shadow-2xl z-10 flex flex-col focus-ring"
            data-testid="confirm-dialog-modal"
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-200 focus-ring rounded-lg p-0.5"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col items-center text-center space-y-4 pt-2">
              <div className={`w-12 h-12 rounded-full ${colors.bgColor} flex items-center justify-center`}>
                <AlertTriangle className={`w-6 h-6 ${colors.iconColor}`} />
              </div>

              <div className="space-y-1">
                <h4 className="text-base font-display font-semibold text-slate-100">{title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed px-1">{message}</p>
              </div>

              <div className="flex gap-2.5 w-full pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 h-10 rounded-xl border border-space-700 hover:bg-space-700 text-xs font-bold text-slate-300 active:scale-95 transition-all focus-ring cursor-pointer"
                  data-testid="confirm-dialog-cancel"
                >
                  {cancelText}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={`flex-1 h-10 rounded-xl text-xs font-bold text-white active:scale-95 transition-all focus-ring cursor-pointer ${colors.btnColor}`}
                  data-testid="confirm-dialog-confirm"
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// Tap-twice confirmation button wrapper
interface InlineConfirmationButtonProps {
  onConfirm: () => void;
  actionText: string;
  confirmText?: string;
  className?: string;
  disabled?: boolean;
}

export function InlineConfirmationButton({
  onConfirm,
  actionText,
  confirmText,
  className = "",
  disabled = false,
}: InlineConfirmationButtonProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    if (!isConfirming) return;
    const timer = setTimeout(() => {
      setIsConfirming(false);
    }, 3000); // Auto reset after 3 seconds of inactivity
    return () => clearTimeout(timer);
  }, [isConfirming]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    if (isConfirming) {
      onConfirm();
      setIsConfirming(false);
    } else {
      setIsConfirming(true);
    }
  };

  const displayText = isConfirming
    ? confirmText || `Confirm ${actionText}?`
    : actionText;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={handleClick}
      className={`transition-all active:scale-[0.98] focus-ring cursor-pointer select-none ${
        isConfirming
          ? "bg-amber-500/20 border border-amber-500/40 text-amber-400 font-bold"
          : className
      }`}
      data-testid="inline-confirm-btn"
    >
      {displayText}
    </button>
  );
}
