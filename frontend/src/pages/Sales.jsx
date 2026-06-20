import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../utils/api';
import { usePagination } from '../utils/usePagination';
import PaginationControls from '../components/PaginationControls';
import { SkeletonTable, Spinner } from '../components/Skeleton';

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
      unit_price: parseFloat(price)
    };

    setItems([...items, newItem]);
    setSelectedProduct('');
    setQty('1');
    setPrice('0');
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



  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-text-primary">Sales & Invoicing</h2>
        <p className="text-xs text-text-secondary">Process customer orders, print invoice slips, credit config limits, and record payments.</p>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-surface-low space-x-6 text-sm font-medium">
        <a 
          href="/erp/sales" 
          className={`pb-2 ${currentTab === 'create' ? 'border-b-2 border-brand-blue text-brand-blue' : 'text-text-secondary'}`}
        >
          Create Sales Invoice
        </a>
        <a 
          href="/erp/sales?tab=history" 
          className={`pb-2 ${currentTab === 'history' ? 'border-b-2 border-brand-blue text-brand-blue' : 'text-text-secondary'}`}
        >
          Sales History Log
        </a>
        <a 
          href="/erp/sales?tab=payments" 
          className={`pb-2 ${currentTab === 'payments' ? 'border-b-2 border-brand-blue text-brand-blue' : 'text-text-secondary'}`}
        >
          Customer Payments Log
        </a>
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
              
              {/* Add Line Item */}
              <div className="rounded border border-surface-low p-4 bg-surface-lowest space-y-3">
                <span className="text-xs font-semibold text-brand-blue">Add Product to Invoice</span>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="sm:col-span-2">
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
                          {p.name} ({p.barcode}) - Stock: {p.stock_qty}
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

              {/* Line Items Table */}
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
            </div>

            {/* Billing & Settlement */}
            <div className="rounded-lg bg-white p-6 shadow-sm border border-surface-low h-fit space-y-4" style={{ boxShadow: '0px 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 className="text-sm font-semibold text-text-primary">Invoice Checkout</h3>
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

                <div className="grid grid-cols-2 gap-4">
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
            </div>
          </div>
        )
      )}

      {/* Sales History */}
      {currentTab === 'history' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-t-lg border-t border-x border-surface-low">
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

          <div className="rounded-b-lg bg-white border-x border-b border-surface-low overflow-x-auto shadow-sm" style={{ boxShadow: '0px 1px 3px rgba(0,0,0,0.1)' }}>
            <table className="min-w-full text-left text-xs">
              <thead className="bg-surface-low text-text-secondary font-semibold uppercase">
                <tr>
                  {renderSortHeader('Invoice #', 'invoice_number', salesPag)}
                  {renderSortHeader('Date', 'timestamp', salesPag)}
                  <th className="px-4 py-2">Customer</th>
                  <th className="px-4 py-2">Sales Staff</th>
                  {renderSortHeader('Invoice Total', 'total_amount', salesPag)}
                  {renderSortHeader('Actual Profit', 'profit', salesPag)}
                  <th className="px-4 py-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-low">
                {salesPag.loading ? (
                  <SkeletonTable rows={salesPag.pageSize || 5} columns={7} />
                ) : (
                  <>
                    {salesPag.data.map((sale) => (
                      <tr key={sale.id} className="hover:bg-surface-bright">
                        <td className="px-4 py-3 font-semibold text-brand-blue">{sale.invoice_number}</td>
                        <td className="px-4 py-3 text-text-secondary">{new Date(sale.timestamp).toLocaleString()}</td>
                        <td className="px-4 py-3 text-text-primary">{sale.customer_name || 'Walk-In Customer'}</td>
                        <td className="px-4 py-3 text-text-secondary">{sale.employee_name || 'System Admin'}</td>
                        <td className="px-4 py-3 text-right font-semibold text-text-primary">{formatCurrency(sale.total_amount)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-green-600">{formatCurrency(sale.profit)}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => returnSale(sale.id)}
                            disabled={returningSaleId === sale.id}
                            className="inline-flex items-center justify-center space-x-1 rounded bg-error-container/10 px-2 py-1 text-[11px] font-semibold text-error hover:bg-error-container/20 disabled:opacity-50"
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

            <PaginationControls
              page={salesPag.page}
              setPage={salesPag.setPage}
              pageSize={salesPag.pageSize}
              setPageSize={salesPag.setPageSize}
              totalCount={salesPag.totalCount}
              totalPages={salesPag.totalPages}
            />
          </div>
        </div>
      )}

      {/* Customer Payments Log */}
      {currentTab === 'payments' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-t-lg border-t border-x border-surface-low">
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

          <div className="rounded-b-lg bg-white border-x border-b border-surface-low overflow-x-auto shadow-sm" style={{ boxShadow: '0px 1px 3px rgba(0,0,0,0.1)' }}>
            <table className="min-w-full text-left text-xs">
              <thead className="bg-surface-low text-text-secondary font-semibold uppercase">
                <tr>
                  {renderSortHeader('Date', 'timestamp', paymentsPag)}
                  <th className="px-4 py-2">Customer</th>
                  <th className="px-4 py-2">Deposit Account</th>
                  {renderSortHeader('Payment Received', 'amount', paymentsPag)}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-low">
                {paymentsPag.loading ? (
                  <SkeletonTable rows={paymentsPag.pageSize || 5} columns={4} />
                ) : (
                  <>
                    {paymentsPag.data.map((p) => (
                      <tr key={p.id}>
                        <td className="px-4 py-3 text-text-secondary">{new Date(p.timestamp).toLocaleString()}</td>
                        <td className="px-4 py-3 font-semibold text-text-primary">{p.customer_name}</td>
                        <td className="px-4 py-3 text-text-secondary">{p.payment_to_name}</td>
                        <td className="px-4 py-3 text-right font-semibold text-green-600">{formatCurrency(p.amount)}</td>
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

            <PaginationControls
              page={paymentsPag.page}
              setPage={paymentsPag.setPage}
              pageSize={paymentsPag.pageSize}
              setPageSize={paymentsPag.setPageSize}
              totalCount={paymentsPag.totalCount}
              totalPages={paymentsPag.totalPages}
            />
          </div>
        </div>
      )}
    </div>
  );
}
