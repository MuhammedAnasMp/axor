import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function ComingSoon() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-6 text-center">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md rounded-2xl bg-white p-8 shadow-md"
        style={{ boxShadow: '0px 1px 3px rgba(0,0,0,0.1)' }}
      >
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-accent-blue/15 text-brand-blue">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>

        <h1 className="mb-2 text-3xl font-semibold tracking-tight text-text-primary">
          Axor E-Commerce Hub
        </h1>
        <p className="mb-6 text-sm text-text-secondary">
          xx  Our online storefront is under construction. Exciting updates are on the way!
        </p>

        <div className="inline-flex rounded-full bg-accent-blue/20 px-3 py-1 text-xs font-semibold text-brand-blue">
          Coming Soon
        </div>

        <div className="mt-8 border-t border-surface-low pt-6 space-y-3">
          <Link
            to="/erp"
            className="block w-full rounded bg-brand-blue py-2.5 text-sm font-medium text-white hover:bg-brand-cobalt transition"
          >
            Launch ERP Dashboard
          </Link>
          <Link
            to="/pos"
            className="block w-full rounded border border-brand-blue py-2.5 text-sm font-medium text-brand-blue hover:bg-accent-blue/10 transition"
          >
            Open POS Terminal
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
