import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api, getBaseUrl } from '../utils/api';

const CURRENT_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0';

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [openTab, setOpenTab] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const handleFocusChange = () => {
      setTimeout(() => {
        const activeEl = document.activeElement;
        const isInput = activeEl && (
          activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.getAttribute('contenteditable') === 'true'
        );
        setIsKeyboardVisible(!!isInput);
      }, 50);
    };

    handleFocusChange();

    window.addEventListener('focus', handleFocusChange, true);
    window.addEventListener('blur', handleFocusChange, true);

    return () => {
      window.removeEventListener('focus', handleFocusChange, true);
      window.removeEventListener('blur', handleFocusChange, true);
    };
  }, []);

  useEffect(() => {
    api.auth.me()
      .then((user) => setCurrentUser(user))
      .catch((err) => console.error("Error fetching user profile:", err));
  }, []);

  const isDeveloper = currentUser && (
    currentUser.role === 'Owner' ||
    currentUser.user?.is_staff ||
    currentUser.user?.is_superuser ||
    currentUser.user?.username === 'admin'
  );

  const getAdminUrl = () => {
    const apiBase = getBaseUrl();
    const base = apiBase.replace(/\/api\/?$/, '');
    return `${base}/admin/`;
  };

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
        { title: 'Products', path: '/erp/products' },
        { title: 'Cost History', path: '/erp/products?tab=cost-history' },
        { title: 'Categories', path: '/erp/products?tab=categories' },
        { title: 'Brands', path: '/erp/products?tab=brands' },
        { title: 'Mobile Models', path: '/erp/products?tab=model' }
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
      ),
      subItems: [
        { title: 'Supplier', path: '/erp/suppliers' },
        { title: 'Mapping', path: '/erp/suppliers?tab=mappings' }
      ]
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
        { title: 'Receive Products', path: '/erp/purchases?tab=receive' },
        { title: 'Purchase History', path: '/erp/purchases?tab=history' }
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
      title: 'Income & Expense',
      path: '/erp/expenses',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l2-2 4 4m0-7l-3-3-3 3M3 12h18" />
        </svg>
      ),
      subItems: [
        { title: 'Incomes', path: '/erp/expenses?tab=income-history' },
        { title: 'Expenses', path: '/erp/expenses?tab=history' }
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

  if (isDeveloper) {
    navItems.push({
      id: 12,
      title: 'Developer',
      path: '#dev',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
      subItems: [
        { title: 'Ping Status', path: 'https://vcn2c24w.status.cron-job.org/', isExternal: true },
        { title: 'Admin', path: getAdminUrl(), isExternal: true }
      ]
    });
  }

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
    if (path.startsWith('/erp/products')) return 'Products';
    if (path.startsWith('/erp/stock')) return 'Stock & Inventory';
    if (path.startsWith('/erp/suppliers')) return 'Suppliers';
    if (path.startsWith('/erp/customers')) return 'Customers';
    if (path.startsWith('/erp/purchases')) return 'Purchase Orders';
    if (path.startsWith('/erp/accounts')) return 'Cash & Bank';
    if (path.startsWith('/erp/expenses')) return 'Income & Expense';
    if (path.startsWith('/erp/employees')) return 'Employee Directory';
    if (path.startsWith('/erp/reports')) return 'Visual Reports';
    if (path.startsWith('/erp/sales')) return 'Sales Billing';
    return 'Axon Console';
  };

  const getSelectedTabName = () => {
    const path = location.pathname;
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get('tab');

    if (path.startsWith('/erp/products')) {
      if (tab === 'cost-history') return 'Product Cost History';
      if (tab === 'categories') return 'Product Categories';
      if (tab === 'brands') return 'All Brands';
      if (tab === 'model') return 'Suitable Mobile Models';
      return 'Products';
    }
    if (path.startsWith('/erp/stock')) {
      if (tab === 'history') return 'Stock History Log';
      if (tab === 'damaged') return 'Damaged Items';
      return 'Current Stock';
    }
    if (path.startsWith('/erp/suppliers')) {
      if (tab === 'mappings') return 'Supplier Mapping';
      return 'All Suppliers';
    }
    if (path.startsWith('/erp/customers')) {
      return 'All Customers';
    }
    if (path.startsWith('/erp/purchases')) {
      if (tab === 'receive') return 'Receive PO';
      if (tab === 'history') return 'Purchase History';
      return 'New PO';
    }
    if (path.startsWith('/erp/accounts')) {
      if (tab === 'transfers') return 'Transfers Log';
      return 'Cash & Banks';
    }
    if (path.startsWith('/erp/expenses')) {
      if (tab === 'expense') return 'Expenses Log';
      if (tab === 'income-history') return 'Income History Log';
      if (tab === 'history') return 'Expenses History Log';
      if (tab === 'income') return 'Incomes Log';
      return 'Income & Expenses';
    }
    if (path.startsWith('/erp/sales')) {
      if (tab === 'history') return 'Sales History';
      if (tab === 'payments') return 'Customer Payments';
      return 'Create Invoice';
    }
    return '';
  };



  const getSubItemIcon = (title) => {
    if (title.includes('List') || title.includes('Directory') || title.includes('Current')) {
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      );
    }
    if (title.includes('Categories') || title.includes('Mappings') || title.includes('Transfers')) {
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      );
    }
    if (title.includes('Brands') || title.includes('Payments') || title.includes('Receive')) {
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M6 20h12a2 2 0 002-2V9a2 2 0 00-2-2h-1a2 2 0 00-2-2H9a2 2 0 00-2 2H6a2 2 0 00-2 2v9a2 2 0 002 2z" />
        </svg>
      );
    }
    if (title === 'Incomes') {
      return (
        <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      );
    }
    if (title === 'Expenses') {
      return (
        <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
        </svg>
      );
    }
    if (title.includes('History') || title.includes('Log')) {
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
    if (title.includes('Damaged') || title.includes('Expense')) {
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      );
    }
    if (title.includes('Models')) {
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    }
    if (title.includes('Invoice') || title.includes('Create') || title.includes('Add')) {
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      );
    }
    if (title === 'Supplier' || title === 'Suppliers') {
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      );
    }
    if (title === 'Customers') {
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    }
    if (title === 'Employees') {
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      );
    }
    if (title.includes('Reports')) {
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h2a2 2 0 002-2zm12 0a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v13a2 2 0 002 2h2zm-4 0V4a2 2 0 00-2-2h-2a2 2 0 00-2 2v15a2 2 0 002 2h2a2 2 0 002-2z" />
        </svg>
      );
    }
    return (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    );
  };

  const renderMobileBottomNav = () => {
    const isDashboard = location.pathname === '/erp' || location.pathname === '/erp/';

    if (isDashboard) {
      return (
        <div className="flex justify-around items-center h-16">
          <Link
            to="/erp"
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${location.pathname === '/erp' || location.pathname === '/erp/' ? 'text-brand-blue' : 'text-text-secondary'
              }`}
          >
            <div className={`flex items-center justify-center rounded-2xl px-4 py-1 mb-0.5 transition-colors ${location.pathname === '/erp' || location.pathname === '/erp/' ? 'bg-accent-blue/15 text-brand-blue' : 'bg-transparent text-text-secondary'
              }`}>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <span className="text-[9px] font-bold tracking-tight">Home</span>
          </Link>

          <Link
            to="/erp/products"
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${location.pathname.startsWith('/erp/products') ? 'text-brand-blue' : 'text-text-secondary'
              }`}
          >
            <div className={`flex items-center justify-center rounded-2xl px-4 py-1 mb-0.5 transition-colors ${location.pathname.startsWith('/erp/products') ? 'bg-accent-blue/15 text-brand-blue' : 'bg-transparent text-text-secondary'
              }`}>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <span className="text-[9px] font-bold tracking-tight">Products</span>
          </Link>

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

          <Link
            to="/erp/sales"
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${location.pathname.startsWith('/erp/sales') ? 'text-brand-blue' : 'text-text-secondary'
              }`}
          >
            <div className={`flex items-center justify-center rounded-2xl px-4 py-1 mb-0.5 transition-colors ${location.pathname.startsWith('/erp/sales') ? 'bg-accent-blue/15 text-brand-blue' : 'bg-transparent text-text-secondary'
              }`}>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
              </svg>
            </div>
            <span className="text-[9px] font-bold tracking-tight">Sales</span>
          </Link>

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
      );
    }

    const activeItem = navItems.find(item => item.path !== '/erp' && location.pathname.startsWith(item.path));
    const itemsToShow = activeItem?.subItems || (activeItem ? [{ title: activeItem.title, path: activeItem.path }] : []);
    const isEmployeesPage = location.pathname.startsWith('/erp/employees');

    return (
      <div className="flex justify-around items-center h-16">

        {itemsToShow.map((sub, idx) => {
          const isSubActive = location.pathname + location.search === sub.path ||
            (sub.path.includes('?') && (location.pathname + location.search).startsWith(sub.path)) ||
            (!sub.path.includes('?') && location.pathname === sub.path && !location.search);
          return (
            <Link
              key={idx}
              to={sub.path}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${isSubActive ? 'text-brand-blue' : 'text-text-secondary'
                }`}
            >
              <div className={`flex items-center justify-center rounded-2xl px-3 py-1 mb-0.5 transition-colors ${isSubActive ? 'bg-accent-blue/15 text-brand-blue' : 'bg-transparent text-text-secondary'
                }`}>
                {getSubItemIcon(sub.title)}
              </div>
              <span className="text-[9px] font-bold tracking-tight text-center max-w-[65px] truncate">
                {sub.title.replace('Product ', '').replace('Purchase ', '').replace('Expense ', '').replace('Income ', '')}
              </span>
            </Link>
          );
        })}

        {!isEmployeesPage && (
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
        )}
      </div>
    );
  };

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. DESKTOP SIDEBAR                                                        */}
      {/* ========================================================================= */}
      <div
        className={`hidden md:flex flex-col border-r border-surface-dim bg-white text-text-primary transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'
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
                  className={`flex w-full items-center justify-between rounded px-3 py-2 text-sm font-medium transition cursor-pointer ${active
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
                      if (sub.isExternal) {
                        return (
                          <a
                            key={sIdx}
                            href={sub.path}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block rounded px-3 py-1.5 text-xs font-medium transition text-text-secondary hover:text-text-primary hover:bg-surface-low"
                          >
                            {sub.title}
                          </a>
                        );
                      }
                      return (
                        <Link
                          key={sIdx}
                          to={sub.path}
                          className={`block rounded px-3 py-1.5 text-xs font-medium transition ${subActive
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
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
            <div className="flex flex-col">
              <h1 className="text-sm font-bold tracking-tight text-text-primary leading-tight">
                {getScreenTitle()}
              </h1>
              {getSelectedTabName() && (
                <span className="text-[10px] text-text-secondary font-medium leading-none mt-0.5">
                  {getSelectedTabName()}
                </span>
              )}
            </div>
          </div>

          {/* Operator Badge on Right */}
          <div className="flex items-center">
            <span className="text-[10px] font-bold text-brand-blue bg-accent-blue/10 px-2 py-0.5 rounded-full">
              {/* Console */}
            </span>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 3. MOBILE BOTTOM NAVIGATION BAR                                           */}
      {/* ========================================================================= */}
      {!location.pathname.startsWith('/erp/employees') && !isKeyboardVisible && (
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-surface-low safe-pb"
          style={{ boxShadow: '0px -2px 10px rgba(0,0,0,0.06)' }}
        >
          {renderMobileBottomNav()}
        </nav>
      )}

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
                    <span className="block text-[10px] font-semibold text-text-secondary">Enterprise Resource</span>
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
                      <div
                        className={`flex w-full items-center justify-between rounded-xl transition ${active
                          ? 'bg-accent-blue/15 text-brand-blue'
                          : 'text-text-secondary hover:bg-surface-low active:bg-surface-low'
                          }`}
                      >
                        <button
                          onClick={() => {
                            setDrawerOpen(false);
                            if (hasSub && item.subItems.length > 0) {
                              const firstSub = item.subItems[0];
                              if (firstSub.isExternal) {
                                window.open(firstSub.path, '_blank', 'noopener,noreferrer');
                              } else {
                                navigate(firstSub.path);
                              }
                            } else {
                              navigate(item.path);
                            }
                          }}
                          className="flex flex-1 items-center space-x-3.5 px-4 py-3 text-sm font-semibold transition cursor-pointer text-left"
                        >
                          <span className={active ? 'text-brand-blue' : 'text-text-secondary'}>
                            {item.icon}
                          </span>
                          <span>{item.title}</span>
                        </button>
                        {hasSub && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenTab(openTab === item.id ? null : item.id);
                            }}
                            className="p-3 hover:bg-black/5 active:bg-black/10 rounded-r-xl transition cursor-pointer"
                            aria-label={`Toggle ${item.title} sub-menu`}
                          >
                            <svg
                              className={`h-4 w-4 transform transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        )}
                      </div>

                      {/* Accordion sub-items (mobile) */}
                      {hasSub && open && (
                        <div className="mt-1 ml-6 pl-4 border-l-2 border-surface-dim space-y-1.5 py-1">
                          {item.subItems.map((sub, sIdx) => {
                            const subActive = location.pathname + location.search === sub.path;
                            if (sub.isExternal) {
                              return (
                                <a
                                  key={sIdx}
                                  href={sub.path}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={() => setDrawerOpen(false)}
                                  className="block rounded-lg px-3 py-2 text-xs font-bold transition text-text-secondary hover:text-text-primary active:bg-surface-low"
                                >
                                  {sub.title}
                                </a>
                              );
                            }
                            return (
                              <Link
                                key={sIdx}
                                to={sub.path}
                                onClick={() => setDrawerOpen(false)}
                                className={`block rounded-lg px-3 py-2 text-xs font-bold transition ${subActive
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
