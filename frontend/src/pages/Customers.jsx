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

  const cleanNumber = number.replace(/[^\d]/g, '');

  let displayVal = number;
  let waNumber = cleanNumber;

  if (cleanNumber.length === 10) {
    displayVal = `+91 ${cleanNumber}`;
    waNumber = `91${cleanNumber}`;
  } else if (cleanNumber.length === 12 && cleanNumber.startsWith('91')) {
    displayVal = `+91 ${cleanNumber.slice(2)}`;
    waNumber = cleanNumber;
  } else {
    displayVal = number.startsWith('+') ? number : `+91 ${number}`;
    waNumber = cleanNumber.startsWith('91') ? cleanNumber : `91${cleanNumber}`;
  }

  const handleCopy = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(displayVal);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isWhatsapp) {
    return (
      <div className="inline-flex items-center space-x-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 hover:bg-emerald-100 transition">
        <a
          href={`https://wa.me/${waNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center space-x-1"
          title="Chat on WhatsApp"
        >
          <FaWhatsapp className="w-3 h-3 text-emerald-600" />
          <span className="hover:underline">{displayVal}</span>
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
        href={`tel:${waNumber}`}
        className="flex items-center space-x-1"
        title="Call"
      >
        <FaPhoneAlt className="w-2.5 h-2.5 text-text-secondary" />
        <span className="hover:underline">{displayVal}</span>
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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [selectedCustomerDetails, setSelectedCustomerDetails] = useState(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
  const [isSaving, setIsSaving] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

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
    setIsSaving(true);

    let cleanContact = '';
    if (contactNumber.trim()) {
      const contactDigits = contactNumber.replace(/[^\d]/g, '');
      const has91 = contactDigits.length === 12 && contactDigits.startsWith('91');
      if (!(contactDigits.length === 10 || has91)) {
        alert('Contact number must be exactly 10 digits.');
        setIsSaving(false);
        return;
      }
      cleanContact = has91 ? contactDigits.slice(2) : contactDigits;
    }

    let cleanWhatsapp = '';
    if (whatsappNumber.trim()) {
      const whatsappDigits = whatsappNumber.replace(/[^\d]/g, '');
      const has91 = whatsappDigits.length === 12 && whatsappDigits.startsWith('91');
      if (!(whatsappDigits.length === 10 || has91)) {
        alert('WhatsApp number must be exactly 10 digits.');
        setIsSaving(false);
        return;
      }
      cleanWhatsapp = has91 ? whatsappDigits.slice(2) : whatsappDigits;
    }

    api.customers.create({
      name,
      contact_info: contactInfo,
      whatsapp_number: cleanWhatsapp,
      contact_number: cleanContact,
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
        setIsSaving(false);
      })
      .catch((err) => {
        alert(err.message);
        setIsSaving(false);
      });
  };

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    if (!selectedCustomer || payAmount === '' || payBank === '') return;

    setIsPosting(true);
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
        setIsPosting(false);
      })
      .catch((err) => {
        alert(err.message);
        setIsPosting(false);
      });
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
          <div className="flex rounded border border-surface-dim bg-white focus-within:border-brand-blue overflow-hidden">
            <span className="bg-surface-low px-3 py-2 text-sm text-text-secondary border-r border-surface-dim select-none font-medium">+91</span>
            <input
              type="text"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              placeholder="XXXXXXXXXX"
              className="flex-1 bg-transparent px-3 py-2 text-sm text-text-primary outline-none"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1">WhatsApp Number</label>
          <div className="flex rounded border border-surface-dim bg-white focus-within:border-brand-blue overflow-hidden">
            <span className="bg-surface-low px-3 py-2 text-sm text-text-secondary border-r border-surface-dim select-none font-medium">+91</span>
            <input
              type="text"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="XXXXXXXXXX"
              className="flex-1 bg-transparent px-3 py-2 text-sm text-text-primary outline-none"
            />
          </div>
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
        disabled={isSaving}
        className="w-full sm:w-auto flex items-center justify-center space-x-2 rounded bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-brand-cobalt transition cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
      >
        {isSaving && <Spinner size="sm" />}
        <span>{isSaving ? 'Saving...' : 'Save Customer'}</span>
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
          disabled={isPosting}
          className={`rounded bg-brand-blue px-3 py-1.5 text-xs text-white hover:bg-brand-cobalt flex items-center justify-center space-x-1.5 disabled:opacity-50 disabled:pointer-events-none ${isMobile ? 'w-full py-2.5 font-bold' : ''}`}
        >
          {isPosting && <Spinner size="xs" />}
          <span>{isPosting ? 'Posting...' : 'Post Payment'}</span>
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
        {isMobile ? (
            <div className="divide-y divide-surface-low bg-white border border-surface-low rounded-lg overflow-hidden">
              {pag.loading ? (
                <div className="p-3 space-y-4">
                  {[1, 2, 3, 4, 5].map((idx) => (
                    <div key={idx} className="animate-pulse space-y-2">
                      <div className="h-4 bg-surface-low rounded w-3/4"></div>
                      <div className="h-3 bg-surface-low rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : (
                pag.data.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCustomerDetails(c)}
                    className="p-3.5 hover:bg-surface-bright transition-colors cursor-pointer space-y-2 text-sm"
                  >
                    {/* Row 1: Customer Name, Balance */}
                    <div className="flex justify-between items-start gap-3">
                      <div className="min-w-0">
                        <div className="font-bold text-text-primary truncate">{c.name}</div>
                        <div className="text-xs text-text-secondary mt-0.5">{c.place || 'No Location'}</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded ${
                          parseFloat(c.outstanding_balance) > 0 ? 'bg-amber-50 text-amber-700 border border-amber-700/10' :
                          parseFloat(c.outstanding_balance) < 0 ? 'bg-green-50 text-green-700 border border-green-700/10' :
                          'bg-surface-low text-text-secondary border border-surface-dim/20'
                        }`}>
                          {formatCurrency(c.outstanding_balance)}
                        </span>
                      </div>
                    </div>

                    {/* Row 2: Contact, Action button */}
                    <div className="flex justify-between items-center pt-2 border-t border-dashed border-surface-low text-xs">
                      <div className="flex flex-wrap gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {c.contact_number && (
                          <ContactNumber number={c.contact_number} isWhatsapp={false} />
                        )}
                        {c.whatsapp_number && (
                          <ContactNumber number={c.whatsapp_number} isWhatsapp={true} />
                        )}
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>
                        {parseFloat(c.outstanding_balance) > 0 ? (
                          <button
                            onClick={() => openPayModal(c)}
                            className="rounded bg-brand-blue text-white px-2.5 py-1 text-xs font-semibold"
                          >
                            Post Payment
                          </button>
                        ) : (
                          <button
                            disabled
                            className="rounded bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-400 cursor-not-allowed"
                          >
                            Paid
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              {pag.data.length === 0 && !pag.loading && (
                <div className="p-8 text-center text-sm text-text-secondary">No customers found.</div>
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
          ) : (
            <div className="rounded-b-lg bg-white border-x border-b border-surface-low overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-surface-low text-text-secondary font-semibold uppercase">
                  <tr>
                    {renderSortHeader('Customer Name', 'name')}
                    <th className="px-4 py-3">Contact Info</th>
                    {renderSortHeader('Place', 'place')}
                    {renderSortHeader('Credit Limit', 'credit_limit')}
                    {renderSortHeader('Receivables', 'outstanding_balance')}
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-low">
                  {pag.loading ? (
                    <SkeletonTable rows={pag.pageSize || 5} columns={6} />
                  ) : (
                    pag.data.map((c) => (
                      <tr key={c.id} className="hover:bg-surface-bright">
                        <td className="px-4 py-4 font-semibold text-text-primary">{c.name}</td>
                        <td className="px-4 py-4 text-text-secondary">
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
                        <td className="px-4 py-4 text-text-secondary font-medium">{c.place || '-'}</td>
                        <td className="px-4 py-4 text-right text-text-secondary">{formatCurrency(c.credit_limit)}</td>
                        <td className="px-4 py-4 text-right">
                          <span className={`font-semibold ${parseFloat(c.outstanding_balance) > 0 ? 'text-amber-600 font-bold' : 'text-text-primary'}`}>
                            {formatCurrency(c.outstanding_balance)}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <button
                            disabled={parseFloat(c.outstanding_balance) <= 0}
                            onClick={() => openPayModal(c)}
                            className="rounded bg-brand-blue/10 px-3 py-1.5 text-xs font-semibold text-brand-blue hover:bg-brand-blue/20 disabled:opacity-50 disabled:pointer-events-none transition"
                          >
                            Post Payment
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
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
                loading={pag.loading}
              />
            </div>
          )}
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
      {/* Mobile Bottom Sheet for Customer Details */}
      <MobileBottomSheet
        isOpen={selectedCustomerDetails !== null}
        onClose={() => setSelectedCustomerDetails(null)}
        title="Customer Details"
      >
        {selectedCustomerDetails && (
          <div className="space-y-4 pb-6 text-sm">
            <div>
              <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Customer Name</span>
              <div className="text-base font-bold text-text-primary mt-0.5">{selectedCustomerDetails.name}</div>
            </div>
            {selectedCustomerDetails.place && (
              <div>
                <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Place</span>
                <div className="text-sm text-text-primary mt-0.5">{selectedCustomerDetails.place}</div>
              </div>
            )}
            <div>
              <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Address / Contact Info</span>
              <div className="text-sm text-text-primary mt-0.5 bg-surface-low p-2 rounded border border-surface-dim">{selectedCustomerDetails.contact_info}</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Credit Limit</span>
                <div className="text-sm font-semibold text-text-primary mt-0.5">{formatCurrency(selectedCustomerDetails.credit_limit)}</div>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Outstanding Receivables</span>
                <div className={`text-sm font-bold mt-0.5 ${parseFloat(selectedCustomerDetails.outstanding_balance) > 0 ? 'text-amber-600' : 'text-text-primary'}`}>
                  {formatCurrency(selectedCustomerDetails.outstanding_balance)}
                </div>
              </div>
            </div>
            {(selectedCustomerDetails.contact_number || selectedCustomerDetails.whatsapp_number) && (
              <div>
                <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Contact Numbers</span>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {selectedCustomerDetails.contact_number && (
                    <ContactNumber number={selectedCustomerDetails.contact_number} isWhatsapp={false} />
                  )}
                  {selectedCustomerDetails.whatsapp_number && (
                    <ContactNumber number={selectedCustomerDetails.whatsapp_number} isWhatsapp={true} />
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </MobileBottomSheet>
    </div>
  );
}
