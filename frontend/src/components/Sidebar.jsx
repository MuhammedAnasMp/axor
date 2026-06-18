import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [openTab, setOpenTab] = useState(null);
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

  const handleTabClick = (item) => {
    if (collapsed) {
      setCollapsed(false);
    }
    if (item.subItems) {
      setOpenTab(openTab === item.id ? null : item.id);
    } else {
      setOpenTab(null);
      navigate(item.path);
    }
  };

  const isActive = (path) => {
    return location.pathname === path || (path !== '/erp' && location.pathname.startsWith(path));
  };

  return (
    <div 
      className={`flex flex-col border-r border-surface-dim bg-white text-text-primary transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
      style={{ boxShadow: '0px 1px 3px rgba(0,0,0,0.1)' }}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-surface-low">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-brand-blue text-white font-bold">
              A
            </div>
            <span className="font-semibold text-lg tracking-tight">Axon ERP</span>
          </div>
        )}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="rounded p-1 text-text-secondary hover:bg-surface-low hover:text-text-primary transition"
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
                onClick={() => handleTabClick(item)}
                className={`flex w-full items-center justify-between rounded px-3 py-2 text-sm font-medium transition ${
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
          className="flex w-full items-center space-x-3 rounded px-3 py-2 text-sm font-medium text-error hover:bg-error/10 transition"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
}
