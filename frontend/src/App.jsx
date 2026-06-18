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

function ERPLayout() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-surface">
      {/* Collapsible Sidebar */}
      <Sidebar />

      {/* Main Fluid Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex h-16 items-center justify-between px-6 bg-white border-b border-surface-low shadow-sm">
          <span className="text-xs font-semibold text-text-secondary">Axon Management Platform</span>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-brand-blue bg-accent-blue/15 px-2.5 py-1 rounded-full">
              Operator Console
            </span>
          </div>
        </header>

        {/* Content Outlet */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-surface">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
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
  );
}
