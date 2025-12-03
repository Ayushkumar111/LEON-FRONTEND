"use client";
import { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import useAuthStore from "../../lib/store/authStore";
import useWishlistStore from "../../lib/store/wishlistStore";
import useCartStore from "../../lib/store/cartStore";
import {
  User,
  Mail,
  Calendar,
  Shield,
  LogOut,
  MapPin,
  CreditCard,
  Lock,
  ChevronRight,
  Package,
  Heart,
  Settings,
  Trash2,
  ShoppingBag,
  ShoppingCart,
  Check,
  Edit,
  X,
  Save
} from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Image from "next/image";
import Link from "next/link";

export default function ProfilePage() {
  const { user, logout, getUserProfile, isAuthenticated, token, checkTokenExpiry } = useAuthStore();
  const { wishlistItems, removeFromWishlist, clearWishlist } = useWishlistStore();
  const { addToCart, isProductInCart, getCartItemByProductId } = useCartStore();
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('profile');
  const [addingToCart, setAddingToCart] = useState({});
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isChangeAddressModalOpen, setIsChangeAddressModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editProfileFormData, setEditProfileFormData] = useState({
    name: "",
    phone: ""
  });
  const [editAddressFormData, setEditAddressFormData] = useState({
    street: "",
    city: "",
    state: "",
    country: "",
    zipCode: ""
  });
  const router = useRouter();

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  useEffect(() => {
    // Token expiry check on component mount
    const isExpired = checkTokenExpiry();
    if (isExpired) {
      console.log('Token expired detected in Profile');
      return;
    }

    if (!isAuthenticated()) {
      toast.error("Please login to view profile");
      router.push("/auth");
      return;
    }
    
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const result = await getUserProfile();
        
        if (!result?.success) {
          // Check if error is due to token expiry
          if (result?.error?.includes('Session expired') || result?.error?.includes('expired') || result?.error?.includes('token')) {
            toast.error("Session expired. Please login again.");
            logout();
            router.push("/auth");
            return;
          }
          toast.error("Failed to load profile");
        }
      } catch (error) {
        console.error("Profile fetch error:", error);
        
        // Check if error is due to token expiry
        if (error.message?.includes('Session expired') || error.message?.includes('expired') || error.message?.includes('token')) {
          toast.error("Session expired. Please login again.");
          logout();
          router.push("/auth");
          return;
        }
        
        toast.error("Error loading profile");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfile();
  }, [isAuthenticated, getUserProfile, router, logout, checkTokenExpiry]);

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#wishlist') {
        setActiveSection('wishlist');
      } else {
        setActiveSection('profile');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Initialize edit profile form data when user data is available
  useEffect(() => {
    if (user) {
      setEditProfileFormData({
        name: user.name || "",
        phone: user.phone || ""
      });

      // Initialize address form data
      if (user.address && typeof user.address === 'object') {
        setEditAddressFormData({
          street: user.address.street || "",
          city: user.address.city || "",
          state: user.address.state || "",
          country: user.address.country || "",
          zipCode: user.address.zipCode || ""
        });
      }
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    toast.success("Successfully logged out!");
    router.push("/");
  };

  const handleRemoveFromWishlist = (productId, variantId = null) => {
    removeFromWishlist(productId, variantId);
    toast.success('Removed from wishlist');
  };

  const handleClearWishlist = () => {
    if (wishlistItems.length === 0) {
      toast.error('Wishlist is already empty');
      return;
    }
    
    if (confirm('Are you sure you want to clear your entire wishlist?')) {
      clearWishlist();
      toast.success('Wishlist cleared');
    }
  };

  // Updated function to handle variants
  const handleAddToCartFromWishlist = async (product) => {
    // Token expiry check
    const isExpired = checkTokenExpiry();
    if (isExpired) {
      toast.error('Session expired. Please login again.');
      router.push('/auth');
      return;
    }

    if (!isAuthenticated()) {
      toast.error('Please login to add items to cart');
      router.push('/auth');
      return;
    }

    // CHECK IF PRODUCT IS ALREADY IN CART
    if (isProductInCart(product._id)) {
      toast.error('This product is already in your cart!');
      return;
    }

    // Check if product has variants and get first available variant
    let variantId = null;
    if (product.variants && product.variants.length > 0) {
      const availableVariant = product.variants.find(variant => variant.isAvailable !== false);
      if (availableVariant) {
        variantId = availableVariant._id;
      } else {
        toast.error('No available variants for this product');
        return;
      }
    }

    // Check stock quantity
    const stockQuantity = variantId 
      ? product.variants.find(v => v._id === variantId)?.stockQuantity 
      : product.stockQuantity;

    if (stockQuantity === 0) {
      toast.error('This product is out of stock');
      return;
    }

    setAddingToCart(prev => ({ ...prev, [product._id]: true }));
    
    try {
      await addToCart(product._id, 1, product, variantId);
    } catch (error) {
      // Error handled in store
      if (error.message?.includes('Session expired')) {
        toast.error('Session expired. Please login again.');
        logout();
        router.push('/auth');
      }
    } finally {
      setAddingToCart(prev => ({ ...prev, [product._id]: false }));
    }
  };

  const handleSidebarClick = (itemName) => {
    toast.success(`${itemName} section coming soon!`);
  };

  // Open edit profile modal
  const handleOpenEditProfileModal = () => {
    setIsEditProfileModalOpen(true);
  };

  // Close edit profile modal
  const handleCloseEditProfileModal = () => {
    setIsEditProfileModalOpen(false);
  };

  // Open change address modal
  const handleOpenChangeAddressModal = () => {
    setIsChangeAddressModalOpen(true);
  };

  // Close change address modal
  const handleCloseChangeAddressModal = () => {
    setIsChangeAddressModalOpen(false);
  };

  // Handle profile form input changes
  const handleProfileInputChange = (e) => {
    const { name, value } = e.target;
    setEditProfileFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle address form input changes
  const handleAddressInputChange = (e) => {
    const { name, value } = e.target;
    setEditAddressFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Update profile API call (only name and phone)
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    // Token expiry check
    const isExpired = checkTokenExpiry();
    if (isExpired) {
      toast.error('Session expired. Please login again.');
      setIsEditProfileModalOpen(false);
      logout();
      router.push('/auth');
      return;
    }

    if (!token) {
      toast.error('Authentication required');
      setIsEditProfileModalOpen(false);
      return;
    }

    if (!editProfileFormData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    try {
      setIsUpdating(true);

      const updateData = {
        name: editProfileFormData.name.trim(),
        phone: editProfileFormData.phone.trim()
      };

      console.log('Sending profile update data:', updateData);

      const response = await fetch(`${BACKEND_URL}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();
      console.log('Profile update response:', data);

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired
          toast.error('Session expired. Please login again.');
          logout();
          setIsEditProfileModalOpen(false);
          router.push('/auth');
          return;
        }
        throw new Error(data.message || 'Failed to update profile');
      }

      if (data.success) {
        toast.success('Profile updated successfully!');
        
        // Refresh user data
        await getUserProfile();
        
        // Close modal
        handleCloseEditProfileModal();
      } else {
        throw new Error(data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Update profile error:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  // Update address API call
  const handleUpdateAddress = async (e) => {
    e.preventDefault();
    
    // Token expiry check
    const isExpired = checkTokenExpiry();
    if (isExpired) {
      toast.error('Session expired. Please login again.');
      setIsChangeAddressModalOpen(false);
      logout();
      router.push('/auth');
      return;
    }
    
    if (!token) {
      toast.error('Authentication required');
      setIsChangeAddressModalOpen(false);
      return;
    }

    try {
      setIsUpdating(true);

      const updateData = {
        name: user.name, // Keep existing name
        phone: user.phone, // Keep existing phone
        address: editAddressFormData
      };

      console.log('Sending address update data:', updateData);

      const response = await fetch(`${BACKEND_URL}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();
      console.log('Address update response:', data);

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired
          toast.error('Session expired. Please login again.');
          logout();
          setIsChangeAddressModalOpen(false);
          router.push('/auth');
          return;
        }
        throw new Error(data.message || 'Failed to update address');
      }

      if (data.success) {
        toast.success('Address updated successfully!');
        
        // Refresh user data
        await getUserProfile();
        
        // Close modal
        handleCloseChangeAddressModal();
      } else {
        throw new Error(data.message || 'Failed to update address');
      }
    } catch (error) {
      console.error('Update address error:', error);
      toast.error(error.message || 'Failed to update address');
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString) => {
    try {
      if (!dateString) return "-";
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "-";
    }
  };

  // Format address function
  const formatAddress = (address) => {
    if (!address) return "Not provided";
    
    if (typeof address === 'string') {
      return address;
    }
    
    // If address is an object
    if (typeof address === 'object') {
      const { street, city, state, country, zipCode } = address;
      const parts = [street, city, state, country, zipCode].filter(Boolean);
      return parts.join(', ');
    }
    
    return "Not provided";
  };

  const getRoleDisplay = (roles) => {
    if (roles?.includes("admin")) return "Administrator";
    if (roles?.includes("user")) return "User";
    return "User";
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

  // Updated function to get product image with variants support
  const getProductImage = (product) => {
    // First check if product has selected variant with images
    if (product.selectedVariant && product.selectedVariant.images && product.selectedVariant.images.length > 0) {
      return product.selectedVariant.images[0];
    }
    
    // Then check if product has variants with images
    if (product.variants && product.variants.length > 0) {
      const firstVariant = product.variants[0];
      if (firstVariant.images && firstVariant.images.length > 0) {
        return firstVariant.images[0];
      }
    }
    
    // Then check product images
    if (product.images && product.images.length > 0) {
      return product.images[0];
    }
    
    // Fallback images
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
    };
    return fallbackImages[product.category] || '/images/product1.png';
  };

  // Get available stock for product
  const getProductStock = (product) => {
    if (product.variants && product.variants.length > 0) {
      // Return total stock of all variants
      return product.variants.reduce((total, variant) => total + (variant.stockQuantity || 0), 0);
    }
    return product.stockQuantity || 0;
  };

  // Check if product has available variants
  const hasAvailableVariants = (product) => {
    if (!product.variants || product.variants.length === 0) return true; // No variants = always available
    return product.variants.some(variant => variant.isAvailable !== false && (variant.stockQuantity || 0) > 0);
  };

  // CHECK IF PRODUCT IS IN CART
  const isProductInWishlistCart = (productId) => {
    return isProductInCart(productId);
  };

  // GET CART ITEM QUANTITY
  const getCartItemQuantity = (productId) => {
    const cartItem = getCartItemByProductId(productId);
    return cartItem ? cartItem.quantity : 0;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white text-gray-900 font-sans">
        <Header />
        <div className="pt-24 flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading profile...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white text-gray-900 font-sans">
        <Header />
        <div className="pt-24 flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <p className="text-gray-600">No user data found. Please login again.</p>
            <button 
              onClick={() => router.push('/auth')}
              className="mt-4 bg-black text-white px-6 py-2 hover:bg-gray-800 transition-colors"
            >
              Go to Login
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      <Header />

      <div className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="mb-8">
            <h1 className="text-3xl font-semibold mb-2">My Account</h1>
            <p className="text-gray-600">
              Manage your personal information and preferences
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
              <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-24">
                <div className="space-y-2">
                  <div 
                    onClick={() => {
                      setActiveSection('profile');
                      window.location.hash = '';
                    }}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      activeSection === 'profile' 
                        ? 'bg-gray-900 text-white' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    <span className="font-medium">Profile</span>
                  </div>
                  
                  <div 
                    onClick={() => {
                      setActiveSection('wishlist');
                      window.location.hash = 'wishlist';
                    }}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      activeSection === 'wishlist' 
                        ? 'bg-gray-900 text-white' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Heart className="w-4 h-4" />
                    <span>Wishlist {wishlistItems.length > 0 && `(${wishlistItems.length})`}</span>
                  </div>
                  
                  {[
                    { icon: Package, label: "Orders" },
                    { icon: MapPin, label: "Addresses" },
                    { icon: CreditCard, label: "Payment Methods" },
                    { icon: Settings, label: "Settings" }
                  ].map((item, index) => (
                    <div
                      key={index}
                      onClick={() => handleSidebarClick(item.label)}
                      className="flex items-center gap-3 p-3 text-gray-500 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {activeSection === 'profile' ? (
                <>
                  {/* Profile Header */}
                  <div className="bg-gray-900 text-white rounded-xl overflow-hidden mb-8">
                    <div className="p-8">
                      <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className="relative">
                          {user.avatar ? (
                            <Image
                              src={user.avatar}
                              alt={user.name}
                              width={100}
                              height={100}
                              className="rounded-full object-cover border-4 border-white/20"
                            />
                          ) : (
                            <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center text-2xl font-semibold border-4 border-white/20">
                              {user.name
                                .split(" ")
                                .map((w) => w[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)}
                            </div>
                          )}
                          <div className="absolute -bottom-2 -right-2 bg-yellow-400 w-8 h-8 rounded-full flex items-center justify-center text-xs text-gray-900 border-2 border-gray-900">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                              <path d="M12 1v6" stroke="#111" strokeWidth="2" strokeLinecap="round" />
                              <circle cx="12" cy="16" r="7" stroke="#111" strokeWidth="2" />
                            </svg>
                          </div>
                        </div>

                        <div className="flex-1 text-center md:text-left">
                          <h2 className="text-2xl md:text-3xl font-semibold mb-2">{user.name}</h2>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300 mb-3">
                            <span className="bg-white/10 px-3 py-1 rounded-full">
                              {getRoleDisplay(user.roles)}
                            </span>
                            <span>Member since {formatDate(user.createdAt)}</span>
                          </div>
                          <p className="text-gray-400">{user.email}</p>
                        </div>

                        <button
                          onClick={handleOpenEditProfileModal}
                          className="bg-white/10 border border-white/20 px-6 py-2 rounded-lg text-sm hover:bg-white/20 transition-colors flex items-center gap-2"
                        >
                          <Edit className="w-4 h-4" />
                          Edit Profile
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Personal Information */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                        <h3 className="text-xl font-semibold flex items-center gap-3 mb-3 sm:mb-0">
                          <User className="w-5 h-5 text-gray-600" />
                          Personal Information
                        </h3>
                        <button 
                          onClick={handleOpenEditProfileModal}
                          className="border border-gray-300 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors flex items-center gap-2"
                        >
                          <Edit className="w-4 h-4" />
                          Edit Profile
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="text-sm text-gray-500 block mb-2">Full Name</label>
                          <p className="text-gray-900 font-medium">{user.name}</p>
                        </div>

                        <div>
                          <label className="text-sm text-gray-500 block mb-2 items-center gap-2">
                            <Mail className="w-4 h-4" /> 
                            Email Address
                          </label>
                          <p className="text-gray-900 font-medium">{user.email}</p>
                        </div>

                        <div>
                          <label className="text-sm text-gray-500 block mb-2">Phone Number</label>
                          <p className="text-gray-900 font-medium">{user.phone || "Not provided"}</p>
                        </div>

                        <div>
                          <label className="text-sm text-gray-500 block mb-2">
                            <Calendar className="w-4 h-4 inline mr-2" />
                            Date of Birth
                          </label>
                          <p className="text-gray-900 font-medium">Not provided</p>
                        </div>
                      </div>
                    </div>

                    {/* Shipping Address */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                        <h3 className="text-xl font-semibold flex items-center gap-3 mb-3 sm:mb-0">
                          <MapPin className="w-5 h-5 text-gray-600" />
                          Shipping Address
                        </h3>
                        <button 
                          onClick={handleOpenChangeAddressModal}
                          className="border border-gray-300 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors flex items-center gap-2"
                        >
                          <Edit className="w-4 h-4" />
                          Change Address
                        </button>
                      </div>

                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-start gap-4">
                          <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center flex-0">
                            <MapPin className="w-6 h-6 text-green-700" />
                          </div>
                          <div className="flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                              <p className="font-semibold text-gray-900">Primary Address</p>
                              <span className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full mt-1 sm:mt-0">
                                Default
                              </span>
                            </div>
                            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                              {formatAddress(user.address)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={handleOpenChangeAddressModal}
                        className="mt-4 text-gray-600 hover:text-gray-900 text-sm flex items-center gap-2 transition-colors"
                      >
                        + Add New Address
                      </button>
                    </div>

                    {/* Security & Privacy */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <h3 className="text-xl font-semibold mb-6 flex items-center gap-3">
                        <Shield className="w-5 h-5 text-gray-600" />
                        Security & Privacy
                      </h3>

                      <div className="space-y-4">
                        {[
                          {
                            icon: Lock,
                            title: "Change Password",
                            description: "Update your account password",
                            onClick: () => handleSidebarClick("Change Password")
                          },
                          {
                            icon: Shield,
                            title: "Two-Factor Authentication",
                            description: "Add an extra layer of security",
                            onClick: () => handleSidebarClick("Two-Factor Authentication")
                          },
                          {
                            icon: Mail,
                            title: "Privacy Settings",
                            description: "Control your data and visibility",
                            onClick: () => handleSidebarClick("Privacy Settings")
                          }
                        ].map((item, index) => (
                          <div
                            key={index}
                            onClick={item.onClick}
                            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                <item.icon className="w-5 h-5 text-gray-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{item.title}</p>
                                <p className="text-sm text-gray-500">{item.description}</p>
                              </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Account Actions */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h4 className="font-semibold text-lg mb-1">Account Actions</h4>
                          <p className="text-gray-600 text-sm">Manage your account status</p>
                        </div>
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 px-6 py-3 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors mt-4 sm:mt-0"
                        >
                          <LogOut className="w-4 h-4" />
                          Logout
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-6">
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                      <div>
                        <h3 className="text-xl font-semibold flex items-center gap-3 mb-2">
                          <Heart className="w-5 h-5 text-red-500" />
                          My Wishlist
                        </h3>
                        <p className="text-gray-600">
                          {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'} saved
                        </p>
                      </div>
                      
                      {wishlistItems.length > 0 && (
                        <button 
                          onClick={handleClearWishlist}
                          className="flex items-center gap-2 text-red-600 hover:text-red-700 text-sm mt-4 sm:mt-0"
                        >
                          <Trash2 className="w-4 h-4" />
                          Clear All
                        </button>
                      )}
                    </div>

                    {wishlistItems.length === 0 ? (
                      <div className="text-center py-12">
                        <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h4 className="text-lg font-semibold mb-2">Your wishlist is empty</h4>
                        <p className="text-gray-600 mb-6">Start adding products you love to your wishlist!</p>
                        <Link href="/shop">
                          <button className="bg-black text-white px-6 py-3 hover:bg-gray-800 transition-colors">
                            Start Shopping
                          </button>
                        </Link>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {wishlistItems.map((item) => {
                          const isInCart = isProductInWishlistCart(item._id);
                          const cartQuantity = getCartItemQuantity(item._id);
                          const stockQuantity = getProductStock(item);
                          const hasVariants = item.variants && item.variants.length > 0;
                          const isAvailable = hasAvailableVariants(item);
                          
                          return (
                            <div key={item.wishlistItemId || item._id} className="bg-white border border-gray-200 rounded-lg overflow-hidden group hover:shadow-md transition-shadow">
                              <Link 
                                href={`/shop/${getSlugFromCategory(item.category)}/${item._id}`}
                                className="block"
                              >
                                <div className="relative w-full h-48 bg-gray-100 overflow-hidden">
                                  <Image
                                    src={getProductImage(item)}
                                    alt={item.title}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                    unoptimized
                                  />
                                  
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleRemoveFromWishlist(item._id, item.selectedVariant?._id);
                                    }}
                                    className="absolute top-2 right-2 bg-white/90 hover:bg-white p-1.5 rounded-full transition-colors"
                                    aria-label="Remove from wishlist"
                                  >
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                  </button>

                                  {/* CART INDICATOR BADGE */}
                                  {isInCart && (
                                    <div className="absolute top-2 left-2 text-xs bg-green-600 text-white px-2 py-1 flex items-center gap-1">
                                      <Check className="w-3 h-3" />
                                      In Cart ({cartQuantity})
                                    </div>
                                  )}

                                  {item.bestseller && (
                                    <div className="absolute left-2 bottom-2 text-xs bg-[#b9965d] text-white px-2 py-1">
                                      Best Seller
                                    </div>
                                  )}

                                  {/* Selected Variant Indicator */}
                                  {item.selectedVariant && (
                                    <div className="absolute right-2 bottom-2 text-xs bg-blue-600 text-white px-2 py-1 flex items-center gap-1">
                                      <div 
                                        className="w-3 h-3 rounded-full border border-white"
                                        style={{ backgroundColor: item.selectedVariant.hexCode }}
                                      ></div>
                                      {item.selectedVariant.colorName}
                                    </div>
                                  )}
                                </div>
                              </Link>
                              
                              <div className="p-4">
                                <Link 
                                  href={`/shop/${getSlugFromCategory(item.category)}/${item._id}`}
                                  className="block"
                                >
                                  <p className="text-sm text-gray-500 mb-1">{item.category}</p>
                                  <h4 className="font-medium text-gray-900 mb-2 hover:text-gray-700 transition-colors">
                                    {item.title}
                                  </h4>
                                  <div className="flex items-center justify-between">
                                    <span className="text-lg font-semibold text-gray-900">
                                      ${item.price?.toLocaleString()}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      Added {new Date(item.addedAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                </Link>
                                
                                <div className="mt-4 flex gap-2">
                                  {/* ADD TO CART BUTTON */}
                                  {isInCart ? (
                                    <button 
                                      disabled
                                      className="flex-1 bg-green-600 text-white py-2 text-sm flex items-center justify-center gap-2 cursor-default"
                                    >
                                      <Check className="w-4 h-4" />
                                      Added to Cart ({cartQuantity})
                                    </button>
                                  ) : (
                                    <button 
                                      onClick={() => handleAddToCartFromWishlist(item)}
                                      disabled={addingToCart[item._id] || !isAvailable || stockQuantity === 0}
                                      className="flex-1 bg-black text-white py-2 text-sm hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                      <ShoppingCart className="w-4 h-4" />
                                      {addingToCart[item._id] 
                                        ? 'Adding...' 
                                        : !isAvailable 
                                          ? 'No Variants' 
                                          : stockQuantity > 0 
                                            ? 'Add to Cart' 
                                            : 'Out of Stock'
                                      }
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditProfileModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Edit Profile</h2>
              <button 
                onClick={handleCloseEditProfileModal}
                className="text-gray-500 hover:text-gray-700"
                disabled={isUpdating}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleUpdateProfile} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={editProfileFormData.name}
                  onChange={handleProfileInputChange}
                  className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:border-gray-900"
                  required
                  disabled={isUpdating}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={editProfileFormData.phone}
                  onChange={handleProfileInputChange}
                  className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:border-gray-900"
                  disabled={isUpdating}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseEditProfileModal}
                  disabled={isUpdating}
                  className="flex-1 border border-gray-300 px-4 py-2 rounded hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2"
                >
                  {isUpdating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Address Modal */}
      {isChangeAddressModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Change Address</h2>
              <button 
                onClick={handleCloseChangeAddressModal}
                className="text-gray-500 hover:text-gray-700"
                disabled={isUpdating}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleUpdateAddress} className="p-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Street Address
                  </label>
                  <input
                    type="text"
                    name="street"
                    value={editAddressFormData.street}
                    onChange={handleAddressInputChange}
                    className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:border-gray-900"
                    disabled={isUpdating}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={editAddressFormData.city}
                      onChange={handleAddressInputChange}
                      className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:border-gray-900"
                      disabled={isUpdating}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={editAddressFormData.state}
                      onChange={handleAddressInputChange}
                      className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:border-gray-900"
                      disabled={isUpdating}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Country
                    </label>
                    <input
                      type="text"
                      name="country"
                      value={editAddressFormData.country}
                      onChange={handleAddressInputChange}
                      className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:border-gray-900"
                      disabled={isUpdating}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ZIP Code
                    </label>
                    <input
                      type="text"
                      name="zipCode"
                      value={editAddressFormData.zipCode}
                      onChange={handleAddressInputChange}
                      className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:border-gray-900"
                      disabled={isUpdating}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseChangeAddressModal}
                  disabled={isUpdating}
                  className="flex-1 border border-gray-300 px-4 py-2 rounded hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2"
                >
                  {isUpdating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Address
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}