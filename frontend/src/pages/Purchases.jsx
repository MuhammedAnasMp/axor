import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../utils/api';
import { usePagination } from '../utils/usePagination';
import PaginationControls from '../components/PaginationControls';
import { SkeletonTable, Spinner } from '../components/Skeleton';
import MobileBottomSheet from '../components/MobileBottomSheet';


export default function Purchases() {
  const [searchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'create';

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
  const historyPag = usePagination(api.purchases.list, 10, currentTab === 'history');

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
  const [expandedReturnRows, setExpandedReturnRows] = useState({});
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [showMobileBilling, setShowMobileBilling] = useState(false);


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
        : (suppliers.find(s => s.id.toString() === supplier)?.name || '')
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

    // Check if item already exists in PO
    const existingIdx = recItems.findIndex(item => item.product === recSelectedProductObj.id);
    if (existingIdx > -1) {
      const updated = [...recItems];
      updated[existingIdx].quantity += parseInt(recQty);
      if (parseFloat(recCost) > 0) {
        updated[existingIdx].purchase_cost = parseFloat(recCost);
      }
      if (recNewSellingPrice !== '') {
        updated[existingIdx].new_selling_price = parseFloat(recNewSellingPrice);
      }
      setRecItems(updated);
    } else {
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
    }

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
      paid_from: recPaymentType !== 'Credit' ? parseInt(recPaidFrom) : null,
      paid_old_credit: getPaidOldCreditVal(),
      deducted_credit: recDeductSupplierCredit ? parseFloat(recDeductAmount || 0) : 0
    };

    setIsReceivingPO(true);
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
                className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm outline-none focus:border-brand-blue"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Additional Expense (Shipping, Customs, Delivery)
              </label>
              <input
                type="number"
                step="0.01"
                value={additionalCosts}
                onChange={(e) => setAdditionalCosts(e.target.value)}
                className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm outline-none focus:border-brand-blue"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Payment Method</label>
              <select
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value)}
                className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm outline-none focus:border-brand-blue"
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
            {(paymentType !== 'Credit' || parseFloat(additionalCosts || 0) > 0) && (
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Deduct Cash/Bank Account</label>
                <select
                  value={paidFrom}
                  onChange={(e) => setPaidFrom(e.target.value)}
                  className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm outline-none focus:border-brand-blue"
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
                            className="w-full max-w-[150px] rounded border border-surface-dim bg-white px-2 py-1 text-xs outline-none text-text-primary focus:border-brand-blue"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="border-t border-surface-low pt-4 space-y-2 text-xs font-semibold">
              <div className="flex justify-between text-text-secondary">
                <span>Additional Cost:</span>
                <span>{formatCurrency(additionalCosts)}</span>
              </div>
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
          <form onSubmit={handleSubmitPO} className="space-y-6">
            {items.length === 0 ? (
              <p className="text-xs text-text-secondary text-center py-4">Add products to see billing details.</p>
            ) : (
              Object.keys(supplierBilling).map((supId) => {
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
                  <div key={supId} className="border border-surface-low rounded-xl p-3 bg-surface-lowest space-y-3">
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
                        className="w-full rounded border border-surface-dim bg-white px-2 py-1 text-xs outline-none focus:border-brand-blue"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-text-secondary mb-0.5">Additional Landing Cost</label>
                      <input
                        type="number"
                        step="0.01"
                        value={billing.additionalCosts}
                        onChange={(e) => updateBillingField('additionalCosts', e.target.value)}
                        className="w-full rounded border border-surface-dim bg-white px-2 py-1 text-xs outline-none focus:border-brand-blue"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-text-secondary mb-0.5">Payment Method</label>
                      <select
                        value={billing.paymentType}
                        onChange={(e) => updateBillingField('paymentType', e.target.value)}
                        className="w-full rounded border border-surface-dim bg-white px-2 py-1 text-xs outline-none focus:border-brand-blue"
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
                    {(billing.paymentType !== 'Credit' || additional > 0) && (
                      <div>
                        <label className="block text-[10px] font-semibold text-text-secondary mb-0.5">Deduct Account</label>
                        <select
                          value={billing.paidFrom}
                          onChange={(e) => updateBillingField('paidFrom', e.target.value)}
                          className="w-full rounded border border-surface-dim bg-white px-2 py-1 text-xs outline-none focus:border-brand-blue"
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
                                    className="w-full max-w-[150px] rounded border border-surface-dim bg-white px-2 py-1 text-xs outline-none text-text-primary focus:border-brand-blue"
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
                      <div className="flex justify-between text-text-secondary text-[10px]">
                        <span>Landed Cost:</span>
                        <span>{formatCurrency(additional)}</span>
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
                );
              })
            )}
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
      <div className="tabs-container border-b border-surface-low">
        <div className="tabs-scrollable space-x-6 text-sm font-medium">
          <Link
            to="/erp/purchases"
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
          {/* <p className="text-xs text-text-secondary max-w-md text-center">
            Select how you would like to construct your purchase order. You can either build it supplier-by-supplier or select individual products and automatically generate separate POs.
          </p> */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
            <button
              onClick={() => setPoMode('supplier')}
              className="flex flex-col items-center p-6 border border-surface-dim hover:border-brand-blue rounded-lg bg-surface-lowest hover:bg-surface-light transition text-center space-y-3 group"
            >
              <div className="rounded-full bg-brand-blue/10 p-3 text-brand-blue group-hover:bg-brand-blue group-hover:text-white transition">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <span className="font-semibold text-sm text-text-primary">Supplier-Based PO</span>
              <span className="text-xs text-text-secondary">
                Select a single supplier first. Then search and add products mapped only to that supplier. Generates one PO.
              </span>
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
              <span className="font-semibold text-sm text-text-primary">Product-Based PO</span>
              <span className="text-xs text-text-secondary">
                Search products first, choose from available suppliers for each product, and add to one cart. Automatically splits and generates multiple POs.
              </span>
            </button>
          </div>
        </div>
      )}

      {currentTab === 'create' && poMode && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main PO Info */}
          <div className="rounded-lg bg-white p-6 shadow-sm border border-surface-low space-y-4 lg:col-span-2" style={{ boxShadow: '0px 1px 3px rgba(0,0,0,0.1)' }}>
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold text-text-primary">
                New Purchase Invoice / PO ({poMode === 'product' ? 'Product-Based' : 'Supplier-Based'})
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
                className="text-xs text-brand-blue hover:underline font-semibold"
              >
                Change Mode
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
                    className="w-full rounded border border-surface-dim bg-white pl-3 pr-8 py-2 text-sm text-text-primary outline-none focus:border-brand-blue"
                  />
                  {supplierSearching && (
                    <span className="absolute right-8 top-2.5 text-[10px] text-brand-blue animate-pulse">Searching...</span>
                  )}
                  <span className="absolute right-2.5 top-2.5 text-text-secondary pointer-events-none">
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
            <div className="rounded border border-surface-low p-4 bg-surface-lowest space-y-3">
              <span className="text-xs font-semibold text-brand-blue">Add Product to Order</span>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div ref={dropdownRef} className={`${poMode === 'product' ? 'sm:col-span-1' : 'sm:col-span-2'} relative`}>
                  <div className="flex justify-between items-center mb-0.5">
                    <label className="block text-[11px] font-semibold text-text-secondary">Search & Select Product</label>
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
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Type product name or barcode..."
                      value={productSearch}
                      onChange={(e) => {
                        setProductSearch(e.target.value);
                        setShowDropdown(true);
                      }}
                      onFocus={() => setShowDropdown(true)}
                      className="w-full rounded border border-surface-dim bg-white pl-3 pr-8 py-1.5 text-xs text-text-primary outline-none focus:border-brand-blue"
                    />
                    {searching && (
                      <span className="absolute right-2.5 top-2 text-[10px] text-brand-blue animate-pulse">Searching...</span>
                    )}
                  </div>
                  {showDropdown && (productSearch.trim() !== '' || searchedProducts.length > 0) && (
                    <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-xs shadow-lg ring-1 ring-black/5 focus:outline-none border border-surface-dim">
                      {searchedProducts.length === 0 ? (
                        <div className="px-3 py-2 text-text-secondary">No products found.</div>
                      ) : (
                        searchedProducts.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setSelectedProductObj(p);
                              setProductSearch(`${p.name} (${p.barcode})`);
                              setShowDropdown(false);
                              setNewSellingPrice(p.selling_price.toString());

                              if (poMode === 'supplier') {
                                // Fetch Negotiated Cost and Validate Mapping
                                api.supplierProducts.list({ supplier_id: supplier, product_id: p.id })
                                  .then((res) => {
                                    const mapping = (res && res.results && res.results[0]) || (Array.isArray(res) && res[0]);
                                    if (mapping) {
                                      setCost(mapping.current_cost.toString());
                                    } else {
                                      alert(`Product '${p.name}' is not mapped to this supplier! Please establish mapping in Product Management.`);
                                      setSelectedProductObj(null);
                                      setProductSearch('');
                                      setCost('0');
                                    }
                                  })
                                  .catch((err) => {
                                    console.error(err);
                                    setCost('0');
                                  });
                              } else {
                                // Fetch all supplier mappings for this product
                                api.supplierProducts.list({ product_id: p.id })
                                  .then((res) => {
                                    const list = (res && res.results) || (Array.isArray(res) && res) || [];
                                    setProductSuppliers(list);
                                    if (list.length > 0) {
                                      setSelectedProductSupplierId(list[0].supplier.toString());
                                      setCost(list[0].current_cost.toString());
                                    } else {
                                      alert(`Product '${p.name}' is not mapped to any supplier! Please establish mapping in Product Management.`);
                                      setSelectedProductObj(null);
                                      setProductSearch('');
                                      setCost('0');
                                    }
                                  })
                                  .catch((err) => {
                                    console.error(err);
                                    setCost('0');
                                  });
                              }
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-surface-low text-text-primary font-medium border-b border-surface-lowest last:border-0"
                          >
                            <span className="font-semibold">{p.name}</span> <span className="text-text-secondary">({p.barcode})</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {poMode === 'product' && (
                  <div>
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
                      className="w-full rounded border border-surface-dim bg-white px-2 py-1.5 text-xs text-text-primary outline-none focus:border-brand-blue"
                      disabled={!selectedProductObj}
                    >
                      {!selectedProductObj ? (
                        <option value="">Select a product first</option>
                      ) : (
                        <>
                          <option value="">-- Select Supplier --</option>
                          {productSuppliers.map((ps) => (
                            <option key={ps.supplier} value={ps.supplier}>
                              {ps.supplier_name} (₹{ps.current_cost})
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                  </div>
                )}

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
                  <label className="block text-[11px] font-semibold text-text-secondary mb-0.5">Unit Cost (INR)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    className="w-full rounded border border-surface-dim bg-white px-2 py-1.5 text-xs text-text-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-text-secondary mb-0.5">New Retail Selling Price (Optional)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Leave blank to keep same"
                    value={newSellingPrice}
                    onChange={(e) => setNewSellingPrice(e.target.value)}
                    className="w-full rounded border border-surface-dim bg-white px-2 py-1.5 text-xs text-text-primary outline-none"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleAddLineItem}
                    className="w-full rounded bg-brand-blue py-1.5 text-xs font-semibold text-white hover:bg-brand-cobalt transition"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>

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

      {/* Receive Products */}
      {currentTab === 'receive' && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-t-lg border-t border-x border-surface-low">
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                value={receivePag.search}
                onChange={(e) => receivePag.setSearch(e.target.value)}
                placeholder="Search POs by supplier/invoice ref..."
                className="w-full rounded border border-surface-dim bg-white pl-9 pr-3 py-2 text-xs text-text-primary outline-none focus:border-brand-blue placeholder:text-text-secondary"
              />
              <span className="absolute left-3 top-2.5 text-text-secondary">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
            </div>
            {activeLoading && (
              <span className="text-xs text-brand-blue animate-pulse">Loading...</span>
            )}
          </div>

          <div className="rounded-b-lg bg-white border-x border-b border-surface-low overflow-x-auto hidden md:block">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-surface-low text-text-secondary font-semibold uppercase">
                <tr>
                  {renderSortHeader('PO #', 'id', receivePag)}
                  {renderSortHeader('Supplier', 'supplier__name', receivePag)}
                  {renderSortHeader('Ref Invoice #', 'invoice_number', receivePag)}
                  <th className="px-4 py-2">Payment Type</th>
                  <th className="px-4 py-2 text-right">Landed Cost</th>
                  {renderSortHeader('Total Amount', 'total_amount', receivePag)}
                  <th className="px-4 py-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-low">
                {receivePag.loading ? (
                  <SkeletonTable rows={5} columns={7} />
                ) : (
                  receivePag.data.map((p) => (
                    <tr key={p.id} className="hover:bg-surface-bright">
                      <td className="px-4 py-3 font-semibold text-brand-blue cursor-pointer hover:underline" onClick={() => { setDetailsPO(p); setShowDetailsModal(true); }}>PO-{p.id}</td>
                      <td className="px-4 py-3 text-text-primary">{p.supplier_name}</td>
                      <td className="px-4 py-3 text-text-secondary font-mono">{p.invoice_number || '-'}</td>
                      <td className="px-4 py-3 text-text-secondary">{p.payment_type}</td>
                      <td className="px-4 py-3 text-right text-text-secondary">{formatCurrency(p.additional_costs)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-text-primary">{formatCurrency(p.total_amount)}</td>
                      <td className="px-4 py-3 text-center">
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
                <div key={idx} className="border border-surface-low rounded-lg p-4 bg-white space-y-3 shadow-sm animate-pulse">
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
                <div key={p.id} className="border border-surface-low rounded-lg p-4 bg-white space-y-3 shadow-sm">
                  <div className="flex justify-between items-start border-b border-surface-low pb-2">
                    <div>
                      <span
                        onClick={() => { setDetailsPO(p); setShowDetailsModal(true); }}
                        className="font-bold text-sm text-brand-blue cursor-pointer hover:underline"
                      >
                        PO-{p.id}
                      </span>
                      <span className="text-text-primary font-semibold block mt-1">{p.supplier_name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-text-secondary uppercase block">Total</span>
                      <span className="font-semibold text-sm text-brand-blue">{formatCurrency(p.total_amount)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-text-secondary">
                    <div>
                      <span className="block font-semibold">Ref Invoice #</span>
                      <span className="text-text-primary font-mono">{p.invoice_number || '-'}</span>
                    </div>
                    <div>
                      <span className="block font-semibold">Payment Type</span>
                      <span className="text-text-primary font-medium">{p.payment_type}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="block font-semibold">Landed Cost</span>
                      <span className="text-text-primary">{formatCurrency(p.additional_costs)}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-surface-lowest flex justify-end">
                    <button
                      onClick={() => handleOpenReceiveModal(p)}
                      className="rounded bg-green-600 px-4 py-2 text-xs font-bold text-white hover:bg-green-700 transition w-full sm:w-auto"
                    >
                      Receive PO
                    </button>
                  </div>
                </div>
              ))
            )}
            {receivePag.data.length === 0 && !receivePag.loading && (
              <div className="text-center py-8 text-text-secondary text-xs bg-white rounded-lg border border-surface-low">No pending purchase orders found.</div>
            )}
          </div>

          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-surface-low sm:px-6">
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
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-t-lg border-t border-x border-surface-low">
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                value={historyPag.search}
                onChange={(e) => historyPag.setSearch(e.target.value)}
                placeholder="Search history by supplier/invoice ref..."
                className="w-full rounded border border-surface-dim bg-white pl-9 pr-3 py-2 text-xs text-text-primary outline-none focus:border-brand-blue placeholder:text-text-secondary"
              />
              <span className="absolute left-3 top-2.5 text-text-secondary">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
            </div>
            {activeLoading && (
              <span className="text-xs text-brand-blue animate-pulse">Loading...</span>
            )}
          </div>

          <div className="rounded-b-lg bg-white border-x border-b border-surface-low overflow-x-auto hidden md:block">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-surface-low text-text-secondary font-semibold uppercase">
                <tr>
                  {renderSortHeader('PO #', 'id', historyPag)}
                  {renderSortHeader('Date', 'timestamp', historyPag)}
                  {renderSortHeader('Supplier', 'supplier__name', historyPag)}
                  <th className="px-4 py-2 text-right">Landed Cost</th>
                  {renderSortHeader('Total Amount', 'total_amount', historyPag)}
                  {renderSortHeader('Status', 'is_received', historyPag)}
                  <th className="px-4 py-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-low">
                {historyPag.loading ? (
                  <SkeletonTable rows={5} columns={7} />
                ) : (
                  historyPag.data.map((p) => (
                    <tr key={p.id} className="hover:bg-surface-bright">
                      <td className="px-4 py-3 font-semibold text-brand-blue cursor-pointer hover:underline" onClick={() => { setDetailsPO(p); setShowDetailsModal(true); }}>PO-{p.id}</td>
                      <td className="px-4 py-3 text-text-secondary">{new Date(p.timestamp).toLocaleString()}</td>
                      <td className="px-4 py-3 text-text-primary">{p.supplier_name}</td>
                      <td className="px-4 py-3 text-right text-text-secondary">{formatCurrency(p.additional_costs)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-text-primary">{formatCurrency(p.total_amount)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-semibold ${
                          p.status === 'Returned' ? 'bg-red-100 text-red-800' :
                          p.status === 'Partially Returned' ? 'bg-orange-100 text-orange-800' :
                          p.status === 'Received' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {p.status || (p.is_received ? 'Received' : 'Pending')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {p.is_received && (
                          <button
                            onClick={() => handleOpenReturnModal(p)}
                            className="inline-flex items-center justify-center rounded bg-red-600 hover:bg-red-700 px-2.5 py-1 text-[11px] font-bold text-white transition shadow-sm cursor-pointer"
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
                <div key={idx} className="border border-surface-low rounded-lg p-4 bg-white space-y-3 shadow-sm animate-pulse">
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
                <div key={p.id} className="border border-surface-low rounded-lg p-4 bg-white space-y-3 shadow-sm">
                  <div className="flex justify-between items-start border-b border-surface-low pb-2">
                    <div>
                      <span
                        onClick={() => { setDetailsPO(p); setShowDetailsModal(true); }}
                        className="font-bold text-sm text-brand-blue cursor-pointer hover:underline"
                      >
                        PO-{p.id}
                      </span>
                      <span className="text-text-secondary text-[10px] block font-mono mt-0.5">
                        {new Date(p.timestamp).toLocaleString()}
                      </span>
                      <span className="text-text-primary font-semibold block mt-1">{p.supplier_name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-text-secondary uppercase block">Total</span>
                      <span className="font-semibold text-sm text-brand-blue">{formatCurrency(p.total_amount)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-text-secondary">
                    <div>
                      <span className="block font-semibold">Landed Cost</span>
                      <span className="text-text-primary">{formatCurrency(p.additional_costs)}</span>
                    </div>
                    <div>
                      <span className="block font-semibold">Status</span>
                      <span className={`inline-block rounded px-1.5 py-0.5 text-[9px] font-bold mt-0.5 ${
                        p.status === 'Returned' ? 'bg-red-100 text-red-800' :
                        p.status === 'Partially Returned' ? 'bg-orange-100 text-orange-800' :
                        p.status === 'Received' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {p.status || (p.is_received ? 'Received' : 'Pending')}
                      </span>
                    </div>
                  </div>

                  {p.is_received && (
                    <div className="pt-2 border-t border-surface-lowest flex justify-end">
                      <button
                        onClick={() => handleOpenReturnModal(p)}
                        className="inline-flex items-center justify-center rounded bg-red-600 hover:bg-red-700 px-3 py-2 text-xs font-bold text-white transition shadow-sm w-full sm:w-auto cursor-pointer"
                      >
                        <svg className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                        <span>Return Purchase</span>
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
            {historyPag.data.length === 0 && !historyPag.loading && (
              <div className="text-center py-8 text-text-secondary text-xs bg-white rounded-lg border border-surface-low">No purchase orders found.</div>
            )}
          </div>

          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-surface-low sm:px-6">
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
          <div className="w-full max-w-4xl rounded-lg bg-white shadow-xl flex flex-col max-h-[85vh] relative overflow-hidden border border-surface-low animate-in fade-in duration-200">
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

            {/* Sub-Modal Overlay (Choose Supplier for Product-Based mode) */}
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
                  className="w-full rounded border border-surface-dim bg-white pl-9 pr-3 py-1.5 text-xs text-text-primary outline-none focus:border-brand-blue"
                />
                <span className="absolute left-3 top-2 text-text-secondary">
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
                  Receive & Post Purchase Order (PO-{receivingPO.id})
                </h3>
                <p className="text-[11px] text-text-secondary">Supplier: <span className="font-semibold text-text-primary">{receivingPO.supplier_name}</span></p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowReceiveModal(false);
                  setReceivingPO(null);
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
                    {/* Inline Add Row */}

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
                              className="w-full rounded border border-surface-dim bg-white px-2 py-1 text-xs text-text-primary outline-none focus:border-brand-blue"
                            />
                            {recShowDropdown && (recProductSearch.trim() !== '' || recSearching) && (
                              <div className="absolute left-0 right-0 z-30 mt-1 max-h-48 overflow-y-auto rounded-md bg-white border border-surface-low shadow-lg">
                                {recSearching ? (
                                  <div className="px-3 py-1.5 text-xs text-text-secondary animate-pulse">Searching...</div>
                                ) : recSearchedProducts.length === 0 ? (
                                  <div className="px-3 py-1.5 text-xs text-text-secondary">No mapped product found</div>
                                ) : (
                                  recSearchedProducts.map((p) => (
                                    <button
                                      key={p.id}
                                      type="button"
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
                                      className="w-full text-left px-3 py-1.5 hover:bg-surface-low text-text-primary font-medium border-b border-surface-lowest last:border-0"
                                    >
                                      <span className="font-semibold text-xs">{p.name}</span> <span className="text-[10px] text-text-secondary">({p.barcode})</span>
                                    </button>
                                  ))
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
                    <div key={idx} className="border border-surface-low rounded-lg p-4 bg-white space-y-3 shadow-sm">
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
                            Remove Item
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
                <div className="border border-surface-low rounded-lg p-4 bg-surface-lowest space-y-3">
                  <span className="text-xs font-bold text-brand-blue block">Add Product to Receive</span>
                  <div className="space-y-3">
                    <div className="relative" ref={recDropdownRef}>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-[11px] font-semibold text-text-secondary">Search Mapped Product</label>
                        <button
                          type="button"
                          onClick={handleOpenRecViewAllPopup}
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
                        placeholder="Search supplier product..."
                        value={recProductSearch}
                        onChange={(e) => {
                          setRecProductSearch(e.target.value);
                          setRecShowDropdown(true);
                        }}
                        onFocus={() => setRecShowDropdown(true)}
                        className="w-full rounded border border-surface-dim bg-white px-3 py-1.5 text-xs text-text-primary outline-none focus:border-brand-blue"
                      />
                      {recShowDropdown && (recProductSearch.trim() !== '' || recSearching) && (
                        <div className="absolute left-0 right-0 z-30 mt-1 max-h-48 overflow-y-auto rounded-md bg-white border border-surface-low shadow-lg">
                          {recSearching ? (
                            <div className="px-3 py-1.5 text-xs text-text-secondary animate-pulse">Searching...</div>
                          ) : recSearchedProducts.length === 0 ? (
                            <div className="px-3 py-1.5 text-xs text-text-secondary">No mapped product found</div>
                          ) : (
                            recSearchedProducts.map((p) => (
                              <button
                                key={p.id}
                                type="button"
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
                                className="w-full text-left px-3 py-1.5 hover:bg-surface-low text-text-primary font-medium border-b border-surface-lowest last:border-0"
                              >
                                <span className="font-semibold text-xs">{p.name}</span> <span className="text-[10px] text-text-secondary">({p.barcode})</span>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-text-secondary mb-1">Qty</label>
                        <input
                          type="number"
                          placeholder="Qty"
                          value={recQty}
                          onChange={(e) => setRecQty(e.target.value)}
                          className="w-full rounded border border-surface-dim bg-white px-2 py-1 text-xs text-right text-text-primary outline-none focus:border-brand-blue"
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
                          className="w-full rounded border border-surface-dim bg-white px-2 py-1 text-xs text-right text-text-primary outline-none focus:border-brand-blue"
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
                          className="w-full rounded border border-surface-dim bg-white px-2 py-1 text-xs text-right text-text-primary outline-none focus:border-brand-blue"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddRecLineItem}
                      className="w-full rounded bg-brand-blue py-2 text-xs font-semibold text-white hover:bg-brand-cobalt transition"
                    >
                      Add to Receive List
                    </button>
                  </div>
                </div>
              </div>


              {/* Settlement adjustments */}
              <div className="border border-surface-low rounded-lg p-4 bg-surface-lowest space-y-3">
                <span className="text-xs font-bold text-text-primary block">Costs & Settlement Adjustments</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">Additional Expance</label>
                    <input
                      type="number"
                      step="0.01"
                      value={recAdditionalCosts}
                      onChange={(e) => setRecAdditionalCosts(e.target.value)}
                      className="w-full rounded border border-surface-dim bg-white px-3 py-1.5 text-xs text-text-primary outline-none focus:border-brand-blue"
                    />
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

            {/* Footer */}
            <div className="p-4 border-t border-surface-low bg-surface-lowest flex justify-between items-center">
              <button
                type="button"
                disabled={isCancellingPO || isReceivingPO}
                onClick={() => handleCancelPO(receivingPO.id)}
                className="rounded bg-error text-white px-4 py-2 text-xs font-bold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center space-x-1"
              >
                {isCancellingPO && <Spinner size="xs" />}
                <span>Cancel Order</span>
              </button>

              <div className="flex space-x-2">
                <button
                  type="button"
                  disabled={isReceivingPO || isCancellingPO}
                  onClick={() => {
                    setShowReceiveModal(false);
                    setReceivingPO(null);
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
                  <span>Receive PO</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRecViewAllPopup && receivingPO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-6">
          <div className="w-full max-w-4xl rounded-lg bg-white shadow-xl flex flex-col max-h-[85vh] relative overflow-hidden border border-surface-low animate-in fade-in duration-200">
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
                  className="w-full rounded border border-surface-dim bg-white pl-9 pr-3 py-1.5 text-xs text-text-primary outline-none focus:border-brand-blue"
                />
                <span className="absolute left-3 top-2 text-text-secondary">
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
                    <div key={item.product} className="border border-surface-low rounded-lg p-4 bg-white space-y-3 shadow-sm">
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

      {showDetailsModal && detailsPO && (
        <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center bg-black/45 px-4 py-6 overflow-y-auto">
          <div className="w-full max-w-4xl rounded-lg bg-white shadow-xl flex flex-col max-h-[90vh] relative border border-surface-low animate-in fade-in duration-200">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-surface-low bg-surface-lowest">
              <div>
                <h3 className="text-sm font-bold text-text-primary flex items-center space-x-2">
                  <span>Purchase Order Details (PO-{detailsPO.id})</span>
                  <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-semibold ${
                    detailsPO.status === 'Returned' ? 'bg-red-100 text-red-800' :
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
                <div className="border border-surface-low rounded-lg hidden md:block overflow-hidden">
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

                {/* Mobile items cards */}
                <div className="block md:hidden space-y-3">
                  {(detailsPO.items || []).map((item, idx) => (
                    <div key={idx} className="border border-surface-low rounded-lg p-3 bg-white space-y-2 shadow-sm text-xs">
                      <div className="flex justify-between items-start border-b border-surface-lowest pb-1.5">
                        <div>
                          <div className="font-semibold text-text-primary">{item.product_name}</div>
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
            <div className="p-3 border-t border-surface-low bg-surface-lowest flex justify-end">
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
                        <div key={item.originalIndex} className="py-2 flex items-center justify-between text-xs gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-text-primary truncate">{item.name}</div>
                            <div className="text-[10px] text-text-secondary mt-0.5">
                              Qty: <span className="font-bold text-text-primary">{item.quantity}</span> | Cost: <span className="font-semibold">{formatCurrency(item.purchase_cost)}</span> | Profit: <span className={`font-semibold ${itemProfit >= 0 ? 'text-green-600' : 'text-error'}`}>{formatCurrency(itemProfit)}</span>
                            </div>
                          </div>
                          <div className="text-right flex items-center space-x-3">
                            <div className="font-bold text-text-primary">{formatCurrency(item.quantity * item.purchase_cost)}</div>
                            <button
                              type="button"
                              onClick={() => handleRemoveLineItem(item.originalIndex)}
                              className="text-error font-bold p-1 hover:underline cursor-pointer"
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
    </div>
  );
}

