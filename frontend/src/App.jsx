import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Outlet, Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from './utils/api';
import Protected from './components/Protected';
import Sidebar from './components/Sidebar';
import ComingSoon from './pages/ComingSoon';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Stock from './pages/Stock';
import Suppliers from './pages/Suppliers';
import Customers from './pages/Customers';
import Purchases from './pages/Purchases';
import MoneyAccounts from './pages/MoneyAccounts';
import Expenses from './pages/Expenses';
import Employees from './pages/Employees';
import VisualReports from './pages/VisualReports';
import Sales from './pages/Sales';
import POS from './pages/POS';
import { useOTAUpdate } from './utils/useOTAUpdate';
import IOSInstallPrompt from './components/iOSInstallPrompt';


const LAST_PAGE_KEY = 'axon_last_page';

// Saves the current route to localStorage whenever user navigates within /erp or /pos
function LastPageTracker() {
  const location = useLocation();
  useEffect(() => {
    const path = location.pathname + location.search;
    if (path.startsWith('/erp') || path.startsWith('/pos')) {
      localStorage.setItem(LAST_PAGE_KEY, path);
    }
  }, [location]);
  return null;
}

// On root "/", redirect authenticated users to their last visited page
function RootRedirect() {
  const { data: user, isLoading } = useQuery({
    queryKey: ['authUser'],
    queryFn: () => api.auth.me(),
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-surface">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-blue border-t-transparent"></div>
      </div>
    );
  }

  if (user) {
    const lastPage = localStorage.getItem(LAST_PAGE_KEY);
    if (lastPage && (lastPage.startsWith('/erp') || lastPage.startsWith('/pos'))) {
      return <Navigate to={lastPage} replace />;
    }
    return <Navigate to="/erp" replace />;
  }

  return <ComingSoon />;
}

