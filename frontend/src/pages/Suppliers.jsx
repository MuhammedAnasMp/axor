import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { usePagination } from '../utils/usePagination';
import PaginationControls from '../components/PaginationControls';
import FloatingActionButton from '../components/FloatingActionButton';
import MobileBottomSheet from '../components/MobileBottomSheet';
import { FaWhatsapp, FaPhoneAlt } from 'react-icons/fa';
import { FiCopy, FiCheck } from 'react-icons/fi';
import { SkeletonTable, Spinner } from '../components/Skeleton';

function ContactNumber({ number, isWhatsapp }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const cleanNumber = number.replace(/[^\d]/g, '');

  if (isWhatsapp) {
    return (
      <div className="inline-flex items-center space-x-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 hover:bg-emerald-100 transition">
        <a
          href={`https://wa.me/${cleanNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center space-x-1"
          title="Chat on WhatsApp"
        >
          <FaWhatsapp className="w-3 h-3 text-emerald-600" />
          <span className="hover:underline">{number}</span>
        </a>
        <button
          onClick={handleCopy}
          className="ml-1 text-emerald-600 hover:text-emerald-800 focus:outline-none flex items-center"
          title="Copy"
        >
          {copied ? (
            <FiCheck className="w-2.5 h-2.5 text-emerald-600" />
          ) : (
            <FiCopy className="w-2.5 h-2.5" />
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center space-x-1 text-[10px] font-semibold text-text-secondary bg-surface-low px-2 py-0.5 rounded hover:bg-surface-dim transition">
      <a
        href={`tel:${cleanNumber}`}
        className="flex items-center space-x-1"
        title="Call"
      >
        <FaPhoneAlt className="w-2.5 h-2.5 text-text-secondary" />
        <span className="hover:underline">{number}</span>
      </a>
      <button
        onClick={handleCopy}
        className="ml-1 text-text-secondary hover:text-text-primary focus:outline-none flex items-center"
        title="Copy"
      >
        {copied ? (
          <FiCheck className="w-2.5 h-2.5 text-emerald-600" />
        ) : (
          <FiCopy className="w-2.5 h-2.5" />
        )}
      </button>
    </div>
  );
}

export default function Suppliers() {
  // Unpaginated dropdown list
  const [bankAccounts, setBankAccounts] = useState([]);
  const [dropdownsLoading, setDropdownsLoading] = useState(true);

  // Paginated supplier directory list
  const pag = usePagination(api.suppliers.list, 10, true);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [place, setPlace] = useState('');

  // Payment states
  const [showPayModal, setShowPayModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payBank, setPayBank] = useState('');
  const [receiveAmount, setReceiveAmount] = useState('');
  const [receiveBank, setReceiveBank] = useState('');

  // Expanded Supplier Products state
  const [expandedSupplier, setExpandedSupplier] = useState(null);
  const [mappedProducts, setMappedProducts] = useState([]);
  const [mappingsLoading, setMappingsLoading] = useState(false);
  const [isSavingSupplier, setIsSavingSupplier] = useState(false);
  const [isPostingPayment, setIsPostingPayment] = useState(false);
  const [isPostingReceive, setIsPostingReceive] = useState(false);

  const toggleExpandSupplier = (supplierId) => {
    if (expandedSupplier === supplierId) {
      setExpandedSupplier(null);
      setMappedProducts([]);
    } else {
      setExpandedSupplier(supplierId);
      setMappingsLoading(true);
      api.supplierProducts.list({ supplier_id: supplierId })
        .then((res) => {
          if (res && res.results) {
            setMappedProducts(res.results);
          } else if (Array.isArray(res)) {
            setMappedProducts(res);
          } else {
            setMappedProducts([]);
          }
          setMappingsLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setMappingsLoading(false);
        });
    }
  };

  const loadDropdowns = () => {
    setDropdownsLoading(true);
    api.bankAccounts.list()
      .then((b) => {
        setBankAccounts(b);
        if (b.length > 0) {
          setPayBank(b[0].id.toString());
          setReceiveBank(b[0].id.toString());
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

  const handleSupplierSubmit = (e) => {
    e.preventDefault();
    setIsSavingSupplier(true);
    api.suppliers.create({ 
      name, 
      contact_info: contactInfo,
      whatsapp_number: whatsappNumber,
      contact_number: contactNumber,
      place
    })
      .then(() => {
        setShowForm(false);
        setName('');
        setContactInfo('');
        setWhatsappNumber('');
        setContactNumber('');
        setPlace('');
        pag.refresh();
        setIsSavingSupplier(false);
      })
      .catch((err) => {
        alert(err.message);
        setIsSavingSupplier(false);
      });
  };

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    if (!selectedSupplier || payAmount === '' || payBank === '') return;

    setIsPostingPayment(true);
    api.supplierPayments.create({
      supplier: selectedSupplier.id,
      payment_from: parseInt(payBank),
      amount: parseFloat(payAmount)
    })
      .then(() => {
        setShowPayModal(false);
        setPayAmount('');
        pag.refresh();
        loadDropdowns();
        setIsPostingPayment(false);
      })
      .catch((err) => {
        alert(err.message);
        setIsPostingPayment(false);
      });
  };

  const handleReceiveSubmit = (e) => {
    e.preventDefault();
    if (!selectedSupplier || receiveAmount === '' || receiveBank === '') return;

    setIsPostingReceive(true);
    api.suppliers.receivePayment(selectedSupplier.id, {
      amount: parseFloat(receiveAmount),
      account_id: parseInt(receiveBank),
      description: `Refund / payment from supplier ${selectedSupplier.name}`
    })
      .then(() => {
        setShowReceiveModal(false);
        setReceiveAmount('');
        pag.refresh();
        loadDropdowns();
        setIsPostingReceive(false);
      })
      .catch((err) => {
        alert(err.message);
        setIsPostingReceive(false);
      });
  };

  const openPayModal = (supplier) => {
    setSelectedSupplier(supplier);
    setPayAmount(supplier.outstanding_balance.toString());
    setShowPayModal(true);
  };

  const openReceiveModal = (supplier) => {
    setSelectedSupplier(supplier);
    setReceiveAmount(Math.abs(parseFloat(supplier.outstanding_balance)).toString());
    if (bankAccounts.length > 0) {
      setReceiveBank(bankAccounts[0].id.toString());
    }
    setShowReceiveModal(true);
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(val);
  };

  const renderSortHeader = (label, field) => {
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

  const renderSupplierForm = (isMobile = false) => (
    <form onSubmit={handleSupplierSubmit} className={isMobile ? "space-y-4" : "rounded-lg bg-white p-6 shadow-sm border border-surface-low space-y-4"}>
      {!isMobile && <h3 className="text-sm font-semibold text-text-primary">Add New Supplier</h3>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1">Supplier / Company Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-blue"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1">Contact Details / Address</label>
          <input
            type="text"
            required
            value={contactInfo}
            onChange={(e) => setContactInfo(e.target.value)}
            className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-blue"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1">Contact Number</label>
          <input
            type="text"
            value={contactNumber}
            onChange={(e) => setContactNumber(e.target.value)}
            className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-blue"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1">WhatsApp Number</label>
          <input
            type="text"
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
            className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-blue"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1">Place</label>
          <input
            type="text"
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-blue"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={isSavingSupplier}
        className="w-full sm:w-auto flex items-center justify-center space-x-2 rounded bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-brand-cobalt transition cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
      >
        {isSavingSupplier && <Spinner size="sm" />}
        <span>{isSavingSupplier ? 'Saving...' : 'Save Supplier'}</span>
      </button>
    </form>
  );

  const renderPayForm = (isMobile = false) => (
    <form onSubmit={handlePaymentSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-text-secondary mb-1">Payment Amount (INR)</label>
        <input
          type="number"
          step="0.01"
          required
          value={payAmount}
          onChange={(e) => setPayAmount(e.target.value)}
          className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm outline-none focus:border-brand-blue text-text-primary"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-text-secondary mb-1">Pay From Bank Account</label>
        <select
          required
          value={payBank}
          onChange={(e) => setPayBank(e.target.value)}
          className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm outline-none focus:border-brand-blue text-text-primary"
        >
          {bankAccounts.map((b) => (
            <option key={b.id} value={b.id}>{b.name} (₹{b.balance})</option>
          ))}
        </select>
      </div>
      <div className={isMobile ? "flex flex-col space-y-2 pt-2" : "flex justify-end space-x-2 pt-2"}>
        <button
          type="button"
          onClick={() => setShowPayModal(false)}
          className={`rounded border border-surface-dim px-3 py-1.5 text-xs text-text-secondary hover:bg-surface-low ${isMobile ? 'w-full py-2.5 font-semibold' : ''}`}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPostingPayment}
          className={`rounded bg-brand-blue px-3 py-1.5 text-xs text-white hover:bg-brand-cobalt flex items-center justify-center space-x-1.5 disabled:opacity-50 disabled:pointer-events-none ${isMobile ? 'w-full py-2.5 font-bold' : ''}`}
        >
          {isPostingPayment && <Spinner size="xs" />}
          <span>{isPostingPayment ? 'Posting...' : 'Post Payment'}</span>
        </button>
      </div>
    </form>
  );

  const renderReceiveForm = (isMobile = false) => (
    <form onSubmit={handleReceiveSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-text-secondary mb-1">Amount Received (INR)</label>
        <input
          type="number"
          step="0.01"
          required
          value={receiveAmount}
          onChange={(e) => setReceiveAmount(e.target.value)}
          className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm outline-none focus:border-brand-blue text-text-primary"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-text-secondary mb-1">Deposit To Account</label>
        <select
          required
          value={receiveBank}
          onChange={(e) => setReceiveBank(e.target.value)}
          className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm outline-none focus:border-brand-blue text-text-primary"
        >
          {bankAccounts.map((b) => (
            <option key={b.id} value={b.id}>{b.name} (₹{b.balance})</option>
          ))}
        </select>
      </div>
      <div className={isMobile ? "flex flex-col space-y-2 pt-2" : "flex justify-end space-x-2 pt-2"}>
        <button
          type="button"
          onClick={() => setShowReceiveModal(false)}
          className={`rounded border border-surface-dim px-3 py-1.5 text-xs text-text-secondary hover:bg-surface-low ${isMobile ? 'w-full py-2.5 font-semibold' : ''}`}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPostingReceive}
          className={`rounded bg-emerald-600 px-3 py-1.5 text-xs text-white hover:bg-emerald-700 flex items-center justify-center space-x-1.5 disabled:opacity-50 disabled:pointer-events-none ${isMobile ? 'w-full py-2.5 font-bold' : ''}`}
        >
          {isPostingReceive && <Spinner size="xs" />}
          <span>{isPostingReceive ? 'Posting...' : 'Post Amount'}</span>
        </button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-text-primary">Suppliers Directory</h2>
          <p className="text-xs text-text-secondary">Manage suppliers, track outstanding balances, and record payments.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="hidden md:inline-block rounded bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-brand-cobalt transition"
        >
          {showForm ? 'Cancel' : 'Add Supplier'}
        </button>
      </div>

      {showForm && (
        <div className="hidden md:block">
          {renderSupplierForm(false)}
        </div>
      )}

      {/* Directory Table Wrapper */}
      <div className="space-y-4">
        {/* Search & loading bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-t-lg border-t border-x border-surface-low">
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={pag.search}
              onChange={(e) => pag.setSearch(e.target.value)}
              placeholder="Search suppliers by name..."
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

        {/* Directory Table */}
        <div className="rounded-b-lg bg-white border-x border-b border-surface-low overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-surface-low text-text-secondary font-semibold uppercase">
              <tr>
                {renderSortHeader('Supplier Name', 'name')}
                <th className="px-4 py-2">Contact Details</th>
                {renderSortHeader('Place', 'place')}
                {renderSortHeader('Outstanding Balance', 'outstanding_balance')}
                <th className="px-4 py-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-low">
              {pag.loading ? (
                <SkeletonTable rows={pag.pageSize || 5} columns={5} />
              ) : (
                pag.data.map((s) => (
                  <React.Fragment key={s.id}>
                    <tr className="hover:bg-surface-bright border-b border-surface-low">
                      <td className="px-4 py-3 font-semibold text-text-primary">
                        <button
                          type="button"
                          onClick={() => toggleExpandSupplier(s.id)}
                          className="text-left font-semibold text-brand-blue hover:underline focus:outline-none flex items-center space-x-1"
                        >
                          <span>{s.name}</span>
                          <svg className={`h-3 w-3 transform transition-transform ${expandedSupplier === s.id ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        <div className="space-y-1">
                          <div>{s.contact_info}</div>
                          {(s.contact_number || s.whatsapp_number) && (
                            <div className="flex flex-wrap gap-2 mt-1">
                              {s.contact_number && (
                                <ContactNumber number={s.contact_number} isWhatsapp={false} />
                              )}
                              {s.whatsapp_number && (
                                <ContactNumber number={s.whatsapp_number} isWhatsapp={true} />
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-text-secondary font-medium">{s.place || '-'}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-semibold ${parseFloat(s.outstanding_balance) > 0 ? 'text-error font-bold' : 'text-text-primary'}`}>
                          {formatCurrency(s.outstanding_balance)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {parseFloat(s.outstanding_balance) > 0 ? (
                          <button
                            onClick={() => openPayModal(s)}
                            className="rounded bg-brand-blue/10 px-3 py-1.5 text-xs font-semibold text-brand-blue hover:bg-brand-blue/20 transition"
                          >
                            Pay Amount
                          </button>
                        ) : parseFloat(s.outstanding_balance) < 0 ? (
                          <button
                            onClick={() => openReceiveModal(s)}
                            className="rounded bg-emerald-600/10 px-3 py-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-600/20 transition"
                          >
                            Receive Amount
                          </button>
                        ) : (
                          <button
                            disabled
                            className="rounded bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-400 cursor-not-allowed transition"
                          >
                            Pay Amount
                          </button>
                        )}
                      </td>
                    </tr>
                    {expandedSupplier === s.id && (
                      <tr>
                        <td colSpan="5" className="bg-surface-lowest px-6 py-4 border-b border-surface-low">
                          <div className="rounded-lg border border-surface-dim bg-white p-4 space-y-3 shadow-inner">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold text-text-primary text-xs font-sans">Mapped Products & Negotiated Costs</h4>
                            </div>
                            <table className="min-w-full text-left text-[11px] border border-surface-dim rounded bg-surface-bright overflow-hidden">
                              <thead className="bg-surface-low text-text-secondary font-semibold uppercase">
                                <tr>
                                  <th className="px-3 py-1.5">Product Name</th>
                                  <th className="px-3 py-1.5">Barcode</th>
                                  <th className="px-3 py-1.5 text-right">Current Negotiated Cost</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-surface-low">
                                {mappingsLoading ? (
                                  <SkeletonTable rows={3} columns={3} />
                                ) : (
                                  mappedProducts.map((mp) => (
                                    <tr key={mp.id}>
                                      <td className="px-3 py-2 font-semibold text-text-primary">{mp.product_name}</td>
                                      <td className="px-3 py-2 text-text-secondary font-mono">{mp.barcode}</td>
                                      <td className="px-3 py-2 text-right font-bold text-brand-blue">{formatCurrency(mp.current_cost)}</td>
                                    </tr>
                                  ))
                                )}
                                {mappedProducts.length === 0 && !mappingsLoading && (
                                  <tr>
                                    <td colSpan="3" className="px-3 py-4 text-center text-text-secondary">No products mapped to this supplier. Setup mappings in Products module.</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
              {pag.data.length === 0 && !pag.loading && (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-text-secondary">No suppliers found.</td>
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

      {/* Record Payment Controls */}
      {showPayModal && (
        <div className="hidden md:flex fixed inset-0 z-50 items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Record Supplier Payment: {selectedSupplier?.name}</h3>
            {renderPayForm(false)}
          </div>
        </div>
      )}

      {/* Amount Received Controls */}
      {showReceiveModal && (
        <div className="hidden md:flex fixed inset-0 z-50 items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
            <h3 className="text-sm font-semibold text-text-primary mb-4 font-sans">Record Amount Received: {selectedSupplier?.name}</h3>
            {renderReceiveForm(false)}
          </div>
        </div>
      )}

      {/* Mobile Bottom Sheets */}
      <MobileBottomSheet
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Add New Supplier"
      >
        {renderSupplierForm(true)}
      </MobileBottomSheet>

      <MobileBottomSheet
        isOpen={showPayModal}
        onClose={() => setShowPayModal(false)}
        title={`Supplier Payment: ${selectedSupplier?.name}`}
      >
        {renderPayForm(true)}
      </MobileBottomSheet>

      <MobileBottomSheet
        isOpen={showReceiveModal}
        onClose={() => setShowReceiveModal(false)}
        title={`Amount Received: ${selectedSupplier?.name}`}
      >
        {renderReceiveForm(true)}
      </MobileBottomSheet>

      {/* Mobile Floating Action Button */}
      {!showForm && !showPayModal && !showReceiveModal && (
        <FloatingActionButton
          onClick={() => {
            setName('');
            setContactInfo('');
            setWhatsappNumber('');
            setContactNumber('');
            setPlace('');
            setShowForm(true);
          }}
        />
      )}
    </div>
  );
}
