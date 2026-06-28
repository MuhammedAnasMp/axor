import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../utils/api';
import { usePagination } from '../utils/usePagination';
import PaginationControls from '../components/PaginationControls';
import FloatingActionButton from '../components/FloatingActionButton';
import MobileBottomSheet from '../components/MobileBottomSheet';
import { SkeletonTable, Spinner } from '../components/Skeleton';

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab') || 'all_products';
  const currentTab = (rawTab === 'all_products' || rawTab === 'products') ? 'products' : rawTab;
  const period = searchParams.get('period') || sessionStorage.getItem('period_products') || 'all';

  useEffect(() => {
    let nextParams = null;
    if (!searchParams.has('period')) {
      nextParams = new URLSearchParams(nextParams || searchParams);
      nextParams.set('period', period);
    }
    if (!searchParams.has('tab')) {
      nextParams = new URLSearchParams(nextParams || searchParams);
      nextParams.set('tab', 'all_products');
    }
    if (nextParams) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [searchParams, period, setSearchParams]);

  useEffect(() => {
    const urlPeriod = searchParams.get('period');
    if (urlPeriod) {
      sessionStorage.setItem('period_products', urlPeriod);
    }
  }, [searchParams]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [selectedProductDetails, setSelectedProductDetails] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);

  const openGallery = (imgUrlStr, startIndex = 0) => {
    if (!imgUrlStr) return;
    const urls = imgUrlStr.split(',');
    setGalleryImages(urls);
    setActiveGalleryIndex(startIndex);
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Dropdown states (unpaginated list)
  const [categoriesDropdown, setCategoriesDropdown] = useState([]);
  const [brandsDropdown, setBrandsDropdown] = useState([]);
  const [mobileModelsDropdown, setMobileModelsDropdown] = useState([]);
  const [dropdownsLoading, setDropdownsLoading] = useState(true);

  // Pagination hooks for each tab
  const prodPag = usePagination(api.products.list, 10, currentTab === 'products');
  const catPag = usePagination(api.categories.list, 10, currentTab === 'categories');
  const brandPag = usePagination(api.brands.list, 10, currentTab === 'brands');

  const costHistoryPag = usePagination(api.supplierCostHistory.list, 10, currentTab === 'cost-history', { period });
  const modelPag = usePagination(api.mobileModels.list, 10, currentTab === 'model');

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [sellingPrice, setSellingPrice] = useState('0');
  const [purchaseCost, setPurchaseCost] = useState('0');
  const [imageUrls, setImageUrls] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isSavingProduct, setIsSavingProduct] = useState(false);

  const [suitableModels, setSuitableModels] = useState([]);
  const [searchModelQuery, setSearchModelQuery] = useState('');
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const modelDropdownRef = useRef(null);

  const [searchBrandQuery, setSearchBrandQuery] = useState('');
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const brandDropdownRef = useRef(null);

  // Supplier linking state
  const [suppliersDropdown, setSuppliersDropdown] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [supplierCost, setSupplierCost] = useState('0');
  const [searchSupplierQuery, setSearchSupplierQuery] = useState('');
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const supplierDropdownRef = useRef(null);

  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [isSavingBrand, setIsSavingBrand] = useState(false);

  const resetProductForm = () => {
    setName('');
    setBarcode('');
    setDescription('');
    setCategory('');
    setBrand('');
    setSellingPrice('0');
    setImageUrls([]);
    setSuitableModels([]);
    setSearchModelQuery('');
    setShowModelDropdown(false);
    setSearchBrandQuery('');
    setShowBrandDropdown(false);
    setSelectedSupplier('');
    setSupplierCost('0');
    setSearchSupplierQuery('');
    setShowSupplierDropdown(false);
  };

  const handleStartEdit = (p) => {
    setEditingProduct(p);
    setName(p.name);
    setBarcode(p.barcode);
    setDescription(p.description || '');
    setCategory(p.category || '');
    setBrand(p.brand || '');
    const foundBrand = brandsDropdown.find(b => b.id === p.brand);
    setSearchBrandQuery(foundBrand ? foundBrand.name : '');
    setSellingPrice(p.selling_price.toString());
    setImageUrls(p.image_url ? p.image_url.split(',') : []);
    setSuitableModels(p.suitable_models || []);
    setSearchModelQuery('');
    setShowModelDropdown(false);
    setShowBrandDropdown(false);
    setShowForm(true);
  };

  const getCreateModelOptions = () => {
    const query = searchModelQuery.trim();
    if (!query) return [];

    const options = [];

    // Parse by brand prefix
    let parsedBrand = null;
    let parsedModelName = "";

    // 1. Check if query starts with an existing brand name
    const matchedBrand = brandsDropdown.find(b => query.toLowerCase().startsWith(b.name.toLowerCase() + " "));
    if (matchedBrand) {
      parsedBrand = matchedBrand;
      parsedModelName = query.substring(matchedBrand.name.length).trim();
    } else {
      // 2. Check if first word is a brand name
      const words = query.split(/\s+/);
      const firstWord = words[0];
      const matchedBrandFirstWord = brandsDropdown.find(b => b.name.toLowerCase() === firstWord.toLowerCase());
      if (matchedBrandFirstWord) {
        parsedBrand = matchedBrandFirstWord;
        parsedModelName = words.slice(1).join(' ').trim();
      } else {
        // 3. Check if we have a selected brand for the product
        const currentBrandObj = brand ? brandsDropdown.find(b => b.id.toString() === brand.toString()) : null;
        if (currentBrandObj) {
          parsedBrand = currentBrandObj;
          parsedModelName = query;
        } else {
          // 4. Default: first word is a new brand, rest is model
          parsedBrand = { id: 'new', name: firstWord };
          parsedModelName = words.slice(1).join(' ').trim();
        }
      }
    }

    if (parsedBrand && parsedModelName) {
      options.push({
        brand: parsedBrand,
        modelName: parsedModelName,
        label: parsedBrand.id === 'new'
          ? `+ Create Brand "${parsedBrand.name}" & Model "${parsedModelName}"`
          : `+ Create Brand "${parsedBrand.name}" & Model "${parsedModelName}"  `
      });
    }

    // If we have a current brand, and it is NOT the parsed one, also offer to create under the current brand
    const currentBrandObj = brand ? brandsDropdown.find(b => b.id.toString() === brand.toString()) : null;
    if (currentBrandObj && (!parsedBrand || parsedBrand.id !== currentBrandObj.id)) {
      options.push({
        brand: currentBrandObj,
        modelName: query,
        label: `+ Create Model "${query}" under selected Brand "${currentBrandObj.name}"`
      });
    }

    return options;
  };

  const handleCreateAndAddMobileModel = async (option) => {
    let brandId = option.brand.id;
    try {
      if (brandId === 'new') {
        const existingBrand = brandsDropdown.find(b => b.name.toLowerCase() === option.brand.name.toLowerCase());
        if (existingBrand) {
          brandId = existingBrand.id;
        } else {
          try {
            const brandRes = await api.brands.create({ name: option.brand.name });
            setBrandsDropdown(prev => [...prev, brandRes].sort((x, y) => x.name.localeCompare(y.name)));
            brandId = brandRes.id;
          } catch (brandErr) {
            const existingBrands = await api.brands.list({ search: option.brand.name });
            const list = existingBrands.results || existingBrands || [];
            const exactBrand = list.find(b => b.name.toLowerCase() === option.brand.name.toLowerCase());
            if (exactBrand) {
              brandId = exactBrand.id;
            } else {
              throw brandErr;
            }
          }
        }
      }

      let modelRes;
      try {
        modelRes = await api.mobileModels.create({
          brand: brandId,
          model_name: option.modelName
        });
        setMobileModelsDropdown(prev => [...prev, modelRes].sort((x, y) => x.brand_name.localeCompare(y.brand_name) || x.model_name.localeCompare(y.model_name)));
      } catch (modelErr) {
        const existingModels = await api.mobileModels.list({ brand: brandId });
        const list = existingModels.results || existingModels || [];
        const exactModel = list.find(m => m.model_name.toLowerCase() === option.modelName.toLowerCase());
        if (exactModel) {
          modelRes = exactModel;
        } else {
          throw modelErr;
        }
      }

      if (modelRes) {
        setSuitableModels(prev => [...prev, modelRes.id]);
      }
      setSearchModelQuery('');
      setShowModelDropdown(false);
    } catch (err) {
      alert('Error creating mobile model: ' + err.message);
    }
  };

  // Category Form
  const [catName, setCatName] = useState('');
  // Brand Form
  const [brandName, setBrandName] = useState('');
  // Mobile Model Form
  const [modelBrand, setModelBrand] = useState('');
  const [newModelName, setNewModelName] = useState('');
  const [isSavingMobileModel, setIsSavingMobileModel] = useState(false);

  // tab=model Form states
  const [tabModelBrand, setTabModelBrand] = useState('');
  const [tabSearchBrandQuery, setTabSearchBrandQuery] = useState('');
  const [tabShowBrandDropdown, setTabShowBrandDropdown] = useState(false);
  const [tabNewModelName, setTabNewModelName] = useState('');
  const [isSavingTabModel, setIsSavingTabModel] = useState(false);
  const tabBrandDropdownRef = useRef(null);

  // Mobile FAB options states
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [activeMobileForm, setActiveMobileForm] = useState(null); // 'category', 'brand', 'model'



  const loadDropdowns = () => {
    setDropdownsLoading(true);
    // Call list without params so DRF does not paginate
    Promise.all([
      api.categories.list(),
      api.brands.list(),
      api.mobileModels.list(),
      api.suppliers.list()
    ])
      .then(([c, b, m, s]) => {
        setCategoriesDropdown((c && c.results) || (Array.isArray(c) && c) || []);
        setBrandsDropdown((b && b.results) || (Array.isArray(b) && b) || []);
        setMobileModelsDropdown((m && m.results) || (Array.isArray(m) && m) || []);
        const sList = (s && s.results) || (Array.isArray(s) && s) || [];
        setSuppliersDropdown(sList);
        setDropdownsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setDropdownsLoading(false);
      });
  };

  const tabChangeRef = useRef(false);
  useEffect(() => {
    if (tabChangeRef.current) {
      if (currentTab === 'products') {
        loadDropdowns();
      }
    } else {
      tabChangeRef.current = true;
    }
  }, [currentTab]);

  useEffect(() => {
    loadDropdowns();

    function handleClickOutside(event) {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target)) {
        setShowModelDropdown(false);
      }
      if (brandDropdownRef.current && !brandDropdownRef.current.contains(event.target)) {
        setShowBrandDropdown(false);
      }
      if (tabBrandDropdownRef.current && !tabBrandDropdownRef.current.contains(event.target)) {
        setTabShowBrandDropdown(false);
      }
      if (supplierDropdownRef.current && !supplierDropdownRef.current.contains(event.target)) {
        setShowSupplierDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);



  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    const uploadedUrls = [];

    for (let file of files) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'axor_avp4mtcg');

      try {
        const res = await fetch('https://api.cloudinary.com/v1_1/dx5bqewfx/auto/upload', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (data.secure_url) {
          uploadedUrls.push(data.secure_url);
        } else {
          alert('Upload failed for some files: ' + (data.error?.message || 'Unknown error'));
        }
      } catch (err) {
        alert('Cloudinary upload error: ' + err.message);
      }
    }

    if (uploadedUrls.length > 0) {
      setImageUrls(prev => [...prev, ...uploadedUrls]);
    }
    setUploading(false);
  };

  const handleProductSubmit = (e) => {
    e.preventDefault();
    setIsSavingProduct(true);
    const data = {
      name,
      barcode,
      description,
      category: category || null,
      brand: brand || null,
      selling_price: parseFloat(sellingPrice),
      image_url: imageUrls.length > 0 ? imageUrls.join(',') : null,
      suitable_models: suitableModels
    };

    const action = editingProduct
      ? api.products.update(editingProduct.id, data)
      : api.products.create(data);

    action
      .then(async (productRes) => {
        // Link supplier if selected (only on create, or if supplier changed)
        if (!editingProduct && selectedSupplier) {
          try {
            await api.supplierProducts.create({
              product: productRes.id,
              supplier: parseInt(selectedSupplier),
              current_cost: parseFloat(supplierCost) || 0,
              selling_price: parseFloat(sellingPrice) || 0,
            });
          } catch (supErr) {
            console.error('Supplier link failed:', supErr);
          }
        }
        setShowForm(false);
        setEditingProduct(null);
        resetProductForm();
        prodPag.refresh();
        loadDropdowns();
        setIsSavingProduct(false);
        alert(editingProduct ? 'Product updated successfully!' : 'Product created successfully!');
      })
      .catch((err) => {
        alert(err.message);
        setIsSavingProduct(false);
      });
  };



  const handleCategorySubmit = (e) => {
    e.preventDefault();
    if (!catName) return;
    setIsSavingCategory(true);
    api.categories.create({ name: catName })
      .then(() => {
        setCatName('');
        catPag.refresh();
        loadDropdowns();
        setIsSavingCategory(false);
      })
      .catch((err) => {
        alert(err.message);
        setIsSavingCategory(false);
      });
  };

  const handleBrandSubmit = (e) => {
    e.preventDefault();
    if (!brandName) return;
    setIsSavingBrand(true);
    api.brands.create({ name: brandName })
      .then(() => {
        setBrandName('');
        brandPag.refresh();
        loadDropdowns();
        setIsSavingBrand(false);
      })
      .catch((err) => {
        alert(err.message);
        setIsSavingBrand(false);
      });
  };

  const deleteProduct = (id) => {
    if (confirm('Delete this product?')) {
      api.products.delete(id)
        .then(() => prodPag.refresh())
        .catch((err) => alert(err.message));
    }
  };

  const handleTabModelSubmit = async (e) => {
    e.preventDefault();
    let brandId = tabModelBrand;
    const typedBrand = tabSearchBrandQuery.trim();
    if (!typedBrand) {
      alert('Please select or enter a brand');
      return;
    }
    if (!tabNewModelName.trim()) {
      alert('Please enter a model name');
      return;
    }

    setIsSavingTabModel(true);

    try {
      const matched = brandsDropdown.find(b => b.name.toLowerCase() === typedBrand.toLowerCase());
      if (matched) {
        brandId = matched.id;
      } else {
        try {
          const brandRes = await api.brands.create({ name: typedBrand });
          setBrandsDropdown(prev => [...prev, brandRes].sort((x, y) => x.name.localeCompare(y.name)));
          brandId = brandRes.id;
        } catch (brandErr) {
          const existing = await api.brands.list({ search: typedBrand });
          const list = existing.results || existing || [];
          const exact = list.find(b => b.name.toLowerCase() === typedBrand.toLowerCase());
          if (exact) {
            brandId = exact.id;
          } else {
            throw brandErr;
          }
        }
      }

      let modelRes;
      try {
        modelRes = await api.mobileModels.create({
          brand: brandId,
          model_name: tabNewModelName.trim()
        });
        setMobileModelsDropdown(prev => [...prev, modelRes].sort((x, y) => x.brand_name.localeCompare(y.brand_name) || x.model_name.localeCompare(y.model_name)));
      } catch (modelErr) {
        const existingModels = await api.mobileModels.list({ brand: brandId });
        const list = existingModels.results || existingModels || [];
        const exactModel = list.find(m => m.model_name.toLowerCase() === tabNewModelName.trim().toLowerCase());
        if (exactModel) {
          modelRes = exactModel;
        } else {
          throw modelErr;
        }
      }

      setTabModelBrand('');
      setTabSearchBrandQuery('');
      setTabNewModelName('');
      modelPag.refresh();
      setIsSavingTabModel(false);
      alert('Mobile model created successfully!');
    } catch (err) {
      alert('Error saving mobile model: ' + err.message);
      setIsSavingTabModel(false);
    }
  };

  const deleteMobileModel = (id) => {
    if (confirm('Delete this mobile model?')) {
      api.mobileModels.delete(id)
        .then(() => {
          modelPag.refresh();
          loadDropdowns();
        })
        .catch((err) => alert(err.message));
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
    currentTab === 'products' ? prodPag.loading :
      currentTab === 'categories' ? catPag.loading :
        currentTab === 'brands' ? brandPag.loading :
          currentTab === 'model' ? modelPag.loading :
            costHistoryPag.loading;

  const renderProductForm = (isMobile = false) => (
    <form onSubmit={handleProductSubmit} className={isMobile ? "space-y-4" : "rounded-lg bg-white p-6 shadow-sm border border-surface-low space-y-4"}>
      {!isMobile && (
        <h3 className="text-sm font-semibold text-text-primary">{editingProduct ? `Edit Product: ${editingProduct.name}` : 'Add New Product'}</h3>
      )}
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        <div className="col-span-2">
          <label className="block text-xs font-semibold text-text-secondary mb-1">Product Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-blue"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1">Barcode / SKU</label>
          <input
            type="text"
            required
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-blue"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-blue"
          >
            <option value="">Select Category</option>
            {categoriesDropdown.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div ref={brandDropdownRef} className="relative">
          <label className="block text-xs font-semibold text-text-secondary mb-1">Product Brand</label>
          <input
            type="text"
            placeholder="Search or add brand..."
            value={searchBrandQuery}
            onChange={(e) => {
              setSearchBrandQuery(e.target.value);
              setShowBrandDropdown(true);
              if (!e.target.value) {
                setBrand('');
              }
            }}
            onFocus={() => setShowBrandDropdown(true)}
            className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-blue"
          />
          {showBrandDropdown && (
            <div className="absolute z-30 w-full mt-1 bg-white border border-surface-dim rounded shadow-lg max-h-48 overflow-y-auto">
              {brandsDropdown
                .filter(b => b.name.toLowerCase().includes(searchBrandQuery.toLowerCase()))
                .slice(0, 10)
                .map(b => (
                  <div
                    key={b.id}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setBrand(b.id);
                      setSearchBrandQuery(b.name);
                      setShowBrandDropdown(false);
                    }}
                    className="px-3 py-2 hover:bg-surface-low text-xs cursor-pointer text-text-primary border-b border-surface-low last:border-b-0"
                  >
                    {b.name}
                  </div>
                ))}
              {searchBrandQuery.trim() && !brandsDropdown.some(b => b.name.toLowerCase() === searchBrandQuery.trim().toLowerCase()) && (
                <div
                  onMouseDown={async (e) => {
                    e.preventDefault();
                    const typed = searchBrandQuery.trim();
                    try {
                      let res;
                      try {
                        res = await api.brands.create({ name: typed });
                        setBrandsDropdown(prev => [...prev, res].sort((x, y) => x.name.localeCompare(y.name)));
                      } catch (brandErr) {
                        const existing = await api.brands.list({ search: typed });
                        const list = existing.results || existing || [];
                        const exact = list.find(b => b.name.toLowerCase() === typed.toLowerCase());
                        if (exact) {
                          res = exact;
                        } else {
                          throw brandErr;
                        }
                      }
                      setBrand(res.id);
                      setSearchBrandQuery(res.name);
                      setShowBrandDropdown(false);
                    } catch (err) {
                      alert('Error adding brand: ' + err.message);
                    }
                  }}
                  className="px-3 py-2 hover:bg-brand-blue/10 text-xs cursor-pointer text-brand-blue font-semibold border-b border-surface-low last:border-b-0"
                >
                  + Add Brand "{searchBrandQuery.trim()}"
                </div>
              )}
              {brandsDropdown.filter(b => b.name.toLowerCase().includes(searchBrandQuery.toLowerCase())).length === 0 && !searchBrandQuery.trim() && (
                <div className="px-3 py-2 text-xs text-text-secondary">No brands found.</div>
              )}
            </div>
          )}
        </div>
        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1">Default Selling Price (RRP)</label>
          <input
            type="number"
            step="0.01"
            required
            value={sellingPrice}
            onChange={(e) => setSellingPrice(e.target.value)}
            className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-blue"
          />
        </div>

        {/* Supplier linking — only on new product */}
        {!editingProduct && (
          <>
            <div ref={supplierDropdownRef} className="relative">
              <label className="block text-xs font-semibold text-text-secondary mb-1">Link Supplier <span className="font-normal text-text-secondary">(optional)</span></label>
              <input
                type="text"
                placeholder="Search supplier..."
                value={searchSupplierQuery}
                onChange={(e) => {
                  setSearchSupplierQuery(e.target.value);
                  setShowSupplierDropdown(true);
                  if (!e.target.value) setSelectedSupplier('');
                }}
                onFocus={() => setShowSupplierDropdown(true)}
                className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-blue"
              />
              {showSupplierDropdown && (
                <div className="absolute z-30 w-full mt-1 bg-white border border-surface-dim rounded shadow-lg max-h-48 overflow-y-auto">
                  {suppliersDropdown
                    .filter(s => s.name.toLowerCase().includes(searchSupplierQuery.toLowerCase()))
                    .slice(0, 10)
                    .map(s => (
                      <div
                        key={s.id}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setSelectedSupplier(s.id.toString());
                          setSearchSupplierQuery(s.name);
                          setShowSupplierDropdown(false);
                        }}
                        className="px-3 py-2 hover:bg-surface-low text-xs cursor-pointer text-text-primary border-b border-surface-low last:border-b-0"
                      >
                        {s.name}
                      </div>
                    ))}
                  {suppliersDropdown.filter(s => s.name.toLowerCase().includes(searchSupplierQuery.toLowerCase())).length === 0 && (
                    <div className="px-3 py-2 text-xs text-text-secondary">No suppliers found.</div>
                  )}
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Purchase Cost</label>
              <input
                type="number"
                step="0.01"
                value={supplierCost}
                onChange={(e) => setSupplierCost(e.target.value)}
                disabled={!selectedSupplier}
                className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-blue disabled:opacity-40"
              />
            </div>
          </>
        )}

        <div ref={modelDropdownRef} className="col-span-2 relative">
          <label className="block text-xs font-semibold text-text-secondary mb-1">Suitable Mobile Models (Tags)</label>

          {/* Selected tags */}
          {suitableModels.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2 max-h-32 overflow-y-auto p-1.5 border border-surface-lowest rounded bg-surface-lowest">
              {suitableModels.map((modelId) => {
                const modelObj = mobileModelsDropdown.find(m => m.id === modelId);
                if (!modelObj) return null;
                return (
                  <span key={modelId} className="inline-flex items-center px-2 py-1 rounded bg-brand-blue/15 text-brand-blue text-xs font-medium border border-brand-blue/20">
                    {modelObj.brand_name} {modelObj.model_name}
                    <button
                      type="button"
                      onClick={() => setSuitableModels(prev => prev.filter(id => id !== modelId))}
                      className="ml-1.5 text-brand-blue hover:text-brand-cobalt font-bold focus:outline-none"
                    >
                      ✕
                    </button>
                  </span>
                );
              })}
            </div>
          )}

          {/* Search/select input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search brand or model name to link models..."
              value={searchModelQuery}
              onChange={(e) => {
                setSearchModelQuery(e.target.value);
                setShowModelDropdown(true);
              }}
              onFocus={() => setShowModelDropdown(true)}
              className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-blue"
            />
            {showModelDropdown && (
              <div className="absolute z-30 w-full mt-1 bg-white border border-surface-dim rounded shadow-lg max-h-48 overflow-y-auto">
                {mobileModelsDropdown
                  .filter(m => {
                    const fullName = `${m.brand_name} ${m.model_name}`.toLowerCase();
                    return fullName.includes(searchModelQuery.toLowerCase()) && !suitableModels.includes(m.id);
                  })
                  .slice(0, 30) // Limit display to 30 items for performance
                  .map(m => (
                    <div
                      key={m.id}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setSuitableModels(prev => [...prev, m.id]);
                        setSearchModelQuery('');
                        setShowModelDropdown(false);
                      }}
                      className="px-3 py-2 hover:bg-surface-low text-xs cursor-pointer text-text-primary border-b border-surface-low last:border-b-0"
                    >
                      <span className="font-semibold text-brand-blue">{m.brand_name}</span> {m.model_name}
                    </div>
                  ))}

                {/* Instant Create Options */}
                {searchModelQuery.trim() && getCreateModelOptions().map((opt, idx) => (
                  <div
                    key={`create-${idx}`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleCreateAndAddMobileModel(opt);
                    }}
                    className="px-3 py-2 hover:bg-brand-blue/10 text-xs cursor-pointer text-brand-blue font-semibold border-b border-surface-low last:border-b-0"
                  >
                    {opt.label}
                  </div>
                ))}

                {mobileModelsDropdown.filter(m => {
                  const fullName = `${m.brand_name} ${m.model_name}`.toLowerCase();
                  return fullName.includes(searchModelQuery.toLowerCase()) && !suitableModels.includes(m.id);
                }).length === 0 && !searchModelQuery.trim() && (
                    <div className="px-3 py-2 text-xs text-text-secondary">No matching models found.</div>
                  )}
              </div>
            )}
          </div>
        </div>

        <div className="col-span-2">
          <label className="block text-xs font-semibold text-text-secondary mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-blue"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-xs font-semibold text-text-secondary mb-1">Product Images</label>
          <div className="space-y-3">
            {/* Hidden inputs */}
            <input
              id="img-gallery-input"
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageUpload}
            />
            <input
              id="img-camera-input"
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleImageUpload}
            />
            {/* Buttons */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => document.getElementById('img-gallery-input').click()}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-surface-dim bg-white px-3 py-2.5 text-xs font-semibold text-text-primary hover:bg-surface-low active:bg-surface-low transition"
              >
                <svg className="h-4 w-4 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Gallery
              </button>
              <button
                type="button"
                onClick={() => document.getElementById('img-camera-input').click()}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-surface-dim bg-white px-3 py-2.5 text-xs font-semibold text-text-primary hover:bg-surface-low active:bg-surface-low transition"
              >
                <svg className="h-4 w-4 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Camera
              </button>
            </div>
            {uploading && <span className="text-xs text-brand-blue animate-pulse">Uploading to Cloudinary...</span>}

            {imageUrls.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {imageUrls.map((url, idx) => (
                  <div key={idx} className="relative group h-16 w-16 rounded border border-surface-dim overflow-hidden bg-white shadow-sm">
                    <img src={url} alt={`preview ${idx}`} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setImageUrls(prev => prev.filter((_, i) => i !== idx))}
                      className="absolute top-0.5 right-0.5 bg-red-600 text-white rounded-full p-0.5 text-[8px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center h-4 w-4"
                      title="Remove image"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <button
        type="submit"
        disabled={isSavingProduct}
        className="w-full sm:w-auto flex items-center justify-center space-x-2 rounded bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-brand-cobalt transition cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
      >
        {isSavingProduct && <Spinner size="sm" />}
        <span>{isSavingProduct ? 'Saving...' : 'Save Product'}</span>
      </button>
    </form>
  );

  return (
    <div className="space-y-6">
      {/* Title */}
      {!isMobile && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-text-primary">Products Management</h2>
            <p className="text-xs text-text-secondary">Add and configure products, categories, brands, and supplier costs.</p>
          </div>
          {currentTab === 'products' && (
            <button
              onClick={() => {
                if (showForm) {
                  setEditingProduct(null);
                  resetProductForm();
                }
                setShowForm(!showForm);
              }}
              className="hidden md:inline-block rounded bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-brand-cobalt transition"
            >
              {showForm ? 'Cancel' : 'Add Product'}
            </button>
          )}
        </div>
      )}

      {/* Tabs Menu */}
      {!isMobile && (
        <div className="hidden md:block tabs-container border-b border-surface-low">
          <div className="tabs-scrollable space-x-6 text-sm font-medium">
            <Link
              to="/erp/products?tab=all_products"
              className={`pb-2 ${currentTab === 'products' ? 'border-b-2 border-brand-blue text-brand-blue' : 'text-text-secondary'}`}
            >
              Products
            </Link>

            <Link
              to="/erp/products?tab=cost-history"
              className={`pb-2 ${currentTab === 'cost-history' ? 'border-b-2 border-brand-blue text-brand-blue' : 'text-text-secondary'}`}
            >
              Cost History
            </Link>
            <Link
              to="/erp/products?tab=categories"
              className={`pb-2 ${currentTab === 'categories' ? 'border-b-2 border-brand-blue text-brand-blue' : 'text-text-secondary'}`}
            >
              Categories
            </Link>
            <Link
              to="/erp/products?tab=brands"
              className={`pb-2 ${currentTab === 'brands' ? 'border-b-2 border-brand-blue text-brand-blue' : 'text-text-secondary'}`}
            >
              Brands
            </Link>
            <Link
              to="/erp/products?tab=model"
              className={`pb-2 ${currentTab === 'model' ? 'border-b-2 border-brand-blue text-brand-blue' : 'text-text-secondary'}`}
            >
              Mobile Models
            </Link>
          </div>
        </div>
      )}

      {/* Product Catalog Tab */}
      {currentTab === 'products' && (
        <div className="space-y-4 md:space-y-6">
          {/* Add Product Form */}
          {showForm && (
            <div className="hidden md:block">
              {renderProductForm(false)}
            </div>
          )}

          {/* Search bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 md:bg-white md:p-4 md:rounded-t-lg md:border-t md:border-x md:border-surface-low bg-transparent p-0 border-none">
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                value={prodPag.search}
                onChange={(e) => prodPag.setSearch(e.target.value)}
                placeholder="Search products using name/barcode..."
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

          {/* Product Grid / List */}
          {isMobile ? (
            <div className="space-y-3 md:pt-2">
              {prodPag.loading ? (
                <div className="p-4 space-y-4">
                  {[1, 2, 3, 4, 5].map((idx) => (
                    <div key={idx} className="animate-pulse flex space-x-3">
                      <div className="rounded bg-surface-low h-12 w-12"></div>
                      <div className="flex-1 space-y-2 py-1">
                        <div className="h-4 bg-surface-low rounded w-3/4"></div>
                        <div className="h-3 bg-surface-low rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                prodPag.data.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedProductDetails(p)}
                    className="rounded-lg border border-surface-low bg-white p-4 shadow-sm active:bg-surface-low transition-colors cursor-pointer space-y-2.5"
                  >
                    {/* Row 1: Image, Name, and Stock */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center space-x-3 min-w-0">
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            openGallery(p.image_url, 0);
                          }}
                          className="h-12 w-12 flex-shrink-0 rounded bg-surface border border-surface-low overflow-hidden cursor-pointer hover:opacity-85 transition-opacity"
                        >
                          {p.image_url ? (
                            (() => {
                              const urls = p.image_url.split(',');
                              return (
                                <div className="relative h-full w-full">
                                  <img src={urls[0]} alt={p.name} className="h-full w-full object-cover" />
                                  {urls.length > 1 && (
                                    <span className="absolute bottom-0.5 right-0.5 bg-black/70 text-white text-[8px] px-1 rounded-sm font-bold">
                                      +{urls.length - 1}
                                    </span>
                                  )}
                                </div>
                              );
                            })()
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-[10px] text-text-secondary">No img</div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-text-primary truncate">{p.name}</div>
                          <div className="text-[10px] text-text-secondary truncate mt-0.5">
                            {p.category_name || '-'} / {p.brand_name || '-'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded ${p.stock_qty < 10 ? 'bg-red-50 text-error border border-error/10' : 'bg-green-50 text-green-700 border border-green-700/10'
                          }`}>
                          Qty: {p.stock_qty}
                        </span>
                      </div>
                    </div>

                    {/* Row 2: Selling Price, Average Cost, Last Landed Cost */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-dashed border-surface-low text-[10px]">
                      <div>
                        <span className="block text-[9px] text-text-secondary">RRP Selling</span>
                        <span className="font-semibold text-text-primary">{formatCurrency(p.selling_price)}</span>
                      </div>
                      <div className="text-center">
                        <span className="block text-[9px] text-text-secondary">Avg Cost</span>
                        <span className="font-medium text-text-secondary">{formatCurrency(p.average_cost)}</span>
                      </div>
                      <div className="text-right">
                        <span className="block text-[9px] text-text-secondary">Last Landed Cost</span>
                        <span className="font-medium text-text-secondary">{formatCurrency(p.last_landed_cost)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
              {prodPag.data.length === 0 && !prodPag.loading && (
                <div className="p-8 text-center text-xs text-text-secondary">No products found.</div>
              )}

              <PaginationControls
                page={prodPag.page}
                setPage={prodPag.setPage}
                pageSize={prodPag.pageSize}
                setPageSize={prodPag.setPageSize}
                totalCount={prodPag.totalCount}
                totalPages={prodPag.totalPages}
                loading={prodPag.loading}
              />
            </div>
          ) : (
            <div className="rounded-b-lg bg-white border-x border-b border-surface-low overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-surface-low text-text-secondary font-semibold uppercase">
                  <tr>
                    <th className="px-4 py-2">Image</th>
                    {!isMobile && renderSortHeader('Barcode', 'barcode', prodPag)}
                    {renderSortHeader('Name', 'name', prodPag)}
                    <th className="px-4 py-2">Category / Brand</th>
                    {renderSortHeader('RRP Selling', 'selling_price', prodPag)}
                    {renderSortHeader('Average Cost', 'average_cost', prodPag)}
                    {renderSortHeader('Last Landed Cost', 'last_landed_cost', prodPag)}
                    <th className="px-4 py-2 text-right">Stock</th>
                    {!isMobile && <th className="px-4 py-2 text-center">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-low">
                  {prodPag.loading ? (
                    <SkeletonTable rows={prodPag.pageSize || 5} columns={isMobile ? 7 : 9} />
                  ) : (
                    prodPag.data.map((p) => (
                      <tr
                        key={p.id}
                        onClick={() => {
                          if (isMobile) {
                            setSelectedProductDetails(p);
                          }
                        }}
                        className={`hover:bg-surface-bright transition-colors ${isMobile ? 'cursor-pointer' : ''}`}
                      >
                        <td className={`px-4 ${isMobile ? 'py-5' : 'py-3'}`}>
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              openGallery(p.image_url, 0);
                            }}
                            className="h-10 w-10 rounded bg-surface border border-surface-low overflow-hidden cursor-pointer hover:opacity-85 transition-opacity"
                          >
                            {p.image_url ? (
                              (() => {
                                const urls = p.image_url.split(',');
                                return (
                                  <div className="relative h-full w-full">
                                    <img src={urls[0]} alt={p.name} className="h-full w-full object-cover" />
                                    {urls.length > 1 && (
                                      <span className="absolute bottom-0.5 right-0.5 bg-black/70 text-white text-[8px] px-1 rounded-sm font-bold">
                                        +{urls.length - 1}
                                      </span>
                                    )}
                                  </div>
                                );
                              })()
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-[10px] text-text-secondary">No img</div>
                            )}
                          </div>
                        </td>
                        {!isMobile && <td className="px-4 py-3 font-mono font-medium">{p.barcode}</td>}
                        <td className={`px-4 ${isMobile ? 'py-5' : 'py-3'} font-semibold text-text-primary`}>
                          <div>{p.name}</div>
                          {p.suitable_models_details && p.suitable_models_details.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1 font-normal">
                              {p.suitable_models_details.map((m) => (
                                <span key={m.id} className="inline-block px-1.5 py-0.5 rounded bg-brand-blue/10 text-brand-blue text-[9px] font-semibold border border-brand-blue/15">
                                  {m.brand_name} {m.model_name}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className={`px-4 ${isMobile ? 'py-5' : 'py-3'} text-text-secondary`}>
                          {p.category_name || '-'} / {p.brand_name || '-'}
                        </td>
                        <td className={`px-4 ${isMobile ? 'py-5' : 'py-3'} text-right font-semibold text-text-primary`}>{formatCurrency(p.selling_price)}</td>
                        <td className={`px-4 ${isMobile ? 'py-5' : 'py-3'} text-right text-text-secondary`}>{formatCurrency(p.average_cost)}</td>
                        <td className={`px-4 ${isMobile ? 'py-5' : 'py-3'} text-right text-text-secondary`}>{formatCurrency(p.last_landed_cost)}</td>
                        <td className={`px-4 ${isMobile ? 'py-5' : 'py-3'} text-right`}>
                          <span className={`font-semibold ${p.stock_qty < 10 ? 'text-error' : 'text-text-primary'}`}>
                            {p.stock_qty}
                          </span>
                        </td>
                        {!isMobile && (
                          <td className="px-4 py-3 text-center space-x-2 whitespace-nowrap">
                            <button
                              onClick={() => handleStartEdit(p)}
                              className="inline-flex items-center justify-center rounded bg-brand-blue/10 p-1 sm:px-2 sm:py-1 text-[11px] font-semibold text-brand-blue hover:bg-brand-blue/20 transition font-medium"
                              title="Edit Product"
                            >
                              <svg className="h-3 w-3 sm:mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                              <span className="hidden sm:inline">Edit</span>
                            </button>
                            <button
                              onClick={() => deleteProduct(p.id)}
                              className="inline-flex items-center justify-center rounded bg-error-container/10 p-1 sm:px-2 sm:py-1 text-[11px] font-semibold text-error hover:bg-error-container/20 transition"
                              title="Delete Product"
                            >
                              <svg className="h-3 w-3 sm:mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              <span className="hidden sm:inline">Delete</span>
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                  {prodPag.data.length === 0 && !prodPag.loading && (
                    <tr>
                      <td colSpan={isMobile ? 7 : 9} className="px-4 py-8 text-center text-text-secondary">No products found.</td>
                    </tr>
                  )}
                </tbody>
              </table>

              <PaginationControls
                page={prodPag.page}
                setPage={prodPag.setPage}
                pageSize={prodPag.pageSize}
                setPageSize={prodPag.setPageSize}
                totalCount={prodPag.totalCount}
                totalPages={prodPag.totalPages}
                loading={prodPag.loading}
              />
            </div>
          )}
        </div>
      )}

      {/* Categories Tab */}
      {currentTab === 'categories' && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Add Category */}
          <div className="hidden md:block rounded-lg bg-white p-6 shadow-sm border border-surface-low h-fit" style={{ boxShadow: '0px 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 className="text-sm font-semibold text-text-primary mb-4">Add Product Category</h3>
            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-blue"
                />
              </div>
              <button
                type="submit"
                disabled={isSavingCategory}
                className="w-full rounded bg-brand-blue py-2 text-sm font-semibold text-white hover:bg-brand-cobalt transition flex items-center justify-center space-x-1.5 disabled:opacity-50 disabled:pointer-events-none"
              >
                {isSavingCategory && <Spinner size="sm" />}
                <span>{isSavingCategory ? 'Adding...' : 'Add Category'}</span>
              </button>
            </form>
          </div>

          {/* Categories List */}
          <div className="md:rounded-lg md:bg-white p-0 md:p-6 md:shadow-sm md:border md:border-surface-low bg-transparent border-none shadow-none md:col-span-2">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Category List</h3>

            {/* Search and Loading */}
            <div className="flex items-center justify-between mb-4 gap-4">
              <input
                type="text"
                value={catPag.search}
                onChange={(e) => catPag.setSearch(e.target.value)}
                placeholder="Search categories..."
                className="rounded border border-surface-dim bg-white px-3 py-2.5 md:py-1.5 text-sm md:text-xs text-text-primary outline-none focus:border-brand-blue w-64 search-input-mobile"
              />
              {activeLoading && <div className="animate-spin rounded-full h-4 w-4 border-2 border-brand-blue border-t-transparent" />}
            </div>

            {isMobile ? (
              <div className="space-y-3 pt-2">
                {catPag.loading ? (
                  <div className="p-4 space-y-4">
                    {[1, 2, 3, 4, 5].map((idx) => (
                      <div key={idx} className="animate-pulse h-10 bg-surface-low rounded w-full"></div>
                    ))}
                  </div>
                ) : (
                  catPag.data.map((c) => (
                    <div key={c.id} className="rounded-lg border border-surface-low bg-white p-4 shadow-sm flex items-center justify-between">
                      <span className="font-semibold text-xs text-text-primary">{c.name}</span>
                      <button
                        onClick={() => {
                          if (confirm('Delete category?')) {
                            api.categories.delete(c.id).then(() => {
                              catPag.refresh();
                              loadDropdowns();
                            }).catch((e) => alert(e.message));
                          }
                        }}
                        className="rounded bg-error-container/10 p-1.5 text-error hover:bg-error-container/20 transition cursor-pointer"
                        title="Delete Category"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))
                )}
                {catPag.data.length === 0 && !catPag.loading && (
                  <div className="p-8 text-center text-xs text-text-secondary">No categories found.</div>
                )}
                <PaginationControls
                  page={catPag.page}
                  setPage={catPag.setPage}
                  pageSize={catPag.pageSize}
                  setPageSize={catPag.setPageSize}
                  totalCount={catPag.totalCount}
                  totalPages={catPag.totalPages}
                  loading={catPag.loading}
                />
              </div>
            ) : (
              <div className="divide-y divide-surface-low text-sm border border-surface-low rounded-lg bg-white overflow-hidden">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-surface-low text-text-secondary font-semibold uppercase">
                    <tr>
                      {renderSortHeader('Category Name', 'name', catPag)}
                      <th className="px-4 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-low">
                    {catPag.loading ? (
                      <SkeletonTable rows={catPag.pageSize || 5} columns={2} />
                    ) : (
                      catPag.data.map((c) => (
                        <tr key={c.id} className="hover:bg-surface-bright">
                          <td className="px-4 py-3 font-semibold text-text-primary">{c.name}</td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <button
                              onClick={() => {
                                if (confirm('Delete category?')) {
                                  api.categories.delete(c.id).then(() => {
                                    catPag.refresh();
                                    loadDropdowns();
                                  }).catch((e) => alert(e.message));
                                }
                              }}
                              className="inline-flex items-center justify-center rounded bg-error-container/10 p-1 sm:px-2 sm:py-1 text-[11px] font-semibold text-error hover:bg-error-container/20 transition"
                              title="Delete Category"
                            >
                              <svg className="h-3 w-3 sm:mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              <span className="hidden sm:inline">Delete</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                    {catPag.data.length === 0 && !catPag.loading && (
                      <tr>
                        <td colSpan="2" className="px-4 py-8 text-center text-text-secondary">No categories found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>

                <PaginationControls
                  page={catPag.page}
                  setPage={catPag.setPage}
                  pageSize={catPag.pageSize}
                  setPageSize={catPag.setPageSize}
                  totalCount={catPag.totalCount}
                  totalPages={catPag.totalPages}
                  loading={catPag.loading}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Brands Tab */}
      {currentTab === 'brands' && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Add Brand */}
          <div className="hidden md:block rounded-lg bg-white p-6 shadow-sm border border-surface-low h-fit" style={{ boxShadow: '0px 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 className="text-sm font-semibold text-text-primary mb-4">Add Brand</h3>
            <form onSubmit={handleBrandSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Brand Name</label>
                <input
                  type="text"
                  required
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-blue"
                />
              </div>
              <button
                type="submit"
                disabled={isSavingBrand}
                className="w-full rounded bg-brand-blue py-2 text-sm font-semibold text-white hover:bg-brand-cobalt transition flex items-center justify-center space-x-1.5 disabled:opacity-50 disabled:pointer-events-none"
              >
                {isSavingBrand && <Spinner size="sm" />}
                <span>{isSavingBrand ? 'Adding...' : 'Add Brand'}</span>
              </button>
            </form>
          </div>

          {/* Brands List */}
          <div className="md:rounded-lg md:bg-white p-0 md:p-6 md:shadow-sm md:border md:border-surface-low bg-transparent border-none shadow-none md:col-span-2">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Brands Directory</h3>

            {/* Search and Loading */}
            <div className="flex items-center justify-between mb-4 gap-4">
              <input
                type="text"
                value={brandPag.search}
                onChange={(e) => brandPag.setSearch(e.target.value)}
                placeholder="Search brands..."
                className="rounded border border-surface-dim bg-white px-3 py-2.5 md:py-1.5 text-sm md:text-xs text-text-primary outline-none focus:border-brand-blue w-64 search-input-mobile"
              />
              {activeLoading && <div className="animate-spin rounded-full h-4 w-4 border-2 border-brand-blue border-t-transparent" />}
            </div>

            {isMobile ? (
              <div className="space-y-3 pt-2">
                {brandPag.loading ? (
                  <div className="p-4 space-y-4">
                    {[1, 2, 3, 4, 5].map((idx) => (
                      <div key={idx} className="animate-pulse h-10 bg-surface-low rounded w-full"></div>
                    ))}
                  </div>
                ) : (
                  brandPag.data.map((b) => (
                    <div key={b.id} className="rounded-lg border border-surface-low bg-white p-4 shadow-sm flex items-center justify-between">
                      <span className="font-semibold text-xs text-text-primary">{b.name}</span>
                      <button
                        onClick={() => {
                          if (confirm('Delete brand?')) {
                            api.brands.delete(b.id).then(() => {
                              brandPag.refresh();
                              loadDropdowns();
                            }).catch((e) => alert(e.message));
                          }
                        }}
                        className="rounded bg-error-container/10 p-1.5 text-error hover:bg-error-container/20 transition cursor-pointer"
                        title="Delete Brand"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))
                )}
                {brandPag.data.length === 0 && !brandPag.loading && (
                  <div className="p-8 text-center text-xs text-text-secondary">No brands found.</div>
                )}
                <PaginationControls
                  page={brandPag.page}
                  setPage={brandPag.setPage}
                  pageSize={brandPag.pageSize}
                  setPageSize={brandPag.setPageSize}
                  totalCount={brandPag.totalCount}
                  totalPages={brandPag.totalPages}
                  loading={brandPag.loading}
                />
              </div>
            ) : (
              <div className="divide-y divide-surface-low text-sm border border-surface-low rounded-lg bg-white overflow-hidden">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-surface-low text-text-secondary font-semibold uppercase">
                    <tr>
                      {renderSortHeader('Brand Name', 'name', brandPag)}
                      <th className="px-4 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-low">
                    {brandPag.loading ? (
                      <SkeletonTable rows={brandPag.pageSize || 5} columns={2} />
                    ) : (
                      brandPag.data.map((b) => (
                        <tr key={b.id} className="hover:bg-surface-bright">
                          <td className="px-4 py-3 font-semibold text-text-primary">{b.name}</td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <button
                              onClick={() => {
                                if (confirm('Delete brand?')) {
                                  api.brands.delete(b.id).then(() => {
                                    brandPag.refresh();
                                    loadDropdowns();
                                  }).catch((e) => alert(e.message));
                                }
                              }}
                              className="inline-flex items-center justify-center rounded bg-error-container/10 p-1 sm:px-2 sm:py-1 text-[11px] font-semibold text-error hover:bg-error-container/20 transition"
                              title="Delete Brand"
                            >
                              <svg className="h-3 w-3 sm:mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              <span className="hidden sm:inline">Delete</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                    {brandPag.data.length === 0 && !brandPag.loading && (
                      <tr>
                        <td colSpan="2" className="px-4 py-8 text-center text-text-secondary">No brands found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>

                <PaginationControls
                  page={brandPag.page}
                  setPage={brandPag.setPage}
                  pageSize={brandPag.pageSize}
                  setPageSize={brandPag.setPageSize}
                  totalCount={brandPag.totalCount}
                  totalPages={brandPag.totalPages}
                  loading={brandPag.loading}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Models Tab */}
      {currentTab === 'model' && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Add Mobile Model Form */}
          <div className="hidden md:block rounded-lg bg-white p-6 shadow-sm border border-surface-low h-fit" style={{ boxShadow: '0px 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 className="text-sm font-semibold text-text-primary mb-4">Add Mobile Model</h3>
            <form onSubmit={handleTabModelSubmit} className="space-y-4">
              <div ref={tabBrandDropdownRef} className="relative">
                <label className="block text-xs font-semibold text-text-secondary mb-1">Mobile Brand</label>
                <input
                  type="text"
                  placeholder="Search or type brand..."
                  required
                  value={tabSearchBrandQuery}
                  onChange={(e) => {
                    setTabSearchBrandQuery(e.target.value);
                    setTabShowBrandDropdown(true);
                    if (!e.target.value) {
                      setTabModelBrand('');
                    }
                  }}
                  onFocus={() => setTabShowBrandDropdown(true)}
                  className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-blue"
                />
                {tabShowBrandDropdown && (
                  <div className="absolute z-30 w-full mt-1 bg-white border border-surface-dim rounded shadow-lg max-h-48 overflow-y-auto">
                    {brandsDropdown
                      .filter(b => b.name.toLowerCase().includes(tabSearchBrandQuery.toLowerCase()))
                      .slice(0, 10)
                      .map(b => (
                        <div
                          key={b.id}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setTabModelBrand(b.id);
                            setTabSearchBrandQuery(b.name);
                            setTabShowBrandDropdown(false);
                          }}
                          className="px-3 py-2 hover:bg-surface-low text-xs cursor-pointer text-text-primary border-b border-surface-low last:border-b-0"
                        >
                          {b.name}
                        </div>
                      ))}
                    {tabSearchBrandQuery.trim() && !brandsDropdown.some(b => b.name.toLowerCase() === tabSearchBrandQuery.trim().toLowerCase()) && (
                      <div
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setTabShowBrandDropdown(false);
                        }}
                        className="px-3 py-2 hover:bg-brand-blue/10 text-xs cursor-pointer text-brand-blue font-semibold border-b border-surface-low last:border-b-0"
                      >
                        + Use Brand "{tabSearchBrandQuery.trim()}" (will be created)
                      </div>
                    )}
                    {brandsDropdown.filter(b => b.name.toLowerCase().includes(tabSearchBrandQuery.toLowerCase())).length === 0 && !tabSearchBrandQuery.trim() && (
                      <div className="px-3 py-2 text-xs text-text-secondary">No brands found.</div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Model Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. S23 Ultra"
                  value={tabNewModelName}
                  onChange={(e) => setTabNewModelName(e.target.value)}
                  className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-blue"
                />
              </div>

              <button
                type="submit"
                disabled={isSavingTabModel}
                className="w-full rounded bg-brand-blue py-2 text-sm font-semibold text-white hover:bg-brand-cobalt transition flex items-center justify-center space-x-1.5 disabled:opacity-50 disabled:pointer-events-none"
              >
                {isSavingTabModel && <Spinner size="sm" />}
                <span>{isSavingTabModel ? 'Adding...' : 'Add Mobile Model'}</span>
              </button>
            </form>
          </div>

          {/* Mobile Models List */}
          <div className="md:rounded-lg md:bg-white p-0 md:p-6 md:shadow-sm md:border md:border-surface-low bg-transparent border-none shadow-none md:col-span-2">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Mobile Models Directory</h3>

            {/* Search and Loading */}
            <div className="flex items-center justify-between mb-4 gap-4">
              <input
                type="text"
                value={modelPag.search}
                onChange={(e) => modelPag.setSearch(e.target.value)}
                placeholder="Search models or brands..."
                className="rounded border border-surface-dim bg-white px-3 py-2.5 md:py-1.5 text-sm md:text-xs text-text-primary outline-none focus:border-brand-blue w-64 search-input-mobile"
              />
              {activeLoading && <div className="animate-spin rounded-full h-4 w-4 border-2 border-brand-blue border-t-transparent" />}
            </div>

            {isMobile ? (
              <div className="space-y-3 pt-2">
                {modelPag.loading ? (
                  <div className="p-4 space-y-4">
                    {[1, 2, 3, 4, 5].map((idx) => (
                      <div key={idx} className="animate-pulse h-10 bg-surface-low rounded w-full"></div>
                    ))}
                  </div>
                ) : (
                  modelPag.data.map((m) => (
                    <div key={m.id} className="rounded-lg border border-surface-low bg-white p-4 shadow-sm flex items-center justify-between">
                      <div className="min-w-0">
                        <span className="font-bold text-xs text-brand-blue">{m.brand_name}</span>
                        <span className="ml-2 font-medium text-xs text-text-primary">{m.model_name}</span>
                      </div>
                      <button
                        onClick={() => deleteMobileModel(m.id)}
                        className="rounded bg-error-container/10 p-1.5 text-error hover:bg-error-container/20 transition cursor-pointer"
                        title="Delete Mobile Model"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))
                )}
                {modelPag.data.length === 0 && !modelPag.loading && (
                  <div className="p-8 text-center text-xs text-text-secondary">No mobile models found.</div>
                )}
                <PaginationControls
                  page={modelPag.page}
                  setPage={modelPag.setPage}
                  pageSize={modelPag.pageSize}
                  setPageSize={modelPag.setPageSize}
                  totalCount={modelPag.totalCount}
                  totalPages={modelPag.totalPages}
                  loading={modelPag.loading}
                />
              </div>
            ) : (
              <div className="divide-y divide-surface-low text-sm border border-surface-low rounded-lg bg-white overflow-hidden">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-surface-low text-text-secondary font-semibold uppercase">
                    <tr>
                      {renderSortHeader('Brand', 'brand__name', modelPag)}
                      {renderSortHeader('Model Name', 'model_name', modelPag)}
                      <th className="px-4 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-low">
                    {modelPag.loading ? (
                      <SkeletonTable rows={modelPag.pageSize || 5} columns={3} />
                    ) : (
                      modelPag.data.map((m) => (
                        <tr key={m.id} className="hover:bg-surface-bright">
                          <td className="px-4 py-3 font-semibold text-brand-blue">{m.brand_name}</td>
                          <td className="px-4 py-3 font-medium text-text-primary">{m.model_name}</td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <button
                              onClick={() => deleteMobileModel(m.id)}
                              className="inline-flex items-center justify-center rounded bg-error-container/10 p-1 sm:px-2 sm:py-1 text-[11px] font-semibold text-error hover:bg-error-container/20 transition"
                              title="Delete Mobile Model"
                            >
                              <svg className="h-3 w-3 sm:mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              <span className="hidden sm:inline">Delete</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                    {modelPag.data.length === 0 && !modelPag.loading && (
                      <tr>
                        <td colSpan="3" className="px-4 py-8 text-center text-text-secondary">No mobile models found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>

                <PaginationControls
                  page={modelPag.page}
                  setPage={modelPag.setPage}
                  pageSize={modelPag.pageSize}
                  setPageSize={modelPag.setPageSize}
                  totalCount={modelPag.totalCount}
                  totalPages={modelPag.totalPages}
                  loading={modelPag.loading}
                />
              </div>
            )}
          </div>
        </div>
      )}


      {/* Cost History Tab */}
      {currentTab === 'cost-history' && (
        <div className="md:rounded-lg md:bg-white p-0 md:p-6 md:shadow-sm md:border md:border-surface-low" style={isMobile ? {} : { boxShadow: '0px 1px 3px rgba(0,0,0,0.1)' }}>

          {activeLoading && <div className="animate-spin rounded-full h-4 w-4 border-2 border-brand-blue border-t-transparent" />}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
            <input
              type="text"
              value={costHistoryPag.search}
              onChange={(e) => costHistoryPag.setSearch(e.target.value)}
              placeholder="Search history by product or supplier..."
              className="w-full sm:w-64 rounded border border-surface-dim bg-white px-3 py-2.5 md:py-1.5 text-sm md:text-xs text-text-primary outline-none focus:border-brand-blue search-input-mobile"
            />
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <label htmlFor="period-select" className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Period:</label>
              {!period.startsWith('custom_') ? (
                <select
                  id="period-select"
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
          </div>

          {isMobile ? (
            <div className="space-y-3 pt-2">
              {costHistoryPag.loading ? (
                <div className="p-3 space-y-4">
                  {[1, 2, 3, 4, 5].map((idx) => (
                    <div key={idx} className="animate-pulse space-y-2">
                      <div className="h-4 bg-surface-low rounded w-3/4"></div>
                      <div className="h-3 bg-surface-low rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : (
                costHistoryPag.data.map((h) => (
                  <div key={h.id} className="rounded-lg border border-surface-low bg-white p-3 shadow-sm space-y-2 text-xs">
                    {/* Row 1: Product SKU, Date / Time */}
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <div className="font-bold text-text-primary truncate">{h.product_name}</div>
                        <div className="text-[10px] text-text-secondary mt-0.5">
                          Supplier: <span className="font-semibold text-text-primary">{h.supplier_name}</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 text-[10px] text-text-secondary">
                        {new Date(h.timestamp).toLocaleDateString()} {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    {/* Row 2: Cost, Selling Price, Reference */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-dashed border-surface-low text-[10px]">
                      <div>
                        <span className="block text-[9px] text-text-secondary">Cost Price</span>
                        <span className="font-bold text-brand-blue">{formatCurrency(h.cost)}</span>
                      </div>
                      <div className="text-center">
                        <span className="block text-[9px] text-text-secondary">Retail Price</span>
                        <span className="font-bold text-green-600">
                          {h.selling_price !== null && h.selling_price !== undefined ? formatCurrency(h.selling_price) : '-'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="block text-[9px] text-text-secondary">Reference</span>
                        <span className="font-mono text-text-secondary">{h.purchase ? `PO-${h.purchase}` : 'Initial Seed'}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
              {costHistoryPag.data.length === 0 && !costHistoryPag.loading && (
                <div className="p-8 text-center text-xs text-text-secondary">No supplier cost history entries found.</div>
              )}
              <PaginationControls
                page={costHistoryPag.page}
                setPage={costHistoryPag.setPage}
                pageSize={costHistoryPag.pageSize}
                setPageSize={costHistoryPag.setPageSize}
                totalCount={costHistoryPag.totalCount}
                totalPages={costHistoryPag.totalPages}
                loading={costHistoryPag.loading}
              />
            </div>
          ) : (
            <div className="divide-y divide-surface-low text-sm border border-surface-low rounded-lg bg-white overflow-hidden">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-surface-low text-text-secondary font-semibold uppercase">
                  <tr>
                    {renderSortHeader('Date / Time', 'timestamp', costHistoryPag)}
                    {renderSortHeader('Product SKU', 'product__name', costHistoryPag)}
                    <th>Barcode</th>
                    <th>Supplier</th>
                    {renderSortHeader('Purchase Cost', 'cost', costHistoryPag)}
                    {renderSortHeader('Retail Selling Price', 'selling_price', costHistoryPag)}
                    <th>Reference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-low">
                  {costHistoryPag.loading ? (
                    <SkeletonTable rows={costHistoryPag.pageSize || 5} columns={7} />
                  ) : (
                    costHistoryPag.data.map((h) => (
                      <tr key={h.id} className="hover:bg-surface-bright">
                        <td className="px-4 py-3 text-text-secondary">{new Date(h.timestamp).toLocaleString()}</td>
                        <td className="px-4 py-3 font-semibold text-text-primary">{h.product_name}</td>
                        <td className="px-4 py-3 text-text-secondary font-mono">{h.barcode}</td>
                        <td className="px-4 py-3 text-text-primary">{h.supplier_name}</td>
                        <td className="px-4 py-3 font-bold text-brand-blue">{formatCurrency(h.cost)}</td>
                        <td className="px-4 py-3 font-bold text-green-600">
                          {h.selling_price !== null && h.selling_price !== undefined ? formatCurrency(h.selling_price) : '-'}
                        </td>
                        <td className="px-4 py-3 text-text-secondary font-mono">
                          {h.purchase ? `PO-${h.purchase}` : 'Initial Seed'}
                        </td>
                      </tr>
                    ))
                  )}
                  {costHistoryPag.data.length === 0 && !costHistoryPag.loading && (
                    <tr>
                      <td colSpan="7" className="px-4 py-8 text-center text-text-secondary">No supplier cost history entries found.</td>
                    </tr>
                  )}
                </tbody>
              </table>

              <PaginationControls
                page={costHistoryPag.page}
                setPage={costHistoryPag.setPage}
                pageSize={costHistoryPag.pageSize}
                setPageSize={costHistoryPag.setPageSize}
                totalCount={costHistoryPag.totalCount}
                totalPages={costHistoryPag.totalPages}
                loading={costHistoryPag.loading}
              />
            </div>
          )}
        </div>
      )}
      {/* Mobile Bottom Sheet for Product Details */}
      <MobileBottomSheet
        isOpen={selectedProductDetails !== null}
        onClose={() => setSelectedProductDetails(null)}
        title="Product Details"
      >
        {selectedProductDetails && (
          <div className="space-y-4 pb-6 text-xs text-text-primary animate-in fade-in duration-200">
            {selectedProductDetails.image_url && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {selectedProductDetails.image_url.split(',').map((url, idx) => (
                  <img
                    key={idx}
                    src={url}
                    alt={selectedProductDetails.name}
                    onClick={() => openGallery(selectedProductDetails.image_url, idx)}
                    className="h-24 w-24 object-cover rounded border border-surface-low cursor-pointer hover:opacity-90 transition-opacity"
                  />
                ))}
              </div>
            )}
            <div className="flex justify-between border-b border-surface-low pb-2">
              <span className="font-semibold text-text-secondary">Name:</span>
              <span className="font-bold text-text-primary text-right">{selectedProductDetails.name}</span>
            </div>
            <div className="flex justify-between border-b border-surface-low pb-2">
              <span className="font-semibold text-text-secondary">Barcode:</span>
              <span className="font-mono text-text-primary">{selectedProductDetails.barcode}</span>
            </div>
            <div className="flex justify-between border-b border-surface-low pb-2">
              <span className="font-semibold text-text-secondary">Category:</span>
              <span>{selectedProductDetails.category_name || '-'}</span>
            </div>
            <div className="flex justify-between border-b border-surface-low pb-2">
              <span className="font-semibold text-text-secondary">Brand:</span>
              <span>{selectedProductDetails.brand_name || '-'}</span>
            </div>
            <div className="flex justify-between border-b border-surface-low pb-2">
              <span className="font-semibold text-text-secondary">RRP Selling:</span>
              <span className="font-bold text-green-600">{formatCurrency(selectedProductDetails.selling_price)}</span>
            </div>
            <div className="flex justify-between border-b border-surface-low pb-2">
              <span className="font-semibold text-text-secondary">Average Cost:</span>
              <span>{formatCurrency(selectedProductDetails.average_cost)}</span>
            </div>
            <div className="flex justify-between border-b border-surface-low pb-2">
              <span className="font-semibold text-text-secondary">Last Landed Cost:</span>
              <span>{formatCurrency(selectedProductDetails.last_landed_cost)}</span>
            </div>
            <div className="flex justify-between border-b border-surface-low pb-2">
              <span className="font-semibold text-text-secondary">Stock:</span>
              <span className={`font-bold ${selectedProductDetails.stock_qty < 10 ? 'text-error' : 'text-green-600'}`}>{selectedProductDetails.stock_qty}</span>
            </div>
            {selectedProductDetails.description && (
              <div className="border-b border-surface-low pb-2">
                <span className="font-semibold text-text-secondary block mb-1">Description:</span>
                <p className="text-text-primary bg-surface p-2 rounded">{selectedProductDetails.description}</p>
              </div>
            )}
            {selectedProductDetails.suitable_models_details && selectedProductDetails.suitable_models_details.length > 0 && (
              <div>
                <span className="font-semibold text-text-secondary block mb-1">Suitable Models:</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedProductDetails.suitable_models_details.map((m) => (
                    <span key={m.id} className="inline-block px-2 py-0.5 rounded bg-brand-blue/10 text-brand-blue font-semibold border border-brand-blue/15 text-[10px]">
                      {m.brand_name} {m.model_name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Mobile Actions Inside the Detail Sheet */}
            <div className="pt-4 flex gap-3">
              <button
                onClick={() => {
                  handleStartEdit(selectedProductDetails);
                  setSelectedProductDetails(null);
                }}
                className="flex-1 flex items-center justify-center space-x-2 rounded bg-brand-blue py-2.5 text-xs font-bold text-white hover:bg-brand-cobalt transition active:scale-95 duration-150"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                <span>Edit Product</span>
              </button>
              <button
                onClick={() => {
                  deleteProduct(selectedProductDetails.id);
                  setSelectedProductDetails(null);
                }}
                className="flex-1 flex items-center justify-center space-x-2 rounded bg-error py-2.5 text-xs font-bold text-white hover:bg-error-container transition active:scale-95 duration-150"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Delete Product</span>
              </button>
            </div>
          </div>
        )}
      </MobileBottomSheet>

      {/* Mobile Bottom Sheet for adding/editing products */}
      <MobileBottomSheet
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingProduct(null);
          resetProductForm();
        }}
        title={editingProduct ? `Edit Product: ${editingProduct.name}` : 'Add New Product'}
      >
        {renderProductForm(true)}
      </MobileBottomSheet>

      {/* Mobile Bottom Sheet for Category Form */}
      <MobileBottomSheet
        isOpen={activeMobileForm === 'category'}
        onClose={() => {
          setActiveMobileForm(null);
        }}
        title="Add Product Category"
      >
        <form onSubmit={(e) => {
          e.preventDefault();
          if (!catName) return;
          setIsSavingCategory(true);
          api.categories.create({ name: catName })
            .then(() => {
              setCatName('');
              catPag.refresh();
              loadDropdowns();
              setIsSavingCategory(false);
              setActiveMobileForm(null);
              alert('Category created successfully!');
            })
            .catch((err) => {
              alert(err.message);
              setIsSavingCategory(false);
            });
        }} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Category Name</label>
            <input
              type="text"
              required
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-blue"
            />
          </div>
          <button
            type="submit"
            disabled={isSavingCategory}
            className="w-full rounded bg-brand-blue py-2 text-sm font-semibold text-white hover:bg-brand-cobalt transition flex items-center justify-center space-x-1.5 disabled:opacity-50 disabled:pointer-events-none"
          >
            {isSavingCategory && <Spinner size="sm" />}
            <span>{isSavingCategory ? 'Adding...' : 'Add Category'}</span>
          </button>
        </form>
      </MobileBottomSheet>

      {/* Mobile Bottom Sheet for Brand Form */}
      <MobileBottomSheet
        isOpen={activeMobileForm === 'brand'}
        onClose={() => {
          setActiveMobileForm(null);
        }}
        title="Add Brand"
      >
        <form onSubmit={(e) => {
          e.preventDefault();
          if (!brandName) return;
          setIsSavingBrand(true);
          api.brands.create({ name: brandName })
            .then(() => {
              setBrandName('');
              brandPag.refresh();
              loadDropdowns();
              setIsSavingBrand(false);
              setActiveMobileForm(null);
              alert('Brand created successfully!');
            })
            .catch((err) => {
              alert(err.message);
              setIsSavingBrand(false);
            });
        }} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Brand Name</label>
            <input
              type="text"
              required
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-blue"
            />
          </div>
          <button
            type="submit"
            disabled={isSavingBrand}
            className="w-full rounded bg-brand-blue py-2 text-sm font-semibold text-white hover:bg-brand-cobalt transition flex items-center justify-center space-x-1.5 disabled:opacity-50 disabled:pointer-events-none"
          >
            {isSavingBrand && <Spinner size="sm" />}
            <span>{isSavingBrand ? 'Adding...' : 'Add Brand'}</span>
          </button>
        </form>
      </MobileBottomSheet>

      {/* Mobile Bottom Sheet for Mobile Model Form */}
      <MobileBottomSheet
        isOpen={activeMobileForm === 'model'}
        onClose={() => {
          setActiveMobileForm(null);
          setTabModelBrand('');
          setTabSearchBrandQuery('');
          setTabNewModelName('');
        }}
        title="Add Mobile Model"
      >
        <form onSubmit={handleTabModelSubmit} className="space-y-4">
          <div ref={tabBrandDropdownRef} className="relative">
            <label className="block text-xs font-semibold text-text-secondary mb-1">Mobile Brand</label>
            <input
              type="text"
              placeholder="Search or type brand..."
              required
              value={tabSearchBrandQuery}
              onChange={(e) => {
                setTabSearchBrandQuery(e.target.value);
                setTabShowBrandDropdown(true);
                if (!e.target.value) {
                  setTabModelBrand('');
                }
              }}
              onFocus={() => setTabShowBrandDropdown(true)}
              className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-blue"
            />
            {tabShowBrandDropdown && (
              <div className="absolute z-30 w-full mt-1 bg-white border border-surface-dim rounded shadow-lg max-h-48 overflow-y-auto">
                {brandsDropdown
                  .filter(b => b.name.toLowerCase().includes(tabSearchBrandQuery.toLowerCase()))
                  .slice(0, 10)
                  .map(b => (
                    <div
                      key={b.id}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setTabModelBrand(b.id);
                        setTabSearchBrandQuery(b.name);
                        setTabShowBrandDropdown(false);
                      }}
                      className="px-3 py-2 hover:bg-surface-low text-xs cursor-pointer text-text-primary border-b border-surface-low last:border-b-0"
                    >
                      {b.name}
                    </div>
                  ))}
                {tabSearchBrandQuery.trim() && !brandsDropdown.some(b => b.name.toLowerCase() === tabSearchBrandQuery.trim().toLowerCase()) && (
                  <div
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setTabShowBrandDropdown(false);
                    }}
                    className="px-3 py-2 hover:bg-brand-blue/10 text-xs cursor-pointer text-brand-blue font-semibold border-b border-surface-low last:border-b-0"
                  >
                    + Use Brand "{tabSearchBrandQuery.trim()}" (will be created)
                  </div>
                )}
                {brandsDropdown.filter(b => b.name.toLowerCase().includes(tabSearchBrandQuery.toLowerCase())).length === 0 && !tabSearchBrandQuery.trim() && (
                  <div className="px-3 py-2 text-xs text-text-secondary">No brands found.</div>
                )}
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Model Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Galaxy S23"
              value={tabNewModelName}
              onChange={(e) => setTabNewModelName(e.target.value)}
              className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-blue"
            />
          </div>
          <button
            type="submit"
            disabled={isSavingTabModel}
            className="w-full rounded bg-brand-blue py-2 text-sm font-semibold text-white hover:bg-brand-cobalt transition flex items-center justify-center space-x-1.5 disabled:opacity-50 disabled:pointer-events-none"
          >
            {isSavingTabModel && <Spinner size="sm" />}
            <span>{isSavingTabModel ? 'Adding...' : 'Add Mobile Model'}</span>
          </button>
        </form>
      </MobileBottomSheet>

      {/* Mobile Create Menu Sheet */}
      <MobileBottomSheet
        isOpen={showCreateMenu}
        onClose={() => setShowCreateMenu(false)}
        title="Create New..."
      >
        <div className="space-y-3 pb-4">
          <button
            onClick={() => {
              setShowCreateMenu(false);
              setEditingProduct(null);
              resetProductForm();
              setShowForm(true);
            }}
            className="w-full flex items-center space-x-3 p-4 rounded-xl border border-surface-low hover:bg-surface-low text-left text-sm font-medium text-text-primary transition"
          >
            <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-brand-blue/10 text-brand-blue">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <div className="font-semibold">New Product</div>
              <div className="text-xs text-text-secondary">Add a new item to the product catalog</div>
            </div>
          </button>

          <button
            onClick={() => {
              setShowCreateMenu(false);
              setCatName('');
              setActiveMobileForm('category');
            }}
            className="w-full flex items-center space-x-3 p-4 rounded-xl border border-surface-low hover:bg-surface-low text-left text-sm font-medium text-text-primary transition"
          >
            <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-green-600/10 text-green-600">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </div>
            <div>
              <div className="font-semibold">New Category</div>
              <div className="text-xs text-text-secondary">Create a product classification category</div>
            </div>
          </button>

          <button
            onClick={() => {
              setShowCreateMenu(false);
              setBrandName('');
              setActiveMobileForm('brand');
            }}
            className="w-full flex items-center space-x-3 p-4 rounded-xl border border-surface-low hover:bg-surface-low text-left text-sm font-medium text-text-primary transition"
          >
            <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-purple-600/10 text-purple-600">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <div className="font-semibold">New Brand</div>
              <div className="text-xs text-text-secondary">Create a product manufacturer brand</div>
            </div>
          </button>

          <button
            onClick={() => {
              setShowCreateMenu(false);
              setModelBrand('');
              setNewModelName('');
              setActiveMobileForm('model');
            }}
            className="w-full flex items-center space-x-3 p-4 rounded-xl border border-surface-low hover:bg-surface-low text-left text-sm font-medium text-text-primary transition"
          >
            <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-orange-600/10 text-orange-600">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <div className="font-semibold">New Suitable Model</div>
              <div className="text-xs text-text-secondary">Create a suitable mobile model configuration</div>
            </div>
          </button>
        </div>
      </MobileBottomSheet>

      {/* Floating Action Button for mobile */}
      {((currentTab === 'products' && !showForm) ||
        ((currentTab === 'categories' || currentTab === 'brands' || currentTab === 'model') && !activeMobileForm)) && (
          <FloatingActionButton
            icon={
              currentTab === 'products' ? (
                <div className="relative">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <span className="absolute -top-1.5 -right-1.5 bg-white text-brand-blue rounded-full text-[9px] font-black h-4 w-4 flex items-center justify-center border border-brand-blue shadow-xs">+</span>
                </div>
              ) : currentTab === 'categories' ? (
                <div className="relative">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  <span className="absolute -top-1.5 -right-1.5 bg-white text-brand-blue rounded-full text-[9px] font-black h-4 w-4 flex items-center justify-center border border-brand-blue shadow-xs">+</span>
                </div>
              ) : currentTab === 'brands' ? (
                <div className="relative">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M6 20h12a2 2 0 002-2V9a2 2 0 00-2-2h-1a2 2 0 00-2-2H9a2 2 0 00-2 2H6a2 2 0 00-2 2v9a2 2 0 002 2z" />
                  </svg>
                  <span className="absolute -top-1.5 -right-1.5 bg-white text-brand-blue rounded-full text-[9px] font-black h-4 w-4 flex items-center justify-center border border-brand-blue shadow-xs">+</span>
                </div>
              ) : currentTab === 'model' ? (
                <div className="relative">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span className="absolute -top-1.5 -right-1.5 bg-white text-brand-blue rounded-full text-[9px] font-black h-4 w-4 flex items-center justify-center border border-brand-blue shadow-xs">+</span>
                </div>
              ) : null
            }
            onClick={() => {
              if (currentTab === 'products') {
                setEditingProduct(null);
                resetProductForm();
                setShowForm(true);
              } else if (currentTab === 'categories') {
                setCatName('');
                setActiveMobileForm('category');
              } else if (currentTab === 'brands') {
                setBrandName('');
                setActiveMobileForm('brand');
              } else if (currentTab === 'model') {
                setTabModelBrand('');
                setTabSearchBrandQuery('');
                setTabNewModelName('');
                setActiveMobileForm('model');
              }
            }}
          />
        )}

      {/* Full-screen Image Gallery Overlay */}
      {galleryImages.length > 0 && (
        <div className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4">
          {/* Close button */}
          <button
            onClick={() => setGalleryImages([])}
            className="absolute top-4 right-4 text-white hover:text-gray-300 p-2 rounded-full bg-black/40 hover:bg-black/60 transition cursor-pointer"
            aria-label="Close gallery"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Main Image Slider Area */}
          <div className="relative w-full max-w-2xl aspect-square md:aspect-video flex items-center justify-center">
            {galleryImages.length > 1 && (
              <button
                onClick={() => setActiveGalleryIndex(prev => (prev - 1 + galleryImages.length) % galleryImages.length)}
                className="absolute left-2 md:left-4 z-10 text-white p-3 rounded-full bg-black/40 hover:bg-black/60 hover:text-gray-300 transition cursor-pointer select-none"
                aria-label="Previous image"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            <img
              src={galleryImages[activeGalleryIndex]}
              alt={`Gallery image ${activeGalleryIndex + 1}`}
              className="max-h-[75vh] max-w-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-200"
            />

            {galleryImages.length > 1 && (
              <button
                onClick={() => setActiveGalleryIndex(prev => (prev + 1) % galleryImages.length)}
                className="absolute right-2 md:right-4 z-10 text-white p-3 rounded-full bg-black/40 hover:bg-black/60 hover:text-gray-300 transition cursor-pointer select-none"
                aria-label="Next image"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>

          {/* Dots Indicator */}
          {galleryImages.length > 1 && (
            <div className="mt-4 flex space-x-2">
              {galleryImages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveGalleryIndex(idx)}
                  className={`h-2 w-2 rounded-full transition-all duration-200 ${idx === activeGalleryIndex ? 'bg-white w-4' : 'bg-white/40'
                    }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          )}

          {/* Image Count Indicator */}
          <div className="mt-2 text-white/60 text-xs font-semibold">
            {activeGalleryIndex + 1} / {galleryImages.length}
          </div>
        </div>
      )}
    </div>
  );
}
