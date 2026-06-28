import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../utils/api';
import { usePagination } from '../utils/usePagination';
import PaginationControls from '../components/PaginationControls';
import FloatingActionButton from '../components/FloatingActionButton';
import MobileBottomSheet from '../components/MobileBottomSheet';
import { SkeletonTable, Spinner } from '../components/Skeleton';

export default function Expenses() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'income';
  const period = searchParams.get('period') || sessionStorage.getItem('period_expenses') || 'all';

  useEffect(() => {
    let nextParams = null;
    if (!searchParams.has('period')) {
      nextParams = new URLSearchParams(nextParams || searchParams);
      nextParams.set('period', period);
    }
    if (!searchParams.has('tab')) {
      nextParams = new URLSearchParams(nextParams || searchParams);
      nextParams.set('tab', 'income');
    }
    if (nextParams) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [searchParams, period, setSearchParams]);

  useEffect(() => {
    const urlPeriod = searchParams.get('period');
    if (urlPeriod) {
      sessionStorage.setItem('period_expenses', urlPeriod);
    }
  }, [searchParams]);

  const mainTab = (currentTab === 'income' || currentTab === 'income-history') ? 'income' : 'expense';
  const subTab = (currentTab === 'history' || currentTab === 'income-history') ? 'history' : 'add';

  // Dropdown states (unpaginated list)
  const [categories, setCategories] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [dropdownsLoading, setDropdownsLoading] = useState(true);

  // Action loading states
  const [isPostingExpense, setIsPostingExpense] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isSavingIncome, setIsSavingIncome] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [activeMobileForm, setActiveMobileForm] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [selectedDetail, setSelectedDetail] = useState(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Paginated expense history hook
  const pag = usePagination(api.expenses.list, 10, currentTab === 'history' || (isMobile && (currentTab === 'add' || currentTab === 'expense')), { period });

  // Paginated income history hook
  const incomePag = usePagination(api.incomes.list, 10, currentTab === 'income-history' || (isMobile && currentTab === 'income'), { period });

  // Form states - Expense
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [bankSource, setBankSource] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [schedule, setSchedule] = useState('');
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);

  // Form states - Income
  const [incomeSource, setIncomeSource] = useState('Interest');
  const [incomeAmount, setIncomeAmount] = useState('');
  const [incomeBank, setIncomeBank] = useState('');
  const [incomeSupplier, setIncomeSupplier] = useState('');
  const [incomeDesc, setIncomeDesc] = useState('');

  // Category Form
  const [newCatName, setNewCatName] = useState('');

  const loadDropdowns = () => {
    setDropdownsLoading(true);
    Promise.all([
      api.expenseCategories.list(),
      api.bankAccounts.list(),
      api.suppliers.list()
    ])
      .then(([c, b, sup]) => {
        setCategories(c);
        setBankAccounts(b);
        setSuppliers(sup);

        if (c.length > 0) {
          setCategory(c[0].id.toString());
          setIncomeSource(c[0].name);
        }
        if (b.length > 0) {
          setBankSource(b[0].id.toString());
          setIncomeBank(b[0].id.toString());
        }
        if (sup.length > 0) {
          setIncomeSupplier(sup[0].id.toString());
        }
        setDropdownsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setDropdownsLoading(false);
      });
  };

  useEffect(() => {
    loadDropdowns();
  }, []);

  const handleReceiptUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'axor_avp4mtcg');

    try {
      const res = await fetch('https://api.cloudinary.com/v1_1/dx5bqewfx/auto/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.secure_url) {
        setReceiptUrl(data.secure_url);
      } else {
        alert('Upload failed: ' + (data.error?.message || 'Unknown error'));
      }
    } catch (err) {
      alert('Cloudinary upload error: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleExpenseSubmit = (e) => {
    e.preventDefault();
    if (amount === '' || category === '' || bankSource === '') return;

    const payload = {
      category: parseInt(category),
      amount: parseFloat(amount),
      payment_source: parseInt(bankSource),
      receipt_url: receiptUrl || null,
      is_recurring: isRecurring,
      recurrence_schedule: isRecurring ? schedule : '',
      description: notes
    };

    setIsPostingExpense(true);
    api.expenses.create(payload)
      .then(() => {
        setAmount('');
        setReceiptUrl('');
        setIsRecurring(false);
        setSchedule('');
        setNotes('');
        alert('Expense Logged Successfully!');
        pag.refresh();
        loadDropdowns();
      })
      .catch((err) => alert(err.message))
      .finally(() => setIsPostingExpense(false));
  };

  const handleCategorySubmit = (e) => {
    e.preventDefault();
    if (!newCatName) return;

    setIsAddingCategory(true);
    api.expenseCategories.create({ name: newCatName })
      .then(() => {
        setNewCatName('');
        loadDropdowns();
      })
      .catch((err) => alert(err.message))
      .finally(() => setIsAddingCategory(false));
  };

  const handleIncomeSubmit = (e) => {
    e.preventDefault();
    const payload = {
      source: incomeSource,
      amount: parseFloat(incomeAmount),
      payment_method: parseInt(incomeBank),
      supplier: incomeSource === 'Supplier Rebate' ? parseInt(incomeSupplier) : null,
      description: incomeDesc
    };

    setIsSavingIncome(true);
    api.incomes.create(payload)
      .then(() => {
        setIncomeAmount('');
        setIncomeDesc('');
        alert('Income Recorded Successfully!');
        incomePag.refresh();
        loadDropdowns();
      })
      .catch((err) => alert(err.message))
      .finally(() => setIsSavingIncome(false));
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(val);
  };

  const renderSortHeader = (label, field, targetPag = pag, widthClass = '', isRight = false) => {
    const isSorted = targetPag.ordering === field || targetPag.ordering === `-${field}`;
    const isDesc = targetPag.ordering === `-${field}`;
    return (
      <th
        onClick={() => targetPag.handleSort(field)}
        className={`px-4 py-4 cursor-pointer hover:bg-surface-low select-none transition-colors ${widthClass} ${isRight ? 'text-right' : 'text-left'}`}
      >
        <div className={`flex items-center space-x-1 ${isRight ? 'justify-end' : ''}`}>
          <span>{label}</span>
          <span className="text-text-secondary">
            {isSorted ? (isDesc ? '↓' : '↑') : '↕'}
          </span>
        </div>
      </th>
    );
  };

  const activeLoading =
    (currentTab === 'history' || (isMobile && (currentTab === 'add' || currentTab === 'expense'))) ? pag.loading :
      (currentTab === 'income-history' || (isMobile && currentTab === 'income')) ? incomePag.loading :
        dropdownsLoading;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-text-primary">Income & Expense Log</h2>
        <p className="text-xs text-text-secondary">Track operational costs, rent, non-sales income, rebate claims, and recurring logs.</p>
      </div>

      {/* Tabs Menu */}
      <div className="hidden md:block space-y-4">
        {/* Main Tabs (Horizontal) */}
        <div className="flex border-b border-surface-low space-x-6 text-sm font-semibold">
          <Link
            to="/erp/expenses?tab=income"
            className={`pb-2 transition ${mainTab === 'income' ? 'border-b-2 border-brand-blue text-brand-blue' : 'text-text-secondary hover:text-text-primary'}`}
          >
            Incomes
          </Link>
          <Link
            to="/erp/expenses?tab=expense"
            className={`pb-2 transition ${mainTab === 'expense' ? 'border-b-2 border-brand-blue text-brand-blue' : 'text-text-secondary hover:text-text-primary'}`}
          >
            Expenses
          </Link>
        </div>

        {/* Secondary Tabs (Sub-navigation) */}
        <div className="flex space-x-4 text-xs font-semibold bg-surface-low/60 p-1 rounded-lg w-fit shadow-inner">
          <Link
            to={mainTab === 'income' ? '/erp/expenses?tab=income' : '/erp/expenses?tab=expense'}
            className={`px-4 py-1.5 rounded-md transition ${subTab === 'add' ? 'bg-white text-brand-blue shadow font-bold' : 'text-text-secondary hover:text-text-primary'}`}
          >
            {mainTab === 'income' ? 'Add Income' : 'Add Expense'}
          </Link>
          <Link
            to={mainTab === 'income' ? '/erp/expenses?tab=income-history' : '/erp/expenses?tab=history'}
            className={`px-4 py-1.5 rounded-md transition ${subTab === 'history' ? 'bg-white text-brand-blue shadow font-bold' : 'text-text-secondary hover:text-text-primary'}`}
          >
            History Log
          </Link>
        </div>
      </div>

      {/* Add Expense Tab */}
      {(currentTab === 'add' || currentTab === 'expense') && (
        <div className="hidden md:grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-lg bg-white p-6 shadow-sm border border-surface-low space-y-4" style={{ boxShadow: '0px 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 className="text-sm font-semibold text-text-primary">Log New Expense</h3>
            <form onSubmit={handleExpenseSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Expense Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm outline-none focus:border-brand-blue"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Deduct Cash/Bank Account</label>
                  <select
                    value={bankSource}
                    onChange={(e) => setBankSource(e.target.value)}
                    className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm outline-none focus:border-brand-blue"
                  >
                    {bankAccounts.map((b) => (
                      <option key={b.id} value={b.id}>{b.name} (₹{b.balance})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Expense Amount (INR)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm outline-none focus:border-brand-blue"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Upload Receipt Image / Take Photo</label>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <label className="flex items-center justify-center space-x-1.5 rounded-lg bg-accent-blue/15 px-3 py-1.5 text-xs font-semibold text-brand-blue cursor-pointer border border-brand-blue/20 hover:bg-accent-blue/25 transition">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Choose from Gallery</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleReceiptUpload}
                        className="hidden"
                      />
                    </label>
                    <label className="flex items-center justify-center space-x-1.5 rounded-lg bg-green-600/10 px-3 py-1.5 text-xs font-semibold text-green-600 cursor-pointer border border-green-600/20 hover:bg-green-600/20 transition">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>Take Photo (Camera)</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleReceiptUpload}
                        className="hidden"
                      />
                    </label>
                    {uploading && <span className="text-[10px] text-text-secondary">Uploading...</span>}
                  </div>
                  {receiptUrl && (
                    <a href={receiptUrl} target="_blank" rel="noreferrer" className="text-[10px] text-brand-blue hover:underline mt-1 block truncate">
                      View Receipt Link
                    </a>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Description / Notes</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm outline-none"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isPostingExpense}
                className="rounded bg-brand-blue px-6 py-2.5 text-xs font-semibold text-white hover:bg-brand-cobalt transition disabled:opacity-50 flex items-center space-x-1"
              >
                {isPostingExpense && <Spinner size="xs" />}
                <span>Post Expense Invoice</span>
              </button>
            </form>
          </div>

          {/* Expense Categories */}
          <div className="rounded-lg bg-white p-6 shadow-sm border border-surface-low h-fit space-y-4" style={{ boxShadow: '0px 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 className="text-sm font-semibold text-text-primary">Operational Categories</h3>
            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Server Hosting"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={isAddingCategory}
                className="w-full flex items-center justify-center space-x-2 rounded bg-brand-blue py-2 text-xs font-semibold text-white disabled:opacity-50"
              >
                {isAddingCategory && <Spinner size="xs" />}
                <span>Add Category</span>
              </button>
            </form>
            <div className="divide-y divide-surface-low max-h-48 overflow-y-auto pt-2 text-xs">
              {dropdownsLoading ? (
                <div className="space-y-2 animate-pulse pt-2">
                  <div className="h-3 w-3/4 bg-surface-dim/50 rounded" />
                  <div className="h-3 w-1/2 bg-surface-dim/50 rounded" />
                  <div className="h-3 w-2/3 bg-surface-dim/50 rounded" />
                </div>
              ) : (
                categories.map((c) => (
                  <div key={c.id} className="py-2 text-text-primary font-semibold">
                    • {c.name}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Expense History Tab / Mobile Expense List */}
      {(currentTab === 'history' || ((currentTab === 'add' || currentTab === 'expense') && isMobile)) && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 md:bg-white md:p-4 md:rounded-t-lg md:border-t md:border-x md:border-surface-low bg-transparent p-0 border-none">
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                value={pag.search}
                onChange={(e) => pag.setSearch(e.target.value)}
                placeholder="Search expenses by category/desc..."
                className="w-full rounded border border-surface-dim bg-white pl-9 pr-3 py-3 md:py-2 text-sm md:text-xs text-text-primary outline-none focus:border-brand-blue placeholder:text-text-secondary search-input-mobile"
              />
              <span className="absolute left-3 top-3.5 md:top-2.5 text-text-secondary">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <label htmlFor="expense-period-select" className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Period:</label>
              {!period.startsWith('custom_') ? (
                <select
                  id="expense-period-select"
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
                  className="rounded border border-surface-dim bg-white px-2.5 py-1 text-xs font-semibold text-text-primary outline-none focus:border-brand-blue shadow-xs cursor-pointer w-full sm:w-auto"
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
            {pag.loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-brand-blue border-t-transparent" />
            )}
          </div>

          <div className="md:rounded-b-lg md:bg-white md:border-x md:border-b md:border-surface-low bg-transparent border-none overflow-x-auto">
            {isMobile ? (
              <div className="space-y-3 pt-2">
                {pag.loading ? (
                  <div className="space-y-3 animate-pulse">
                    <div className="h-20 bg-surface-dim/40 rounded-xl" />
                    <div className="h-20 bg-surface-dim/40 rounded-xl" />
                    <div className="h-20 bg-surface-dim/40 rounded-xl" />
                  </div>
                ) : (
                  pag.data.map((e) => (
                    <div
                      key={e.id}
                      onClick={() => setSelectedDetail({ type: 'expense', data: e })}
                      className="rounded-lg border border-surface-low bg-white p-3 shadow-sm active:bg-surface-low transition-colors"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-text-primary text-sm">{e.category_name}</span>
                        <span className="font-bold text-error text-sm">{formatCurrency(e.amount)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-text-secondary">
                        <span className="truncate max-w-[200px]">{e.description || '-'}</span>
                        <span>{new Date(e.timestamp).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                )}
                {pag.data.length === 0 && !pag.loading && (
                  <div className="text-center py-8 text-text-secondary text-sm">No expenses found.</div>
                )}
              </div>
            ) : (
              <table className="min-w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-surface-low text-text-secondary font-semibold uppercase text-xs tracking-wider">
                  <tr>
                    {renderSortHeader('Timestamp', 'timestamp', pag)}
                    {renderSortHeader('Category', 'category__name', pag)}
                    {renderSortHeader('Amount', 'amount', pag, '', true)}
                    <th className="px-4 py-4">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-low">
                  {pag.loading ? (
                    <SkeletonTable rows={5} columns={4} />
                  ) : (
                    pag.data.map((e) => (
                      <tr
                        key={e.id}
                        onClick={() => setSelectedDetail({ type: 'expense', data: e })}
                        className="hover:bg-surface-bright cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-4 text-text-secondary whitespace-nowrap">{new Date(e.timestamp).toLocaleString()}</td>
                        <td className="px-4 py-4 font-semibold text-text-primary max-w-[100px] lg:max-w-[150px] truncate" title={e.category_name}>{e.category_name}</td>
                        <td className="px-4 py-4 text-right font-semibold text-error whitespace-nowrap">{formatCurrency(e.amount)}</td>
                        <td className="px-4 py-4 text-text-secondary max-w-[100px] lg:max-w-[150px] truncate" title={e.description}>{e.description || '-'}</td>
                      </tr>
                    ))
                  )}
                  {pag.data.length === 0 && !pag.loading && (
                    <tr>
                      <td colSpan="4" className="px-4 py-8 text-center text-text-secondary">No expenses found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
            <PaginationControls
              page={pag.page}
              setPage={pag.setPage}
              pageSize={pag.pageSize}
              setPageSize={pag.setPageSize}
              totalCount={pag.totalCount}
              totalPages={pag.totalPages}
              loading={pag.loading}
            />
          </div>
        </div>
      )}
      {/* Record Income Tab */}
      {currentTab === 'income' && (
        <div className="hidden md:grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="md:col-span-2 rounded-lg bg-white p-6 shadow-sm border border-surface-low h-fit" style={{ boxShadow: '0px 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 className="text-sm font-semibold text-text-primary mb-4">Record External Income</h3>
            <form onSubmit={handleIncomeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Income Category / Source</label>
                <select
                  value={incomeSource}
                  onChange={(e) => setIncomeSource(e.target.value)}
                  className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm outline-none focus:border-brand-blue"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                  <option value="Interest">Interest</option>
                  <option value="Supplier Rebate">Supplier Rebate</option>
                  <option value="Reward Cash">Reward Cash</option>
                  <option value="Other Non-Sales Income">Other Non-Sales Income</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Income Amount (INR)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={incomeAmount}
                  onChange={(e) => setIncomeAmount(e.target.value)}
                  className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm outline-none focus:border-brand-blue"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Receive Into Account</label>
                <select
                  value={incomeBank}
                  onChange={(e) => setIncomeBank(e.target.value)}
                  className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm outline-none focus:border-brand-blue"
                >
                  {bankAccounts.map((b) => (
                    <option key={b.id} value={b.id}>{b.name} (₹{b.balance})</option>
                  ))}
                </select>
              </div>
              {incomeSource === 'Supplier Rebate' && (
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Supplier (Deduct Outstanding Balance)</label>
                  <select
                    value={incomeSupplier}
                    onChange={(e) => setIncomeSupplier(e.target.value)}
                    className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm outline-none focus:border-brand-blue"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Notes / Description</label>
                <input
                  type="text"
                  value={incomeDesc}
                  onChange={(e) => setIncomeDesc(e.target.value)}
                  className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={isSavingIncome}
                className="w-full flex items-center justify-center space-x-2 rounded bg-brand-blue py-2 text-sm font-semibold text-white hover:bg-brand-cobalt transition disabled:opacity-50"
              >
                {isSavingIncome && <Spinner size="sm" />}
                <span>Save Income</span>
              </button>
            </form>
          </div>

          {/* Operational Categories for Income */}
          <div className="rounded-lg bg-white p-6 shadow-sm border border-surface-low h-fit space-y-4" style={{ boxShadow: '0px 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 className="text-sm font-semibold text-text-primary">Operational Categories</h3>
            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Server Hosting"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={isAddingCategory}
                className="rounded bg-brand-blue px-6 py-2.5 text-xs font-semibold text-white hover:bg-brand-cobalt transition disabled:opacity-50 flex items-center space-x-1"
              >
                {isAddingCategory && <Spinner size="xs" />}
                <span>Add Category</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Income History Tab / Mobile Income List */}
      {(currentTab === 'income-history' || (currentTab === 'income' && isMobile)) && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 md:bg-white md:p-4 md:rounded-t-lg md:border-t md:border-x md:border-surface-low bg-transparent p-0 border-none">
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                value={incomePag.search}
                onChange={(e) => incomePag.setSearch(e.target.value)}
                placeholder="Search income by source/details..."
                className="w-full rounded border border-surface-dim bg-white pl-9 pr-3 py-3 md:py-2 text-sm md:text-xs text-text-primary outline-none focus:border-brand-blue placeholder:text-text-secondary search-input-mobile"
              />
              <span className="absolute left-3 top-3.5 md:top-2.5 text-text-secondary">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <label htmlFor="income-period-select" className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Period:</label>
              {!period.startsWith('custom_') ? (
                <select
                  id="income-period-select"
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
                  className="rounded border border-surface-dim bg-white px-2.5 py-1 text-xs font-semibold text-text-primary outline-none focus:border-brand-blue shadow-xs cursor-pointer w-full sm:w-auto"
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
            {incomePag.loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-brand-blue border-t-transparent" />
            )}
          </div>

          <div className="md:rounded-b-lg md:bg-white md:border-x md:border-b md:border-surface-low bg-transparent border-none overflow-x-auto">
            {isMobile ? (
              <div className="space-y-3 pt-2">
                {incomePag.loading ? (
                  <div className="space-y-3 animate-pulse">
                    <div className="h-20 bg-surface-dim/40 rounded-xl" />
                    <div className="h-20 bg-surface-dim/40 rounded-xl" />
                    <div className="h-20 bg-surface-dim/40 rounded-xl" />
                  </div>
                ) : (
                  incomePag.data.map((inc) => (
                    <div
                      key={inc.id}
                      onClick={() => setSelectedDetail({ type: 'income', data: inc })}
                      className="rounded-lg border border-surface-low bg-white p-3 shadow-sm active:bg-surface-low transition-colors"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-text-primary text-sm">{inc.source}</span>
                        <span className="font-bold text-green-600 text-sm">{formatCurrency(inc.amount)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-text-secondary">
                        <span className="truncate max-w-[200px]">{inc.description || '-'}</span>
                        <span>{new Date(inc.timestamp).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                )}
                {incomePag.data.length === 0 && !incomePag.loading && (
                  <div className="text-center py-8 text-text-secondary text-sm">No income ledgers found.</div>
                )}
              </div>
            ) : (
              <table className="min-w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-surface-low text-text-secondary font-semibold uppercase text-xs tracking-wider">
                  <tr>
                    {renderSortHeader('Date', 'timestamp', incomePag)}
                    {renderSortHeader('Source / Category', 'source', incomePag)}
                    {renderSortHeader('Amount', 'amount', incomePag, '', true)}
                    <th className="px-4 py-4">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-low">
                  {incomePag.loading ? (
                    <SkeletonTable rows={5} columns={4} />
                  ) : (
                    incomePag.data.map((inc) => (
                      <tr
                        key={inc.id}
                        onClick={() => setSelectedDetail({ type: 'income', data: inc })}
                        className="hover:bg-surface-bright cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-4 text-text-secondary whitespace-nowrap">{new Date(inc.timestamp).toLocaleDateString()}</td>
                        <td className="px-4 py-4 font-semibold text-text-primary max-w-[100px] lg:max-w-[150px] truncate" title={inc.source}>{inc.source}</td>
                        <td className="px-4 py-4 text-right font-semibold text-green-600 whitespace-nowrap">{formatCurrency(inc.amount)}</td>
                        <td className="px-4 py-4 text-text-secondary max-w-[100px] lg:max-w-[150px] truncate" title={inc.description}>{inc.description || '-'}</td>
                      </tr>
                    ))
                  )}
                  {incomePag.data.length === 0 && !incomePag.loading && (
                    <tr>
                      <td colSpan="4" className="px-4 py-8 text-center text-text-secondary">No income ledgers found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            <PaginationControls
              page={incomePag.page}
              setPage={incomePag.setPage}
              pageSize={incomePag.pageSize}
              setPageSize={incomePag.setPageSize}
              totalCount={incomePag.totalCount}
              totalPages={incomePag.totalPages}
              loading={incomePag.loading}
            />
          </div>
        </div>
      )}

      {/* Mobile Create Menu Sheet */}
      <MobileBottomSheet
        isOpen={showCreateMenu}
        onClose={() => setShowCreateMenu(false)}
        title="Choose Action"
      >
        <div className="space-y-3 pb-4">
          <button
            onClick={() => {
              setShowCreateMenu(false);
              setIncomeAmount('');
              setIncomeDesc('');
              setActiveMobileForm('income');
            }}
            className="w-full flex items-center space-x-3 p-4 rounded-xl border border-surface-low hover:bg-surface-low text-left text-sm font-medium text-text-primary transition"
          >
            <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-green-600/10 text-green-600">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <div className="font-semibold">Record Income</div>
              <div className="text-xs text-text-secondary">Record interest or non-sales income</div>
            </div>
          </button>

          <button
            onClick={() => {
              setShowCreateMenu(false);
              setAmount('');
              setNotes('');
              setReceiptUrl('');
              setIsRecurring(false);
              setActiveMobileForm('expense');
            }}
            className="w-full flex items-center space-x-3 p-4 rounded-xl border border-surface-low hover:bg-surface-low text-left text-sm font-medium text-text-primary transition"
          >
            <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-red-600/10 text-red-600">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
            </div>
            <div>
              <div className="font-semibold">Log Expense</div>
              <div className="text-xs text-text-secondary">Log a new business operational expense</div>
            </div>
          </button>

          <button
            onClick={() => {
              setShowCreateMenu(false);
              setNewCatName('');
              setActiveMobileForm('category');
            }}
            className="w-full flex items-center space-x-3 p-4 rounded-xl border border-surface-low hover:bg-surface-low text-left text-sm font-medium text-text-primary transition"
          >
            <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-purple-600/10 text-purple-600">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </div>
            <div>
              <div className="font-semibold">Add Category</div>
              <div className="text-xs text-text-secondary">Create a new operational category</div>
            </div>
          </button>
        </div>
      </MobileBottomSheet>

      {/* Mobile Forms Bottom Sheets */}
      <MobileBottomSheet
        isOpen={activeMobileForm === 'expense'}
        onClose={() => setActiveMobileForm(null)}
        title="Log Expense"
      >
        <form onSubmit={handleExpenseSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-text-secondary">Expense Category</label>
                <button
                  type="button"
                  onClick={() => setActiveMobileForm('category')}
                  className="text-xs text-brand-blue font-bold hover:underline"
                >
                  + Add
                </button>
              </div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-blue"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Deduct Account</label>
              <select
                value={bankSource}
                onChange={(e) => setBankSource(e.target.value)}
                className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-blue"
              >
                {bankAccounts.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Amount (INR)</label>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-blue"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Description / Notes</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm text-text-primary outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Receipt Attachment</label>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center justify-center space-x-1 rounded-lg bg-accent-blue/15 px-2 py-2 text-xs font-semibold text-brand-blue cursor-pointer border border-brand-blue/20 hover:bg-accent-blue/25 transition">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="truncate">Gallery</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleReceiptUpload}
                  className="hidden"
                />
              </label>
              <label className="flex items-center justify-center space-x-1 rounded-lg bg-green-600/10 px-2 py-2 text-xs font-semibold text-green-600 cursor-pointer border border-green-600/20 hover:bg-green-600/20 transition">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="truncate">Camera</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleReceiptUpload}
                  className="hidden"
                />
              </label>
            </div>
            {uploading && <div className="text-[10px] text-text-secondary text-center mt-1">Uploading...</div>}
            {receiptUrl && (
              <a href={receiptUrl} target="_blank" rel="noreferrer" className="text-[10px] text-brand-blue hover:underline mt-1 block truncate">
                View Receipt Link
              </a>
            )}
          </div>
          <button
            type="submit"
            disabled={isPostingExpense}
            className="w-full rounded bg-brand-blue py-2.5 text-xs font-semibold text-white hover:bg-brand-cobalt transition flex items-center justify-center space-x-1.5 disabled:opacity-50 disabled:pointer-events-none"
          >
            {isPostingExpense && <Spinner size="xs" />}
            <span>Post Expense Invoice</span>
          </button>
        </form>
      </MobileBottomSheet>

      <MobileBottomSheet
        isOpen={activeMobileForm === 'category'}
        onClose={() => setActiveMobileForm(null)}
        title="Add Category"
      >
        <form onSubmit={(e) => {
          e.preventDefault();
          if (!newCatName) return;
          setIsAddingCategory(true);
          api.expenseCategories.create({ name: newCatName })
            .then(() => {
              setNewCatName('');
              loadDropdowns();
              setActiveMobileForm(null);
            })
            .catch((err) => alert(err.message))
            .finally(() => setIsAddingCategory(false));
        }} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Category Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Server Hosting"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm text-text-primary outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={isAddingCategory}
            className="w-full flex items-center justify-center space-x-2 rounded bg-brand-blue py-2 text-xs font-semibold text-white disabled:opacity-50"
          >
            {isAddingCategory && <Spinner size="xs" />}
            <span>Add Category</span>
          </button>
        </form>
      </MobileBottomSheet>

      <MobileBottomSheet
        isOpen={activeMobileForm === 'income'}
        onClose={() => setActiveMobileForm(null)}
        title="Record Income"
      >
        <form onSubmit={(e) => {
          e.preventDefault();
          handleIncomeSubmit(e);
          setActiveMobileForm(null);
        }} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-text-secondary">Category / Source</label>
                <button
                  type="button"
                  onClick={() => setActiveMobileForm('category')}
                  className="text-xs text-brand-blue font-bold hover:underline"
                >
                  + Add
                </button>
              </div>
              <select
                value={incomeSource}
                onChange={(e) => setIncomeSource(e.target.value)}
                className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-blue"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
                <option value="Interest">Interest</option>
                <option value="Supplier Rebate">Supplier Rebate</option>
                <option value="Reward Cash">Reward Cash</option>
                <option value="Other Non-Sales Income">Other Non-Sales Income</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Receive Into</label>
              <select
                value={incomeBank}
                onChange={(e) => setIncomeBank(e.target.value)}
                className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-blue"
              >
                {bankAccounts.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Amount (INR)</label>
              <input
                type="number"
                step="0.01"
                required
                value={incomeAmount}
                onChange={(e) => setIncomeAmount(e.target.value)}
                className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-blue"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Notes / Description</label>
              <input
                type="text"
                value={incomeDesc}
                onChange={(e) => setIncomeDesc(e.target.value)}
                className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm text-text-primary outline-none"
              />
            </div>
          </div>

          {incomeSource === 'Supplier Rebate' && (
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Supplier</label>
              <select
                value={incomeSupplier}
                onChange={(e) => setIncomeSupplier(e.target.value)}
                className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-blue"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}
          <button
            type="submit"
            disabled={isSavingIncome}
            className="w-full flex items-center justify-center space-x-2 rounded bg-brand-blue py-2 text-sm font-semibold text-white hover:bg-brand-cobalt transition disabled:opacity-50"
          >
            {isSavingIncome && <Spinner size="sm" />}
            <span>Save Income</span>
          </button>
        </form>
      </MobileBottomSheet>

      {/* Detail Modal (Desktop) & Bottom Sheet (Mobile) */}
      {selectedDetail && (
        <>
          {/* Desktop Center Modal */}
          <div className="hidden md:flex fixed inset-0 z-50 items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl relative border border-surface-low">
              <button
                onClick={() => setSelectedDetail(null)}
                className="absolute top-4 right-4 text-text-secondary hover:text-text-primary p-1 rounded-full hover:bg-surface-low transition cursor-pointer"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="mb-4">
                <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${selectedDetail.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                  {selectedDetail.type === 'income' ? 'External Income' : 'Operational Expense'}
                </span>
                <h3 className="text-base font-bold text-text-primary mt-2">Transaction Details</h3>
              </div>

              <div className="space-y-3.5 text-sm">
                <div className="grid grid-cols-2 gap-4 border-b border-surface-low pb-2">
                  <div>
                    <span className="block text-[11px] font-semibold text-text-secondary">Amount</span>
                    <span className={`font-extrabold text-lg block mt-1.5 ${selectedDetail.type === 'income' ? 'text-green-600' : 'text-error'
                      }`}>
                      {formatCurrency(selectedDetail.data.amount)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-semibold text-text-secondary">Timestamp</span>
                    <span className="font-semibold text-text-primary block mt-1.5">
                      {new Date(selectedDetail.data.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-b border-surface-low pb-2">
                  <div>
                    <span className="block text-[11px] font-semibold text-text-secondary">
                      {selectedDetail.type === 'income' ? 'Source / Category' : 'Expense Category'}
                    </span>
                    <span className="font-bold text-text-primary block mt-1.5">
                      {selectedDetail.type === 'income' ? selectedDetail.data.source : selectedDetail.data.category_name}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-semibold text-text-secondary">
                      {selectedDetail.type === 'income' ? 'Received Into' : 'Account Charged'}
                    </span>
                    <span className="font-semibold text-text-primary block mt-1.5">
                      {selectedDetail.type === 'income' ? selectedDetail.data.payment_method_name : selectedDetail.data.payment_source_name}
                    </span>
                  </div>
                </div>

                {selectedDetail.type === 'income' && selectedDetail.data.source === 'Supplier Rebate' && selectedDetail.data.supplier_name && (
                  <div className="border-b border-surface-low pb-2">
                    <span className="block text-[11px] font-semibold text-text-secondary">Related Supplier</span>
                    <span className="font-semibold text-text-primary block mt-1">{selectedDetail.data.supplier_name}</span>
                  </div>
                )}

                {selectedDetail.type === 'expense' && selectedDetail.data.purchase && (
                  <div className="border-b border-surface-low pb-2">
                    <span className="block text-[11px] font-semibold text-text-secondary">Related Purchase Order</span>
                    <span className="font-semibold text-text-primary block mt-1">
                      PO #{selectedDetail.data.purchase}
                      {selectedDetail.data.purchase_supplier_name && ` (${selectedDetail.data.purchase_supplier_name})`}
                      {selectedDetail.data.purchase_invoice_number && ` - Inv: ${selectedDetail.data.purchase_invoice_number}`}
                    </span>
                  </div>
                )}

                <div>
                  <span className="block text-[11px] font-semibold text-text-secondary">Description / Notes</span>
                  <p className="font-semibold text-text-primary mt-1 whitespace-pre-wrap leading-relaxed">
                    {selectedDetail.data.description || 'No description provided.'}
                  </p>
                </div>

                {selectedDetail.type === 'expense' && selectedDetail.data.receipt_url && (
                  <div className="pt-2">
                    <span className="block text-[11px] font-semibold text-text-secondary mb-1.5">Receipt Attachment</span>
                    <a
                      href={selectedDetail.data.receipt_url}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-lg overflow-hidden border border-surface-low hover:opacity-90 transition max-h-48 bg-surface-low"
                    >
                      <img src={selectedDetail.data.receipt_url} alt="Receipt preview" className="max-h-48 w-full object-contain" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Bottom Sheet Detail */}
          <MobileBottomSheet
            isOpen={!!selectedDetail}
            onClose={() => setSelectedDetail(null)}
            title="Transaction Details"
          >
            <div className="space-y-4 pb-6 text-sm">
              <div className="flex justify-between items-center bg-surface-low/50 p-3 rounded-xl">
                <div>
                  <span className="block text-[10px] font-semibold text-text-secondary uppercase">Amount</span>
                  <span className={`font-extrabold text-xl ${selectedDetail.type === 'income' ? 'text-green-600' : 'text-error'
                    }`}>
                    {formatCurrency(selectedDetail.data.amount)}
                  </span>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${selectedDetail.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                  {selectedDetail.type === 'income' ? 'Income' : 'Expense'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-[10px] font-semibold text-text-secondary uppercase">Date & Time</span>
                  <span className="font-bold text-text-primary block mt-0.5">
                    {new Date(selectedDetail.data.timestamp).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-semibold text-text-secondary uppercase">
                    {selectedDetail.type === 'income' ? 'Category / Source' : 'Category'}
                  </span>
                  <span className="font-bold text-text-primary block mt-0.5">
                    {selectedDetail.type === 'income' ? selectedDetail.data.source : selectedDetail.data.category_name}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-[10px] font-semibold text-text-secondary uppercase">Account</span>
                  <span className="font-semibold text-text-primary block mt-0.5">
                    {selectedDetail.type === 'income' ? selectedDetail.data.payment_method_name : selectedDetail.data.payment_source_name}
                  </span>
                </div>
                {selectedDetail.type === 'expense' && selectedDetail.data.purchase && (
                  <div>
                    <span className="block text-[10px] font-semibold text-text-secondary uppercase">Purchase Order</span>
                    <span className="font-semibold text-text-primary block mt-0.5">
                      PO #{selectedDetail.data.purchase}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <span className="block text-[10px] font-semibold text-text-secondary uppercase">Notes / Description</span>
                <p className="font-semibold text-text-primary mt-1 bg-surface-low/30 p-2.5 rounded-lg whitespace-pre-wrap">
                  {selectedDetail.data.description || 'No description provided.'}
                </p>
              </div>

              {selectedDetail.type === 'expense' && selectedDetail.data.receipt_url && (
                <div>
                  <span className="block text-[10px] font-semibold text-text-secondary uppercase mb-1">Receipt Image</span>
                  <a
                    href={selectedDetail.data.receipt_url}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-lg overflow-hidden border border-surface-low bg-surface-low"
                  >
                    <img src={selectedDetail.data.receipt_url} alt="Receipt attachment" className="max-h-52 w-full object-contain mx-auto" />
                  </a>
                </div>
              )}
            </div>
          </MobileBottomSheet>
        </>
      )}

      {/* Floating Action Button for mobile */}
      {(currentTab === 'add' || currentTab === 'expense' || currentTab === 'history' || currentTab === 'income' || currentTab === 'income-history') && !activeMobileForm && (
        <FloatingActionButton
          icon={
            (currentTab === 'income' || currentTab === 'income-history') ? (
              <div className="relative">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span className="absolute -top-1.5 -right-1.5 bg-white text-brand-blue rounded-full text-[9px] font-black h-4 w-4 flex items-center justify-center border border-brand-blue shadow-xs">+</span>
              </div>
            ) : (
              <div className="relative">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
                <span className="absolute -top-1.5 -right-1.5 bg-white text-brand-blue rounded-full text-[9px] font-black h-4 w-4 flex items-center justify-center border border-brand-blue shadow-xs">+</span>
              </div>
            )
          }
          onClick={() => {
            if (currentTab === 'income' || currentTab === 'income-history') {
              setIncomeAmount('');
              setIncomeDesc('');
              setActiveMobileForm('income');
            } else {
              setAmount('');
              setNotes('');
              setReceiptUrl('');
              setIsRecurring(false);
              setActiveMobileForm('expense');
            }
          }}
        />
      )}
    </div>
  );
}
