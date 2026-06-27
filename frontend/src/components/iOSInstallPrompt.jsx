import React, { useState, useEffect } from 'react';
import { FiShare, FiPlusSquare, FiX } from 'react-icons/fi';

export default function iOSInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // 1. Detect if iOS (iPhone, iPad, iPod) or iPadOS pretending to be Mac
    const isIOS = 
      /iPad|iPhone|iPod/.test(navigator.userAgent) || 
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    // 2. Check if running in standalone mode (already installed)
    const isStandalone = 
      ('standalone' in window.navigator && window.navigator.standalone) || 
      window.matchMedia('(display-mode: standalone)').matches;

    // 3. Check if user dismissed prompt in this session
    const isDismissed = sessionStorage.getItem('ios-pwa-dismissed') === 'true';

    // 4. Do not show on Electron or Capacitor native app shells
    const isNativeShell = !!window.electronAPI || (window.Capacitor && window.Capacitor.isNativePlatform());

    if (isIOS && !isStandalone && !isDismissed && !isNativeShell) {
      // Delay slightly for better UX feel on startup
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem('ios-pwa-dismissed', 'true');
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] p-4 safe-pb flex justify-center animate-slide-up">
      {/* Background overlay with blur */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={handleDismiss} />

      {/* Main card */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-surface-low overflow-hidden flex flex-col p-6 animate-scale-up z-10">
        
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <img 
              src="/apple-touch-icon.png" 
              alt="Axon Icon" 
              className="w-12 h-12 rounded-xl shadow-md object-cover border border-surface-low"
            />
            <div>
              <h3 className="text-sm font-bold text-text-primary">Install Axon App</h3>
              <p className="text-[10px] text-text-secondary">Install on your iPhone or iPad for a native app experience.</p>
            </div>
          </div>
          <button 
            onClick={handleDismiss} 
            className="p-1 rounded-full text-text-secondary hover:bg-surface-low transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Steps */}
        <div className="space-y-3.5 my-2">
          <div className="flex items-center space-x-3 bg-surface-low/50 p-2.5 rounded-xl border border-surface-low/30">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white shadow-sm border border-surface-low">
              <FiShare className="w-4 h-4 text-brand-blue" />
            </div>
            <p className="text-xs text-text-primary">
              1. Tap the <span className="font-semibold">Share</span> button in Safari's bottom or top navigation bar.
            </p>
          </div>

          <div className="flex items-center space-x-3 bg-surface-low/50 p-2.5 rounded-xl border border-surface-low/30">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white shadow-sm border border-surface-low">
              <FiPlusSquare className="w-4 h-4 text-brand-blue" />
            </div>
            <p className="text-xs text-text-primary">
              2. Scroll down and tap <span className="font-semibold">Add to Home Screen</span>.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleDismiss}
          className="mt-4 bg-brand-blue text-white text-xs font-semibold py-2.5 px-4 rounded-xl shadow-lg hover:bg-brand-blue/90 active:scale-[0.98] transition-all cursor-pointer text-center"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
