import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../utils/api';
import { usePagination } from '../utils/usePagination';
import PaginationControls from '../components/PaginationControls';
import { SkeletonTable, Spinner } from '../components/Skeleton';
import MobileBottomSheet from '../components/MobileBottomSheet';
import FloatingActionButton from '../components/FloatingActionButton';

export default function Sales() {
  const [searchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'create';

  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Action loading states
  const [isSubmittingSale, setIsSubmittingSale] = useState(false);
  const [returningSaleId, setReturningSaleId] = useState(null);

  // Mobile state variables
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showCheckoutSheet, setShowCheckoutSheet] = useState(false);
  const [showAddProductSheet, setShowAddProductSheet] = useState(false);
  const [selectedItemDetails, setSelectedItemDetails] = useState(null);
  const [selectedItemIndex, setSelectedItemIndex] = useState(null);
  const [selectedSale, setSelectedSale] = useState(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Pagination hooks for lists
  const salesPag = usePagination(api.sales.list, 10, currentTab === 'history');
  const paymentsPag = usePagination(api.customerPayments.list, 10, currentTab === 'payments');

  // Invoice Form states
  const [customer, setCustomer] = useState('');
  const [employee, setEmployee] = useState('');
  const [paymentType, setPaymentType] = useState('Cash');
  const [paidTo, setPaidTo] = useState('');
  const [discount, setDiscount] = useState('0');
  const [tax, setTax] = useState('0');

  // Selected items in Sale
  const [items, setItems] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [qty, setQty] = useState('1');
  const [price, setPrice] = useState('0');

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.products.list(),
      api.customers.list(),
      api.employees.list(),
      api.bankAccounts.list()
    ])
    .then(([prod, cust, emp, banks]) => {
      setProducts(prod);
      setCustomers(cust);
      setEmployees(emp);
      setBankAccounts(banks);
      if (banks.length > 0) setPaidTo(banks[0].id.toString());
      setLoading(false);
    })
    .catch((err) => {
      console.error(err);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

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

  const handleAddLineItem = () => {
    if (!selectedProduct) return;
    const prod = products.find(p => p.id === parseInt(selectedProduct));
    if (!prod) return;

    if (prod.stock_qty < parseInt(qty)) {
      alert(`Insufficient stock. Available: ${prod.stock_qty}`);
      return;
    }

    const newItem = {
      product: prod.id,
      name: prod.name,
      barcode: prod.barcode,
      quantity: parseInt(qty),
      unit_price: parseFloat(price),
      suitable_models_details: prod.suitable_models_details
    };

    setItems([...items, newItem]);
    setSelectedProduct('');
    setQty('1');
    setPrice('0');
    setShowAddProductSheet(false);
  };

  const handleRemoveLineItem = (idx) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const calculateSubtotal = () => {
    return items.reduce((acc, curr) => acc + (curr.quantity * curr.unit_price), 0);
  };

  const calculateTotal = () => {
    const sub = calculateSubtotal();
    const discVal = parseFloat(discount || 0);
    const taxVal = parseFloat(tax || 0);
    return sub - discVal + taxVal;
  };

  const handleSubmitSale = (e) => {
    e.preventDefault();
    if (items.length === 0) {
      alert('Add at least one product to the sales invoice.');
      return;
    }

    const payload = {
      customer: customer !== '' ? parseInt(customer) : null,
      employee: employee !== '' ? parseInt(employee) : null,
      payment_type: paymentType,
      paid_to: paymentType !== 'Credit' ? parseInt(paidTo) : null,
      discount: parseFloat(discount),
      tax: parseFloat(tax),
      total_amount: calculateTotal(),
      items: items
    };

    setIsSubmittingSale(true);
    api.sales.create(payload)
      .then(() => {
        setItems([]);
        setCustomer('');
        setEmployee('');
        setDiscount('0');
        setTax('0');
        alert('Sales Invoice Logged Successfully!');
        loadData();
        salesPag.refresh();
        setShowCheckoutSheet(false);
      })
      .catch((err) => alert(err.message))
      .finally(() => setIsSubmittingSale(false));
  };

  const returnSale = (id) => {
    if (confirm('Reverse this transaction and return products to stock?')) {
      setReturningSaleId(id);
      api.sales.return(id)
        .then((res) => {
          alert(res.message);
          loadData();
          salesPag.refresh();
        })
        .catch((err) => alert(err.message))
        .finally(() => setReturningSaleId(null));
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(val);
  };

  const renderAddProductForm = () => {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1">Select Product</label>
          <select
            value={selectedProduct}
            onChange={(e) => {
              setSelectedProduct(e.target.value);
              const prod = products.find(p => p.id === parseInt(e.target.value));
              if (prod) setPrice(prod.selling_price.toString());
            }}
            className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-blue"
          >
            <option value="">-- Choose Product --</option>
            {products.map((p) => (
              <option key={p.id} value={p.id} disabled={p.stock_qty <= 0}>
                {p.name} ({p.barcode}){p.suitable_models_details && p.suitable_models_details.length > 0 ? ` [${p.suitable_models_details.map(m => `${m.brand_name} ${m.model_name}`).join(', ')}]` : ''} - Stock: {p.stock_qty}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1">Quantity</label>
          <input
            type="number"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-blue"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1">Override Unit Selling Price (INR)</label>
          <input
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-blue"
          />
        </div>
        <div className="pt-2">
          <button
            type="button"
            onClick={handleAddLineItem}
            className="w-full rounded bg-brand-blue py-2.5 text-sm font-semibold text-white hover:bg-brand-cobalt transition"
          >
            Add Product to Invoice
          </button>
        </div>
      </div>
    );
  };

  const renderCheckoutForm = () => {
    return (
      <form onSubmit={handleSubmitSale} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1">Customer (Receivables Account)</label>
          <select
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm outline-none focus:border-brand-blue"
          >
            <option value="">-- Walk-In Customer --</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name} (Credit Avail: ₹{c.credit_limit - c.outstanding_balance})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1">Assigned Cashier / Staff</label>
          <select
            value={employee}
            onChange={(e) => setEmployee(e.target.value)}
            className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm outline-none focus:border-brand-blue"
          >
            <option value="">-- Select Employee --</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>{e.user?.username || 'admin'} ({e.role})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1">Payment Method</label>
          <select
            value={paymentType}
            onChange={(e) => setPaymentType(e.target.value)}
            className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm outline-none focus:border-brand-blue"
          >
            <option value="Cash">Cash Sale</option>
            <option value="Bank">Bank Transfer</option>
            <option value="Credit">Credit Sale (Deduct Credit Limit)</option>
          </select>
        </div>
        {paymentType !== 'Credit' && (
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Deposit Into Account</label>
            <select
              value={paidTo}
              onChange={(e) => setPaidTo(e.target.value)}
              className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm outline-none focus:border-brand-blue"
            >
              {bankAccounts.map((b) => (
                <option key={b.id} value={b.id}>{b.name} (₹{b.balance})</option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Discount (INR)</label>
            <input
              type="number"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm outline-none focus:border-brand-blue"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Sales Tax (INR)</label>
            <input
              type="number"
              value={tax}
              onChange={(e) => setTax(e.target.value)}
              className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm outline-none focus:border-brand-blue"
            />
          </div>
        </div>

        <div className="border-t border-surface-low pt-4 space-y-2 text-sm font-semibold">
          <div className="flex justify-between text-text-secondary text-xs">
            <span>Subtotal:</span>
            <span>{formatCurrency(calculateSubtotal())}</span>
          </div>
          <div className="flex justify-between text-text-primary">
            <span>Net Total Invoice:</span>
            <span className="text-brand-blue text-base">{formatCurrency(calculateTotal())}</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmittingSale}
          className="w-full flex items-center justify-center space-x-2 rounded bg-brand-blue py-2.5 text-sm font-semibold text-white hover:bg-brand-cobalt transition disabled:opacity-50"
        >
          {isSubmittingSale && <Spinner size="sm" />}
          <span>Log Sales Invoice</span>
        </button>
      </form>
    );
  };

  return (
    <div className={`space-y-6 ${isMobile && currentTab === 'create' && items.length > 0 ? 'pb-24' : ''}`}>
      {/* Title */}
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-text-primary">Sales & Invoicing</h2>
        <p className="text-xs text-text-secondary">Process customer orders, print invoice slips, credit config limits, and record payments.</p>
      </div>

      {/* Tabs Menu */}
      <div className="hidden md:block tabs-container border-b border-surface-low">
        <div className="tabs-scrollable space-x-6 text-sm font-medium">
          <Link 
            to="/erp/sales" 
            className={`pb-2 ${currentTab === 'create' ? 'border-b-2 border-brand-blue text-brand-blue' : 'text-text-secondary'}`}
          >
            Create Sales Invoice
          </Link>
          <Link 
            to="/erp/sales?tab=history" 
            className={`pb-2 ${currentTab === 'history' ? 'border-b-2 border-brand-blue text-brand-blue' : 'text-text-secondary'}`}
          >
            Sales History Log
          </Link>
          <Link 
            to="/erp/sales?tab=payments" 
            className={`pb-2 ${currentTab === 'payments' ? 'border-b-2 border-brand-blue text-brand-blue' : 'text-text-secondary'}`}
          >
            Customer Payments Log
          </Link>
        </div>
      </div>

      {/* Create Sales Invoice */}
      {currentTab === 'create' && (
        loading ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 animate-pulse">
            <div className="rounded-lg bg-white p-6 shadow-sm border border-surface-low space-y-4 lg:col-span-2">
              <div className="h-4 w-32 bg-surface-dim/50 rounded" />
              <div className="rounded border border-surface-low p-4 bg-surface-lowest space-y-3">
                <div className="h-3 w-40 bg-surface-dim/40 rounded" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 h-9 bg-surface-dim/30 rounded" />
                  <div className="h-9 bg-surface-dim/30 rounded" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-8 bg-surface-dim/20 rounded" />
                <div className="h-8 bg-surface-dim/20 rounded" />
              </div>
            </div>
            <div className="rounded-lg bg-white p-6 shadow-sm border border-surface-low space-y-4">
              <div className="h-4 w-32 bg-surface-dim/50 rounded" />
              <div className="space-y-3">
                <div className="h-9 bg-surface-dim/30 rounded" />
                <div className="h-9 bg-surface-dim/30 rounded" />
                <div className="h-9 bg-surface-dim/30 rounded" />
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Main Sale Form */}
            <div className="rounded-lg bg-white p-6 shadow-sm border border-surface-low space-y-4 lg:col-span-2" style={{ boxShadow: '0px 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 className="text-sm font-semibold text-text-primary">New Sales Invoice</h3>
              
              {/* Add Line Item (Desktop only) */}
              {!isMobile && (
                <div className="rounded border border-surface-low p-4 bg-surface-lowest space-y-3">
                  <span className="text-xs font-semibold text-brand-blue">Add Product to Invoice</span>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-semibold text-text-secondary mb-0.5">Select Product</label>
                      <select
                        value={selectedProduct}
                        onChange={(e) => {
                          setSelectedProduct(e.target.value);
                          const prod = products.find(p => p.id === parseInt(e.target.value));
                          if (prod) setPrice(prod.selling_price.toString());
                        }}
                        className="w-full rounded border border-surface-dim bg-white px-2 py-1.5 text-xs text-text-primary outline-none focus:border-brand-blue"
                      >
                        <option value="">-- Choose Product --</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id} disabled={p.stock_qty <= 0}>
                            {p.name} ({p.barcode}){p.suitable_models_details && p.suitable_models_details.length > 0 ? ` [${p.suitable_models_details.map(m => `${m.brand_name} ${m.model_name}`).join(', ')}]` : ''} - Stock: {p.stock_qty}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-text-secondary mb-0.5">Quantity</label>
                      <input
                        type="number"
                        value={qty}
                        onChange={(e) => setQty(e.target.value)}
                        className="w-full rounded border border-surface-dim bg-white px-2 py-1.5 text-xs text-text-primary outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-text-secondary mb-0.5">Override Unit Selling Price (INR)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="w-full rounded border border-surface-dim bg-white px-2 py-1.5 text-xs text-text-primary outline-none"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={handleAddLineItem}
                        className="w-full rounded bg-brand-blue py-1.5 text-xs font-semibold text-white hover:bg-brand-cobalt transition"
                      >
                        Add Product
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Line Items Layout (Table on Desktop, Cards on Mobile) */}
              {!isMobile ? (
                <div className="overflow-x-auto pt-2">
                  <table className="min-w-full text-left text-xs">
                    <thead className="bg-surface-low text-text-secondary font-semibold uppercase">
                      <tr>
                        <th className="px-3 py-1.5">Product</th>
                        <th className="px-3 py-1.5 text-right">Qty</th>
                        <th className="px-3 py-1.5 text-right">Unit Price</th>
                        <th className="px-3 py-1.5 text-right">Subtotal</th>
                        <th className="px-3 py-1.5 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-low">
                      {items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-3 py-2">
                            <span className="font-semibold text-text-primary">{item.name}</span>
                            {item.suitable_models_details && item.suitable_models_details.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1 font-normal">
                                {item.suitable_models_details.map((m) => (
                                  <span key={m.id} className="inline-block px-1.5 py-0.5 rounded bg-brand-blue/10 text-brand-blue text-[9px] font-semibold border border-brand-blue/15">
                                    {m.brand_name} {m.model_name}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-2 text-right text-text-primary">{item.quantity}</td>
                          <td className="px-3 py-2 text-right text-text-secondary">{formatCurrency(item.unit_price)}</td>
                          <td className="px-3 py-2 text-right font-semibold text-text-primary">
                            {formatCurrency(item.quantity * item.unit_price)}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveLineItem(index)}
                              className="text-error hover:underline"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                      {items.length === 0 && (
                        <tr>
                          <td colSpan="5" className="px-3 py-8 text-center text-text-secondary">No items added to invoice yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  <span className="text-xs font-semibold text-text-secondary block mb-1">Added Products</span>
                  {items.map((item, index) => (
                    <div 
                      key={index} 
                      onClick={() => {
                        setSelectedItemDetails(item);
                        setSelectedItemIndex(index);
                      }}
                      className="p-4 rounded-xl bg-surface-lowest border border-surface-low shadow-xs hover:border-brand-blue cursor-pointer transition active:scale-[0.98]"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-bold text-sm text-text-primary">{item.name}</h4>
                          {item.suitable_models_details && item.suitable_models_details.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1 font-normal">
                              {item.suitable_models_details.map((m) => (
                                <span key={m.id} className="inline-block px-1.5 py-0.5 rounded bg-brand-blue/10 text-brand-blue text-[9px] font-semibold border border-brand-blue/15">
                                  {m.brand_name} {m.model_name}
                                </span>
                              ))}
                            </div>
                          )}
                          <span className="text-[10px] bg-surface-low text-text-secondary px-1.5 py-0.5 rounded font-mono">
                            {item.barcode || 'No Barcode'}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-brand-blue">
                          {formatCurrency(item.quantity * item.unit_price)}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-text-secondary mt-1">
                        <span>Qty: <strong className="text-text-primary font-semibold">{item.quantity}</strong></span>
                        <span>Unit Price: <strong className="text-text-primary font-semibold">{formatCurrency(item.unit_price)}</strong></span>
                      </div>
                    </div>
                  ))}
                  {items.length === 0 && (
                    <div className="p-8 text-center text-text-secondary border border-dashed border-surface-low rounded-xl">
                      No items added to invoice yet.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Billing & Settlement (Desktop only) */}
            {!isMobile && (
              <div className="rounded-lg bg-white p-6 shadow-sm border border-surface-low h-fit space-y-4" style={{ boxShadow: '0px 1px 3px rgba(0,0,0,0.1)' }}>
                <h3 className="text-sm font-semibold text-text-primary">Invoice Checkout</h3>
                {renderCheckoutForm()}
              </div>
            )}
          </div>
        )
      )}

      {/* Sales History */}
      {currentTab === 'history' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 md:bg-white md:p-4 md:rounded-t-lg md:border-t md:border-x md:border-surface-low bg-transparent p-0 border-none">
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                value={salesPag.search}
                onChange={(e) => salesPag.setSearch(e.target.value)}
                placeholder="Search sales history..."
                className="w-full rounded border border-surface-dim bg-white pl-9 pr-3 py-2 text-xs text-text-primary outline-none focus:border-brand-blue placeholder:text-text-secondary"
              />
              <span className="absolute left-3 top-2.5 text-text-secondary">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
            </div>
            {salesPag.loading && (
              <span className="text-xs text-brand-blue animate-pulse">Loading...</span>
            )}
          </div>

          <div className="md:rounded-b-lg md:bg-white md:border-x md:border-b md:border-surface-low bg-transparent border-none overflow-x-auto">
            {isMobile ? (
              <div className="space-y-3 pt-2">
                {salesPag.loading ? (
                  <div className="space-y-3 animate-pulse">
                    <div className="h-20 bg-surface-dim/40 rounded-xl" />
                    <div className="h-20 bg-surface-dim/40 rounded-xl" />
                  </div>
                ) : (
                  salesPag.data.map((sale) => (
                    <div
                      key={sale.id}
                      onClick={() => setSelectedSale(sale)}
                      className="rounded-lg border border-surface-low bg-white p-3 shadow-sm active:bg-surface-low transition-colors cursor-pointer"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <span className="font-semibold text-text-primary text-sm">{sale.invoice_number}</span>
                          <span className="text-text-secondary text-[10px] block mt-0.5">{sale.customer_name || 'Walk-In Customer'}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-brand-blue text-sm">{formatCurrency(sale.total_amount)}</span>
                          <span className="font-semibold text-green-600 text-[10px] block mt-0.5">Profit: {formatCurrency(sale.profit)}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-xs text-text-secondary mt-1">
                        <span>{sale.employee_name || 'System Admin'}</span>
                        <span>{new Date(sale.timestamp).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                )}
                {salesPag.data.length === 0 && !salesPag.loading && (
                  <div className="text-center py-8 text-text-secondary text-sm">No sales invoices found.</div>
                )}
              </div>
            ) : (
              <table className="min-w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-surface-low text-text-secondary font-semibold uppercase text-xs tracking-wider">
                  <tr>
                    {renderSortHeader('Invoice #', 'invoice_number', salesPag)}
                    {renderSortHeader('Date', 'timestamp', salesPag)}
                    <th className="px-4 py-4">Customer</th>
                    <th className="px-4 py-4">Sales Staff</th>
                    {renderSortHeader('Invoice Total', 'total_amount', salesPag, true)}
                    {renderSortHeader('Actual Profit', 'profit', salesPag, true)}
                    <th className="px-4 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-low">
                  {salesPag.loading ? (
                    <SkeletonTable rows={salesPag.pageSize || 5} columns={7} />
                  ) : (
                    <>
                      {salesPag.data.map((sale) => (
                        <tr key={sale.id} className="hover:bg-surface-bright cursor-pointer" onClick={() => setSelectedSale(sale)}>
                          <td className="px-4 py-4 font-semibold text-brand-blue">{sale.invoice_number}</td>
                          <td className="px-4 py-4 text-text-secondary">{new Date(sale.timestamp).toLocaleString()}</td>
                          <td className="px-4 py-4 text-text-primary">{sale.customer_name || 'Walk-In Customer'}</td>
                          <td className="px-4 py-4 text-text-secondary">{sale.employee_name || 'System Admin'}</td>
                          <td className="px-4 py-4 text-right font-semibold text-text-primary">{formatCurrency(sale.total_amount)}</td>
                          <td className="px-4 py-4 text-right font-semibold text-green-600">{formatCurrency(sale.profit)}</td>
                          <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => returnSale(sale.id)}
                              disabled={returningSaleId === sale.id}
                              className="inline-flex items-center justify-center space-x-1 rounded bg-error-container/10 px-2.5 py-1 text-[11px] font-semibold text-error hover:bg-error-container/20 disabled:opacity-50"
                            >
                              {returningSaleId === sale.id && <Spinner size="sm" />}
                              <span>Return Invoice</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                      {salesPag.data.length === 0 && (
                        <tr>
                          <td colSpan="7" className="px-4 py-8 text-center text-text-secondary">No sales invoices found.</td>
                        </tr>
                      )}
                    </>
                  )}
                </tbody>
              </table>
            )}

            <PaginationControls
              page={salesPag.page}
              setPage={salesPag.setPage}
              pageSize={salesPag.pageSize}
              setPageSize={salesPag.setPageSize}
              totalCount={salesPag.totalCount}
              totalPages={salesPag.totalPages}
              loading={salesPag.loading}
            />
          </div>
        </div>
      )}

      {/* Customer Payments Log */}
      {currentTab === 'payments' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 md:bg-white md:p-4 md:rounded-t-lg md:border-t md:border-x md:border-surface-low bg-transparent p-0 border-none">
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                value={paymentsPag.search}
                onChange={(e) => paymentsPag.setSearch(e.target.value)}
                placeholder="Search customer payments..."
                className="w-full rounded border border-surface-dim bg-white pl-9 pr-3 py-2 text-xs text-text-primary outline-none focus:border-brand-blue placeholder:text-text-secondary"
              />
              <span className="absolute left-3 top-2.5 text-text-secondary">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
            </div>
            {paymentsPag.loading && (
              <span className="text-xs text-brand-blue animate-pulse">Loading...</span>
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
                          <span className="font-semibold text-text-primary">{p.customer_name}</span>
                          <span className="text-text-secondary text-[10px] block mt-0.5">Account: {p.payment_to_name}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-green-600">{formatCurrency(p.amount)}</span>
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
                  <div className="text-center py-8 text-text-secondary text-sm">No customer payments found.</div>
                )}
              </div>
            ) : (
              <table className="min-w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-surface-low text-text-secondary font-semibold uppercase text-xs tracking-wider">
                  <tr>
                    {renderSortHeader('Date', 'timestamp', paymentsPag)}
                    <th className="px-4 py-4">Customer</th>
                    <th className="px-4 py-4">Deposit Account</th>
                    {renderSortHeader('Payment Received', 'amount', paymentsPag, true)}
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
                          <td className="px-4 py-4 font-semibold text-text-primary">{p.customer_name}</td>
                          <td className="px-4 py-4 text-text-secondary">{p.payment_to_name}</td>
                          <td className="px-4 py-4 text-right font-semibold text-green-600">{formatCurrency(p.amount)}</td>
                        </tr>
                      ))}
                      {paymentsPag.data.length === 0 && (
                        <tr>
                          <td colSpan="4" className="px-4 py-8 text-center text-text-secondary">No customer payments found.</td>
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

      {/* Sticky Bottom Bar for Mobile Checkout */}
      {isMobile && currentTab === 'create' && items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-surface-low p-4 flex items-center justify-between z-40 md:hidden shadow-lg animate-in slide-in-from-bottom duration-300">
          <div className="flex flex-col">
            <span className="text-[10px] text-text-secondary font-medium uppercase tracking-wider">Net Total</span>
            <span className="text-lg font-bold text-brand-blue">{formatCurrency(calculateTotal())}</span>
          </div>
          <button
            onClick={() => setShowCheckoutSheet(true)}
            className="rounded bg-brand-blue px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-cobalt transition shadow-sm"
          >
            Continue to Bill
          </button>
        </div>
      )}

      {/* Product Details Bottom Sheet */}
      <MobileBottomSheet
        isOpen={selectedItemDetails !== null}
        onClose={() => {
          setSelectedItemDetails(null);
          setSelectedItemIndex(null);
        }}
        title="Item Details"
      >
        {selectedItemDetails && (
          <div className="space-y-6">
            <div className="border-b border-surface-low pb-4">
              <h4 className="text-lg font-bold text-text-primary">{selectedItemDetails.name}</h4>
              <span className="text-xs text-text-secondary font-mono bg-surface-low px-2 py-0.5 rounded inline-block mt-1">
                Barcode: {selectedItemDetails.barcode || 'N/A'}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-surface-lowest rounded-lg border border-surface-low">
                <span className="block text-xs text-text-secondary font-medium">Quantity</span>
                <span className="text-base font-bold text-text-primary mt-0.5 block">{selectedItemDetails.quantity}</span>
              </div>
              <div className="p-3 bg-surface-lowest rounded-lg border border-surface-low">
                <span className="block text-xs text-text-secondary font-medium">Unit Price</span>
                <span className="text-base font-bold text-text-primary mt-0.5 block">{formatCurrency(selectedItemDetails.unit_price)}</span>
              </div>
              <div className="p-3 bg-surface-lowest rounded-lg border border-surface-low col-span-2">
                <span className="block text-xs text-text-secondary font-medium">Subtotal</span>
                <span className="text-lg font-bold text-brand-blue mt-0.5 block">{formatCurrency(selectedItemDetails.quantity * selectedItemDetails.unit_price)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                handleRemoveLineItem(selectedItemIndex);
                setSelectedItemDetails(null);
                setSelectedItemIndex(null);
              }}
              className="w-full py-3 rounded-xl bg-error/10 hover:bg-error/15 text-error font-semibold text-sm transition"
            >
              Remove Item from Invoice
            </button>
          </div>
        )}
      </MobileBottomSheet>

      {/* Checkout Bottom Sheet (Mobile only) */}
      <MobileBottomSheet
        isOpen={showCheckoutSheet}
        onClose={() => setShowCheckoutSheet(false)}
        title="Invoice Checkout"
      >
        <div className="pb-8">
          {renderCheckoutForm()}
        </div>
      </MobileBottomSheet>

      {/* Mobile Floating Action Button */}
      {isMobile && currentTab === 'create' && (
        <FloatingActionButton
          onClick={() => setShowAddProductSheet(true)}
          label="Add Product"
        />
      )}

      {/* Add Product Bottom Sheet (Mobile only) */}
      <MobileBottomSheet
        isOpen={showAddProductSheet}
        onClose={() => setShowAddProductSheet(false)}
        title="Add Product to Invoice"
      >
        <div className="pb-8">
          {renderAddProductForm()}
        </div>
      </MobileBottomSheet>

      {/* Selected Sale Details Modal (Desktop only) */}
      {!isMobile && selectedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-surface-low pb-4 mb-4">
              <div>
                <h3 className="text-base font-bold text-text-primary">Invoice Details: {selectedSale.invoice_number}</h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  Logged on {new Date(selectedSale.timestamp).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedSale(null)}
                className="text-text-secondary hover:text-text-primary text-sm font-semibold"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs mb-6">
              <div>
                <span className="block text-text-secondary font-medium uppercase tracking-wider text-[10px]">Customer</span>
                <span className="text-sm font-semibold text-text-primary mt-0.5 block">{selectedSale.customer_name || 'Walk-In Customer'}</span>
              </div>
              <div>
                <span className="block text-text-secondary font-medium uppercase tracking-wider text-[10px]">Staff / Cashier</span>
                <span className="text-sm font-semibold text-text-primary mt-0.5 block">{selectedSale.employee_name || 'System Admin'}</span>
              </div>
              <div>
                <span className="block text-text-secondary font-medium uppercase tracking-wider text-[10px]">Payment Type</span>
                <span className="text-sm font-semibold text-text-primary mt-0.5 block">{selectedSale.payment_type}</span>
              </div>
              {selectedSale.payment_type !== 'Credit' && (
                <div>
                  <span className="block text-text-secondary font-medium uppercase tracking-wider text-[10px]">Deposited To</span>
                  <span className="text-sm font-semibold text-text-primary mt-0.5 block">{selectedSale.paid_to_name || '-'}</span>
                </div>
              )}
            </div>

            <div className="border border-surface-low rounded-lg overflow-hidden mb-6">
              <table className="min-w-full text-left text-xs">
                <thead className="bg-surface-low text-text-secondary font-semibold uppercase">
                  <tr>
                    <th className="px-3 py-2">Product</th>
                    <th className="px-3 py-2 text-right">Qty</th>
                    <th className="px-3 py-2 text-right">Unit Price</th>
                    <th className="px-3 py-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-low">
                  {selectedSale.items?.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-3 py-2">
                        <span className="font-semibold text-text-primary block">{item.product_name}</span>
                        {item.barcode && <span className="text-[10px] text-text-secondary font-mono">{item.barcode}</span>}
                      </td>
                      <td className="px-3 py-2 text-right text-text-primary">{item.quantity}</td>
                      <td className="px-3 py-2 text-right text-text-secondary">{formatCurrency(item.unit_price)}</td>
                      <td className="px-3 py-2 text-right font-semibold text-text-primary">
                        {formatCurrency(item.quantity * item.unit_price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t border-surface-low pt-4 space-y-2 text-sm font-semibold mb-6">
              <div className="flex justify-between text-text-secondary text-xs">
                <span>Discount:</span>
                <span>-{formatCurrency(selectedSale.discount)}</span>
              </div>
              <div className="flex justify-between text-text-secondary text-xs">
                <span>Tax:</span>
                <span>+{formatCurrency(selectedSale.tax)}</span>
              </div>
              <div className="flex justify-between text-text-primary">
                <span>Net Total:</span>
                <span className="text-brand-blue text-base">{formatCurrency(selectedSale.total_amount)}</span>
              </div>
              <div className="flex justify-between text-green-600 text-xs">
                <span>Actual Profit:</span>
                <span>{formatCurrency(selectedSale.profit)}</span>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  returnSale(selectedSale.id);
                  setSelectedSale(null);
                }}
                disabled={returningSaleId === selectedSale.id}
                className="rounded bg-error-container/10 px-4 py-2 text-xs font-semibold text-error hover:bg-error-container/20 disabled:opacity-50 flex items-center space-x-1.5"
              >
                {returningSaleId === selectedSale.id && <Spinner size="sm" />}
                <span>Return Invoice</span>
              </button>
              <button
                onClick={() => setSelectedSale(null)}
                className="rounded border border-surface-dim px-4 py-2 text-xs text-text-secondary hover:bg-surface-low"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Sheet for Sale Details */}
      {isMobile && selectedSale && (
        <MobileBottomSheet
          isOpen={selectedSale !== null}
          onClose={() => setSelectedSale(null)}
          title="Invoice Details"
        >
          <div className="space-y-4 pb-6 text-sm">
            <div className="flex justify-between items-start border-b border-surface-low pb-2.5">
              <div>
                <span className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">Invoice #</span>
                <div className="text-base font-bold text-text-primary">{selectedSale.invoice_number}</div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider block">Total Amount</span>
                <span className="text-base font-bold text-brand-blue">{formatCurrency(selectedSale.total_amount)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10px] font-medium text-text-secondary uppercase tracking-wider">Customer</span>
                <span className="text-text-primary font-semibold block mt-0.5">{selectedSale.customer_name || 'Walk-In Customer'}</span>
              </div>
              <div>
                <span className="text-[10px] font-medium text-text-secondary uppercase tracking-wider">Staff</span>
                <span className="text-text-primary font-semibold block mt-0.5">{selectedSale.employee_name || 'System Admin'}</span>
              </div>
              <div>
                <span className="text-[10px] font-medium text-text-secondary uppercase tracking-wider">Payment Type</span>
                <span className="text-text-primary font-semibold block mt-0.5">{selectedSale.payment_type}</span>
              </div>
              <div>
                <span className="text-[10px] font-medium text-text-secondary uppercase tracking-wider">Profit</span>
                <span className="text-green-600 font-bold block mt-0.5">{formatCurrency(selectedSale.profit)}</span>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-medium text-text-secondary uppercase tracking-wider block mb-1">Invoice Items</span>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {selectedSale.items?.map((item, idx) => (
                  <div key={idx} className="p-2.5 rounded bg-surface-low border border-surface-dim/40 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-semibold text-text-primary block">{item.product_name}</span>
                      <span className="text-[10px] text-text-secondary">{item.quantity} units @ {formatCurrency(item.unit_price)}</span>
                    </div>
                    <span className="font-bold text-text-primary">{formatCurrency(item.quantity * item.unit_price)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 border-t border-dashed border-surface-low pt-3.5 text-xs text-text-secondary">
              <div className="flex justify-between">
                <span>Discount:</span>
                <span>-{formatCurrency(selectedSale.discount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax:</span>
                <span>+{formatCurrency(selectedSale.tax)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-text-primary pt-1">
                <span>Net Total:</span>
                <span className="text-brand-blue">{formatCurrency(selectedSale.total_amount)}</span>
              </div>
            </div>

            <div className="pt-4 flex flex-col gap-2">
              <button
                onClick={() => {
                  returnSale(selectedSale.id);
                  setSelectedSale(null);
                }}
                disabled={returningSaleId === selectedSale.id}
                className="w-full py-2.5 rounded-lg bg-error/10 hover:bg-error/15 text-error font-semibold text-xs transition flex items-center justify-center space-x-1.5"
              >
                {returningSaleId === selectedSale.id && <Spinner size="sm" />}
                <span>Return Invoice</span>
              </button>
              <button
                onClick={() => setSelectedSale(null)}
                className="w-full py-2.5 rounded-lg border border-surface-dim text-text-secondary font-medium text-xs hover:bg-surface-low transition"
              >
                Close
              </button>
            </div>
          </div>
        </MobileBottomSheet>
      )}
    </div>
  );
}
