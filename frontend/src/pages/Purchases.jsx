
import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../utils/api';
import { usePagination } from '../utils/usePagination';
import PaginationControls from '../components/PaginationControls';
import { SkeletonTable, Spinner } from '../components/Skeleton';
import MobileBottomSheet from '../components/MobileBottomSheet';
import { TrashIcon } from "@heroicons/react/24/solid";
import { toPng } from 'html-to-image';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

export default function Purchases() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab') || 'create_purchase';
  const currentTab = (rawTab === 'create_purchase' || rawTab === 'create') ? 'create' : rawTab;
  const period = searchParams.get('period') || sessionStorage.getItem('period_purchases') || 'all';

  useEffect(() => {
    let nextParams = null;
    if (!searchParams.has('period')) {
      nextParams = new URLSearchParams(nextParams || searchParams);
      nextParams.set('period', period);
    }
    if (!searchParams.has('tab')) {
      nextParams = new URLSearchParams(nextParams || searchParams);
      nextParams.set('tab', 'create_purchase');
    }
    if (nextParams) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [searchParams, period, setSearchParams]);

  useEffect(() => {
    const urlPeriod = searchParams.get('period');
    if (urlPeriod) {
      sessionStorage.setItem('period_purchases', urlPeriod);
    }
  }, [searchParams]);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Dropdown states (unpaginated list)
  const [suppliers, setSuppliers] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [dropdownsLoading, setDropdownsLoading] = useState(true);

  // Action loading states
  const [isSavingPO, setIsSavingPO] = useState(false);
  const [postingSupplierId, setPostingSupplierId] = useState('');
  const [isReceivingPO, setIsReceivingPO] = useState(false);
  const [isReturningPO, setIsReturningPO] = useState(false);
  const [isCancellingPO, setIsCancellingPO] = useState(false);

  // Pagination hooks for each list tab
  const receivePag = usePagination(api.purchases.list, 10, currentTab === 'receive', { is_received: 'false' });
  const historyPag = usePagination(api.purchases.list, 10, currentTab === 'history', { is_received: 'true', period });

  // Purchase Form states
  const [supplier, setSupplier] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [additionalCosts, setAdditionalCosts] = useState('0');
  const [paymentType, setPaymentType] = useState('Cash');
  const [paidFrom, setPaidFrom] = useState('');
  const [payOldCredit, setPayOldCredit] = useState(false);
  const [deductSupplierCredit, setDeductSupplierCredit] = useState(false);
  const [deductAmount, setDeductAmount] = useState('0');

  // Selected items in PO
  const [items, setItems] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [searchedProducts, setSearchedProducts] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedProductObj, setSelectedProductObj] = useState(null);
  const [qty, setQty] = useState('1');
  const [cost, setCost] = useState('0');
  const [newSellingPrice, setNewSellingPrice] = useState('');
  const [poMode, setPoMode] = useState(null); // 'supplier' or 'product'
  const [productSuppliers, setProductSuppliers] = useState([]);
  const [selectedProductSupplierId, setSelectedProductSupplierId] = useState('');

  // Quick-create product state
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [qcName, setQcName] = useState('');
  const [qcBarcode, setQcBarcode] = useState('');
  const [qcSellingPrice, setQcSellingPrice] = useState('0');
  const [qcCost, setQcCost] = useState('0');
  const [qcSupplierId, setQcSupplierId] = useState('');
  const [isSavingQc, setIsSavingQc] = useState(false);

  const dropdownRef = useRef(null);
  const supplierDropdownRef = useRef(null);
  const [supplierSearch, setSupplierSearch] = useState('');
  const [supplierSearching, setSupplierSearching] = useState(false);
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);

  // Receive PO Modal State
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [receivingPO, setReceivingPO] = useState(null);
  const [recInvoiceNumber, setRecInvoiceNumber] = useState('');
  const [recAdditionalCosts, setRecAdditionalCosts] = useState('0');
  const [recRounding, setRecRounding] = useState('0');
  const [recItems, setRecItems] = useState([]);
  const [recPaymentType, setRecPaymentType] = useState('Cash');
  const [recPaidFrom, setRecPaidFrom] = useState('');
  const [recPayOldCredit, setRecPayOldCredit] = useState(false);
  const [recDeductSupplierCredit, setRecDeductSupplierCredit] = useState(false);
  const [recDeductAmount, setRecDeductAmount] = useState('0');

  // Return PO Modal State
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returningPO, setReturningPO] = useState(null);
  const [returnItems, setReturnItems] = useState([]);
  const [returnAdjustment, setReturnAdjustment] = useState('0');
  const [returnCreditAccount, setReturnCreditAccount] = useState('');

  // Details Modal State
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsPO, setDetailsPO] = useState(null);
  const [isSharingImage, setIsSharingImage] = useState(false);
  const [expandedReturnRows, setExpandedReturnRows] = useState({});
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [showMobileBilling, setShowMobileBilling] = useState(false);
  const [activeBillingSupplierTab, setActiveBillingSupplierTab] = useState(null);

  // Sharing states
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareIncludeCost, setShareIncludeCost] = useState(() => {
    const saved = localStorage.getItem('shareIncludeCost');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [shareBusinessInfo, setShareBusinessInfo] = useState('');
  const [supplierDetail, setSupplierDetail] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
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


  // Auto-complete inside receiving modal
  const [recProductSearch, setRecProductSearch] = useState('');
  const [recSearchedProducts, setRecSearchedProducts] = useState([]);
  const [recSearching, setRecSearching] = useState(false);
  const [recShowDropdown, setRecShowDropdown] = useState(false);
  const [recSelectedProductObj, setRecSelectedProductObj] = useState(null);
  const [recQty, setRecQty] = useState('1');
  const [recCost, setRecCost] = useState('0');
  const [recNewSellingPrice, setRecNewSellingPrice] = useState('');
  const recDropdownRef = useRef(null);

  // Receive View All Popup States
  const [showRecViewAllPopup, setShowRecViewAllPopup] = useState(false);
  const [recPopupCategories, setRecPopupCategories] = useState([]);
  const [recActivePopupCategory, setRecActivePopupCategory] = useState('');
  const [recPopupProducts, setRecPopupProducts] = useState([]);
  const [recPopupLoading, setRecPopupLoading] = useState(false);
  const [recPopupSearchQuery, setRecPopupSearchQuery] = useState('');

  // View All Popup States
  const [showViewAllPopup, setShowViewAllPopup] = useState(false);
  const [popupCategories, setPopupCategories] = useState([]);
  const [activePopupCategory, setActivePopupCategory] = useState('');
  const [popupProducts, setPopupProducts] = useState([]);
  const [popupLoading, setPopupLoading] = useState(false);
  const [popupSearchQuery, setPopupSearchQuery] = useState('');
  const [selectedPopupProduct, setSelectedPopupProduct] = useState(null);
  const [popupProductSuppliers, setPopupProductSuppliers] = useState([]);
  const [popupProductSuppliersLoading, setPopupProductSuppliersLoading] = useState(false);

  const handleOpenViewAllPopup = () => {
    if (poMode === 'supplier' && !supplier) {
      alert('Please select a supplier first.');
      return;
    }
    setShowViewAllPopup(true);
    setPopupLoading(true);
    setSelectedPopupProduct(null);
    setPopupProductSuppliers([]);
    setPopupSearchQuery('');

    if (poMode === 'supplier') {
      api.supplierProducts.list({ supplier_id: supplier })
        .then((res) => {
          const list = (res && res.results) || (Array.isArray(res) && res) || [];
          setPopupProducts(list);
          const cats = [];
          const catMap = {};
          list.forEach(item => {
            const cId = item.category_id || 'uncategorized';
            const cName = item.category_name || 'Uncategorized';
            if (!catMap[cId]) {
              catMap[cId] = cName;
              cats.push({ id: cId, name: cName });
            }
          });
          setPopupCategories(cats);
          if (cats.length > 0) {
            setActivePopupCategory(cats[0].id);
          } else {
            setActivePopupCategory('');
          }
          setPopupLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setPopupLoading(false);
        });
    } else {
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
    }
  };

  const handleSelectSupplierProductPopup = (supProd) => {
    setSelectedProductObj({
      id: supProd.product,
      name: supProd.product_name,
      barcode: supProd.barcode,
      category: supProd.category_id,
      category_name: supProd.category_name,
      selling_price: parseFloat(supProd.selling_price || 0)
    });
    setProductSearch(`${supProd.product_name} (${supProd.barcode})`);
    setCost(supProd.current_cost.toString());
    setNewSellingPrice(supProd.selling_price.toString());
    setShowViewAllPopup(false);
  };

  const handleSelectProductPopup = (prod) => {
    setSelectedPopupProduct(prod);
    setPopupProductSuppliersLoading(true);
    api.supplierProducts.list({ product_id: prod.id })
      .then((res) => {
        const list = (res && res.results) || (Array.isArray(res) && res) || [];
        setPopupProductSuppliers(list);
        setPopupProductSuppliersLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setPopupProductSuppliersLoading(false);
      });
  };

  const handleSelectProductSupplierPopup = (supProd) => {
    setSelectedProductObj(selectedPopupProduct);
    setProductSearch(`${selectedPopupProduct.name} (${selectedPopupProduct.barcode})`);
    setProductSuppliers(popupProductSuppliers);
    setSelectedProductSupplierId(supProd.supplier.toString());
    setCost(supProd.current_cost.toString());
    setNewSellingPrice(selectedPopupProduct.selling_price.toString());
    setShowViewAllPopup(false);
  };

  const handleOpenRecViewAllPopup = () => {
    if (!receivingPO) return;
    setShowRecViewAllPopup(true);
    setRecPopupLoading(true);
    setRecPopupSearchQuery('');

    api.supplierProducts.list({ supplier_id: receivingPO.supplier })
      .then((res) => {
        const list = (res && res.results) || (Array.isArray(res) && res) || [];
        setRecPopupProducts(list);

        const cats = [];
        const catMap = {};
        list.forEach(item => {
          const cId = item.category_id || 'uncategorized';
          const cName = item.category_name || 'Uncategorized';
          if (!catMap[cId]) {
            catMap[cId] = cName;
            cats.push({ id: cId, name: cName });
          }
        });
        setRecPopupCategories(cats);
        if (cats.length > 0) {
          setRecActivePopupCategory(cats[0].id);
        } else {
          setRecActivePopupCategory('');
        }
        setRecPopupLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setRecPopupLoading(false);
      });
  };

  const handleSelectRecSupplierProductPopup = (supProd) => {
    setRecSelectedProductObj({
      id: supProd.product,
      name: supProd.product_name,
      barcode: supProd.barcode,
      category: supProd.category_id,
      category_name: supProd.category_name,
      selling_price: parseFloat(supProd.selling_price || 0)
    });
    setRecProductSearch(`${supProd.product_name} (${supProd.barcode})`);
    setRecCost(supProd.current_cost.toString());
    setRecNewSellingPrice(supProd.selling_price.toString());
    setShowRecViewAllPopup(false);
  };

  const filteredRecProductsList = recPopupProducts.filter(item => {
    const cId = item.category_id || 'uncategorized';
    const matchesCategory = cId.toString() === recActivePopupCategory.toString();
    const matchesSearch = (item.product_name || '').toLowerCase().includes(recPopupSearchQuery.toLowerCase()) ||
      (item.barcode || '').toLowerCase().includes(recPopupSearchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const filteredProductsList = poMode === 'supplier'
    ? popupProducts.filter(item => {
      const cId = item.category_id || 'uncategorized';
      const matchesCategory = cId.toString() === activePopupCategory.toString();
      const matchesSearch = (item.product_name || '').toLowerCase().includes(popupSearchQuery.toLowerCase()) ||
        (item.barcode || '').toLowerCase().includes(popupSearchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    : popupProducts.filter(p => {
      const matchesCategory = activePopupCategory === 'all' || (p.category && p.category.toString() === activePopupCategory.toString());
      const matchesSearch = (p.name || '').toLowerCase().includes(popupSearchQuery.toLowerCase()) ||
        (p.barcode || '').toLowerCase().includes(popupSearchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });



  const [supplierBilling, setSupplierBilling] = useState({});

  useEffect(() => {
    if (poMode === 'product') {
      const uniqueSupplierIds = [...new Set(items.map(item => item.supplier_id))];
      setSupplierBilling(prev => {
        const next = { ...prev };
        let updated = false;
        uniqueSupplierIds.forEach(id => {
          if (!next[id]) {
            next[id] = {
              invoiceNumber: '',
              additionalCosts: '0',
              paymentType: 'Cash',
              paidFrom: bankAccounts.length > 0 ? bankAccounts[0].id.toString() : '',
              payOldCredit: false,
              deductSupplierCredit: false,
              deductAmount: '0'
            };
            updated = true;
          }
        });
        Object.keys(next).forEach(id => {
          if (!uniqueSupplierIds.includes(parseInt(id))) {
            delete next[id];
            updated = true;
          }
        });
        return updated ? next : prev;
      });
    }
  }, [items, bankAccounts, poMode]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (supplierDropdownRef.current && !supplierDropdownRef.current.contains(event.target)) {
        setShowSupplierDropdown(false);
      }
      if (recDropdownRef.current && !recDropdownRef.current.contains(event.target)) {
        setRecShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!showSupplierDropdown) {
      const selected = suppliers.find(s => s.id.toString() === supplier);
      if (selected) {
        setSupplierSearch(selected.name);
      } else {
        setSupplierSearch('');
      }
    }
  }, [supplier, suppliers, showSupplierDropdown]);

  const renderBrandedPO = (po, scaleForMobile = false) => {
    if (!po) return null;
    return (
      <div
        className="bg-white p-6 md:p-8 border border-gray-200 rounded-lg shadow-xs text-left"
        style={{
          width: scaleForMobile ? '100%' : '600px',
          margin: '0 auto',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <img
              src={logoBase64 || "/icon_for_website-removebg-preview_no_border.png"}
              alt="Company Logo"
              className="h-12 w-12 object-contain"
            />
            <div>
              <span className="inline-block px-2.5 py-1 text-xs font-semibold rounded bg-amber-100 text-amber-800 uppercase tracking-wider">
                Purchase Order
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-mono text-gray-500">
              No: PO-{po.id}
            </p>
            <p className="text-xs text-gray-500">
              Date: {new Date(po.timestamp).toLocaleDateString()}
            </p>
          </div>
        </div>

        <hr className="border-gray-100 my-4" />

        {/* FROM/TO Billing Info Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Left Column: From Supplier */}
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              FROM (Supplier):
            </span>
            <span className="text-xs font-bold text-gray-850 block mt-1">
              {po.supplier_name}
            </span>
            {supplierDetail?.place && (
              <span className="text-xs text-gray-500 block mt-0.5">
                {supplierDetail.place}
              </span>
            )}
            {supplierDetail?.contact_number && (
              <span className="text-xs text-gray-500 block mt-0.5">
                Phone: {supplierDetail.contact_number}
              </span>
            )}
            {po.invoice_number && (
              <span className="text-xs text-gray-500 block mt-1">
                Ref Invoice: {po.invoice_number}
              </span>
            )}
          </div>

          {/* Right Column: To Me */}
          <div className="text-right">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              TO :
            </span>
            <span className="text-xs font-bold text-gray-850 block mt-1">
              {currentUser?.company_name || currentUser?.business_name || 'Axon Accessories'}
            </span>
            {currentUser?.phone && (
              <span className="text-xs text-gray-500 block mt-0.5">
                Phone: {currentUser.phone}
              </span>
            )}
            {currentUser?.email && (
              <span className="text-xs text-gray-500 block mt-0.5">
                Email: {currentUser.email}
              </span>
            )}
          </div>
        </div>

        {/* Items Table */}
        <div className="border border-gray-100 rounded-lg overflow-hidden mb-6">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 font-semibold uppercase">
              <tr>
                <th className="px-4 py-2.5">Product</th>
                <th className="px-4 py-2.5 text-right">Qty</th>
                {shareIncludeCost && <th className="px-4 py-2.5 text-right">Cost</th>}
                {shareIncludeCost && <th className="px-4 py-2.5 text-right">Total</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {po.items?.map((item, idx) => (
                <tr key={idx}>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-gray-800 block">{item.product_name}</span>
                    {item.barcode && (
                      <span className="text-[10px] text-gray-400 font-mono block mt-0.5">
                        {item.barcode}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-800">{item.quantity}</td>
                  {shareIncludeCost && (
                    <td className="px-4 py-3 text-right text-gray-500">
                      {formatCurrency(item.purchase_cost)}
                    </td>
                  )}
                  {shareIncludeCost && (
                    <td className="px-4 py-3 text-right font-bold text-gray-800">
                      {formatCurrency(item.quantity * item.purchase_cost)}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Summary */}
        {shareIncludeCost && (
          <div className="flex justify-end mb-6">
            <div className="w-1/2 space-y-2 text-xs font-semibold text-gray-500">
              <div className="flex justify-between font-bold text-sm text-gray-800 border-t border-gray-100 pt-2">
                <span>Total Amount:</span>
                <span className="text-brand-blue text-base">
                  {formatCurrency(po.total_amount)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Footer Notes / Thank You */}
        <div className="text-center pt-4 border-t border-dashed border-gray-100 space-y-1">
          <p className="text-[10px] text-gray-400 text-center">Generated by Axon</p>
          <p className="text-[10px] text-gray-400 text-center">
            Generated on{" "}
            {new Date().toLocaleString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </p>
        </div>
      </div>
    );
  };

  const handleSharePOAsImage = async (po) => {
    if (!po) return;
    setIsSharingImage(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const node = document.getElementById('po-share-card');
      if (!node) {
        throw new Error('PO template element not found');
      }

      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });

      const fileName = `PO-${po.id}.png`;

      if (Capacitor.isNativePlatform()) {
        const base64Data = dataUrl.split(',')[1];

        const writeResult = await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Cache,
        });

        await Share.share({
          title: `Purchase Order PO-${po.id}`,
          text: `Purchase Order PO-${po.id} to ${po.supplier_name} from ${currentUser?.company_name || currentUser?.business_name || 'Axon Accessories'}`,
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
              title: `Purchase Order PO-${po.id}`,
              text: `Purchase Order PO-${po.id} to ${po.supplier_name} from ${currentUser?.company_name || currentUser?.business_name || 'Axon Accessories'}`,
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
      console.error('Error sharing PO image:', err);
      alert('Failed to share PO: ' + err.message);
    } finally {
      setIsSharingImage(false);
    }
  };

  const loadDropdowns = () => {
    setDropdownsLoading(true);
    Promise.all([
      api.bankAccounts.list()
    ])
      .then(([banks]) => {
        setBankAccounts(banks);
        if (banks.length > 0) setPaidFrom(banks[0].id.toString());
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
    api.auth.me()
      .then((user) => {
        setCurrentUser(user);
        const bizName = user?.company_name || user?.business_name || 'Axon Accessories';
        const bizPhone = user?.phone || user?.contact_number || '';
        const firstName = user?.user?.first_name || user?.first_name || '';
        const lastName = user?.user?.last_name || user?.last_name || '';
        const fullName = [firstName, lastName].filter(Boolean).join(' ');
        const infoLines = [bizName];
        if (fullName) infoLines.push(`${fullName}`);
        if (bizPhone) infoLines.push(`Phone: ${bizPhone}`);
        setShareBusinessInfo(infoLines.join('\n'));
      })
      .catch((err) => {
        console.error("Error fetching user profile:", err);
        setShareBusinessInfo('Axon Accessories');
      });
  }, []);

  useEffect(() => {
    if (detailsPO?.supplier) {
      const localSup = suppliers.find(s => s.id.toString() === detailsPO.supplier.toString());
      if (localSup) {
        setSupplierDetail(localSup);
      } else {
        api.suppliers.list({ id: detailsPO.supplier })
          .then(res => {
            const list = (res && res.results) || (Array.isArray(res) && res) || [];
            if (list.length > 0) {
              setSupplierDetail(list[0]);
            } else {
              setSupplierDetail(null);
            }
          })
          .catch(err => {
            console.error("Error fetching supplier info:", err);
            setSupplierDetail(null);
          });
      }
    } else {
      setSupplierDetail(null);
    }
  }, [detailsPO, suppliers]);

  useEffect(() => {
    setSupplierSearching(true);
    const delayDebounce = setTimeout(() => {
      const params = supplierSearch.trim() ? { search: supplierSearch } : {};
      api.suppliers.list(params)
        .then((res) => {
          const list = (res && res.results) || (Array.isArray(res) && res) || [];
          setSuppliers(list);
          setSupplierSearching(false);
        })
        .catch((err) => {
          console.error(err);
          setSupplierSearching(false);
        });
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [supplierSearch]);

  useEffect(() => {
    if (suppliers.length > 0 && !supplier) {
      setSupplier(suppliers[0].id.toString());
    }
  }, [suppliers, supplier]);

  useEffect(() => {
    if (!productSearch.trim()) {
      setSearchedProducts([]);
      return;
    }
    // Only search if the query doesn't match the currently selected product name
    if (selectedProductObj && productSearch === `${selectedProductObj.name} (${selectedProductObj.barcode})`) {
      return;
    }
    setSearching(true);
    const delayDebounce = setTimeout(() => {
      const searchParams = { search: productSearch };
      if (poMode === 'supplier') {
        searchParams.supplier_id = supplier;
      }
      api.products.list(searchParams)
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
  }, [productSearch, selectedProductObj, supplier, poMode]);

  useEffect(() => {
    if (!recProductSearch.trim() || !receivingPO) {
      setRecSearchedProducts([]);
      return;
    }
    if (recSelectedProductObj && recProductSearch === `${recSelectedProductObj.name} (${recSelectedProductObj.barcode})`) {
      return;
    }
    setRecSearching(true);
    const delayDebounce = setTimeout(() => {
      api.products.list({ search: recProductSearch, supplier_id: receivingPO.supplier })
        .then((res) => {
          if (res && res.results) {
            setRecSearchedProducts(res.results);
          } else if (Array.isArray(res)) {
            setRecSearchedProducts(res);
          } else {
            setRecSearchedProducts([]);
          }
          setRecSearching(false);
        })
        .catch((err) => {
          console.error(err);
          setRecSearching(false);
        });
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [recProductSearch, recSelectedProductObj, receivingPO]);

  useEffect(() => {
    if (poMode === 'supplier') {
      setSelectedProductObj(null);
      setProductSearch('');
      setItems([]);
    }
  }, [supplier, poMode]);

  const handleAddLineItem = () => {
    if (!selectedProductObj) return;
    if (items.some(i => i.product === selectedProductObj.id)) {
      alert('This product is already in the order. Edit the quantity in the list below.');
      return;
    }
    if (poMode === 'product' && !selectedProductSupplierId) {
      alert('Please select a supplier for this product.');
      return;
    }

    const supplierObj = poMode === 'product'
      ? productSuppliers.find(ps => ps.supplier.toString() === selectedProductSupplierId)
      : null;

    const newItem = {
      product: selectedProductObj.id,
      name: selectedProductObj.name,
      barcode: selectedProductObj.barcode,
      quantity: parseInt(qty),
      purchase_cost: parseFloat(cost),
      new_selling_price: newSellingPrice !== '' ? parseFloat(newSellingPrice) : null,
      selling_price: parseFloat(selectedProductObj.selling_price || 0),
      supplier_id: poMode === 'product' ? parseInt(selectedProductSupplierId) : parseInt(supplier),
      supplier_name: poMode === 'product'
        ? (supplierObj ? supplierObj.supplier_name : '')
        : (suppliers.find(s => s.id.toString() === supplier)?.name || ''),
      suitable_models_details: selectedProductObj.suitable_models_details
    };

    setItems([...items, newItem]);
    setSelectedProductObj(null);
    setProductSearch('');
    setQty('1');
    setCost('0');
    setNewSellingPrice('');
    setProductSuppliers([]);
    setSelectedProductSupplierId('');
  };

  const handleQuickCreateProduct = async (e) => {
    e.preventDefault();
    if (!qcName.trim() || !qcBarcode.trim()) {
      alert('Name and Barcode are required.');
      return;
    }
    const supplierId = (poMode === 'supplier' || poMode === 'direct')
      ? parseInt(poMode === 'direct' ? receivingPO?.supplier : supplier)
      : parseInt(qcSupplierId);
    if (!supplierId) {
      alert('Please select a supplier for this product.');
      return;
    }
    setIsSavingQc(true);
    try {
      // 1. Create the product
      const newProduct = await api.products.create({
        name: qcName.trim(),
        barcode: qcBarcode.trim(),
        selling_price: parseFloat(qcSellingPrice) || 0,
      });
      // 2. Link product to supplier
      await api.supplierProducts.create({
        product: newProduct.id,
        supplier: supplierId,
        current_cost: parseFloat(qcCost) || 0,
        selling_price: parseFloat(qcSellingPrice) || 0,
      });
      // 3. Auto-select into PO form
      if (poMode === 'direct') {
        setRecSelectedProductObj(newProduct);
        setRecProductSearch(`${newProduct.name} (${newProduct.barcode})`);
        setRecCost(qcCost);
        setRecNewSellingPrice(qcSellingPrice);
      } else {
        setSelectedProductObj(newProduct);
        setProductSearch(`${newProduct.name} (${newProduct.barcode})`);
        setCost(qcCost);
        setNewSellingPrice(qcSellingPrice);
        if (poMode === 'product') {
          const supProdList = await api.supplierProducts.list({ product_id: newProduct.id });
          const list = (supProdList && supProdList.results) || (Array.isArray(supProdList) && supProdList) || [];
          setProductSuppliers(list);
          setSelectedProductSupplierId(supplierId.toString());
        }
      }
      setShowQuickCreate(false);
      setQcName(''); setQcBarcode(''); setQcSellingPrice('0'); setQcCost('0'); setQcSupplierId('');
    } catch (err) {
      alert('Error creating product: ' + err.message);
    } finally {
      setIsSavingQc(false);
    }
  };

  const handleRemoveLineItem = (idx) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const calculateTotal = (includeOldCredit = false) => {
    const itemsTotal = items.reduce((acc, curr) => acc + (curr.quantity * curr.purchase_cost), 0);
    let added = itemsTotal + parseFloat(additionalCosts || 0);
    if (deductSupplierCredit) {
      added -= parseFloat(deductAmount || 0);
    }
    if (includeOldCredit && paymentType !== 'Credit') {
      const selectedSupplierObj = suppliers.find(s => s.id.toString() === supplier);
      const oldCreditVal = selectedSupplierObj && parseFloat(selectedSupplierObj.outstanding_balance) > 0
        ? parseFloat(selectedSupplierObj.outstanding_balance)
        : 0;
      return added + oldCreditVal;
    }
    return added;
  };

  const handleSubmitPO = (e) => {
    e.preventDefault();
    if (items.length === 0) {
      alert('Add at least one item to the purchase order.');
      return;
    }

    if (poMode === 'supplier') {
      const totalAmt = calculateTotal(payOldCredit);
      const selfExpenseAmt = parseFloat(additionalCosts || 0);
      const requiredAmt = paymentType !== 'Credit' ? totalAmt : selfExpenseAmt;
      if (paymentType !== 'Credit' || selfExpenseAmt > 0) {
        const acc = bankAccounts.find(b => b.id.toString() === paidFrom);
        if (acc && parseFloat(acc.balance) < requiredAmt) {
          alert(`Insufficient balance in account '${acc.name}' (Current Balance: ₹${acc.balance}, Required: ₹${requiredAmt.toFixed(2)}). Please adjust payment or select a different account.`);
          return;
        }
      }

      const payload = {
        supplier: parseInt(supplier),
        invoice_number: invoiceNumber,
        additional_costs: parseFloat(additionalCosts),
        payment_type: paymentType,
        paid_from: (paymentType !== 'Credit' || parseFloat(additionalCosts || 0) > 0) ? parseInt(paidFrom) : null,
        total_amount: totalAmt,
        deducted_credit: deductSupplierCredit ? parseFloat(deductAmount || 0) : 0,
        items: items
      };

      setIsSavingPO(true);
      api.purchases.create(payload)
        .then(() => {
          setItems([]);
          setInvoiceNumber('');
          setAdditionalCosts('0');
          setPayOldCredit(false);
          setDeductSupplierCredit(false);
          setDeductAmount('0');
          alert('Purchase Order Created Successfully!');
          receivePag.refresh();
          historyPag.refresh();
          loadDropdowns();
          setPoMode(null);
          setShowMobileBilling(false);
        })
        .catch((err) => alert(err.message))
        .finally(() => setIsSavingPO(false));
    } else {
      // Group items by supplier
      const groups = {};
      items.forEach(item => {
        if (!groups[item.supplier_id]) {
          groups[item.supplier_id] = [];
        }
        groups[item.supplier_id].push(item);
      });

      // Validation check for account balance across groups
      for (const [supId, supItems] of Object.entries(groups)) {
        const billing = supplierBilling[supId] || {
          invoiceNumber: '',
          additionalCosts: '0',
          paymentType: 'Cash',
          paidFrom: bankAccounts.length > 0 ? bankAccounts[0].id.toString() : null,
          payOldCredit: false,
          deductSupplierCredit: false,
          deductAmount: '0'
        };
        const groupAddCost = parseFloat(billing.additionalCosts || 0);
        const selfExpenseAmt = groupAddCost;
        const groupSubtotal = supItems.reduce((acc, curr) => acc + (curr.quantity * curr.purchase_cost), 0);
        const selectedSupplierObj = suppliers.find(s => s.id.toString() === supId.toString());
        const oldCreditVal = selectedSupplierObj && parseFloat(selectedSupplierObj.outstanding_balance) > 0
          ? parseFloat(selectedSupplierObj.outstanding_balance)
          : 0;
        const deductVal = billing.deductSupplierCredit ? parseFloat(billing.deductAmount || 0) : 0;

        const groupTotal = groupSubtotal + groupAddCost - deductVal + (billing.payOldCredit ? oldCreditVal : 0);
        const requiredAmt = billing.paymentType !== 'Credit' ? groupTotal : selfExpenseAmt;

        if (billing.paymentType !== 'Credit' || selfExpenseAmt > 0) {
          const acc = bankAccounts.find(b => b.id.toString() === billing.paidFrom);
          if (acc && parseFloat(acc.balance) < requiredAmt) {
            const supplierName = supItems[0]?.supplier_name || `Supplier ID ${supId}`;
            alert(`Insufficient balance in account '${acc.name}' for supplier '${supplierName}' (Current Balance: ₹${acc.balance}, Required: ₹${requiredAmt.toFixed(2)}). Please adjust payment or select a different account.`);
            return;
          }
        }
      }

      const promises = Object.entries(groups).map(([supId, supItems]) => {
        const billing = supplierBilling[supId] || {
          invoiceNumber: '',
          additionalCosts: '0',
          paymentType: 'Cash',
          paidFrom: bankAccounts.length > 0 ? bankAccounts[0].id.toString() : null,
          payOldCredit: false,
          deductSupplierCredit: false,
          deductAmount: '0'
        };
        const groupSubtotal = supItems.reduce((acc, curr) => acc + (curr.quantity * curr.purchase_cost), 0);
        const groupAddCost = parseFloat(billing.additionalCosts || 0);

        const selectedSupplierObj = suppliers.find(s => s.id.toString() === supId.toString());
        const oldCreditVal = selectedSupplierObj && parseFloat(selectedSupplierObj.outstanding_balance) > 0
          ? parseFloat(selectedSupplierObj.outstanding_balance)
          : 0;
        const deductVal = billing.deductSupplierCredit ? parseFloat(billing.deductAmount || 0) : 0;

        const payload = {
          supplier: parseInt(supId),
          invoice_number: billing.invoiceNumber,
          additional_costs: groupAddCost,
          payment_type: billing.paymentType,
          paid_from: (billing.paymentType !== 'Credit' || groupAddCost > 0) ? parseInt(billing.paidFrom) : null,
          total_amount: parseFloat((groupSubtotal + groupAddCost - deductVal + (billing.payOldCredit ? oldCreditVal : 0)).toFixed(2)),
          deducted_credit: deductVal,
          items: supItems.map(si => ({
            product: si.product,
            quantity: si.quantity,
            purchase_cost: si.purchase_cost,
            new_selling_price: si.new_selling_price
          }))
        };
        return api.purchases.create(payload);
      });

      setIsSavingPO(true);
      Promise.all(promises)
        .then((results) => {
          setItems([]);
          setInvoiceNumber('');
          setAdditionalCosts('0');
          setSupplierBilling({});
          alert(`Successfully created ${results.length} Purchase Orders (one for each supplier)!`);
          receivePag.refresh();
          historyPag.refresh();
          loadDropdowns();
          setPoMode(null);
          setShowMobileBilling(false);
        })
        .catch((err) => alert(`Error creating some POs: ${err.message}`))
        .finally(() => setIsSavingPO(false));
    }
  };

  const handlePostSingleSupplierPO = (supId) => {
    const supplierItems = items.filter(item => item.supplier_id.toString() === supId.toString());
    if (supplierItems.length === 0) return;

    const billing = supplierBilling[supId] || {
      invoiceNumber: '',
      additionalCosts: '0',
      paymentType: 'Cash',
      paidFrom: bankAccounts.length > 0 ? bankAccounts[0].id.toString() : '',
      payOldCredit: false,
      deductSupplierCredit: false,
      deductAmount: '0'
    };

    const groupAddCost = parseFloat(billing.additionalCosts || 0);
    const selfExpenseAmt = groupAddCost;
    const groupSubtotal = supplierItems.reduce((acc, curr) => acc + (curr.quantity * curr.purchase_cost), 0);
    const selectedSupplierObj = suppliers.find(s => s.id.toString() === supId.toString());
    const oldCreditVal = selectedSupplierObj && parseFloat(selectedSupplierObj.outstanding_balance) > 0
      ? parseFloat(selectedSupplierObj.outstanding_balance)
      : 0;
    const deductVal = billing.deductSupplierCredit ? parseFloat(billing.deductAmount || 0) : 0;

    const groupTotal = groupSubtotal + groupAddCost - deductVal + (billing.payOldCredit ? oldCreditVal : 0);
    const requiredAmt = billing.paymentType !== 'Credit' ? groupTotal : selfExpenseAmt;

    if (billing.paymentType !== 'Credit' || selfExpenseAmt > 0) {
      const acc = bankAccounts.find(b => b.id.toString() === billing.paidFrom);
      if (acc && parseFloat(acc.balance) < requiredAmt) {
        const supplierName = supplierItems[0]?.supplier_name || `Supplier ID ${supId}`;
        alert(`Insufficient balance in account '${acc.name}' for supplier '${supplierName}' (Current Balance: ₹${acc.balance}, Required: ₹${requiredAmt.toFixed(2)}). Please adjust payment or select a different account.`);
        return;
      }
    }

    const payload = {
      supplier: parseInt(supId),
      invoice_number: billing.invoiceNumber,
      additional_costs: groupAddCost,
      payment_type: billing.paymentType,
      paid_from: (billing.paymentType !== 'Credit' || groupAddCost > 0) ? parseInt(billing.paidFrom) : null,
      total_amount: parseFloat(groupTotal.toFixed(2)),
      deducted_credit: deductVal,
      items: supplierItems.map(si => ({
        product: si.product,
        quantity: si.quantity,
        purchase_cost: si.purchase_cost,
        new_selling_price: si.new_selling_price
      }))
    };

    setPostingSupplierId(supId.toString());
    api.purchases.create(payload)
      .then(() => {
        setItems(prevItems => {
          const remaining = prevItems.filter(item => item.supplier_id.toString() !== supId.toString());
          if (remaining.length === 0) {
            setShowMobileBilling(false);
            setPoMode(null);
          }
          return remaining;
        });
        setSupplierBilling(prev => {
          const next = { ...prev };
          delete next[supId];
          return next;
        });
        alert(`Purchase Order for '${supplierItems[0]?.supplier_name || 'Supplier'}' posted successfully!`);
        receivePag.refresh();
        historyPag.refresh();
        loadDropdowns();
      })
      .catch((err) => alert(`Error posting PO: ${err.message}`))
      .finally(() => setPostingSupplierId(''));
  };

  const handleOpenReceiveModal = (po) => {
    setReceivingPO(po);
    setRecInvoiceNumber(po.invoice_number || '');
    setRecAdditionalCosts(po.additional_costs?.toString() || '0');
    setRecRounding('0');
    setRecPaymentType(po.payment_type || 'Cash');
    setRecPaidFrom(po.paid_from?.toString() || (bankAccounts.length > 0 ? bankAccounts[0].id.toString() : ''));
    setRecPayOldCredit(false);
    const hasDeducted = parseFloat(po.deducted_credit || 0) > 0;
    setRecDeductSupplierCredit(hasDeducted);
    setRecDeductAmount(hasDeducted ? po.deducted_credit.toString() : '0');

    // Copy PO items to local editable items state
    const copiedItems = (po.items || []).map(item => ({
      product: item.product,
      name: item.product_name,
      barcode: item.barcode,
      quantity: item.quantity,
      purchase_cost: parseFloat(item.purchase_cost),
      new_selling_price: item.new_selling_price ? parseFloat(item.new_selling_price) : '',
      selling_price: parseFloat(item.selling_price || 0)
    }));
    setRecItems(copiedItems);

    setRecProductSearch('');
    setRecSelectedProductObj(null);
    setRecQty('1');
    setRecCost('0');
    setRecNewSellingPrice('');
    setShowReceiveModal(true);
  };

  const handleOpenDirectPurchase = (supplierObj) => {
    const mockPO = {
      id: 'Direct',
      supplier: supplierObj.id,
      supplier_name: supplierObj.name,
      invoice_number: '',
      additional_costs: 0,
      payment_type: 'Cash',
      paid_from: bankAccounts.length > 0 ? bankAccounts[0].id : null,
      deducted_credit: 0,
      items: []
    };
    setReceivingPO(mockPO);
    setRecInvoiceNumber('');
    setRecAdditionalCosts('0');
    setRecRounding('0');
    setRecPaymentType('Cash');
    setRecPaidFrom(bankAccounts.length > 0 ? bankAccounts[0].id.toString() : '');
    setRecPayOldCredit(false);
    setRecDeductSupplierCredit(false);
    setRecDeductAmount('0');
    setRecItems([]);
    setRecProductSearch('');
    setRecSelectedProductObj(null);
    setRecQty('1');
    setRecCost('0');
    setRecNewSellingPrice('');
    setShowReceiveModal(true);
  };

  const handleCancelPO = (id) => {
    if (confirm("Are you sure you want to completely CANCEL and delete this Purchase Order? This action cannot be undone.")) {
      setIsCancellingPO(true);
      api.purchases.delete(id)
        .then(() => {
          alert("Purchase Order has been cancelled and deleted.");
          setShowReceiveModal(false);
          setReceivingPO(null);
          receivePag.refresh();
          historyPag.refresh();
          loadDropdowns();
        })
        .catch((err) => alert(err.message))
        .finally(() => setIsCancellingPO(false));
    }
  };

  const calculateReceiveTotal = (includeOldCredit = false) => {
    const itemsTotal = recItems.reduce((acc, curr) => acc + (curr.quantity * curr.purchase_cost), 0);
    let added = itemsTotal + parseFloat(recAdditionalCosts || 0) - parseFloat(recRounding || 0);

    if (recDeductSupplierCredit) {
      added -= parseFloat(recDeductAmount || 0);
    }

    if (includeOldCredit && recPaymentType !== 'Credit' && receivingPO) {
      const selectedSupplierObj = suppliers.find(s => s.id === receivingPO.supplier);
      const oldCreditVal = selectedSupplierObj && parseFloat(selectedSupplierObj.outstanding_balance) > 0
        ? parseFloat(selectedSupplierObj.outstanding_balance)
        : 0;
      return added + oldCreditVal;
    }
    return added;
  };

  const getPaidOldCreditVal = () => {
    if (recPaymentType !== 'Credit' && recPayOldCredit && receivingPO) {
      const selectedSupplierObj = suppliers.find(s => s.id === receivingPO.supplier);
      return selectedSupplierObj && parseFloat(selectedSupplierObj.outstanding_balance) > 0
        ? parseFloat(selectedSupplierObj.outstanding_balance)
        : 0;
    }
    return 0;
  };

  const handleAddRecLineItem = () => {
    if (!recSelectedProductObj) return;

    // Block duplicates
    const existingIdx = recItems.findIndex(item => item.product === recSelectedProductObj.id);
    if (existingIdx > -1) {
      alert('This product is already in the list. Edit the quantity directly in the table below.');
      return;
    }

    const newItem = {
      product: recSelectedProductObj.id,
      name: recSelectedProductObj.name,
      barcode: recSelectedProductObj.barcode,
      quantity: parseInt(recQty),
      purchase_cost: parseFloat(recCost),
      new_selling_price: recNewSellingPrice !== '' ? parseFloat(recNewSellingPrice) : null,
      selling_price: parseFloat(recSelectedProductObj.selling_price || 0)
    };
    setRecItems([...recItems, newItem]);

    setRecSelectedProductObj(null);
    setRecProductSearch('');
    setRecQty('1');
    setRecCost('0');
    setRecNewSellingPrice('');
  };

  const handleRemoveRecLineItem = (idx) => {
    setRecItems(recItems.filter((_, i) => i !== idx));
  };

  const handleReceiveSubmit = (e) => {
    e.preventDefault();
    if (recItems.length === 0) {
      alert("PO must contain at least one item.");
      return;
    }

    const totalAmt = calculateReceiveTotal(recPayOldCredit);
    if (recPaymentType !== 'Credit') {
      const acc = bankAccounts.find(b => b.id.toString() === recPaidFrom);
      if (acc && parseFloat(acc.balance) < totalAmt) {
        alert(`Insufficient balance in account '${acc.name}' (Current Balance: ₹${acc.balance}, Required: ₹${totalAmt}). Please adjust payment or select Credit.`);
        return;
      }
    }

    const payload = {
      items: recItems.map(item => ({
        product: item.product,
        quantity: item.quantity,
        purchase_cost: item.purchase_cost,
        new_selling_price: item.new_selling_price !== '' && item.new_selling_price !== null ? parseFloat(item.new_selling_price) : null
      })),
      additional_costs: parseFloat(recAdditionalCosts || 0),
      rounding: parseFloat(recRounding || 0),
      total_amount: totalAmt,
      payment_type: recPaymentType,
      paid_from: (recPaymentType !== 'Credit' || parseFloat(recAdditionalCosts || 0) > 0) ? parseInt(recPaidFrom) || null : null,
      paid_old_credit: getPaidOldCreditVal(),
      deducted_credit: recDeductSupplierCredit ? parseFloat(recDeductAmount || 0) : 0
    };

    setIsReceivingPO(true);
    if (receivingPO.id === 'Direct') {
      const createPayload = {
        supplier: receivingPO.supplier,
        invoice_number: recInvoiceNumber,
        additional_costs: parseFloat(recAdditionalCosts || 0),
        payment_type: recPaymentType,
        paid_from: (recPaymentType !== 'Credit' || parseFloat(recAdditionalCosts || 0) > 0) ? parseInt(recPaidFrom) || null : null,
        total_amount: totalAmt,
        deducted_credit: recDeductSupplierCredit ? parseFloat(recDeductAmount || 0) : 0,
        items: recItems.map(item => ({
          product: item.product,
          quantity: item.quantity,
          purchase_cost: item.purchase_cost,
          new_selling_price: item.new_selling_price !== '' && item.new_selling_price !== null ? parseFloat(item.new_selling_price) : null
        }))
      };

      api.purchases.create(createPayload)
        .then((newPo) => {
          return api.purchases.receive(newPo.id, payload);
        })
        .then((res) => {
          alert('Direct purchase processed successfully! Stock and financials updated.');
          setShowReceiveModal(false);
          setReceivingPO(null);
          receivePag.refresh();
          historyPag.refresh();
          loadDropdowns();
          setPoMode(null);
        })
        .catch((err) => alert(`Direct purchase failed: ${err.message}`))
        .finally(() => setIsReceivingPO(false));
    } else {
      api.purchases.receive(receivingPO.id, payload)
        .then((res) => {
          alert(res.message);
          setShowReceiveModal(false);
          setReceivingPO(null);
          receivePag.refresh();
          historyPag.refresh();
          loadDropdowns();
        })
        .catch((err) => alert(err.message))
        .finally(() => setIsReceivingPO(false));
    }
  };

  const handleOpenReturnModal = (po) => {
    setReturningPO(po);
    const copiedItems = (po.items || []).map(item => {
      const remainingQty = item.quantity - (item.returned_qty || 0);
      return {
        product: item.product,
        name: item.product_name,
        barcode: item.barcode,
        purchased_qty: item.quantity,
        returned_qty_done: item.returned_qty || 0,
        remaining_qty: remainingQty,
        qty_to_return: Math.min(remainingQty, typeof item.stock_qty === 'number' ? item.stock_qty : remainingQty),
        purchase_cost: parseFloat(item.purchase_cost),
        stock_qty: typeof item.stock_qty === 'number' ? item.stock_qty : 0
      };
    });
    setReturnItems(copiedItems);
    setReturnAdjustment('0');
    setReturnCreditAccount(bankAccounts.length > 0 ? bankAccounts[0].id.toString() : '');
    setExpandedReturnRows({});
    setShowReturnModal(true);
  };

  const calculateReturnTotalRefund = () => {
    if (!returningPO) return 0;
    const itemsTotal = returnItems.reduce((acc, curr) => acc + (curr.qty_to_return * curr.purchase_cost), 0);
    return itemsTotal - parseFloat(returnAdjustment || 0);
  };

  const handleReturnSubmit = (e) => {
    e.preventDefault();
    const itemsToReturn = returnItems
      .filter(item => item.qty_to_return > 0)
      .map(item => ({
        product: item.product,
        quantity: item.qty_to_return,
        purchase_cost: item.purchase_cost
      }));

    if (itemsToReturn.length === 0) {
      alert("Please specify at least one item and quantity to return.");
      return;
    }

    if (!returnCreditAccount) {
      alert("Please select an account to credit the returned amount.");
      return;
    }

    // Client validation
    for (const item of returnItems) {
      if (item.qty_to_return > item.stock_qty) {
        alert(`Insufficient stock for ${item.name}. Available: ${item.stock_qty}, Return: ${item.qty_to_return}`);
        return;
      }
      if (item.qty_to_return > item.remaining_qty) {
        alert(`Cannot return more than remaining quantity (${item.remaining_qty}) for ${item.name}`);
        return;
      }
    }

    if (confirm('Are you sure you want to perform this purchase return? This will decrement stock levels and adjust financials.')) {
      setIsReturningPO(true);
      api.purchases.return(returningPO.id, {
        items: itemsToReturn,
        adjustment: parseFloat(returnAdjustment || 0),
        credit_account: parseInt(returnCreditAccount)
      })
        .then((res) => {
          alert(res.message);
          setShowReturnModal(false);
          setReturningPO(null);
          receivePag.refresh();
          historyPag.refresh();
          loadDropdowns();
        })
        .catch((err) => alert(err.message))
        .finally(() => setIsReturningPO(false));
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(val);
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
    currentTab === 'receive' ? receivePag.loading :
      currentTab === 'history' ? historyPag.loading :
        dropdownsLoading;

  const getGroupedItems = () => {
    const groups = {};
    items.forEach((item, originalIndex) => {
      const sId = item.supplier_id;
      const sName = item.supplier_name || 'Supplier #' + sId;
      if (!groups[sId]) {
        groups[sId] = {
          supplierName: sName,
          items: []
        };
      }
      groups[sId].items.push({ ...item, originalIndex });
    });
    return groups;
  };

  const renderBillingForm = () => {
    return (
      <>
        {poMode === 'supplier' ? (
          <form onSubmit={handleSubmitPO} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Invoice / Ref #</label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full rounded border border-surface-dim bg-white px-3 py-3 md:py-2 text-sm outline-none focus:border-brand-blue"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Payment Method</label>
              <select
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value)}
                className="w-full rounded border border-surface-dim bg-white px-3 py-3 md:py-2 text-sm outline-none focus:border-brand-blue"
              >
                <option value="Cash">Immediate Cash Payment</option>
                <option value="Bank">Immediate Bank Transfer</option>
                <option value="Credit">
                  Post on credit (Accounts Payable) (old Credit: {
                    formatCurrency(suppliers.find(s => s.id.toString() === supplier)?.outstanding_balance || 0)
                  })
                </option>
              </select>
              {paymentType === 'Credit' && (
                <div className="text-[10px] text-red-600 font-bold mt-1">
                  Current supplier credit balance: {
                    formatCurrency(suppliers.find(s => s.id.toString() === supplier)?.outstanding_balance || 0)
                  }
                </div>
              )}
            </div>
            {paymentType !== 'Credit' && (
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Deduct Cash/Bank Account</label>
                <select
                  value={paidFrom}
                  onChange={(e) => setPaidFrom(e.target.value)}
                  className="w-full rounded border border-surface-dim bg-white px-3 py-3 md:py-2 text-sm outline-none focus:border-brand-blue"
                >
                  {bankAccounts.map((b) => (
                    <option key={b.id} value={b.id}>{b.name} (₹{b.balance})</option>
                  ))}
                </select>
              </div>
            )}

            {(() => {
              const selectedSupplierObj = suppliers.find(s => s.id.toString() === supplier);
              const oldCreditVal = selectedSupplierObj && parseFloat(selectedSupplierObj.outstanding_balance) > 0
                ? parseFloat(selectedSupplierObj.outstanding_balance)
                : 0;
              const negativeCreditVal = selectedSupplierObj && parseFloat(selectedSupplierObj.outstanding_balance) < 0
                ? Math.abs(parseFloat(selectedSupplierObj.outstanding_balance))
                : 0;

              return (
                <div className="space-y-2 pt-1">
                  {paymentType !== 'Credit' && oldCreditVal > 0 && (
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="payOldCredit"
                        checked={payOldCredit}
                        onChange={(e) => setPayOldCredit(e.target.checked)}
                        className="rounded border-surface-dim text-brand-blue focus:ring-brand-blue h-4 w-4"
                      />
                      <label htmlFor="payOldCredit" className="text-xs font-semibold text-text-primary cursor-pointer">
                        Pay Old Credit to Supplier ({formatCurrency(oldCreditVal)})
                      </label>
                    </div>
                  )}
                  {paymentType !== 'Credit' && negativeCreditVal > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="deductSupplierCredit"
                          checked={deductSupplierCredit}
                          onChange={(e) => {
                            setDeductSupplierCredit(e.target.checked);
                            if (e.target.checked) {
                              const itemsTotal = items.reduce((acc, curr) => acc + (curr.quantity * curr.purchase_cost), 0);
                              setDeductAmount(Math.min(negativeCreditVal, itemsTotal).toString());
                            } else {
                              setDeductAmount('0');
                            }
                          }}
                          className="rounded border-surface-dim text-brand-blue focus:ring-brand-blue h-4 w-4"
                        />
                        <label htmlFor="deductSupplierCredit" className="text-xs font-semibold text-text-primary cursor-pointer select-none">
                          Deduct Old Supplier Credit
                        </label>
                      </div>
                      {deductSupplierCredit && (
                        <div className="pl-6">
                          <label className="block text-[10px] font-semibold text-text-secondary mb-0.5">Deduct Amount (Max: {formatCurrency(negativeCreditVal)})</label>
                          <input
                            type="number"
                            step="0.01"
                            max={negativeCreditVal}
                            value={deductAmount}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value || 0);
                              if (val > negativeCreditVal) {
                                setDeductAmount(negativeCreditVal.toString());
                              } else {
                                setDeductAmount(e.target.value);
                              }
                            }}
                            className="w-full max-w-[150px] rounded border border-surface-dim bg-white px-3 py-3 md:py-1 text-sm md:text-xs outline-none text-text-primary focus:border-brand-blue"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="border-t border-surface-low pt-4 space-y-2 text-xs font-semibold">
              {(() => {
                const expectedProfit = items.reduce((acc, item) => {
                  const sell = item.new_selling_price !== null && item.new_selling_price !== undefined && item.new_selling_price !== '' ? parseFloat(item.new_selling_price) : parseFloat(item.selling_price || 0);
                  return acc + (item.quantity * (sell - item.purchase_cost));
                }, 0) - parseFloat(additionalCosts || 0);
                return (
                  <div className={`flex justify-between px-2 py-1.5 rounded-md font-bold border ${expectedProfit >= 0 ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-red-700 bg-red-50 border-red-200'}`}>
                    <span>Expected Total Profit:</span>
                    <span>{formatCurrency(expectedProfit)}</span>
                  </div>
                );
              })()}
              {(() => {
                const baseAmt = items.reduce((acc, curr) => acc + (curr.quantity * curr.purchase_cost), 0) - (deductSupplierCredit ? parseFloat(deductAmount || 0) : 0);
                const oldCreditVal = paymentType !== 'Credit' && payOldCredit ? (() => {
                  const selectedSupplierObj = suppliers.find(s => s.id.toString() === supplier);
                  return selectedSupplierObj && parseFloat(selectedSupplierObj.outstanding_balance) > 0 ? parseFloat(selectedSupplierObj.outstanding_balance) : 0;
                })() : 0;
                const finalPayAmt = baseAmt + oldCreditVal;

                return finalPayAmt < 0 ? (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Supplier will pay to you:</span>
                    <span>{formatCurrency(Math.abs(finalPayAmt))}</span>
                  </div>
                ) : (
                  <div className="flex justify-between text-text-secondary">
                    <span>Amount to Pay Supplier:</span>
                    <span>{formatCurrency(finalPayAmt)}</span>
                  </div>
                );
              })()}
            </div>

            <button
              type="submit"
              disabled={isSavingPO}
              className="w-full flex items-center justify-center space-x-2 rounded bg-brand-blue py-2.5 text-sm font-bold text-white hover:bg-brand-cobalt transition disabled:opacity-50 cursor-pointer"
            >
              {isSavingPO && <Spinner size="sm" />}
              <span>Post Purchase Order</span>
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmitPO} className="space-y-4">
            {(() => {
              const supplierIds = Object.keys(supplierBilling);
              if (supplierIds.length === 0) {
                return <p className="text-xs text-text-secondary text-center py-4">Add products to see billing details.</p>;
              }

              // Ensure we have a valid active tab
              let currentActiveTab = activeBillingSupplierTab;
              if (!currentActiveTab || !supplierIds.includes(currentActiveTab)) {
                currentActiveTab = supplierIds[0];
              }

              const supId = currentActiveTab;
              const billing = supplierBilling[supId];
              if (!billing) return null;

              const supplierItems = items.filter(item => item.supplier_id.toString() === supId);
              const supplierName = supplierItems[0]?.supplier_name || 'Unknown Supplier';
              const itemsSubtotal = supplierItems.reduce((acc, curr) => acc + (curr.quantity * curr.purchase_cost), 0);
              const additional = parseFloat(billing.additionalCosts || 0);

              const selectedSupplierObj = suppliers.find(s => s.id.toString() === supId.toString());
              const oldCreditVal = selectedSupplierObj && parseFloat(selectedSupplierObj.outstanding_balance) > 0
                ? parseFloat(selectedSupplierObj.outstanding_balance)
                : 0;

              const updateBillingField = (field, val) => {
                setSupplierBilling(prev => ({
                  ...prev,
                  [supId]: {
                    ...prev[supId],
                    [field]: val
                  }
                }));
              };

              return (
                <div className="space-y-4">
                  {/* Supplier Tabs Navigation */}
                  {supplierIds.length > 1 && (
                    <div className="flex border-b border-surface-low overflow-x-auto whitespace-nowrap space-x-2 pb-1.5 scrollbar-thin">
                      {supplierIds.map((id) => {
                        const sItems = items.filter(item => item.supplier_id.toString() === id);
                        const sName = sItems[0]?.supplier_name || 'Supplier #' + id;
                        const isActive = currentActiveTab === id;
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => setActiveBillingSupplierTab(id)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition ${isActive
                              ? 'bg-brand-blue border-brand-blue text-white shadow-sm'
                              : 'bg-white border-surface-dim hover:bg-surface-low text-text-secondary'
                              }`}
                          >
                            {sName}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Active Supplier Form */}
                  <div className="border border-surface-low rounded-xl p-3 bg-surface-lowest space-y-3">
                    <div className="flex justify-between items-center border-b border-surface-low pb-1.5">
                      <span className="text-xs font-bold text-brand-blue">{supplierName}</span>
                      <span className="text-[10px] text-text-secondary">{supplierItems.length} item(s)</span>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-text-secondary mb-0.5">Invoice / Ref #</label>
                      <input
                        type="text"
                        value={billing.invoiceNumber}
                        onChange={(e) => updateBillingField('invoiceNumber', e.target.value)}
                        className="w-full rounded border border-surface-dim bg-white px-3 py-3 md:py-1 text-sm md:text-xs outline-none focus:border-brand-blue"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-text-secondary mb-0.5">Payment Method</label>
                      <select
                        value={billing.paymentType}
                        onChange={(e) => updateBillingField('paymentType', e.target.value)}
                        className="w-full rounded border border-surface-dim bg-white px-3 py-3 md:py-1 text-sm md:text-xs outline-none focus:border-brand-blue"
                      >
                        <option value="Cash">Immediate Cash Payment</option>
                        <option value="Bank">Immediate Bank Transfer</option>
                        <option value="Credit">
                          Post on credit (Accounts Payable) (old Credit: {
                            formatCurrency(suppliers.find(s => s.id.toString() === supId.toString())?.outstanding_balance || 0)
                          })
                        </option>
                      </select>
                      {billing.paymentType === 'Credit' && (
                        <div className="text-[9px] text-red-600 font-bold mt-0.5">
                          Current supplier credit balance: {
                            formatCurrency(suppliers.find(s => s.id.toString() === supId.toString())?.outstanding_balance || 0)
                          }
                        </div>
                      )}
                    </div>
                    {billing.paymentType !== 'Credit' && (
                      <div>
                        <label className="block text-[10px] font-semibold text-text-secondary mb-0.5">Deduct Account</label>
                        <select
                          value={billing.paidFrom}
                          onChange={(e) => updateBillingField('paidFrom', e.target.value)}
                          className="w-full rounded border border-surface-dim bg-white px-3 py-3 md:py-1 text-sm md:text-xs outline-none focus:border-brand-blue"
                        >
                          {bankAccounts.map((b) => (
                            <option key={b.id} value={b.id}>{b.name} (₹{b.balance})</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {billing.paymentType !== 'Credit' && (
                      <div className="space-y-2 pt-1">
                        {oldCreditVal > 0 && (
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`payOldCredit-${supId}`}
                              checked={billing.payOldCredit || false}
                              onChange={(e) => updateBillingField('payOldCredit', e.target.checked)}
                              className="rounded border-surface-dim text-brand-blue focus:ring-brand-blue h-4 w-4"
                            />
                            <label htmlFor={`payOldCredit-${supId}`} className="text-xs font-semibold text-text-primary cursor-pointer select-none">
                              Pay Old Credit to Supplier ({formatCurrency(oldCreditVal)})
                            </label>
                          </div>
                        )}
                        {selectedSupplierObj && parseFloat(selectedSupplierObj.outstanding_balance) < 0 && (() => {
                          const negativeCreditVal = Math.abs(parseFloat(selectedSupplierObj.outstanding_balance));
                          return (
                            <div className="space-y-1.5">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id={`deductSupplierCredit-${supId}`}
                                  checked={billing.deductSupplierCredit || false}
                                  onChange={(e) => {
                                    updateBillingField('deductSupplierCredit', e.target.checked);
                                    if (e.target.checked) {
                                      updateBillingField('deductAmount', Math.min(negativeCreditVal, itemsSubtotal).toString());
                                    } else {
                                      updateBillingField('deductAmount', '0');
                                    }
                                  }}
                                  className="rounded border-surface-dim text-brand-blue focus:ring-brand-blue h-4 w-4"
                                />
                                <label htmlFor={`deductSupplierCredit-${supId}`} className="text-xs font-semibold text-text-primary cursor-pointer select-none">
                                  Deduct Old Supplier Credit
                                </label>
                              </div>
                              {billing.deductSupplierCredit && (
                                <div className="pl-6">
                                  <label className="block text-[10px] font-semibold text-text-secondary mb-0.5 font-sans">Deduct Amount (Max: {formatCurrency(negativeCreditVal)})</label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    max={negativeCreditVal}
                                    value={billing.deductAmount || '0'}
                                    onChange={(e) => {
                                      const val = parseFloat(e.target.value || 0);
                                      if (val > negativeCreditVal) {
                                        updateBillingField('deductAmount', negativeCreditVal.toString());
                                      } else {
                                        updateBillingField('deductAmount', e.target.value);
                                      }
                                    }}
                                    className="w-full max-w-[150px] rounded border border-surface-dim bg-white px-3 py-3 md:py-1 text-sm md:text-xs outline-none text-text-primary focus:border-brand-blue"
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    <div className="pt-2 border-t border-dashed border-surface-low text-xs font-semibold space-y-1">
                      <div className="flex justify-between text-text-secondary text-[10px]">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(itemsSubtotal)}</span>
                      </div>
                      {(() => {
                        const expectedProfit = supplierItems.reduce((acc, item) => {
                          const sell = item.new_selling_price !== null && item.new_selling_price !== undefined && item.new_selling_price !== '' ? parseFloat(item.new_selling_price) : parseFloat(item.selling_price || 0);
                          return acc + (item.quantity * (sell - item.purchase_cost));
                        }, 0) - additional;
                        return (
                          <div className={`flex justify-between px-2 py-1 rounded text-[10px] font-bold border ${expectedProfit >= 0 ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-red-700 bg-red-50 border-red-200'}`}>
                            <span>PO Profit:</span>
                            <span>{formatCurrency(expectedProfit)}</span>
                          </div>
                        );
                      })()}
                      {billing.paymentType !== 'Credit' && billing.payOldCredit && oldCreditVal > 0 && (
                        <div className="flex justify-between text-text-secondary text-[10px]">
                          <span>Old Credit Paid:</span>
                          <span>{formatCurrency(oldCreditVal)}</span>
                        </div>
                      )}
                      {(() => {
                        const baseAmt = itemsSubtotal - (billing.deductSupplierCredit ? parseFloat(billing.deductAmount || 0) : 0);
                        const finalPayAmt = baseAmt + (billing.paymentType !== 'Credit' && billing.payOldCredit ? oldCreditVal : 0);

                        return finalPayAmt < 0 ? (
                          <div className="flex justify-between text-emerald-600 text-[10px] font-bold">
                            <span>Supplier will pay to you:</span>
                            <span>{formatCurrency(Math.abs(finalPayAmt))}</span>
                          </div>
                        ) : (
                          <div className="flex justify-between text-text-secondary text-[10px]">
                            <span>Amount to Pay Supplier:</span>
                            <span>{formatCurrency(finalPayAmt)}</span>
                          </div>
                        );
                      })()}
                    </div>
                    <button
                      type="button"
                      disabled={postingSupplierId === supId.toString()}
                      onClick={() => handlePostSingleSupplierPO(supId)}
                      className="w-full flex items-center justify-center space-x-2 rounded bg-brand-blue py-2 text-xs font-bold text-white hover:bg-brand-cobalt transition mt-3 disabled:opacity-50 cursor-pointer"
                    >
                      {postingSupplierId === supId.toString() && <Spinner size="sm" />}
                      <span>Post Purchase Order</span>
                    </button>
                  </div>
                </div>
              );
            })()}
          </form>
        )}
      </>
    );
  };



  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-text-primary">Purchases & Receiving</h2>
        <p className="text-xs text-text-secondary">Create purchase orders, receive inventory, configure landed costs, and manage returns.</p>
      </div>

      {/* Tabs Menu */}
      <div className="hidden md:block tabs-container border-b border-surface-low">
        <div className="tabs-scrollable space-x-6 text-sm font-medium">
          <Link
            to="/erp/purchases?tab=create_purchase"
            className={`pb-2 ${currentTab === 'create' ? 'border-b-2 border-brand-blue text-brand-blue' : 'text-text-secondary'}`}
          >
            Create Purchase Order
          </Link>
          <Link
            to="/erp/purchases?tab=receive"
            className={`pb-2 ${currentTab === 'receive' ? 'border-b-2 border-brand-blue text-brand-blue' : 'text-text-secondary'}`}
          >
            Receive Products
          </Link>
          <Link
            to="/erp/purchases?tab=history"
            className={`pb-2 ${currentTab === 'history' ? 'border-b-2 border-brand-blue text-brand-blue' : 'text-text-secondary'}`}
          >
            Purchase History Log
          </Link>
        </div>
      </div>

      {/* Create Purchase Order */}
      {currentTab === 'create' && !poMode && (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-lg border border-surface-low shadow-sm space-y-6">
          <h3 className="text-lg font-semibold text-text-primary">Choose Purchase Order Mode</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl">
            <button
              onClick={() => setPoMode('supplier')}
              className="flex flex-col items-center p-6 border border-surface-dim hover:border-brand-blue rounded-lg bg-surface-lowest hover:bg-surface-light transition text-center space-y-3 group"
            >
              <div className="rounded-full bg-brand-blue/10 p-3 text-brand-blue group-hover:bg-brand-blue group-hover:text-white transition">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <span className="font-semibold text-sm text-text-primary">Single Shop</span>
            </button>

            <button
              onClick={() => setPoMode('product')}
              className="flex flex-col items-center p-6 border border-surface-dim hover:border-brand-blue rounded-lg bg-surface-lowest hover:bg-surface-light transition text-center space-y-3 group"
            >
              <div className="rounded-full bg-brand-blue/10 p-3 text-brand-blue group-hover:bg-brand-blue group-hover:text-white transition">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <span className="font-semibold text-sm text-text-primary">Multiple Shop</span>
            </button>

            <button
              onClick={() => {
                setPoMode('direct');
                setSupplierSearch('');
                setShowSupplierDropdown(false);
              }}
              className="flex flex-col items-center p-6 border border-surface-dim hover:border-brand-blue rounded-lg bg-surface-lowest hover:bg-surface-light transition text-center space-y-3 group"
            >
              <div className="rounded-full bg-emerald-100 p-3 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <span className="font-semibold text-sm text-text-primary">Purchase without PO(Single Shop)</span>
            </button>
          </div>
        </div>
      )}

      {currentTab === 'create' && (poMode === 'supplier' || poMode === 'product') && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main PO Info */}
          <div className="md:rounded-lg md:bg-white p-0 md:p-6 md:shadow-sm md:border md:border-surface-low bg-transparent border-none space-y-4 lg:col-span-2">
            <div className="flex justify-between items-center">
              <h3 className="text-base md:text-lg font-bold text-text-primary">
                {poMode === 'product' ? 'Multiple Shop PO' : 'Single Shop PO'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  if (items.length > 0) {
                    if (!window.confirm('All selected items may be removed if you change mode. Do you want to continue?')) {
                      return;
                    }
                  }
                  setPoMode(null);
                  setItems([]);
                  setSupplier('');
                }}
                className="inline-flex items-center rounded border border-surface-dim bg-white px-3 py-1.5 text-xs text-text-secondary hover:bg-surface-low transition cursor-pointer"


              >
                <svg className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                <span  >Change Mode</span>
              </button>
            </div>

            {/* Searchable Supplier Selector */}
            {poMode === 'supplier' && (
              <div ref={supplierDropdownRef} className="relative w-full max-w-md">
                <label className="block text-xs font-semibold text-text-secondary mb-1">Supplier</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search & select supplier..."
                    value={supplierSearch}
                    onChange={(e) => {
                      setSupplierSearch(e.target.value);
                      setShowSupplierDropdown(true);
                    }}
                    onFocus={() => {
                      setSupplierSearch('');
                      setShowSupplierDropdown(true);
                    }}
                    className="w-full rounded border border-surface-dim bg-white pl-3 pr-8 py-3 md:py-2 text-sm text-text-primary outline-none focus:border-brand-blue search-input-mobile"
                  />
                  {supplierSearching && (
                    <span className="absolute right-8 top-3.5 md:top-2.5 text-[10px] text-brand-blue animate-pulse">Searching...</span>
                  )}
                  <span className="absolute right-2.5 top-3.5 md:top-2.5 text-text-secondary pointer-events-none">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </div>
                {showSupplierDropdown && (
                  <div className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-black/5 focus:outline-none border border-surface-dim">
                    {suppliers.length === 0 ? (
                      <div className="px-3 py-2 text-text-secondary">No suppliers found.</div>
                    ) : (
                      suppliers.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            setSupplier(s.id.toString());
                            setSupplierSearch(s.name);
                            setShowSupplierDropdown(false);
                          }}
                          className={`w-full text-left px-3 py-2 hover:bg-surface-low text-text-primary font-medium border-b border-surface-lowest last:border-0 ${supplier === s.id.toString() ? 'bg-surface-low font-semibold' : ''
                            }`}
                        >
                          {s.name}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Add Line Item subform */}
            {!selectedProductObj ? (
              <button
                type="button"
                onClick={handleOpenViewAllPopup}
                className="w-full rounded-lg border border-dashed border-brand-blue/40 bg-brand-blue/5 hover:bg-brand-blue/10 text-brand-blue py-4 text-sm font-semibold flex items-center justify-center gap-2 transition"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                Add Product
              </button>
            ) : (
              <div className="rounded border border-surface-low p-4 bg-surface-lowest space-y-3 animate-in fade-in duration-200">
                <div className="flex justify-between items-center pb-1 border-b border-surface-low/60">
                  <div>
                    <span className="text-xs font-bold text-brand-blue">Selected Product</span>
                    <div className="text-xs text-text-primary font-semibold">
                      {selectedProductObj.name} <span className="text-text-secondary font-normal">({selectedProductObj.barcode})</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProductObj(null);
                      setProductSearch('');
                      setQty('1');
                      setCost('0');
                      setNewSellingPrice('');
                      setProductSuppliers([]);
                      setSelectedProductSupplierId('');
                    }}
                    className="text-text-secondary hover:text-text-primary text-[10px] font-semibold border border-surface-dim hover:bg-surface-low rounded px-2 py-0.5 transition-colors"
                  >
                    Change
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {poMode === 'product' && (
                    <div className="sm:col-span-full">
                      <label className="block text-[11px] font-semibold text-text-secondary mb-0.5">Supplier (Price)</label>
                      <select
                        value={selectedProductSupplierId}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedProductSupplierId(val);
                          const mapped = productSuppliers.find(ps => ps.supplier.toString() === val);
                          if (mapped) {
                            setCost(mapped.current_cost.toString());
                          }
                        }}
                        className="w-full rounded border border-surface-dim bg-white px-3 py-3 md:py-1.5 text-sm md:text-xs text-text-primary outline-none focus:border-brand-blue"
                      >
                        <option value="">-- Select Supplier --</option>
                        {productSuppliers.map((ps) => (
                          <option key={ps.supplier} value={ps.supplier}>
                            {ps.supplier_name} (₹{ps.current_cost})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="col-span-full grid grid-cols-3 gap-2.5">
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
                      <label className="block text-[11px] font-semibold text-text-secondary mb-0.5">Unit Cost (INR)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={cost}
                        onChange={(e) => setCost(e.target.value)}
                        className="w-full rounded border border-surface-dim bg-white px-3 py-3 md:py-1.5 text-sm md:text-xs text-text-primary outline-none focus:border-brand-blue"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-text-secondary mb-0.5 truncate" title="New Retail Selling Price">New Retail Price</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Same"
                        value={newSellingPrice}
                        onChange={(e) => setNewSellingPrice(e.target.value)}
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
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Line Items Table */}
            <div className="overflow-x-auto pt-2 hidden lg:block">
              <table className="min-w-full text-left text-xs">
                <thead className="bg-surface-low text-text-secondary font-semibold uppercase">
                  <tr>
                    <th className="px-3 py-1.5">Product</th>
                    {poMode === 'product' && <th className="px-3 py-1.5">Supplier</th>}
                    <th className="px-3 py-1.5 text-right">Qty</th>
                    <th className="px-3 py-1.5 text-right">Unit Cost</th>
                    <th className="px-3 py-1.5 text-right">New Retail Price</th>
                    <th className="px-3 py-1.5 text-right text-green-600">Profit</th>
                    <th className="px-3 py-1.5 text-right">Subtotal</th>
                    <th className="px-3 py-1.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-low">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={poMode === 'product' ? "8" : "7"} className="px-3 py-8 text-center text-text-secondary">No items added to PO yet.</td>
                    </tr>
                  ) : (
                    Object.entries(getGroupedItems()).map(([supId, group]) => (
                      <React.Fragment key={supId}>
                        <tr className="bg-surface-low/30">
                          <td colSpan={poMode === 'product' ? "8" : "7"} className="px-3 py-1.5 font-bold text-xs text-brand-blue">
                            Supplier: {group.supplierName}
                          </td>
                        </tr>
                        {group.items.map((item) => {
                          const sell = item.new_selling_price !== null && item.new_selling_price !== undefined && item.new_selling_price !== '' ? parseFloat(item.new_selling_price) : parseFloat(item.selling_price || 0);
                          const itemProfit = item.quantity * (sell - item.purchase_cost);
                          return (
                            <tr key={item.originalIndex}>
                              <td className="px-3 py-2 pl-6">
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
                              {poMode === 'product' && (
                                <td className="px-3 py-2 text-text-primary font-medium">
                                  {item.supplier_name}
                                </td>
                              )}
                              <td className="px-3 py-2 text-right text-text-primary">{item.quantity}</td>
                              <td className="px-3 py-2 text-right text-text-secondary">{formatCurrency(item.purchase_cost)}</td>
                              <td className="px-3 py-2 text-right text-text-primary">
                                {item.new_selling_price ? formatCurrency(item.new_selling_price) : '-'}
                              </td>
                              <td className={`px-3 py-2 text-right font-semibold ${itemProfit >= 0 ? 'text-green-600' : 'text-error'}`}>
                                {formatCurrency(itemProfit)}
                              </td>
                              <td className="px-3 py-2 text-right font-semibold text-text-primary">
                                {formatCurrency(item.quantity * item.purchase_cost)}
                              </td>
                              <td className="px-3 py-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveLineItem(item.originalIndex)}
                                  className="text-error hover:underline"
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>


          </div>

          {/* Supplier, Payment & Totals */}
          <div className="rounded-lg bg-white p-6 shadow-sm border border-surface-low h-fit space-y-4 hidden lg:block" style={{ boxShadow: '0px 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 className="text-sm font-semibold text-text-primary">Billing & Settlement</h3>
            {renderBillingForm()}
          </div>
        </div>
      )}

      {currentTab === 'create' && poMode === 'direct' && (
        <div className="md:rounded-lg md:bg-white p-6 md:shadow-sm md:border md:border-surface-low space-y-4 max-w-md mx-auto">
          <div className="flex justify-between items-center">
            <h3 className="text-base md:text-lg font-bold text-text-primary">
              Purchase Without PO
            </h3>
            <button
              type="button"
              onClick={() => setPoMode(null)}
              className="inline-flex items-center rounded border border-surface-dim bg-white px-3 py-1.5 text-xs text-text-secondary hover:bg-surface-low transition cursor-pointer"

            >
              <svg className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              <span>Change Mode</span>
            </button>
          </div>

          <div ref={supplierDropdownRef} className="relative w-full">
            <label className="block text-xs font-semibold text-text-secondary mb-1">Select Supplier</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search & select supplier..."
                value={supplierSearch}
                onChange={(e) => {
                  setSupplierSearch(e.target.value);
                  setShowSupplierDropdown(true);
                }}
                onFocus={() => {
                  setSupplierSearch('');
                  setShowSupplierDropdown(true);
                }}
                className="w-full rounded border border-surface-dim bg-white pl-3 pr-8 py-3 md:py-2 text-sm text-text-primary outline-none focus:border-brand-blue search-input-mobile"
              />
              {supplierSearching && (
                <span className="absolute right-8 top-3.5 md:top-2.5 text-[10px] text-brand-blue animate-pulse">Searching...</span>
              )}
              <span className="absolute right-2.5 top-3.5 md:top-2.5 text-text-secondary pointer-events-none">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </div>
            {showSupplierDropdown && (
              <div className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-black/5 focus:outline-none border border-surface-dim">
                {suppliers.length === 0 ? (
                  <div className="px-3 py-2 text-text-secondary">No suppliers found.</div>
                ) : (
                  suppliers.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setSupplierSearch(s.name);
                        setShowSupplierDropdown(false);
                        handleOpenDirectPurchase(s);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-surface-low text-text-primary font-medium border-b border-surface-lowest last:border-0"
                    >
                      {s.name}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Receive Products */}
      {currentTab === 'receive' && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 md:bg-white md:p-4 md:rounded-t-lg md:border-t md:border-x md:border-surface-low bg-transparent p-0 border-none">
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                value={receivePag.search}
                onChange={(e) => receivePag.setSearch(e.target.value)}
                placeholder="Search POs by supplier/invoice ref..."
                className="w-full rounded border border-surface-dim bg-white pl-9 pr-3 py-3 md:py-2 text-sm md:text-xs text-text-primary outline-none focus:border-brand-blue placeholder:text-text-secondary search-input-mobile"
              />
              <span className="absolute left-3 top-3.5 md:top-2.5 text-text-secondary">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
            </div>
            {activeLoading && (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-brand-blue border-t-transparent" />
            )}
          </div>

          <div className="rounded-b-lg bg-white border-x border-b border-surface-low overflow-x-auto hidden md:block">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-surface-low text-text-secondary font-semibold uppercase text-xs tracking-wider">
                <tr>
                  {renderSortHeader('PO #', 'id', receivePag)}
                  {renderSortHeader('Supplier', 'supplier__name', receivePag)}
                  {renderSortHeader('Ref Invoice #', 'invoice_number', receivePag)}
                  <th className="px-4 py-4">Payment Type</th>
                  <th className="px-4 py-4 text-right">Landed Cost</th>
                  {renderSortHeader('Total Amount', 'total_amount', receivePag)}
                  <th className="px-4 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-low">
                {receivePag.loading ? (
                  <SkeletonTable rows={5} columns={7} />
                ) : (
                  receivePag.data.map((p) => (
                    <tr key={p.id} className="hover:bg-surface-bright  " onClick={() => { setDetailsPO(p); setShowDetailsModal(true); }}>
                      <td className="px-4 py-4 font-semibold text-brand-blue cursor-pointer hover:underline" >PO-{p.id}</td>
                      <td className="px-4 py-4 text-text-primary">{p.supplier_name}</td>
                      <td className="px-4 py-4 text-text-secondary font-mono">{p.invoice_number || '-'}</td>
                      <td className="px-4 py-4 text-text-secondary">{p.payment_type}</td>
                      <td className="px-4 py-4 text-right text-text-secondary">{formatCurrency(p.additional_costs)}</td>
                      <td className="px-4 py-4 text-right font-semibold text-text-primary">{formatCurrency(p.total_amount)}</td>
                      <td className="px-4 py-4 text-center flex items-center justify-center space-x-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => { setDetailsPO(p); setShowShareModal(true); }}
                          className="rounded bg-brand-blue px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-cobalt transition flex items-center space-x-1 cursor-pointer"
                        >
                          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.713-1.458L0 24zm6.275-3.66c1.66.986 3.292 1.503 4.887 1.504 5.485 0 9.948-4.468 9.95-9.953.002-2.656-1.026-5.153-2.896-7.027C16.399 3.018 13.9 1.99 11.231 1.99c-5.492 0-9.957 4.471-9.96 9.956-.001 1.778.48 3.5 1.393 5.006l-1.011 3.69 3.79-.994zM16.92 14.73c-.287-.143-1.697-.837-1.959-.933-.262-.095-.452-.143-.642.143-.19.286-.738.933-.905 1.124-.167.19-.333.214-.62.071-.286-.143-1.21-.446-2.305-1.424-.853-.76-1.429-1.7-1.597-1.986-.167-.286-.018-.44.125-.581.13-.127.287-.333.43-.5.143-.167.19-.286.286-.476.095-.19.048-.357-.024-.5-.071-.143-.642-1.547-.88-2.12-.23-.556-.464-.48-.642-.489l-.547-.01c-.19 0-.5.071-.762.357-.262.286-1.002.977-1.002 2.38s1.02 2.76 1.162 2.95c.143.19 2.007 3.064 4.862 4.297.68.293 1.21.468 1.62.598.683.217 1.305.187 1.796.114.548-.082 1.697-.69 1.936-1.357.24-.667.24-1.238.167-1.357-.072-.119-.262-.19-.548-.333z" />
                          </svg>
                          <span>Share PO</span>
                        </button>
                        <button
                          onClick={() => handleOpenReceiveModal(p)}
                          className="rounded bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 transition"
                        >
                          Receive PO
                        </button>
                      </td>
                    </tr>
                  ))
                )}
                {receivePag.data.length === 0 && !receivePag.loading && (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-text-secondary">No pending purchase orders found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card list */}
          <div className="block md:hidden space-y-4">
            {receivePag.loading ? (
              Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="border border-surface-low rounded-lg p-4 bg-gray-100 space-y-3 shadow-sm animate-pulse">
                  <div className="flex justify-between items-start border-b border-surface-low pb-2">
                    <div className="space-y-2">
                      <div className="h-4 w-20 bg-surface-dim/50 rounded" />
                      <div className="h-4 w-32 bg-surface-dim/50 rounded" />
                    </div>
                    <div className="h-6 w-16 bg-surface-dim/50 rounded" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="h-4 w-24 bg-surface-dim/50 rounded" />
                    <div className="h-4 w-24 bg-surface-dim/50 rounded" />
                  </div>
                </div>
              ))
            ) : (
              receivePag.data.map((p) => (
                <div
                  key={p.id}
                  onClick={() => { setDetailsPO(p); setShowDetailsModal(true); }}
                  className="rounded-lg border border-surface-low bg-white p-3 shadow-sm active:bg-surface-low transition-colors cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <span className="font-semibold text-text-primary text-sm">PO-{p.id}</span> ({p.payment_type})
                      <span className="text-text-secondary text-[10px] block mt-0.5">{p.supplier_name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-brand-blue text-sm">{formatCurrency(p.total_amount)}</span>
                      <span className="font-semibold text-amber-600 text-[10px] block mt-0.5">Pending</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs text-text-secondary mt-1">
                    <span>Invoice Ref: {p.invoice_number || '-'}</span>
                    <span>{new Date(p.timestamp).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
            {receivePag.data.length === 0 && !receivePag.loading && (
              <div className="text-center py-8 text-text-secondary text-xs bg-white rounded-lg border border-surface-low">No pending purchase orders found.</div>
            )}
          </div>

          <div className="md:bg-white md:px-4 md:py-3 flex items-center justify-between md:border-t md:border-surface-low bg-transparent p-0 border-none mt-2">
            <PaginationControls
              page={receivePag.page}
              setPage={receivePag.setPage}
              pageSize={receivePag.pageSize}
              setPageSize={receivePag.setPageSize}
              totalCount={receivePag.totalCount}
              totalPages={receivePag.totalPages}
              loading={receivePag.loading}
            />
          </div>
        </div>
      )}

      {/* Purchase History */}
      {currentTab === 'history' && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 md:bg-white md:p-4 md:rounded-t-lg md:border-t md:border-x md:border-surface-low bg-transparent p-0 border-none">
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                value={historyPag.search}
                onChange={(e) => historyPag.setSearch(e.target.value)}
                placeholder="Search history by supplier/invoice ref..."
                className="w-full rounded border border-surface-dim bg-white pl-9 pr-3 py-3 md:py-2 text-sm md:text-xs text-text-primary outline-none focus:border-brand-blue placeholder:text-text-secondary search-input-mobile"
              />
              <span className="absolute left-3 top-3.5 md:top-2.5 text-text-secondary">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <label htmlFor="history-period-select" className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Period:</label>
              {!period.startsWith('custom_') ? (
                <select
                  id="history-period-select"
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
            {activeLoading && (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-brand-blue border-t-transparent" />
            )}
          </div>

          <div className="rounded-b-lg bg-white border-x border-b border-surface-low overflow-x-auto hidden md:block">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-surface-low text-text-secondary font-semibold uppercase text-xs tracking-wider">
                <tr>
                  {renderSortHeader('PO #', 'id', historyPag)}
                  {renderSortHeader('Date', 'timestamp', historyPag)}
                  {renderSortHeader('Supplier', 'supplier__name', historyPag)}
                  <th className="px-4 py-4 text-right">Landed Cost</th>
                  <th className="px-4 py-4 text-right">Payment Type</th>
                  {renderSortHeader('Total Amount', 'total_amount', historyPag)}
                  {renderSortHeader('Status', 'is_received', historyPag)}
                  <th className="px-4 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-low">
                {historyPag.loading ? (
                  <SkeletonTable rows={5} columns={7} />
                ) : (
                  historyPag.data.map((p) => (
                    <tr key={p.id} className="hover:bg-surface-bright" onClick={() => { setDetailsPO(p); setShowDetailsModal(true); }}>
                      <td className="px-4 py-4 font-semibold text-brand-blue cursor-pointer hover:underline" >PO-{p.id}</td>
                      <td className="px-4 py-4 text-text-secondary">{new Date(p.timestamp).toLocaleString()}</td>
                      <td className="px-4 py-4 text-text-primary">{p.supplier_name}</td>
                      <td className="px-4 py-4 text-right text-text-secondary">{formatCurrency(p.additional_costs)}</td>
                      <td className="px-4 py-4 text-right text-text-secondary">{p.payment_type}</td>
                      <td className="px-4 py-4 text-right font-semibold text-text-primary">{formatCurrency(p.total_amount)}</td>
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-semibold ${p.status === 'Returned' ? 'bg-red-100 text-red-800' :
                          p.status === 'Partially Returned' ? 'bg-orange-100 text-orange-800' :
                            p.status === 'Received' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                          {p.status || (p.is_received ? 'Received' : 'Pending')}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center flex items-center justify-center space-x-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => { setDetailsPO(p); setShowShareModal(true); }}
                          className="rounded bg-brand-blue px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-cobalt transition flex items-center space-x-1 cursor-pointer"
                        >
                          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.713-1.458L0 24zm6.275-3.66c1.66.986 3.292 1.503 4.887 1.504 5.485 0 9.948-4.468 9.95-9.953.002-2.656-1.026-5.153-2.896-7.027C16.399 3.018 13.9 1.99 11.231 1.99c-5.492 0-9.957 4.471-9.96 9.956-.001 1.778.48 3.5 1.393 5.006l-1.011 3.69 3.79-.994zM16.92 14.73c-.287-.143-1.697-.837-1.959-.933-.262-.095-.452-.143-.642.143-.19.286-.738.933-.905 1.124-.167.19-.333.214-.62.071-.286-.143-1.21-.446-2.305-1.424-.853-.76-1.429-1.7-1.597-1.986-.167-.286-.018-.44.125-.581.13-.127.287-.333.43-.5.143-.167.19-.286.286-.476.095-.19.048-.357-.024-.5-.071-.143-.642-1.547-.88-2.12-.23-.556-.464-.48-.642-.489l-.547-.01c-.19 0-.5.071-.762.357-.262.286-1.002.977-1.002 2.38s1.02 2.76 1.162 2.95c.143.19 2.007 3.064 4.862 4.297.68.293 1.21.468 1.62.598.683.217 1.305.187 1.796.114.548-.082 1.697-.69 1.936-1.357.24-.667.24-1.238.167-1.357-.072-.119-.262-.19-.548-.333z" />
                          </svg>
                          <span>Share PO</span>
                        </button>
                        {p.is_received && (
                          <button
                            onClick={() => handleOpenReturnModal(p)}
                            className="inline-flex items-center justify-center rounded bg-red-600 hover:bg-red-700 px-2.5 py-1 text-[11px] font-bold text-white transition shadow-sm cursor-pointer h-7"
                          >
                            <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                            </svg>
                            <span>Return Purchase</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
                {historyPag.data.length === 0 && !historyPag.loading && (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-text-secondary">No purchase orders found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card list */}
          <div className="block md:hidden space-y-4">
            {historyPag.loading ? (
              Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="border border-surface-low rounded-lg p-4 bg-gray-100 space-y-3 shadow-sm animate-pulse">
                  <div className="flex justify-between items-start border-b border-surface-low pb-2">
                    <div className="space-y-2">
                      <div className="h-4 w-20 bg-surface-dim/50 rounded" />
                      <div className="h-4 w-32 bg-surface-dim/50 rounded" />
                    </div>
                    <div className="h-6 w-16 bg-surface-dim/50 rounded" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="h-4 w-24 bg-surface-dim/50 rounded" />
                    <div className="h-4 w-24 bg-surface-dim/50 rounded" />
                  </div>
                </div>
              ))
            ) : (
              historyPag.data.map((p) => (
                <div
                  key={p.id}
                  onClick={() => { setDetailsPO(p); setShowDetailsModal(true); }}
                  className="rounded-lg border border-surface-low bg-white p-3 shadow-sm active:bg-surface-low transition-colors cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <span className="font-semibold text-text-primary text-sm">PO-{p.id}</span> ({p.payment_type})
                      <span className="text-text-secondary text-[10px] block mt-0.5">{p.supplier_name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-brand-blue text-sm">{formatCurrency(p.total_amount)}</span>
                      <span className={`font-semibold text-[10px] block mt-0.5 ${p.status === 'Returned' ? 'text-red-600' :
                        p.status === 'Partially Returned' ? 'text-orange-600' :
                          p.status === 'Received' ? 'text-green-600' : 'text-amber-600'
                        }`}>
                        {p.status || (p.is_received ? 'Received' : 'Pending')}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs text-text-secondary mt-1">
                    <span>Landed Cost: {formatCurrency(p.additional_costs)}</span>
                    <span>{new Date(p.timestamp).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
            {historyPag.data.length === 0 && !historyPag.loading && (
              <div className="text-center py-8 text-text-secondary text-xs bg-white rounded-lg border border-surface-low">No purchase orders found.</div>
            )}
          </div>

          <div className="md:bg-white md:px-4 md:py-3 flex items-center justify-between md:border-t md:border-surface-low bg-transparent p-0 border-none mt-2">
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

      {showViewAllPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-6">
          <div className="w-full max-w-4xl rounded-lg bg-white shadow-xl flex flex-col h-[85vh] relative overflow-hidden border border-surface-low animate-in fade-in duration-200">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-surface-low bg-surface-lowest">
              <h3 className="text-sm font-bold text-text-primary">
                {poMode === 'supplier' ? 'Select Product (Supplier Mapped)' : 'Select Product & Supplier'}
              </h3>
              <button
                type="button"
                onClick={() => setShowViewAllPopup(false)}
                className="text-text-secondary hover:text-text-primary text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Sub-Modal Overlay (Choose Supplier for Multiple Shop mode) */}
            {selectedPopupProduct && (
              <div className="absolute inset-0 bg-black/35 backdrop-blur-sm flex items-center justify-center p-4 z-20">
                <div className="bg-white rounded-lg p-5 max-w-md w-full border border-surface-low shadow-lg relative animate-in zoom-in-95 duration-150">
                  <button
                    type="button"
                    onClick={() => setSelectedPopupProduct(null)}
                    className="absolute top-3 right-3 text-text-secondary hover:text-text-primary text-sm font-bold"
                  >
                    ✕
                  </button>
                  <h4 className="text-sm font-bold text-text-primary mb-3">Choose Supplier for {selectedPopupProduct.name}</h4>
                  {popupProductSuppliersLoading ? (
                    <div className="text-center py-6 text-xs text-brand-blue animate-pulse">Loading Suppliers...</div>
                  ) : popupProductSuppliers.length === 0 ? (
                    <div className="text-center py-6 text-xs text-text-secondary">No suppliers mapped to this product.</div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {popupProductSuppliers.map((sp) => (
                        <button
                          key={sp.id}
                          type="button"
                          onClick={() => handleSelectProductSupplierPopup(sp)}
                          className="w-full text-left p-2.5 rounded border border-surface-dim hover:border-brand-blue hover:bg-brand-blue/5 flex justify-between items-center text-xs transition-colors"
                        >
                          <span className="font-semibold text-text-primary">{sp.supplier_name}</span>
                          <span className="text-brand-blue font-bold">₹{sp.current_cost}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

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
                  {poMode === 'supplier' ? (
                    filteredProductsList.map((sp) => {
                      const firstImage = sp.product_image ? sp.product_image.split(',')[0] : '';
                      return (
                        <button
                          key={sp.id}
                          type="button"
                          onClick={() => handleSelectSupplierProductPopup(sp)}
                          className="text-left p-2.5 rounded-lg border border-surface-dim hover:border-brand-blue bg-white hover:bg-surface-light shadow-sm transition flex items-center w-full"
                        >
                          <div className="h-12 w-12 rounded bg-surface border border-surface-low overflow-hidden flex-shrink-0 mr-3">
                            {firstImage ? (
                              <img src={firstImage} alt={sp.product_name} className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-[10px] text-text-secondary">No img</div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="font-semibold text-xs text-text-primary line-clamp-1 block">{sp.product_name}</span>
                            {sp.suitable_models_details && sp.suitable_models_details.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1 font-normal">
                                {sp.suitable_models_details.map((m) => (
                                  <span key={m.id} className="inline-block px-1.5 py-0.5 rounded bg-brand-blue/10 text-brand-blue text-[9px] font-semibold border border-brand-blue/15">
                                    {m.brand_name} {m.model_name}
                                  </span>
                                ))}
                              </div>
                            )}
                            <span className="text-[10px] text-text-secondary font-mono block">{sp.barcode}</span>
                            <span className="text-brand-blue font-bold text-xs pt-0.5 block">₹{sp.current_cost}</span>
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    filteredProductsList.map((p) => {
                      const firstImage = p.image_url ? p.image_url.split(',')[0] : '';
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleSelectProductPopup(p)}
                          className="text-left p-2.5 rounded-lg border border-surface-dim hover:border-brand-blue bg-white hover:bg-surface-light shadow-sm transition flex items-center w-full"
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
                            <span className="text-text-secondary text-[10px] pt-0.5 block">RRP: ₹{p.selling_price}</span>
                          </div>
                        </button>
                      );
                    })
                  )}
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

      {showReceiveModal && receivingPO && (
        <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center bg-black/45 px-4 py-6 overflow-y-auto">
          <div className="w-full max-w-4xl rounded-lg bg-white shadow-xl flex flex-col max-h-[90vh] relative border border-surface-low animate-in fade-in duration-200">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-surface-low bg-surface-lowest">
              <div>
                <h3 className="text-sm font-bold text-text-primary">
                  {receivingPO.id === 'Direct' ? 'Purchase without PO' : `Receive & Post Purchase Order (PO-${receivingPO.id})`}
                </h3>
                <p className="text-[11px] text-text-secondary">Supplier: <span className="font-semibold text-text-primary">{receivingPO.supplier_name}</span></p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowReceiveModal(false);
                  setReceivingPO(null);
                  if (poMode === 'direct') {
                    setPoMode(null);
                  }
                }}
                className="text-text-secondary hover:text-text-primary text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Invoice / Ref #</label>
                  <input
                    type="text"
                    value={recInvoiceNumber}
                    onChange={(e) => setRecInvoiceNumber(e.target.value)}
                    className="w-full rounded border border-surface-dim bg-white px-3 py-1.5 text-xs text-text-primary outline-none focus:border-brand-blue"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Payment Method</label>
                  <select
                    value={recPaymentType}
                    onChange={(e) => setRecPaymentType(e.target.value)}
                    className="w-full rounded border border-surface-dim bg-white px-3 py-1.5 text-xs text-text-primary outline-none focus:border-brand-blue"
                  >
                    <option value="Cash">Immediate Cash Payment</option>
                    <option value="Bank">Immediate Bank Transfer</option>
                    <option value="Credit">
                      Post on credit (Accounts Payable) (old Credit: {
                        formatCurrency(suppliers.find(s => s.id === receivingPO.supplier)?.outstanding_balance || 0)
                      })
                    </option>
                  </select>
                </div>
                {recPaymentType !== 'Credit' && (
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">Deduct Cash/Bank Account</label>
                    <select
                      value={recPaidFrom}
                      onChange={(e) => setRecPaidFrom(e.target.value)}
                      className="w-full rounded border border-surface-dim bg-white px-3 py-1.5 text-xs text-text-primary outline-none focus:border-brand-blue"
                    >
                      {bankAccounts.map((b) => (
                        <option key={b.id} value={b.id}>{b.name} (₹{b.balance})</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Items List Table */}
              <div className="border border-surface-low rounded-lg hidden md:block">
                <table className="min-w-full text-left text-xs bg-white">
                  <thead className="bg-surface-low text-text-secondary font-semibold uppercase">
                    <tr>
                      <th className="px-3 py-2">
                        <div className="flex items-center space-x-2">
                          <span>Product</span>
                          <button
                            type="button"
                            onClick={handleOpenRecViewAllPopup}
                            className="whitespace-nowrap rounded bg-blue-400 px-2 py-0.5 text-[10px] font-semibold text-white hover:bg-brand-blue hover:text-white transition-colors"
                          >
                            View All
                          </button>
                        </div>
                      </th>
                      <th className="px-3 py-2 text-right w-20">Qty</th>
                      <th className="px-3 py-2 text-right w-24">Cost (₹)</th>
                      <th className="px-3 py-2 text-right w-32">New Price (₹)</th>
                      <th className="px-3 py-2 text-right text-green-600">Profit</th>
                      <th className="px-3 py-2 text-right">Subtotal</th>
                      <th className="px-3 py-2 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-low">
                    {recItems.map((item, idx) => {
                      const sell = item.new_selling_price !== null && item.new_selling_price !== undefined && item.new_selling_price !== '' ? parseFloat(item.new_selling_price) : parseFloat(item.selling_price || 0);
                      const itemProfit = item.quantity * (sell - item.purchase_cost);
                      return (
                        <tr key={idx} className="hover:bg-surface-bright">
                          <td className="px-3 py-2 font-medium text-text-primary">
                            <div>{item.name}</div>
                            <div className="text-[10px] text-text-secondary font-mono">{item.barcode}</div>
                          </td>
                          <td className="px-3 py-2 text-right">
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => {
                                const updated = [...recItems];
                                updated[idx].quantity = parseInt(e.target.value || 0);
                                setRecItems(updated);
                              }}
                              className="w-16 rounded border border-surface-dim bg-white px-1.5 py-1 text-xs text-right text-text-primary outline-none"
                            />
                          </td>
                          <td className="px-3 py-2 text-right">
                            <input
                              type="number"
                              step="0.01"
                              value={item.purchase_cost}
                              onChange={(e) => {
                                const updated = [...recItems];
                                updated[idx].purchase_cost = parseFloat(e.target.value || 0);
                                setRecItems(updated);
                              }}
                              className="w-20 rounded border border-surface-dim bg-white px-1.5 py-1 text-xs text-right text-text-primary outline-none"
                            />
                          </td>
                          <td className="px-3 py-2 text-right">
                            <input
                              type="number"
                              step="0.01"
                              placeholder="Optional"
                              value={item.new_selling_price || ''}
                              onChange={(e) => {
                                const updated = [...recItems];
                                updated[idx].new_selling_price = e.target.value;
                                setRecItems(updated);
                              }}
                              className="w-24 rounded border border-surface-dim bg-white px-1.5 py-1 text-xs text-right text-text-primary outline-none"
                            />
                          </td>
                          <td className={`px-3 py-2 text-right font-semibold ${itemProfit >= 0 ? 'text-green-600' : 'text-error'}`}>
                            {formatCurrency(itemProfit)}
                          </td>
                          <td className="px-3 py-2 text-right font-semibold text-text-primary">
                            {formatCurrency(item.quantity * item.purchase_cost)}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveRecLineItem(idx)}
                              className="text-error hover:underline text-xs"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="bg-surface-low/30 border-b border-surface-low">
                      <td className="px-3 py-2">
                        <div className="flex items-center space-x-2">
                          <div className="relative flex-1" ref={recDropdownRef}>
                            <input
                              type="text"
                              placeholder="Search supplier product..."
                              value={recProductSearch}
                              onChange={(e) => {
                                setRecProductSearch(e.target.value);
                                setRecShowDropdown(true);
                              }}
                              onFocus={() => setRecShowDropdown(true)}
                              className="w-full rounded border border-surface-dim bg-white px-3 py-2.5 md:py-1 text-sm md:text-xs text-text-primary outline-none focus:border-brand-blue search-input-mobile"
                            />
                            {recShowDropdown && (recProductSearch.trim() !== '' || recSearching) && (
                              <div className="absolute left-0 right-0 z-30 mt-1 max-h-48 overflow-y-auto rounded-md bg-white border border-surface-low shadow-lg">
                                {recSearching ? (
                                  <div className="px-3 py-1.5 text-xs text-text-secondary animate-pulse">Searching...</div>
                                ) : recSearchedProducts.length === 0 ? (
                                  <div className="px-3 py-1.5 text-xs text-text-secondary">No mapped product found</div>
                                ) : (
                                  recSearchedProducts.map((p) => {
                                    const isAdded = recItems.some(i => i.product === p.id);
                                    return (
                                      <button
                                        key={p.id}
                                        type="button"
                                        disabled={isAdded}
                                        onClick={() => {
                                          setRecSelectedProductObj(p);
                                          setRecProductSearch(`${p.name} (${p.barcode})`);
                                          setRecShowDropdown(false);
                                          setRecNewSellingPrice(p.selling_price.toString());
                                          api.supplierProducts.list({ product_id: p.id, supplier_id: receivingPO.supplier })
                                            .then((res) => {
                                              const list = (res && res.results) || (Array.isArray(res) && res) || [];
                                              if (list.length > 0) {
                                                setRecCost(list[0].current_cost.toString());
                                              }
                                            });
                                        }}
                                        className={`w-full text-left px-3 py-1.5 border-b border-surface-lowest last:border-0 font-medium flex items-center justify-between ${isAdded
                                          ? 'bg-green-50 text-text-secondary cursor-not-allowed opacity-70'
                                          : 'hover:bg-surface-low text-text-primary'
                                          }`}
                                      >
                                        <div>
                                          <span className="font-semibold text-xs">{p.name}</span> <span className="text-[10px] text-text-secondary">({p.barcode})</span>
                                          {p.suitable_models_details && p.suitable_models_details.length > 0 && (
                                            <div className="flex flex-wrap gap-0.5 mt-0.5">
                                              {p.suitable_models_details.map((m) => (
                                                <span key={m.id} className="inline-block px-1 py-0.5 rounded bg-brand-blue/10 text-brand-blue text-[8px] font-semibold">
                                                  {m.brand_name} {m.model_name}
                                                </span>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                        {isAdded && (
                                          <span className="ml-2 flex-shrink-0 text-[9px] font-bold text-green-700 bg-green-100 border border-green-300 rounded px-1.5 py-0.5">✓ Added</span>
                                        )}
                                      </button>
                                    );
                                  })
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          placeholder="Qty"
                          value={recQty}
                          onChange={(e) => setRecQty(e.target.value)}
                          className="w-16 rounded border border-surface-dim bg-white px-1.5 py-1 text-xs text-right text-text-primary outline-none focus:border-brand-blue"
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Cost"
                          value={recCost}
                          onChange={(e) => setRecCost(e.target.value)}
                          className="w-20 rounded border border-surface-dim bg-white px-1.5 py-1 text-xs text-right text-text-primary outline-none focus:border-brand-blue"
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Selling Price"
                          value={recNewSellingPrice}
                          onChange={(e) => setRecNewSellingPrice(e.target.value)}
                          className="w-24 rounded border border-surface-dim bg-white px-1.5 py-1 text-xs text-right text-text-primary outline-none focus:border-brand-blue"
                        />
                      </td>
                      {(() => {
                        const qty = parseFloat(recQty || 0);
                        const cost = parseFloat(recCost || 0);
                        const newSelling = recNewSellingPrice !== '' ? parseFloat(recNewSellingPrice) : parseFloat(recSelectedProductObj?.selling_price || 0);
                        const addProfit = qty * (newSelling - cost);
                        return (
                          <td className={`px-3 py-2 text-right font-semibold ${addProfit >= 0 ? 'text-green-600' : 'text-error'}`}>
                            {formatCurrency(addProfit)}
                          </td>
                        );
                      })()}
                      <td className="px-3 py-2 text-right font-semibold text-text-secondary">
                        {formatCurrency(parseFloat(recQty || 0) * parseFloat(recCost || 0))}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          type="button"
                          onClick={handleAddRecLineItem}
                          className="rounded bg-brand-blue px-3 py-1 text-xs font-semibold text-white hover:bg-brand-cobalt transition"
                        >
                          Add
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Mobile Card list for Receive Items */}
              <div className="block md:hidden space-y-4">
                {recItems.map((item, idx) => {
                  const sell = item.new_selling_price !== null && item.new_selling_price !== undefined && item.new_selling_price !== '' ? parseFloat(item.new_selling_price) : parseFloat(item.selling_price || 0);
                  const itemProfit = item.quantity * (sell - item.purchase_cost);
                  return (
                    <div key={idx} className="border border-surface-low rounded-lg p-4 bg-gray-100 space-y-3 shadow-sm">
                      <div className="flex justify-between items-start border-b border-surface-low pb-2">
                        <div>
                          <div className="font-semibold text-sm text-text-primary">{item.name}</div>
                          <div className="text-[10px] text-text-secondary font-mono">{item.barcode}</div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-bold text-text-secondary uppercase block">Subtotal</span>
                          <span className="font-semibold text-sm text-brand-blue">{formatCurrency(item.quantity * item.purchase_cost)}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-text-secondary block font-semibold mb-0.5">Profit</span>
                          <span className={`font-bold ${itemProfit >= 0 ? 'text-green-600' : 'text-error'}`}>
                            {formatCurrency(itemProfit)}
                          </span>
                        </div>
                        <div className="text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveRecLineItem(idx)}
                            className="text-error hover:underline text-xs"
                          >
                            <TrashIcon height={15} width={15} />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 pt-2 border-t border-surface-lowest">
                        <div>
                          <label className="block text-[11px] font-semibold text-text-secondary mb-1">Qty</label>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => {
                              const updated = [...recItems];
                              updated[idx].quantity = parseInt(e.target.value || 0);
                              setRecItems(updated);
                            }}
                            className="w-full rounded border border-surface-dim bg-white px-2 py-1 text-xs text-right text-text-primary outline-none focus:border-brand-blue"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-text-secondary mb-1">Cost (₹)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={item.purchase_cost}
                            onChange={(e) => {
                              const updated = [...recItems];
                              updated[idx].purchase_cost = parseFloat(e.target.value || 0);
                              setRecItems(updated);
                            }}
                            className="w-full rounded border border-surface-dim bg-white px-2 py-1 text-xs text-right text-text-primary outline-none focus:border-brand-blue"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-text-secondary mb-1">New Retail (₹)</label>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Optional"
                            value={item.new_selling_price || ''}
                            onChange={(e) => {
                              const updated = [...recItems];
                              updated[idx].new_selling_price = e.target.value;
                              setRecItems(updated);
                            }}
                            className="w-full rounded border border-surface-dim bg-white px-2 py-1 text-xs text-right text-text-primary outline-none focus:border-brand-blue"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Inline Add Row for mobile */}
                {!recSelectedProductObj ? (
                  <button
                    type="button"
                    onClick={handleOpenRecViewAllPopup}
                    className="w-full rounded-lg border border-dashed border-brand-blue/40 bg-brand-blue/5 hover:bg-brand-blue/10 text-brand-blue py-4 text-sm font-semibold flex items-center justify-center gap-2 transition"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Product to Receive
                  </button>
                ) : (
                  <div className="border border-surface-low rounded-lg p-4 bg-surface-lowest space-y-3 animate-in fade-in duration-200">
                    <div className="flex justify-between items-center pb-1 border-b border-surface-low/60">
                      <div>
                        <span className="text-xs font-bold text-brand-blue">Selected Product</span>
                        <div className="text-xs text-text-primary font-semibold">
                          {recSelectedProductObj.name} <span className="text-text-secondary font-normal">({recSelectedProductObj.barcode})</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setRecSelectedProductObj(null);
                          setRecProductSearch('');
                          setRecQty('1');
                          setRecCost('0');
                          setRecNewSellingPrice('');
                        }}
                        className="text-text-secondary hover:text-text-primary text-[10px] font-semibold border border-surface-dim hover:bg-surface-low rounded px-2 py-0.5 transition-colors"
                      >
                        Change
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-text-secondary mb-1">Qty</label>
                          <input
                            type="number"
                            placeholder="Qty"
                            value={recQty}
                            onChange={(e) => setRecQty(e.target.value)}
                            className="w-full rounded border border-surface-dim bg-white px-3 py-3 md:py-1 text-sm md:text-xs text-right text-text-primary outline-none focus:border-brand-blue"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-text-secondary mb-1">Cost (₹)</label>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Cost"
                            value={recCost}
                            onChange={(e) => setRecCost(e.target.value)}
                            className="w-full rounded border border-surface-dim bg-white px-3 py-3 md:py-1 text-sm md:text-xs text-right text-text-primary outline-none focus:border-brand-blue"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-text-secondary mb-1">Retail (₹)</label>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Selling"
                            value={recNewSellingPrice}
                            onChange={(e) => setRecNewSellingPrice(e.target.value)}
                            className="w-full rounded border border-surface-dim bg-white px-3 py-3 md:py-1 text-sm md:text-xs text-right text-text-primary outline-none focus:border-brand-blue"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleAddRecLineItem}
                        className="w-full rounded bg-brand-blue py-2.5 text-xs font-semibold text-white hover:bg-brand-cobalt transition"
                      >
                        Add to Receive List
                      </button>
                    </div>
                  </div>
                )}
              </div>


              {/* Settlement adjustments */}
              <div className="border border-surface-low p-4 bg-surface-lowest space-y-3 rounded-lg">
                <span className="text-xs font-bold text-text-primary block">Costs & Settlement Adjustments</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">Additional Expense</label>
                    <input
                      type="number"
                      step="0.01"
                      value={recAdditionalCosts}
                      onChange={(e) => setRecAdditionalCosts(e.target.value)}
                      className="w-full rounded border border-surface-dim bg-white px-3 py-1.5 text-xs text-text-primary outline-none focus:border-brand-blue"
                    />
                    {recPaymentType === 'Credit' && parseFloat(recAdditionalCosts || 0) > 0 && (
                      <div className="mt-2">
                        <label className="block text-xs font-semibold text-amber-700 mb-1">Expense Account (for additional cost)</label>
                        <select
                          value={recPaidFrom}
                          onChange={(e) => setRecPaidFrom(e.target.value)}
                          className="w-full rounded border border-amber-400 bg-amber-50 px-3 py-1.5 text-xs text-text-primary outline-none focus:border-amber-500"
                        >
                          <option value="">-- Select account --</option>
                          {bankAccounts.map((b) => (
                            <option key={b.id} value={b.id}>{b.name} (₹{b.balance})</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">Rounding / Discount (INR)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="e.g. 20 for discount"
                      value={recRounding}
                      onChange={(e) => setRecRounding(e.target.value)}
                      className="w-full rounded border border-surface-dim bg-white px-3 py-1.5 text-xs text-text-primary outline-none focus:border-brand-blue"
                    />
                  </div>
                </div>

                {(() => {
                  const selectedSupplierObj = suppliers.find(s => s.id === receivingPO.supplier);
                  const oldCreditVal = selectedSupplierObj && parseFloat(selectedSupplierObj.outstanding_balance) > 0
                    ? parseFloat(selectedSupplierObj.outstanding_balance)
                    : 0;
                  const negativeCreditVal = selectedSupplierObj && parseFloat(selectedSupplierObj.outstanding_balance) < 0
                    ? Math.abs(parseFloat(selectedSupplierObj.outstanding_balance))
                    : 0;

                  return (
                    <div className="space-y-2 pt-1 border-t border-dashed border-surface-low mt-2">
                      {recPaymentType !== 'Credit' && oldCreditVal > 0 && (
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="recPayOldCredit"
                            checked={recPayOldCredit}
                            onChange={(e) => setRecPayOldCredit(e.target.checked)}
                            className="rounded border-surface-dim text-brand-blue focus:ring-brand-blue h-4 w-4"
                          />
                          <label htmlFor="recPayOldCredit" className="text-xs font-semibold text-text-primary cursor-pointer select-none">
                            Pay Old Credit to Supplier ({formatCurrency(oldCreditVal)})
                          </label>
                        </div>
                      )}
                      {recPaymentType !== 'Credit' && negativeCreditVal > 0 && (
                        <div className="space-y-1.5">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="recDeductSupplierCredit"
                              checked={recDeductSupplierCredit}
                              onChange={(e) => {
                                setRecDeductSupplierCredit(e.target.checked);
                                if (e.target.checked) {
                                  const itemsTotal = recItems.reduce((acc, curr) => acc + (curr.quantity * curr.purchase_cost), 0);
                                  setRecDeductAmount(Math.min(negativeCreditVal, itemsTotal).toString());
                                } else {
                                  setRecDeductAmount('0');
                                }
                              }}
                              className="rounded border-surface-dim text-brand-blue focus:ring-brand-blue h-4 w-4"
                            />
                            <label htmlFor="recDeductSupplierCredit" className="text-xs font-semibold text-text-primary cursor-pointer select-none">
                              Deduct Old Supplier Credit
                            </label>
                          </div>
                          {recDeductSupplierCredit && (
                            <div className="pl-6">
                              <label className="block text-[10px] font-semibold text-text-secondary mb-0.5">Deduct Amount (Max: {formatCurrency(negativeCreditVal)})</label>
                              <input
                                type="number"
                                step="0.01"
                                max={negativeCreditVal}
                                value={recDeductAmount}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value || 0);
                                  if (val > negativeCreditVal) {
                                    setRecDeductAmount(negativeCreditVal.toString());
                                  } else {
                                    setRecDeductAmount(e.target.value);
                                  }
                                }}
                                className="w-full max-w-[150px] rounded border border-surface-dim bg-white px-2 py-1 text-xs outline-none text-text-primary"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Final Calculations Display */}
                <div className="border-t border-surface-low pt-3 space-y-1 text-xs font-semibold">
                  <div className="flex justify-between text-text-secondary text-[11px]">
                    <span>Items Subtotal:</span>
                    <span>{formatCurrency(recItems.reduce((acc, curr) => acc + (curr.quantity * curr.purchase_cost), 0))}</span>
                  </div>
                  <div className="flex justify-between text-text-secondary text-[11px]">
                    <span>Landed Cost:</span>
                    <span>{formatCurrency(parseFloat(recAdditionalCosts || 0))}</span>
                  </div>
                  {(() => {
                    const expectedProfit = recItems.reduce((acc, item) => {
                      const sell = item.new_selling_price !== null && item.new_selling_price !== undefined && item.new_selling_price !== '' ? parseFloat(item.new_selling_price) : parseFloat(item.selling_price || 0);
                      return acc + (item.quantity * (sell - item.purchase_cost));
                    }, 0) - parseFloat(recAdditionalCosts || 0) + parseFloat(recRounding || 0);
                    return (
                      <div className={`flex justify-between px-2 py-1.5 rounded-md text-[11px] font-bold border ${expectedProfit >= 0 ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-red-700 bg-red-50 border-red-200'}`}>
                        <span>Expected Total Profit (Include Expenses):</span>
                        <span>{formatCurrency(expectedProfit)}</span>
                      </div>
                    );
                  })()}
                  {parseFloat(recRounding || 0) !== 0 && (
                    <div className="flex justify-between text-text-secondary text-[11px]">
                      <span>Rounding adjustment (Discount):</span>
                      <span className={parseFloat(recRounding || 0) > 0 ? "text-green-600" : "text-text-primary"}>
                        {formatCurrency(parseFloat(recRounding || 0))}
                      </span>
                    </div>
                  )}
                  {recPaymentType !== 'Credit' && recPayOldCredit && getPaidOldCreditVal() > 0 && (
                    <div className="flex justify-between text-text-secondary text-[11px]">
                      <span>Old Credit Paid:</span>
                      <span>{formatCurrency(getPaidOldCreditVal())}</span>
                    </div>
                  )}
                  {(() => {
                    const baseAmt = recItems.reduce((acc, curr) => acc + (curr.quantity * curr.purchase_cost), 0) - (recDeductSupplierCredit ? parseFloat(recDeductAmount || 0) : 0) - parseFloat(recRounding || 0);
                    const finalPayAmt = baseAmt + getPaidOldCreditVal();

                    return finalPayAmt < 0 ? (
                      <div className="flex justify-between text-emerald-600 text-[11px] font-bold">
                        <span>Supplier will pay to you:</span>
                        <span>{formatCurrency(Math.abs(finalPayAmt))}</span>
                      </div>
                    ) : (
                      <div className="flex justify-between text-text-secondary text-[11px]">
                        <span>Amount to Pay Supplier:</span>
                        <span>{formatCurrency(finalPayAmt)}</span>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            <div className={`p-4 border-t border-surface-low bg-surface-lowest flex ${receivingPO.id === 'Direct' ? 'justify-end' : 'justify-between'} items-center`}>
              {receivingPO.id !== 'Direct' && (
                <button
                  type="button"
                  disabled={isCancellingPO || isReceivingPO}
                  onClick={() => handleCancelPO(receivingPO.id)}
                  className="rounded bg-error text-white px-4 py-2 text-xs font-bold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center space-x-1"
                >
                  {isCancellingPO && <Spinner size="xs" />}
                  <span>Cancel Order</span>
                </button>
              )}

              <div className="flex space-x-2">
                <button
                  type="button"
                  disabled={isReceivingPO || isCancellingPO}
                  onClick={() => {
                    setShowReceiveModal(false);
                    setReceivingPO(null);
                    if (poMode === 'direct') {
                      setPoMode(null);
                    }
                  }}
                  className="rounded border border-surface-dim px-4 py-2 text-xs text-text-secondary hover:bg-surface-low transition-colors"
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={isReceivingPO || isCancellingPO}
                  onClick={handleReceiveSubmit}
                  className="rounded bg-green-600 px-4 py-2 text-xs font-bold text-white hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center space-x-1"
                >
                  {isReceivingPO && <Spinner size="xs" />}
                  <span>{receivingPO.id === 'Direct' ? 'Submit Purchase' : 'Receive PO'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRecViewAllPopup && receivingPO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-6">
          <div className="w-full max-w-4xl rounded-lg bg-white shadow-xl flex flex-col h-[85vh] relative overflow-hidden border border-surface-low animate-in fade-in duration-200">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-surface-low bg-surface-lowest">
              <h3 className="text-sm font-bold text-text-primary">
                Select Mapped Product for {receivingPO.supplier_name}
              </h3>
              <button
                type="button"
                onClick={() => setShowRecViewAllPopup(false)}
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
                  value={recPopupSearchQuery}
                  onChange={(e) => setRecPopupSearchQuery(e.target.value)}
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
                {recPopupCategories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setRecActivePopupCategory(cat.id)}
                    className={`pb-1 text-xs font-semibold px-2 transition-all border-b-2 ${recActivePopupCategory.toString() === cat.id.toString()
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
              {recPopupLoading ? (
                <div className="text-center py-12 text-sm text-brand-blue animate-pulse">Loading products...</div>
              ) : filteredRecProductsList.length === 0 ? (
                <div className="text-center py-12 text-xs text-text-secondary">No products found in this category.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {filteredRecProductsList.map((sp) => {
                    const firstImage = sp.product_image ? sp.product_image.split(',')[0] : '';
                    const isAlreadyAdded = recItems.some(ri => ri.product === sp.product);

                    return (
                      <button
                        key={sp.id}
                        type="button"
                        onClick={() => handleSelectRecSupplierProductPopup(sp)}
                        className={`text-left p-2.5 rounded-lg border ${isAlreadyAdded
                          ? 'border-green-500 bg-green-50/15 hover:bg-green-50/25'
                          : 'border-surface-dim hover:border-brand-blue bg-white hover:bg-surface-light'
                          } shadow-sm transition flex items-center w-full relative`}
                      >
                        <div className="h-12 w-12 rounded bg-surface border border-surface-low overflow-hidden flex-shrink-0 mr-3">
                          {firstImage ? (
                            <img src={firstImage} alt={sp.product_name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-[10px] text-text-secondary">No img</div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1 pr-8">
                          <span className="font-semibold text-xs text-text-primary line-clamp-1 block">
                            {sp.product_name}
                          </span>
                          {sp.suitable_models_details && sp.suitable_models_details.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1 font-normal">
                              {sp.suitable_models_details.map((m) => (
                                <span key={m.id} className="inline-block px-1.5 py-0.5 rounded bg-brand-blue/10 text-brand-blue text-[9px] font-semibold border border-brand-blue/15">
                                  {m.brand_name} {m.model_name}
                                </span>
                              ))}
                            </div>
                          )}
                          <span className="text-[10px] text-text-secondary font-mono block">{sp.barcode}</span>
                          <span className="text-brand-blue font-bold text-xs pt-0.5 block">₹{sp.current_cost}</span>
                        </div>
                        {isAlreadyAdded && (
                          <div className="absolute top-2 right-2">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-green-100 text-green-800 border border-green-200">
                              ✓ Added
                            </span>
                          </div>
                        )}
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
                onClick={() => setShowRecViewAllPopup(false)}
                className="rounded border border-surface-dim px-3 py-1.5 text-xs text-text-secondary hover:bg-surface-low transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showReturnModal && returningPO && (
        <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center bg-black/45 px-4 py-6 overflow-y-auto">
          <div className="w-full max-w-4xl rounded-lg bg-white shadow-xl flex flex-col max-h-[90vh] relative border border-surface-low animate-in fade-in duration-200">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-surface-low bg-surface-lowest">
              <div>
                <h3 className="text-sm font-bold text-text-primary">
                  Return Purchase Order Items (PO-{returningPO.id})
                </h3>
                <p className="text-[11px] text-text-secondary">Supplier: <span className="font-semibold text-text-primary">{returningPO.supplier_name}</span></p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowReturnModal(false);
                  setReturningPO(null);
                }}
                className="text-text-secondary hover:text-text-primary text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Financial Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Credit Refund to Account</label>
                  <select
                    value={returnCreditAccount}
                    onChange={(e) => setReturnCreditAccount(e.target.value)}
                    className="w-full rounded border border-surface-dim bg-white px-3 py-1.5 text-xs text-text-primary outline-none focus:border-brand-blue"
                  >
                    <option value="">-- Select Account --</option>
                    {bankAccounts.map((b) => (
                      <option key={b.id} value={b.id}>{b.name} (₹{b.balance})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Adjustment / Rounding (Deducted from Refund)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={returnAdjustment}
                    onChange={(e) => setReturnAdjustment(e.target.value)}
                    className="w-full rounded border border-surface-dim bg-white px-3 py-1.5 text-xs text-text-primary outline-none focus:border-brand-blue"
                  />
                </div>
              </div>

              {/* Items List Table (Desktop) */}
              <div className="border border-surface-low rounded-lg hidden md:block">
                <table className="min-w-full text-left text-xs bg-white">
                  <thead className="bg-surface-low text-text-secondary font-semibold uppercase">
                    <tr>
                      <th className="px-3 py-2">Product</th>
                      <th className="px-3 py-2 text-right w-24">Purchased Qty</th>
                      <th className="px-3 py-2 text-right w-24">Stock Qty</th>
                      <th className="px-3 py-2 text-right w-28">Unit Cost (₹)</th>
                      <th className="px-3 py-2 text-right w-28">Qty to Return</th>
                      <th className="px-3 py-2 text-right">Refund Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-low">
                    {returnItems.map((item, idx) => {
                      const isExpanded = !!expandedReturnRows[item.product];
                      return (
                        <React.Fragment key={item.product}>
                          <tr className="hover:bg-surface-bright">
                            <td className="px-3 py-2 font-medium text-text-primary">
                              <div>{item.name}</div>
                              <div className="text-[10px] text-text-secondary font-mono mb-1">{item.barcode}</div>
                              {item.returned_qty_done > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setExpandedReturnRows(prev => ({ ...prev, [item.product]: !prev[item.product] }))}
                                  className="text-[10px] text-brand-blue hover:underline font-semibold flex items-center space-x-1"
                                >
                                  <span>{isExpanded ? 'Hide' : 'Show'} Previous Returns ({item.returned_qty_done})</span>
                                  <span>{isExpanded ? '▲' : '▼'}</span>
                                </button>
                              )}
                            </td>
                            <td className="px-3 py-2 text-right text-text-primary">{item.purchased_qty}</td>
                            <td className="px-3 py-2 text-right text-text-secondary">
                              <span className={`inline-block rounded px-1.5 py-0.5 font-semibold ${item.stock_qty < item.qty_to_return ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                {item.stock_qty}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-right">
                              <input
                                type="number"
                                step="0.01"
                                value={item.purchase_cost}
                                onChange={(e) => {
                                  const updated = [...returnItems];
                                  updated[idx].purchase_cost = parseFloat(e.target.value || 0);
                                  setReturnItems(updated);
                                }}
                                className="w-20 rounded border border-surface-dim bg-white px-1.5 py-1 text-xs text-right text-text-primary outline-none"
                              />
                            </td>
                            <td className="px-3 py-2 text-right">
                              <input
                                type="number"
                                max={item.remaining_qty}
                                min="0"
                                value={item.qty_to_return}
                                onChange={(e) => {
                                  const updated = [...returnItems];
                                  updated[idx].qty_to_return = Math.max(0, parseInt(e.target.value || 0));
                                  setReturnItems(updated);
                                }}
                                className="w-16 rounded border border-surface-dim bg-white px-1.5 py-1 text-xs text-right text-text-primary outline-none"
                              />
                            </td>
                            <td className="px-3 py-2 text-right font-semibold text-text-primary">
                              {formatCurrency(item.qty_to_return * item.purchase_cost)}
                            </td>
                          </tr>
                          {isExpanded && item.returned_qty_done > 0 && (
                            <tr className="bg-surface-lowest">
                              <td colSpan="6" className="px-6 py-2 border-t border-surface-low text-xs text-text-secondary">
                                <div className="flex space-x-8">
                                  <div><span className="font-semibold">Previously Returned Qty:</span> {item.returned_qty_done}</div>
                                  <div><span className="font-semibold">Previously Returned Value:</span> {formatCurrency(item.returned_qty_done * item.purchase_cost)}</div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Items List (Mobile) */}
              <div className="block md:hidden space-y-4">
                {returnItems.map((item, idx) => {
                  const isExpanded = !!expandedReturnRows[item.product];
                  return (
                    <div key={item.product} className="border border-surface-low rounded-lg p-4 bg-gray-100 space-y-3 shadow-sm">
                      <div className="flex justify-between items-start border-b border-surface-low pb-2">
                        <div>
                          <div className="font-semibold text-sm text-text-primary">{item.name}</div>
                          <div className="text-[10px] text-text-secondary font-mono">{item.barcode}</div>
                          {item.returned_qty_done > 0 && (
                            <button
                              type="button"
                              onClick={() => setExpandedReturnRows(prev => ({ ...prev, [item.product]: !prev[item.product] }))}
                              className="text-[10px] text-brand-blue hover:underline font-semibold mt-1.5 flex items-center space-x-1"
                            >
                              <span>{isExpanded ? 'Hide' : 'Show'} Previous Returns ({item.returned_qty_done})</span>
                              <span>{isExpanded ? '▲' : '▼'}</span>
                            </button>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-bold text-text-secondary uppercase block">Subtotal</span>
                          <span className="font-semibold text-sm text-brand-blue">{formatCurrency(item.qty_to_return * item.purchase_cost)}</span>
                        </div>
                      </div>

                      {isExpanded && item.returned_qty_done > 0 && (
                        <div className="bg-surface-lowest p-2.5 rounded text-xs text-text-secondary space-y-1 border border-surface-low">
                          <div><span className="font-semibold">Previously Returned Qty:</span> {item.returned_qty_done}</div>
                          <div><span className="font-semibold">Previously Returned Value:</span> {formatCurrency(item.returned_qty_done * item.purchase_cost)}</div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2 text-xs text-text-secondary">
                        <div>
                          <span className="block font-semibold">Purchased Qty</span>
                          <span className="text-text-primary">{item.purchased_qty}</span>
                        </div>
                        <div>
                          <span className="block font-semibold">Stock Qty</span>
                          <span className={`inline-block rounded px-1.5 py-0.2 font-semibold ${item.stock_qty < item.qty_to_return ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                            {item.stock_qty}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-surface-lowest">
                        <div>
                          <label className="block text-[11px] font-semibold text-text-secondary mb-1">Unit Cost (₹)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={item.purchase_cost}
                            onChange={(e) => {
                              const updated = [...returnItems];
                              updated[idx].purchase_cost = parseFloat(e.target.value || 0);
                              setReturnItems(updated);
                            }}
                            className="w-full rounded border border-surface-dim bg-white px-2 py-1 text-xs text-right text-text-primary outline-none focus:border-brand-blue"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-text-secondary mb-1">Qty to Return</label>
                          <input
                            type="number"
                            max={item.remaining_qty}
                            min="0"
                            value={item.qty_to_return}
                            onChange={(e) => {
                              const updated = [...returnItems];
                              updated[idx].qty_to_return = Math.max(0, parseInt(e.target.value || 0));
                              setReturnItems(updated);
                            }}
                            className="w-full rounded border border-surface-dim bg-white px-2 py-1 text-xs text-right text-text-primary outline-none focus:border-brand-blue"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Total Summary Display */}
              <div className="border-t border-surface-low pt-4 space-y-1.5 text-xs font-semibold text-right">
                <div className="flex justify-between max-w-xs ml-auto text-text-secondary">
                  <span>Gross Refund Total:</span>
                  <span>{formatCurrency(returnItems.reduce((acc, curr) => acc + (curr.qty_to_return * curr.purchase_cost), 0))}</span>
                </div>
                {parseFloat(returnAdjustment || 0) !== 0 && (
                  <div className="flex justify-between max-w-xs ml-auto text-text-secondary">
                    <span>Adjustment/Rounding Deducted:</span>
                    <span>-{formatCurrency(parseFloat(returnAdjustment || 0))}</span>
                  </div>
                )}
                <div className="flex justify-between max-w-xs ml-auto text-brand-blue text-sm border-t border-dashed border-surface-low pt-1.5 font-bold">
                  <span>Net Refund Credit:</span>
                  <span>{formatCurrency(calculateReturnTotalRefund())}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-surface-low bg-surface-lowest flex justify-end space-x-2">
              <button
                type="button"
                disabled={isReturningPO}
                onClick={() => {
                  setShowReturnModal(false);
                  setReturningPO(null);
                }}
                className="rounded border border-surface-dim px-4 py-2 text-xs text-text-secondary hover:bg-surface-low transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isReturningPO}
                onClick={handleReturnSubmit}
                className="rounded bg-error px-4 py-2 text-xs font-bold text-white hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center space-x-1"
              >
                {isReturningPO && <Spinner size="xs" />}
                <span>Submit Return</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Selected Purchase Order Details Modal (Desktop only) */}
      {!isMobile && showDetailsModal && detailsPO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-6 overflow-y-auto">
          <div className="w-full max-w-4xl rounded-lg bg-white shadow-xl flex flex-col max-h-[90vh] relative border border-surface-low animate-in fade-in duration-200">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-surface-low bg-surface-lowest">
              <div>
                <h3 className="text-sm font-bold text-text-primary flex items-center space-x-2">
                  <span>Purchase Order Details (PO-{detailsPO.id})</span>
                  <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-semibold ${detailsPO.status === 'Returned' ? 'bg-red-100 text-red-800' :
                    detailsPO.status === 'Partially Returned' ? 'bg-orange-100 text-orange-800' :
                      detailsPO.status === 'Received' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                    {detailsPO.status || (detailsPO.is_received ? 'Received' : 'Pending')}
                  </span>
                </h3>
                <p className="text-[11px] text-text-secondary">Created: {new Date(detailsPO.timestamp).toLocaleString()}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowDetailsModal(false);
                  setDetailsPO(null);
                }}
                className="text-text-secondary hover:text-text-primary text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* PO Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-lg bg-surface-lowest border border-surface-low text-xs">
                <div>
                  <span className="block font-semibold text-text-secondary">Supplier</span>
                  <span className="text-text-primary font-bold">{detailsPO.supplier_name}</span>
                </div>
                <div>
                  <span className="block font-semibold text-text-secondary">Ref Invoice #</span>
                  <span className="text-text-primary font-mono">{detailsPO.invoice_number || '-'}</span>
                </div>
                <div>
                  <span className="block font-semibold text-text-secondary">Payment Method</span>
                  <span className="text-text-primary font-medium">{detailsPO.payment_type}</span>
                </div>
                <div>
                  <span className="block font-semibold text-text-secondary">Total Amount</span>
                  <span className="text-brand-blue font-bold">{formatCurrency(detailsPO.total_amount)}</span>
                </div>
                <div>
                  <span className="block font-semibold text-text-secondary">Landed Cost</span>
                  <span className="text-text-primary">{formatCurrency(detailsPO.additional_costs)}</span>
                </div>
                <div>
                  <span className="block font-semibold text-text-secondary">Rounding / Discount</span>
                  <span className="text-text-primary">{formatCurrency(detailsPO.rounding || 0)}</span>
                </div>
                <div>
                  <span className="block font-semibold text-text-secondary">Deducted Credit</span>
                  <span className="text-text-primary">{formatCurrency(detailsPO.deducted_credit || 0)}</span>
                </div>
                <div>
                  <span className="block font-semibold text-text-secondary">Paid From Account</span>
                  <span className="text-text-primary">{detailsPO.paid_from_name || '-'}</span>
                </div>
              </div>

              {/* Items List Header */}
              <div>
                <h4 className="text-xs font-bold text-text-primary mb-2 uppercase tracking-wider">Line Items</h4>
                {/* Desktop items table */}
                <div className="border border-surface-low rounded-lg overflow-hidden">
                  <table className="min-w-full text-left text-xs bg-white">
                    <thead className="bg-surface-low text-text-secondary font-semibold uppercase">
                      <tr>
                        <th className="px-3 py-2">Product</th>
                        <th className="px-3 py-2 text-right">Quantity</th>
                        <th className="px-3 py-2 text-right">Returned Qty</th>
                        <th className="px-3 py-2 text-right">Unit Cost</th>
                        <th className="px-3 py-2 text-right">Selling Price</th>
                        <th className="px-3 py-2 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-low text-text-primary">
                      {(detailsPO.items || []).map((item, idx) => (
                        <tr key={idx} className="hover:bg-surface-bright">
                          <td className="px-3 py-2 font-medium">
                            <div>{item.product_name}</div>
                            {item.suitable_models_details && item.suitable_models_details.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1 font-normal">
                                {item.suitable_models_details.map((m) => (
                                  <span key={m.id} className="inline-block px-1.5 py-0.5 rounded bg-brand-blue/10 text-brand-blue text-[9px] font-semibold border border-brand-blue/15">
                                    {m.brand_name} {m.model_name}
                                  </span>
                                ))}
                              </div>
                            )}
                            <div className="text-[10px] text-text-secondary font-mono">{item.barcode}</div>
                          </td>
                          <td className="px-3 py-2 text-right">{item.quantity}</td>
                          <td className="px-3 py-2 text-right">
                            <span className={item.returned_qty > 0 ? "text-error font-semibold" : "text-text-secondary"}>
                              {item.returned_qty || 0}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right text-text-secondary">{formatCurrency(item.purchase_cost)}</td>
                          <td className="px-3 py-2 text-right text-text-secondary">
                            {item.new_selling_price ? formatCurrency(item.new_selling_price) : formatCurrency(item.selling_price || 0)}
                          </td>
                          <td className="px-3 py-2 text-right font-semibold">
                            {formatCurrency(item.quantity * item.purchase_cost)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Chronological Return Log History */}
              {detailsPO.returns && detailsPO.returns.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-error uppercase tracking-wider flex items-center space-x-2">
                    <svg className="h-4 w-4 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
                    </svg>
                    <span>Chronological Return Log History</span>
                  </h4>
                  <div className="relative border-l border-error/20 pl-4 ml-2 space-y-4">
                    {detailsPO.returns.map((ret) => (
                      <div key={ret.id} className="relative text-xs">
                        {/* Timeline dot */}
                        <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-error border border-white" />

                        <div className="bg-red-50/30 border border-error/15 rounded-lg p-3 space-y-2">
                          <div className="flex justify-between items-center border-b border-error/10 pb-1.5">
                            <div>
                              <span className="font-bold text-error">Return Log ID: #{ret.id}</span>
                              <span className="text-[10px] text-text-secondary block mt-0.5">{new Date(ret.timestamp).toLocaleString()}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] text-text-secondary block">Refund Value</span>
                              <span className="font-bold text-error">{formatCurrency(ret.refund_amount)}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-text-secondary text-[11px] mb-2">
                            <div><span className="font-semibold">Credited Account:</span> {ret.credit_account_name || 'N/A'}</div>
                            <div><span className="font-semibold">Return Adjustment Fee:</span> {formatCurrency(ret.adjustment)}</div>
                          </div>

                          {/* Returned Items details */}
                          <div className="bg-white rounded border border-error/10 p-2 space-y-1">
                            <span className="text-[10px] font-bold text-error block uppercase tracking-wider">Returned Items</span>
                            {(ret.items || []).map((ritem, rIdx) => (
                              <div key={rIdx} className="flex justify-between items-center text-[11px] border-b border-surface-lowest last:border-b-0 py-0.5">
                                <div>
                                  <span className="font-medium text-text-primary">{ritem.product_name}</span>
                                  {ritem.suitable_models_details && ritem.suitable_models_details.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1 font-normal">
                                      {ritem.suitable_models_details.map((m) => (
                                        <span key={m.id} className="inline-block px-1.5 py-0.5 rounded bg-brand-blue/10 text-brand-blue text-[9px] font-semibold border border-brand-blue/15">
                                          {m.brand_name} {m.model_name}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                  <span className="text-text-secondary text-[10px] ml-1.5 font-mono">({ritem.barcode})</span>
                                </div>
                                <span className="font-semibold text-text-primary">
                                  {ritem.quantity} unit(s) @ {formatCurrency(ritem.purchase_cost)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-surface-low bg-surface-lowest flex justify-end space-x-2">
              {!detailsPO.is_received && (
                <button
                  type="button"
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleOpenReceiveModal(detailsPO);
                  }}
                  className="rounded bg-green-50 text-green-700 border border-green-200 px-4 py-2 text-xs font-semibold hover:bg-green-100 transition cursor-pointer"
                >
                  Receive PO
                </button>
              )}
              {detailsPO.is_received && (
                <button
                  type="button"
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleOpenReturnModal(detailsPO);
                  }}
                  className="rounded bg-red-50 text-red-700 border border-red-200 px-4 py-2 text-xs font-semibold hover:bg-red-100 transition cursor-pointer"
                >
                  Return Purchase
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowShareModal(true)}
                className="rounded bg-brand-blue/5 text-brand-blue border border-brand-blue/20 px-4 py-2 text-xs font-semibold hover:bg-brand-blue/10 transition cursor-pointer"
              >
                Share PO
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDetailsModal(false);
                  setDetailsPO(null);
                }}
                className="rounded border border-surface-dim px-4 py-2 text-xs text-text-secondary hover:bg-surface-low transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Sheet for PO Details */}
      {isMobile && showDetailsModal && detailsPO && (
        <MobileBottomSheet
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setDetailsPO(null);
          }}
          title={`PO Details: PO-${detailsPO.id}`}
        >
          <div className="space-y-6 pb-6 text-left">
            {/* PO Info Grid */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-surface-lowest border border-surface-low text-xs">
              <div>
                <span className="block font-semibold text-text-secondary">Supplier</span>
                <span className="text-text-primary font-bold">{detailsPO.supplier_name}</span>
              </div>
              <div>
                <span className="block font-semibold text-text-secondary">Ref Invoice #</span>
                <span className="text-text-primary font-mono">{detailsPO.invoice_number || '-'}</span>
              </div>
              <div>
                <span className="block font-semibold text-text-secondary">Payment Method</span>
                <span className="text-text-primary font-medium">{detailsPO.payment_type}</span>
              </div>
              <div>
                <span className="block font-semibold text-text-secondary">Total Amount</span>
                <span className="text-brand-blue font-bold">{formatCurrency(detailsPO.total_amount)}</span>
              </div>
              <div>
                <span className="block font-semibold text-text-secondary">Landed Cost</span>
                <span className="text-text-primary">{formatCurrency(detailsPO.additional_costs)}</span>
              </div>
              <div>
                <span className="block font-semibold text-text-secondary">Rounding / Discount</span>
                <span className="text-text-primary">{formatCurrency(detailsPO.rounding || 0)}</span>
              </div>
              <div>
                <span className="block font-semibold text-text-secondary">Deducted Credit</span>
                <span className="text-text-primary">{formatCurrency(detailsPO.deducted_credit || 0)}</span>
              </div>
              <div>
                <span className="block font-semibold text-text-secondary">Paid From Account</span>
                <span className="text-text-primary">{detailsPO.paid_from_name || '-'}</span>
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">Line Items</h4>
              <div className="space-y-3">
                {(detailsPO.items || []).map((item, idx) => (
                  <div key={idx} className="border border-surface-low rounded-lg p-3 bg-white space-y-2 shadow-xs text-xs">
                    <div className="flex justify-between items-start border-b border-surface-lowest pb-1.5">
                      <div>
                        <div className="font-semibold text-text-primary">{item.product_name}</div>
                        {item.suitable_models_details && item.suitable_models_details.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1 font-normal">
                            {item.suitable_models_details.map((m) => (
                              <span key={m.id} className="inline-block px-1.5 py-0.5 rounded bg-brand-blue/10 text-brand-blue text-[9px] font-semibold border border-brand-blue/15">
                                {m.brand_name} {m.model_name}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="text-[10px] text-text-secondary font-mono">{item.barcode}</div>
                      </div>
                      <div className="text-right font-semibold text-brand-blue">
                        {formatCurrency(item.quantity * item.purchase_cost)}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-text-secondary">
                      <div>
                        <span className="block text-[10px] font-semibold">Purchased Qty</span>
                        <span className="text-text-primary font-medium">{item.quantity}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-semibold">Returned Qty</span>
                        <span className={item.returned_qty > 0 ? "text-error font-bold" : "text-text-primary"}>
                          {item.returned_qty || 0}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-semibold">Unit Cost</span>
                        <span className="text-text-primary">{formatCurrency(item.purchase_cost)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chronological Return Log History */}
            {detailsPO.returns && detailsPO.returns.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-error uppercase tracking-wider flex items-center space-x-2">
                  <svg className="h-4 w-4 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
                  </svg>
                  <span>Return Log History</span>
                </h4>
                <div className="relative border-l border-error/20 pl-4 ml-2 space-y-4">
                  {detailsPO.returns.map((ret) => (
                    <div key={ret.id} className="relative text-xs">
                      <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-error border border-white" />
                      <div className="bg-red-50/30 border border-error/15 rounded-lg p-3 space-y-2">
                        <div className="flex justify-between items-center border-b border-error/10 pb-1.5">
                          <div>
                            <span className="font-bold text-error">Return ID: #{ret.id}</span>
                            <span className="text-[10px] text-text-secondary block mt-0.5">{new Date(ret.timestamp).toLocaleString()}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-text-secondary block">Refund</span>
                            <span className="font-bold text-error">{formatCurrency(ret.refund_amount)}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-text-secondary text-[11px]">
                          <div><span className="font-semibold">Account:</span> {ret.credit_account_name || 'N/A'}</div>
                          <div><span className="font-semibold">Fee:</span> {formatCurrency(ret.adjustment)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="pt-2 flex flex-col gap-2">
              {!detailsPO.is_received && (
                <button
                  type="button"
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleOpenReceiveModal(detailsPO);
                  }}
                  className="w-full py-2.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 font-bold text-xs transition flex items-center justify-center"
                >
                  Receive PO
                </button>
              )}
              {detailsPO.is_received && (
                <button
                  type="button"
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleOpenReturnModal(detailsPO);
                  }}
                  className="w-full py-2.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs transition flex items-center justify-center"
                >
                  Return Purchase
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowShareModal(true)}
                className="w-full py-2.5 rounded-lg bg-brand-blue/5 border border-brand-blue/20 hover:bg-brand-blue/10 text-brand-blue font-semibold text-xs transition flex items-center justify-center"
              >
                Share PO
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDetailsModal(false);
                  setDetailsPO(null);
                }}
                className="w-full py-2.5 rounded-lg border border-surface-dim text-text-secondary font-medium text-xs hover:bg-surface-low transition"
              >
                Close
              </button>
            </div>
          </div>
        </MobileBottomSheet>
      )}

      {showShareModal && detailsPO && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-surface-low shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-surface-low bg-surface-lowest">
              <h3 className="text-sm font-bold text-text-primary flex items-center space-x-2">
                <span>Share PO (PO-{detailsPO.id})</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="text-text-secondary hover:text-text-primary text-sm font-bold p-1 transition"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 overflow-y-auto text-left">
              {/* Option checkboxes styled as capsules */}
              <div className="w-full">
                <button
                  type="button"
                  onClick={() => {
                    const val = !shareIncludeCost;
                    setShareIncludeCost(val);
                    localStorage.setItem('shareIncludeCost', JSON.stringify(val));
                  }}
                  className={`flex items-center justify-between w-full p-3 rounded-xl border text-xs font-semibold transition ${shareIncludeCost
                    ? 'bg-brand-blue/5 border-brand-blue text-brand-blue'
                    : 'bg-white border-surface-dim text-text-secondary hover:bg-surface-lowest'
                    }`}
                >
                  <span>Include Unit Cost</span>
                  <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${shareIncludeCost ? 'border-brand-blue bg-brand-blue' : 'border-surface-dim'}`}>
                    {shareIncludeCost && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </div>
                </button>
              </div>

              {/* Preview Box styled as WhatsApp chat bubble */}
              <div className="space-y-1">
                <span className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider">Live WhatsApp Preview</span>
                <div className="w-full rounded-xl bg-[#e5ddd5] p-3 border border-[#d3c9be] max-h-48 overflow-y-auto shadow-inner relative flex flex-col scrollbar-thin">
                  <div className="self-end bg-[#dcf8c6] text-[#303030] rounded-xl p-2.5 shadow-sm max-w-[85%] text-xs font-sans whitespace-pre-wrap leading-relaxed relative">
                    {(() => {
                      const dateStr = new Date(detailsPO.timestamp).toLocaleDateString();
                      let text = `*PURCHASE ORDER*\n`;
                      text += `*PO ID:* PO-${detailsPO.id}\n`;
                      text += `*Supplier:* ${detailsPO.supplier_name}\n`;
                      if (supplierDetail?.contact_number || supplierDetail?.whatsapp_number) {
                        text += `*Contact:* ${supplierDetail.whatsapp_number || supplierDetail.contact_number}\n`;
                      }
                      text += `*Date:* ${dateStr}\n`;
                      if (detailsPO.invoice_number) {
                        text += `*Ref Invoice:* ${detailsPO.invoice_number}\n`;
                      }
                      if (shareBusinessInfo) {
                        text += `\n*Business Info:*\n${shareBusinessInfo}\n`;
                      }
                      text += `\n*Items:*\n`;
                      (detailsPO.items || []).forEach((item) => {
                        let line = `- ${item.product_name} x ${item.quantity}`;
                        if (shareIncludeCost) {
                          line += ` (Cost: ₹${item.purchase_cost})`;
                        }
                        text += line + `\n`;
                      });
                      if (shareIncludeCost) {
                        text += `\n*Total Amount:* ₹${detailsPO.total_amount}`;
                      }
                      return text;
                    })()}
                    <div className="text-[8px] text-gray-500 text-right mt-1 font-mono">
                      {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ✓✓
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-surface-low bg-surface-lowest flex space-x-2">
              {/* WhatsApp Text Button */}
              <button
                type="button"
                onClick={() => {
                  const dateStr = new Date(detailsPO.timestamp).toLocaleDateString();
                  let text = `*PURCHASE ORDER*\n`;
                  text += `*PO ID:* PO-${detailsPO.id}\n`;
                  text += `*Supplier:* ${detailsPO.supplier_name}\n`;
                  if (supplierDetail?.contact_number || supplierDetail?.whatsapp_number) {
                    text += `*Contact:* ${supplierDetail.whatsapp_number || supplierDetail.contact_number}\n`;
                  }
                  text += `*Date:* ${dateStr}\n`;
                  if (detailsPO.invoice_number) {
                    text += `*Ref Invoice:* ${detailsPO.invoice_number}\n`;
                  }
                  if (shareBusinessInfo) {
                    text += `\n*Business Info:*\n${shareBusinessInfo}\n`;
                  }
                  text += `\n*Items:*\n`;
                  (detailsPO.items || []).forEach((item) => {
                    let line = `- ${item.product_name} x ${item.quantity}`;
                    if (shareIncludeCost) {
                      line += ` (Cost: ₹${item.purchase_cost})`;
                    }
                    text += line + `\n`;
                  });
                  if (shareIncludeCost) {
                    text += `\n*Total Amount:* ₹${detailsPO.total_amount}`;
                  }

                  const encodedText = encodeURIComponent(text);
                  const cleanPhone = (supplierDetail?.whatsapp_number || supplierDetail?.contact_number || '').replace(/[^0-9]/g, '');
                  const waNumber = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
                  const url = waNumber
                    ? `https://wa.me/${waNumber}?text=${encodedText}`
                    : `https://wa.me/?text=${encodedText}`;
                  window.open(url, '_blank');
                }}
                className="flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-2.5 text-xs font-bold hover:bg-emerald-100 transition cursor-pointer flex-1"
              >
                <span>WhatsApp Text</span>
              </button>

              {/* Share as Image Button */}
              <button
                type="button"
                onClick={() => handleSharePOAsImage(detailsPO)}
                disabled={isSharingImage}
                className="flex items-center justify-center rounded-xl bg-brand-blue/5 text-brand-blue border border-brand-blue/20 px-4 py-2.5 text-xs font-semibold hover:bg-brand-blue/10 transition flex-1 cursor-pointer disabled:opacity-50"
              >
                {isSharingImage && <Spinner size="sm" className="mr-1.5" />}
                <span>Share as Image</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. Mobile Floating Cart Button */}
      {currentTab === 'create' && poMode && items.length > 0 && (
        <div className="lg:hidden fixed bottom-20 right-6 z-40">
          <button
            onClick={() => setShowMobileCart(true)}
            className="relative flex h-14 w-14 items-center justify-center rounded-full bg-brand-blue text-white shadow-xl hover:bg-brand-cobalt transition active:scale-95 cursor-pointer"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="absolute -top-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white border-2 border-white shadow-sm animate-pulse">
              {items.length}
            </span>
          </button>
        </div>
      )}

      {/* 2. Mobile Cart Bottom Sheet */}
      <MobileBottomSheet
        isOpen={showMobileCart}
        onClose={() => setShowMobileCart(false)}
        title={`Purchase Cart (${items.length} items)`}
      >
        <div className="space-y-4 pb-8">
          {items.length === 0 ? (
            <div className="text-center py-8 text-text-secondary text-xs">Your cart is empty.</div>
          ) : (
            <div className="space-y-3">
              {Object.entries(getGroupedItems()).map(([supId, group]) => (
                <div key={supId} className="border border-surface-low rounded-xl p-3 bg-surface-lowest space-y-2">
                  <div className="font-bold text-xs text-brand-blue border-b border-surface-low pb-1">
                    Supplier: {group.supplierName}
                  </div>
                  <div className="divide-y divide-surface-low">
                    {group.items.map((item) => {
                      const sell = item.new_selling_price !== null && item.new_selling_price !== undefined && item.new_selling_price !== '' ? parseFloat(item.new_selling_price) : parseFloat(item.selling_price || 0);
                      const itemProfit = item.quantity * (sell - item.purchase_cost);
                      return (
                        <div key={item.originalIndex} className="py-2.5 flex items-center justify-between text-sm gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-text-primary truncate">{item.name}</div>
                            <div className="text-xs text-text-secondary mt-0.5">
                              Qty: <span className="font-bold text-text-primary">{item.quantity}</span> | Cost: <span className="font-semibold">{formatCurrency(item.purchase_cost)}</span> | Profit: <span className={`font-semibold ${itemProfit >= 0 ? 'text-green-600' : 'text-error'}`}>{formatCurrency(itemProfit)}</span>
                            </div>
                          </div>
                          <div className="text-right flex items-center space-x-3">
                            <div className="font-bold text-text-primary">{formatCurrency(item.quantity * item.purchase_cost)}</div>
                            <button
                              type="button"
                              onClick={() => handleRemoveLineItem(item.originalIndex)}
                              className="text-error font-bold p-1 hover:underline cursor-pointer text-xs"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => {
                  setShowMobileCart(false);
                  setShowMobileBilling(true);
                }}
                className="w-full mt-4 rounded-xl bg-brand-blue py-3 text-sm font-bold text-white hover:bg-brand-cobalt transition shadow-sm cursor-pointer text-center"
              >
                Continue to Billing
              </button>
            </div>
          )}
        </div>
      </MobileBottomSheet>

      {/* 3. Mobile Billing Bottom Sheet */}
      <MobileBottomSheet
        isOpen={showMobileBilling}
        onClose={() => setShowMobileBilling(false)}
        title="Billing & Settlement"
      >
        <div className="space-y-4 pb-8">
          {renderBillingForm()}
        </div>
      </MobileBottomSheet>

      {/* Quick-Create Product Modal */}
      {showQuickCreate && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-surface-low">
              <div>
                <h3 className="text-sm font-bold text-text-primary">Quick-Create Product</h3>
                <p className="text-[10px] text-text-secondary mt-0.5">
                  {(poMode === 'supplier' || poMode === 'direct')
                    ? `Will be linked to the selected supplier`
                    : 'Select a supplier to link this product to'}
                </p>
              </div>
              <button
                onClick={() => setShowQuickCreate(false)}
                className="text-text-secondary hover:text-text-primary p-1.5 rounded-full hover:bg-surface-low transition"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleQuickCreateProduct} className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-[11px] font-semibold text-text-secondary mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={qcName}
                    onChange={(e) => setQcName(e.target.value)}
                    className="w-full rounded-lg border border-surface-dim bg-white px-3 py-2.5 text-sm text-text-primary outline-none focus:border-brand-blue"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-text-secondary mb-1">Barcode / SKU *</label>
                  <input
                    type="text"
                    required
                    value={qcBarcode}
                    onChange={(e) => setQcBarcode(e.target.value)}
                    placeholder="e.g. 8901234"
                    className="w-full rounded-lg border border-surface-dim bg-white px-3 py-2.5 text-sm text-text-primary outline-none focus:border-brand-blue"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-text-secondary mb-1">Selling Price (RRP)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={qcSellingPrice}
                    onChange={(e) => setQcSellingPrice(e.target.value)}
                    className="w-full rounded-lg border border-surface-dim bg-white px-3 py-2.5 text-sm text-text-primary outline-none focus:border-brand-blue"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-text-secondary mb-1">Purchase Cost</label>
                  <input
                    type="number"
                    step="0.01"
                    value={qcCost}
                    onChange={(e) => setQcCost(e.target.value)}
                    className="w-full rounded-lg border border-surface-dim bg-white px-3 py-2.5 text-sm text-text-primary outline-none focus:border-brand-blue"
                  />
                </div>
                {poMode === 'product' && (
                  <div className="col-span-2">
                    <label className="block text-[11px] font-semibold text-text-secondary mb-1">Link to Supplier *</label>
                    <select
                      required
                      value={qcSupplierId}
                      onChange={(e) => setQcSupplierId(e.target.value)}
                      className="w-full rounded-lg border border-surface-dim bg-white px-3 py-2.5 text-sm text-text-primary outline-none focus:border-brand-blue"
                    >
                      <option value="">Select Supplier</option>
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowQuickCreate(false)}
                  className="flex-1 rounded-lg border border-surface-dim py-2.5 text-sm font-semibold text-text-secondary hover:bg-surface-low transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingQc}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-brand-blue py-2.5 text-sm font-bold text-white hover:bg-brand-cobalt transition disabled:opacity-50"
                >
                  {isSavingQc && <Spinner size="sm" />}
                  {isSavingQc ? 'Creating...' : 'Create & Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Off-screen Branded PO Generator */}
      {detailsPO && (
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
          <div id="po-share-card">
            {renderBrandedPO(detailsPO, false)}
          </div>
        </div>
      )}
    </div>
  );
}
