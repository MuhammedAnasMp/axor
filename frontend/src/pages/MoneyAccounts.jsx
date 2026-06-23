import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../utils/api';
import { usePagination } from '../utils/usePagination';
import PaginationControls from '../components/PaginationControls';
import FloatingActionButton from '../components/FloatingActionButton';
import MobileBottomSheet from '../components/MobileBottomSheet';
import { SkeletonTable, Spinner } from '../components/Skeleton';

export default function MoneyAccounts() {
  const [searchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'accounts';

  // Dropdown/Card states (unpaginated list)
  const [accounts, setAccounts] = useState([]);
  const [dropdownsLoading, setDropdownsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [selectedTransfer, setSelectedTransfer] = useState(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Action loading states
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [activeMobileForm, setActiveMobileForm] = useState(null);

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

  const renderSortHeader = (label, field, pag, isRight = false) => {
    const isSorted = pag.ordering === field || pag.ordering === `-${field}`;
    const isDesc = pag.ordering === `-${field}`;
    return (
      <th
        onClick={() => pag.handleSort(field)}
        className={`px-4 py-4 cursor-pointer hover:bg-surface-low select-none transition-colors ${isRight ? 'text-right' : 'text-left'}`}
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
    currentTab === 'transfers' ? transferPag.loading :
      dropdownsLoading;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="hidden md:block">
        <h2 className="text-2xl font-semibold tracking-tight text-text-primary">Money & Accounts</h2>
        <p className="text-xs text-text-secondary">Manage capital settings, owner equity, bank accounts, and non-sales income.</p>
      </div>

      {/* Tabs Menu */}
      <div className="hidden md:flex border-b border-surface-low space-x-6 text-sm font-medium">
        <Link
          to="/erp/accounts"
          className={`pb-2 ${currentTab === 'accounts' ? 'border-b-2 border-brand-blue text-brand-blue' : 'text-text-secondary'}`}
        >
          Cash & Banks
        </Link>
        <Link
          to="/erp/accounts?tab=transfers"
          className={`pb-2 ${currentTab === 'transfers' ? 'border-b-2 border-brand-blue text-brand-blue' : 'text-text-secondary'}`}
        >
          Transfers Log
        </Link>
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
                className="hidden md:block rounded bg-brand-blue px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-cobalt"
              >
                {showBankForm ? 'Cancel' : '+ New Account'}
              </button>
            </div>

            {showBankForm && (
              <form onSubmit={handleBankSubmit} className="hidden md:block rounded-lg bg-white p-6 shadow-sm border border-surface-low space-y-4">
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
          <div className="hidden md:block rounded-lg bg-white p-6 shadow-sm border border-surface-low h-fit space-y-4" style={{ boxShadow: '0px 1px 3px rgba(0,0,0,0.1)' }}>
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
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 md:bg-white md:p-4 md:rounded-t-lg md:border-t md:border-x md:border-surface-low bg-transparent p-0 border-none">
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                value={transferPag.search}
                onChange={(e) => transferPag.setSearch(e.target.value)}
                placeholder="Search transfers by account name..."
                className="w-full rounded border border-surface-dim bg-white pl-9 pr-3 py-3 md:py-2 text-sm md:text-xs text-text-primary outline-none focus:border-brand-blue placeholder:text-text-secondary search-input-mobile"
              />
              <span className="absolute left-3 top-3.5 md:top-2.5 text-text-secondary">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
            </div>
            {activeLoading && (
              <span className="text-xs text-brand-blue animate-pulse">Loading...</span>
            )}
          </div>

          <div className="md:rounded-b-lg md:bg-white md:border-x md:border-b md:border-surface-low bg-transparent border-none overflow-x-auto">
            {isMobile ? (
              <div className="space-y-3 pt-2">
                {transferPag.loading ? (
                  <div className="space-y-3 animate-pulse">
                    <div className="h-20 bg-surface-dim/40 rounded-xl" />
                    <div className="h-20 bg-surface-dim/40 rounded-xl" />
                  </div>
                ) : (
                  transferPag.data.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTransfer(t)}
                      className="rounded-lg border border-surface-low bg-white p-3 shadow-sm active:bg-surface-low transition-colors"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-text-primary text-sm">
                          {t.source_name} → {t.dest_name}
                        </span>
                        <span className="font-bold text-brand-blue text-sm">
                          {formatCurrency(t.amount)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-text-secondary">
                        <span>Transfer</span>
                        <span>{new Date(t.timestamp).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                )}
                {transferPag.data.length === 0 && !transferPag.loading && (
                  <div className="text-center py-8 text-text-secondary text-sm">No transfer history found.</div>
                )}
              </div>
            ) : (
              <table className="min-w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-surface-low text-text-secondary font-semibold uppercase text-xs tracking-wider">
                  <tr>
                    {renderSortHeader('Timestamp', 'timestamp', transferPag)}
                    <th className="px-4 py-4">Source Account</th>
                    <th className="px-4 py-4">Destination Account</th>
                    {renderSortHeader('Amount', 'amount', transferPag, true)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-low">
                  {transferPag.loading ? (
                    <SkeletonTable rows={5} columns={4} />
                  ) : (
                    transferPag.data.map((t) => (
                      <tr
                        key={t.id}
                        onClick={() => setSelectedTransfer(t)}
                        className="hover:bg-surface-bright cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-4 text-text-secondary">{new Date(t.timestamp).toLocaleString()}</td>
                        <td className="px-4 py-4 font-semibold text-text-primary">{t.source_name}</td>
                        <td className="px-4 py-4 font-semibold text-text-primary">{t.dest_name}</td>
                        <td className="px-4 py-4 text-right font-semibold text-brand-blue">{formatCurrency(t.amount)}</td>
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
            )}

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
              setBankName('');
              setBankBalance('0');
              setActiveMobileForm('bank');
            }}
            className="w-full flex items-center space-x-3 p-4 rounded-xl border border-surface-low hover:bg-surface-low text-left text-sm font-medium text-text-primary transition"
          >
            <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-brand-blue/10 text-brand-blue">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div>
              <div className="font-semibold">Create Account</div>
              <div className="text-xs text-text-secondary">Add a new bank or cash account</div>
            </div>
          </button>

          <button
            onClick={() => {
              setShowCreateMenu(false);
              setTransferAmount('');
              if (accounts.length > 0) {
                setTransferSource(accounts[0].id.toString());
                setTransferDest(accounts.length > 1 ? accounts[1].id.toString() : accounts[0].id.toString());
              }
              setActiveMobileForm('transfer');
            }}
            className="w-full flex items-center space-x-3 p-4 rounded-xl border border-surface-low hover:bg-surface-low text-left text-sm font-medium text-text-primary transition"
          >
            <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-green-600/10 text-green-600">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <div>
              <div className="font-semibold">Transfer Money</div>
              <div className="text-xs text-text-secondary">Transfer money between accounts</div>
            </div>
          </button>
        </div>
      </MobileBottomSheet>

      {/* Mobile Forms Bottom Sheets */}
      <MobileBottomSheet
        isOpen={activeMobileForm === 'bank'}
        onClose={() => setActiveMobileForm(null)}
        title="Add Bank Account"
      >
        <form onSubmit={(e) => {
          e.preventDefault();
          setIsCreatingAccount(true);
          api.bankAccounts.create({ name: bankName, balance: parseFloat(bankBalance) })
            .then(() => {
              setBankName('');
              setBankBalance('0');
              loadDropdowns();
              setActiveMobileForm(null);
            })
            .catch((err) => alert(err.message))
            .finally(() => setIsCreatingAccount(false));
        }} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Account Name</label>
            <input
              type="text"
              required
              placeholder="e.g., ICICI Current Account"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-blue"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Opening Balance (INR)</label>
            <input
              type="number"
              required
              value={bankBalance}
              onChange={(e) => setBankBalance(e.target.value)}
              className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-blue"
            />
          </div>
          <button
            type="submit"
            disabled={isCreatingAccount}
            className="w-full rounded bg-brand-blue py-2.5 text-xs font-semibold text-white hover:bg-brand-cobalt transition flex items-center justify-center space-x-1.5 disabled:opacity-50 disabled:pointer-events-none"
          >
            {isCreatingAccount && <Spinner size="xs" />}
            <span>Create Account</span>
          </button>
        </form>
      </MobileBottomSheet>

      <MobileBottomSheet
        isOpen={activeMobileForm === 'transfer'}
        onClose={() => setActiveMobileForm(null)}
        title="Transfer Money"
      >
        <form onSubmit={(e) => {
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
              setActiveMobileForm(null);
            })
            .catch((err) => alert(err.message))
            .finally(() => setIsTransferring(false));
        }} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Source Account</label>
            <select
              value={transferSource}
              onChange={(e) => setTransferSource(e.target.value)}
              className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-blue"
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
              className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-blue"
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
              className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-blue"
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
      </MobileBottomSheet>

      {/* Detail Modal (Desktop) & Bottom Sheet (Mobile) */}
      {selectedTransfer && (
        <>
          {/* Desktop Center Modal */}
          <div className="hidden md:flex fixed inset-0 z-50 items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl relative border border-surface-low">
              <button
                onClick={() => setSelectedTransfer(null)}
                className="absolute top-4 right-4 text-text-secondary hover:text-text-primary p-1 rounded-full hover:bg-surface-low transition cursor-pointer"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="mb-4">
                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  Internal Transfer
                </span>
                <h3 className="text-base font-bold text-text-primary mt-2">Transfer Details</h3>
              </div>

              <div className="space-y-3.5 text-sm">
                <div className="grid grid-cols-2 gap-4 border-b border-surface-low pb-2">
                  <div>
                    <span className="block text-[11px] font-semibold text-text-secondary">Amount</span>
                    <span className="font-extrabold text-lg block mt-1.5 text-brand-blue">
                      {formatCurrency(selectedTransfer.amount)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-semibold text-text-secondary">Timestamp</span>
                    <span className="font-semibold text-text-primary block mt-1.5">
                      {new Date(selectedTransfer.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-[11px] font-semibold text-text-secondary">Source Account</span>
                    <span className="font-bold text-text-primary block mt-1.5">
                      {selectedTransfer.source_name}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-semibold text-text-secondary">Destination Account</span>
                    <span className="font-bold text-text-primary block mt-1.5">
                      {selectedTransfer.dest_name}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Bottom Sheet Detail */}
          <MobileBottomSheet
            isOpen={!!selectedTransfer}
            onClose={() => setSelectedTransfer(null)}
            title="Transfer Details"
          >
            <div className="space-y-4 pb-6 text-sm">
              <div className="flex justify-between items-center bg-surface-low/50 p-3 rounded-xl">
                <div>
                  <span className="block text-[10px] font-semibold text-text-secondary uppercase">Amount</span>
                  <span className="font-extrabold text-xl text-brand-blue">
                    {formatCurrency(selectedTransfer.amount)}
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">
                  Transfer
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-[10px] font-semibold text-text-secondary uppercase">Source Account</span>
                  <span className="font-bold text-text-primary block mt-0.5">
                    {selectedTransfer.source_name}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-semibold text-text-secondary uppercase">Destination Account</span>
                  <span className="font-bold text-text-primary block mt-0.5">
                    {selectedTransfer.dest_name}
                  </span>
                </div>
              </div>

              <div>
                <span className="block text-[10px] font-semibold text-text-secondary uppercase">Timestamp</span>
                <span className="font-semibold text-text-primary block mt-0.5">
                  {new Date(selectedTransfer.timestamp).toLocaleString()}
                </span>
              </div>
            </div>
          </MobileBottomSheet>
        </>
      )}

      {/* Floating Action Button for mobile */}
      {((currentTab === 'accounts' || currentTab === 'transfers') && !activeMobileForm) && (
        <FloatingActionButton
          icon={
            currentTab === 'accounts' ? (
              <div className="relative">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <span className="absolute -top-1.5 -right-1.5 bg-white text-brand-blue rounded-full text-[9px] font-black h-4 w-4 flex items-center justify-center border border-brand-blue shadow-xs">+</span>
              </div>
            ) : currentTab === 'transfers' ? (
              <div className="relative">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                <span className="absolute -top-1.5 -right-1.5 bg-white text-brand-blue rounded-full text-[9px] font-black h-4 w-4 flex items-center justify-center border border-brand-blue shadow-xs">+</span>
              </div>
            ) : null
          }
          onClick={() => {
            if (currentTab === 'accounts') {
              setBankName('');
              setBankBalance('0');
              setActiveMobileForm('bank');
            } else if (currentTab === 'transfers') {
              setTransferAmount('');
              if (accounts.length > 0) {
                setTransferSource(accounts[0].id.toString());
                setTransferDest(accounts.length > 1 ? accounts[1].id.toString() : accounts[0].id.toString());
              }
              setActiveMobileForm('transfer');
            }
          }}
        />
      )}
    </div>
  );
}
