import { create } from 'zustand';
import { setAuthCookies, getValidAuthCookies, clearAuthCookies } from '../utils/cookies';
import toast from 'react-hot-toast';

const useAuthStore = create((set, get) => ({
  user: typeof window !== 'undefined' ? getValidAuthCookies().user : null,
  token: typeof window !== 'undefined' ? getValidAuthCookies().token : null,
  isLoading: false,
  error: null,

  setLoading: (loading) => set({ isLoading: loading }),
  
  setError: (error) => set({ error }),

  clearError: () => set({ error: null }),

  // Token expiry check karne ke liye function
  checkTokenExpiry: () => {
    if (typeof window === 'undefined') return true;
    
    const { token, user } = getValidAuthCookies();
    const isExpired = !token;
    
    if (isExpired && get().token) {
      // Token expired hai, logout karein
      get().logout();
      toast.error('Session expired. Please login again.');
      
      // Redirect to login page
      if (typeof window !== 'undefined') {
        window.location.href = '/auth';
      }
      return true;
    }
    
    // Token valid hai, state update karein
    if (token !== get().token || JSON.stringify(user) !== JSON.stringify(get().user)) {
      set({ token, user });
    }
    
    return false;
  },

  register: async (userData) => {
    try {
      set({ isLoading: true, error: null });
      
      console.log('Sending registration data:', userData);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();
      console.log('Registration response:', data);

      if (!response.ok) {
        const errorMessage = data.message || data.error || 'Registration failed';
        throw new Error(errorMessage);
      }

      if (typeof window !== 'undefined') {
        setAuthCookies(data.data.accessToken, data.data.user);
      }

      set({ 
        user: data.data.user, 
        token: data.data.accessToken,
        isLoading: false,
        error: null 
      });

      console.log('Registration successful, cookies saved');
      
      // Initialize cart after registration
      const cartStore = require('./cartStore').default;
      await cartStore.getState().initializeCart();
      
      return { success: true, data };
    } catch (error) {
      console.error('Registration error:', error);
      set({ 
        isLoading: false, 
        error: error.message 
      });
      return { success: false, error: error.message };
    }
  },

  login: async (loginData) => {
    try {
      set({ isLoading: true, error: null });
      
      console.log('Sending login data:', loginData);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();
      console.log('Login response:', data);

      if (!response.ok) {
        const errorMessage = data.message || data.error || 'Login failed';
        throw new Error(errorMessage);
      }

      if (typeof window !== 'undefined') {
        setAuthCookies(data.data.accessToken, data.data.user);
      }

      set({ 
        user: data.data.user, 
        token: data.data.accessToken,
        isLoading: false,
        error: null 
      });

      console.log('Login successful, cookies saved');
      
      // Initialize cart after login
      const cartStore = require('./cartStore').default;
      await cartStore.getState().initializeCart();
      
      return { success: true, data };
    } catch (error) {
      console.error('Login error:', error);
      set({ 
        isLoading: false, 
        error: error.message 
      });
      return { success: false, error: error.message };
    }
  },

  getUserProfile: async () => {
    try {
      // Pehle token expiry check karein
      if (get().checkTokenExpiry()) {
        throw new Error('Session expired. Please login again.');
      }

      const token = get().token;
      if (!token) {
        throw new Error('No token found');
      }

      set({ isLoading: true, error: null });
      
      console.log('Fetching user profile with token:', token);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('Profile response:', data);

      if (!response.ok) {
        // Agar token invalid hai toh logout karein
        if (response.status === 401) {
          get().logout();
          throw new Error('Session expired. Please login again.');
        }
        
        const errorMessage = data.message || data.error || 'Failed to fetch profile';
        throw new Error(errorMessage);
      }

      if (typeof window !== 'undefined') {
        const currentToken = get().token;
        setAuthCookies(currentToken, data.data.user);
      }

      set({ 
        user: data.data.user,
        isLoading: false,
        error: null 
      });

      console.log('Profile fetched successfully');
      
      // Initialize cart after profile fetch
      const cartStore = require('./cartStore').default;
      await cartStore.getState().initializeCart();
      
      return { success: true, data };
    } catch (error) {
      console.error('Profile fetch error:', error);
      set({ 
        isLoading: false, 
        error: error.message 
      });
      
      // Agar session expired error hai toh logout karein
      if (error.message.includes('Session expired') || error.message.includes('expired')) {
        get().logout();
      }
      
      return { success: false, error: error.message };
    }
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      clearAuthCookies();
      
      // Clear wishlist
      const wishlistStore = require('./wishlistStore').default;
      wishlistStore.getState().clearWishlist();
      
      // Clear cart data on logout
      const cartStore = require('./cartStore').default;
      cartStore.getState().clearCartData();
    }

    set({ 
      user: null, 
      token: null,
      error: null,
      isLoading: false 
    });
    console.log('User logged out, wishlist and cart data cleared');
  },

  isAuthenticated: () => {
    // Token expiry bhi check karein
    if (typeof window === 'undefined') return false;
    
    const { token } = getValidAuthCookies();
    return !!token;
  },

  isAdmin: () => {
    if (typeof window === 'undefined') return false;
    
    const { user } = getValidAuthCookies();
    return user?.roles?.includes('admin');
  },

  getToken: () => {
    if (typeof window === 'undefined') return null;
    
    const { token } = getValidAuthCookies();
    return token;
  },

  getCurrentUser: () => {
    if (typeof window === 'undefined') return null;
    
    const { user } = getValidAuthCookies();
    return user;
  },

  initializeFromCookies: () => {
    if (typeof window !== 'undefined') {
      const { token, user } = getValidAuthCookies();
      if (token && user) {
        set({ token, user });
        
        // Initialize cart when app starts and user is authenticated
        const cartStore = require('./cartStore').default;
        cartStore.getState().initializeCart();
      } else {
        // Agar token expired hai toh logout karein
        if (get().token || get().user) {
          get().logout();
        }
      }
    }
  },

  // Periodic token check ke liye
  startTokenCheck: () => {
    if (typeof window === 'undefined') return () => {};
    
    // Har 60 seconds mein token check karein
    const interval = setInterval(() => {
      get().checkTokenExpiry();
    }, 60000);
    
    return () => clearInterval(interval);
  }
}));

export default useAuthStore;