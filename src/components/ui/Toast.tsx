"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, XCircle, AlertCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
  duration?: number;
}

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

export function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  const duration = toast.duration || 4000;
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (elapsed >= duration) {
        clearInterval(interval);
        onDismiss(toast.id);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [toast.id, duration, onDismiss]);

  const getColors = () => {
    switch (toast.type) {
      case "success":
        return {
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />,
          border: "border-teal-500/20 shadow-teal-500/5",
          bg: "bg-slate-800/95",
          progressBg: "bg-teal-400",
        };
      case "error":
        return {
          icon: <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />,
          border: "border-red-500/20 shadow-red-500/5",
          bg: "bg-slate-800/95",
          progressBg: "bg-red-400",
        };
      default:
        return {
          icon: <AlertCircle className="w-3.5 h-3.5 text-primary-indigo shrink-0" />,
          border: "border-primary-indigo/20 shadow-primary-indigo/5",
          bg: "bg-slate-800/95",
          progressBg: "bg-primary-indigo",
        };
    }
  };

  const colors = getColors();

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -15, scale: 0.95 }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 60 }}
      onDragEnd={(e, info) => {
        if (info.offset.y > 40) {
          onDismiss(toast.id);
        }
      }}
      className={`w-full max-w-[300px] p-3 rounded-xl border shadow-lg backdrop-blur-md relative overflow-hidden pointer-events-auto flex flex-col gap-2 ${colors.bg} ${colors.border} focus-ring`}
      data-testid={`toast-item-${toast.id}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {colors.icon}
          <span className="text-[10px] font-semibold text-slate-100 leading-snug">
            {toast.message}
          </span>
        </div>
        <button
          onClick={() => onDismiss(toast.id)}
          className="text-slate-400 hover:text-slate-200 focus-ring rounded p-0.5 shrink-0 cursor-pointer"
          aria-label="Dismiss toast"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      
      {/* Progress Bar timer */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-slate-700/50">
        <div
          className={`h-full ${colors.progressBg} transition-all duration-300 ease-out`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </motion.div>
  );
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  // Max 2 visible, new toasts replace oldest
  const visibleToasts = toasts.slice(-2);

  return (
    <div
      className="absolute bottom-[calc(5.5rem+var(--sab))] left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-1.5 pointer-events-none w-full max-w-[320px] px-4"
      data-testid="toast-container"
    >
      <AnimatePresence mode="popLayout">
        {visibleToasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}
