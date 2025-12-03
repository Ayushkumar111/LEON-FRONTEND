"use client";
import { Search, User, ShoppingCart, Menu, Heart } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import useAuthStore from "../../lib/store/authStore";
import useWishlistStore from "../../lib/store/wishlistStore";
import useCartStore from "../../lib/store/cartStore";
import toast from 'react-hot-toast';
import { useRouter } from "next/navigation";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef(null);
  const backdropRef = useRef(null);
  const router = useRouter();

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  // Zustand stores - DIRECTLY USE THE CART FROM STORE
  const { user, logout, isAuthenticated, checkTokenExpiry } = useAuthStore();
  const { getWishlistCount } = useWishlistStore();
  const { cart, getCartCount } = useCartStore();

  // SIMPLE CART COUNT - DIRECT FROM STORE
  const cartCount = isAuthenticated() ? getCartCount() : 0;

  // FORCE RE-RENDER WHEN CART CHANGES
  const [forceUpdate, setForceUpdate] = useState(0);
  
  useEffect(() => {
    // Token expiry check on component mount
    const isExpired = checkTokenExpiry();
    if (isExpired) {
      console.log('Token expired detected in Header');
    }
    
    // Subscribe to cart store changes
    const unsubscribe = useCartStore.subscribe(
      (state) => state.cart,
      (cart) => {
        console.log('🔄 Header detected cart change:', cart?.itemCount);
        setForceUpdate(prev => prev + 1); // Force re-render
      }
    );

    return () => {
      unsubscribe();
    };
  }, [checkTokenExpiry]);

  // Also update when auth changes
  useEffect(() => {
    console.log('🔐 Auth state changed, cart count:', getCartCount());
    // Check token expiry when auth state changes
    checkTokenExpiry();
  }, [isAuthenticated, getCartCount, checkTokenExpiry]);

  // Close on ESC
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") {
        setIsSearchOpen(false);
        setIsMenuOpen(false);
        setSearchQuery("");
        setSearchResults([]);
        setHasSearched(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Click outside the card to close 
  function handleBackdropDown(e) {
    if (e.target === backdropRef.current) {
      setIsSearchOpen(false);
      setSearchQuery("");
      setSearchResults([]);
      setHasSearched(false);
    }
  }

  // Focus input when open
  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 60);
      setSearchResults([]);
      setHasSearched(false);
    }
  }, [isSearchOpen]);

  // Search functionality 
  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    try {
      setIsSearching(true);
      setHasSearched(true);
      
      const response = await fetch(`${BACKEND_URL}/api/products?search=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.data && data.data.products) {
        setSearchResults(data.data.products);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      toast.error('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      handleSearch(searchQuery);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchOpen(false);
      router.push(`/shop?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
      setSearchResults([]);
      setHasSearched(false);
    }
  };

  const handleProductClick = (product) => {
    setIsSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
    setHasSearched(false);
    
    const categorySlug = getSlugFromCategory(product.category);
    router.push(`/shop/${categorySlug}/${product._id}`);
  };

  const getSlugFromCategory = (category) => {
    const slugMap = {
      'Handbags': 'handbags',
      'Handbag': 'handbags',
      'Shoulder Bags': 'shoulder',
      'Tote Bags': 'tote', 
      'Clutches': 'clutch',
      'Clutch': 'clutch',
      'Evening': 'evening',
      'Travel': 'travel',
      'Accessories': 'accessories'
    };
    return slugMap[category] || 'handbags';
  };

  const handleCategoryClick = (categoryName) => {
    setIsSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
    setHasSearched(false);
    
    const categorySlug = getSlugFromCategory(categoryName);
    
    router.push(`/shop/${categorySlug}`);
  };

  const handleTrendingSearchClick = (term) => {
    setIsSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
    setHasSearched(false);
    
    router.push(`/shop?search=${encodeURIComponent(term)}`);
  };

  const handleFeaturedClick = (term) => {
    setIsSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
    setHasSearched(false);
    
    if (term.toLowerCase() === 'bestseller') {
      router.push('/bestseller');
    } else {
      router.push(`/shop?search=${encodeURIComponent(term)}`);
    }
  };

  function handleMobileSearchClick() {
    setIsMenuOpen(false);
    setTimeout(() => setIsSearchOpen(true), 100);
  }

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
    toast.success('Successfully logged out!');
  };

  const getUserInitials = () => {
    if (!user?.name) return 'U';
    return user.name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <header className="fixed top-0 left-0 w-full flex justify-between items-center px-4 md:px-8 py-3 md:py-4 bg-white/90 backdrop-blur-sm z-50">
        <div className="w-6 md:w-auto md:flex-1" />

        <Link href="/" className="cursor-pointer">
          <h1 className="text-3xl md:text-5xl font-normal tracking-wide italianno-regular text-center">
            León Bianco
          </h1>
        </Link>

        <div className="flex items-center gap-4 md:gap-6 text-gray-700 md:flex-1 md:justify-end">
          <button
            aria-label="Open search"
            onClick={() => setIsSearchOpen(true)}
            className="hidden md:inline-flex items-center"
          >
            <Search className="w-5 h-5 cursor-pointer" />
          </button>

          {isAuthenticated() && (
            <Link href="/profile#wishlist" className="hidden md:flex items-center cursor-pointer relative">
              <Heart className="w-5 h-5" />
              {getWishlistCount() > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {getWishlistCount()}
                </span>
              )}
            </Link>
          )}

          {isAuthenticated() ? (
            <Link href="/profile" className="hidden md:flex items-center cursor-pointer">
              <div className="w-8 h-8 bg-gray-800 text-white flex items-center justify-center text-sm font-medium rounded-full">
                {getUserInitials()}
              </div>
            </Link>
          ) : (
            <Link href="/auth" className="hidden md:block">
              <User className="w-5 h-5 cursor-pointer" />
            </Link>
          )}
          
          {isAuthenticated() && (
            <Link href="/cart" className="hidden md:block relative">
              <ShoppingCart className="w-5 h-5 cursor-pointer" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>
          )}

          <Menu
            className="w-6 h-6 cursor-pointer md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          />
        </div>
      </header>

      {/* Mobile menu and search components remain the same */}
      {isMenuOpen && (
        <div className="fixed top-14 left-0 w-full bg-white/95 backdrop-blur-sm z-40 md:hidden">
          <div className="px-4 py-4 space-y-4">
            <div 
              className="flex items-center gap-3 border-b pb-3 cursor-pointer"
              onClick={handleMobileSearchClick}
            >
              <Search className="w-5 h-5" />
              <span>Search</span>
            </div>
            
            {isAuthenticated() && (
              <Link 
                href="/profile#wishlist" 
                className="flex items-center gap-3 border-b pb-3" 
                onClick={() => setIsMenuOpen(false)}
              >
                <Heart className="w-5 h-5" />
                <span>Wishlist {getWishlistCount() > 0 && `(${getWishlistCount()})`}</span>
              </Link>
            )}
            
            {isAuthenticated() ? (
              <>
                <div className="border-b pb-3">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-gray-800 text-white flex items-center justify-center text-sm font-medium">
                      {getUserInitials()}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{user?.name}</p>
                      <p className="text-xs text-gray-600">{user?.email}</p>
                    </div>
                  </div>
                </div>
                
                <Link 
                  href="/profile" 
                  className="flex items-center gap-3 border-b pb-3" 
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User className="w-5 h-5" />
                  <span>My Profile</span>
                </Link>
                
                <Link 
                  href="/cart" 
                  className="flex items-center gap-3 border-b pb-3 relative" 
                  onClick={() => setIsMenuOpen(false)}
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>Cart {cartCount > 0 && `(${cartCount})`}</span>
                </Link>
                
                <div 
                  className="flex items-center gap-3 border-b pb-3 cursor-pointer"
                  onClick={handleLogout}
                >
                  <span className="w-5 h-5 flex items-center justify-center">🚪</span>
                  <span>Logout</span>
                </div>
              </>
            ) : (
              <Link 
                href="/auth" 
                className="flex items-center gap-3 border-b pb-3" 
                onClick={() => setIsMenuOpen(false)}
              >
                <User className="w-5 h-5" />
                <span>Account</span>
              </Link>
            )}
            
            <div className="space-y-2 pt-2">
              <div className="font-medium">Collections</div>
              <Link 
                href="/shop/handbags" 
                className="block text-sm text-gray-600 pl-2" 
                onClick={() => setIsMenuOpen(false)}
              >
                Hand Bags
              </Link>
              <Link 
                href="/shop/shoulder" 
                className="block text-sm text-gray-600 pl-2" 
                onClick={() => setIsMenuOpen(false)}
              >
                Shoulder Bags
              </Link>
              <Link 
                href="/shop/tote" 
                className="block text-sm text-gray-600 pl-2" 
                onClick={() => setIsMenuOpen(false)}
              >
                Tote Bags
              </Link>
              <Link 
                href="/shop/clutch" 
                className="block text-sm text-gray-600 pl-2" 
                onClick={() => setIsMenuOpen(false)}
              >
                Clutches
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Search modal code remains exactly the same */}
      {isSearchOpen && (
        <div
          ref={backdropRef}
          onMouseDown={handleBackdropDown}
          className="fixed inset-0 z-50 flex justify-center items-start pt-20 px-4 md:px-8"
          role="dialog"
          aria-modal="true"
        >
          <div className="absolute inset-0 bg-black/20 transition-opacity" />

          <div
            className="relative w-full max-w-[1100px] md:ml-auto md:mr-24 bg-white shadow-2xl border border-gray-100 search-card-mobile max-h-[80vh] overflow-hidden"
            style={{ minHeight: 220 }}
          >
            <div className="p-5 md:p-6 border-b border-gray-100">
              <form onSubmit={handleSearchSubmit} className="flex items-start gap-4">
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search for products, brands, categories..."
                    className="w-full border border-gray-300 px-3 py-3 text-sm focus:outline-none focus:border-gray-900 pr-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setSearchResults([]);
                        setHasSearched(false);
                      }}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsSearchOpen(false);
                    setSearchQuery("");
                    setSearchResults([]);
                    setHasSearched(false);
                  }}
                  className="text-sm font-semibold tracking-wide mt-1 cursor-pointer whitespace-nowrap"
                >
                  Cancel
                </button>
              </form>
            </div>

            <div className="overflow-y-auto max-h-[60vh]">
              {isSearching ? (
                <div className="p-8 text-center text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                  <p className="text-lg font-medium mb-2">Searching for "{searchQuery}"</p>
                  <p className="text-sm text-gray-400">Please wait while we find the best products for you</p>
                </div>
              ) : hasSearched && searchResults.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <div className="text-4xl mb-4">🔍</div>
                  <p className="text-lg font-medium mb-2">No products found</p>
                  <p className="text-sm mb-4">We couldn't find any products matching "{searchQuery}"</p>
                  <p className="text-xs text-gray-400">Try different keywords or browse our collections</p>
                  
                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    {['Handbags', 'Tote', 'Clutch', 'Leather'].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => handleTrendingSearchClick(suggestion)}
                        className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 transition-colors"
                      >
                        {suggestion}
                    </button>
                    ))}
                  </div>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="p-4">
                  <h4 className="text-sm font-semibold tracking-wide mb-4 text-gray-700">
                    SEARCH RESULTS ({searchResults.length} {searchResults.length === 1 ? 'product' : 'products'} found)
                  </h4>
                  <div className="space-y-3">
                    {searchResults.map((product) => (
                      <div
                        key={product._id}
                        onClick={() => handleProductClick(product)}
                        className="flex items-center gap-4 p-3 hover:bg-gray-50 cursor-pointer transition-colors border border-transparent hover:border-gray-200"
                      >
                        <div className="w-16 h-16 bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                          {product.images && product.images.length > 0 ? (
                            <img 
                              src={product.images[0]} 
                              alt={product.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src = '/images/product1.png';
                              }}
                            />
                          ) : (
                            <span className="text-gray-400 text-xs text-center">No Image</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{product.title}</p>
                          <p className="text-sm text-gray-500 truncate">{product.category}</p>
                          <p className="text-lg font-semibold text-gray-900 mt-1">${product.price?.toLocaleString()}</p>
                          {product.bestseller && (
                            <span className="inline-block bg-[#b9965d] text-white text-xs px-2 py-1 mt-1">
                              Best Seller
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1">
                            View
                          </span>
                          <Search className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <h4 className="text-sm font-semibold tracking-wide mb-4 text-gray-700">TRENDING SEARCHES</h4>
                      <ul className="space-y-3 text-sm text-gray-700">
                        {['Handbags', 'Leather', 'Tote', 'Clutch', 'Milano'].map((term) => (
                          <li key={term} className="flex items-center gap-3">
                            <Search className="w-4 h-4 text-gray-400" />
                            <button 
                              onClick={() => handleTrendingSearchClick(term)}
                              className="animated-underline inline-block relative text-left hover:text-gray-900 transition-colors"
                            >
                              {term}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="md:border-l md:border-r md:px-6 border-gray-200">
                      <h4 className="text-sm font-semibold tracking-wide mb-4 text-gray-700">CATEGORIES</h4>
                      <ul className="space-y-3 text-sm text-gray-700">
                        {['Handbags', 'Shoulder Bags', 'Tote Bags', 'Clutches'].map((category) => (
                          <li key={category}>
                            <button 
                              onClick={() => handleCategoryClick(category)}
                              className="animated-underline inline-block relative text-left hover:text-gray-900 transition-colors"
                            >
                              {category}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold tracking-wide mb-4 text-gray-700">FEATURED</h4>
                      <ul className="space-y-3 text-sm text-gray-700">
                        {['Bestseller', 'New Collection', 'Italian Leather', 'Luxury'].map((term) => (
                          <li key={term}>
                            <button 
                              onClick={() => handleFeaturedClick(term)}
                              className="animated-underline inline-block relative text-left hover:text-gray-900 transition-colors"
                            >
                              {term}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}