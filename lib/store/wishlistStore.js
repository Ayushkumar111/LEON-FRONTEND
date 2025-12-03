import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useWishlistStore = create(
  persist(
    (set, get) => ({
      wishlistItems: [],
      
      addToWishlist: (product, selectedVariant = null) => {
        const { wishlistItems } = get();
        
        // Create unique identifier with product ID and variant ID
        const itemId = selectedVariant ? `${product._id}-${selectedVariant._id}` : product._id;
        
        const existingItem = wishlistItems.find(item => {
          if (selectedVariant) {
            return item._id === product._id && item.selectedVariant?._id === selectedVariant._id;
          }
          return item._id === product._id;
        });
        
        if (existingItem) {
          const updatedItems = wishlistItems.filter(item => {
            if (selectedVariant) {
              return !(item._id === product._id && item.selectedVariant?._id === selectedVariant._id);
            }
            return item._id !== product._id;
          });
          set({ wishlistItems: updatedItems });
          return { success: true, action: 'removed' };
        } else {
          const wishlistItem = {
            ...product,
            selectedVariant: selectedVariant, // Store the selected variant
            addedAt: new Date().toISOString(),
            wishlistItemId: itemId // Unique ID for wishlist item
          };
          const updatedItems = [...wishlistItems, wishlistItem];
          set({ wishlistItems: updatedItems });
          return { success: true, action: 'added' };
        }
      },
      
      removeFromWishlist: (productId, variantId = null) => {
        const { wishlistItems } = get();
        const updatedItems = wishlistItems.filter(item => {
          if (variantId) {
            return !(item._id === productId && item.selectedVariant?._id === variantId);
          }
          return item._id !== productId;
        });
        set({ wishlistItems: updatedItems });
        return { success: true };
      },
      
      clearWishlist: () => {
        set({ wishlistItems: [] });
      },
      
      isInWishlist: (productId, variantId = null) => {
        const { wishlistItems } = get();
        if (variantId) {
          return wishlistItems.some(item => 
            item._id === productId && item.selectedVariant?._id === variantId
          );
        }
        return wishlistItems.some(item => item._id === productId);
      },
      
      getWishlistCount: () => {
        const { wishlistItems } = get();
        return wishlistItems.length;
      }
    }),
    {
      name: 'wishlist-storage',
    }
  )
);

export default useWishlistStore;