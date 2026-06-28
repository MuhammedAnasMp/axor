import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
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

export default function Suppliers() {
  const [searchParams, setSearchParams] = useSearchParams("all");
  const currentTab = searchParams.get('tab') || 'directory';
  const period = searchParams.get('period') || sessionStorage.getItem('period_suppliers') || 'today';

  useEffect(() => {
    if (!searchParams.has('period')) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set('period', period);
      setSearchParams(nextParams, { replace: true });
    }
  }, [searchParams, period, setSearchParams]);

  useEffect(() => {
    const urlPeriod = searchParams.get('period');
    if (urlPeriod) {
      sessionStorage.setItem('period_suppliers', urlPeriod);
    }
  }, [searchParams]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [selectedSupplierDetails, setSelectedSupplierDetails] = useState(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Unpaginated dropdown list
  const [bankAccounts, setBankAccounts] = useState([]);
  const [dropdownsLoading, setDropdownsLoading] = useState(true);

  // Paginated supplier directory list
  const pag = usePagination(api.suppliers.list, 10, currentTab === 'directory');

  // Mapping Form states (with search)
  const [mapProductSearch, setMapProductSearch] = useState('');
  const [mapProductResults, setMapProductResults] = useState([]);
  const [mapProductSearching, setMapProductSearching] = useState(false);
  const [showMapProductDropdown, setShowMapProductDropdown] = useState(false);
  const mapProductDropdownRef = useRef(null);

  const [mapSupplierSearch, setMapSupplierSearch] = useState('');
  const [mapSupplierResults, setMapSupplierResults] = useState([]);
  const [mapSupplierSearching, setMapSupplierSearching] = useState(false);
  const [showMapSupplierDropdown, setShowMapSupplierDropdown] = useState(false);
  const mapSupplierDropdownRef = useRef(null);

  const [mapProduct, setMapProduct] = useState('');
  const [mapSupplier, setMapSupplier] = useState('');
  const [mapCost, setMapCost] = useState('0');
  const [isSavingMapping, setIsSavingMapping] = useState(false);

  // Pagination hook for mappings tab
  const mappingPag = usePagination(api.supplierProducts.list, 10, currentTab === 'mappings');

  // Pagination hook for payment logs tab
  const paymentsPag = usePagination(api.supplierPayments.list, 10, currentTab === 'payments', { period });

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [showMappingForm, setShowMappingForm] = useState(false);
  const [name, setName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [place, setPlace] = useState('');

  // Mobile FAB options states
  const [showMenu, setShowMenu] = useState(false);

  // Payment states
  const [showPayModal, setShowPayModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payBank, setPayBank] = useState('');
  const [receiveAmount, setReceiveAmount] = useState('');
  const [receiveBank, setReceiveBank] = useState('');

  // Supplier Products Popup Modal state
  const [selectedSupplierForProducts, setSelectedSupplierForProducts] = useState(null);
  const [mappedProducts, setMappedProducts] = useState([]);
  const [mappingsLoading, setMappingsLoading] = useState(false);
  const [isSavingSupplier, setIsSavingSupplier] = useState(false);
  const [isPostingPayment, setIsPostingPayment] = useState(false);
  const [isPostingReceive, setIsPostingReceive] = useState(false);

  const openSupplierProductsModal = (supplier) => {
    setSelectedSupplierForProducts(supplier);
    setMappingsLoading(true);
    api.supplierProducts.list({ supplier_id: supplier.id })
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

  useEffect(() => {
    function handleClickOutside(event) {
      if (mapProductDropdownRef.current && !mapProductDropdownRef.current.contains(event.target)) {
        setShowMapProductDropdown(false);
      }
      if (mapSupplierDropdownRef.current && !mapSupplierDropdownRef.current.contains(event.target)) {
        setShowMapSupplierDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setMapProductSearching(true);
    const delayDebounce = setTimeout(() => {
      const params = mapProductSearch.trim() ? { search: mapProductSearch } : {};
      api.products.list(params)
        .then((res) => {
          const list = (res && res.results) || (Array.isArray(res) && res) || [];
          setMapProductResults(list);
          setMapProductSearching(false);
        })
        .catch((err) => {
          console.error(err);
          setMapProductSearching(false);
        });
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [mapProductSearch]);

  useEffect(() => {
    setMapSupplierSearching(true);
    const delayDebounce = setTimeout(() => {
      const params = mapSupplierSearch.trim() ? { search: mapSupplierSearch } : {};
      api.suppliers.list(params)
        .then((res) => {
          const list = (res && res.results) || (Array.isArray(res) && res) || [];
          setMapSupplierResults(list);
          setMapSupplierSearching(false);
        })
        .catch((err) => {
          console.error(err);
          setMapSupplierSearching(false);
        });
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [mapSupplierSearch]);

  const handleSupplierSubmit = (e) => {
    e.preventDefault();
    setIsSavingSupplier(true);

    let cleanContact = '';
    if (contactNumber.trim()) {
      const contactDigits = contactNumber.replace(/[^\d]/g, '');
      const has91 = contactDigits.length === 12 && contactDigits.startsWith('91');
      if (!(contactDigits.length === 10 || has91)) {
        alert('Contact number must be exactly 10 digits.');
        setIsSavingSupplier(false);
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
        setIsSavingSupplier(false);
        return;
      }
      cleanWhatsapp = has91 ? whatsappDigits.slice(2) : whatsappDigits;
    }

    api.suppliers.create({
      name,
      contact_info: contactInfo,
      whatsapp_number: cleanWhatsapp,
      contact_number: cleanContact,
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

  const renderSortHeaderForPag = (label, field, pagObj, isRight = false) => {
    const isSorted = pagObj.ordering === field || pagObj.ordering === `-${field}`;
    const isDesc = pagObj.ordering === `-${field}`;
    return (
      <th
        onClick={() => pagObj.handleSort(field)}
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

  const handleMappingSubmit = (e) => {
    e.preventDefault();
    if (!mapProduct || !mapSupplier) return;
    setIsSavingMapping(true);
    const payload = {
      product: parseInt(mapProduct),
      supplier: parseInt(mapSupplier),
      current_cost: parseFloat(mapCost)
    };
    api.supplierProducts.create(payload)
      .then(() => {
        setMapProduct('');
        setMapSupplier('');
        setMapProductSearch('');
        setMapSupplierSearch('');
        setMapCost('0');
        mappingPag.refresh();
        setIsSavingMapping(false);
        setShowMappingForm(false);
        alert('Supplier mapping saved successfully!');
      })
      .catch((err) => {
        alert(err.message);
        setIsSavingMapping(false);
      });
  };

  const deleteMapping = (id) => {
    if (confirm('Remove this supplier product mapping?')) {
      api.supplierProducts.delete(id)
        .then(() => mappingPag.refresh())
        .catch((err) => alert(err.message));
    }
  };

  const renderMappingForm = (isMobile = false) => (
    <form onSubmit={handleMappingSubmit} className="space-y-4">
      <div ref={mapProductDropdownRef} className="relative">
        <label className="block text-xs font-semibold text-text-secondary mb-1">Select Product SKU</label>
        <div className="relative">
          <input
            type="text"
            placeholder="Search product by name or barcode..."
            value={mapProductSearch}
            onChange={(e) => {
              setMapProductSearch(e.target.value);
              setShowMapProductDropdown(true);
            }}
            onFocus={() => {
              setShowMapProductDropdown(true);
            }}
            className="w-full rounded border border-surface-dim bg-white pl-3 pr-8 py-3 md:py-2 text-sm text-text-primary outline-none focus:border-brand-blue search-input-mobile"
            required={!mapProduct}
          />
          {mapProductSearching && (
            <span className="absolute right-8 top-3.5 md:top-2.5 text-[10px] text-brand-blue animate-pulse">Searching...</span>
          )}
          <span className="absolute right-2.5 top-3.5 md:top-2.5 text-text-secondary pointer-events-none">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </div>
        {showMapProductDropdown && (
          <div className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-black/5 focus:outline-none border border-surface-dim">
            {mapProductResults.length === 0 ? (
              <div className="px-3 py-2 text-text-secondary">No products found. Please type to search.</div>
            ) : (
              mapProductResults.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setMapProduct(p.id.toString());
                    setMapProductSearch(`${p.name} (${p.barcode})`);
                    setShowMapProductDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-2 hover:bg-surface-low text-text-primary font-medium border-b border-surface-lowest last:border-0 ${mapProduct === p.id.toString() ? 'bg-surface-low font-semibold' : ''}`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span>{p.name} ({p.barcode})</span>
                    <span className="text-xs font-semibold text-text-secondary ml-2">RSP: {formatCurrency(p.selling_price)}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>
      <div ref={mapSupplierDropdownRef} className="relative">
        <label className="block text-xs font-semibold text-text-secondary mb-1">Select Supplier</label>
        <div className="relative">
          <input
            type="text"
            placeholder="Search supplier..."
            value={mapSupplierSearch}
            onChange={(e) => {
              setMapSupplierSearch(e.target.value);
              setShowMapSupplierDropdown(true);
            }}
            onFocus={() => {
              setShowMapSupplierDropdown(true);
            }}
            className="w-full rounded border border-surface-dim bg-white pl-3 pr-8 py-3 md:py-2 text-sm text-text-primary outline-none focus:border-brand-blue search-input-mobile"
            required={!mapSupplier}
          />
          {mapSupplierSearching && (
            <span className="absolute right-8 top-3.5 md:top-2.5 text-[10px] text-brand-blue animate-pulse">Searching...</span>
          )}
          <span className="absolute right-2.5 top-3.5 md:top-2.5 text-text-secondary pointer-events-none">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </div>
        {showMapSupplierDropdown && (
          <div className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-black/5 focus:outline-none border border-surface-dim">
            {mapSupplierResults.length === 0 ? (
              <div className="px-3 py-2 text-text-secondary">No suppliers found. Please type to search.</div>
            ) : (
              mapSupplierResults.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setMapSupplier(s.id.toString());
                    setMapSupplierSearch(s.name);
                    setShowMapSupplierDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-2 hover:bg-surface-low text-text-primary font-medium border-b border-surface-lowest last:border-0 ${mapSupplier === s.id.toString() ? 'bg-surface-low font-semibold' : ''}`}
                >
                  {s.name}
                </button>
              ))
            )}
          </div>
        )}
      </div>
      <div>
        <label className="block text-xs font-semibold text-text-secondary mb-1">Purchase Cost (Negotiated Price, INR)</label>
        <input
          type="number"
          step="0.01"
          required
          value={mapCost}
          onChange={(e) => setMapCost(e.target.value)}
          className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-blue"
        />
      </div>
      <button
        type="submit"
        disabled={isSavingMapping}
        className="w-full rounded bg-brand-blue py-2 text-sm font-semibold text-white hover:bg-brand-cobalt transition flex items-center justify-center space-x-1.5 disabled:opacity-50 disabled:pointer-events-none"
      >
        {isSavingMapping && <Spinner size="sm" />}
        <span>{isSavingMapping ? 'Linking...' : 'Save Supplier Mapping'}</span>
      </button>
    </form>
  );

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Title */}
      {!isMobile && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-text-primary">Suppliers Directory</h2>
            <p className="text-xs text-text-secondary">Manage suppliers, track outstanding balances, and record payments.</p>
          </div>
          {currentTab === 'directory' && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="hidden md:inline-block rounded bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-brand-cobalt transition"
            >
              {showForm ? 'Cancel' : 'Add Supplier'}
            </button>
          )}
          {currentTab === 'mappings' && (
            <button
              onClick={() => setShowMappingForm(!showMappingForm)}
              className="hidden md:inline-block rounded bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-brand-cobalt transition"
            >
              {showMappingForm ? 'Cancel' : 'Link Supplier'}
            </button>
          )}
        </div>
      )}

      {/* Tabs Menu */}
      {!isMobile && (
        <div className="hidden md:block tabs-container border-b border-surface-low">
          <div className="tabs-scrollable space-x-6 text-sm font-medium">
            <Link
              to="/erp/suppliers"
              className={`pb-2 ${currentTab === 'directory' ? 'border-b-2 border-brand-blue text-brand-blue' : 'text-text-secondary'}`}
            >
              Supplier Directory
            </Link>
            <Link
              to="/erp/suppliers?tab=mappings"
              className={`pb-2 ${currentTab === 'mappings' ? 'border-b-2 border-brand-blue text-brand-blue' : 'text-text-secondary'}`}
            >
              Supplier Mappings
            </Link>
            <Link
              to="/erp/suppliers?tab=payments"
              className={`pb-2 ${currentTab === 'payments' ? 'border-b-2 border-brand-blue text-brand-blue' : 'text-text-secondary'}`}
            >
              Payment Logs
            </Link>
          </div>
        </div>
      )}

      {/* Tabs (Mobile) */}
      {isMobile && (
        <div className="flex border-b border-surface-low mb-4">
          <Link
            to="/erp/suppliers"
            className={`flex-1 text-center py-2.5 text-xs font-semibold transition ${currentTab === 'directory' ? 'border-b-2 border-brand-blue text-brand-blue' : 'text-text-secondary'
              }`}
          >
            Directory
          </Link>
          <Link
            to="/erp/suppliers?tab=mappings"
            className={`flex-1 text-center py-2.5 text-xs font-semibold transition ${currentTab === 'mappings' ? 'border-b-2 border-brand-blue text-brand-blue' : 'text-text-secondary'
              }`}
          >
            Mappings
          </Link>
          <Link
            to="/erp/suppliers?tab=payments"
            className={`flex-1 text-center py-2.5 text-xs font-semibold transition ${currentTab === 'payments' ? 'border-b-2 border-brand-blue text-brand-blue' : 'text-text-secondary'
              }`}
          >
            Payment Logs
          </Link>
        </div>
      )}

      {currentTab === 'directory' && showForm && (
        <div className="hidden md:block">
          {renderSupplierForm(false)}
        </div>
      )}

      {/* Directory Table Wrapper */}
      {currentTab === 'directory' && (
        <div className="space-y-4">
          {/* Search & loading bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 md:bg-white md:p-4 md:rounded-t-lg md:border-t md:border-x md:border-surface-low bg-transparent p-0 border-none">
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                value={pag.search}
                onChange={(e) => pag.setSearch(e.target.value)}
                placeholder="Search suppliers by name..."
                className="w-full rounded border border-surface-dim bg-white pl-9 pr-3 py-3 md:py-2 text-sm md:text-xs text-text-primary outline-none focus:border-brand-blue placeholder:text-text-secondary search-input-mobile"
              />
              <span className="absolute left-3 top-3.5 md:top-2.5 text-text-secondary">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
            </div>
            {pag.loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-brand-blue border-t-transparent" />
            )}
          </div>

          {/* Directory Table */}
          {isMobile ? (
            <div className="space-y-3 md:pt-2">
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
                pag.data.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => setSelectedSupplierDetails(s)}
                    className="rounded-lg border border-surface-low bg-white p-3.5 shadow-sm active:bg-surface-low transition-colors cursor-pointer space-y-2 text-sm"
                  >
                    {/* Row 1: Supplier Name, Balance */}
                    <div className="flex justify-between items-start gap-3">
                      <div className="min-w-0">
                        <div className="font-bold text-text-primary flex items-center space-x-1">
                          <span className="truncate block">{s.name}</span>
                        </div>
                        <div className="text-xs text-text-secondary mt-0.5">{s.place || 'No Location'}</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded ${parseFloat(s.outstanding_balance) > 0 ? 'bg-red-50 text-error border border-error/10' :
                          parseFloat(s.outstanding_balance) < 0 ? 'bg-green-50 text-green-700 border border-green-700/10' :
                            'bg-surface-low text-text-secondary border border-surface-dim/20'
                          }`}>
                          {formatCurrency(s.outstanding_balance)}
                        </span>
                      </div>
                    </div>

                    {/* Row 2: Contact, Action buttons */}
                    <div className="flex justify-between items-center pt-2 border-t border-dashed border-surface-low text-xs">
                      <div className="flex flex-wrap gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {s.contact_number && (
                          <ContactNumber number={s.contact_number} isWhatsapp={false} />
                        )}
                        {s.whatsapp_number && (
                          <ContactNumber number={s.whatsapp_number} isWhatsapp={true} />
                        )}
                      </div>
                      <div className="flex space-x-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => openSupplierProductsModal(s)}
                          className="rounded border border-surface-dim bg-white px-2.5 py-1 text-xs font-semibold text-brand-blue"
                          title="Mapped Products"
                        >
                          Products
                        </button>
                        {parseFloat(s.outstanding_balance) > 0 ? (
                          <button
                            onClick={() => openPayModal(s)}
                            className="rounded bg-brand-blue text-white px-2.5 py-1 text-xs font-semibold"
                          >
                            Pay
                          </button>
                        ) : parseFloat(s.outstanding_balance) < 0 ? (
                          <button
                            onClick={() => openReceiveModal(s)}
                            className="rounded bg-emerald-600 text-white px-2.5 py-1 text-xs font-semibold"
                          >
                            Receive
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))
              )}
              {pag.data.length === 0 && !pag.loading && (
                <div className="p-8 text-center text-sm text-text-secondary">No suppliers found.</div>
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
                    {renderSortHeader('Supplier Name', 'name')}
                    <th className="px-4 py-3 max-w-[180px]">Contact Details</th>
                    {renderSortHeader('Place', 'place')}
                    {renderSortHeader('Outstanding Balance', 'outstanding_balance')}
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-low">
                  {pag.loading ? (
                    <SkeletonTable rows={pag.pageSize || 5} columns={5} />
                  ) : (
                    pag.data.map((s) => (
                      <tr key={s.id} className="hover:bg-surface-bright border-b border-surface-low">
                        <td className="px-4 py-4 font-semibold text-text-primary">
                          <button
                            type="button"
                            onClick={() => openSupplierProductsModal(s)}
                            className="text-left font-semibold text-brand-blue hover:underline focus:outline-none flex items-center space-x-1"
                          >
                            <span className="truncate max-w-[100px] sm:max-w-[150px] block" title={s.name}>
                              {s.name}
                            </span>
                            <svg className="h-3.5 w-3.5 text-brand-blue/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </button>
                        </td>
                        <td className="px-4 py-4 text-text-secondary max-w-[180px]">
                          <div className="space-y-1">
                            <div className="truncate" title={s.contact_info}>{s.contact_info}</div>
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
                        <td className="px-4 py-4 text-text-secondary font-medium">{s.place || '-'}</td>
                        <td className="px-4 py-4 text-right">
                          <span className={`font-semibold ${parseFloat(s.outstanding_balance) > 0 ? 'text-error font-bold' : 'text-text-primary'}`}>
                            {formatCurrency(s.outstanding_balance)}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          {parseFloat(s.outstanding_balance) > 0 ? (
                            <button
                              onClick={() => openPayModal(s)}
                              className="rounded bg-brand-blue/10 px-3 py-1.5 text-xs font-semibold text-brand-blue hover:bg-brand-blue/20 transition w-20 text-center inline-block"
                            >
                              Pay
                            </button>
                          ) : parseFloat(s.outstanding_balance) < 0 ? (
                            <button
                              onClick={() => openReceiveModal(s)}
                              className="rounded bg-emerald-600/10 px-3 py-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-600/20 transition w-20 text-center inline-block"
                            >
                              Receive
                            </button>
                          ) : (
                            <button
                              disabled
                              className="rounded bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-400 cursor-not-allowed transition w-20 text-center inline-block"
                            >
                              Pay
                            </button>
                          )}
                        </td>
                      </tr>
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
                loading={pag.loading}
              />
            </div>
          )}
        </div>
      )}

      {/* Supplier Mappings Tab */}
      {currentTab === 'mappings' && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Add Supplier Product Mapping */}
          {showMappingForm && (
            <div className="hidden md:block rounded-lg bg-white p-6 shadow-sm border border-surface-low h-fit" style={{ boxShadow: '0px 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 className="text-sm font-semibold text-text-primary mb-4">Link Supplier to SKU</h3>
              {renderMappingForm(false)}
            </div>
          )}

          {/* Mappings List */}
          <div className={`md:rounded-lg md:bg-white p-0 md:p-6 md:shadow-sm ${showMappingForm ? 'md:col-span-2' : 'md:col-span-3'}`} style={isMobile ? {} : { boxShadow: '0px 1px 3px rgba(0,0,0,0.1)' }}>
            {/* <h3 className="text-sm font-semibold text-text-primary mb-4">Supplier-Product Matrix</h3> */}

            {/* Search and Loading */}
            <div className="flex items-center justify-between mb-4 gap-4">
              <input
                type="text"
                value={mappingPag.search}
                onChange={(e) => mappingPag.setSearch(e.target.value)}
                placeholder="Search matrix by product/supplier..."
                className="w-full sm:w-64 rounded border border-surface-dim bg-white px-3 py-2.5 md:py-1.5 text-sm md:text-xs text-text-primary outline-none focus:border-brand-blue search-input-mobile"
              />
              {mappingPag.loading && <div className="animate-spin rounded-full h-4 w-4 border-2 border-brand-blue border-t-transparent" />}
            </div>

            {isMobile ? (
              <div className="space-y-3 pt-2">
                {mappingPag.loading ? (
                  <div className="p-3 space-y-4">
                    {[1, 2, 3, 4, 5].map((idx) => (
                      <div key={idx} className="animate-pulse space-y-2">
                        <div className="h-4 bg-surface-low rounded w-3/4"></div>
                        <div className="h-3 bg-surface-low rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  mappingPag.data.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => setSelectedSupplierDetails({ ...m, isMapping: true })}
                      className="rounded-lg border border-surface-low bg-white p-3.5 shadow-sm active:bg-surface-low transition-colors cursor-pointer space-y-2 text-sm"
                    >
                      {/* Row 1: Product Name, Negotiated Cost */}
                      <div className="flex justify-between items-start gap-3">
                        <div className="min-w-0">
                          <div className="font-bold text-text-primary truncate">{m.product_name}</div>
                          {m.suitable_models_details && m.suitable_models_details.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1 font-normal">
                              {m.suitable_models_details.map((sm) => (
                                <span key={sm.id} className="inline-block px-1.5 py-0.5 rounded bg-brand-blue/10 text-brand-blue text-[9px] font-semibold border border-brand-blue/15">
                                  {sm.brand_name} {sm.model_name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="inline-block text-xs font-bold px-2 py-0.5 rounded bg-brand-blue/10 text-brand-blue font-semibold">
                            {formatCurrency(m.current_cost)}
                          </span>
                        </div>
                      </div>

                      {/* Row 2: Barcode, Supplier Name, Actions */}
                      <div className="flex justify-between items-center pt-2 border-t border-dashed border-surface-low text-xs">
                        <div className="min-w-0">
                          <span className="font-mono text-text-secondary">{m.barcode}</span>
                          <span className="text-text-secondary mx-2">|</span>
                          <span className="text-text-primary font-semibold truncate">{m.supplier_name}</span>
                          <span className="text-text-secondary mx-2">|</span>
                          <span className="text-text-secondary font-semibold">RSP: {formatCurrency(m.selling_price)}</span>
                        </div>
                        <div onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => deleteMapping(m.id)}
                            className="rounded bg-error-container/10 px-2.5 py-1 text-xs font-semibold text-error hover:bg-error-container/20 transition"
                            title="Remove Mapping"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                {mappingPag.data.length === 0 && !mappingPag.loading && (
                  <div className="p-8 text-center text-sm text-text-secondary">No supplier product mappings established.</div>
                )}
                <PaginationControls
                  page={mappingPag.page}
                  setPage={mappingPag.setPage}
                  pageSize={mappingPag.pageSize}
                  setPageSize={mappingPag.setPageSize}
                  totalCount={mappingPag.totalCount}
                  totalPages={mappingPag.totalPages}
                  loading={mappingPag.loading}
                />
              </div>
            ) : (
              <div className="divide-y divide-surface-low text-sm border border-surface-low rounded-lg bg-white overflow-hidden">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-surface-low text-text-secondary font-semibold uppercase text-xs tracking-wider">
                    <tr>
                      {renderSortHeaderForPag('Product SKU', 'product__name', mappingPag)}
                      <th>Barcode</th>
                      <th>Supplier</th>
                      <th>RSP</th>
                      {renderSortHeaderForPag('Negotiated Cost', 'current_cost', mappingPag)}
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-low">
                    {mappingPag.loading ? (
                      <SkeletonTable rows={mappingPag.pageSize || 5} columns={6} />
                    ) : (
                      mappingPag.data.map((m) => (
                        <tr key={m.id} className="hover:bg-surface-bright">
                          <td className="px-4 py-4 font-semibold text-text-primary">
                            <div>{m.product_name}</div>
                            {m.suitable_models_details && m.suitable_models_details.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1 font-normal">
                                {m.suitable_models_details.map((sm) => (
                                  <span key={sm.id} className="inline-block px-1.5 py-0.5 rounded bg-brand-blue/10 text-brand-blue text-[9px] font-semibold border border-brand-blue/15">
                                    {sm.brand_name} {sm.model_name}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4 text-text-secondary font-mono">{m.barcode}</td>
                          <td className="px-4 py-4 text-text-primary">{m.supplier_name}</td>
                          <td className="px-4 py-4 text-text-secondary font-semibold">{formatCurrency(m.selling_price)}</td>
                          <td className="px-4 py-4 font-bold text-brand-blue">{formatCurrency(m.current_cost)}</td>
                          <td className="px-4 py-4 text-right whitespace-nowrap">
                            <button
                              onClick={() => deleteMapping(m.id)}
                              className="inline-flex items-center justify-center rounded bg-error-container/10 p-1 sm:px-2 sm:py-1 text-[11px] font-semibold text-error hover:bg-error-container/20 transition"
                              title="Remove Mapping"
                            >
                              <svg className="h-3 w-3 sm:mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              <span className="hidden sm:inline">Remove</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                    {mappingPag.data.length === 0 && !mappingPag.loading && (
                      <tr>
                        <td colSpan="6" className="px-4 py-8 text-center text-text-secondary">No supplier product mappings established.</td>
                      </tr>
                    )}
                  </tbody>
                </table>

                <PaginationControls
                  page={mappingPag.page}
                  setPage={mappingPag.setPage}
                  pageSize={mappingPag.pageSize}
                  setPageSize={mappingPag.setPageSize}
                  totalCount={mappingPag.totalCount}
                  totalPages={mappingPag.totalPages}
                  loading={mappingPag.loading}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Supplier Payment Logs Tab */}
      {currentTab === 'payments' && (
        <div className="space-y-4">
          {/* Search & loading bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 md:bg-white md:p-4 md:rounded-t-lg md:border-t md:border-x md:border-surface-low bg-transparent p-0 border-none">
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                value={paymentsPag.search}
                onChange={(e) => paymentsPag.setSearch(e.target.value)}
                placeholder="Search supplier payments..."
                className="w-full rounded border border-surface-dim bg-white pl-9 pr-3 py-3 md:py-2 text-sm md:text-xs text-text-primary outline-none focus:border-brand-blue placeholder:text-text-secondary search-input-mobile"
              />
              <span className="absolute left-3 top-3.5 md:top-2.5 text-text-secondary">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <label htmlFor="payments-period-select" className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Period:</label>
              {!period.startsWith('custom_') ? (
                <select
                  id="payments-period-select"
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
            {paymentsPag.loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-brand-blue border-t-transparent" />
            )}
          </div>

          <div className="md:rounded-b-lg md:bg-white md:border-x md:border-b md:border-surface-low bg-transparent border-none overflow-x-auto">
            {isMobile ? (
              <div className="space-y-3 pt-2">
                {paymentsPag.loading ? (
                  <div className="space-y-3 animate-pulse">
                    <div className="h-20 bg-surface-dim/40 rounded-xl" />
                    <div className="h-20 bg-surface-dim/40 rounded-xl" />
                  </div>
                ) : (
                  paymentsPag.data.map((p) => (
                    <div
                      key={p.id}
                      className="rounded-lg border border-surface-low bg-white p-3 shadow-sm text-sm"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <span className="font-semibold text-text-primary">{p.supplier_name}</span>
                          <span className="text-text-secondary text-[10px] block mt-0.5">Account: {p.payment_from_name}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-error">{formatCurrency(p.amount)}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-xs text-text-secondary mt-1">
                        <span>Date</span>
                        <span>{new Date(p.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  ))
                )}
                {paymentsPag.data.length === 0 && !paymentsPag.loading && (
                  <div className="text-center py-8 text-text-secondary text-sm">No supplier payments found.</div>
                )}
              </div>
            ) : (
              <table className="min-w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-surface-low text-text-secondary font-semibold uppercase text-xs tracking-wider">
                  <tr>
                    {renderSortHeaderForPag('Date', 'timestamp', paymentsPag)}
                    <th className="px-4 py-4">Supplier</th>
                    <th className="px-4 py-4">Account</th>
                    {renderSortHeaderForPag('Amount', 'amount', paymentsPag, true)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-low">
                  {paymentsPag.loading ? (
                    <SkeletonTable rows={paymentsPag.pageSize || 5} columns={4} />
                  ) : (
                    <>
                      {paymentsPag.data.map((p) => (
                        <tr key={p.id}>
                          <td className="px-4 py-4 text-text-secondary">{new Date(p.timestamp).toLocaleString()}</td>
                          <td className="px-4 py-4 font-semibold text-text-primary">{p.supplier_name}</td>
                          <td className="px-4 py-4 text-text-secondary">{p.payment_from_name}</td>
                          <td className="px-4 py-4 text-right font-semibold text-error">{formatCurrency(p.amount)}</td>
                        </tr>
                      ))}
                      {paymentsPag.data.length === 0 && (
                        <tr>
                          <td colSpan="4" className="px-4 py-8 text-center text-text-secondary">No supplier payments found.</td>
                        </tr>
                      )}
                    </>
                  )}
                </tbody>
              </table>
            )}

            <PaginationControls
              page={paymentsPag.page}
              setPage={paymentsPag.setPage}
              pageSize={paymentsPag.pageSize}
              setPageSize={paymentsPag.setPageSize}
              totalCount={paymentsPag.totalCount}
              totalPages={paymentsPag.totalPages}
              loading={paymentsPag.loading}
            />
          </div>
        </div>
      )}

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
        isOpen={showMappingForm}
        onClose={() => setShowMappingForm(false)}
        title="Link Supplier to SKU"
      >
        {renderMappingForm(true)}
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

      {/* Mobile Create Menu Sheet */}
      <MobileBottomSheet
        isOpen={showMenu}
        onClose={() => setShowMenu(false)}
        title="Create New..."
      >
        <div className="space-y-3 pb-4">
          <button
            onClick={() => {
              setShowMenu(false);
              setName('');
              setContactInfo('');
              setWhatsappNumber('');
              setContactNumber('');
              setPlace('');
              setShowForm(true);
            }}
            className="w-full flex items-center space-x-3 p-4 rounded-xl border border-surface-low hover:bg-surface-low text-left text-sm font-medium text-text-primary transition"
          >
            <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-brand-blue/10 text-brand-blue">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <div>
              <div className="font-semibold">New Supplier</div>
              <div className="text-xs text-text-secondary">Register a new vendor/supplier</div>
            </div>
          </button>

          <button
            onClick={() => {
              setShowMenu(false);
              setMapProduct('');
              setMapSupplier('');
              setMapProductSearch('');
              setMapSupplierSearch('');
              setMapCost('0');
              setShowMappingForm(true);
            }}
            className="w-full flex items-center space-x-3 p-4 rounded-xl border border-surface-low hover:bg-surface-low text-left text-sm font-medium text-text-primary transition"
          >
            <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-green-600/10 text-green-600">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <div>
              <div className="font-semibold">Supplier Product Mapping</div>
              <div className="text-xs text-text-secondary">Link product SKU to supplier negotiate cost</div>
            </div>
          </button>
        </div>
      </MobileBottomSheet>

      {/* Floating Action Button for mobile */}
      {((currentTab === 'directory' && !showForm) ||
        (currentTab === 'mappings' && !showMappingForm)) &&
        !showPayModal && !showReceiveModal && !showMenu && (
          <FloatingActionButton
            icon={
              currentTab === 'directory' ? (
                <div className="relative">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="absolute -top-1.5 -right-1.5 bg-white text-brand-blue rounded-full text-[9px] font-black h-4 w-4 flex items-center justify-center border border-brand-blue shadow-xs">+</span>
                </div>
              ) : currentTab === 'mappings' ? (
                <div className="relative">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <span className="absolute -top-1.5 -right-1.5 bg-white text-brand-blue rounded-full text-[9px] font-black h-4 w-4 flex items-center justify-center border border-brand-blue shadow-xs">+</span>
                </div>
              ) : null
            }
            onClick={() => {
              if (currentTab === 'directory') {
                setName('');
                setContactInfo('');
                setWhatsappNumber('');
                setContactNumber('');
                setPlace('');
                setShowForm(true);
              } else if (currentTab === 'mappings') {
                setMapProduct('');
                setMapSupplier('');
                setMapProductSearch('');
                setMapSupplierSearch('');
                setMapCost('0');
                setShowMappingForm(true);
              }
            }}
          />
        )}

      {/* Supplier Mapped Products Modal */}
      {selectedSupplierForProducts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-lg relative max-h-[90vh] flex flex-col">
            <button
              onClick={() => setSelectedSupplierForProducts(null)}
              className="absolute top-4 right-4 text-text-secondary hover:text-text-primary text-sm font-bold bg-surface-low hover:bg-surface-dim rounded-full w-7 h-7 flex items-center justify-center transition cursor-pointer"
            >
              ✕
            </button>
            <h3 className="text-sm font-bold text-text-primary mb-2 pr-6">
              Mapped Products: {selectedSupplierForProducts.name}
            </h3>
            <p className="text-[11px] text-text-secondary mb-4">
              Below are the products and their negotiated purchase costs with this supplier.
            </p>

            <div className="flex-1 overflow-y-auto border border-surface-dim rounded-md">
              <table className="min-w-full text-left text-xs">
                <thead className="bg-surface-low text-text-secondary font-semibold uppercase sticky top-0">
                  <tr>
                    <th className="px-4 py-2">Product Name</th>
                    <th className="px-4 py-2">Barcode</th>
                    <th className="px-4 py-2 text-right">RSP</th>
                    <th className="px-4 py-2 text-right">Negotiated Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-low">
                  {mappingsLoading ? (
                    <SkeletonTable rows={3} columns={4} />
                  ) : (
                    mappedProducts.map((mp) => (
                      <tr key={mp.id} className="hover:bg-surface-bright">
                        <td className="px-4 py-3 font-semibold text-text-primary">
                          <div>{mp.product_name}</div>
                          {mp.suitable_models_details && mp.suitable_models_details.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1 font-normal">
                              {mp.suitable_models_details.map((m) => (
                                <span key={m.id} className="inline-block px-1.5 py-0.5 rounded bg-brand-blue/10 text-brand-blue text-[9px] font-semibold border border-brand-blue/15">
                                  {m.brand_name} {m.model_name}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-text-secondary font-mono">{mp.barcode}</td>
                        <td className="px-4 py-3 text-right text-text-secondary font-semibold">{formatCurrency(mp.selling_price)}</td>
                        <td className="px-4 py-3 text-right font-bold text-brand-blue">{formatCurrency(mp.current_cost)}</td>
                      </tr>
                    ))
                  )}
                  {mappedProducts.length === 0 && !mappingsLoading && (
                    <tr>
                      <td colSpan="4" className="px-4 py-8 text-center text-text-secondary">
                        No products mapped to this supplier.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setSelectedSupplierForProducts(null)}
                className="rounded bg-brand-blue px-4 py-2 text-xs font-semibold text-white hover:bg-brand-cobalt transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Mobile Bottom Sheet for Supplier Details */}
      <MobileBottomSheet
        isOpen={selectedSupplierDetails !== null}
        onClose={() => setSelectedSupplierDetails(null)}
        title={selectedSupplierDetails?.isMapping ? 'Supplier SKU Mapping Details' : 'Supplier Details'}
      >
        {selectedSupplierDetails && (
          <div className="space-y-4 pb-6 text-sm">
            {selectedSupplierDetails.isMapping ? (
              <>
                <div>
                  <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Product SKU</span>
                  <div className="text-base font-bold text-text-primary mt-0.5">{selectedSupplierDetails.product_name}</div>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Barcode</span>
                  <div className="text-sm font-mono text-text-primary mt-0.5">{selectedSupplierDetails.barcode}</div>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Supplier</span>
                  <div className="text-sm font-semibold text-text-primary mt-0.5">{selectedSupplierDetails.supplier_name}</div>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">RSP (Retail Selling Price)</span>
                  <div className="text-sm font-semibold text-text-primary mt-0.5">{formatCurrency(selectedSupplierDetails.selling_price)}</div>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Negotiated Cost</span>
                  <div className="text-lg font-bold text-brand-blue mt-0.5">{formatCurrency(selectedSupplierDetails.current_cost)}</div>
                </div>
                {selectedSupplierDetails.suitable_models_details && selectedSupplierDetails.suitable_models_details.length > 0 && (
                  <div>
                    <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Suitable Models</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedSupplierDetails.suitable_models_details.map((m) => (
                        <span key={m.id} className="inline-block px-1.5 py-0.5 rounded bg-brand-blue/10 text-brand-blue text-[10px] font-semibold">
                          {m.brand_name} {m.model_name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div>
                  <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Supplier Name</span>
                  <div className="text-base font-bold text-text-primary mt-0.5">{selectedSupplierDetails.name}</div>
                </div>
                {selectedSupplierDetails.place && (
                  <div>
                    <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Place</span>
                    <div className="text-sm text-text-primary mt-0.5">{selectedSupplierDetails.place}</div>
                  </div>
                )}
                <div>
                  <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Contact Address / Info</span>
                  <div className="text-sm text-text-primary mt-0.5 bg-surface-low p-2 rounded border border-surface-dim">{selectedSupplierDetails.contact_info}</div>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Outstanding Balance</span>
                  <div className={`text-base font-bold mt-0.5 ${parseFloat(selectedSupplierDetails.outstanding_balance) > 0 ? 'text-error' : parseFloat(selectedSupplierDetails.outstanding_balance) < 0 ? 'text-green-700' : 'text-text-primary'}`}>
                    {formatCurrency(selectedSupplierDetails.outstanding_balance)}
                  </div>
                </div>
                {(selectedSupplierDetails.contact_number || selectedSupplierDetails.whatsapp_number) && (
                  <div>
                    <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Contact Numbers</span>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      {selectedSupplierDetails.contact_number && (
                        <ContactNumber number={selectedSupplierDetails.contact_number} isWhatsapp={false} />
                      )}
                      {selectedSupplierDetails.whatsapp_number && (
                        <ContactNumber number={selectedSupplierDetails.whatsapp_number} isWhatsapp={true} />
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </MobileBottomSheet>
    </div>
  );
}
