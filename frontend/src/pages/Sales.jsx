import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../utils/api';
import { usePagination } from '../utils/usePagination';
import PaginationControls from '../components/PaginationControls';
import { SkeletonTable, Spinner } from '../components/Skeleton';
import MobileBottomSheet from '../components/MobileBottomSheet';
import FloatingActionButton from '../components/FloatingActionButton';
import { toPng } from 'html-to-image';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

export default function Sales() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab') || 'create_invoice';
  const currentTab = (rawTab === 'create_invoice' || rawTab === 'create') ? 'create' : rawTab;
  const period = searchParams.get('period') || sessionStorage.getItem('period_sales') || 'all';

  useEffect(() => {
    let nextParams = null;
    if (!searchParams.has('period')) {
      nextParams = new URLSearchParams(nextParams || searchParams);
      nextParams.set('period', period);
    }
    if (!searchParams.has('tab')) {
      nextParams = new URLSearchParams(nextParams || searchParams);
      nextParams.set('tab', 'create_invoice');
    }
    if (nextParams) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [searchParams, period, setSearchParams]);

  useEffect(() => {
    const urlPeriod = searchParams.get('period');
    if (urlPeriod) {
      sessionStorage.setItem('period_sales', urlPeriod);
    }
  }, [searchParams]);

  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [isSharing, setIsSharing] = useState(false);
  const [logoBase64, setLogoBase64] = useState('');

  useEffect(() => {
    fetch('/icon_for_website-removebg-preview_no_border.png')
      .then((res) => res.blob())
      .then((blob) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setLogoBase64(reader.result);
        };
        reader.readAsDataURL(blob);
      })
      .catch((err) => console.error('Error loading logo as base64:', err));
  }, []);

  useEffect(() => {
    api.auth.me()
      .then((user) => {
        setCurrentUser(user);
        cons
      })
      .catch((err) => {
        console.error("Error fetching user profile:", err);
      });
  }, []);

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
  const [detailsTab, setDetailsTab] = useState('staff');
  const [keepA4, setKeepA4] = useState(() => localStorage.getItem('keepA4') === 'true');
  const [shouldShareAfterSubmit, setShouldShareAfterSubmit] = useState(false);

  useEffect(() => {
    localStorage.setItem('keepA4', keepA4);
  }, [keepA4]);

  useEffect(() => {
    if (selectedSale) {
      setDetailsTab('staff');
    }
  }, [selectedSale]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Pagination hooks for lists
  const salesPag = usePagination(api.sales.list, 10, currentTab === 'history', { period });

  // Invoice Form states
  const [customer, setCustomer] = useState('');
  const [employee, setEmployee] = useState('');
  const [paymentType, setPaymentType] = useState('Cash');
  const [paidTo, setPaidTo] = useState('');
  const [discount, setDiscount] = useState('0');
  const [tax, setTax] = useState('0');

  // Quick-add customer states
  const [showQuickCustomer, setShowQuickCustomer] = useState(false);
  const [quickName, setQuickName] = useState('');
  const [quickContact, setQuickContact] = useState('');
  const [quickPlace, setQuickPlace] = useState('');
  const [quickPhone, setQuickPhone] = useState('');
  const [quickWhatsapp, setQuickWhatsapp] = useState('');
  const [quickCreditLimit, setQuickCreditLimit] = useState('10000');
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);

  // Selected items in Sale
  const [items, setItems] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [qty, setQty] = useState('1');
  const [price, setPrice] = useState('0');

  const [productSearch, setProductSearch] = useState('');
  const [searchedProducts, setSearchedProducts] = useState([]);
  const [selectedProductObj, setSelectedProductObj] = useState(null);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const dropdownRef = useRef(null);
  const mobileDropdownRef = useRef(null);

  // View All Popup States
  const [showViewAllPopup, setShowViewAllPopup] = useState(false);
  const [popupCategories, setPopupCategories] = useState([]);
  const [activePopupCategory, setActivePopupCategory] = useState('all');
  const [popupProducts, setPopupProducts] = useState([]);
  const [popupLoading, setPopupLoading] = useState(false);
  const [popupSearchQuery, setPopupSearchQuery] = useState('');

  useEffect(() => {
    if (!productSearch.trim()) {
      setSearchedProducts([]);
      return;
    }
    if (selectedProductObj && productSearch === `${selectedProductObj.name} (${selectedProductObj.barcode})`) {
      return;
    }
    setSearching(true);
    const delayDebounce = setTimeout(() => {
      api.products.list({ search: productSearch })
        .then((res) => {
          if (res && res.results) {
            setSearchedProducts(res.results);
          } else if (Array.isArray(res)) {
            setSearchedProducts(res);
          } else {
            setSearchedProducts([]);
          }
          setSearching(false);
        })
        .catch((err) => {
          console.error(err);
          setSearching(false);
        });
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [productSearch, selectedProductObj]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (mobileDropdownRef.current && !mobileDropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleOpenViewAllPopup = () => {
    setShowViewAllPopup(true);
    setPopupLoading(true);
    setPopupSearchQuery('');

    Promise.all([
      api.categories.list(),
      api.products.list()
    ])
      .then(([catsRes, productsRes]) => {
        const cats = (catsRes && catsRes.results) || (Array.isArray(catsRes) && catsRes) || [];
        const prods = (productsRes && productsRes.results) || (Array.isArray(productsRes) && productsRes) || [];
        const allCats = [{ id: 'all', name: 'All Products' }, ...cats];
        setPopupCategories(allCats);
        setActivePopupCategory('all');
        setPopupProducts(prods);
        setPopupLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setPopupLoading(false);
      });
  };

  const handleSelectProductPopup = (prod) => {
    setSelectedProductObj(prod);
    setSelectedProduct(prod.id.toString());
    setProductSearch(`${prod.name} (${prod.barcode})`);
    setPrice(prod.selling_price.toString());
    setShowViewAllPopup(false);
  };

  const filteredProductsList = popupProducts.filter(p => {
    const matchesCategory = activePopupCategory === 'all' || (p.category && p.category.toString() === activePopupCategory.toString());
    const matchesSearch = (p.name || '').toLowerCase().includes(popupSearchQuery.toLowerCase()) ||
      (p.barcode || '').toLowerCase().includes(popupSearchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

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

  const reloadCustomers = () =>
    api.customers.list().then((c) => setCustomers(c)).catch(console.error);

  const handleQuickCustomerSubmit = (e) => {
    e.preventDefault();
    if (!quickName.trim() || !quickContact.trim()) return;

    const validatePhone = (num, label) => {
      if (!num.trim()) return true; // optional
      const d = num.replace(/[^\d]/g, '');
      if (d.length !== 10) {
        alert(`${label} must be exactly 10 digits.`);
        return false;
      }
      return true;
    };

    if (!validatePhone(quickPhone, 'Phone number')) return;
    if (!validatePhone(quickWhatsapp, 'WhatsApp number')) return;

    setIsCreatingCustomer(true);

    const cleanPhone = (num) => num.replace(/[^\d]/g, '').slice(-10);

    api.customers.create({
      name: quickName.trim(),
      contact_info: quickContact.trim(),
      place: quickPlace.trim(),
      contact_number: quickPhone.trim() ? cleanPhone(quickPhone) : '',
      whatsapp_number: quickWhatsapp.trim() ? cleanPhone(quickWhatsapp) : '',
      credit_limit: parseFloat(quickCreditLimit) || 10000,
    })
      .then((newCustomer) => {
        reloadCustomers().then(() => {
          setCustomer(newCustomer.id.toString());
        });
        setShowQuickCustomer(false);
        setQuickName('');
        setQuickContact('');
        setQuickPlace('');
        setQuickPhone('');
        setQuickWhatsapp('');
        setQuickCreditLimit('10000');
        setIsCreatingCustomer(false);
      })
      .catch((err) => {
        alert(err.message);
        setIsCreatingCustomer(false);
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
    const prod = selectedProductObj;
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
    setProductSearch('');
    setSelectedProductObj(null);
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
      .then((createdSale) => {
        setItems([]);
        setCustomer('');
        setEmployee('');
        setDiscount('0');
        setTax('0');
        alert('Sales Invoice Logged Successfully!');
        loadData();
        salesPag.refresh();
        setShowCheckoutSheet(false);

        if (shouldShareAfterSubmit) {
          setSelectedSale(createdSale);
          handleShareWithCustomer(createdSale);
        }
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

  const handleShareWithCustomer = async (sale) => {
    if (!sale) return;
    setIsSharing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const node = document.getElementById('invoice-share-card');
      if (!node) {
        throw new Error('Invoice template element not found');
      }

      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });

      const fileName = `Invoice-${sale.invoice_number || sale.id}.png`;

      if (Capacitor.isNativePlatform()) {
        const base64Data = dataUrl.split(',')[1];

        const writeResult = await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Cache,
        });

        await Share.share({
          title: `Invoice ${sale.invoice_number}`,
          text: `Here is your invoice ${sale.invoice_number} from ${currentUser?.company_name || currentUser?.business_name || 'Axon Accessories'}`,
          files: [writeResult.uri],
        });
      } else {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], fileName, { type: 'image/png' });

        const downloadFallback = () => {
          const link = document.createElement('a');
          link.download = fileName;
          link.href = dataUrl;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        };

        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              title: `Invoice ${sale.invoice_number}`,
              text: `Invoice ${sale.invoice_number} from ${currentUser?.company_name || currentUser?.business_name || 'Axon Accessories'}`,
              files: [file],
            });
          } catch (shareErr) {
            console.warn('Navigator share blocked/cancelled, falling back to download:', shareErr);
            downloadFallback();
          }
        } else {
          downloadFallback();
        }
      }
    } catch (err) {
      console.error('Error sharing invoice:', err);
      alert('Failed to share invoice: ' + err.message);
    } finally {
      setIsSharing(false);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(val);
  };

  const renderBrandedInvoice = (sale, scaleForMobile = false, forceKeepA4 = false) => {
    if (!sale) return null;
    const phone = currentUser?.phone || currentUser?.contact_number || currentUser?.whatsapp_number || '';
    const email = currentUser?.email || '';
    const fName = currentUser?.user?.first_name || currentUser?.first_name || '';
    const lName = currentUser?.user?.last_name || currentUser?.last_name || '';
    const empName = [fName, lName].filter(Boolean).join(' ') || sale.employee_name || 'System Admin';

    const subtotalVal = (sale.items || []).reduce((acc, item) => acc + (item.quantity * item.unit_price), 0);
    const discountVal = parseFloat(sale.discount || 0);
    const finalAmountVal = parseFloat(sale.total_amount || 0);

    return (
      <div id="invoice-share-card-container" style={{ width: scaleForMobile ? '100%' : (forceKeepA4 ? '794px' : '850px'), margin: '0 auto' }}>
        <style dangerouslySetInnerHTML={{
          __html: `
          .invoice-share-card {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.02), 0 4px 6px -4px rgba(0, 0, 0, 0.02), 0 0 0 1px rgba(0, 0, 0, 0.04);
            display: flex;
            flex-direction: column;
            text-align: left;
            color: #334155;
            line-height: 1.5;
            box-sizing: border-box;
            width: 100%;
            min-height: ${forceKeepA4 ? '1123px' : 'auto'};
            flex-grow: 1;
          }
          .invoice-share-card * {
            box-sizing: border-box;
          }
          .invoice-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 24px;
          }
          .invoice-company {
            display: flex;
            gap: 8px;
            align-items: center;
          }
          .invoice-logo {
            width: 70px;
            height: 70px;
            object-fit: contain;
            padding: 2px;
          }
          .invoice-company h1 {
            font-size: 22px;
            font-weight: 700;
            color: #0f172a;
            margin: 0;
            letter-spacing: -0.03em;
          }
          .invoice-company p {
            margin-top: 4px;
            color: #64748b;
            font-size: 13px;
            line-height: 1.4;
          }
          .invoice-meta {
            text-align: right;
          }
          .invoice-meta h2 {
            font-size: 26px;
            font-weight: 800;
            color: #0f172a;
            letter-spacing: -0.03em;
            margin: 0 0 8px 0;
          }
          .invoice-meta-table {
            border-collapse: collapse;
            margin-left: auto;
          }
          .invoice-meta-table td {
            padding: 2px 0 2px 16px;
            font-size: 13px;
            border: none;
            text-align: right;
          }
          .invoice-meta-table td:first-child {
            color: #64748b;
            font-weight: 400;
          }
          .invoice-meta-table td:last-child {
            color: #0f172a;
            font-weight: 600;
          }
          .invoice-status-badge {
            background-color: #dcfce7;
            color: #15803d;
            padding: 3px 10px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.03em;
            display: inline-block;
          }
          .invoice-info-grid {
            margin-top: 24px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
          }
          .invoice-section-title {
            font-weight: 600;
            font-size: 11px;
            color: #64748b;
            letter-spacing: 0.05em;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 6px;
            margin-bottom: 10px;
            text-transform: uppercase;
          }
          .invoice-address-block b {
            color: #0f172a;
            font-size: 15px;
            font-weight: 600;
            display: block;
            margin-bottom: 4px;
          }
          .invoice-address-block p {
            font-size: 13px;
            color: #334155;
            line-height: 1.4;
          }
          .invoice-address-block.customer {
            text-align: right;
          }
          .invoice-items-container {
            margin-top: 30px;
            flex-grow: 1;
          }
          .invoice-items-table {
            width: 100%;
            border-collapse: collapse;
          }
          .invoice-items-table th {
            background: #0f172a;
            color: white;
            text-transform: uppercase;
            font-size: 11px;
            font-weight: 600;
            letter-spacing: 0.05em;
            padding: 10px 14px;
            border: none;
          }
          .invoice-items-table th:first-child { border-radius: 6px 0 0 6px; }
          .invoice-items-table th:last-child { border-radius: 0 6px 6px 0; }
          .invoice-items-table td {
            padding: 10px 14px;
            font-size: 13px;
            border-bottom: 1px solid #e2e8f0;
            color: #334155;
          }
          .invoice-items-table tr td b {
            font-weight: 600;
            color: #0f172a;
          }
          .invoice-summary-container {
            margin-top: 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-top: 14px;
            border-top: 1px solid #e2e8f0;
          }
          .invoice-payment-method {
            font-size: 13px;
          }
          .invoice-payment-method .label {
            color: #64748b;
            font-weight: 400;
          }
          .invoice-payment-method .value {
            color: #0f172a;
            font-weight: 600;
            background: #f8fafc;
            padding: 2px 6px;
            border-radius: 4px;
            border: 1px solid #e2e8f0;
          }
          .invoice-summary-row {
            display: flex;
            align-items: center;
            gap: 14px;
            font-size: 13px;
          }
          .invoice-summary-item {
            display: inline-flex;
            align-items: center;
            gap: 4px;
          }
          .invoice-summary-item .label {
            color: #64748b;
            font-weight: 400;
          }
          .invoice-summary-item .value {
            color: #0f172a;
            font-weight: 600;
          }
          .invoice-summary-item.discount .value {
            color: #c2410c; 
          }
          .invoice-summary-item.total-due {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 5px 12px;
            border-radius: 6px;
            margin-left: 6px;
          }
          .invoice-summary-item.total-due .label {
            color: #0f172a;
            font-weight: 600;
          }
          .invoice-summary-item.total-due .value {
            font-size: 16px;
            font-weight: 700;
            color: #0f172a;
            letter-spacing: -0.02em;
          }
          .invoice-summary-separator {
            color: #e2e8f0;
            font-weight: 400;
          }
          .invoice-notes {
            margin-top: 30px;
            background: #fffcf8; 
            border: 1px solid #fdf4e9;
            border-left: 4px solid #dd9c58;
            padding: 12px;
            border-radius: 4px 8px 8px 4px;
          }
          .invoice-notes b {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.03em;
            color: #0f172a;
            display: block;
            margin-bottom: 2px;
          }
          .invoice-notes p {
            font-size: 11px;
            color: #64748b;
            line-height: 1.4;
          }
          .invoice-footer {
            margin-top: 30px;
            border-top: 1px solid #e2e8f0;
            padding-top: 16px;
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            color: #64748b;
            font-weight: 400;
          }
          .invoice-footer b {
            color: #334155;
            font-weight: 600;
          }
        ` }} />

        <div className="invoice-share-card">
          <div className="invoice-header">
            <div className="invoice-company">
              <img src={logoBase64 || "/icon_for_website-removebg-preview_no_border.png"} className="invoice-logo" alt="Logo" />
              <div>
                <h1>{currentUser?.company_name || currentUser?.business_name || 'Axon Accessories'}</h1>
                <p>
                  {currentUser?.address || 'Metro City, Kerala'}<br />
                  {phone && <span>Phone: {phone}<br /></span>}
                  {email && <span>Email: {email}</span>}
                </p>
              </div>
            </div>

            <div className="invoice-meta">
              <h2>INVOICE</h2>
              <table className="invoice-meta-table">
                <tbody>
                  <tr>
                    <td>Invoice No:</td>
                    <td>{sale.invoice_number}</td>
                  </tr>
                  <tr>
                    <td>Date:</td>
                    <td>{new Date(sale.timestamp).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  </tr>
                  <tr>
                    <td>Status:</td>
                    <td><span className="invoice-status-badge">PAID</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="invoice-info-grid">
            <div className="invoice-address-block">
              <div className="invoice-section-title">From</div>
              <b>{currentUser?.company_name || currentUser?.business_name || 'Axon Accessories'}</b>
              <p>
                {currentUser?.address || 'Metro City, Kerala'}<br />
                {phone && <span>Phone: {phone}<br /></span>}
                {email && <span>Email: {email}</span>}
              </p>
            </div>

            <div className="invoice-address-block customer">
              <div className="invoice-section-title">Bill To</div>
              <b>{sale.customer_name || 'Walk-In Customer'}</b>
              <p>
                {sale.customer_address || 'Customer Address'}<br />
                {sale.customer_phone && <span>Phone: {sale.customer_phone}<br /></span>}
                {sale.customer_email && <span>Email: {sale.customer_email}</span>}
              </p>
            </div>
          </div>

          <div className="invoice-items-container">
            <table className="invoice-items-table">
              <thead>
                <tr>
                  <th className="text-center" style={{ width: '8%' }}>Sl</th>
                  <th className="text-left" style={{ width: '40%' }}>Description</th>
                  <th className="text-center" style={{ width: '15%' }}>Code</th>
                  <th className="text-center" style={{ width: '10%' }}>Qty</th>
                  <th className="text-right" style={{ width: '12%' }}>Price</th>
                  <th className="text-right" style={{ width: '10%' }}>Tax</th>
                  <th className="text-right" style={{ width: '15%' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {(sale.items || []).map((item, idx) => (
                  <tr key={idx}>
                    <td className="text-center">{idx + 1}</td>
                    <td className="text-left"><b>{item.product_name}</b></td>
                    <td className="text-center">{item.barcode || '-'}</td>
                    <td className="text-center">{item.quantity}</td>
                    <td className="text-right">{formatCurrency(item.unit_price)}</td>
                    <td className="text-right">₹0.00</td>
                    <td className="text-right"><b>{formatCurrency(item.quantity * item.unit_price)}</b></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="invoice-summary-container">
            <div className="invoice-payment-method">
              <span className="label">Payment Method: </span>
              <span className="value">{sale.payment_type}</span>
            </div>

            <div className="invoice-summary-row">
              <div className="invoice-summary-item">
                <span className="label">Subtotal:</span>
                <span className="value">{formatCurrency(subtotalVal)}</span>
              </div>
              <span className="invoice-summary-separator">•</span>
              <div className="invoice-summary-item discount">
                <span className="label">Discount:</span>
                <span className="value">-{formatCurrency(discountVal)}</span>
              </div>
              <span className="invoice-summary-separator">•</span>
              <div className="invoice-summary-item">
                <span className="label">Tax:</span>
                <span className="value">₹0.00</span>
              </div>
              <div className="invoice-summary-item total-due">
                <span className="label">Total Due:</span>
                <span className="value">{formatCurrency(finalAmountVal)}</span>
              </div>
            </div>
          </div>

          <div className="invoice-notes">
            <b>Notes & Terms:</b>
            <p>{sale.notes || "Thank you for your business. Goods once sold cannot be returned without prior approval."}</p>
          </div>

          <div className="invoice-footer">
            <div>Generated by <b>{currentUser?.company_name || currentUser?.business_name || 'Axon Accessories'}</b> ({empName})</div>
            <div>
              {new Date().toLocaleString("en-US", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderBrandedInvoiceWithZoom = (sale) => {
    const invoiceHeight = 950;
    return (
      <div className="flex flex-col items-center w-full">
        <style dangerouslySetInnerHTML={{ __html: `
          .no-scrollbar::-webkit-scrollbar {
            display: none !important;
          }
          .no-scrollbar {
            -ms-overflow-style: none !important;
            scrollbar-width: none !important;
          }
        ` }} />
        {/* Frame with native scrolling but hidden scrollbar handles */}
        <div className="w-full overflow-auto no-scrollbar border border-surface-low rounded-lg bg-surface-lowest p-2 flex justify-start relative min-h-[250px] max-h-[70vh]">
          <div 
            className="origin-top-left"
            style={{
              transform: 'scale(0.7)',
              transformOrigin: 'top left',
              width: '850px',
              minWidth: '850px',
              marginBottom: `calc(0.3 * -${invoiceHeight}px)`,
            }}
          >
            {renderBrandedInvoice(sale, false, false)}
          </div>
        </div>
      </div>
    );
  };

  const renderStaffInvoice = (sale) => {
    if (!sale) return null;
    return (
      <div className="space-y-4 text-xs text-left">
        {/* Basic Metadata */}
        <div className="grid grid-cols-2 gap-4 bg-surface-lowest p-3 rounded-lg border border-surface-low mb-2">
          <div>
            <span className="block text-text-secondary font-medium uppercase tracking-wider text-[10px]">Customer</span>
            <span className="text-sm font-semibold text-text-primary mt-0.5 block">{sale.customer_name || 'Walk-In Customer'}</span>
          </div>
          <div>
            <span className="block text-text-secondary font-medium uppercase tracking-wider text-[10px]">Staff / Cashier</span>
            <span className="text-sm font-semibold text-text-primary mt-0.5 block">{sale.employee_name || 'System Admin'}</span>
          </div>
          <div>
            <span className="block text-text-secondary font-medium uppercase tracking-wider text-[10px]">Payment Type</span>
            <span className="text-sm font-semibold text-text-primary mt-0.5 block">{sale.payment_type}</span>
          </div>
          {sale.payment_type !== 'Credit' && (
            <div>
              <span className="block text-text-secondary font-medium uppercase tracking-wider text-[10px]">Deposited To</span>
              <span className="text-sm font-semibold text-text-primary mt-0.5 block">{sale.paid_to_name || '-'}</span>
            </div>
          )}
        </div>

        {/* Items Table */}
        <div className="border border-surface-low rounded-lg overflow-hidden">
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
              {sale.items?.map((item, idx) => (
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

        {/* Totals & Profits */}
        <div className="border-t border-surface-low pt-4 space-y-2 text-sm font-semibold">
          <div className="flex justify-between text-text-secondary text-xs">
            <span>Discount:</span>
            <span>-{formatCurrency(sale.discount)}</span>
          </div>
          <div className="flex justify-between text-text-secondary text-xs">
            <span>Tax:</span>
            <span>+{formatCurrency(sale.tax)}</span>
          </div>
          <div className="flex justify-between text-text-primary">
            <span>Net Total:</span>
            <span className="text-brand-blue text-base">{formatCurrency(sale.total_amount)}</span>
          </div>
          <div className="flex justify-between text-green-600 text-xs border-t border-dashed border-surface-low pt-2">
            <span>Actual Profit:</span>
            <span className="text-green-600 font-bold">{formatCurrency(sale.profit)}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderAddProductForm = () => {
    return (
      <div className="space-y-4">
        <div ref={mobileDropdownRef} className="relative">
          <div className="flex justify-between items-center mb-1">
            <label className="block text-xs font-semibold text-text-secondary">Search/Select Product</label>
            <button
              type="button"
              onClick={handleOpenViewAllPopup}
              className="text-[10px] text-brand-blue hover:underline font-semibold flex items-center"
              title="View all products"
            >
              <span>View All</span>
            </button>
          </div>
          <input
            type="text"
            placeholder="Type product name or barcode..."
            value={productSearch}
            onChange={(e) => {
              setProductSearch(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            className="w-full rounded border border-surface-dim bg-white px-3 py-3 md:py-2 text-sm text-text-primary outline-none focus:border-brand-blue search-input-mobile"
          />
          {searching && (
            <span className="absolute right-3 top-9 text-xs text-brand-blue animate-pulse">Searching...</span>
          )}
          {showDropdown && (productSearch.trim() !== '' || searchedProducts.length > 0) && (
            <div className="absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-xs shadow-lg ring-1 ring-black/5 focus:outline-none border border-surface-dim">
              {searchedProducts.length === 0 ? (
                <div className="px-3 py-2 text-text-secondary">No products found.</div>
              ) : (
                searchedProducts.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    disabled={p.stock_qty <= 0}
                    onClick={() => {
                      setSelectedProductObj(p);
                      setSelectedProduct(p.id.toString());
                      setProductSearch(`${p.name} (${p.barcode})`);
                      setShowDropdown(false);
                      setPrice(p.selling_price.toString());
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-surface-low disabled:opacity-50 disabled:bg-surface-lowest border-b border-surface-low last:border-0 font-medium"
                  >
                    <div className="font-semibold text-text-primary">
                      {p.name} ({p.barcode})
                    </div>
                    <div className="text-[10px] text-text-secondary mt-0.5">
                      Stock: {p.stock_qty} | Price: ₹{p.selling_price}
                      {p.suitable_models_details && p.suitable_models_details.length > 0 && (
                        <span className="ml-1 text-brand-blue font-semibold">
                          [{p.suitable_models_details.map(m => `${m.brand_name} ${m.model_name}`).join(', ')}]
                        </span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Quantity</label>
            <input
              type="number"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className="w-full rounded border border-surface-dim bg-white px-3 py-3 md:py-2 text-sm text-text-primary outline-none focus:border-brand-blue"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Unit Price (INR)</label>
            <input
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full rounded border border-surface-dim bg-white px-3 py-3 md:py-2 text-sm text-text-primary outline-none focus:border-brand-blue"
            />
          </div>
        </div>
        <div className="pt-2">
          <button
            type="button"
            onClick={handleAddLineItem}
            className="w-full rounded bg-brand-blue py-3 text-sm font-semibold text-white hover:bg-brand-cobalt transition"
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
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-text-secondary">Customer (Receivables Account)</label>
            <button
              type="button"
              onClick={() => setShowQuickCustomer((v) => !v)}
              className="text-[10px] font-semibold text-brand-blue hover:underline flex items-center gap-0.5"
            >
              {showQuickCustomer ? 'Cancel' : '+ New Customer'}
            </button>
          </div>
          {showQuickCustomer ? (
            <div className="rounded border border-brand-blue/30 bg-blue-50/40 p-3 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-text-secondary mb-0.5">Name *</label>
                  <input
                    type="text"
                    required
                    value={quickName}
                    onChange={(e) => setQuickName(e.target.value)}
                    placeholder="Customer name"
                    className="w-full rounded border border-surface-dim bg-white px-2 py-1.5 text-xs text-text-primary outline-none focus:border-brand-blue"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-text-secondary mb-0.5">Place</label>
                  <input
                    type="text"
                    value={quickPlace}
                    onChange={(e) => setQuickPlace(e.target.value)}
                    placeholder="City / Town"
                    className="w-full rounded border border-surface-dim bg-white px-2 py-1.5 text-xs text-text-primary outline-none focus:border-brand-blue"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-text-secondary mb-0.5">Address / Contact Info *</label>
                <input
                  type="text"
                  required
                  value={quickContact}
                  onChange={(e) => setQuickContact(e.target.value)}
                  placeholder="Address or contact details"
                  className="w-full rounded border border-surface-dim bg-white px-2 py-1.5 text-xs text-text-primary outline-none focus:border-brand-blue"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-text-secondary mb-0.5">Phone</label>
                  <div className="flex rounded border border-surface-dim bg-white focus-within:border-brand-blue overflow-hidden">
                    <span className="bg-surface-low px-2 py-1.5 text-[10px] font-semibold text-text-secondary border-r border-surface-dim select-none">+91</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={10}
                      value={quickPhone}
                      onChange={(e) => setQuickPhone(e.target.value.replace(/[^\d]/g, '').slice(0, 10))}
                      placeholder="XXXXXXXXXX"
                      className="flex-1 bg-transparent px-2 py-1.5 text-xs text-text-primary outline-none"
                    />
                  </div>
                  {quickPhone && quickPhone.length !== 10 && (
                    <p className="text-[9px] text-error mt-0.5">Must be 10 digits</p>
                  )}
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-text-secondary mb-0.5">WhatsApp</label>
                  <div className="flex rounded border border-surface-dim bg-white focus-within:border-brand-blue overflow-hidden">
                    <span className="bg-surface-low px-2 py-1.5 text-[10px] font-semibold text-text-secondary border-r border-surface-dim select-none">+91</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={10}
                      value={quickWhatsapp}
                      onChange={(e) => setQuickWhatsapp(e.target.value.replace(/[^\d]/g, '').slice(0, 10))}
                      placeholder="XXXXXXXXXX"
                      className="flex-1 bg-transparent px-2 py-1.5 text-xs text-text-primary outline-none"
                    />
                  </div>
                  {quickWhatsapp && quickWhatsapp.length !== 10 && (
                    <p className="text-[9px] text-error mt-0.5">Must be 10 digits</p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-text-secondary mb-0.5">Credit Limit (INR)</label>
                <input
                  type="number"
                  value={quickCreditLimit}
                  onChange={(e) => setQuickCreditLimit(e.target.value)}
                  className="w-full rounded border border-surface-dim bg-white px-2 py-1.5 text-xs text-text-primary outline-none focus:border-brand-blue"
                />
              </div>
              <button
                type="button"
                onClick={handleQuickCustomerSubmit}
                disabled={isCreatingCustomer || !quickName.trim() || !quickContact.trim()}
                className="w-full rounded bg-brand-blue py-1.5 text-xs font-semibold text-white hover:bg-brand-cobalt transition disabled:opacity-50 disabled:pointer-events-none"
              >
                {isCreatingCustomer ? 'Creating...' : 'Create & Select Customer'}
              </button>
            </div>
          ) : (
            <select
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              className="w-full rounded border border-surface-dim bg-white px-3 py-3 md:py-2 text-sm outline-none focus:border-brand-blue"
            >
              <option value="">-- Walk-In Customer --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name} (Credit Avail: ₹{c.credit_limit - c.outstanding_balance})</option>
              ))}
            </select>
          )}
        </div>
        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1">Payment Method</label>
          <select
            value={paymentType}
            onChange={(e) => setPaymentType(e.target.value)}
            className="w-full rounded border border-surface-dim bg-white px-3 py-3 md:py-2 text-sm outline-none focus:border-brand-blue"
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
              className="w-full rounded border border-surface-dim bg-white px-3 py-3 md:py-2 text-sm outline-none focus:border-brand-blue"
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
              className="w-full rounded border border-surface-dim bg-white px-3 py-3 md:py-2 text-sm outline-none focus:border-brand-blue"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Sales Tax (INR)</label>
            <input
              type="number"
              value={tax}
              onChange={(e) => setTax(e.target.value)}
              className="w-full rounded border border-surface-dim bg-white px-3 py-3 md:py-2 text-sm outline-none focus:border-brand-blue"
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

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="submit"
            onClick={() => setShouldShareAfterSubmit(false)}
            disabled={isSubmittingSale}
            className="w-full flex items-center justify-center space-x-2 rounded bg-brand-blue py-2.5 text-sm font-semibold text-white hover:bg-brand-cobalt transition disabled:opacity-50"
          >
            {isSubmittingSale && !shouldShareAfterSubmit && <Spinner size="sm" />}
            <span>Log Sales</span>
          </button>

          <button
            type="submit"
            onClick={() => setShouldShareAfterSubmit(true)}
            disabled={isSubmittingSale}
            className="w-full flex items-center justify-center space-x-2 rounded bg-green-600 py-2.5 text-sm font-semibold text-white hover:bg-green-700 transition disabled:opacity-50"
          >
            {isSubmittingSale && shouldShareAfterSubmit && <Spinner size="sm" />}
            <span>Log Sales & Share</span>
          </button>
        </div>
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
            to="/erp/sales?tab=create_invoice"
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
        </div>
      </div>

      {/* Create Sales Invoice */}
      {currentTab === 'create' && (
        loading ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 animate-pulse">
            <div className="md:rounded-lg md:bg-white p-0 md:p-6 md:shadow-sm md:border md:border-surface-low bg-transparent border-none space-y-4 lg:col-span-2">
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
            <div className="md:rounded-lg md:bg-white p-0 md:p-6 md:shadow-sm md:border md:border-surface-low bg-transparent border-none space-y-4">
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
            <div className="md:rounded-lg md:bg-white p-0 md:p-6 md:shadow-sm md:border md:border-surface-low bg-transparent border-none space-y-4 lg:col-span-2">
              <h3 className="text-sm font-semibold text-text-primary">New Sales Invoice</h3>

              {/* Add Line Item (Desktop only) */}
              {!isMobile && (
                <div className="rounded border border-surface-low p-4 bg-surface-lowest space-y-3">
                  <span className="text-xs font-semibold text-brand-blue">Add Product to Invoice</span>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                    <div ref={dropdownRef} className="md:col-span-2 relative">
                      <div className="flex justify-between items-center mb-0.5">
                        <label className="block text-[11px] font-semibold text-text-secondary">Search/Select Product</label>
                        <button
                          type="button"
                          onClick={handleOpenViewAllPopup}
                          className="text-[10px] text-brand-blue hover:underline font-semibold flex items-center"
                          title="View all products"
                        >
                          <span className="hidden sm:inline">View All</span>
                          <span className="sm:hidden p-1 bg-brand-blue/10 rounded-full text-brand-blue active:bg-brand-blue/20">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </span>
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Type product name or barcode..."
                        value={productSearch}
                        onChange={(e) => {
                          setProductSearch(e.target.value);
                          setShowDropdown(true);
                        }}
                        onFocus={() => setShowDropdown(true)}
                        className="w-full rounded border border-surface-dim bg-white px-2 py-1.5 text-xs text-text-primary outline-none focus:border-brand-blue"
                      />
                      {searching && (
                        <span className="absolute right-2 top-6 text-[10px] text-brand-blue animate-pulse">Searching...</span>
                      )}
                      {showDropdown && (productSearch.trim() !== '' || searchedProducts.length > 0) && (
                        <div className="absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-xs shadow-lg ring-1 ring-black/5 focus:outline-none border border-surface-dim">
                          {searchedProducts.length === 0 ? (
                            <div className="px-3 py-2 text-text-secondary">No products found.</div>
                          ) : (
                            searchedProducts.map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                disabled={p.stock_qty <= 0}
                                onClick={() => {
                                  setSelectedProductObj(p);
                                  setSelectedProduct(p.id.toString());
                                  setProductSearch(`${p.name} (${p.barcode})`);
                                  setShowDropdown(false);
                                  setPrice(p.selling_price.toString());
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-surface-low disabled:opacity-50 disabled:bg-surface-lowest border-b border-surface-low last:border-0 font-medium"
                              >
                                <div className="font-semibold text-text-primary">
                                  {p.name} ({p.barcode})
                                </div>
                                <div className="text-[10px] text-text-secondary mt-0.5">
                                  Stock: {p.stock_qty} | Price: ₹{p.selling_price}
                                  {p.suitable_models_details && p.suitable_models_details.length > 0 && (
                                    <span className="ml-1 text-brand-blue font-semibold">
                                      [{p.suitable_models_details.map(m => `${m.brand_name} ${m.model_name}`).join(', ')}]
                                    </span>
                                  )}
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                    <div className="col-span-full grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-text-secondary mb-0.5">Quantity</label>
                        <input
                          type="number"
                          value={qty}
                          onChange={(e) => setQty(e.target.value)}
                          className="w-full rounded border border-surface-dim bg-white px-3 py-3 md:py-1.5 text-sm md:text-xs text-text-primary outline-none focus:border-brand-blue"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-text-secondary mb-0.5">Override Unit Selling Price (INR)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          className="w-full rounded border border-surface-dim bg-white px-3 py-3 md:py-1.5 text-sm md:text-xs text-text-primary outline-none focus:border-brand-blue"
                        />
                      </div>
                    </div>
                    <div className="col-span-full flex items-end pt-1">
                      <button
                        type="button"
                        onClick={handleAddLineItem}
                        className="w-full rounded bg-brand-blue py-3 md:py-1.5 text-sm md:text-xs font-semibold text-white hover:bg-brand-cobalt transition"
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
                className="w-full rounded border border-surface-dim bg-white pl-9 pr-3 py-3 md:py-2 text-sm md:text-xs text-text-primary outline-none focus:border-brand-blue placeholder:text-text-secondary search-input-mobile"
              />
              <span className="absolute left-3 top-3.5 md:top-2.5 text-text-secondary">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <label htmlFor="sales-period-select" className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Period:</label>
              {!period.startsWith('custom_') ? (
                <select
                  id="sales-period-select"
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
            {salesPag.loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-brand-blue border-t-transparent" />
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
                          <span className="font-semibold text-text-primary text-sm">{sale.invoice_number}</span> ({sale.payment_type})
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
                    <th className="px-4 py-4">Payment Type</th>
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
                          <td className="px-4 py-4 text-text-secondary">{sale.payment_type}</td>
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

            {/* Tab Switcher */}
            <div className="flex justify-between items-center border-b border-surface-low mb-4">
              <div className="flex">
                <button
                  onClick={() => setDetailsTab('staff')}
                  className={`pb-2 px-4 text-xs font-semibold border-b-2 transition-all ${detailsTab === 'staff'
                    ? 'border-brand-blue text-brand-blue font-bold'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                    }`}
                >
                  Staff View (Internal)
                </button>
                <button
                  onClick={() => setDetailsTab('customer')}
                  className={`pb-2 px-4 text-xs font-semibold border-b-2 transition-all ${detailsTab === 'customer'
                    ? 'border-brand-blue text-brand-blue font-bold'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                    }`}
                >
                  Customer View (Receipt)
                </button>
              </div>
              {/* {detailsTab === 'customer' && ( */}
              <label className="flex items-center space-x-2 pb-2 text-xs font-semibold text-text-secondary cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={keepA4}
                  onChange={(e) => setKeepA4(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-surface-dim text-brand-blue focus:ring-brand-blue cursor-pointer"
                />
                <span>Keep A4 Size</span>
              </label>
              {/* )} */}
            </div>

            <div className="mb-6">
              {detailsTab === 'staff'
                ? renderStaffInvoice(selectedSale)
                : renderBrandedInvoiceWithZoom(selectedSale)
              }
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => handleShareWithCustomer(selectedSale)}
                disabled={isSharing}
                className="rounded bg-brand-blue/10 px-4 py-2 text-xs font-semibold text-brand-blue hover:bg-brand-blue/20 disabled:opacity-50 flex items-center space-x-1.5 cursor-pointer transition-colors"
              >
                {isSharing ? <Spinner size="sm" /> : (
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 10.742l4.684-2.342m0 0l-4.684-2.342m4.684 2.342a3 3 0 110-4.684 3 3 0 010 4.684zm0 0l-4.684 2.342m0 0a3 3 0 110-4.684 3 3 0 010 4.684zm0 0l4.684 2.342m0 0a3 3 0 110-4.684 3 3 0 010 4.684z" />
                  </svg>
                )}
                <span>Share with Customer</span>
              </button>
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
            {/* Tab Switcher */}
            <div className="flex justify-between items-center border-b border-surface-low mb-2">
              <div className="flex">
                <button
                  onClick={() => setDetailsTab('staff')}
                  className={`pb-2 px-4 text-xs font-semibold border-b-2 transition-all ${detailsTab === 'staff'
                    ? 'border-brand-blue text-brand-blue font-bold'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                    }`}
                >
                  Staff View
                </button>
                <button
                  onClick={() => setDetailsTab('customer')}
                  className={`pb-2 px-4 text-xs font-semibold border-b-2 transition-all ${detailsTab === 'customer'
                    ? 'border-brand-blue text-brand-blue font-bold'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                    }`}
                >
                  Customer View
                </button>
              </div>
              {detailsTab === 'customer' && (
                <label className="flex items-center space-x-1.5 pb-2 text-xs font-semibold text-text-secondary cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={keepA4}
                    onChange={(e) => setKeepA4(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-surface-dim text-brand-blue focus:ring-brand-blue cursor-pointer"
                  />
                  <span>Keep A4</span>
                </label>
              )}
            </div>

            <div className="mb-4">
              {detailsTab === 'staff'
                ? renderStaffInvoice(selectedSale)
                : renderBrandedInvoiceWithZoom(selectedSale)
              }
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => handleShareWithCustomer(selectedSale)}
                disabled={isSharing}
                className="w-full py-2.5 rounded-lg bg-brand-blue/10 hover:bg-brand-blue/15 text-brand-blue font-semibold text-xs transition flex items-center justify-center space-x-1.5 disabled:opacity-50"
              >
                {isSharing ? <Spinner size="sm" /> : (
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 10.742l4.684-2.342m0 0l-4.684-2.342m4.684 2.342a3 3 0 110-4.684 3 3 0 010 4.684zm0 0l-4.684 2.342m0 0a3 3 0 110-4.684 3 3 0 010 4.684zm0 0l4.684 2.342m0 0a3 3 0 110-4.684 3 3 0 010 4.684z" />
                  </svg>
                )}
                <span>Share with Customer</span>
              </button>
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

      {/* View All Products Popup */}
      {showViewAllPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-6">
          <div className="w-full max-w-4xl rounded-lg bg-white shadow-xl flex flex-col h-[85vh] relative overflow-hidden border border-surface-low animate-in fade-in duration-200">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-surface-low bg-surface-lowest">
              <h3 className="text-sm font-bold text-text-primary">
                Select Product
              </h3>
              <button
                type="button"
                onClick={() => setShowViewAllPopup(false)}
                className="text-text-secondary hover:text-text-primary text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Filter controls: Search and Category Nav */}
            <div className="p-4 border-b border-surface-low space-y-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products by name or barcode..."
                  value={popupSearchQuery}
                  onChange={(e) => setPopupSearchQuery(e.target.value)}
                  className="w-full rounded border border-surface-dim bg-white pl-9 pr-3 py-3 md:py-1.5 text-sm md:text-xs text-text-primary outline-none focus:border-brand-blue search-input-mobile"
                />
                <span className="absolute left-3 top-3.5 md:top-2.5 text-text-secondary">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
              </div>

              {/* Horizontal Category Nav */}
              <div className="flex border-b border-surface-low overflow-x-auto whitespace-nowrap space-x-4 pb-1 scrollbar-thin">
                {popupCategories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActivePopupCategory(cat.id)}
                    className={`pb-1 text-xs font-semibold px-2 transition-all border-b-2 ${activePopupCategory.toString() === cat.id.toString()
                      ? 'border-brand-blue text-brand-blue'
                      : 'border-transparent text-text-secondary hover:text-text-primary'
                      }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 bg-surface-lowest">
              {popupLoading ? (
                <div className="text-center py-12 text-sm text-brand-blue animate-pulse">Loading products...</div>
              ) : filteredProductsList.length === 0 ? (
                <div className="text-center py-12 text-xs text-text-secondary">No products found in this category.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {filteredProductsList.map((p) => {
                    const firstImage = p.image_url ? p.image_url.split(',')[0] : '';
                    return (
                      <button
                        key={p.id}
                        type="button"
                        disabled={p.stock_qty <= 0}
                        onClick={() => handleSelectProductPopup(p)}
                        className="text-left p-2.5 rounded-lg border border-surface-dim hover:border-brand-blue bg-white hover:bg-surface-light shadow-sm transition flex items-center w-full disabled:opacity-50 disabled:bg-surface-lowest"
                      >
                        <div className="h-12 w-12 rounded bg-surface border border-surface-low overflow-hidden flex-shrink-0 mr-3">
                          {firstImage ? (
                            <img src={firstImage} alt={p.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-[10px] text-text-secondary">No img</div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="font-semibold text-xs text-text-primary line-clamp-1 block">{p.name}</span>
                          {p.suitable_models_details && p.suitable_models_details.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1 font-normal">
                              {p.suitable_models_details.map((m) => (
                                <span key={m.id} className="inline-block px-1.5 py-0.5 rounded bg-brand-blue/10 text-brand-blue text-[9px] font-semibold border border-brand-blue/15">
                                  {m.brand_name} {m.model_name}
                                </span>
                              ))}
                            </div>
                          )}
                          <span className="text-[10px] text-text-secondary font-mono block">{p.barcode}</span>
                          <span className="text-brand-blue font-bold text-xs pt-0.5 block">Price: ₹{p.selling_price} | Stock: {p.stock_qty}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-surface-low bg-surface-lowest flex justify-end">
              <button
                type="button"
                onClick={() => setShowViewAllPopup(false)}
                className="rounded border border-surface-dim px-3 py-1.5 text-xs text-text-secondary hover:bg-surface-low transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Off-screen Branded Invoice Generator */}
      {selectedSale && (
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
          <div id="invoice-share-card">
            {renderBrandedInvoice(selectedSale, false, keepA4)}
          </div>
        </div>
      )}
    </div>
  );
}
