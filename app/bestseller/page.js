"use client";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useState, useEffect } from "react";
import { Package, ArrowLeft, RefreshCw, Filter, X, Check } from "lucide-react";
import ProductCard from "../components/ProductCard";
import EditProductModal from "../components/EditProductModal";
import useAuthStore from "../../lib/store/authStore";
import toast from "react-hot-toast";
import Link from "next/link";

export default function Bestsellers() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [sortBy, setSortBy] = useState("featured");
  const [sortOrder, setSortOrder] = useState("desc");
  const [editingProduct, setEditingProduct] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states 
  const [tempFilters, setTempFilters] = useState({
    category: "",
    minPrice: "",
    maxPrice: ""
  });
  
  const [appliedFilters, setAppliedFilters] = useState({
    category: "",
    minPrice: "",
    maxPrice: ""
  });

  const { token } = useAuthStore();

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const productsPerPage = 8;

  // Categories for filter dropdown
  const categories = [
    { value: "", label: "All Categories" },
    { value: "Handbags", label: "Handbags" },
    { value: "Shoulder Bags", label: "Shoulder Bags" },
    { value: "Tote Bags", label: "Tote Bags" },
    { value: "Clutches", label: "Clutches" },
    { value: "Evening", label: "Evening" },
    { value: "Travel", label: "Travel" },
    { value: "Travel Bags", label: "Travel Bags" },
    { value: "Accessories", label: "Accessories" }
  ];

  useEffect(() => {
    fetchBestsellerProducts();
  }, [currentPage, sortBy, sortOrder, appliedFilters]);

  useEffect(() => {
    if (showFilters) {
      setTempFilters({ ...appliedFilters });
    }
  }, [showFilters, appliedFilters]);

  const fetchBestsellerProducts = async () => {
    try {
      setLoading(true);
      console.log('Fetching bestseller products...');
      
      let apiUrl = `${BACKEND_URL}/api/products?bestseller=true&page=${currentPage}&limit=${productsPerPage}`;
      
      if (sortBy && sortOrder) {
        apiUrl += `&sortBy=${sortBy}&sortOrder=${sortOrder}`;
      }
      
      if (appliedFilters.category) {
        apiUrl += `&category=${encodeURIComponent(appliedFilters.category)}`;
      }
      if (appliedFilters.minPrice) {
        apiUrl += `&minPrice=${appliedFilters.minPrice}`;
      }
      if (appliedFilters.maxPrice) {
        apiUrl += `&maxPrice=${appliedFilters.maxPrice}`;
      }
      
      console.log('Bestseller API URL:', apiUrl);
      
      const response = await fetch(apiUrl);
      const data = await response.json();
      
      console.log('Bestseller API response:', data);
      
      if (data.success) {
        const products = data.data.products || [];
        const pagination = data.data.pagination || {};
        
        setProducts(products);
        setTotalPages(pagination.totalPages || 1);
        setTotalProducts(pagination.totalProducts || 0);
      } else {
        setProducts([]);
        setTotalPages(1);
        setTotalProducts(0);
      }
    } catch (error) {
      console.error('Error fetching bestseller products:', error);
      setProducts([]);
      setTotalPages(1);
      setTotalProducts(0);
    } finally {
      setLoading(false);
    }
  };

  const handleTempFilterChange = (key, value) => {
    setTempFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const applyFilters = () => {
    setAppliedFilters({ ...tempFilters });
    setCurrentPage(1); 
    setShowFilters(false); 
    toast.success('Filters applied successfully!');
  };

  const clearAllFilters = () => {
    const emptyFilters = {
      category: "",
      minPrice: "",
      maxPrice: ""
    };
    setTempFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setCurrentPage(1);
    toast.success('All filters cleared!');
  };

  const clearAppliedFilter = (key) => {
    const newFilters = { ...appliedFilters, [key]: "" };
    setAppliedFilters(newFilters);
    setCurrentPage(1);
  };

  const hasActiveFilters = () => {
    return appliedFilters.category || appliedFilters.minPrice || appliedFilters.maxPrice;
  };

  const hasUnsavedChanges = () => {
    return JSON.stringify(tempFilters) !== JSON.stringify(appliedFilters);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setIsEditModalOpen(true);
  };

  const handleDeleteProduct = async (product) => {
    if (!token) {
      toast.error('Authentication required');
      return;
    }

    if (!confirm(`Are you sure you want to delete "${product.title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/products/${product._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Product deleted successfully!');
        fetchBestsellerProducts();
      } else {
        throw new Error(data.message || 'Failed to delete product');
      }
    } catch (error) {
      console.error('Delete product error:', error);
      toast.error(error.message || 'Failed to delete product');
    }
  };

  const handleProductUpdate = (updatedProduct) => {
    setProducts(prev => prev.map(p => 
      p._id === updatedProduct._id ? updatedProduct : p
    ));
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSortChange = (e) => {
    const value = e.target.value;
    if (value === "price-low") {
      setSortBy("price");
      setSortOrder("asc");
    } else if (value === "price-high") {
      setSortBy("price");
      setSortOrder("desc");
    } else if (value === "newest") {
      setSortBy("createdAt");
      setSortOrder("desc");
    } else {
      setSortBy("featured");
      setSortOrder("desc");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-gray-900 font-sans">
        <Header />
        <div className="pt-16">
          {/* Bestsellers Header */}
          <section className="px-4 md:px-8 py-12 md:py-16 bg-gray-50">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-3xl md:text-4xl font-semibold mb-4">
                Bestsellers
              </h1>
              <p className="text-gray-600 max-w-2xl text-base md:text-lg">
                Loading our most loved pieces...
              </p>
            </div>
          </section>

          {/* Filter Section */}
          <section className="px-4 md:px-8 py-6 border-b border-gray-200">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <p className="text-gray-600 text-sm">Loading products...</p>
            </div>
          </section>

          {/* Products Grid Loading */}
          <section className="px-4 md:px-8 py-12 md:py-16">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                {[...Array(8)].map((_, index) => (
                  <div key={index} className="flex flex-col animate-pulse">
                    <div className="w-full h-64 sm:h-72 bg-gray-200"></div>
                    <div className="mt-4 h-4 bg-gray-200 rounded"></div>
                    <div className="mt-2 h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      <Header />

      <div className="pt-16">
        {/* Bestsellers Header */}
        <section className="px-4 md:px-8 py-12 md:py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-semibold mb-4">
              Bestsellers
            </h1>
            <p className="text-gray-600 max-w-2xl text-base md:text-lg">
              Our most loved pieces, chosen by discerning customers worldwide. 
              Each bestseller represents the perfect blend of Italian craftsmanship 
              and timeless design.
            </p>
          </div>
        </section>

        {/* Filter Section */}
        <section className="px-4 md:px-8 py-6 border-b border-gray-200">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <p className="text-gray-600 text-sm">
                {products.length > 0 
                  ? `Showing ${products.length} bestselling products out of ${totalProducts}`
                  : 'No bestselling products found'
                }
              </p>
              
              {/* Filter & Sort Controls */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
                >
                  <Filter className="w-4 h-4" />
                  Filters
                  {hasActiveFilters() && (
                    <span className="bg-black text-white text-xs w-5 h-5 flex items-center justify-center">
                      !
                    </span>
                  )}
                </button>

                {/* Sort Dropdown */}
                <select 
                  className="border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:border-gray-900"
                  value={sortBy === "price" ? (sortOrder === "asc" ? "price-low" : "price-high") : sortBy}
                  onChange={handleSortChange}
                >
                  <option value="featured">Sort by: Featured</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="newest">Newest</option>
                </select>
              </div>
            </div>

            {/* Active Applied Filters Display */}
            {hasActiveFilters() && (
              <div className="mt-4 flex flex-wrap gap-2">
                {appliedFilters.category && (
                  <span className="bg-gray-800 text-white px-3 py-1 text-sm flex items-center gap-1">
                    Category: {categories.find(c => c.value === appliedFilters.category)?.label}
                    <button
                      onClick={() => clearAppliedFilter('category')}
                      className="text-white hover:text-gray-200 ml-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {appliedFilters.minPrice && (
                  <span className="bg-gray-800 text-white px-3 py-1 text-sm flex items-center gap-1">
                    Min: ${appliedFilters.minPrice}
                    <button
                      onClick={() => clearAppliedFilter('minPrice')}
                      className="text-white hover:text-gray-200 ml-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {appliedFilters.maxPrice && (
                  <span className="bg-gray-800 text-white px-3 py-1 text-sm flex items-center gap-1">
                    Max: ${appliedFilters.maxPrice}
                    <button
                      onClick={() => clearAppliedFilter('maxPrice')}
                      className="text-white hover:text-gray-200 ml-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {hasActiveFilters() && (
                  <button
                    onClick={clearAllFilters}
                    className="text-gray-600 hover:text-gray-900 text-sm flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    Clear All
                  </button>
                )}
              </div>
            )}

            {/* Filters Panel */}
            {showFilters && (
              <div className="mt-6 bg-white p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Filter Products</h3>
                  <div className="flex items-center gap-3">
                    {hasUnsavedChanges() && (
                      <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1">
                        Unsaved changes
                      </span>
                    )}
                    <button
                      onClick={() => setShowFilters(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Category Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={tempFilters.category}
                      onChange={(e) => handleTempFilterChange('category', e.target.value)}
                      className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-gray-900"
                    >
                      {categories.map(cat => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Min Price Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Min Price ($)
                    </label>
                    <input
                      type="number"
                      value={tempFilters.minPrice}
                      onChange={(e) => handleTempFilterChange('minPrice', e.target.value)}
                      placeholder="0"
                      className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-gray-900"
                      min="0"
                    />
                  </div>

                  {/* Max Price Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Price ($)
                    </label>
                    <input
                      type="number"
                      value={tempFilters.maxPrice}
                      onChange={(e) => handleTempFilterChange('maxPrice', e.target.value)}
                      placeholder="10000"
                      className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-gray-900"
                      min="0"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-between items-center pt-4 border-t border-gray-200">
                  <button
                    onClick={clearAllFilters}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-medium px-4 py-2 hover:bg-gray-50 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Clear All Filters
                  </button>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowFilters(false)}
                      className="px-6 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={applyFilters}
                      disabled={!hasUnsavedChanges()}
                      className="flex items-center gap-2 px-6 py-2 bg-black text-white hover:bg-gray-800 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      <Check className="w-4 h-4" />
                      Apply Filters
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Products Grid */}
        <section className="px-4 md:px-8 py-12 md:py-16">
          <div className="max-w-7xl mx-auto">
            {products.length === 0 ? (
              <div className="text-center py-16">
                <div className="flex justify-center mb-6">
                  <Package className="w-16 h-16 text-gray-400" />
                </div>
                <h2 className="text-2xl font-semibold mb-4">No Bestsellers Found</h2>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  We couldn't find any bestselling products at the moment.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  {hasActiveFilters() && (
                    <button 
                      onClick={clearAllFilters}
                      className="flex items-center gap-2 bg-black text-white px-6 py-3 font-medium hover:bg-gray-800 transition"
                    >
                      <X className="w-4 h-4" />
                      Clear Filters
                    </button>
                  )}
                  <Link href="/shop">
                    <button className="flex items-center gap-2 bg-black text-white px-6 py-3 font-medium hover:bg-gray-800 transition">
                      <ArrowLeft className="w-4 h-4" />
                      Browse All Products
                    </button>
                  </Link>
                  <button 
                    onClick={() => window.location.reload()} 
                    className="flex items-center gap-2 border border-gray-300 px-6 py-3 font-medium hover:bg-gray-50 transition"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh Page
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                  {products.map((product) => (
                    <ProductCard
                      key={product._id}
                      product={product}
                      onEdit={handleEditProduct}
                      onDelete={handleDeleteProduct}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-10 flex items-center justify-center space-x-3">
                    <button 
                      className="p-2 text-gray-500 hover:bg-gray-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    
                    <div className="inline-flex items-center divide-x border border-gray-200">
                      {[...Array(totalPages)].map((_, index) => (
                        <button
                          key={index + 1}
                          className={`px-4 py-2 transition-colors duration-200 ${
                            currentPage === index + 1
                              ? 'bg-[#b9965d] text-white font-medium'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                          onClick={() => handlePageChange(index + 1)}
                        >
                          {index + 1}
                        </button>
                      ))}
                    </div>
                    
                    <button 
                      className="p-2 text-gray-500 hover:bg-gray-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* Edit Product Modal */}
        <EditProductModal
          product={editingProduct}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingProduct(null);
          }}
          onUpdate={handleProductUpdate}
        />

        <Footer />
      </div>
    </div>
  );
}