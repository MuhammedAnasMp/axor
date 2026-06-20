import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../utils/api';

const CURRENT_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0';

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [openTab, setOpenTab] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    api.auth.logout()
      .then(() => navigate('/login'))
      .catch((err) => alert(err.message));
  };

  const navItems = [
    {
      id: 1,
      title: 'Dashboard',
      path: '/erp',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      id: 2,
      title: 'Products',
      path: '/erp/products',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      subItems: [
        { title: 'Product List', path: '/erp/products' },
        { title: 'Categories', path: '/erp/products?tab=categories' },
        { title: 'Brands', path: '/erp/products?tab=brands' }
      ]
    },
    {
      id: 3,
      title: 'Stock (Inventory)',
      path: '/erp/stock',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      subItems: [
        { title: 'Current Stock', path: '/erp/stock' },
        { title: 'Stock History', path: '/erp/stock?tab=history' },
        { title: 'Damaged Items', path: '/erp/stock?tab=damaged' }
      ]
    },
    {
      id: 4,
      title: 'Suppliers',
      path: '/erp/suppliers',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    {
      id: 5,
      title: 'Customers',
      path: '/erp/customers',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
    {
      id: 6,
      title: 'Purchases',
      path: '/erp/purchases',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
      subItems: [
        { title: 'Create Purchase', path: '/erp/purchases' },
        { title: 'Purchase History', path: '/erp/purchases?tab=history' },
        { title: 'Receive Products', path: '/erp/purchases?tab=receive' }
      ]
    },
    {
      id: 7,
      title: 'Money & Accounts',
      path: '/erp/accounts',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      subItems: [
        { title: 'Cash & Banks', path: '/erp/accounts' },
        { title: 'Money Transfers', path: '/erp/accounts?tab=transfers' }
      ]
    },
    {
      id: 8,
      title: 'Expense & Income',
      path: '/erp/expenses',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l2-2 4 4m0-7l-3-3-3 3M3 12h18" />
        </svg>
      ),
      subItems: [
        { title: 'Add Expense', path: '/erp/expenses' },
        { title: 'Expense History', path: '/erp/expenses?tab=history' },
        { title: 'Add Income', path: '/erp/expenses?tab=income' },
        { title: 'Income History', path: '/erp/expenses?tab=income-history' }
      ]
    },
    {
      id: 9,
      title: 'Employees',
      path: '/erp/employees',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    },
    {
      id: 10,
      title: 'Visual Reports',
      path: '/erp/reports',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h2a2 2 0 002-2zm12 0a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v13a2 2 0 002 2h2zm-4 0V4a2 2 0 00-2-2h-2a2 2 0 00-2 2v15a2 2 0 002 2h2a2 2 0 002-2z" />
        </svg>
      )
    },
    {
      id: 11,
      title: 'Sales',
      path: '/erp/sales',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      subItems: [
        { title: 'Create Invoice', path: '/erp/sales' },
        { title: 'Sales History', path: '/erp/sales?tab=history' },
        { title: 'Customer Payments', path: '/erp/sales?tab=payments' }
      ]
    }
  ];

  const handleTabClick = (item, isMobile = false) => {
    if (collapsed && !isMobile) {
      setCollapsed(false);
    }
    if (item.subItems) {
      setOpenTab(openTab === item.id ? null : item.id);
    } else {
      setOpenTab(null);
      if (isMobile) setDrawerOpen(false);
      navigate(item.path);
    }
  };

  const isActive = (path) => {
    return location.pathname === path || (path !== '/erp' && location.pathname.startsWith(path));
  };

  // Screen Title for Mobile App Bar
  const getScreenTitle = () => {
    const path = location.pathname;
    if (path === '/erp' || path === '/erp/') return 'Dashboard';
    if (path.startsWith('/erp/products')) return 'Products Catalog';
    if (path.startsWith('/erp/stock')) return 'Stock & Inventory';
    if (path.startsWith('/erp/suppliers')) return 'Suppliers Ledger';
    if (path.startsWith('/erp/customers')) return 'Customers Ledger';
    if (path.startsWith('/erp/purchases')) return 'Purchase Orders';
    if (path.startsWith('/erp/accounts')) return 'Cash & Bank';
    if (path.startsWith('/erp/expenses')) return 'Expense & Income';
    if (path.startsWith('/erp/employees')) return 'Employee Directory';
    if (path.startsWith('/erp/reports')) return 'Visual Reports';
    if (path.startsWith('/erp/sales')) return 'Sales Billing';
    return 'Axon Console';
  };

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. DESKTOP SIDEBAR                                                        */}
      {/* ========================================================================= */}
      <div 
        className={`hidden md:flex flex-col border-r border-surface-dim bg-white text-text-primary transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-64'
        }`}
        style={{ boxShadow: '0px 1px 3px rgba(0,0,0,0.1)' }}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-surface-low">
          {!collapsed && (
            <div className="flex items-center space-x-2">
              <img src="/icon_for_website-removebg-preview_no_border.png" alt="Axon Logo" className="h-8 w-8 object-contain" />
              <span className="font-semibold text-lg tracking-tight">Axon ERP</span>
            </div>
          )}
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="rounded p-1 text-text-secondary hover:bg-surface-low hover:text-text-primary transition cursor-pointer"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {collapsed ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7M19 19l-7-7 7-7" />
              )}
            </svg>
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto py-4 space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.path);
            const hasSub = !!item.subItems;
            const open = openTab === item.id;

            return (
              <div key={item.id} className="px-2">
                <button
                  onClick={() => handleTabClick(item, false)}
                  className={`flex w-full items-center justify-between rounded px-3 py-2 text-sm font-medium transition cursor-pointer ${
                    active 
                      ? 'bg-accent-blue/15 text-brand-blue' 
                      : 'text-text-secondary hover:bg-surface-low hover:text-text-primary'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className={`${active ? 'text-brand-blue' : 'text-text-secondary'}`}>
                      {item.icon}
                    </span>
                    {!collapsed && (
                      <span className="truncate">
                        {item.id}. {item.title}
                      </span>
                    )}
                  </div>
                  {!collapsed && hasSub && (
                    <svg 
                      className={`h-4 w-4 transform transition-transform ${open ? 'rotate-180' : ''}`}
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </button>

                {/* Second-level Accordion Navigation */}
                {!collapsed && hasSub && open && (
                  <div className="mt-1 ml-6 pl-3 border-l border-surface-dim space-y-1">
                    {item.subItems.map((sub, sIdx) => {
                      const subActive = location.pathname + location.search === sub.path;
                      return (
                        <Link
                          key={sIdx}
                          to={sub.path}
                          className={`block rounded px-3 py-1.5 text-xs font-medium transition ${
                            subActive
                              ? 'text-brand-blue bg-accent-blue/5'
                              : 'text-text-secondary hover:text-text-primary hover:bg-surface-low'
                          }`}
                        >
                          {sub.title}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* POS System shortcut & Logout */}
        <div className="p-2 border-t border-surface-low space-y-1">
          <Link
            to="/pos"
            className="flex w-full items-center space-x-3 rounded px-3 py-2 text-sm font-medium text-tertiary-container hover:bg-tertiary-container/10 transition"
          >
            <svg className="h-5 w-5 text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            {!collapsed && <span>Go to Mobile POS</span>}
          </Link>
          <button
            onClick={handleLogout}
            className="flex w-full items-center space-x-3 rounded px-3 py-2 text-sm font-medium text-error hover:bg-error/10 transition cursor-pointer"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {!collapsed && <span>Logout</span>}
          </button>
          <div className="text-center pt-2 pb-1 border-t border-surface-low/55 mt-2">
            <span className="text-[10px] text-text-secondary font-semibold">
              {collapsed ? `v${CURRENT_VERSION}` : `App Version: v${CURRENT_VERSION}`}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MOBILE TOP APP BAR                                                     */}
      {/* ========================================================================= */}
      <header className="md:hidden sticky top-0 left-0 right-0 z-35 bg-white border-b border-surface-low shadow-sm safe-pt">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setDrawerOpen(true)}
              className="rounded-full p-2 text-text-secondary hover:bg-surface-low active:bg-surface-high transition-colors cursor-pointer"
              aria-label="Open navigation drawer"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-base font-bold tracking-tight text-text-primary">
              {getScreenTitle()}
            </h1>
          </div>
          
          {/* Operator Badge on Right */}
          <div className="flex items-center">
            <span className="text-[10px] font-bold text-brand-blue bg-accent-blue/10 px-2 py-0.5 rounded-full">
              Console
            </span>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 3. MOBILE BOTTOM NAVIGATION BAR                                           */}
      {/* ========================================================================= */}
      <nav 
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-surface-low safe-pb"
        style={{ boxShadow: '0px -2px 10px rgba(0,0,0,0.06)' }}
      >
        <div className="flex justify-around items-center h-16">
          {/* Dashboard Tab */}
          <Link 
            to="/erp"
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
              location.pathname === '/erp' ? 'text-brand-blue' : 'text-text-secondary'
            }`}
          >
            <div className={`flex items-center justify-center rounded-2xl px-4 py-1 mb-0.5 transition-colors ${
              location.pathname === '/erp' ? 'bg-accent-blue/15' : 'bg-transparent'
            }`}>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <span className="text-[9px] font-bold tracking-tight">Home</span>
          </Link>

          {/* Products Tab */}
          <Link 
            to="/erp/products"
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
              location.pathname.startsWith('/erp/products') ? 'text-brand-blue' : 'text-text-secondary'
            }`}
          >
            <div className={`flex items-center justify-center rounded-2xl px-4 py-1 mb-0.5 transition-colors ${
              location.pathname.startsWith('/erp/products') ? 'bg-accent-blue/15' : 'bg-transparent'
            }`}>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <span className="text-[9px] font-bold tracking-tight">Products</span>
          </Link>

          {/* POS Tab (Signature Action Button in center) */}
          <Link 
            to="/pos"
            className="flex flex-col items-center justify-center flex-1 py-1 text-tertiary"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-tertiary-container/10 text-tertiary hover:bg-tertiary-container/20 transition-colors shadow-sm">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-[9px] font-bold tracking-tight mt-0.5">POS</span>
          </Link>

          {/* Sales/Billing Tab */}
          <Link 
            to="/erp/sales"
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
              location.pathname.startsWith('/erp/sales') ? 'text-brand-blue' : 'text-text-secondary'
            }`}
          >
            <div className={`flex items-center justify-center rounded-2xl px-4 py-1 mb-0.5 transition-colors ${
              location.pathname.startsWith('/erp/sales') ? 'bg-accent-blue/15' : 'bg-transparent'
            }`}>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
              </svg>
            </div>
            <span className="text-[9px] font-bold tracking-tight">Sales</span>
          </Link>

          {/* Menu Toggle Tab */}
          <button 
            onClick={() => setDrawerOpen(true)}
            className="flex flex-col items-center justify-center flex-1 py-1 text-text-secondary cursor-pointer"
          >
            <div className="flex items-center justify-center rounded-2xl px-4 py-1 mb-0.5 bg-transparent">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </div>
            <span className="text-[9px] font-bold tracking-tight">More</span>
          </button>
        </div>
      </nav>

      {/* ========================================================================= */}
      {/* 4. MOBILE SLIDING DRAWER                                                 */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="md:hidden fixed inset-0 z-[990] bg-black/45 backdrop-blur-xs"
            />

            {/* Left drawer panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 27, stiffness: 240 }}
              className="md:hidden fixed top-0 bottom-0 left-0 z-[1000] w-72 bg-white flex flex-col shadow-2xl safe-pt safe-pb h-full"
            >
              {/* Drawer Brand Header */}
              <div className="flex h-20 items-center justify-between px-5 border-b border-surface-low bg-surface-low/50">
                <div className="flex items-center space-x-3">
                  <img src="/icon_for_website-removebg-preview_no_border.png" alt="Axon Logo" className="h-10 w-10 object-contain filter drop-shadow-sm" />
                  <div>
                    <span className="font-extrabold text-base tracking-tight text-text-primary">Axon Business</span>
                    <span className="block text-[10px] font-semibold text-text-secondary">Enterprise Resource Console</span>
                  </div>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="rounded-full p-1.5 text-text-secondary hover:bg-surface-low cursor-pointer"
                  aria-label="Close drawer"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Scrollable Navigation List */}
              <div className="flex-1 overflow-y-auto py-4 px-2 space-y-1 no-scrollbar">
                {navItems.map((item) => {
                  const active = isActive(item.path);
                  const hasSub = !!item.subItems;
                  const open = openTab === item.id;

                  return (
                    <div key={item.id}>
                      <button
                        onClick={() => handleTabClick(item, true)}
                        className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition cursor-pointer ${
                          active 
                            ? 'bg-accent-blue/15 text-brand-blue' 
                            : 'text-text-secondary hover:bg-surface-low active:bg-surface-low'
                        }`}
                      >
                        <div className="flex items-center space-x-3.5">
                          <span className={active ? 'text-brand-blue' : 'text-text-secondary'}>
                            {item.icon}
                          </span>
                          <span>{item.title}</span>
                        </div>
                        {hasSub && (
                          <svg 
                            className={`h-4 w-4 transform transition-transform ${open ? 'rotate-180' : ''}`}
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        )}
                      </button>

                      {/* Accordion sub-items (mobile) */}
                      {hasSub && open && (
                        <div className="mt-1 ml-6 pl-4 border-l-2 border-surface-dim space-y-1.5 py-1">
                          {item.subItems.map((sub, sIdx) => {
                            const subActive = location.pathname + location.search === sub.path;
                            return (
                              <Link
                                key={sIdx}
                                to={sub.path}
                                onClick={() => setDrawerOpen(false)}
                                className={`block rounded-lg px-3 py-2 text-xs font-bold transition ${
                                  subActive
                                    ? 'text-brand-blue bg-accent-blue/5'
                                    : 'text-text-secondary hover:text-text-primary active:bg-surface-low'
                                }`}
                              >
                                {sub.title}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Mobile Drawer Footer Actions */}
              <div className="p-4 border-t border-surface-low bg-surface-low/30 space-y-2">
                <Link
                  to="/pos"
                  onClick={() => setDrawerOpen(false)}
                  className="flex w-full items-center justify-center space-x-2 rounded-xl bg-tertiary-container/10 py-3 text-sm font-bold text-tertiary hover:bg-tertiary-container/20 transition-colors"
                >
                  <svg className="h-5 w-5 text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span>Go to POS Terminal</span>
                </Link>
                <button
                  onClick={() => {
                    setDrawerOpen(false);
                    handleLogout();
                  }}
                  className="flex w-full items-center justify-center space-x-2 rounded-xl bg-error/10 py-3 text-sm font-bold text-error hover:bg-error/20 transition-colors cursor-pointer"
                >
                  <svg className="h-5 w-5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Log Out Securely</span>
                </button>
                <div className="text-center pt-3 border-t border-surface-low/55 mt-2">
                  <span className="text-[10px] text-text-secondary font-semibold">
                    App Version: v{CURRENT_VERSION}
                  </span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
