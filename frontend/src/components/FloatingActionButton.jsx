import React, { useRef } from 'react';
import { motion } from 'framer-motion';

export default function FloatingActionButton({
  onClick,
  icon,
  label = 'Add',
}) {
  const isDragging = useRef(false);

  return (
    <motion.button
      drag="y"
      dragMomentum={false}
      dragElastic={0.2}
      dragConstraints={{ top: -500, bottom: 0 }}
      onDragStart={() => (isDragging.current = true)}
      onDragEnd={() => {
        setTimeout(() => {
          isDragging.current = false;
        }, 50);
      }}
      onClick={(e) => {
        if (isDragging.current) {
          e.preventDefault();
          return;
        }
        onClick?.();
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      whileTap={{ scale: 0.9 }}
      className="md:hidden fixed right-6 z-45 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-blue text-white shadow-xl hover:bg-brand-cobalt transition-colors focus:outline-none"
      aria-label={label}
      style={{
        boxShadow: '0px 6px 16px rgba(26, 115, 232, 0.35)',
        bottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))',
      }}
    >
      {icon || (
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M12 4v16m8-8H4"
          />
        </svg>
      )}
    </motion.button>
  );
}