function ERPLayout() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams("all");
  const showPeriodSelect = location.pathname === '/erp' || location.pathname === '/erp/';
  const period = searchParams.get('period') || 'today';

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen overflow-hidden bg-surface">
      {/* Collapsible Sidebar / Responsive Navigation Layout */}
      <Sidebar />

      {/* Main Fluid Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Desktop-only Top Header */}
        <header className="hidden md:flex h-16 items-center justify-between px-6 bg-white border-b border-surface-low shadow-sm">
          <span className="text-xs font-semibold text-text-secondary">Axon Management Platform</span>
          <div className="flex items-center space-x-4">
            {showPeriodSelect && (
              <div className="flex items-center space-x-2">
                <label htmlFor="header-period-select" className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Period:</label>
                {!period.startsWith('custom_') ? (
                  <select
                    id="header-period-select"
                    value={period}
                    onChange={(e) => {
                      const val = e.target.value;
                      const nextParams = new URLSearchParams(searchParams);
                      if (val === 'custom') {
                        const todayStr = new Date().toISOString().split('T')[0];
                        nextParams.set('period', `custom_${todayStr}_${todayStr}`);
                      } else {
                        nextParams.set('period', val);
                      }
                      setSearchParams(nextParams);
                    }}
                    className="rounded border border-surface-dim bg-white px-2.5 py-1 text-xs font-semibold text-text-primary outline-none focus:border-brand-blue shadow-xs cursor-pointer"
                  >
                    <option value="today">Today</option>
                    <option value="yesterday">Yesterday</option>
                    <option value="this_week">This Week</option>
                    <option value="this_month">This Month</option>
                    <option value="last_30_days">Last 30 Days</option>
                    <option value="all">All Time</option>
                    <option value="custom">Custom Range...</option>
                  </select>
                ) : (() => {
                  const parts = period.split('_');
                  const startDate = parts[1] || '';
                  const endDate = parts[2] || '';
                  return (
                    <div className="flex items-center space-x-1.5 animate-in fade-in duration-150">
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => {
                          const nextParams = new URLSearchParams(searchParams);
                          nextParams.set('period', `custom_${e.target.value}_${endDate}`);
                          setSearchParams(nextParams);
                        }}
                        className="rounded border border-surface-dim bg-white px-2 py-1 text-xs text-text-primary outline-none focus:border-brand-blue"
                      />
                      <span className="text-xs text-text-secondary">to</span>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => {
                          const nextParams = new URLSearchParams(searchParams);
                          nextParams.set('period', `custom_${startDate}_${e.target.value}`);
                          setSearchParams(nextParams);
                        }}
                        className="rounded border border-surface-dim bg-white px-2 py-1 text-xs text-text-primary outline-none focus:border-brand-blue"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const nextParams = new URLSearchParams(searchParams);
                          nextParams.set('period', 'today');
                          setSearchParams(nextParams);
                        }}
                        className="rounded-full hover:bg-surface-low p-1 text-text-secondary hover:text-text-primary transition-colors flex items-center justify-center"
                        title="Clear custom range"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  );
                })()}
              </div>
            )}
            <span className="text-xs font-bold text-brand-blue bg-accent-blue/15 px-2.5 py-1 rounded-full">
              {/* Operator Console */}
            </span>
          </div>
        </header>

        {/* Content Outlet */}
        <main className="flex-1 overflow-y-auto p-2.5 sm:p-4 md:p-6 lg:p-8 pb-24 md:pb-8 bg-surface">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const { status, downloadProgress, updateInfo, applyUpdate } = useOTAUpdate();

  return (
    <>
      {/* iOS PWA Installation Guide */}
      <IOSInstallPrompt />

      {/* OTA Status Banners */}
      {status === 'checking' && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-brand-blue text-white text-[10px] py-1 px-4 flex items-center justify-between font-semibold shadow-inner">
          <span className="flex items-center space-x-2">
            <svg className="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Checking for new UI update...</span>
          </span>
        </div>
      )}

      {status === 'downloading' && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-brand-blue text-white text-[10px] py-1.5 px-4 flex items-center justify-between font-semibold shadow-inner">
          <span>Downloading new UI assets...</span>
          <span>{downloadProgress}% completed</span>
          <div className="absolute top-0 left-0 h-[2px] bg-white transition-all duration-300" style={{ width: `${downloadProgress}%` }}></div>
        </div>
      )}

      {status === 'waiting-for-ui' && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-amber-500 text-white text-[10px] py-1 px-4 text-center font-bold tracking-wide shadow-inner">
          ⚠️ Waiting for new UI update...
        </div>
      )}

      {status === 'ready-to-reload' && (
        <div className="fixed bottom-4 right-4 z-50 bg-white p-4 rounded-lg shadow-lg border border-primary-container max-w-sm animate-bounce">
          <p className="text-xs font-bold text-brand-blue">Update Ready!</p>
          <p className="text-[11px] text-text-secondary mt-1">
            Version {updateInfo?.version} was downloaded. Apply to reload the system.
          </p>
          <button
            onClick={applyUpdate}
            className="mt-3 bg-brand-blue text-white text-xs px-3 py-1.5 rounded font-medium shadow hover:bg-brand-blue/90 cursor-pointer"
          >
            Restart Application
          </button>
        </div>
      )}

      {status === 'reinstall-required' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-lg max-w-md w-full shadow-2xl mx-4">
            <h3 className="text-base font-bold text-error">Critical Update Required</h3>
            <p className="text-xs text-text-secondary mt-2">
              {window.electronAPI
                ? "This version of the app requires a new desktop installer to be downloaded and installed."
                : "This version of the app requires native wrapper components that are not present in your current installation."}
            </p>
            <a
              href={updateInfo?.download_url}
              className="mt-4 block text-center bg-brand-blue text-white text-xs py-2 rounded font-medium shadow cursor-pointer"
            >
              {window.electronAPI ? "Download Windows Installer (.exe)" : "Download APK Installer (.apk)"}
            </a>
          </div>
        </div>
      )}

      <BrowserRouter>
        <LastPageTracker />
        <Routes>
          {/* Landing Page — redirects to last page if authenticated */}
          <Route path="/" element={<RootRedirect />} />

          {/* Authentication */}
          <Route path="/login" element={<Auth />} />

          {/* Mobile POS System */}
          <Route
            path="/pos"
            element={
              <Protected>
                <POS />
              </Protected>
            }
          />

          {/* ERP System Routing */}
          <Route
            path="/erp"
            element={
              <Protected>
                <ERPLayout />
              </Protected>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="products" element={<Products />} />
            <Route path="stock" element={<Stock />} />
            <Route path="suppliers" element={<Suppliers />} />
            <Route path="customers" element={<Customers />} />
            <Route path="purchases" element={<Purchases />} />
            <Route path="accounts" element={<MoneyAccounts />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="employees" element={<Employees />} />
            <Route path="reports" element={<VisualReports />} />
            <Route path="sales" element={<Sales />} />
          </Route>

          {/* Ping endpoint fallback */}
          <Route path="/ping" element={<PingPage />} />

          {/* Catch-all Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

function PingPage() {
  React.useEffect(() => {
    document.body.innerText = JSON.stringify({ ping: "test ok" }, null, 2);
    document.body.style.fontFamily = "monospace";
    document.body.style.whiteSpace = "pre";
    document.body.style.backgroundColor = "#ffffff";
    document.body.style.color = "#000000";
    document.body.style.padding = "20px";
  }, []);
  return null;
}
