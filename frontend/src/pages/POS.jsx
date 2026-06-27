import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../utils/api';
import { Spinner } from '../components/Skeleton';
import MobileBottomSheet from '../components/MobileBottomSheet';

function POSProductSkeleton() {
  return (
    <div className="animate-pulse flex flex-row sm:flex-col bg-white rounded-lg border border-surface-low p-2 sm:p-3 shadow-sm text-left items-center sm:items-start w-full">
      <div className="h-10 w-10 sm:h-20 sm:w-full rounded bg-surface-dim/50 border border-surface-low flex-shrink-0 sm:mb-2 mr-3 sm:mr-0" />
      <div className="flex-1 min-w-0 flex flex-col justify-between sm:w-full">
        <div>
          <div className="h-3.5 w-3/4 bg-surface-dim/40 rounded mb-1" />
          <div className="h-2.5 w-1/2 bg-surface-dim/30 rounded mb-1" />
        </div>
        <div className="flex items-center justify-between mt-1 sm:mt-2 pt-1 border-t border-surface-low sm:w-full">
          <div className="h-3 w-12 bg-surface-dim/40 rounded" />
          <div className="h-3 w-16 bg-surface-dim/30 rounded" />
        </div>
      </div>
    </div>
  );
}

import { useQuery, useQueryClient } from '@tanstack/react-query';

