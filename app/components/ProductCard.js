"use client";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Edit, Trash2, Check } from "lucide-react";
import WishlistButton from "./WishlistButton";
import useAuthStore from "../../lib/store/authStore";
import useCartStore from "../../lib/store/cartStore";
import useWishlistStore from "../../lib/store/wishlistStore";

export default function ProductCard({ product, onEdit, onDelete }) {
  const [isHovered, setIsHovered] = useState(false);
  
  const { isAdmin, isAuthenticated } = useAuthStore();
  const { isProductInCart, getCartItemsByProductId } = useCartStore();
  const { isInWishlist } = useWishlistStore();
  
  const userIsAdmin = isAdmin();
  
  // Get first variant for display
  const firstVariant = product.variants && product.variants.length > 0 ? product.variants[0] : null;
  
  // Check if product is in cart (any variant)
  const isInCart = isAuthenticated() && isProductInCart(product._id);
  const cartItems = getCartItemsByProductId(product._id);
  
  // Calculate total quantity across all variants
  const totalCartQuantity = cartItems.reduce((total, item) => total + item.quantity, 0);

  // Local state for immediate UI update
  const [localIsInCart, setLocalIsInCart] = useState(isInCart);
  const [localCartQuantity, setLocalCartQuantity] = useState(totalCartQuantity);

  // Sync with store when cart changes
  useEffect(() => {
    setLocalIsInCart(isInCart);
    const items = getCartItemsByProductId(product._id);
    setLocalCartQuantity(items.reduce((total, item) => total + item.quantity, 0));
  }, [isInCart, product._id, getCartItemsByProductId]);

  const formatPrice = (price) => {
    return `$${price?.toLocaleString() || '0'}`;
  };

  const getProductImage = (product) => {
    // First check if product has variants with images
    if (product.variants && product.variants.length > 0) {
      const firstVariant = product.variants[0];
      if (firstVariant.images && firstVariant.images.length > 0) {
        return firstVariant.images[0];
      }
    }
    
    // Then check product level images
    if (product.images && product.images.length > 0) {
      return product.images[0];
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
    return fallbackImages[product.category] || '/images/product1.png';
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
      'Travel Bags': 'travel',
      'Accessories': 'accessories'
    };
    return slugMap[category] || 'handbags';
  };

  const handleEdit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onEdit(product);
  };

  const handleDelete = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(product);
  };

  // Get total available stock across all variants
  const getTotalAvailableStock = () => {
    if (!product.variants || product.variants.length === 0) {
      return product.stockQuantity || 0;
    }
    return product.variants.reduce((total, variant) => total + (variant.stockQuantity || 0), 0);
  };

  const totalAvailableStock = getTotalAvailableStock();

  return (
    <div 
      className="bg-white border border-gray-100 shadow-sm overflow-hidden group hover:shadow-lg transition-all duration-300 relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/shop/${getSlugFromCategory(product.category)}/${product._id}`} className="block">
        <div className="relative w-full h-64 bg-gray-50 overflow-hidden">
          <Image
            src={getProductImage(product)}
            alt={product.title}
            fill
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            unoptimized={true}
          />

          <div className="absolute top-3 right-3">
            <WishlistButton 
              product={product} 
              selectedVariant={firstVariant}
              size="sm" 
            />
          </div>

          {userIsAdmin && isHovered && (
            <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-2 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-gray-200">
              <button
                onClick={handleEdit}
                className="text-gray-700 hover:text-black hover:bg-gray-100 p-2 rounded-full transition-all duration-200"
                title="Edit Product"
              >
                <Edit className="w-4 h-4" />
              </button>
              <div className="w-px bg-gray-300"></div>
              <button
                onClick={handleDelete}
                className="text-gray-700 hover:text-red-600 hover:bg-gray-100 p-2 rounded-full transition-all duration-200"
                title="Delete Product"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="absolute left-3 top-3 text-xs text-gray-600 bg-white/80 px-2 py-1">
            {product.category}
          </div>

          {product.bestseller && (
            <div className="absolute left-3 bottom-3 text-xs bg-[#b9965d] text-white px-2 py-1">
              Best Seller
            </div>
          )}

          {totalAvailableStock === 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-semibold bg-black/70 px-3 py-1 rounded">
                Out of Stock
              </span>
            </div>
          )}

          {/* Cart Indicator Badge - Show total quantity across all variants */}
          {isAuthenticated() && localIsInCart && (
            <div className="absolute top-3 left-3 text-xs bg-green-600 text-white px-2 py-1 flex items-center gap-1">
              <Check className="w-3 h-3" />
              In Cart ({localCartQuantity})
            </div>
          )}
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 capitalize">{product.category}</p>
              <h3 className="mt-1 font-medium text-base text-gray-900">{product.title}</h3>
            </div>
            <p className="text-sm text-gray-500">
              {product.variants && product.variants.length > 0 ? 
                `${product.variants.length} Colors` : 'Multiple Colors'}
            </p>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="text-lg font-semibold text-gray-900">
              {formatPrice(product.price)}
            </div>
            
            {/* REMOVED: Add to Cart Button completely - Only on product page */}
          </div>
        </div>
      </Link>
    </div>
  );
}