"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import useAuthStore from "../../lib/store/authStore";
import useCartStore from "../../lib/store/cartStore";
import { 
  ShoppingCart, 
  Package, 
  ArrowLeft, 
  Trash2, 
  Truck, 
  Shield,
  CreditCard,
  Tag,
  X,
  Plus,
  Minus,
  Check
} from "lucide-react";
import toast from "react-hot-toast";

export default function CartPage() {
  const { isAuthenticated } = useAuthStore();
  const { 
    cart, 
    loading, 
    syncing,
    fetchCart, 
    updateCartItem, 
    removeCartItem, 
    clearCart,
    applyCoupon,
    removeCoupon 
  } = useCartStore();

  const [promoCode, setPromoCode] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  
  // Loading states for individual items
  const [updatingItems, setUpdatingItems] = useState(new Set());
  const [removingItems, setRemovingItems] = useState(new Set());

  useEffect(() => {
    if (isAuthenticated()) {
      fetchCart();
    }
  }, [isAuthenticated, fetchCart]);

  // FIXED: Quantity handlers with proper stock validation
  const handleIncreaseQuantity = async (itemId, currentQuantity) => {
    if (updatingItems.has(itemId)) return;
    
    const newQuantity = currentQuantity + 1;
    
    // Get the item to check stock
    const currentItem = cart?.items?.find(item => item._id === itemId);
    if (!currentItem) return;

    // Check available stock for this variant
    const availableStock = currentItem.variant?.stockQuantity || currentItem.productId?.stockQuantity || 0;
    
    // FIXED: Check if new quantity exceeds available stock
    if (newQuantity > availableStock) {
      toast.error(`Only ${availableStock} items available in this variant.`);
      return;
    }
    
    // Add to updating set
    setUpdatingItems(prev => new Set(prev).add(itemId));
    
    try {
      await updateCartItem(itemId, newQuantity);
    } catch (error) {
      console.error('Increase quantity error:', error);
      toast.error('Failed to update quantity');
    } finally {
      // Remove from updating set
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  const handleDecreaseQuantity = async (itemId, currentQuantity) => {
    if (updatingItems.has(itemId)) return;
    
    const newQuantity = currentQuantity - 1;
    
    if (newQuantity === 0) {
      // Remove item
      setRemovingItems(prev => new Set(prev).add(itemId));
      try {
        await removeCartItem(itemId);
      } catch (error) {
        console.error('Remove item error:', error);
        toast.error('Failed to remove item');
      } finally {
        setRemovingItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(itemId);
          return newSet;
        });
      }
      return;
    }
    
    // Update quantity
    setUpdatingItems(prev => new Set(prev).add(itemId));
    
    try {
      await updateCartItem(itemId, newQuantity);
    } catch (error) {
      console.error('Decrease quantity error:', error);
      toast.error('Failed to update quantity');
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  const handleRemoveItem = async (itemId) => {
    if (removingItems.has(itemId)) return;
    
    setRemovingItems(prev => new Set(prev).add(itemId));
    
    try {
      await removeCartItem(itemId);
    } catch (error) {
      console.error('Remove item error:', error);
      toast.error('Failed to remove item');
    } finally {
      setRemovingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  const handleClearCart = async () => {
    if (confirm("Are you sure you want to clear your entire cart?")) {
      await clearCart();
    }
  };

  const handleApplyCoupon = async () => {
    if (!promoCode.trim()) {
      toast.error("Please enter a promo code");
      return;
    }

    setApplyingCoupon(true);
    try {
      await applyCoupon(promoCode.trim());
      setPromoCode("");
    } catch (error) {
      // Error handled in store
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = async () => {
    await removeCoupon();
  };

  // Get cart item image - prioritize variant images
  const getCartItemImage = (cartItem) => {
    // First check if cart item has variant with images
    if (cartItem.variant && cartItem.variant.images && cartItem.variant.images.length > 0) {
      return cartItem.variant.images[0];
    }
    
    // Then check if product has variants with images
    if (cartItem.productId.variants && cartItem.productId.variants.length > 0) {
      const firstVariant = cartItem.productId.variants[0];
      if (firstVariant.images && firstVariant.images.length > 0) {
        return firstVariant.images[0];
      }
    }
    
    // Then check product level images
    if (cartItem.productId.images && cartItem.productId.images.length > 0) {
      return cartItem.productId.images[0];
    }
    
    // Fallback images based on category
    const fallbackImages = {
      'Handbags': '/images/product1.png',
      'Handbag': '/images/product1.png',
      'Shoulder Bags': '/images/product2.png',
      'Tote Bags': '/images/product3.png',
      'Clutches': '/images/product4.png',
      'Clutch': '/images/product4.png',
      'Evening': '/images/product3.png',
      'Travel': '/images/product4.png',
      'Travel Bags': '/images/product4.png',
      'Accessories': '/images/product1.png'
    };
    
    return fallbackImages[cartItem.productId.category] || '/images/product1.png';
  };

  // Get display price - use variant price if available
  const getDisplayPrice = (cartItem) => {
    return cartItem.variant?.price || cartItem.priceAtAdd || cartItem.productId.price || 0;
  };

  // Get available stock for cart item
  const getAvailableStock = (cartItem) => {
    return cartItem.variant?.stockQuantity || cartItem.productId?.stockQuantity || 0;
  };

  const formatPrice = (price) => {
    return `$${price?.toLocaleString() || '0'}`;
  };

  if (loading && !cart) {
    return (
      <div className="min-h-screen bg-white text-gray-900 font-sans">
        <Header />
        <div className="pt-16">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-16">
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your cart...</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const cartItems = cart?.items || [];
  const hasItems = cartItems.length > 0;

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      <Header />

      <div className="pt-16">
        {/* Cart Content */}
        <section className="px-4 md:px-8 py-12 md:py-16">
          <div className="max-w-7xl mx-auto">
            {!hasItems ? (
              <div className="text-center py-16">
                <div className="flex justify-center mb-6">
                  <ShoppingCart className="w-16 h-16 text-gray-400" />
                </div>
                <h2 className="text-2xl font-semibold mb-4">Your cart is empty</h2>
                <p className="text-gray-600 mb-8">Discover our exquisite collection and find your perfect piece.</p>
                <Link href="/shop/handbags">
                  <button className="bg-black text-white px-8 py-3 font-medium hover:bg-gray-800 transition">
                    Continue Shopping
                  </button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
                <div className="lg:col-span-2">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-semibold">Shopping Cart</h2>
                    <button
                      onClick={handleClearCart}
                      className="flex items-center gap-2 text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      <Trash2 className="w-4 h-4" />
                      Clear Cart
                    </button>
                  </div>

                  <div className="space-y-6">
                    {cartItems.map((item) => {
                      const isUpdating = updatingItems.has(item._id);
                      const isRemoving = removingItems.has(item._id);
                      const displayPrice = getDisplayPrice(item);
                      const itemTotal = displayPrice * item.quantity;
                      const availableStock = getAvailableStock(item);
                      
                      return (
                        <div key={item._id} className="flex flex-col sm:flex-row gap-4 pb-6 border-b border-gray-200">
                          <div className="relative w-full sm:w-48 h-48 bg-gray-100 overflow-hidden">
                            <Image
                              src={getCartItemImage(item)}
                              alt={item.productId.title}
                              fill
                              className="object-cover"
                              unoptimized
                              onError={(e) => {
                                e.target.src = '/images/product1.png';
                              }}
                            />
                            
                            {/* Variant Color Indicator */}
                            {item.variant && (
                              <div className="absolute top-2 left-2 flex items-center gap-2 bg-white/90 px-2 py-1 rounded text-xs">
                                <div 
                                  className="w-3 h-3 rounded-full border border-gray-300"
                                  style={{ backgroundColor: item.variant.hexCode }}
                                ></div>
                                <span>{item.variant.colorName}</span>
                              </div>
                            )}

                            {/* Cart Quantity Badge */}
                            <div className="absolute top-2 right-2 bg-green-600 text-white text-xs px-2 py-1 flex items-center gap-1 rounded">
                              <Check className="w-3 h-3" />
                              In Cart ({item.quantity})
                            </div>

                            {/* Stock Info Badge */}
                            <div className="absolute bottom-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                              {availableStock} available
                            </div>

                            {/* Loading Overlay */}
                            {(isUpdating || isRemoving) && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              </div>
                            )}
                          </div>

                          <div className="flex-1 flex flex-col justify-between">
                            <div>
                              <h3 className="text-lg font-medium mb-2">{item.productId.title}</h3>
                              <div className="text-gray-600 text-sm mb-2">
                                <span>Category: {item.productId.category}</span>
                                {item.variant && (
                                  <span className="ml-3">Color: {item.variant.colorName}</span>
                                )}
                              </div>
                              <p className="text-lg font-medium">{formatPrice(displayPrice)}</p>
                              <p className="text-sm text-gray-600 mt-1">
                                Item Total: {formatPrice(itemTotal)}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Stock: {availableStock} available
                              </p>
                            </div>

                            <div className="flex items-center justify-between mt-4">
                              {/* Quantity controls with loading states */}
                              <div className="flex items-center border border-gray-300">
                                {/* LEFT BUTTON: Delete when quantity is 1, Minus when quantity > 1 */}
                                <button
                                  onClick={() => item.quantity === 1 ? handleRemoveItem(item._id) : handleDecreaseQuantity(item._id, item.quantity)}
                                  disabled={isUpdating || isRemoving}
                                  className={`px-3 py-2 transition ${
                                    item.quantity === 1 
                                      ? 'hover:bg-red-50 text-red-600' 
                                      : 'hover:bg-gray-100 text-gray-700'
                                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                                  title={item.quantity === 1 ? "Remove from cart" : "Decrease quantity"}
                                >
                                  {isUpdating || isRemoving ? (
                                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                  ) : item.quantity === 1 ? (
                                    <Trash2 className="w-4 h-4" />
                                  ) : (
                                    <Minus className="w-4 h-4" />
                                  )}
                                </button>
                                
                                <span className="px-4 py-2 border-x border-gray-300 min-w-12 text-center">
                                  {isUpdating || isRemoving ? (
                                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                  ) : (
                                    item.quantity
                                  )}
                                </span>
                                
                                <button
                                  onClick={() => handleIncreaseQuantity(item._id, item.quantity)}
                                  disabled={isUpdating || isRemoving || item.quantity >= availableStock}
                                  className="px-3 py-2 hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                  title={item.quantity >= availableStock ? "Maximum stock reached" : "Increase quantity"}
                                >
                                  {isUpdating || isRemoving ? (
                                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                  ) : (
                                    <Plus className="w-4 h-4" />
                                  )}
                                </button>
                              </div>

                              <button
                                onClick={() => handleRemoveItem(item._id)}
                                disabled={isUpdating || isRemoving}
                                className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Trash2 className="w-4 h-4" />
                                Remove
                              </button>
                            </div>

                            {/* Stock Warning Message */}
                            {item.quantity >= availableStock && (
                              <div className="mt-2 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                                Maximum quantity reached for this variant
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-8">
                    <Link href="/shop/handbags">
                      <button className="flex items-center gap-2 px-6 py-3 transition font-medium cursor-pointer hover:bg-gray-50">
                        <ArrowLeft className="w-4 h-4" />
                        Continue Shopping
                      </button>
                    </Link>
                  </div>
                </div>

                <div className="lg:col-span-1">
                  <div className="bg-gray-50 p-6 sticky top-24">
                    <h3 className="text-xl font-semibold mb-6">Order Summary</h3>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal</span>
                        <span>{formatPrice(cart.subtotal)}</span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span>Shipping</span>
                        <span>{cart.shippingCost === 0 ? 'FREE' : formatPrice(cart.shippingCost)}</span>
                      </div>
                      
                      {cart.appliedCoupon && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span className="flex items-center gap-1">
                            <Tag className="w-4 h-4" />
                            Discount ({cart.appliedCoupon.code})
                          </span>
                          <span>-{formatPrice(cart.discountAmount)}</span>
                        </div>
                      )}
                      
                      <div className="border-t border-gray-200 pt-4">
                        <div className="flex justify-between text-lg font-semibold">
                          <span>Total</span>
                          <span>{formatPrice(cart.total)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Coupon Section */}
                    <div className="mt-6">
                      <label htmlFor="promo-code" className="block text-sm font-medium text-gray-700 mb-2">
                        Promo Code
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          id="promo-code"
                          placeholder="Enter code"
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value)}
                          className="flex-1 border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-gray-900"
                          disabled={applyingCoupon || !!cart.appliedCoupon}
                        />
                        {cart.appliedCoupon ? (
                          <button 
                            onClick={handleRemoveCoupon}
                            disabled={applyingCoupon}
                            className="flex items-center gap-1 bg-red-600 text-white px-4 py-2 text-sm hover:bg-red-700 transition cursor-pointer disabled:bg-gray-400"
                          >
                            <X className="w-4 h-4" />
                            Remove
                          </button>
                        ) : (
                          <button 
                            onClick={handleApplyCoupon}
                            disabled={applyingCoupon || !promoCode.trim()}
                            className="flex items-center gap-1 bg-gray-800 text-white px-4 py-2 text-sm hover:bg-gray-700 transition cursor-pointer disabled:bg-gray-400"
                          >
                            <Tag className="w-4 h-4" />
                            {applyingCoupon ? "Applying..." : "Apply"}
                          </button>
                        )}
                      </div>
                    </div>

                    <button 
                      className="w-full bg-black text-white py-4 font-medium hover:bg-gray-800 transition mt-6 cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      disabled={syncing || updatingItems.size > 0 || removingItems.size > 0}
                    >
                      {syncing || updatingItems.size > 0 || removingItems.size > 0 ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-5 h-5" />
                          Proceed to Checkout
                        </>
                      )}
                    </button>

                    <div className="mt-4 text-center">
                      <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                        <Shield className="w-4 h-4" />
                        Secure checkout • SSL encrypted
                      </p>
                    </div>

                    <div className="mt-6 space-y-3 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-green-600" />
                        <span>Free shipping on orders over $1,000</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-blue-600" />
                        <span>30-day return policy</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-amber-600" />
                        <span>Authenticity guaranteed</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        <Footer />
      </div>
    </div>
  );
}