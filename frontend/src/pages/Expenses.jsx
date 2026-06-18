import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../utils/api';
import { usePagination } from '../utils/usePagination';
import PaginationControls from '../components/PaginationControls';

export default function Expenses() {
  const [searchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'add';

  const mainTab = (currentTab === 'income' || currentTab === 'income-history') ? 'income' : 'expense';
  const subTab = (currentTab === 'history' || currentTab === 'income-history') ? 'history' : 'add';

  // Dropdown states (unpaginated list)
  const [categories, setCategories] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [dropdownsLoading, setDropdownsLoading] = useState(true);

  // Paginated expense history hook
  const pag = usePagination(api.expenses.list, 10, currentTab === 'history');
  
  // Paginated income history hook
  const incomePag = usePagination(api.incomes.list, 10, currentTab === 'income-history');

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
      
      if (c.length > 0) setCategory(c[0].id.toString());
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
      .catch((err) => alert(err.message));
  };

  const handleCategorySubmit = (e) => {
    e.preventDefault();
    if (!newCatName) return;

    api.expenseCategories.create({ name: newCatName })
      .then(() => {
        setNewCatName('');
        loadDropdowns();
      })
      .catch((err) => alert(err.message));
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

    api.incomes.create(payload)
      .then(() => {
        setIncomeAmount('');
        setIncomeDesc('');
        alert('Income Recorded Successfully!');
        incomePag.refresh();
        loadDropdowns();
      })
      .catch((err) => alert(err.message));
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(val);
  };

  const renderSortHeader = (label, field, targetPag = pag) => {
    const isSorted = targetPag.ordering === field || targetPag.ordering === `-${field}`;
    const isDesc = targetPag.ordering === `-${field}`;
    return (
      <th 
        onClick={() => targetPag.handleSort(field)}
        className="px-4 py-2 cursor-pointer hover:bg-surface-low select-none transition-colors"
      >
        <div className="flex items-center space-x-1">
          <span>{label}</span>
          <span className="text-text-secondary">
            {isSorted ? (isDesc ? '↓' : '↑') : '↕'}
          </span>
        </div>
      </th>
    );
  };

  const activeLoading = 
    currentTab === 'history' ? pag.loading : 
    currentTab === 'income-history' ? incomePag.loading : 
    dropdownsLoading;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-text-primary">Expense & Income Log</h2>
        <p className="text-xs text-text-secondary">Track operational costs, rent, non-sales income, rebate claims, and recurring logs.</p>
      </div>

      {/* Tabs Menu */}
      <div className="space-y-4">
        {/* Main Tabs (Horizontal) */}
        <div className="flex border-b border-surface-low space-x-6 text-sm font-semibold">
          <a 
            href="/erp/expenses" 
            className={`pb-2 transition ${mainTab === 'expense' ? 'border-b-2 border-brand-blue text-brand-blue' : 'text-text-secondary hover:text-text-primary'}`}
          >
            Expenses
          </a>
          <a 
            href="/erp/expenses?tab=income" 
            className={`pb-2 transition ${mainTab === 'income' ? 'border-b-2 border-brand-blue text-brand-blue' : 'text-text-secondary hover:text-text-primary'}`}
          >
            Incomes
          </a>
        </div>

        {/* Secondary Tabs (Sub-navigation) */}
        <div className="flex space-x-4 text-xs font-semibold bg-surface-low/60 p-1 rounded-lg w-fit shadow-inner">
          <a 
            href={mainTab === 'expense' ? '/erp/expenses' : '/erp/expenses?tab=income'} 
            className={`px-4 py-1.5 rounded-md transition ${subTab === 'add' ? 'bg-white text-brand-blue shadow font-bold' : 'text-text-secondary hover:text-text-primary'}`}
          >
            {mainTab === 'expense' ? 'Add Expense' : 'Add Income'}
          </a>
          <a 
            href={mainTab === 'expense' ? '/erp/expenses?tab=history' : '/erp/expenses?tab=income-history'} 
            className={`px-4 py-1.5 rounded-md transition ${subTab === 'history' ? 'bg-white text-brand-blue shadow font-bold' : 'text-text-secondary hover:text-text-primary'}`}
          >
            History Log
          </a>
        </div>
      </div>

      {/* Add Expense Tab */}
      {currentTab === 'add' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
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
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Upload Receipt Image (Cloudinary)</label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleReceiptUpload}
                      className="text-xs text-text-secondary file:py-1 file:px-3 file:rounded file:border-0 file:bg-accent-blue/10 file:text-brand-blue"
                    />
                    {uploading && <span className="text-[10px] text-text-secondary">Uploading...</span>}
                  </div>
                  {receiptUrl && (
                    <a href={receiptUrl} target="_blank" rel="noreferrer" className="text-[10px] text-brand-blue hover:underline mt-1 block truncate">
                      View Receipt Link
                    </a>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="recurring"
                      checked={isRecurring}
                      onChange={(e) => setIsRecurring(e.target.checked)}
                      className="rounded border-surface-dim text-brand-blue"
                    />
                    <label htmlFor="recurring" className="text-xs font-semibold text-text-secondary">
                      Is Recurring Expense? (Rent, Utilities, etc.)
                    </label>
                  </div>
                  {isRecurring && (
                    <div className="mt-2">
                      <label className="block text-[11px] font-semibold text-text-secondary mb-1">Schedule</label>
                      <select
                        value={schedule}
                        onChange={(e) => setSchedule(e.target.value)}
                        className="w-full max-w-xs rounded border border-surface-dim bg-white px-3 py-2 text-sm outline-none"
                      >
                        <option value="Weekly">Weekly</option>
                        <option value="Monthly">Monthly</option>
                        <option value="Yearly">Yearly</option>
                      </select>
                    </div>
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
                className="rounded bg-brand-blue px-6 py-2.5 text-xs font-semibold text-white hover:bg-brand-cobalt transition"
              >
                Post Expense Invoice
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
              <button type="submit" className="w-full rounded bg-brand-blue py-2 text-xs font-semibold text-white">
                Add Category
              </button>
            </form>
            <div className="divide-y divide-surface-low max-h-48 overflow-y-auto pt-2 text-xs">
              {categories.map((c) => (
                <div key={c.id} className="py-2 text-text-primary font-semibold">
                  • {c.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Expense History Tab */}
      {currentTab === 'history' && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-t-lg border-t border-x border-surface-low">
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                value={pag.search}
                onChange={(e) => pag.setSearch(e.target.value)}
                placeholder="Search expenses by category/desc..."
                className="w-full rounded border border-surface-dim bg-white pl-9 pr-3 py-2 text-xs text-text-primary outline-none focus:border-brand-blue placeholder:text-text-secondary"
              />
              <span className="absolute left-3 top-2.5 text-text-secondary">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
            </div>
            {pag.loading && (
              <span className="text-xs text-brand-blue animate-pulse">Loading...</span>
            )}
          </div>

          <div className="rounded-b-lg bg-white border-x border-b border-surface-low overflow-x-auto">
             <table className="min-w-full text-left text-xs">
              <thead className="bg-surface-low text-text-secondary font-semibold uppercase">
                <tr>
                  {renderSortHeader('Timestamp', 'timestamp')}
                  {renderSortHeader('Category', 'category__name')}
                  <th className="px-4 py-2">Account Charged</th>
                  {renderSortHeader('Amount', 'amount')}
                  <th className="px-4 py-2">Description</th>
                  <th className="px-4 py-2">Related Purchase</th>
                  <th className="px-4 py-2 text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-low">
                {pag.data.map((e) => (
                  <tr key={e.id} className="hover:bg-surface-bright">
                    <td className="px-4 py-3 text-text-secondary">{new Date(e.timestamp).toLocaleString()}</td>
                    <td className="px-4 py-3 font-semibold text-text-primary">{e.category_name}</td>
                    <td className="px-4 py-3 text-text-secondary">{e.payment_source_name}</td>
                    <td className="px-4 py-3 text-right font-semibold text-error">{formatCurrency(e.amount)}</td>
                    <td className="px-4 py-3 text-text-secondary">{e.description}</td>
                    <td className="px-4 py-3 text-text-primary font-medium">
                      {e.purchase ? (
                        <div className="flex flex-col">
                          <span>PO #{e.purchase}</span>
                          {e.purchase_supplier_name && (
                            <span className="text-[10px] text-text-secondary">{e.purchase_supplier_name}</span>
                          )}
                          {e.purchase_invoice_number && (
                            <span className="text-[10px] text-text-secondary">Inv: {e.purchase_invoice_number}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-text-secondary">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {e.receipt_url ? (
                        <a href={e.receipt_url} target="_blank" rel="noreferrer" className="text-brand-blue hover:underline font-semibold">
                          View Receipt
                        </a>
                      ) : (
                        <span className="text-text-secondary">-</span>
                      )}
                    </td>
                  </tr>
                ))}
                {pag.data.length === 0 && !pag.loading && (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-text-secondary">No expenses found.</td>
                  </tr>
                )}
              </tbody>
            </table>
            <PaginationControls
              page={pag.page}
              setPage={pag.setPage}
              pageSize={pag.pageSize}
              setPageSize={pag.setPageSize}
              totalCount={pag.totalCount}
              totalPages={pag.totalPages}
            />
          </div>
        </div>
      )}
      {/* Record Income Tab */}
      {currentTab === 'income' && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow-sm border border-surface-low h-fit" style={{ boxShadow: '0px 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 className="text-sm font-semibold text-text-primary mb-4">Record External Income</h3>
            <form onSubmit={handleIncomeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Income Category / Source</label>
                <select
                  value={incomeSource}
                  onChange={(e) => setIncomeSource(e.target.value)}
                  className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm outline-none focus:border-brand-blue"
                >
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
                className="w-full rounded bg-brand-blue py-2 text-sm font-semibold text-white hover:bg-brand-cobalt transition"
              >
                Save Income
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Income History Tab */}
      {currentTab === 'income-history' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-t-lg border-t border-x border-surface-low">
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                value={incomePag.search}
                onChange={(e) => incomePag.setSearch(e.target.value)}
                placeholder="Search income by source/details..."
                className="w-full rounded border border-surface-dim bg-white pl-9 pr-3 py-2 text-xs text-text-primary outline-none focus:border-brand-blue placeholder:text-text-secondary"
              />
              <span className="absolute left-3 top-2.5 text-text-secondary">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
            </div>
            {incomePag.loading && (
              <span className="text-xs text-brand-blue animate-pulse">Loading...</span>
            )}
          </div>

          <div className="rounded-b-lg bg-white border-x border-b border-surface-low overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-surface-low text-text-secondary font-semibold uppercase">
                <tr>
                  {renderSortHeader('Date', 'timestamp', incomePag)}
                  {renderSortHeader('Source / Category', 'source', incomePag)}
                  <th className="px-4 py-2">Receive Account</th>
                  {renderSortHeader('Amount', 'amount', incomePag)}
                  <th className="px-4 py-2">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-low">
                {incomePag.data.map((inc) => (
                  <tr key={inc.id} className="hover:bg-surface-bright">
                    <td className="px-4 py-2.5 text-text-secondary">{new Date(inc.timestamp).toLocaleDateString()}</td>
                    <td className="px-4 py-2.5 font-semibold text-text-primary">{inc.source}</td>
                    <td className="px-4 py-2.5 text-text-secondary">{inc.payment_method_name}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-green-600">{formatCurrency(inc.amount)}</td>
                    <td className="px-4 py-2.5 text-text-secondary">{inc.description}</td>
                  </tr>
                ))}
                {incomePag.data.length === 0 && !incomePag.loading && (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-text-secondary">No income ledgers found.</td>
                  </tr>
                )}
              </tbody>
            </table>

            <PaginationControls
              page={incomePag.page}
              setPage={incomePag.setPage}
              pageSize={incomePag.pageSize}
              setPageSize={incomePag.setPageSize}
              totalCount={incomePag.totalCount}
              totalPages={incomePag.totalPages}
            />
          </div>
        </div>
      )}
    </div>
  );
}
