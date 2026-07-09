"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

export default function BottomSheet({
  isOpen,
  onClose,
  children,
  title,
}: BottomSheetProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" data-testid="bottom-sheet-overlay">
          {/* Backdrop overlay with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            data-testid="bottom-sheet-backdrop"
          />

          {/* Bottom Sheet Card */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0.1, bottom: 0.8 }}
            onDragEnd={(event, info) => {
              if (info.velocity.y > 100 || info.offset.y > 150) {
                onClose();
              }
            }}
            className="relative w-full max-w-[420px] bg-space-800 border-t border-space-700/60 rounded-t-2xl px-6 pb-[calc(2rem+var(--sab))] pt-3 z-10 max-h-[80vh] flex flex-col focus-ring"
            data-testid="bottom-sheet-container"
          >
            {/* Drag handle bar at top */}
            <div className="flex justify-center py-2 cursor-grab active:cursor-grabbing" data-testid="bottom-sheet-drag-handle">
              <div className="w-10 h-1 bg-slate-500/40 rounded-full" />
            </div>

            {title && (
              <h3 className="text-lg font-display font-semibold text-slate-100 mb-4 text-center">
                {title}
              </h3>
            )}

            <div className="overflow-y-auto flex-1 min-h-0 pr-1">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
