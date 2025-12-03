import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import toast from 'react-hot-toast';

// Helper function to get valid auth token with expiry check
const getValidAuthToken = () => {
  if (typeof window === 'undefined') return null;
  
  // Try localStorage first
  const localStorageToken = localStorage.getItem('auth_token');
  if (!localStorageToken) return null;
  
  // Check token expiry
  try {
    const payload = JSON.parse(atob(localStorageToken.split('.')[1]));
    const expiry = payload.exp * 1000;
    
    if (Date.now() >= expiry) {
      // Token expired, logout user
      const authStore = require('./authStore').default;
      authStore.getState().logout();
      toast.error('Session expired. Please login again.');
      return null;
    }
    
    return localStorageToken;
  } catch (error) {
    // Invalid token, logout user
    const authStore = require('./authStore').default;
    authStore.getState().logout();
    return null;
  }
};

const useCartStore = create(
  persist(
    (set, get) => ({
      cart: null,
      loading: false,
      error: null,
      syncing: false,

      // Fetch cart from backend with token expiry check
      fetchCart: async () => {
        try {
          set({ loading: true, error: null });
          
          const token = getValidAuthToken();
          if (!token) {
            set({ loading: false, cart: null });
            return { success: false, error: 'Session expired. Please login again.' };
          }

          const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/cart`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          const data = await response.json();

          if (!response.ok) {
            if (response.status === 401) {
              // Token expired
              const authStore = require('./authStore').default;
              authStore.getState().logout();
              throw new Error('Session expired. Please login again.');
            }
            throw new Error(data.message || 'Failed to fetch cart');
          }

          set({ 
            cart: data.data,
            loading: false,
            error: null 
          });

          console.log('🛒 Cart fetched:', data.data);
          return { success: true, data: data.data };
        } catch (error) {
          console.error('Fetch cart error:', error);
          set({ 
            loading: false, 
            error: error.message,
            cart: null 
          });
          
          if (error.message.includes('Session expired')) {
            toast.error('Session expired. Please login again.');
          }
          
          return { success: false, error: error.message };
        }
      },

      // Add item to cart with token expiry check
      addToCart: async (productId, quantity = 1, productData = null, variantId = null) => {
        const token = getValidAuthToken();
        if (!token) {
          toast.error('Session expired. Please login again.');
          return { success: false, error: 'Session expired. Please login again.' };
        }

        // Validate stock before adding (using productData if available to avoid extra network request)
        const stockValidation = get().validateStockLocal(productId, variantId, quantity, productData);
        if (!stockValidation.valid) {
          toast.error(stockValidation.message);
          return { success: false, error: stockValidation.message };
        }

        // Save previous state for rollback
        const previousCart = get().cart;
        
        // OPTIMISTIC UPDATE - immediately update UI
        const currentCart = get().cart || { items: [], itemCount: 0, subtotal: 0, total: 0 };
        
        // Check if same product with same variant already exists in cart
        const existingItemIndex = currentCart.items?.findIndex(
          item => item.productId?._id === productId && item.variant?._id === variantId
        );
        
        let optimisticCart;
        if (existingItemIndex > -1) {
          // Item exists, update quantity
          const updatedItems = [...currentCart.items];
          const existingItem = updatedItems[existingItemIndex];
          const newQuantity = existingItem.quantity + quantity;
          
          updatedItems[existingItemIndex] = {
            ...existingItem,
            quantity: newQuantity,
            itemTotal: existingItem.priceAtAdd * newQuantity
          };
          
          optimisticCart = {
            ...currentCart,
            items: updatedItems,
            itemCount: currentCart.itemCount + quantity,
            subtotal: currentCart.subtotal + (existingItem.priceAtAdd * quantity),
            total: currentCart.total + (existingItem.priceAtAdd * quantity)
          };
        } else {
          // New item - create temporary item
          const variantPrice = variantId 
            ? productData?.variants?.find(v => v._id === variantId)?.price 
            : productData?.price;
            
          const priceAtAdd = variantPrice || productData?.price || 0;
          const variantData = variantId 
            ? productData?.variants?.find(v => v._id === variantId)
            : null;
            
          const tempItem = {
            _id: `temp_${Date.now()}`,
            productId: productData || { _id: productId },
            variant: variantData ? {
              _id: variantData._id,
              colorName: variantData.colorName,
              hexCode: variantData.hexCode,
              price: variantData.price,
              images: variantData.images || [],
              stockQuantity: variantData.stockQuantity
            } : null,
            quantity: quantity,
            priceAtAdd: priceAtAdd,
            itemTotal: priceAtAdd * quantity
          };
          
          optimisticCart = {
            ...currentCart,
            items: [...(currentCart.items || []), tempItem],
            itemCount: (currentCart.itemCount || 0) + quantity,
            subtotal: (currentCart.subtotal || 0) + (priceAtAdd * quantity),
            total: (currentCart.total || 0) + (priceAtAdd * quantity)
          };
        }
        
        // Immediately update UI
        set({ cart: optimisticCart, error: null });
        toast.success('Item added to cart!');

        // Sync with backend in background
        set({ syncing: true });
        try {
          // Prepare request body with variantId
          const requestBody = {
            productId,
            quantity: parseInt(quantity)
          };
          
          // Add variantId if provided
          if (variantId) {
            requestBody.variantId = variantId;
          }

          const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/cart/items`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          });

          const data = await response.json();

          if (!response.ok) {
            if (response.status === 401) {
              // Token expired
              const authStore = require('./authStore').default;
              authStore.getState().logout();
              throw new Error('Session expired. Please login again.');
            }
            throw new Error(data.message || 'Failed to add item to cart');
          }

          // Update with real data from server
          set({ 
            cart: data.data,
            syncing: false,
            error: null 
          });

          console.log('✅ Item added to cart:', data.data);
          return { success: true, data: data.data };
        } catch (error) {
          console.error('Add to cart error:', error);
          // ROLLBACK on error
          set({ 
            cart: previousCart,
            syncing: false,
            error: error.message 
          });
          
          if (error.message.includes('Session expired')) {
            toast.error('Session expired. Please login again.');
          } else {
            toast.error(error.message || 'Failed to add item to cart');
          }
          
          return { success: false, error: error.message };
        }
      },

      // Local stock validation using already-available product data (no network request)
      validateStockLocal: (productId, variantId = null, quantity = 1, productData = null) => {
        // First, check current cart items
        const currentCart = get().cart;
        const existingCartQuantity = currentCart?.items
          ?.filter(item => item.productId._id === productId && item.variant?._id === variantId)
          .reduce((total, item) => total + item.quantity, 0) || 0;

        const totalRequestedQuantity = existingCartQuantity + quantity;

        // Use the productData that's already available from the component
        if (!productData) {
          // If no product data, allow the request - backend will validate
          return { valid: true, availableStock: Infinity };
        }

        let availableStock;

        if (variantId) {
          // Check variant-specific stock
          const variant = productData.variants?.find(v => v._id === variantId);
          if (!variant) {
            return { valid: false, message: 'Variant not found' };
          }
          availableStock = variant.stockQuantity || 0;
        } else {
          // Check product-level stock
          availableStock = productData.stockQuantity || 0;
        }

        if (availableStock === 0) {
          return { 
            valid: false, 
            message: 'This item is out of stock' 
          };
        }

        if (totalRequestedQuantity > availableStock) {
          return { 
            valid: false, 
            message: `Only ${availableStock} items available in this variant. You already have ${existingCartQuantity} in cart.` 
          };
        }

        return { valid: true, availableStock };
      },

      // Validate stock with network request (kept for cases where fresh data is needed, like updateCartItem)
      validateStock: async (productId, variantId = null, requestedQuantity = 1) => {
        try {
          // Fetch latest product data to get current stock
          const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/products/${productId}`);
          const data = await response.json();

          if (!response.ok) {
            throw new Error('Failed to fetch product data');
          }

          const product = data.data;
          let availableStock;

          if (variantId) {
            // Check variant-specific stock
            const variant = product.variants?.find(v => v._id === variantId);
            if (!variant) {
              return { valid: false, message: 'Variant not found' };
            }
            availableStock = variant.stockQuantity || 0;
          } else {
            // Check product-level stock
            availableStock = product.stockQuantity || 0;
          }

          if (availableStock === 0) {
            return { 
              valid: false, 
              message: 'This item is out of stock' 
            };
          }

          // Check if requested quantity exceeds available stock
          if (requestedQuantity > availableStock) {
            return { 
              valid: false, 
              message: `Only ${availableStock} items available in this variant.` 
            };
          }

          return { valid: true, availableStock };
        } catch (error) {
          console.error('Stock validation error:', error);
          return { valid: false, message: 'Failed to validate stock' };
        }
      },

      // Update item quantity with token expiry check
      updateCartItem: async (itemId, newQuantity) => {
        const token = getValidAuthToken();
        if (!token) {
          toast.error('Session expired. Please login again.');
          return { success: false, error: 'Session expired' };
        }

        if (newQuantity < 1) {
          return get().removeCartItem(itemId);
        }

        // Get current item to validate stock
        const currentCart = get().cart;
        const currentItem = currentCart?.items?.find(item => item._id === itemId);
        if (!currentItem) {
          return { success: false, error: 'Item not found in cart' };
        }

        // Validate stock for the NEW quantity only
        const stockValidation = await get().validateStock(
          currentItem.productId._id, 
          currentItem.variant?._id, 
          newQuantity
        );
        
        if (!stockValidation.valid) {
          toast.error(stockValidation.message);
          return { success: false, error: stockValidation.message };
        }

        // Save previous state for rollback
        const previousCart = get().cart;
        
        // OPTIMISTIC UPDATE - immediately update UI
        if (currentCart && currentCart.items) {
          const itemIndex = currentCart.items.findIndex(item => item._id === itemId);
          if (itemIndex > -1) {
            const oldQuantity = currentCart.items[itemIndex].quantity;
            const quantityDiff = newQuantity - oldQuantity;
            const updatedItems = [...currentCart.items];
            const itemPrice = updatedItems[itemIndex].priceAtAdd || 0;
            
            updatedItems[itemIndex] = {
              ...updatedItems[itemIndex],
              quantity: newQuantity,
              itemTotal: itemPrice * newQuantity
            };
            
            // Calculate new totals
            const newSubtotal = updatedItems.reduce((sum, item) => sum + (item.itemTotal || 0), 0);
            
            const optimisticCart = {
              ...currentCart,
              items: updatedItems,
              itemCount: currentCart.itemCount + quantityDiff,
              subtotal: newSubtotal,
              total: newSubtotal + (currentCart.shippingCost || 0) - (currentCart.discountAmount || 0)
            };
            
            // Immediately update UI
            set({ cart: optimisticCart, error: null });
          }
        }

        // Sync with backend in background
        set({ syncing: true });
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/cart/items/${itemId}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              quantity: parseInt(newQuantity)
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            if (response.status === 401) {
              // Token expired
              const authStore = require('./authStore').default;
              authStore.getState().logout();
              throw new Error('Session expired. Please login again.');
            }
            throw new Error(data.message || 'Failed to update cart item');
          }

          // Update with real data from server
          set({ 
            cart: data.data,
            syncing: false,
            error: null 
          });

          return { success: true, data: data.data };
        } catch (error) {
          console.error('Update cart item error:', error);
          // ROLLBACK on error
          set({ 
            cart: previousCart,
            syncing: false,
            error: error.message 
          });
          
          if (error.message.includes('Session expired')) {
            toast.error('Session expired. Please login again.');
          } else {
            toast.error(error.message || 'Failed to update cart');
          }
          
          return { success: false, error: error.message };
        }
      },

      // Remove item from cart with token expiry check
      removeCartItem: async (itemId) => {
        const token = getValidAuthToken();
        if (!token) {
          toast.error('Session expired. Please login again.');
          return { success: false, error: 'Session expired' };
        }

        // Save previous state for rollback
        const previousCart = get().cart;
        
        // OPTIMISTIC UPDATE - immediately update UI
        const currentCart = get().cart;
        if (currentCart && currentCart.items) {
          const itemToRemove = currentCart.items.find(item => item._id === itemId);
          if (itemToRemove) {
            const updatedItems = currentCart.items.filter(item => item._id !== itemId);
            const removedQuantity = itemToRemove.quantity || 1;
            const removedTotal = itemToRemove.itemTotal || 0;
            
            const optimisticCart = {
              ...currentCart,
              items: updatedItems,
              itemCount: Math.max(0, currentCart.itemCount - removedQuantity),
              subtotal: Math.max(0, (currentCart.subtotal || 0) - removedTotal),
              total: Math.max(0, (currentCart.total || 0) - removedTotal)
            };
            
            // Immediately update UI
            set({ cart: optimisticCart, error: null });
            toast.success('Item removed from cart!');
          }
        }

        // Sync with backend in background
        set({ syncing: true });
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/cart/items/${itemId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          const data = await response.json();

          if (!response.ok) {
            if (response.status === 401) {
              // Token expired
              const authStore = require('./authStore').default;
              authStore.getState().logout();
              throw new Error('Session expired. Please login again.');
            }
            throw new Error(data.message || 'Failed to remove item from cart');
          }

          // Update with real data from server
          set({ 
            cart: data.data,
            syncing: false,
            error: null 
          });

          return { success: true, data: data.data };
        } catch (error) {
          console.error('Remove cart item error:', error);
          // ROLLBACK on error
          set({ 
            cart: previousCart,
            syncing: false,
            error: error.message 
          });
          
          if (error.message.includes('Session expired')) {
            toast.error('Session expired. Please login again.');
          } else {
            toast.error(error.message || 'Failed to remove item from cart');
          }
          
          return { success: false, error: error.message };
        }
      },

      // Clear entire cart with token expiry check
      clearCart: async () => {
        try {
          set({ loading: true, error: null });
          
          const token = getValidAuthToken();
          if (!token) {
            toast.error('Session expired. Please login again.');
            set({ loading: false });
            return { success: false, error: 'Session expired' };
          }

          const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/cart`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          const data = await response.json();

          if (!response.ok) {
            if (response.status === 401) {
              // Token expired
              const authStore = require('./authStore').default;
              authStore.getState().logout();
              throw new Error('Session expired. Please login again.');
            }
            throw new Error(data.message || 'Failed to clear cart');
          }

          // IMMEDIATE STATE UPDATE
          set({ 
            cart: data.data,
            loading: false,
            error: null 
          });

          toast.success('Cart cleared successfully!');
          return { success: true, data: data.data };
        } catch (error) {
          console.error('Clear cart error:', error);
          set({ 
            loading: false, 
            error: error.message 
          });
          
          if (error.message.includes('Session expired')) {
            toast.error('Session expired. Please login again.');
          } else {
            toast.error(error.message || 'Failed to clear cart');
          }
          
          return { success: false, error: error.message };
        }
      },

      // Apply coupon with token expiry check
      applyCoupon: async (couponCode) => {
        try {
          set({ loading: true, error: null });
          
          const token = getValidAuthToken();
          if (!token) {
            toast.error('Session expired. Please login again.');
            set({ loading: false });
            return { success: false, error: 'Session expired' };
          }

          const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/cart/coupon`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ couponCode }),
          });

          const data = await response.json();

          if (!response.ok) {
            if (response.status === 401) {
              // Token expired
              const authStore = require('./authStore').default;
              authStore.getState().logout();
              throw new Error('Session expired. Please login again.');
            }
            throw new Error(data.message || data.error || 'Failed to apply coupon');
          }

          // IMMEDIATE STATE UPDATE
          set({ 
            cart: data.data,
            loading: false,
            error: null 
          });

          toast.success('Coupon applied successfully!');
          return { success: true, data: data.data };
        } catch (error) {
          console.error('Apply coupon error:', error);
          set({ 
            loading: false, 
            error: error.message 
          });
          
          if (error.message.includes('Session expired')) {
            toast.error('Session expired. Please login again.');
          } else {
            toast.error(error.message || 'Failed to apply coupon');
          }
          
          return { success: false, error: error.message };
        }
      },

      // Remove coupon with token expiry check
      removeCoupon: async () => {
        try {
          set({ loading: true, error: null });
          
          const token = getValidAuthToken();
          if (!token) {
            toast.error('Session expired. Please login again.');
            set({ loading: false });
            return { success: false, error: 'Session expired' };
          }

          const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/cart/coupon`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          const data = await response.json();

          if (!response.ok) {
            if (response.status === 401) {
              // Token expired
              const authStore = require('./authStore').default;
              authStore.getState().logout();
              throw new Error('Session expired. Please login again.');
            }
            throw new Error(data.message || 'Failed to remove coupon');
          }

          // IMMEDIATE STATE UPDATE
          set({ 
            cart: data.data,
            loading: false,
            error: null 
          });

          toast.success('Coupon removed successfully!');
          return { success: true, data: data.data };
        } catch (error) {
          console.error('Remove coupon error:', error);
          set({ 
            loading: false, 
            error: error.message 
          });
          
          if (error.message.includes('Session expired')) {
            toast.error('Session expired. Please login again.');
          } else {
            toast.error(error.message || 'Failed to remove coupon');
          }
          
          return { success: false, error: error.message };
        }
      },

      // Get cart count for header
      getCartCount: () => {
        const cart = get().cart;
        const count = cart ? cart.itemCount : 0;
        return count;
      },

      // Check if product with specific variant is in cart
      isProductInCart: (productId, variantId = null) => {
        const cart = get().cart;
        if (!cart || !cart.items) return false;
        
        if (variantId) {
          return cart.items.some(item => 
            item.productId._id === productId && item.variant?._id === variantId
          );
        }
        
        return cart.items.some(item => item.productId._id === productId);
      },

      // Get cart item by product ID and variant ID
      getCartItemByProductId: (productId, variantId = null) => {
        const cart = get().cart;
        if (!cart || !cart.items) return null;
        
        if (variantId) {
          return cart.items.find(item => 
            item.productId._id === productId && item.variant?._id === variantId
          );
        }
        
        return cart.items.find(item => item.productId._id === productId);
      },

      // Get all cart items for a product (all variants)
      getCartItemsByProductId: (productId) => {
        const cart = get().cart;
        if (!cart || !cart.items) return [];
        return cart.items.filter(item => item.productId._id === productId);
      },

      // Remove cart items for specific product variants
      removeCartItemsByProductVariants: async (productId, variantIdsToRemove = []) => {
        try {
          const token = getValidAuthToken();
          if (!token) {
            toast.error('Session expired. Please login again.');
            return { success: false, error: 'Session expired' };
          }

          const currentCart = get().cart;
          if (!currentCart || !currentCart.items) {
            return { success: false, error: 'No cart found' };
          }

          // Filter out items that need to be removed
          const itemsToRemove = currentCart.items.filter(item => 
            item.productId._id === productId && 
            (variantIdsToRemove.length === 0 || variantIdsToRemove.includes(item.variant?._id))
          );

          // Remove each item sequentially
          for (const item of itemsToRemove) {
            await get().removeCartItem(item._id);
          }

          return { success: true };
        } catch (error) {
          console.error('Remove cart items by variants error:', error);
          return { success: false, error: error.message };
        }
      },

      // Clear error
      clearError: () => set({ error: null }),

      // Initialize cart when user logs in
      initializeCart: async () => {
        const token = getValidAuthToken();
        if (token) {
          await get().fetchCart();
        }
      },

      // Clear cart data on logout
      clearCartData: () => {
        set({ cart: null });
        console.log('🛒 Cart data cleared on logout');
      }
    }),
    {
      name: 'cart-storage',
    }
  )
);

export default useCartStore;