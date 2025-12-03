"use client";
import { useState, useEffect } from "react";
import { X, Trash2 } from "lucide-react";
import useAuthStore from "../../lib/store/authStore";
import useCartStore from "../../lib/store/cartStore";
import toast from "react-hot-toast";

export default function EditProductModal({ product, isOpen, onClose, onUpdate }) {
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    stockQuantity: '',
    bestseller: false,
    description: '',
    category: ''
  });
  
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(false);
  const { token } = useAuthStore();
  const { getCartItemsByProductId, removeCartItem, fetchCart } = useCartStore();

  useEffect(() => {
    if (product && isOpen) {
      setFormData({
        title: product.title || '',
        price: product.price || '',
        stockQuantity: product.stockQuantity || '',
        bestseller: product.bestseller || false,
        description: product.description || '',
        category: product.category || ''
      });
      
      // Initialize variants
      setVariants(product.variants || []);
    }
  }, [product, isOpen]);

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
        } else {
          // For products without variants, check product level stock
          if (updatedProduct.stockQuantity === 0) {
            console.log('Removing out-of-stock product from cart:', cartItem._id);
            await removeCartItem(cartItem._id);
          }
        }
      }
      
      // Refresh cart data
      await fetchCart();
      toast.success('Cart updated - out-of-stock items removed');
    } catch (error) {
      console.error('Error removing out-of-stock items:', error);
      toast.error('Error updating cart items');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!token) {
      toast.error('Authentication required');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/products/${product._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: formData.title,
          price: Number(formData.price),
          stockQuantity: Number(formData.stockQuantity),
          bestseller: formData.bestseller,
          description: formData.description,
          category: formData.category,
          variants: variants.map(variant => ({
            colorName: variant.colorName,
            hexCode: variant.hexCode,
            price: Number(variant.price),
            stockQuantity: Number(variant.stockQuantity),
            images: variant.images || [],
            isAvailable: variant.isAvailable !== false,
            sku: variant.sku || `SKU-${formData.title.replace(/\s+/g, '-').toUpperCase()}-${variant.colorName.replace(/\s+/g, '-').toUpperCase()}`
          }))
        })
      });

      const data = await response.json();

      if (data.success) {
        const updatedProduct = data.data;
        
        // Remove out-of-stock items from cart
        await removeOutOfStockItemsFromCart(updatedProduct);
        
        toast.success('Product updated successfully!');
        onUpdate(data.data);
        onClose();
      } else {
        throw new Error(data.message || 'Failed to update product');
      }
    } catch (error) {
      console.error('Update product error:', error);
      toast.error(error.message || 'Failed to update product');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Variant management functions
  const updateVariant = (index, field, value) => {
    setVariants(prev => prev.map((variant, i) => 
      i === index ? { ...variant, [field]: value } : variant
    ));
  };

  // Remove variant - Only allow if there are multiple variants
  const removeVariant = (index) => {
    if (variants.length <= 1) {
      toast.error('At least one variant is required');
      return;
    }
    setVariants(prev => prev.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Edit Product</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Product Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:border-gray-900"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Base Price ($) *
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:border-gray-900"
                required
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stock Quantity *
              </label>
              <input
                type="number"
                name="stockQuantity"
                value={formData.stockQuantity}
                onChange={handleChange}
                className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:border-gray-900"
                required
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:border-gray-900"
                required
              >
                <option value="">Select Category</option>
                <option value="Handbags">Handbags</option>
                <option value="Shoulder Bags">Shoulder Bags</option>
                <option value="Tote Bags">Tote Bags</option>
                <option value="Clutches">Clutches</option>
                <option value="Evening">Evening</option>
                <option value="Travel">Travel</option>
                <option value="Accessories">Accessories</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:border-gray-900"
            />
          </div>

          {/* Variants Section */}
          <div className="border-t pt-6">
            <div className="space-y-4">
              {variants.map((variant, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium">Variant {index + 1} - {variant.colorName}</h4>
                    {variants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeVariant(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Color Name
                      </label>
                      <input
                        type="text"
                        value={variant.colorName}
                        onChange={(e) => updateVariant(index, 'colorName', e.target.value)}
                        className="w-full border border-gray-300 px-2 py-1 text-sm rounded"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Color Code
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={variant.hexCode}
                          onChange={(e) => updateVariant(index, 'hexCode', e.target.value)}
                          className="w-10 h-8 border border-gray-300 rounded"
                        />
                        <input
                          type="text"
                          value={variant.hexCode}
                          onChange={(e) => updateVariant(index, 'hexCode', e.target.value)}
                          className="flex-1 border border-gray-300 px-2 py-1 text-sm rounded"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Price ($)
                      </label>
                      <input
                        type="number"
                        value={variant.price}
                        onChange={(e) => updateVariant(index, 'price', e.target.value)}
                        className="w-full border border-gray-300 px-2 py-1 text-sm rounded"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Stock
                      </label>
                      <input
                        type="number"
                        value={variant.stockQuantity}
                        onChange={(e) => updateVariant(index, 'stockQuantity', e.target.value)}
                        className="w-full border border-gray-300 px-2 py-1 text-sm rounded"
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      SKU
                    </label>
                    <input
                      type="text"
                      value={variant.sku}
                      onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                      className="w-full border border-gray-300 px-2 py-1 text-sm rounded"
                      placeholder="Auto-generated if empty"
                    />
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={variant.isAvailable !== false}
                      onChange={(e) => updateVariant(index, 'isAvailable', e.target.checked)}
                      className="rounded"
                      id={`available-${index}`}
                    />
                    <label htmlFor={`available-${index}`} className="text-xs text-gray-700">
                      Available for sale
                    </label>
                  </div>

                  {/* Stock Warning */}
                  {variant.stockQuantity === 0 && (
                    <div className="mt-2 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                      This variant will be removed from all carts when saved
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="bestseller"
              checked={formData.bestseller}
              onChange={handleChange}
              className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
            />
            <label className="ml-2 text-sm text-gray-700">
              Mark as Bestseller
            </label>
          </div>

          {/* Global Stock Warning */}
          {(formData.stockQuantity === 0 || variants.some(v => v.stockQuantity === 0)) && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-orange-800 mb-2">
                ⚠️ Stock Update Notice
              </h4>
              <p className="text-xs text-orange-700">
                Setting stock to 0 will automatically remove these items from all customer carts.
                Customers will need to re-add items when stock is available again.
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 px-4 py-2 rounded hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition-colors disabled:bg-gray-400"
            >
              {loading ? 'Updating...' : 'Update Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}