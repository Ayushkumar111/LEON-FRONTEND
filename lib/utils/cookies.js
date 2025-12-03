export const setCookie = (name, value, days = 7) => {
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = `expires=${date.toUTCString()}`;
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  document.cookie = `${name}=${value}; ${expires}; path=/; SameSite=Lax${secure}`;
};

export const getCookie = (name) => {
  const nameEQ = `${name}=`;
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

export const deleteCookie = (name) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
};

export const setAuthCookies = (token, user) => {
  setCookie('auth_token', token, 7); 
  setCookie('user_data', JSON.stringify(user), 7);
  // Also store in localStorage for quick access
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user_data', JSON.stringify(user));
  }
};

export const getAuthCookies = () => {
  // Try localStorage first (faster)
  if (typeof window !== 'undefined') {
    const localStorageToken = localStorage.getItem('auth_token');
    const localStorageUser = localStorage.getItem('user_data');
    
    if (localStorageToken && localStorageUser) {
      return {
        token: localStorageToken,
        user: JSON.parse(localStorageUser)
      };
    }
  }
  
  // Fallback to cookies
  const token = getCookie('auth_token');
  const userData = getCookie('user_data');
  
  return {
    token,
    user: userData ? JSON.parse(userData) : null
  };
};

export const clearAuthCookies = () => {
  deleteCookie('auth_token');
  deleteCookie('user_data');
  
  // Clear localStorage too
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
  }
};

// Token expiry check karne ke liye
export const isTokenExpired = (token) => {
  if (!token) return true;
  
  try {
    // JWT token decode karke expiry check karein
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiry = payload.exp * 1000; // Convert to milliseconds
    return Date.now() >= expiry;
  } catch (error) {
    console.error('Token decode error:', error);
    return true; // Agar decode nahi kar paye toh expired consider karein
  }
};

// Auth cookies ke saath expiry bhi check karein
export const getValidAuthCookies = () => {
  const { token, user } = getAuthCookies();
  
  if (!token || isTokenExpired(token)) {
    clearAuthCookies();
    return { token: null, user: null };
  }
  
  return { token, user };
};