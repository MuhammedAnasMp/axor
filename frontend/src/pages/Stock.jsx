import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../utils/api';
import { usePagination } from '../utils/usePagination';
import PaginationControls from '../components/PaginationControls';
import MobileBottomSheet from '../components/MobileBottomSheet';
import { SkeletonTable, Spinner } from '../components/Skeleton';

export default function Stock() {
  const [searchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'current';

  // Dropdown states (unpaginated list)
  const [bankAccounts, setBankAccounts] = useState([]);
  const [dropdownsLoading, setDropdownsLoading] = useState(true);

  // Pagination hooks for each tab
  const stockPag = usePagination(api.stocks.list, 10, currentTab === 'current');
  const historyPag = usePagination(api.stockHistory.list, 10, currentTab === 'history');
  const damagedPag = usePagination(api.stockHistory.list, 10, currentTab === 'damaged', { action_type: 'Damage' });

  // Modals / Actions
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showDamageModal, setShowDamageModal] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);

  // Form states
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('Stock Count Verification');

  const [isSavingAdjust, setIsSavingAdjust] = useState(false);
  const [isSavingTransfer, setIsSavingTransfer] = useState(false);
  const [isSavingDamage, setIsSavingDamage] = useState(false);

  const [transferQty, setTransferQty] = useState('');
  const [transferFrom, setTransferFrom] = useState('Main Store');
  const [transferTo, setTransferTo] = useState('Warehouse A');

  const [damageQty, setDamageQty] = useState('');
  const [damageReason, setDamageReason] = useState('Damaged in shipment');
  const [damageBank, setDamageBank] = useState('');

  const loadDropdowns = () => {
    setDropdownsLoading(true);
    api.bankAccounts.list()
      .then((b) => {
        setBankAccounts(b);
        if (b.length > 0) setDamageBank(b[0].id.toString());
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

  const handleAdjustSubmit = (e) => {
    e.preventDefault();
    if (!selectedStock || adjustQty === '') return;
    setIsSavingAdjust(true);
    api.stocks.adjust({
      product_id: selectedStock.product,
      quantity: parseInt(adjustQty),
      description: adjustReason
    })
    .then(() => {
      setShowAdjustModal(false);
      setAdjustQty('');
      stockPag.refresh();
      historyPag.refresh();
      setIsSavingAdjust(false);
    })
    .catch((err) => {
      alert(err.message);
      setIsSavingAdjust(false);
    });
  };

  const handleTransferSubmit = (e) => {
    e.preventDefault();
    if (!selectedStock || transferQty === '') return;
    setIsSavingTransfer(true);
    api.stocks.transfer({
      product_id: selectedStock.product,
      quantity: parseInt(transferQty),
      from_desc: transferFrom,
      to_desc: transferTo
    })
    .then(() => {
      setShowTransferModal(false);
      setTransferQty('');
      stockPag.refresh();
      historyPag.refresh();
      setIsSavingTransfer(false);
    })
    .catch((err) => {
      alert(err.message);
      setIsSavingTransfer(false);
    });
  };

  const handleDamageSubmit = (e) => {
    e.preventDefault();
    if (!selectedStock || damageQty === '') return;
    setIsSavingDamage(true);
    api.stocks.damage({
      product_id: selectedStock.product,
      quantity: parseInt(damageQty),
      description: damageReason,
      bank_account_id: parseInt(damageBank)
    })
    .then(() => {
      setShowDamageModal(false);
      setDamageQty('');
      stockPag.refresh();
      historyPag.refresh();
      loadDropdowns();
      setIsSavingDamage(false);
    })
    .catch((err) => {
      alert(err.message);
      setIsSavingDamage(false);
    });
  };

  const openModal = (stock, type) => {
    setSelectedStock(stock);
    if (type === 'adjust') {
      setAdjustQty(stock.quantity.toString());
      setShowAdjustModal(true);
    } else if (type === 'transfer') {
      setShowTransferModal(true);
    } else if (type === 'damage') {
      setShowDamageModal(true);
    }
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
    currentTab === 'current' 
      ? stockPag.loading 
      : currentTab === 'damaged' 
      ? damagedPag.loading 
      : historyPag.loading;

  const renderAdjustForm = (isMobile = false) => (
    <form onSubmit={handleAdjustSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-text-secondary mb-1">New Physical Stock Quantity</label>
        <input
          type="number"
          required
          value={adjustQty}
          onChange={(e) => setAdjustQty(e.target.value)}
          className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm outline-none focus:border-brand-blue text-text-primary"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-text-secondary mb-1">Adjustment Reason</label>
        <input
          type="text"
          required
          value={adjustReason}
          onChange={(e) => setAdjustReason(e.target.value)}
          className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm outline-none focus:border-brand-blue text-text-primary"
        />
      </div>
      <div className={isMobile ? "flex flex-col space-y-2 pt-2" : "flex justify-end space-x-2 pt-2"}>
        <button
          type="button"
          onClick={() => setShowAdjustModal(false)}
          className={`rounded border border-surface-dim px-3 py-1.5 text-xs text-text-secondary hover:bg-surface-low ${isMobile ? 'w-full py-2.5 font-semibold' : ''}`}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSavingAdjust}
          className={`rounded bg-brand-blue px-3 py-1.5 text-xs text-white hover:bg-brand-cobalt flex items-center justify-center space-x-1.5 disabled:opacity-50 disabled:pointer-events-none ${isMobile ? 'w-full py-2.5 font-bold' : ''}`}
        >
          {isSavingAdjust && <Spinner size="xs" />}
          <span>{isSavingAdjust ? 'Saving...' : 'Save Count'}</span>
        </button>
      </div>
    </form>
  );

  const renderTransferForm = (isMobile = false) => (
    <form onSubmit={handleTransferSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-text-secondary mb-1">Transfer Qty</label>
        <input
          type="number"
          required
          value={transferQty}
          onChange={(e) => setTransferQty(e.target.value)}
          className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm outline-none focus:border-brand-blue text-text-primary"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-text-secondary mb-1">Source Location</label>
        <input
          type="text"
          required
          value={transferFrom}
          onChange={(e) => setTransferFrom(e.target.value)}
          className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm outline-none focus:border-brand-blue text-text-primary"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-text-secondary mb-1">Destination Location</label>
        <input
          type="text"
          required
          value={transferTo}
          onChange={(e) => setTransferTo(e.target.value)}
          className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm outline-none focus:border-brand-blue text-text-primary"
        />
      </div>
      <div className={isMobile ? "flex flex-col space-y-2 pt-2" : "flex justify-end space-x-2 pt-2"}>
        <button
          type="button"
          onClick={() => setShowTransferModal(false)}
          className={`rounded border border-surface-dim px-3 py-1.5 text-xs text-text-secondary hover:bg-surface-low ${isMobile ? 'w-full py-2.5 font-semibold' : ''}`}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSavingTransfer}
          className={`rounded bg-brand-blue px-3 py-1.5 text-xs text-white hover:bg-brand-cobalt flex items-center justify-center space-x-1.5 disabled:opacity-50 disabled:pointer-events-none ${isMobile ? 'w-full py-2.5 font-bold' : ''}`}
        >
          {isSavingTransfer && <Spinner size="xs" />}
          <span>{isSavingTransfer ? 'Transferring...' : 'Confirm Transfer'}</span>
        </button>
      </div>
    </form>
  );

  const renderDamageForm = (isMobile = false) => (
    <form onSubmit={handleDamageSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-text-secondary mb-1">Quantity Damaged</label>
        <input
          type="number"
          required
          value={damageQty}
          onChange={(e) => setDamageQty(e.target.value)}
          className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm outline-none focus:border-brand-blue text-text-primary"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-text-secondary mb-1">Damage Reason / Notes</label>
        <input
          type="text"
          required
          value={damageReason}
          onChange={(e) => setDamageReason(e.target.value)}
          className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm outline-none focus:border-brand-blue text-text-primary"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-text-secondary mb-1">Deduct Cost From Account</label>
        <select
          required
          value={damageBank}
          onChange={(e) => setDamageBank(e.target.value)}
          className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-blue"
        >
          {bankAccounts.map((b) => (
            <option key={b.id} value={b.id}>{b.name} (₹{b.balance})</option>
          ))}
        </select>
      </div>
      <div className={isMobile ? "flex flex-col space-y-2 pt-2" : "flex justify-end space-x-2 pt-2"}>
        <button
          type="button"
          onClick={() => setShowDamageModal(false)}
          className={`rounded border border-surface-dim px-3 py-1.5 text-xs text-text-secondary hover:bg-surface-low ${isMobile ? 'w-full py-2.5 font-semibold' : ''}`}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSavingDamage}
          className={`rounded bg-error px-3 py-1.5 text-xs text-white hover:bg-error-container flex items-center justify-center space-x-1.5 disabled:opacity-50 disabled:pointer-events-none ${isMobile ? 'w-full py-2.5 font-bold' : ''}`}
        >
          {isSavingDamage && <Spinner size="xs" />}
          <span>{isSavingDamage ? 'Writing Off...' : 'Write Off Stock'}</span>
        </button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-text-primary">Stock & Inventory</h2>
        <p className="text-xs text-text-secondary">Track real-time inventory levels, adjust stock counts, record transfers and damages.</p>
      </div>

      {/* Tabs Menu */}
      <div className="tabs-container border-b border-surface-low">
        <div className="tabs-scrollable space-x-6 text-sm font-medium">
          <a 
            href="/erp/stock" 
            className={`pb-2 ${currentTab === 'current' ? 'border-b-2 border-brand-blue text-brand-blue' : 'text-text-secondary'}`}
          >
            Current Stock
          </a>
          <a 
            href="/erp/stock?tab=history" 
            className={`pb-2 ${currentTab === 'history' ? 'border-b-2 border-brand-blue text-brand-blue' : 'text-text-secondary'}`}
          >
            Stock History Log
          </a>
          <a 
            href="/erp/stock?tab=damaged" 
            className={`pb-2 ${currentTab === 'damaged' ? 'border-b-2 border-brand-blue text-brand-blue' : 'text-text-secondary'}`}
          >
            Damaged Items
          </a>
        </div>
      </div>

      {/* Current Stock Tab */}
      {currentTab === 'current' && (
        <div className="space-y-6">
          {/* Low Stock Banner Alert */}
          {stockPag.data.some(s => s.quantity < 10) && (
            <div className="rounded border-l-4 border-error bg-error-container/20 p-4 text-xs font-semibold text-error">
              ⚠️ Attention: Some products have fallen below the threshold limit (10 items). Please review the inventory log below.
            </div>
          )}

          {/* Search bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-t-lg border-t border-x border-surface-low">
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                value={stockPag.search}
                onChange={(e) => stockPag.setSearch(e.target.value)}
                placeholder="Search stock by product/barcode..."
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
                  {renderSortHeader('Barcode', 'product__barcode', stockPag)}
                  {renderSortHeader('Product Name', 'product__name', stockPag)}
                  {renderSortHeader('Qty in Stock', 'quantity', stockPag)}
                  <th className="px-4 py-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-low">
                {stockPag.loading ? (
                  <SkeletonTable rows={stockPag.pageSize || 5} columns={4} />
                ) : (
                  stockPag.data.map((s) => (
                    <tr key={s.id} className="hover:bg-surface-bright">
                      <td className="px-4 py-3 font-mono text-text-secondary">{s.barcode}</td>
                      <td className="px-4 py-3 font-semibold text-text-primary">{s.product_name}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-semibold ${s.quantity < 10 ? 'text-error font-bold' : 'text-text-primary'}`}>
                          {s.quantity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center space-x-2">
                        <button
                          onClick={() => openModal(s, 'adjust')}
                          className="rounded border border-surface-dim bg-white px-2 py-1 text-[11px] font-semibold text-text-secondary hover:bg-surface-low hover:text-text-primary"
                        >
                          Adjust
                        </button>
                        <button
                          onClick={() => openModal(s, 'transfer')}
                          className="rounded border border-surface-dim bg-white px-2 py-1 text-[11px] font-semibold text-text-secondary hover:bg-surface-low hover:text-text-primary"
                        >
                          Transfer
                        </button>
                        <button
                          onClick={() => openModal(s, 'damage')}
                          className="rounded bg-error-container/10 px-2 py-1 text-[11px] font-semibold text-error hover:bg-error-container/20"
                        >
                          Log Damage
                        </button>
                      </td>
                    </tr>
                  ))
                )}
                {stockPag.data.length === 0 && !stockPag.loading && (
                  <tr>
                    <td colSpan="4" className="px-4 py-8 text-center text-text-secondary">No stock entries found.</td>
                  </tr>
                )}
              </tbody>
            </table>

            <PaginationControls
              page={stockPag.page}
              setPage={stockPag.setPage}
              pageSize={stockPag.pageSize}
              setPageSize={stockPag.setPageSize}
              totalCount={stockPag.totalCount}
              totalPages={stockPag.totalPages}
              loading={stockPag.loading}
            />
          </div>
        </div>
      )}

      {/* Stock History Tab */}
      {currentTab === 'history' && (
        <div className="space-y-6">
          {/* Search bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-t-lg border-t border-x border-surface-low">
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                value={historyPag.search}
                onChange={(e) => historyPag.setSearch(e.target.value)}
                placeholder="Search history by product/details..."
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
                  {renderSortHeader('Timestamp', 'timestamp', historyPag)}
                  {renderSortHeader('Product', 'product__name', historyPag)}
                  {renderSortHeader('Action Type', 'action_type', historyPag)}
                  {renderSortHeader('Qty Changed', 'quantity_changed', historyPag)}
                  <th className="px-4 py-2">Details / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-low">
                {historyPag.loading ? (
                  <SkeletonTable rows={historyPag.pageSize || 5} columns={5} />
                ) : (
                  historyPag.data.map((h) => (
                    <tr key={h.id} className="hover:bg-surface-bright">
                      <td className="px-4 py-3 text-text-secondary">{new Date(h.timestamp).toLocaleString()}</td>
                      <td className="px-4 py-3 font-semibold text-text-primary">{h.product_name}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-semibold ${
                          h.action_type === 'Add' ? 'bg-green-100 text-green-800' :
                          h.action_type === 'Damage' ? 'bg-red-100 text-red-800' :
                          h.action_type === 'Adjustment' ? 'bg-amber-100 text-amber-800' :
                          'bg-blue-100 text-brand-blue'
                        }`}>
                          {h.action_type}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-right font-semibold ${h.quantity_changed > 0 ? 'text-green-600' : 'text-error'}`}>
                        {h.quantity_changed > 0 ? `+${h.quantity_changed}` : h.quantity_changed}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">{h.description}</td>
                    </tr>
                  ))
                )}
                {historyPag.data.length === 0 && !historyPag.loading && (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-text-secondary">No history logs found.</td>
                  </tr>
                )}
              </tbody>
            </table>

            <PaginationControls
              page={historyPag.page}
              setPage={historyPag.setPage}
              pageSize={historyPag.pageSize}
              setPageSize={historyPag.setPageSize}
              totalCount={historyPag.totalCount}
              totalPages={historyPag.totalPages}
              loading={historyPag.loading}
            />
          </div>
        </div>
      )}

      {/* Damaged Stock Tab */}
      {currentTab === 'damaged' && (
        <div className="space-y-6">
          {/* Search bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-t-lg border-t border-x border-surface-low">
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                value={damagedPag.search}
                onChange={(e) => damagedPag.setSearch(e.target.value)}
                placeholder="Search damages by product/details..."
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
                  {renderSortHeader('Timestamp', 'timestamp', damagedPag)}
                  {renderSortHeader('Product', 'product__name', damagedPag)}
                  {renderSortHeader('Qty Damaged', 'quantity_changed', damagedPag)}
                  <th className="px-4 py-2">Damage Reason / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-low">
                {damagedPag.loading ? (
                  <SkeletonTable rows={damagedPag.pageSize || 5} columns={4} />
                ) : (
                  <>
                    {damagedPag.data.map((h) => (
                      <tr key={h.id} className="hover:bg-surface-bright">
                        <td className="px-4 py-3 text-text-secondary">{new Date(h.timestamp).toLocaleString()}</td>
                        <td className="px-4 py-3 font-semibold text-text-primary">{h.product_name}</td>
                        <td className="px-4 py-3 text-right font-semibold text-error">
                          {h.quantity_changed}
                        </td>
                        <td className="px-4 py-3 text-text-secondary">{h.description}</td>
                      </tr>
                    ))}
                    {damagedPag.data.length === 0 && (
                      <tr>
                        <td colSpan="4" className="px-4 py-8 text-center text-text-secondary">No damage logs found.</td>
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>

            <PaginationControls
              page={damagedPag.page}
              setPage={damagedPag.setPage}
              pageSize={damagedPag.pageSize}
              setPageSize={damagedPag.setPageSize}
              totalCount={damagedPag.totalCount}
              totalPages={damagedPag.totalPages}
              loading={damagedPag.loading}
            />
          </div>
        </div>
      )}

      {/* Adjust Stock Controls */}
      {showAdjustModal && (
        <div className="hidden md:flex fixed inset-0 z-50 items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Adjust Stock Count: {selectedStock?.product_name}</h3>
            {renderAdjustForm(false)}
          </div>
        </div>
      )}
      <MobileBottomSheet
        isOpen={showAdjustModal}
        onClose={() => setShowAdjustModal(false)}
        title={`Adjust Stock: ${selectedStock?.product_name}`}
      >
        {renderAdjustForm(true)}
      </MobileBottomSheet>

      {/* Transfer Stock Controls */}
      {showTransferModal && (
        <div className="hidden md:flex fixed inset-0 z-50 items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Stock Location Transfer: {selectedStock?.product_name}</h3>
            {renderTransferForm(false)}
          </div>
        </div>
      )}
      <MobileBottomSheet
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        title={`Stock Transfer: ${selectedStock?.product_name}`}
      >
        {renderTransferForm(true)}
      </MobileBottomSheet>

      {/* Log Damage Controls */}
      {showDamageModal && (
        <div className="hidden md:flex fixed inset-0 z-50 items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
            <h3 className="text-sm font-semibold text-text-primary mb-2">Record Damage & Expense: {selectedStock?.product_name}</h3>
            <p className="text-[11px] text-text-secondary mb-4">
              Marks stock as lost and automatically writes off a corresponding expense from the selected account (cost = WAC per item).
            </p>
            {renderDamageForm(false)}
          </div>
        </div>
      )}
      <MobileBottomSheet
        isOpen={showDamageModal}
        onClose={() => setShowDamageModal(false)}
        title={`Log Damage: ${selectedStock?.product_name}`}
      >
        {renderDamageForm(true)}
      </MobileBottomSheet>
    </div>
  );
}
