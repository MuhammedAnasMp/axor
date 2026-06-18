import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../utils/api';
import { usePagination } from '../utils/usePagination';
import PaginationControls from '../components/PaginationControls';

export default function Products() {
  const [searchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'products';

  // Dropdown states (unpaginated list)
  const [categoriesDropdown, setCategoriesDropdown] = useState([]);
  const [brandsDropdown, setBrandsDropdown] = useState([]);
  const [dropdownsLoading, setDropdownsLoading] = useState(true);

  // Supplier mapping Form states (with search)
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

  // Pagination hooks for each tab
  const prodPag = usePagination(api.products.list, 10, currentTab === 'products');
  const catPag = usePagination(api.categories.list, 10, currentTab === 'categories');
  const brandPag = usePagination(api.brands.list, 10, currentTab === 'brands');
  const mappingPag = usePagination(api.supplierProducts.list, 10, currentTab === 'mappings');
  const costHistoryPag = usePagination(api.supplierCostHistory.list, 10, currentTab === 'cost-history');

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

  const handleStartEdit = (p) => {
    setEditingProduct(p);
    setName(p.name);
    setBarcode(p.barcode);
    setDescription(p.description || '');
    setCategory(p.category || '');
    setBrand(p.brand || '');
    setSellingPrice(p.selling_price.toString());
    setImageUrls(p.image_url ? p.image_url.split(',') : []);
    setShowForm(true);
  };

  // Category Form
  const [catName, setCatName] = useState('');
  // Brand Form
  const [brandName, setBrandName] = useState('');

  // Supplier mapping Form states
  const [mapProduct, setMapProduct] = useState('');
  const [mapSupplier, setMapSupplier] = useState('');
  const [mapCost, setMapCost] = useState('0');

  const loadDropdowns = () => {
    setDropdownsLoading(true);
    // Call list without params so DRF does not paginate
    Promise.all([
      api.categories.list(),
      api.brands.list()
    ])
      .then(([c, b]) => {
        setCategoriesDropdown(c);
        setBrandsDropdown(b);
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
    const data = {
      name,
      barcode,
      description,
      category: category || null,
      brand: brand || null,
      selling_price: parseFloat(sellingPrice),
      image_url: imageUrls.length > 0 ? imageUrls.join(',') : null
    };

    const action = editingProduct
      ? api.products.update(editingProduct.id, data)
      : api.products.create(data);

    action
      .then(() => {
        setShowForm(false);
        setEditingProduct(null);
        setName('');
        setBarcode('');
        setDescription('');
        setCategory('');
        setBrand('');
        setSellingPrice('0');
        setImageUrls([]);
        prodPag.refresh();
        loadDropdowns();
        alert(editingProduct ? 'Product updated successfully!' : 'Product created successfully!');
      })
      .catch((err) => alert(err.message));
  };

  const handleMappingSubmit = (e) => {
    e.preventDefault();
    if (!mapProduct || !mapSupplier) return;
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
        alert('Supplier mapping saved successfully!');
      })
      .catch((err) => alert(err.message));
  };

  const deleteMapping = (id) => {
    if (confirm('Remove this supplier product mapping?')) {
      api.supplierProducts.delete(id)
        .then(() => mappingPag.refresh())
        .catch((err) => alert(err.message));
    }
  };

  const handleCategorySubmit = (e) => {
    e.preventDefault();
    if (!catName) return;
    api.categories.create({ name: catName })
      .then(() => {
        setCatName('');
        catPag.refresh();
        loadDropdowns();
      })
      .catch((err) => alert(err.message));
  };

  const handleBrandSubmit = (e) => {
    e.preventDefault();
    if (!brandName) return;
    api.brands.create({ name: brandName })
      .then(() => {
        setBrandName('');
        brandPag.refresh();
        loadDropdowns();
      })
      .catch((err) => alert(err.message));
  };

  const deleteProduct = (id) => {
    if (confirm('Delete this product?')) {
      api.products.delete(id)
        .then(() => prodPag.refresh())
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
          currentTab === 'mappings' ? mappingPag.loading :
            costHistoryPag.loading;

  return (
    <div className="space-y-6">
      {/* Title */}
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
                setName('');
                setBarcode('');
                setDescription('');
                setCategory('');
                setBrand('');
                setSellingPrice('0');
                setImageUrls([]);
              }
              setShowForm(!showForm);
            }}
            className="rounded bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-brand-cobalt transition"
          >
            {showForm ? 'Cancel' : 'Add Product'}
          </button>
        )}
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-surface-low space-x-6 text-sm font-medium">
        <a
          href="/erp/products"
          className={`pb-2 ${currentTab === 'products' ? 'border-b-2 border-brand-blue text-brand-blue' : 'text-text-secondary'}`}
        >
          Product Catalog
        </a>
        <a
          href="/erp/products?tab=mappings"
          className={`pb-2 ${currentTab === 'mappings' ? 'border-b-2 border-brand-blue text-brand-blue' : 'text-text-secondary'}`}
        >
          Supplier Mappings
        </a>
        <a
          href="/erp/products?tab=cost-history"
          className={`pb-2 ${currentTab === 'cost-history' ? 'border-b-2 border-brand-blue text-brand-blue' : 'text-text-secondary'}`}
        >
          Cost History
        </a>
        <a
          href="/erp/products?tab=categories"
          className={`pb-2 ${currentTab === 'categories' ? 'border-b-2 border-brand-blue text-brand-blue' : 'text-text-secondary'}`}
        >
          Categories
        </a>
        <a
          href="/erp/products?tab=brands"
          className={`pb-2 ${currentTab === 'brands' ? 'border-b-2 border-brand-blue text-brand-blue' : 'text-text-secondary'}`}
        >
          Brands
        </a>
      </div>

      {/* Product Catalog Tab */}
      {currentTab === 'products' && (
        <div className="space-y-6">
          {/* Add Product Form */}
          {showForm && (
            <form onSubmit={handleProductSubmit} className="rounded-lg bg-white p-6 shadow-sm border border-surface-low space-y-4">
              <h3 className="text-sm font-semibold text-text-primary">{editingProduct ? `Edit Product: ${editingProduct.name}` : 'Add New Product'}</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
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
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Brand</label>
                  <select
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-blue"
                  >
                    <option value="">Select Brand</option>
                    {brandsDropdown.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
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
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-blue"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Product Images</label>
                  <div className="space-y-3">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="text-xs text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-accent-blue/10 file:text-brand-blue hover:file:bg-accent-blue/20"
                    />
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
                className="rounded bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-brand-cobalt transition"
              >
                Save Product
              </button>
            </form>
          )}

          {/* Search bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-t-lg border-t border-x border-surface-low">
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                value={prodPag.search}
                onChange={(e) => prodPag.setSearch(e.target.value)}
                placeholder="Search products using name/barcode..."
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

          {/* Product Grid / List */}
          <div className="rounded-b-lg bg-white border-x border-b border-surface-low overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-surface-low text-text-secondary font-semibold uppercase">
                <tr>
                  <th className="px-4 py-2">Image</th>
                  {renderSortHeader('Barcode', 'barcode', prodPag)}
                  {renderSortHeader('Name', 'name', prodPag)}
                  <th className="px-4 py-2">Category / Brand</th>
                  {renderSortHeader('RRP Selling', 'selling_price', prodPag)}
                  {renderSortHeader('Average Cost', 'average_cost', prodPag)}
                  {renderSortHeader('Last Landed Cost', 'last_landed_cost', prodPag)}
                  <th className="px-4 py-2 text-right">Stock</th>
                  <th className="px-4 py-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-low">
                {prodPag.data.map((p) => (
                  <tr key={p.id} className="hover:bg-surface-bright">
                    <td className="px-4 py-3">
                      <div className="h-10 w-10 rounded bg-surface border border-surface-low overflow-hidden">
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
                    <td className="px-4 py-3 font-mono font-medium">{p.barcode}</td>
                    <td className="px-4 py-3 font-semibold text-text-primary">{p.name}</td>
                    <td className="px-4 py-3 text-text-secondary">
                      {p.category_name || '-'} / {p.brand_name || '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-text-primary">{formatCurrency(p.selling_price)}</td>
                    <td className="px-4 py-3 text-right text-text-secondary">{formatCurrency(p.average_cost)}</td>
                    <td className="px-4 py-3 text-right text-text-secondary">{formatCurrency(p.last_landed_cost)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-semibold ${p.stock_qty < 10 ? 'text-error' : 'text-text-primary'}`}>
                        {p.stock_qty}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center space-x-2">
                      <button
                        onClick={() => handleStartEdit(p)}
                        className="rounded bg-brand-blue/10 px-2 py-1 text-[11px] font-semibold text-brand-blue hover:bg-brand-blue/20 transition font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteProduct(p.id)}
                        className="rounded bg-error-container/10 px-2 py-1 text-[11px] font-semibold text-error hover:bg-error-container/20 transition"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {prodPag.data.length === 0 && !prodPag.loading && (
                  <tr>
                    <td colSpan="9" className="px-4 py-8 text-center text-text-secondary">No products found.</td>
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
            />
          </div>
        </div>
      )}

      {/* Categories Tab */}
      {currentTab === 'categories' && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Add Category */}
          <div className="rounded-lg bg-white p-6 shadow-sm border border-surface-low h-fit" style={{ boxShadow: '0px 1px 3px rgba(0,0,0,0.1)' }}>
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
                className="w-full rounded bg-brand-blue py-2 text-sm font-semibold text-white hover:bg-brand-cobalt transition"
              >
                Add Category
              </button>
            </form>
          </div>

          {/* Categories List */}
          <div className="rounded-lg bg-white p-6 shadow-sm md:col-span-2" style={{ boxShadow: '0px 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 className="text-sm font-semibold text-text-primary mb-4">Category List</h3>

            {/* Search and Loading */}
            <div className="flex items-center justify-between mb-4 gap-4">
              <input
                type="text"
                value={catPag.search}
                onChange={(e) => catPag.setSearch(e.target.value)}
                placeholder="Search categories..."
                className="rounded border border-surface-dim bg-white px-3 py-1.5 text-xs text-text-primary outline-none focus:border-brand-blue w-64"
              />
              {activeLoading && <span className="text-xs text-brand-blue animate-pulse">Loading...</span>}
            </div>

            <div className="divide-y divide-surface-low text-xs border border-surface-low rounded-lg bg-white overflow-hidden">
              <table className="min-w-full text-left text-xs">
                <thead className="bg-surface-low text-text-secondary font-semibold uppercase">
                  <tr>
                    {renderSortHeader('Category Name', 'name', catPag)}
                    <th className="px-4 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-low">
                  {catPag.data.map((c) => (
                    <tr key={c.id} className="hover:bg-surface-bright">
                      <td className="px-4 py-3 font-semibold text-text-primary">{c.name}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => {
                            if (confirm('Delete category?')) {
                              api.categories.delete(c.id).then(() => {
                                catPag.refresh();
                                loadDropdowns();
                              }).catch((e) => alert(e.message));
                            }
                          }}
                          className="text-error hover:underline font-semibold"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
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
              />
            </div>
          </div>
        </div>
      )}

      {/* Brands Tab */}
      {currentTab === 'brands' && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Add Brand */}
          <div className="rounded-lg bg-white p-6 shadow-sm border border-surface-low h-fit" style={{ boxShadow: '0px 1px 3px rgba(0,0,0,0.1)' }}>
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
                className="w-full rounded bg-brand-blue py-2 text-sm font-semibold text-white hover:bg-brand-cobalt transition"
              >
                Add Brand
              </button>
            </form>
          </div>

          {/* Brands List */}
          <div className="rounded-lg bg-white p-6 shadow-sm md:col-span-2" style={{ boxShadow: '0px 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 className="text-sm font-semibold text-text-primary mb-4">Brands Directory</h3>

            {/* Search and Loading */}
            <div className="flex items-center justify-between mb-4 gap-4">
              <input
                type="text"
                value={brandPag.search}
                onChange={(e) => brandPag.setSearch(e.target.value)}
                placeholder="Search brands..."
                className="rounded border border-surface-dim bg-white px-3 py-1.5 text-xs text-text-primary outline-none focus:border-brand-blue w-64"
              />
              {activeLoading && <span className="text-xs text-brand-blue animate-pulse">Loading...</span>}
            </div>

            <div className="divide-y divide-surface-low text-xs border border-surface-low rounded-lg bg-white overflow-hidden">
              <table className="min-w-full text-left text-xs">
                <thead className="bg-surface-low text-text-secondary font-semibold uppercase">
                  <tr>
                    {renderSortHeader('Brand Name', 'name', brandPag)}
                    <th className="px-4 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-low">
                  {brandPag.data.map((b) => (
                    <tr key={b.id} className="hover:bg-surface-bright">
                      <td className="px-4 py-3 font-semibold text-text-primary">{b.name}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => {
                            if (confirm('Delete brand?')) {
                              api.brands.delete(b.id).then(() => {
                                brandPag.refresh();
                                loadDropdowns();
                              }).catch((e) => alert(e.message));
                            }
                          }}
                          className="text-error hover:underline font-semibold"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
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
              />
            </div>
          </div>
        </div>
      )}
      {/* Supplier Mappings Tab */}
      {currentTab === 'mappings' && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Add Supplier Product Mapping */}
          <div className="rounded-lg bg-white p-6 shadow-sm border border-surface-low h-fit" style={{ boxShadow: '0px 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 className="text-sm font-semibold text-text-primary mb-4">Link Supplier to SKU</h3>
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
                    className="w-full rounded border border-surface-dim bg-white pl-3 pr-8 py-2 text-sm text-text-primary outline-none focus:border-brand-blue"
                    required={!mapProduct}
                  />
                  {mapProductSearching && (
                    <span className="absolute right-8 top-2.5 text-[10px] text-brand-blue animate-pulse">Searching...</span>
                  )}
                  <span className="absolute right-2.5 top-2.5 text-text-secondary pointer-events-none">
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
                          {p.name} ({p.barcode})
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
                    className="w-full rounded border border-surface-dim bg-white pl-3 pr-8 py-2 text-sm text-text-primary outline-none focus:border-brand-blue"
                    required={!mapSupplier}
                  />
                  {mapSupplierSearching && (
                    <span className="absolute right-8 top-2.5 text-[10px] text-brand-blue animate-pulse">Searching...</span>
                  )}
                  <span className="absolute right-2.5 top-2.5 text-text-secondary pointer-events-none">
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
                className="w-full rounded bg-brand-blue py-2 text-sm font-semibold text-white hover:bg-brand-cobalt transition"
              >
                Save Supplier Mapping
              </button>
            </form>
          </div>

          {/* Mappings List */}
          <div className="rounded-lg bg-white p-6 shadow-sm md:col-span-2" style={{ boxShadow: '0px 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 className="text-sm font-semibold text-text-primary mb-4">Supplier-Product Matrix</h3>

            {/* Search and Loading */}
            <div className="flex items-center justify-between mb-4 gap-4">
              <input
                type="text"
                value={mappingPag.search}
                onChange={(e) => mappingPag.setSearch(e.target.value)}
                placeholder="Search matrix by product/supplier..."
                className="rounded border border-surface-dim bg-white px-3 py-1.5 text-xs text-text-primary outline-none focus:border-brand-blue w-64"
              />
              {activeLoading && <span className="text-xs text-brand-blue animate-pulse">Loading...</span>}
            </div>

            <div className="divide-y divide-surface-low text-xs border border-surface-low rounded-lg bg-white overflow-hidden">
              <table className="min-w-full text-left text-xs">
                <thead className="bg-surface-low text-text-secondary font-semibold uppercase">
                  <tr>
                    {renderSortHeader('Product SKU', 'product__name', mappingPag)}
                    <th>Barcode</th>
                    <th>Supplier</th>
                    {renderSortHeader('Negotiated Cost', 'current_cost', mappingPag)}
                    <th className="px-4 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-low">
                  {mappingPag.data.map((m) => (
                    <tr key={m.id} className="hover:bg-surface-bright">
                      <td className="px-4 py-3 font-semibold text-text-primary">{m.product_name}</td>
                      <td className="px-4 py-3 text-text-secondary font-mono">{m.barcode}</td>
                      <td className="px-4 py-3 text-text-primary">{m.supplier_name}</td>
                      <td className="px-4 py-3 font-bold text-brand-blue">{formatCurrency(m.current_cost)}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => deleteMapping(m.id)}
                          className="text-error hover:underline font-semibold"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                  {mappingPag.data.length === 0 && !mappingPag.loading && (
                    <tr>
                      <td colSpan="5" className="px-4 py-8 text-center text-text-secondary">No supplier product mappings established.</td>
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
              />
            </div>
          </div>
        </div>
      )}

      {/* Cost History Tab */}
      {currentTab === 'cost-history' && (
        <div className="rounded-lg bg-white p-6 shadow-sm border border-surface-low" style={{ boxShadow: '0px 1px 3px rgba(0,0,0,0.1)' }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-semibold text-text-primary">Supplier Cost Price Fluctuation History</h3>
            {activeLoading && <span className="text-xs text-brand-blue animate-pulse">Loading...</span>}
          </div>

          <div className="flex items-center justify-between mb-4 gap-4">
            <input
              type="text"
              value={costHistoryPag.search}
              onChange={(e) => costHistoryPag.setSearch(e.target.value)}
              placeholder="Search history by product or supplier..."
              className="rounded border border-surface-dim bg-white px-3 py-1.5 text-xs text-text-primary outline-none focus:border-brand-blue w-64"
            />
          </div>

          <div className="divide-y divide-surface-low text-xs border border-surface-low rounded-lg bg-white overflow-hidden">
            <table className="min-w-full text-left text-xs">
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
                {costHistoryPag.data.map((h) => (
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
                ))}
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
            />
          </div>
        </div>
      )}
    </div>
  );
}
