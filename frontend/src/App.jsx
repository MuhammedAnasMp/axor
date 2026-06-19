import React from 'react';
import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom';
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


function ERPLayout() {
  return (
    <div className="flex flex-col md:flex-row h-screen w-screen overflow-hidden bg-surface">
      {/* Collapsible Sidebar / Responsive Navigation Layout */}
      <Sidebar />

      {/* Main Fluid Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Desktop-only Top Header */}
        <header className="hidden md:flex h-16 items-center justify-between px-6 bg-white border-b border-surface-low shadow-sm">
          <span className="text-xs font-semibold text-text-secondary">Axon Management Platform</span>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-brand-blue bg-accent-blue/15 px-2.5 py-1 rounded-full">
              Operator Console
            </span>
          </div>
        </header>

        {/* Content Outlet */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-24 md:pb-8 bg-surface">
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
      {/* OTA Status Banners */}
      {status === 'downloading' && (
        <div className="fixed bottom-4 right-4 z-50 bg-white p-4 rounded-lg shadow-lg border border-surface-low max-w-sm">
          <p className="text-xs font-semibold text-text-primary">Downloading assets...</p>
          <div className="w-full bg-surface-low h-2 rounded-full mt-2 overflow-hidden">
            <div 
              className="bg-brand-blue h-full transition-all duration-300" 
              style={{ width: `${downloadProgress}%` }}
            ></div>
          </div>
          <span className="text-[10px] text-text-secondary mt-1 block">{downloadProgress}% completed</span>
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
              This version of the app requires native components that are not present in your current installation.
            </p>
            <a 
              href={updateInfo?.download_url}
              className="mt-4 block text-center bg-brand-blue text-white text-xs py-2 rounded font-medium shadow cursor-pointer"
            >
              Download APK Installer (.apk)
            </a>
          </div>
        </div>
      )}

      <BrowserRouter>
        <Routes>
          {/* Landing Page (E-Commerce Coming Soon) */}
          <Route path="/" element={<ComingSoon />} />

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

          {/* Catch-all Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}
