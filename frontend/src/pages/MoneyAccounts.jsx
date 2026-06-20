import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../utils/api';
import { usePagination } from '../utils/usePagination';
import PaginationControls from '../components/PaginationControls';
import { SkeletonTable, Spinner } from '../components/Skeleton';

export default function MoneyAccounts() {
  const [searchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'accounts';

  // Dropdown/Card states (unpaginated list)
  const [accounts, setAccounts] = useState([]);
  const [dropdownsLoading, setDropdownsLoading] = useState(true);

  // Action loading states
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);

  // Pagination hooks for each tab's table
  const transferPag = usePagination(api.transfers.list, 10, currentTab === 'transfers');

  // Form states - Bank
  const [showBankForm, setShowBankForm] = useState(false);
  const [bankName, setBankName] = useState('');
  const [bankBalance, setBankBalance] = useState('0');

  // Form states - Transfer
  const [transferSource, setTransferSource] = useState('');
  const [transferDest, setTransferDest] = useState('');
  const [transferAmount, setTransferAmount] = useState('');

  const loadDropdowns = () => {
    setDropdownsLoading(true);
    api.bankAccounts.list()
      .then((b) => {
        setAccounts(b);

        if (b.length > 0) {
          setTransferSource(b[0].id.toString());
          setTransferDest(b.length > 1 ? b[1].id.toString() : b[0].id.toString());
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

  const handleBankSubmit = (e) => {
    e.preventDefault();
    setIsCreatingAccount(true);
    api.bankAccounts.create({ name: bankName, balance: parseFloat(bankBalance) })
      .then(() => {
        setShowBankForm(false);
        setBankName('');
        setBankBalance('0');
        loadDropdowns();
      })
      .catch((err) => alert(err.message))
      .finally(() => setIsCreatingAccount(false));
  };

  const handleTransferSubmit = (e) => {
    e.preventDefault();
    if (transferSource === transferDest) {
      alert('Source and destination accounts must be different.');
      return;
    }

    setIsTransferring(true);
    api.bankAccounts.transfer({
      source_account_id: parseInt(transferSource),
      dest_account_id: parseInt(transferDest),
      amount: parseFloat(transferAmount)
    })
      .then(() => {
        setTransferAmount('');
        alert('Money Transferred Successfully!');
        transferPag.refresh();
        loadDropdowns();
      })
      .catch((err) => alert(err.message))
      .finally(() => setIsTransferring(false));
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(val);
  };

  const renderSortHeader = (label, field, pag) => {
    const isSorted = pag.ordering === field || pag.ordering === `-${field}`;
    const isDesc = pag.ordering === `-${field}`;
    return (
      <th
        onClick={() => pag.handleSort(field)}
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
    currentTab === 'transfers' ? transferPag.loading :
      dropdownsLoading;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-text-primary">Money & Accounts</h2>
        <p className="text-xs text-text-secondary">Manage capital settings, owner equity, bank accounts, and non-sales income.</p>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-surface-low space-x-6 text-sm font-medium">
        <a
          href="/erp/accounts"
          className={`pb-2 ${currentTab === 'accounts' ? 'border-b-2 border-brand-blue text-brand-blue' : 'text-text-secondary'}`}
        >
          Cash & Banks
        </a>
        <a
          href="/erp/accounts?tab=transfers"
          className={`pb-2 ${currentTab === 'transfers' ? 'border-b-2 border-brand-blue text-brand-blue' : 'text-text-secondary'}`}
        >
          Transfers Log
        </a>
      </div>

      {/* Cash & Banks Tab */}
      {currentTab === 'accounts' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Bank Accounts Grid */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-primary">Financial Account Balances .</h3>
              <button
                onClick={() => setShowBankForm(!showBankForm)}
                className="rounded bg-brand-blue px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-cobalt"
              >
                {showBankForm ? 'Cancel' : '+ New Account'}
              </button>
            </div>

            {showBankForm && (
              <form onSubmit={handleBankSubmit} className="rounded-lg bg-white p-6 shadow-sm border border-surface-low space-y-4">
                <h4 className="text-xs font-semibold text-text-primary">Add Bank Account</h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">Account Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., ICICI Current Account"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm outline-none focus:border-brand-blue"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">Opening Balance (INR)</label>
                    <input
                      type="number"
                      required
                      value={bankBalance}
                      onChange={(e) => setBankBalance(e.target.value)}
                      className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm outline-none focus:border-brand-blue"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isCreatingAccount}
                  className="rounded bg-brand-blue px-4 py-2 text-xs font-semibold text-white hover:bg-brand-cobalt disabled:opacity-50 flex items-center space-x-1"
                >
                  {isCreatingAccount && <Spinner size="xs" />}
                  <span>Create Account</span>
                </button>
              </form>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {dropdownsLoading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className="rounded bg-white p-5 shadow-sm border border-surface-low flex items-center justify-between animate-pulse">
                    <div className="space-y-2">
                      <div className="h-3.5 w-24 bg-surface-dim/50 rounded" />
                      <div className="h-6 w-32 bg-surface-dim/50 rounded" />
                    </div>
                    <div className="h-10 w-10 bg-surface-dim/50 rounded-full" />
                  </div>
                ))
              ) : (
                accounts.map((b) => (
                  <div key={b.id} className="rounded bg-white p-5 shadow-sm border border-surface-low flex items-center justify-between">
                    <div>
                      <span className="text-xs text-text-secondary uppercase tracking-wider font-semibold">{b.name}</span>
                      <div className="text-xl font-bold text-text-primary mt-1">{formatCurrency(b.balance)}</div>
                    </div>
                    <div className="rounded-full bg-accent-blue/15 p-2 text-brand-blue">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Inter-Account Money Transfer */}
          <div className="rounded-lg bg-white p-6 shadow-sm border border-surface-low h-fit space-y-4" style={{ boxShadow: '0px 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 className="text-sm font-semibold text-text-primary">Transfer Money</h3>
            <form onSubmit={handleTransferSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Source Account</label>
                <select
                  value={transferSource}
                  onChange={(e) => setTransferSource(e.target.value)}
                  className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm outline-none focus:border-brand-blue"
                  disabled={dropdownsLoading || isTransferring}
                >
                  {accounts.map((b) => (
                    <option key={b.id} value={b.id}>{b.name} (₹{b.balance})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Destination Account</label>
                <select
                  value={transferDest}
                  onChange={(e) => setTransferDest(e.target.value)}
                  className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm outline-none focus:border-brand-blue"
                  disabled={dropdownsLoading || isTransferring}
                >
                  {accounts.map((b) => (
                    <option key={b.id} value={b.id}>{b.name} (₹{b.balance})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Transfer Amount (INR)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm outline-none focus:border-brand-blue"
                  disabled={isTransferring}
                />
              </div>
              <button
                type="submit"
                disabled={isTransferring || dropdownsLoading}
                className="w-full flex items-center justify-center space-x-2 rounded bg-brand-blue py-2 text-sm font-semibold text-white hover:bg-brand-cobalt transition disabled:opacity-50"
              >
                {isTransferring && <Spinner size="sm" />}
                <span>Post Transfer</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Money Transfers Tab */}
      {currentTab === 'transfers' && (
        <div className="space-y-4">
          {/* Search and Loading */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-t-lg border-t border-x border-surface-low">
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                value={transferPag.search}
                onChange={(e) => transferPag.setSearch(e.target.value)}
                placeholder="Search transfers by account name..."
                className="w-full rounded border border-surface-dim bg-white pl-9 pr-3 py-2 text-xs text-text-primary outline-none focus:border-brand-blue placeholder:text-text-secondary"
              />
              <span className="absolute left-3 top-2.5 text-text-secondary">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
            </div>
            {activeLoading && (
              <span className="text-xs text-brand-blue animate-pulse">Loading...</span>
            )}
          </div>

          <div className="rounded-b-lg bg-white border-x border-b border-surface-low overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-surface-low text-text-secondary font-semibold uppercase">
                <tr>
                  {renderSortHeader('Timestamp', 'timestamp', transferPag)}
                  <th className="px-4 py-2">Source Account</th>
                  <th className="px-4 py-2">Destination Account</th>
                  {renderSortHeader('Amount', 'amount', transferPag)}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-low">
                {transferPag.loading ? (
                  <SkeletonTable rows={5} columns={4} />
                ) : (
                  transferPag.data.map((t) => (
                    <tr key={t.id} className="hover:bg-surface-bright">
                      <td className="px-4 py-3 text-text-secondary">{new Date(t.timestamp).toLocaleString()}</td>
                      <td className="px-4 py-3 font-medium text-text-primary">{t.source_name}</td>
                      <td className="px-4 py-3 font-medium text-text-primary">{t.dest_name}</td>
                      <td className="px-4 py-3 text-right font-semibold text-text-primary">{formatCurrency(t.amount)}</td>
                    </tr>
                  ))
                )}
                {transferPag.data.length === 0 && !transferPag.loading && (
                  <tr>
                    <td colSpan="4" className="px-4 py-8 text-center text-text-secondary">No transfer history found.</td>
                  </tr>
                )}
              </tbody>
            </table>

            <PaginationControls
              page={transferPag.page}
              setPage={transferPag.setPage}
              pageSize={transferPag.pageSize}
              setPageSize={transferPag.setPageSize}
              totalCount={transferPag.totalCount}
              totalPages={transferPag.totalPages}
              loading={transferPag.loading}
            />
          </div>
        </div>
      )}
    </div>
  );
}