export default function POS() {
  const queryClient = useQueryClient();

  const { data: rawProducts = [], isLoading: productsLoading } = useQuery({
    queryKey: ['posProducts'],
    queryFn: () => api.products.list(),
  });
  const { data: customers = [], isLoading: customersLoading } = useQuery({
    queryKey: ['posCustomers'],
    queryFn: () => api.customers.list(),
  });
  const { data: bankAccounts = [], isLoading: bankAccountsLoading } = useQuery({
    queryKey: ['posBankAccounts'],
    queryFn: () => api.bankAccounts.list(),
  });

  const products = rawProducts.filter(prod => prod.status);
  const loading = productsLoading || customersLoading || bankAccountsLoading;
  const [isSubmittingCheckout, setIsSubmittingCheckout] = useState(false);

  // POS State
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeQuery, setBarcodeQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [paymentType, setPaymentType] = useState('Cash');
  const [paidTo, setPaidTo] = useState('');
  const [discount, setDiscount] = useState('0');
  const [tax, setTax] = useState('0');

  // Receipt modal state
  const [receiptSale, setReceiptSale] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showCheckoutSheet, setShowCheckoutSheet] = useState(false);

  // Price Override modal state
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideIndex, setOverrideIndex] = useState(null);
  const [overridePrice, setOverridePrice] = useState('');

  const barcodeInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (bankAccounts && bankAccounts.length > 0 && !paidTo) {
      setPaidTo(bankAccounts[0].id.toString());
    }
  }, [bankAccounts, paidTo]);

  // Handle barcode scanning simulation
  const handleBarcodeSearch = (e) => {
    e.preventDefault();
    if (!barcodeQuery) return;
    const prod = products.find(p => p.barcode === barcodeQuery);
    if (prod) {
      addToCart(prod);
      setBarcodeQuery('');
    } else {
      alert(`Product with barcode "${barcodeQuery}" not found.`);
    }
  };

  const addToCart = (product) => {
    const existing = cart.findIndex(item => item.id === product.id);
    if (existing >= 0) {
      const updated = [...cart];
      if (updated[existing].quantity >= product.stock_qty) {
        alert('Insufficient stock available!');
        return;
      }
      updated[existing].quantity += 1;
      setCart(updated);
    } else {
      if (product.stock_qty <= 0) {
        alert('Product out of stock!');
        return;
      }
      setCart([...cart, {
        id: product.id,
        name: product.name,
        barcode: product.barcode,
        selling_price: parseFloat(product.selling_price), // actual default selling price
        original_price: parseFloat(product.selling_price), // track default recommended price
        quantity: 1,
        stock_qty: product.stock_qty,
        suitable_models_details: product.suitable_models_details
      }]);
    }
  };

  const updateQty = (index, delta) => {
    const updated = [...cart];
    const item = updated[index];
    const newQty = item.quantity + delta;

    if (newQty <= 0) {
      setCart(cart.filter((_, i) => i !== index));
    } else if (newQty > item.stock_qty) {
      alert('Insufficient stock available!');
    } else {
      item.quantity = newQty;
      setCart(updated);
    }
  };

  const openOverridePrice = (index) => {
    setOverrideIndex(index);
    setOverridePrice(cart[index].selling_price.toString());
    setShowOverrideModal(true);
  };

  const saveOverridePrice = (e) => {
    e.preventDefault();
    if (overrideIndex === null || overridePrice === '') return;

    const updated = [...cart];
    updated[overrideIndex].selling_price = parseFloat(overridePrice);
    setCart(updated);
    setShowOverrideModal(false);
    setOverrideIndex(null);
  };

  const calculateSubtotal = () => {
    return cart.reduce((acc, curr) => acc + (curr.quantity * curr.selling_price), 0);
  };

  const calculateTotal = () => {
    const sub = calculateSubtotal();
    const disc = parseFloat(discount || 0);
    const taxVal = parseFloat(tax || 0);
    return Math.max(sub - disc + taxVal, 0);
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('Add products to the cart first.');
      return;
    }

    const netTotal = calculateTotal();
    const custObj = selectedCustomer ? customers.find(c => c.id === parseInt(selectedCustomer)) : null;

    if (paymentType === 'Credit' && custObj) {
      const availCredit = custObj.credit_limit - custObj.outstanding_balance;
      if (netTotal > availCredit) {
        alert(`Credit limit exceeded! Available: ₹${availCredit}`);
        return;
      }
    }

    const payload = {
      customer: selectedCustomer ? parseInt(selectedCustomer) : null,
      payment_type: paymentType,
      paid_to: paymentType !== 'Credit' ? parseInt(paidTo) : null,
      discount: parseFloat(discount),
      tax: parseFloat(tax),
      total_amount: netTotal,
      items: cart.map(item => ({
        product: item.id,
        quantity: item.quantity,
        unit_price: item.selling_price
      }))
    };

    setIsSubmittingCheckout(true);
    api.sales.create(payload)
      .then((res) => {
        setReceiptSale({
          ...res,
          items: cart, // Attach full cart items for display
          customer_name: custObj ? custObj.name : 'Walk-In Customer'
        });
        setCart([]);
        setDiscount('0');
        setTax('0');
        setSelectedCustomer('');
        setShowReceipt(true);
        setShowCheckoutSheet(false);
        queryClient.invalidateQueries({ queryKey: ['posProducts'] });
        queryClient.invalidateQueries({ queryKey: ['posCustomers'] });
        queryClient.invalidateQueries({ queryKey: ['posBankAccounts'] });
      })
      .catch((err) => alert(err.message))
      .finally(() => setIsSubmittingCheckout(false));
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(val);
  };

  const renderCheckoutForm = (isMobile = false) => (
    <div className="space-y-3 text-left">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] font-semibold text-text-secondary mb-0.5">Select Customer</label>
          <select
            value={selectedCustomer}
            onChange={(e) => setSelectedCustomer(e.target.value)}
            disabled={loading || isSubmittingCheckout}
            className="w-full rounded border border-surface-dim bg-white px-2 py-1 text-xs outline-none focus:border-brand-blue disabled:opacity-50"
          >
            <option value="">-- Walk-In Customer --</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-text-secondary mb-0.5">Payment Method</label>
          <select
            value={paymentType}
            onChange={(e) => setPaymentType(e.target.value)}
            disabled={loading || isSubmittingCheckout}
            className="w-full rounded border border-surface-dim bg-white px-2 py-1 text-xs outline-none focus:border-brand-blue disabled:opacity-50"
          >
            <option value="Cash">Cash</option>
            <option value="Bank">Bank</option>
            <option value="Credit">Credit</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] font-semibold text-text-secondary mb-0.5">Discount</label>
          <input
            type="number"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
            disabled={loading || isSubmittingCheckout}
            className="w-full rounded border border-surface-dim bg-white px-2 py-1 text-xs outline-none focus:border-brand-blue disabled:opacity-50"
          />
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-text-secondary mb-0.5">Tax</label>
          <input
            type="number"
            value={tax}
            onChange={(e) => setTax(e.target.value)}
            disabled={loading || isSubmittingCheckout}
            className="w-full rounded border border-surface-dim bg-white px-2 py-1 text-xs outline-none focus:border-brand-blue disabled:opacity-50"
          />
        </div>
      </div>

      {paymentType !== 'Credit' && (
        <div>
          <label className="block text-[10px] font-semibold text-text-secondary mb-0.5">Credit to Account</label>
          <select
            value={paidTo}
            onChange={(e) => setPaidTo(e.target.value)}
            disabled={loading || isSubmittingCheckout}
            className="w-full rounded border border-surface-dim bg-white px-2 py-1 text-xs outline-none focus:border-brand-blue disabled:opacity-50"
          >
            {bankAccounts.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Checkout Totals */}
      <div className="border-t border-surface-dim pt-3 space-y-1 text-xs font-semibold">
        <div className="flex justify-between text-text-secondary">
          <span>Subtotal:</span>
          <span>{formatCurrency(calculateSubtotal())}</span>
        </div>
        <div className="flex justify-between text-text-primary text-sm font-bold pt-1">
          <span>Total Payable:</span>
          <span className="text-brand-blue">{formatCurrency(calculateTotal())}</span>
        </div>
      </div>

      <button
        onClick={handleCheckout}
        disabled={loading || isSubmittingCheckout || cart.length === 0}
        className="w-full flex items-center justify-center space-x-2 rounded bg-brand-blue py-3 text-sm font-bold text-white hover:bg-brand-cobalt disabled:opacity-50 disabled:pointer-events-none transition cursor-pointer"
      >
        {isSubmittingCheckout && <Spinner size="sm" />}
        <span>{isMobile ? "Confirm & Pay Invoice" : "Post Checkout Terminal"}</span>
      </button>
    </div>
  );

  const filteredProducts = products.filter(p => {
    const nameMatch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const barcodeMatch = p.barcode.includes(searchQuery);
    const tagsMatch = p.suitable_models_details?.some(m =>
      `${m.brand_name} ${m.model_name}`.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return nameMatch || barcodeMatch || tagsMatch;
  });

  return (
    <div className="flex flex-col h-screen bg-surface md:flex-row overflow-hidden text-text-primary">

      {/* Products Left Panel */}
      <div className="flex-1 flex flex-col h-1/2 md:h-full overflow-hidden border-r border-surface-dim">
        {/* POS Header / Search */}
        <div className="p-4 safe-pt bg-white border-b border-surface-low space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigate('/erp')}
                className="rounded bg-surface p-1.5 hover:bg-surface-dim transition"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h2 className="text-base font-semibold tracking-tight">POS Terminal</h2>
            </div>
            {/* Barcode scanner input */}
            <form onSubmit={handleBarcodeSearch} className="flex items-center space-x-2">
              <input
                ref={barcodeInputRef}
                type="text"
                placeholder="Scan / Type Barcode"
                value={barcodeQuery}
                onChange={(e) => setBarcodeQuery(e.target.value)}
                disabled={loading || isSubmittingCheckout}
                className="rounded border border-surface-dim bg-white px-2 py-1 text-xs outline-none focus:border-brand-blue disabled:opacity-50"
              />
              <button type="submit" disabled={loading || isSubmittingCheckout} className="rounded bg-brand-blue px-2 py-1 text-xs text-white disabled:opacity-50">Scan</button>
            </form>
          </div>

          <input
            type="text"
            placeholder="Search products by name or barcode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={loading || isSubmittingCheckout}
            className="w-full rounded border border-surface-dim bg-surface-lowest px-3 py-2.5 md:py-2 text-sm md:text-xs text-text-primary outline-none focus:border-brand-blue disabled:opacity-50 search-input-mobile"
          />
        </div>

        {/* Product Grid / List */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col space-y-2 sm:grid sm:grid-cols-3 lg:grid-cols-4 sm:gap-3 sm:space-y-0">
          {loading ? (
            Array.from({ length: 8 }).map((_, idx) => (
              <POSProductSkeleton key={idx} />
            ))
          ) : filteredProducts.length === 0 ? (
            <div className="col-span-full py-8 text-center text-xs text-text-secondary">No products found.</div>
          ) : (
            filteredProducts.map((p) => (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                disabled={isSubmittingCheckout}
                className="flex flex-row sm:flex-col bg-white rounded-lg border border-surface-low p-2 sm:p-3 hover:-translate-y-0.5 transition shadow-sm hover:shadow text-left disabled:opacity-50 disabled:pointer-events-none items-center sm:items-start w-full"
              >
                <div className="h-10 w-10 sm:h-20 sm:w-full rounded bg-surface border border-surface-low overflow-hidden flex-shrink-0 sm:mb-2 mr-3 sm:mr-0">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-[10px] text-text-secondary">No image</div>
                  )}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between sm:w-full">
                  <div className="flex flex-col sm:block">
                    <span className="text-xs font-semibold text-text-primary line-clamp-1 sm:line-clamp-2 leading-tight">{p.name}</span>
                    {p.suitable_models_details && p.suitable_models_details.length > 0 && (
                      <div className="flex flex-wrap gap-0.5 mt-1">
                        {p.suitable_models_details.map(m => (
                          <span key={m.id} className="inline-block px-1 py-0.5 rounded bg-brand-blue/10 text-brand-blue text-[8px] font-semibold">
                            {m.brand_name} {m.model_name}
                          </span>
                        ))}
                      </div>
                    )}
                    <span className="text-[9px] sm:text-[10px] text-text-secondary font-mono mt-0.5 block">{p.barcode}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1 sm:mt-2 pt-1 border-t border-surface-low sm:w-full">
                    <span className="text-xs font-bold text-brand-blue">{formatCurrency(p.selling_price)}</span>
                    <span className="text-[9px] sm:text-[10px] text-text-secondary bg-surface px-1.5 py-0.5 rounded">Stock: {p.stock_qty}</span>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Cart Right Panel */}
      <div className="w-full md:w-80 lg:w-96 flex flex-col h-1/2 md:h-full bg-white shadow-lg overflow-hidden border-t md:border-t-0 border-surface-dim">

        {/* Cart Header */}
        <div className="p-4 bg-surface-low border-b border-surface-dim flex justify-between items-center">
          <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">Checkout Cart ({cart.reduce((a, c) => a + c.quantity, 0)} items)</span>
          <button
            onClick={() => setCart([])}
            disabled={loading || isSubmittingCheckout || cart.length === 0}
            className="text-[10px] font-semibold text-error hover:underline disabled:opacity-50 disabled:pointer-events-none"
          >
            Clear Cart
          </button>
        </div>

        {/* Cart items list */}
        <div className="flex-1 overflow-y-auto divide-y divide-surface-low">
          {cart.map((item, idx) => (
            <div key={idx} className="p-3 flex items-center justify-between hover:bg-surface-bright">
              <div className="flex-1 pr-3">
                <span className="text-xs font-semibold text-text-primary line-clamp-1">{item.name}</span>
                {item.suitable_models_details && item.suitable_models_details.length > 0 && (
                  <div className="flex flex-wrap gap-0.5 mt-0.5">
                    {item.suitable_models_details.map(m => (
                      <span key={m.id} className="inline-block px-1 py-0.5 rounded bg-brand-blue/10 text-brand-blue text-[8px] font-semibold">
                        {m.brand_name} {m.model_name}
                      </span>
                    ))}
                  </div>
                )}
                {/* Price display with tap override trigger */}
                <button
                  onClick={() => openOverridePrice(idx)}
                  disabled={loading || isSubmittingCheckout}
                  className="text-[10px] text-brand-blue font-bold hover:underline flex items-center space-x-1 mt-0.5 disabled:opacity-50"
                >
                  <span>Rate: {formatCurrency(item.selling_price)}</span>
                  {item.selling_price !== item.original_price && (
                    <span className="text-[9px] text-error font-medium line-through">({formatCurrency(item.original_price)})</span>
                  )}
                  <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>

              {/* Qty adjustments */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => updateQty(idx, -1)}
                  disabled={loading || isSubmittingCheckout}
                  className="h-6 w-6 flex items-center justify-center rounded-full bg-surface border border-surface-dim hover:bg-surface-dim transition font-bold text-xs disabled:opacity-50"
                >
                  -
                </button>
                <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                <button
                  onClick={() => updateQty(idx, 1)}
                  disabled={loading || isSubmittingCheckout}
                  className="h-6 w-6 flex items-center justify-center rounded-full bg-surface border border-surface-dim hover:bg-surface-dim transition font-bold text-xs disabled:opacity-50"
                >
                  +
                </button>
              </div>
            </div>
          ))}

          {cart.length === 0 && (
            <div className="flex flex-col items-center justify-center h-48 text-center text-text-secondary p-6">
              <svg className="h-10 w-10 text-surface-dim mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span className="text-xs font-semibold">Touch products on the left or scan a barcode to add items here.</span>
            </div>
          )}
        </div>

        {/* Cart Summary Form (Desktop Inline) */}
        <div className="hidden md:block p-4 bg-surface border-t border-surface-dim space-y-3">
          {renderCheckoutForm(false)}
        </div>

        {/* Mobile checkout action bar */}
        <div className="md:hidden p-3 bg-surface border-t border-surface-dim flex items-center justify-between">
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-semibold text-text-secondary">Total Payable:</span>
            <span className="text-sm font-bold text-brand-blue">{formatCurrency(calculateTotal())}</span>
          </div>
          <button
            onClick={() => setShowCheckoutSheet(true)}
            disabled={loading || isSubmittingCheckout || cart.length === 0}
            className="rounded bg-brand-blue px-6 py-2.5 text-xs font-bold text-white hover:bg-brand-cobalt disabled:opacity-50 disabled:pointer-events-none transition cursor-pointer"
          >
            Checkout & Pay
          </button>
        </div>
      </div>

      {/* Price Override Modal */}
      {showOverrideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
            <h3 className="text-sm font-semibold text-text-primary mb-2">Override Selling Price</h3>
            <p className="text-[10px] text-text-secondary mb-4">Set a custom sales rate (higher or lower) for this line item.</p>
            <form onSubmit={saveOverridePrice} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">New Unit Rate (INR)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={overridePrice}
                  onChange={(e) => setOverridePrice(e.target.value)}
                  className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm outline-none focus:border-brand-blue"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOverrideModal(false)}
                  className="rounded border border-surface-dim px-3 py-1.5 text-xs text-text-secondary hover:bg-surface-low"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded bg-brand-blue px-3 py-1.5 text-xs text-white hover:bg-brand-cobalt"
                >
                  Apply Rate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Dialog popup */}
      {showReceipt && receiptSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg border border-surface-dim text-xs font-mono">
            <div className="text-center border-b border-dashed border-surface-dim pb-4 space-y-1">
              <span className="text-base font-bold font-sans">AXON TERMINAL RECEIPT</span>
              <div className="text-[10px] text-text-secondary">Invoice: {receiptSale.invoice_number}</div>
              <div className="text-[10px] text-text-secondary">{new Date(receiptSale.timestamp).toLocaleString()}</div>
            </div>

            <div className="py-4 border-b border-dashed border-surface-dim space-y-2">
              <div className="flex justify-between font-semibold">
                <span>Item</span>
                <span className="w-12 text-center">Qty</span>
                <span className="w-16 text-right">Price</span>
              </div>
              {receiptSale.items?.map((item, i) => (
                <div key={i} className="flex justify-between">
                  <span className="truncate flex-1">{item.name}</span>
                  <span className="w-12 text-center">{item.quantity}</span>
                  <span className="w-16 text-right">{formatCurrency(item.selling_price)}</span>
                </div>
              ))}
            </div>

            <div className="py-4 space-y-1 font-semibold text-right">
              <div className="flex justify-between">
                <span>Discount:</span>
                <span>-{formatCurrency(receiptSale.discount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax:</span>
                <span>+{formatCurrency(receiptSale.tax)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold pt-2 border-t border-surface-low">
                <span>Total Paid:</span>
                <span className="text-brand-blue">{formatCurrency(receiptSale.total_amount)}</span>
              </div>
            </div>

            <div className="text-center pt-2 text-[10px] text-text-secondary border-t border-dashed border-surface-dim">
              <span>Customer: {receiptSale.customer_name}</span>
              <div className="mt-1 font-sans font-medium text-green-600">Checkout Complete! Thank you for your business.</div>
            </div>

            <button
              onClick={() => setShowReceipt(false)}
              className="mt-6 w-full rounded bg-brand-blue py-2.5 font-sans font-semibold text-white hover:bg-brand-cobalt text-xs"
            >
              Close Receipt
            </button>
          </div>
        </div>
      )}

      {/* Mobile Checkout Bottom Sheet */}
      <MobileBottomSheet
        isOpen={showCheckoutSheet}
        onClose={() => setShowCheckoutSheet(false)}
        title="Invoice Checkout & Payment"
      >
        {renderCheckoutForm(true)}
      </MobileBottomSheet>
    </div>
  );
}
