"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import useAuthStore from "../../lib/store/authStore";
import useWishlistStore from "../../lib/store/wishlistStore";
import toast from "react-hot-toast";

export default function WishlistButton({ product, selectedVariant = null, size = "sm" }) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { addToWishlist, isInWishlist } = useWishlistStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleWishlistClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isLoading) return;
    
    // Check if user is authenticated
    if (!isAuthenticated()) {
      toast.error('Please login to add items to wishlist');
      router.push('/auth');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = addToWishlist(product, selectedVariant);
      
      if (result.action === 'added') {
        toast.success('Added to wishlist!');
      } else {
        toast.success('Removed from wishlist');
      }
    } catch (error) {
      toast.error('Failed to update wishlist');
    } finally {
      setIsLoading(false);
    }
  };

  const isWishlisted = isInWishlist(product._id, selectedVariant?._id);
  
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5', 
    lg: 'w-6 h-6'
  };

  return (
    <button 
      className={`flex items-center justify-center rounded-full transition-all duration-200 ${
        isWishlisted 
          ? 'bg-red-500 text-white' 
          : 'bg-white/80 text-gray-700 hover:bg-white'
      } ${sizes[size]} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={handleWishlistClick}
      disabled={isLoading}
      aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
    >
      <Heart 
        className={`${iconSizes[size]} ${isWishlisted ? 'fill-current' : ''}`} 
      />
    </button>
  );
}