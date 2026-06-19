import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { usePagination } from '../utils/usePagination';
import PaginationControls from '../components/PaginationControls';
import FloatingActionButton from '../components/FloatingActionButton';
import MobileBottomSheet from '../components/MobileBottomSheet';
import { FaWhatsapp, FaPhoneAlt } from 'react-icons/fa';
import { FiCopy, FiCheck } from 'react-icons/fi';

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

export default function Customers() {
  // Unpaginated dropdown lists
  const [bankAccounts, setBankAccounts] = useState([]);
  const [dropdownsLoading, setDropdownsLoading] = useState(true);

  // Paginated customers list
  const pag = usePagination(api.customers.list, 10, true);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [place, setPlace] = useState('');
  const [creditLimit, setCreditLimit] = useState('10000');

  // Customer Payment states
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payBank, setPayBank] = useState('');

  const loadDropdowns = () => {
    setDropdownsLoading(true);
    api.bankAccounts.list()
      .then((b) => {
        setBankAccounts(b);
        if (b.length > 0) setPayBank(b[0].id.toString());
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

  const handleCustomerSubmit = (e) => {
    e.preventDefault();
    api.customers.create({
      name,
      contact_info: contactInfo,
      whatsapp_number: whatsappNumber,
      contact_number: contactNumber,
      place,
      credit_limit: parseFloat(creditLimit)
    })
    .then(() => {
      setShowForm(false);
      setName('');
      setContactInfo('');
      setWhatsappNumber('');
      setContactNumber('');
      setPlace('');
      setCreditLimit('10000');
      pag.refresh();
    })
    .catch((err) => alert(err.message));
  };

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    if (!selectedCustomer || payAmount === '' || payBank === '') return;

    api.customerPayments.create({
      customer: selectedCustomer.id,
      payment_to: parseInt(payBank),
      amount: parseFloat(payAmount)
    })
    .then(() => {
      setShowPayModal(false);
      setPayAmount('');
      pag.refresh();
      loadDropdowns();
    })
    .catch((err) => alert(err.message));
  };

  const openPayModal = (customer) => {
    setSelectedCustomer(customer);
    setPayAmount(customer.outstanding_balance.toString());
    setShowPayModal(true);
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

  const renderCustomerForm = (isMobile = false) => (
    <form onSubmit={handleCustomerSubmit} className={isMobile ? "space-y-4" : "rounded-lg bg-white p-6 shadow-sm border border-surface-low space-y-4"}>
      {!isMobile && <h3 className="text-sm font-semibold text-text-primary">Add New Customer</h3>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1">Customer Name</label>
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
          <label className="block text-xs font-semibold text-text-secondary mb-1">Credit Limit (INR)</label>
          <input
            type="number"
            required
            value={creditLimit}
            onChange={(e) => setCreditLimit(e.target.value)}
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
        className="w-full sm:w-auto rounded bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-brand-cobalt transition cursor-pointer"
      >
        Save Customer
      </button>
    </form>
  );

  const renderPayForm = (isMobile = false) => (
    <form onSubmit={handlePaymentSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-text-secondary mb-1">Payment Received Amount (INR)</label>
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
        <label className="block text-xs font-semibold text-text-secondary mb-1">Deposit To Bank Account</label>
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
          className={`rounded bg-brand-blue px-3 py-1.5 text-xs text-white hover:bg-brand-cobalt ${isMobile ? 'w-full py-2.5 font-bold' : ''}`}
        >
          Post Payment
        </button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-text-primary">Customers Directory</h2>
          <p className="text-xs text-text-secondary">Configure customer records, outstanding balances, and credit limits.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="hidden md:inline-block rounded bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-brand-cobalt transition"
        >
          {showForm ? 'Cancel' : 'Add Customer'}
        </button>
      </div>

      {showForm && (
        <div className="hidden md:block">
          {renderCustomerForm(false)}
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
              placeholder="Search customers by name..."
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
                {renderSortHeader('Customer Name', 'name')}
                <th className="px-4 py-2">Contact Info</th>
                {renderSortHeader('Place', 'place')}
                {renderSortHeader('Credit Limit', 'credit_limit')}
                {renderSortHeader('Outstanding Balance (Receivables)', 'outstanding_balance')}
                <th className="px-4 py-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-low">
              {pag.data.map((c) => (
                <tr key={c.id} className="hover:bg-surface-bright">
                  <td className="px-4 py-3 font-semibold text-text-primary">{c.name}</td>
                  <td className="px-4 py-3 text-text-secondary">
                    <div className="space-y-1">
                      <div>{c.contact_info}</div>
                      {(c.contact_number || c.whatsapp_number) && (
                        <div className="flex flex-wrap gap-2 mt-1">
                          {c.contact_number && (
                            <ContactNumber number={c.contact_number} isWhatsapp={false} />
                          )}
                          {c.whatsapp_number && (
                            <ContactNumber number={c.whatsapp_number} isWhatsapp={true} />
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text-secondary font-medium">{c.place || '-'}</td>
                  <td className="px-4 py-3 text-right text-text-secondary">{formatCurrency(c.credit_limit)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-semibold ${parseFloat(c.outstanding_balance) > 0 ? 'text-amber-600 font-bold' : 'text-text-primary'}`}>
                      {formatCurrency(c.outstanding_balance)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      disabled={parseFloat(c.outstanding_balance) <= 0}
                      onClick={() => openPayModal(c)}
                      className="rounded bg-brand-blue/10 px-3 py-1.5 text-xs font-semibold text-brand-blue hover:bg-brand-blue/20 disabled:opacity-50 disabled:pointer-events-none transition"
                    >
                      Post Payment
                    </button>
                  </td>
                </tr>
              ))}
              {pag.data.length === 0 && !pag.loading && (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-text-secondary">No customers found.</td>
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

      {/* Record Payment Modal */}
      {showPayModal && (
        <div className="hidden md:flex fixed inset-0 z-50 items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Record Customer Payment: {selectedCustomer?.name}</h3>
            {renderPayForm(false)}
          </div>
        </div>
      )}

      {/* Mobile Bottom Sheets */}
      <MobileBottomSheet
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Add New Customer"
      >
        {renderCustomerForm(true)}
      </MobileBottomSheet>

      <MobileBottomSheet
        isOpen={showPayModal}
        onClose={() => setShowPayModal(false)}
        title={`Customer Payment: ${selectedCustomer?.name}`}
      >
        {renderPayForm(true)}
      </MobileBottomSheet>

      {/* Mobile Floating Action Button */}
      {!showForm && !showPayModal && (
        <FloatingActionButton
          onClick={() => {
            setName('');
            setContactInfo('');
            setWhatsappNumber('');
            setContactNumber('');
            setPlace('');
            setCreditLimit('10000');
            setShowForm(true);
          }}
        />
      )}
    </div>
  );
}
