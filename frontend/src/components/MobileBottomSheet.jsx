import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MobileBottomSheet({ isOpen, onClose, title, children }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="md:hidden fixed inset-0 z-50 bg-black/45 backdrop-blur-xs" style={{}}
          />

          {/* Bottom Sheet Container */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex max-h-[85vh] flex-col rounded-t-3xl bg-white shadow-2xl border-t border-surface-low overflow-hidden safe-pb mb-0"
          >
            {/* Drag Handle Area */}
            <div className="relative flex items-center justify-center p-6 border-b border-surface-low cursor-grab active:cursor-grabbing">
              <div className="my-1 h-1.5 w-12 rounded-full bg-surface-highest" />
              {title && (
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-sm font-bold text-text-primary">
                  {title}
                </span>
              )}
              <button
                onClick={onClose}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full text-text-secondary hover:bg-surface-low"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
