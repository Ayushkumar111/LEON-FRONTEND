"use client";
import { useParams } from "next/navigation";
import Image from "next/image";
import { useState, useEffect, useCallback, useRef } from "react";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import Link from "next/link";
import WishlistButton from "../../../components/WishlistButton";
import ReviewsSection from "../../../components/ReviewsSection";
import useCartStore from "../../../../lib/store/cartStore";
import useAuthStore from "../../../../lib/store/authStore";
import { Check, Package, Plus, Minus, Edit, Save, X, Trash2, Hash } from "lucide-react";
import toast from "react-hot-toast";

export default function ProductPage() {
  const params = useParams();
  const { category, productId } = params;

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [openAccordion, setOpenAccordion] = useState(null);
  const [quantity, setQuantity] = useState(0);
  
  // Loading states for quantity operations
  const [isUpdatingQuantity, setIsUpdatingQuantity] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  
  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingVariants, setEditingVariants] = useState([]);
  const [isUpdating, setIsUpdating] = useState(false);

  const { addToCart, isProductInCart, getCartItemsByProductId, updateCartItem, removeCartItem, fetchCart } = useCartStore();
  const { isAuthenticated, user, token } = useAuthStore();
  
  // Check if user is admin
  const isAdmin = user?.roles?.includes('admin');

  // Get available variants
  const availableVariants = product?.variants?.filter(v => v.isAvailable !== false) || [];
  const selectedVariant = availableVariants[selectedVariantIndex];

  // Check if product with specific variant is in cart
  const cartItems = product ? getCartItemsByProductId(product._id) : [];
  const currentVariantCartItem = selectedVariant 
    ? cartItems.find(item => item.variant?._id === selectedVariant._id)
    : null;

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        console.log('Fetching product with ID:', productId);
        
        const response = await fetch(`${BACKEND_URL}/api/products/${productId}`);
        const data = await response.json();
        
        console.log('Product API response:', data);
        
        if (data.success) {
          setProduct(data.data);
          // Initialize editing variants with current variants
          setEditingVariants(data.data.variants || []);
          fetchRelatedProducts(data.data.category);
        } else {
          console.error('Product fetch failed:', data.message);
          setProduct(null);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId, BACKEND_URL]);

  // Update quantity when cart changes for selected variant
  useEffect(() => {
    if (currentVariantCartItem) {
      setQuantity(currentVariantCartItem.quantity);
    } else {
      setQuantity(0);
    }
  }, [currentVariantCartItem]);

  const fetchRelatedProducts = async (productCategory) => {
    try {
      setRelatedLoading(true);
      console.log('Fetching related products for category:', productCategory);
      
      const response = await fetch(
        `${BACKEND_URL}/api/products?category=${encodeURIComponent(productCategory)}&limit=4`
      );
      const data = await response.json();
      
      console.log('Related products response:', data);
      
      if (data.success && data.data && data.data.products) {
        const filteredProducts = data.data.products.filter(
          (p) => p._id !== productId
        );
        setRelatedProducts(filteredProducts.slice(0, 4)); 
      } else {
        setRelatedProducts([]);
      }
    } catch (error) {
      console.error('Error fetching related products:', error);
      setRelatedProducts([]);
    } finally {
      setRelatedLoading(false);
    }
  };

  // Handle variant selection
  const handleVariantSelect = (index) => {
    setSelectedVariantIndex(index);
    setSelectedImage(0); // Reset to first image when variant changes
    setQuantity(0); // Reset quantity when variant changes
    
    // Update quantity based on new variant's cart status
    const newSelectedVariant = availableVariants[index];
    if (newSelectedVariant) {
      const variantCartItem = cartItems.find(item => item.variant?._id === newSelectedVariant._id);
      setQuantity(variantCartItem?.quantity || 0);
    }
  };

  // FIXED: Quantity update with proper stock validation
  const handleIncreaseQuantity = async () => {
    if (!product || !isAuthenticated() || isUpdatingQuantity) {
      return;
    }

    const currentStock = getCurrentStock();
    const newQuantity = quantity + 1;

    // FIXED: Check if new quantity exceeds available stock
    if (newQuantity > currentStock) {
      toast.error(`Only ${currentStock} items available in this variant.`);
      return;
    }

    setIsUpdatingQuantity(true);

    try {
      // If quantity is 0 and we're increasing, it means adding to cart
      if (quantity === 0) {
        await addToCart(product._id, newQuantity, product, selectedVariant?._id);
      } else if (currentVariantCartItem) {
        // Update existing cart item
        await updateCartItem(currentVariantCartItem._id, newQuantity);
      }

      // Quantity will be updated via the useEffect that watches cart changes
    } catch (error) {
      console.error('Increase quantity error:', error);
      toast.error('Failed to update quantity');
    } finally {
      setIsUpdatingQuantity(false);
    }
  };

  const handleDecreaseQuantity = async () => {
    if (!product || !isAuthenticated() || isUpdatingQuantity) {
      return;
    }

    if (quantity <= 0) return;

    const newQuantity = quantity - 1;

    setIsUpdatingQuantity(true);

    try {
      if (newQuantity === 0) {
        // Remove from cart
        if (currentVariantCartItem) {
          await removeCartItem(currentVariantCartItem._id);
        }
      } else if (currentVariantCartItem) {
        // Update existing cart item
        await updateCartItem(currentVariantCartItem._id, newQuantity);
      }

      // Quantity will be updated via the useEffect that watches cart changes
    } catch (error) {
      console.error('Decrease quantity error:', error);
      toast.error('Failed to update quantity');
    } finally {
      setIsUpdatingQuantity(false);
    }
  };

  // Handle remove from cart
  const handleRemoveFromCart = async () => {
    if (!product || !isAuthenticated() || !currentVariantCartItem || isUpdatingQuantity) {
      return;
    }

    setIsUpdatingQuantity(true);

    try {
      await removeCartItem(currentVariantCartItem._id);
    } catch (error) {
      console.error('Remove from cart error:', error);
      toast.error('Failed to remove item from cart');
    } finally {
      setIsUpdatingQuantity(false);
    }
  };

  // Handle Add to Cart when quantity is 0
  const handleAddToCart = async () => {
    if (!product || !isAuthenticated() || isAddingToCart) {
      return;
    }

    setIsAddingToCart(true);

    try {
      await addToCart(product._id, 1, product, selectedVariant?._id);
    } catch (error) {
      console.error('Add to cart error:', error);
      toast.error('Failed to add item to cart');
    } finally {
      setIsAddingToCart(false);
    }
  };

  // NEW: Function to remove out-of-stock items from cart
  const removeOutOfStockItemsFromCart = async (updatedProduct) => {
    try {
      const cartItems = getCartItemsByProductId(updatedProduct._id);
      
      for (const cartItem of cartItems) {
        const variantId = cartItem.variant?._id;
        
        if (variantId) {
          // Find the updated variant
          const updatedVariant = updatedProduct.variants.find(v => v._id === variantId);
          
          if (!updatedVariant || updatedVariant.stockQuantity === 0 || updatedVariant.isAvailable === false) {
            // Remove from cart if variant is out of stock or unavailable
            console.log('Removing out-of-stock item from cart:', cartItem._id);
            await removeCartItem(cartItem._id);
          }
        }
      }
      
      // Refresh cart data
      await fetchCart();
    } catch (error) {
      console.error('Error removing out-of-stock items:', error);
    }
  };

  // UPDATED: Admin variant management functions with cart cleanup
  const updateProductVariants = async () => {
    if (!product || !isAdmin) {
      toast.error('Only admin can update product variants');
      return;
    }

    try {
      setIsUpdating(true);
      
      const updateData = {
        variants: editingVariants.map(variant => ({
          colorName: variant.colorName,
          hexCode: variant.hexCode,
          price: Number(variant.price),
          stockQuantity: Number(variant.stockQuantity),
          images: variant.images || [],
          isAvailable: variant.isAvailable !== false,
          sku: variant.sku || `SKU-${product.title.replace(/\s+/g, '-').toUpperCase()}-${variant.colorName.replace(/\s+/g, '-').toUpperCase()}`
        }))
      };

      console.log('Updating variants with data:', updateData);

      const response = await fetch(`${BACKEND_URL}/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();

      if (data.success) {
        const updatedProduct = data.data;
        
        // Remove out-of-stock items from cart
        await removeOutOfStockItemsFromCart(updatedProduct);
        
        toast.success('Product variants updated successfully!');
        setProduct(updatedProduct);
        setIsEditMode(false);
      } else {
        toast.error(data.message || 'Failed to update variants');
        console.error('Update failed:', data);
      }
    } catch (error) {
      console.error('Error updating variants:', error);
      toast.error('Error updating product variants');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle variant field changes
  const handleVariantChange = (variantIndex, field, value) => {
    const updatedVariants = [...editingVariants];
    updatedVariants[variantIndex] = {
      ...updatedVariants[variantIndex],
      [field]: value
    };
    setEditingVariants(updatedVariants);
  };

  // Add new variant
  const addNewVariant = () => {
    setEditingVariants([
      ...editingVariants,
      {
        colorName: 'New Color',
        hexCode: '#000000',
        price: product?.price || 0,
        stockQuantity: 0,
        images: [],
        isAvailable: true,
        sku: ''
      }
    ]);
  };

  // Remove variant
  const removeVariant = (variantIndex) => {
    if (editingVariants.length <= 1) {
      toast.error('At least one variant is required');
      return;
    }
    
    const updatedVariants = editingVariants.filter((_, index) => index !== variantIndex);
    setEditingVariants(updatedVariants);
    
    if (selectedVariantIndex === variantIndex) {
      setSelectedVariantIndex(0);
    }
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingVariants(product?.variants || []);
    setIsEditMode(false);
  };

  // Get current variant images or fallback to product images
  const getCurrentImages = () => {
    if (selectedVariant && selectedVariant.images && selectedVariant.images.length > 0) {
      return selectedVariant.images;
    }
    return product?.images || [];
  };

  // Get current stock quantity
  const getCurrentStock = () => {
    if (selectedVariant) {
      return selectedVariant.stockQuantity || 0;
    }
    return product?.stockQuantity || 0;
  };

  // Get current SKU - FIXED: Use variant SKU if available
  const getCurrentSKU = () => {
    if (selectedVariant && selectedVariant.sku) {
      return selectedVariant.sku;
    }
    // Generate SKU if not present
    if (selectedVariant) {
      return `SKU-${product?.title?.replace(/\s+/g, '-').toUpperCase()}-${selectedVariant.colorName?.replace(/\s+/g, '-').toUpperCase()}`;
    }
    return product?.sku || `SKU-${product?.title?.replace(/\s+/g, '-').toUpperCase()}`;
  };

  const toggleAccordion = (section) => {
    setOpenAccordion(openAccordion === section ? null : section);
  };

  const categoryName = category
    ? category.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")
    : "";

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

  const formatPrice = (price) => {
    return `$${price?.toLocaleString() || '0'}`;
  };

  const getProductImage = (product) => {
    if (product.images && product.images.length > 0) {
      return product.images[0];
    }
    const fallbackImages = {
      'Handbags': '/images/product1.png',
      'Handbag': '/images/product1.png',
      'Shoulder Bags': '/images/product2.png',
      'Tote Bags': '/images/product3.png',
      'Clutches': '/images/product4.png',
      'Clutch': '/images/product4.png',
    };
    return fallbackImages[product.category] || '/images/product1.png';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-gray-900 font-sans">
        <Header />
        <div className="pt-16">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="w-full h-96 bg-gray-200 rounded"></div>
                  <div className="grid grid-cols-4 gap-2">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="w-full h-20 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white text-gray-900 font-sans">
        <Header />
        <div className="pt-16">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-16 text-center">
            <div className="flex justify-center mb-6">
              <Package className="w-16 h-16 text-gray-400" />
            </div>
            <h2 className="text-2xl font-semibold mb-4">Product Not Found</h2>
            <p className="text-gray-600 mb-8">The product you're looking for doesn't exist.</p>
            <Link href="/shop">
              <button className="bg-black text-white px-6 py-3 font-medium hover:bg-gray-800 transition">
                Back to Shop
              </button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const currentImages = getCurrentImages();
  const currentStock = getCurrentStock();
  const displayPrice = selectedVariant?.price || product.price;
  const currentSKU = getCurrentSKU();

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      <Header />

      <div className="pt-16">
        <section className="px-4 md:px-8 py-4 border-b border-gray-200">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Link href="/" className="hover:text-gray-900 transition">
                Home
              </Link>
              <span>/</span>
              <Link href="/shop" className="hover:text-gray-900 transition">
                Shop
              </Link>
              <span>/</span>
              <Link href={`/shop/${category}`} className="hover:text-gray-900 transition">
                {categoryName}
              </Link>
              <span>/</span>
              <span className="text-gray-900 font-medium">{product.title}</span>
            </div>
          </div>
        </section>

        <section className="px-4 md:px-8 py-12 md:py-16">
          <div className="max-w-7xl mx-auto">
            {/* Admin Controls */}
            {isAdmin && (
              <div className="mb-6 flex justify-end">
                {!isEditMode ? (
                  <button
                    onClick={() => setIsEditMode(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Variants
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={updateProductVariants}
                      disabled={isUpdating}
                      className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      {isUpdating ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={cancelEditing}
                      disabled={isUpdating}
                      className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
              <div className="flex flex-col gap-4">
                <div className="relative w-full h-96 md:h-[600px] bg-gray-100 overflow-hidden">
                  {currentImages.length > 0 ? (
                    <Image
                      src={currentImages[selectedImage]}
                      alt={product.title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                      No Image Available
                    </div>
                  )}
                  
                  <div className="absolute top-4 right-4">
                    <WishlistButton 
                      product={product} 
                      selectedVariant={selectedVariant}
                      size="md" 
                    />
                  </div>

                  {/* Cart Indicator Badge */}
                  {quantity > 0 && (
                    <div className="absolute top-4 left-4 text-xs bg-green-600 text-white px-3 py-2 flex items-center gap-1 rounded">
                      <Check className="w-4 h-4" />
                      In Cart ({quantity})
                    </div>
                  )}
                </div>

                {currentImages.length > 1 && (
                  <div className="grid grid-cols-4 gap-2 md:gap-4">
                    {currentImages.map((img, index) => (
                      <div
                        key={index}
                        onClick={() => setSelectedImage(index)}
                        className={`relative w-full h-20 md:h-28 bg-gray-100 cursor-pointer overflow-hidden border-2 ${
                          selectedImage === index
                            ? "border-gray-900"
                            : "border-transparent"
                        }`}
                      >
                        <Image
                          src={img}
                          alt={`${product.title} ${index + 1}`}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-6">
                <div>
                  <h1 className="text-2xl md:text-3xl font-semibold mb-2">
                    {product.title}
                  </h1>
                  <p className="text-gray-600 text-sm md:text-base">
                    {product.description}
                  </p>
                </div>

                {/* NEW: SKU Display Section */}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Hash className="w-4 h-4" />
                  <span className="font-medium">SKU:</span>
                  <span className="bg-gray-100 px-2 py-1 rounded">{currentSKU}</span>
                </div>

                <div className="text-2xl md:text-3xl font-medium">
                  {formatPrice(displayPrice)}
                </div>

                {/* Variants Selection */}
                {availableVariants.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium">
                        Color: {selectedVariant?.colorName || 'Select Color'}
                      </p>
                      {/* Variant SKU Display */}
                      {selectedVariant?.sku && (
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <Hash className="w-3 h-3" />
                          {selectedVariant.sku}
                        </div>
                      )}
                    </div>
                    
                    {isEditMode ? (
                      // Edit Mode Variants
                      <div className="space-y-4">
                        {editingVariants.map((variant, index) => (
                          <div key={index} className="border border-gray-300 p-4 rounded-lg space-y-3">
                            <div className="flex justify-between items-start">
                              <h4 className="font-medium">Variant {index + 1} - {variant.colorName}</h4>
                              {editingVariants.length > 1 && (
                                <button
                                  onClick={() => removeVariant(index)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs text-gray-600">Color Name</label>
                                <input
                                  type="text"
                                  value={variant.colorName}
                                  onChange={(e) => handleVariantChange(index, 'colorName', e.target.value)}
                                  className="w-full border border-gray-300 px-2 py-1 text-sm rounded"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-gray-600">Hex Code</label>
                                <div className="flex gap-2">
                                  <input
                                    type="color"
                                    value={variant.hexCode}
                                    onChange={(e) => handleVariantChange(index, 'hexCode', e.target.value)}
                                    className="w-10 h-8 border border-gray-300 rounded"
                                  />
                                  <input
                                    type="text"
                                    value={variant.hexCode}
                                    onChange={(e) => handleVariantChange(index, 'hexCode', e.target.value)}
                                    className="flex-1 border border-gray-300 px-2 py-1 text-sm rounded"
                                  />
                                </div>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs text-gray-600">Price</label>
                                <input
                                  type="number"
                                  value={variant.price}
                                  onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                                  className="w-full border border-gray-300 px-2 py-1 text-sm rounded"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-gray-600">Stock Quantity</label>
                                <input
                                  type="number"
                                  value={variant.stockQuantity}
                                  onChange={(e) => handleVariantChange(index, 'stockQuantity', e.target.value)}
                                  className="w-full border border-gray-300 px-2 py-1 text-sm rounded"
                                />
                              </div>
                            </div>
                            
                            <div>
                              <label className="text-xs text-gray-600">SKU</label>
                              <input
                                type="text"
                                value={variant.sku}
                                onChange={(e) => handleVariantChange(index, 'sku', e.target.value)}
                                className="w-full border border-gray-300 px-2 py-1 text-sm rounded"
                                placeholder="Auto-generated if empty"
                              />
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={variant.isAvailable !== false}
                                onChange={(e) => handleVariantChange(index, 'isAvailable', e.target.checked)}
                                className="rounded"
                                id={`available-${index}`}
                              />
                              <label htmlFor={`available-${index}`} className="text-xs text-gray-600">
                                Available for sale
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      // View Mode Variants
                      <div className="flex gap-3">
                        {availableVariants.map((variant, index) => (
                          <button
                            key={variant._id}
                            onClick={() => handleVariantSelect(index)}
                            className={`w-10 h-10 rounded-full border-2 ${
                              selectedVariantIndex === index
                                ? "border-gray-900"
                                : "border-gray-300"
                            } ${variant.stockQuantity === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                            style={{ backgroundColor: variant.hexCode }}
                            title={`${variant.colorName} ${variant.stockQuantity === 0 ? '(Out of Stock)' : ''}`}
                            disabled={variant.stockQuantity === 0}
                          />
                        ))}
                      </div>
                    )}
                    
                    {selectedVariant && !isEditMode && (
                      <div className="mt-2 space-y-1">
                        <p className="text-sm text-gray-600">
                          {selectedVariant.colorName}
                          {currentStock > 0 && ` • ${currentStock} available`}
                        </p>
                        {selectedVariant.sku && (
                          <p className="text-xs text-gray-500">
                            SKU: {selectedVariant.sku}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Quantity Selector - ALWAYS VISIBLE */}
                <div className="flex items-center gap-4">
                  <p className="text-sm font-medium">Quantity</p>
                  <div className="flex items-center border border-gray-300">
                    {/* LEFT BUTTON: Delete when quantity is 0 or 1, Minus when quantity > 1 */}
                    <button
                      onClick={quantity === 0 || quantity === 1 ? handleRemoveFromCart : handleDecreaseQuantity}
                      disabled={quantity === 0 || !isAuthenticated() || isUpdatingQuantity}
                      className={`px-3 py-2 transition ${
                        quantity === 0 || quantity === 1 
                          ? 'hover:bg-red-50 text-red-600' 
                          : 'hover:bg-gray-100 text-gray-700'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                      title={quantity === 0 || quantity === 1 ? "Remove from cart" : "Decrease quantity"}
                    >
                      {isUpdatingQuantity ? (
                        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                      ) : quantity === 0 || quantity === 1 ? (
                        <Trash2 className="w-4 h-4" />
                      ) : (
                        <Minus className="w-4 h-4" />
                      )}
                    </button>
                    
                    <span className="px-4 py-2 border-x border-gray-300 min-w-12 text-center">
                      {isUpdatingQuantity ? (
                        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
                      ) : (
                        quantity
                      )}
                    </span>
                    
                    <button
                      onClick={handleIncreaseQuantity}
                      disabled={quantity >= currentStock || !isAuthenticated() || isUpdatingQuantity}
                      className="px-3 py-2 hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUpdatingQuantity ? (
                        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <span className="text-sm text-gray-500">
                    {currentStock} available
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-semibold mb-3">About this product</h3>
                  <p className="text-gray-600 text-sm md:text-base leading-relaxed">
                    {product.description}
                  </p>
                </div>

                <div className="text-sm">
                  {currentStock > 0 ? (
                    <span className="text-green-600">In Stock ({currentStock} available)</span>
                  ) : (
                    <span className="text-red-600">Out of Stock</span>
                  )}
                </div>

                {/* Add to Cart Button - Only show when quantity is 0 */}
                {quantity === 0 && (
                  <button 
                    onClick={handleAddToCart}
                    disabled={currentStock === 0 || !isAuthenticated() || isAddingToCart}
                    className={`w-full py-3 md:py-4 font-medium text-sm md:text-base transition flex items-center justify-center gap-2 ${
                      currentStock > 0 && isAuthenticated() && !isAddingToCart
                        ? 'bg-black text-white hover:bg-gray-800 cursor-pointer'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {isAddingToCart ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Adding to Cart...
                      </>
                    ) : !isAuthenticated() ? (
                      'Login to Add to Cart'
                    ) : currentStock > 0 ? (
                      'Add to Cart'
                    ) : (
                      'Out of Stock'
                    )}
                  </button>
                )}

                {/* In Cart Message - Only show when quantity > 0 */}
                {quantity > 0 && (
                  <div className="w-full py-3 md:py-4 bg-green-600 text-white font-medium text-sm md:text-base flex items-center justify-center gap-2 cursor-default">
                    <Check className="w-5 h-5" />
                    {isUpdatingQuantity ? 'Updating...' : `In Cart (${quantity})`}
                  </div>
                )}

                <div className="border-t border-gray-200 pt-6">
                  <div className="border-b border-gray-200">
                    <button
                      onClick={() => toggleAccordion("details")}
                      className="w-full flex justify-between items-center py-4 text-left"
                    >
                      <span className="font-semibold text-sm md:text-base">
                        Product Details
                      </span>
                      <span className="text-xl">
                        {openAccordion === "details" ? "−" : "+"}
                      </span>
                    </button>
                    {openAccordion === "details" && (
                      <div className="pb-4 space-y-2">
                        {/* NEW: SKU in Product Details */}
                        <div className="flex justify-between text-sm md:text-base">
                          <span className="text-gray-600">SKU:</span>
                          <span className="font-medium">{currentSKU}</span>
                        </div>
                        
                        {product.productDetails && Object.entries(product.productDetails).map(([key, value]) => (
                          <div
                            key={key}
                            className="flex justify-between text-sm md:text-base"
                          >
                            <span className="text-gray-600">{key}:</span>
                            <span className="font-medium">{value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {product.careInstructions && product.careInstructions.length > 0 && (
                    <div className="border-b border-gray-200">
                      <button
                        onClick={() => toggleAccordion("care")}
                        className="w-full flex justify-between items-center py-4 text-left"
                      >
                        <span className="font-semibold text-sm md:text-base">
                          Care Instructions
                        </span>
                        <span className="text-xl">
                          {openAccordion === "care" ? "−" : "+"}
                        </span>
                      </button>
                      {openAccordion === "care" && (
                        <div className="pb-4">
                          <ul className="space-y-2 text-sm md:text-base text-gray-600">
                            {product.careInstructions.map((instruction, index) => (
                              <li key={index} className="flex items-start">
                                <span className="mr-2">•</span>
                                {instruction}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="border-b border-gray-200">
                    <button
                      onClick={() => toggleAccordion("shipping")}
                      className="w-full flex justify-between items-center py-4 text-left"
                    >
                      <span className="font-semibold text-sm md:text-base">
                        Shipping & Returns
                      </span>
                      <span className="text-xl">
                        {openAccordion === "shipping" ? "−" : "+"}
                        </span>
                    </button>
                    {openAccordion === "shipping" && (
                      <div className="pb-4 space-y-2 text-sm md:text-base text-gray-600">
                        <p className="flex items-start">
                          <span className="mr-2">📦</span>
                          Free shipping on orders over $1,000
                        </p>
                        <p className="flex items-start">
                          <span className="mr-2">🚚</span>
                          2-5 business days
                        </p>
                        <p className="flex items-start">
                          <span className="mr-2">↩️</span>
                          30-day return period
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Reviews Section */}
        <ReviewsSection productId={productId} />

        <section className="px-4 md:px-8 py-12 md:py-16">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-xl md:text-2xl font-semibold mb-8">
              You May Also Like
            </h2>
            
            {relatedLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, index) => (
                  <div key={index} className="bg-white border border-gray-100 shadow-sm overflow-hidden animate-pulse">
                    <div className="w-full h-64 bg-gray-200"></div>
                    <div className="p-4">
                      <div className="h-4 bg-gray-200 mb-2"></div>
                      <div className="h-6 bg-gray-200 mb-2"></div>
                      <div className="h-4 bg-gray-200 w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : relatedProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedProducts.map((relatedProduct) => (
                  <div key={relatedProduct._id} className="bg-white border border-gray-100 shadow-sm overflow-hidden group hover:shadow-md transition-shadow duration-300">
                    <Link 
                      href={`/shop/${getSlugFromCategory(relatedProduct.category)}/${relatedProduct._id}`} 
                      className="block"
                    >
                      <div className="relative w-full h-64 bg-gray-50 overflow-hidden">
                        <Image
                          src={getProductImage(relatedProduct)}
                          alt={relatedProduct.title}
                          fill
                          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                          unoptimized={true}
                        />

                        {/* Wishlist Button */}
                        <div className="absolute top-3 right-3">
                          <WishlistButton product={relatedProduct} size="sm" />
                        </div>

                        {relatedProduct.bestseller && (
                          <div className="absolute left-3 bottom-3 text-xs bg-[#b9965d] text-white px-2 py-1">
                            Best Seller
                          </div>
                        )}
                      </div>

                      <div className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-500 capitalize">{relatedProduct.category}</p>
                            <h3 className="mt-1 font-medium text-base text-gray-900">{relatedProduct.title}</h3>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                          <div className="text-lg font-semibold text-gray-900">
                            {formatPrice(relatedProduct.price)}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="flex justify-center mb-4">
                  <Package className="w-12 h-12 text-gray-400" />
                </div>
                <p className="text-gray-600">No related products found at the moment.</p>
                <Link href="/shop">
                  <button className="mt-4 bg-black text-white px-6 py-3 hover:bg-gray-800 transition-colors">
                    Browse All Products
                  </button>
                </Link>
              </div>
            )}
          </div>
        </section>

        <Footer />
      </div>
    </div>
  );
}