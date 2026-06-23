import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../utils/api';
import { usePagination } from '../utils/usePagination';
import PaginationControls from '../components/PaginationControls';
import MobileBottomSheet from '../components/MobileBottomSheet';
import { SkeletonTable, Spinner } from '../components/Skeleton';
import FloatingActionButton from '../components/FloatingActionButton';

export default function Stock() {
  const [searchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'current';
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [selectedStockDetails, setSelectedStockDetails] = useState(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  // Mobile FAB options states
  const [showStockMenu, setShowStockMenu] = useState(false);
  const [prodSearch, setProdSearch] = useState('');
  const [prodResults, setProdResults] = useState([]);
  const [prodSearching, setProdSearching] = useState(false);
  const [showProdDropdown, setShowProdDropdown] = useState(false);
  const prodDropdownRef = useRef(null);

  const resetFormStates = () => {
    setSelectedStock(null);
    setProdSearch('');
    setProdResults([]);
    setShowProdDropdown(false);
    setAdjustQty('');
    setTransferQty('');
    setDamageQty('');
  };

  const closeAdjust = () => {
    setShowAdjustModal(false);
    resetFormStates();
  };
  const closeTransfer = () => {
    setShowTransferModal(false);
    resetFormStates();
  };
  const closeDamage = () => {
    setShowDamageModal(false);
    resetFormStates();
  };

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

  useEffect(() => {
    function handleClickOutside(event) {
      if (prodDropdownRef.current && !prodDropdownRef.current.contains(event.target)) {
        setShowProdDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!prodSearch.trim()) {
      setProdResults([]);
      return;
    }
    setProdSearching(true);
    const delayDebounce = setTimeout(() => {
      api.stocks.list({ search: prodSearch })
        .then((res) => {
          const list = (res && res.results) || (Array.isArray(res) && res) || [];
          setProdResults(list);
          setProdSearching(false);
        })
        .catch((err) => {
          console.error(err);
          setProdSearching(false);
        });
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [prodSearch]);

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
        resetFormStates();
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
        resetFormStates();
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
        resetFormStates();
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
        className="px-4 py-3 cursor-pointer hover:bg-surface-low select-none transition-colors"
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

  const renderProductSelector = () => (
    <div ref={prodDropdownRef} className="relative">
      <label className="block text-xs font-semibold text-text-secondary mb-1">Select Product</label>
      <div className="relative">
        <input
          type="text"
          placeholder="Search product in stock..."
          value={prodSearch}
          onChange={(e) => {
            setProdSearch(e.target.value);
            setShowProdDropdown(true);
          }}
          onFocus={() => setShowProdDropdown(true)}
          className="w-full rounded border border-surface-dim bg-white pl-3 pr-8 py-2 text-sm text-text-primary outline-none focus:border-brand-blue"
          required
        />
        {prodSearching && (
          <span className="absolute right-8 top-2.5 text-[10px] text-brand-blue animate-pulse">Searching...</span>
        )}
      </div>
      {showProdDropdown && prodResults.length > 0 && (
        <div className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-black/5 focus:outline-none border border-surface-dim">
          {prodResults.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setSelectedStock(s);
                setProdSearch(`${s.product_name} (${s.barcode})`);
                setShowProdDropdown(false);
                if (showAdjustModal) {
                  setAdjustQty(s.quantity.toString());
                }
              }}
              className="w-full text-left px-3 py-2 hover:bg-surface-low text-text-primary font-medium border-b border-surface-lowest last:border-0"
            >
              <div>
                <span className="font-semibold text-xs">{s.product_name}</span> <span className="text-[10px] text-text-secondary">({s.barcode}) - Stock: {s.quantity}</span>
                {s.suitable_models_details && s.suitable_models_details.length > 0 && (
                  <div className="flex flex-wrap gap-0.5 mt-0.5">
                    {s.suitable_models_details.map((m) => (
                      <span key={m.id} className="inline-block px-1 py-0.5 rounded bg-brand-blue/10 text-brand-blue text-[8px] font-semibold">
                        {m.brand_name} {m.model_name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const renderAdjustForm = (isMobile = false) => (
    <form onSubmit={handleAdjustSubmit} className="space-y-4">
      {!selectedStock && renderProductSelector()}
      {selectedStock && (
        <div className="text-xs text-text-secondary bg-surface-low p-2.5 rounded border border-surface-dim">
          Selected: <strong className="text-text-primary">{selectedStock.product_name}</strong> ({selectedStock.barcode})
        </div>
      )}
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
          onClick={closeAdjust}
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
      {!selectedStock && renderProductSelector()}
      {selectedStock && (
        <div className="text-xs text-text-secondary bg-surface-low p-2.5 rounded border border-surface-dim">
          Selected: <strong className="text-text-primary">{selectedStock.product_name}</strong> ({selectedStock.barcode})
        </div>
      )}
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
          onClick={closeTransfer}
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
      {!selectedStock && renderProductSelector()}
      {selectedStock && (
        <div className="text-xs text-text-secondary bg-surface-low p-2.5 rounded border border-surface-dim">
          Selected: <strong className="text-text-primary">{selectedStock.product_name}</strong> ({selectedStock.barcode})
        </div>
      )}
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
          onClick={closeDamage}
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
    <div className="space-y-4 md:space-y-6">
      {/* Title */}
      {!isMobile && (
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-text-primary">Stock & Inventory</h2>
          <p className="text-xs text-text-secondary">Track real-time inventory levels, adjust stock counts, record transfers and damages.</p>
        </div>
      )}

      {/* Tabs Menu */}
      {!isMobile && (
        <div className="hidden md:block tabs-container border-b border-surface-low">
          <div className="tabs-scrollable space-x-6 text-sm font-medium">
            <Link
              to="/erp/stock"
              className={`pb-2 ${currentTab === 'current' ? 'border-b-2 border-brand-blue text-brand-blue' : 'text-text-secondary'}`}
            >
              Current Stock
            </Link>
            <Link
              to="/erp/stock?tab=history"
              className={`pb-2 ${currentTab === 'history' ? 'border-b-2 border-brand-blue text-brand-blue' : 'text-text-secondary'}`}
            >
              Stock History Log
            </Link>
            <Link
              to="/erp/stock?tab=damaged"
              className={`pb-2 ${currentTab === 'damaged' ? 'border-b-2 border-brand-blue text-brand-blue' : 'text-text-secondary'}`}
            >
              Damaged Items
            </Link>
          </div>
        </div>
      )}

      {/* Current Stock Tab */}
      {currentTab === 'current' && (
        <div className="space-y-4 md:space-y-6">
          {/* Low Stock Banner Alert */}
          {stockPag.data.some(s => s.quantity < 10) && (
            <div className="rounded border-l-4 border-error bg-error-container/20 p-4 text-xs font-semibold text-error">
              ⚠️ Attention: Some products have fallen below the threshold limit (10 items). Please review the inventory log below.
            </div>
          )}

          {/* Search bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 md:bg-white md:p-4 md:rounded-t-lg md:border-t md:border-x md:border-surface-low bg-transparent p-0 border-none">
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                value={stockPag.search}
                onChange={(e) => stockPag.setSearch(e.target.value)}
                placeholder="Search stock by product/barcode..."
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

          {isMobile ? (
            <div className="space-y-3 md:pt-2">
              {stockPag.loading ? (
                <div className="p-3 space-y-4">
                  {[1, 2, 3, 4, 5].map((idx) => (
                    <div key={idx} className="animate-pulse space-y-2">
                      <div className="h-4 bg-surface-low rounded w-3/4"></div>
                      <div className="h-3 bg-surface-low rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : (
                stockPag.data.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => setSelectedStockDetails(s)}
                    className="rounded-lg border border-surface-low bg-white p-3.5 shadow-sm active:bg-surface-low transition-colors cursor-pointer space-y-2 text-sm"
                  >
                    {/* Row 1: Product Name, Stock Qty */}
                    <div className="flex justify-between items-start gap-3">
                      <div className="min-w-0">
                        <div className="font-bold text-text-primary truncate">{s.product_name}</div>
                        {s.suitable_models_details && s.suitable_models_details.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {s.suitable_models_details.map((m) => (
                              <span key={m.id} className="inline-block px-1.5 py-0.5 rounded bg-brand-blue/10 text-brand-blue text-[10px] font-semibold">
                                {m.brand_name} {m.model_name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded ${s.quantity < 10 ? 'bg-red-50 text-error border border-error/10' : 'bg-green-50 text-green-700 border border-green-700/10'
                          }`}>
                          Qty: {s.quantity}
                        </span>
                      </div>
                    </div>

                    {/* Row 2: Barcode, Actions */}
                    <div className="flex justify-between items-center pt-2 border-t border-dashed border-surface-low text-xs">
                      <span className="font-mono text-text-secondary">{s.barcode}</span>
                      <div className="flex space-x-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => openModal(s, 'adjust')}
                          className="rounded border border-surface-dim bg-white px-2.5 py-1 text-xs font-semibold text-text-secondary hover:bg-surface-low"
                        >
                          Adjust
                        </button>
                        <button
                          onClick={() => openModal(s, 'transfer')}
                          className="rounded border border-surface-dim bg-white px-2.5 py-1 text-xs font-semibold text-text-secondary hover:bg-surface-low"
                        >
                          Transfer
                        </button>
                        <button
                          onClick={() => openModal(s, 'damage')}
                          className="rounded bg-error-container/10 px-2.5 py-1 text-xs font-semibold text-error hover:bg-error-container/20"
                        >
                          Damage
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
              {stockPag.data.length === 0 && !stockPag.loading && (
                <div className="p-8 text-center text-sm text-text-secondary">No stock entries found.</div>
              )}
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
          ) : (
            <div className="rounded-b-lg bg-white border-x border-b border-surface-low overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-surface-low text-text-secondary font-semibold uppercase">
                  <tr>
                    {renderSortHeader('Barcode', 'product__barcode', stockPag)}
                    {renderSortHeader('Product Name', 'product__name', stockPag)}
                    {renderSortHeader('Qty in Stock', 'quantity', stockPag)}
                    <th className="hidden md:table-cell px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-low">
                  {stockPag.loading ? (
                    <SkeletonTable rows={stockPag.pageSize || 5} columns={4} />
                  ) : (
                    stockPag.data.map((s) => (
                      <tr key={s.id} className="hover:bg-surface-bright">
                        <td className="px-4 py-4 font-mono text-text-secondary">{s.barcode}</td>
                        <td className="px-4 py-4 font-semibold text-text-primary">
                          <div>
                            <span>{s.product_name}</span>
                            {s.suitable_models_details && s.suitable_models_details.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {s.suitable_models_details.map((m) => (
                                  <span key={m.id} className="inline-block px-1.5 py-0.5 rounded bg-brand-blue/10 text-brand-blue text-[10px] font-semibold">
                                    {m.brand_name} {m.model_name}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span className={`font-semibold ${s.quantity < 10 ? 'text-error font-bold' : 'text-text-primary'}`}>
                            {s.quantity}
                          </span>
                        </td>
                        <td className="hidden md:table-cell px-4 py-4 text-center space-x-2">
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
          )}
        </div>
      )}

      {/* Stock History Tab */}
      {currentTab === 'history' && (
        <div className="space-y-4 md:space-y-6">
          {/* Search bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 md:bg-white md:p-4 md:rounded-t-lg md:border-t md:border-x md:border-surface-low bg-transparent p-0 border-none">
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                value={historyPag.search}
                onChange={(e) => historyPag.setSearch(e.target.value)}
                placeholder="Search history by product/details..."
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

          {isMobile ? (
            <div className="space-y-3 md:pt-2">
              {historyPag.loading ? (
                <div className="p-3 space-y-4">
                  {[1, 2, 3, 4, 5].map((idx) => (
                    <div key={idx} className="animate-pulse space-y-2">
                      <div className="h-4 bg-surface-low rounded w-3/4"></div>
                      <div className="h-3 bg-surface-low rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : (
                historyPag.data.map((h) => (
                  <div
                    key={h.id}
                    onClick={() => setSelectedStockDetails({ ...h, isHistory: true })}
                    className="rounded-lg border border-surface-low bg-white p-3.5 shadow-sm active:bg-surface-low transition-colors cursor-pointer space-y-2 text-sm"
                  >
                    {/* Row 1: Product Name, Qty Changed */}
                    <div className="flex justify-between items-start gap-3">
                      <div className="min-w-0">
                        <div className="font-bold text-text-primary truncate">{h.product_name}</div>
                        {h.suitable_models_details && h.suitable_models_details.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {h.suitable_models_details.map((m) => (
                              <span key={m.id} className="inline-block px-1.5 py-0.5 rounded bg-brand-blue/10 text-brand-blue text-[10px] font-semibold">
                                {m.brand_name} {m.model_name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded ${h.quantity_changed > 0 ? 'bg-green-50 text-green-700 border border-green-700/10' : 'bg-red-50 text-error border border-error/10'
                          }`}>
                          {h.quantity_changed > 0 ? `+${h.quantity_changed}` : h.quantity_changed}
                        </span>
                      </div>
                    </div>

                    {/* Row 2: Action Type, Timestamp, Details */}
                    <div className="flex justify-between items-center pt-2 border-t border-dashed border-surface-low text-xs text-text-secondary">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold ${h.action_type === 'Add' ? 'bg-green-100 text-green-800' :
                          h.action_type === 'Damage' ? 'bg-red-100 text-red-800' :
                            h.action_type === 'Adjustment' ? 'bg-amber-100 text-amber-800' :
                              'bg-blue-100 text-brand-blue'
                          }`}>
                          {h.action_type}
                        </span>
                        <span className="text-[11px]">
                          {new Date(h.timestamp).toLocaleDateString()} {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <span className="truncate max-w-[120px] text-[11px]">{h.description}</span>
                    </div>
                  </div>
                ))
              )}
              {historyPag.data.length === 0 && !historyPag.loading && (
                <div className="p-8 text-center text-sm text-text-secondary">No history logs found.</div>
              )}
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
          ) : (
            <div className="rounded-b-lg bg-white border-x border-b border-surface-low overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-surface-low text-text-secondary font-semibold uppercase">
                  <tr>
                    {renderSortHeader('Timestamp', 'timestamp', historyPag)}
                    {renderSortHeader('Product', 'product__name', historyPag)}
                    {renderSortHeader('Action Type', 'action_type', historyPag)}
                    {renderSortHeader('Qty Changed', 'quantity_changed', historyPag)}
                    <th className="px-4 py-3">Details / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-low">
                  {historyPag.loading ? (
                    <SkeletonTable rows={historyPag.pageSize || 5} columns={5} />
                  ) : (
                    historyPag.data.map((h) => (
                      <tr key={h.id} className="hover:bg-surface-bright">
                        <td className="px-4 py-4 text-text-secondary">{new Date(h.timestamp).toLocaleString()}</td>
                        <td className="px-4 py-4 font-semibold text-text-primary">
                          <div>
                            <span>{h.product_name}</span>
                            {h.suitable_models_details && h.suitable_models_details.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {h.suitable_models_details.map((m) => (
                                  <span key={m.id} className="inline-block px-1.5 py-0.5 rounded bg-brand-blue/10 text-brand-blue text-[10px] font-semibold">
                                    {m.brand_name} {m.model_name}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-semibold ${h.action_type === 'Add' ? 'bg-green-100 text-green-800' :
                            h.action_type === 'Damage' ? 'bg-red-100 text-red-800' :
                              h.action_type === 'Adjustment' ? 'bg-amber-100 text-amber-800' :
                                'bg-blue-100 text-brand-blue'
                            }`}>
                            {h.action_type}
                          </span>
                        </td>
                        <td className={`px-4 py-4 text-right font-semibold ${h.quantity_changed > 0 ? 'text-green-600' : 'text-error'}`}>
                          {h.quantity_changed > 0 ? `+${h.quantity_changed}` : h.quantity_changed}
                        </td>
                        <td className="px-4 py-4 text-text-secondary">{h.description}</td>
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
          )}
        </div>
      )}

      {/* Damaged Stock Tab */}
      {currentTab === 'damaged' && (
        <div className="space-y-4 md:space-y-6">
          {/* Search bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 md:bg-white md:p-4 md:rounded-t-lg md:border-t md:border-x md:border-surface-low bg-transparent p-0 border-none">
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                value={damagedPag.search}
                onChange={(e) => damagedPag.setSearch(e.target.value)}
                placeholder="Search damages by product/details..."
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

          {isMobile ? (
            <div className="space-y-3 md:pt-2">
              {damagedPag.loading ? (
                <div className="p-3 space-y-4">
                  {[1, 2, 3, 4, 5].map((idx) => (
                    <div key={idx} className="animate-pulse space-y-2">
                      <div className="h-4 bg-surface-low rounded w-3/4"></div>
                      <div className="h-3 bg-surface-low rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : (
                damagedPag.data.map((h) => (
                  <div
                    key={h.id}
                    onClick={() => setSelectedStockDetails({ ...h, isDamageLog: true })}
                    className="rounded-lg border border-surface-low bg-white p-3.5 shadow-sm active:bg-surface-low transition-colors cursor-pointer space-y-2 text-sm"
                  >
                    {/* Row 1: Product Name, Qty Damaged */}
                    <div className="flex justify-between items-start gap-3">
                      <div className="min-w-0">
                        <div className="font-bold text-text-primary truncate">{h.product_name}</div>
                        {h.suitable_models_details && h.suitable_models_details.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {h.suitable_models_details.map((m) => (
                              <span key={m.id} className="inline-block px-1.5 py-0.5 rounded bg-brand-blue/10 text-brand-blue text-[10px] font-semibold">
                                {m.brand_name} {m.model_name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="inline-block text-xs font-bold px-2 py-0.5 rounded bg-red-50 text-error border border-error/10">
                          Qty: {h.quantity_changed}
                        </span>
                      </div>
                    </div>

                    {/* Row 2: Timestamp, Reason */}
                    <div className="flex justify-between items-center pt-2 border-t border-dashed border-surface-low text-xs text-text-secondary">
                      <span className="text-[11px]">
                        {new Date(h.timestamp).toLocaleDateString()} {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="truncate max-w-[150px] text-[11px]">{h.description}</span>
                    </div>
                  </div>
                ))
              )}
              {damagedPag.data.length === 0 && !damagedPag.loading && (
                <div className="p-8 text-center text-sm text-text-secondary">No damage logs found.</div>
              )}
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
          ) : (
            <div className="rounded-b-lg bg-white border-x border-b border-surface-low overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-surface-low text-text-secondary font-semibold uppercase">
                  <tr>
                    {renderSortHeader('Timestamp', 'timestamp', damagedPag)}
                    {renderSortHeader('Product', 'product__name', damagedPag)}
                    {renderSortHeader('Qty Damaged', 'quantity_changed', damagedPag)}
                    <th className="px-4 py-3">Damage Reason / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-low">
                  {damagedPag.loading ? (
                    <SkeletonTable rows={damagedPag.pageSize || 5} columns={4} />
                  ) : (
                    <>
                      {damagedPag.data.map((h) => (
                        <tr key={h.id} className="hover:bg-surface-bright">
                          <td className="px-4 py-4 text-text-secondary">{new Date(h.timestamp).toLocaleString()}</td>
                          <td className="px-4 py-4 font-semibold text-text-primary">
                            <div>
                              <span>{h.product_name}</span>
                              {h.suitable_models_details && h.suitable_models_details.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {h.suitable_models_details.map((m) => (
                                    <span key={m.id} className="inline-block px-1.5 py-0.5 rounded bg-brand-blue/10 text-brand-blue text-[10px] font-semibold">
                                      {m.brand_name} {m.model_name}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right font-semibold text-error">
                            {h.quantity_changed}
                          </td>
                          <td className="px-4 py-4 text-text-secondary">{h.description}</td>
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
          )}
        </div>
      )}

      {/* Adjust Stock Controls */}
      {showAdjustModal && (
        <div className="hidden md:flex fixed inset-0 z-50 items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Adjust Stock Count{selectedStock ? `: ${selectedStock.product_name}` : ''}</h3>
            {renderAdjustForm(false)}
          </div>
        </div>
      )}
      <MobileBottomSheet
        isOpen={showAdjustModal}
        onClose={closeAdjust}
        title={selectedStock ? `Adjust Stock: ${selectedStock.product_name}` : 'Adjust Stock'}
      >
        {renderAdjustForm(true)}
      </MobileBottomSheet>

      {/* Transfer Stock Controls */}
      {showTransferModal && (
        <div className="hidden md:flex fixed inset-0 z-50 items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Stock Location Transfer{selectedStock ? `: ${selectedStock.product_name}` : ''}</h3>
            {renderTransferForm(false)}
          </div>
        </div>
      )}
      <MobileBottomSheet
        isOpen={showTransferModal}
        onClose={closeTransfer}
        title={selectedStock ? `Stock Transfer: ${selectedStock.product_name}` : 'Stock Transfer'}
      >
        {renderTransferForm(true)}
      </MobileBottomSheet>

      {/* Log Damage Controls */}
      {showDamageModal && (
        <div className="hidden md:flex fixed inset-0 z-50 items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
            <h3 className="text-sm font-semibold text-text-primary mb-2">Record Damage & Expense{selectedStock ? `: ${selectedStock.product_name}` : ''}</h3>
            <p className="text-[11px] text-text-secondary mb-4">
              Marks stock as lost and automatically writes off a corresponding expense from the selected account (cost = WAC per item).
            </p>
            {renderDamageForm(false)}
          </div>
        </div>
      )}
      <MobileBottomSheet
        isOpen={showDamageModal}
        onClose={closeDamage}
        title={selectedStock ? `Log Damage: ${selectedStock.product_name}` : 'Log Damage'}
      >
        {renderDamageForm(true)}
      </MobileBottomSheet>

      {/* Mobile Stock Actions Menu */}
      <MobileBottomSheet
        isOpen={showStockMenu}
        onClose={() => setShowStockMenu(false)}
        title="Stock Actions..."
      >
        <div className="space-y-3 pb-4">
          <button
            onClick={() => {
              setShowStockMenu(false);
              resetFormStates();
              setShowAdjustModal(true);
            }}
            className="w-full flex items-center space-x-3 p-4 rounded-xl border border-surface-low hover:bg-surface-low text-left text-sm font-medium text-text-primary transition"
          >
            <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-brand-blue/10 text-brand-blue">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <div>
              <div className="font-semibold">Adjust Stock Count</div>
              <div className="text-xs text-text-secondary">Update the physical stock count of an item</div>
            </div>
          </button>

          <button
            onClick={() => {
              setShowStockMenu(false);
              resetFormStates();
              setShowTransferModal(true);
            }}
            className="w-full flex items-center space-x-3 p-4 rounded-xl border border-surface-low hover:bg-surface-low text-left text-sm font-medium text-text-primary transition"
          >
            <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-green-600/10 text-green-600">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <div>
              <div className="font-semibold">Stock Location Transfer</div>
              <div className="text-xs text-text-secondary">Move stock from one location to another</div>
            </div>
          </button>

        </div>
      </MobileBottomSheet>

      {/* Floating Action Button for mobile */}
      {((currentTab === 'current' && !showAdjustModal && !showTransferModal && !showDamageModal && !showStockMenu) ||
        (currentTab === 'damaged' && !showDamageModal)) && (
        <FloatingActionButton
          icon={
            currentTab === 'current' ? (
              <div className="relative">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span className="absolute -top-1.5 -right-1.5 bg-white text-brand-blue rounded-full text-[9px] font-black h-4 w-4 flex items-center justify-center border border-brand-blue shadow-xs">+</span>
              </div>
            ) : currentTab === 'damaged' ? (
              <div className="relative">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="absolute -top-1.5 -right-1.5 bg-white text-brand-blue rounded-full text-[9px] font-black h-4 w-4 flex items-center justify-center border border-brand-blue shadow-xs">+</span>
              </div>
            ) : null
          }
          onClick={() => {
            if (currentTab === 'current') {
              setShowStockMenu(true);
            } else if (currentTab === 'damaged') {
              resetFormStates();
              setShowDamageModal(true);
            }
          }}
        />
      )}

      {/* Mobile Bottom Sheet for Stock Details */}
      <MobileBottomSheet
        isOpen={selectedStockDetails !== null}
        onClose={() => setSelectedStockDetails(null)}
        title="Stock Item Details"
      >
        {selectedStockDetails && (
          <div className="space-y-4 pb-6">
            <div>
              <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Product Name</span>
              <div className="text-base font-bold text-text-primary mt-0.5">{selectedStockDetails.product_name}</div>
            </div>

            {selectedStockDetails.barcode && (
              <div>
                <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Barcode</span>
                <div className="text-sm font-mono text-text-primary mt-0.5">{selectedStockDetails.barcode}</div>
              </div>
            )}

            {!selectedStockDetails.isHistory && !selectedStockDetails.isDamageLog && (
              <div>
                <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Quantity in Stock</span>
                <div className="text-sm font-bold text-text-primary mt-0.5">{selectedStockDetails.quantity} units</div>
              </div>
            )}

            {selectedStockDetails.isHistory && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Action Type</span>
                    <div className="mt-1">
                      <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${selectedStockDetails.action_type === 'Add' ? 'bg-green-100 text-green-800' :
                        selectedStockDetails.action_type === 'Damage' ? 'bg-red-100 text-red-800' :
                          selectedStockDetails.action_type === 'Adjustment' ? 'bg-amber-100 text-amber-800' :
                            'bg-blue-100 text-brand-blue'
                        }`}>
                        {selectedStockDetails.action_type}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Quantity Changed</span>
                    <div className={`text-sm font-bold mt-0.5 ${selectedStockDetails.quantity_changed > 0 ? 'text-green-600' : 'text-error'}`}>
                      {selectedStockDetails.quantity_changed > 0 ? `+${selectedStockDetails.quantity_changed}` : selectedStockDetails.quantity_changed} units
                    </div>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Timestamp</span>
                  <div className="text-sm text-text-primary mt-0.5">{new Date(selectedStockDetails.timestamp).toLocaleString()}</div>
                </div>

                {selectedStockDetails.description && (
                  <div>
                    <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Details / Notes</span>
                    <div className="text-sm text-text-primary mt-0.5 bg-surface-low p-2 rounded border border-surface-dim">{selectedStockDetails.description}</div>
                  </div>
                )}
              </>
            )}

            {selectedStockDetails.isDamageLog && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Quantity Damaged</span>
                    <div className="text-sm font-bold text-error mt-0.5">{selectedStockDetails.quantity_changed} units</div>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Timestamp</span>
                    <div className="text-sm text-text-primary mt-0.5">{new Date(selectedStockDetails.timestamp).toLocaleString()}</div>
                  </div>
                </div>

                {selectedStockDetails.description && (
                  <div>
                    <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Damage Reason / Notes</span>
                    <div className="text-sm text-text-primary mt-0.5 bg-surface-low p-2 rounded border border-surface-dim">{selectedStockDetails.description}</div>
                  </div>
                )}
              </>
            )}

            {selectedStockDetails.suitable_models_details && selectedStockDetails.suitable_models_details.length > 0 && (
              <div>
                <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Suitable Models</span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {selectedStockDetails.suitable_models_details.map((m) => (
                    <span key={m.id} className="inline-block px-2 py-0.5 rounded bg-brand-blue/10 text-brand-blue text-xs font-semibold">
                      {m.brand_name} {m.model_name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </MobileBottomSheet>
    </div>
  );
}
