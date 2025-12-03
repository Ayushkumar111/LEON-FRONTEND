"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { FcGoogle } from "react-icons/fc";
import { Eye, EyeOff } from "lucide-react";
import useAuthStore from "../../lib/store/authStore";
import toast from "react-hot-toast";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { 
    register, 
    login, 
    isLoading, 
    error, 
    clearError,
    isAuthenticated 
  } = useAuthStore();

  useEffect(() => {
    clearError();
    setFormErrors({});
    setFormData({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
    setShowPassword(false);
    setShowConfirmPassword(false);
  }, [isLogin, clearError]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    if (error) {
      clearError();
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }
    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters long";
    }
    if (!isLogin) {
      if (!formData.name.trim()) {
        errors.name = "Full Name is required";
      }
      if (!formData.confirmPassword) {
        errors.confirmPassword = "Please confirm your password";
      } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = "Passwords do not match";
      }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (isLogin) {
      const result = await login({
        email: formData.email,
        password: formData.password,
      });
      if (result.success) {
        toast.success('Successfully logged in!');
        setTimeout(() => { window.location.href = "/"; }, 1000);
      } else {
        if (result.error) toast.error(result.error);
        else if (error) toast.error(error);
      }
    } else {
      const result = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });
      if (result.success) {
        toast.success('Account created successfully!');
        setTimeout(() => { window.location.href = "/"; }, 1000);
      } else {
        if (result.error) toast.error(result.error);
        else if (error) toast.error(error);
      }
    }
  };

  useEffect(() => {
    if (isAuthenticated()) {
      window.location.href = "/";
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const checkStorage = () => {
      const stored = localStorage.getItem('auth-storage');
      console.log('Current auth storage:', stored);
    };
    checkStorage();
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      <Header />

      <div className="pt-16">
        <section className="h-screen flex">
          <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(180deg,#2f261f 0%, #3f2f26 35%, #5b4a3f 65%, #4a3b2f 100%)",
              }}
            />
            
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(60% 40% at 20% 20%, rgba(255,255,255,0.06), transparent 12%), linear-gradient(120deg, rgba(0,0,0,0.25), transparent 30%, rgba(0,0,0,0.45) 100%)",
                mixBlendMode: "overlay",
              }}
            />
            
            <div
              className="absolute -left-40 -top-32 w-96 h-96 transform rotate-12 opacity-10 pointer-events-none"
              style={{
                background:
                  "linear-gradient(90deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
                filter: "blur(40px)",
              }}
            />

            <div className="absolute inset-0 flex flex-col justify-center items-start p-12">
              <div className="max-w-lg text-left text-white">
                <h1 className="text-5xl font-light leading-tight mb-6" style={{letterSpacing: '-0.02em'}}>
                  Timeless Elegance,
                  <br />
                  <span className="font-medium">Crafted to Perfection</span>
                </h1>

                <p className="text-base text-gray-200 leading-relaxed mb-8 max-w-md">
                  Experience the finest Italian leather craftsmanship. Each bag tells a story of heritage, luxury, and uncompromising quality.
                </p>

                <div className="flex items-center gap-12 mb-8">
                  <div className="text-left">
                    <div className="text-lg text-[#e6cda0] font-semibold">100%</div>
                    <div className="text-sm text-gray-200">Genuine Leather</div>
                  </div>
                  <div className="text-left">
                    <div className="text-lg text-[#e6cda0] font-semibold">Since 1947</div>
                    <div className="text-sm text-gray-200">Italian Heritage</div>
                  </div>
                </div>

                <div className="w-full max-w-2xl overflow-hidden mt-4">
                  <div className="relative h-64 w-full"> 
                    <Image
                      src="/images/auth-image.png"
                      alt="León Bianco Craftsmanship"
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                </div>
              </div>
            </div>

            <div
              className="absolute right-0 bottom-0 w-2/3 h-1/2 pointer-events-none"
              style={{
                background:
                  "radial-gradient(80% 60% at 100% 100%, rgba(0,0,0,0.55), transparent 40%)",
              }}
            />
          </div>

          <div className="w-full lg:w-1/2 flex items-center justify-center px-4 md:px-8 py-8 overflow-y-auto">
            <div className="w-full max-w-md my-auto">
              <div className="flex border-b border-gray-200 mb-8">
                <button
                  onClick={() => setIsLogin(true)}
                  className={`flex-1 py-4 text-center font-medium ${
                    isLogin
                      ? "text-gray-900 border-b-2 border-gray-900"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => setIsLogin(false)}
                  className={`flex-1 py-4 text-center font-medium ${
                    !isLogin
                      ? "text-gray-900 border-b-2 border-gray-900"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Create Account
                </button>
              </div>

              <div className="lg:hidden text-center mb-8">
                <h2 className="text-2xl font-semibold mb-2">
                  {isLogin ? "Welcome Back" : "Join León Bianco"}
                </h2>
                <p className="text-gray-600 text-sm">
                  {isLogin
                    ? "Sign in to your account to continue"
                    : "Create your account to get started"
                  }
                </p>
              </div>

              {/* Auth Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {!isLogin && (
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`w-full border px-4 py-3 text-sm focus:outline-none focus:border-gray-900 ${
                        formErrors.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required={!isLogin}
                      disabled={isLoading}
                      placeholder="Enter your full name"
                    />
                    {formErrors.name && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                    )}
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full border px-4 py-3 text-sm focus:outline-none focus:border-gray-900 ${
                        formErrors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required
                      disabled={isLoading}
                      placeholder="Enter your email address"
                    />
                    {formErrors.email && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className={`w-full border px-4 py-3 text-sm focus:outline-none focus:border-gray-900 pr-10 ${
                          formErrors.password ? 'border-red-500' : 'border-gray-300'
                        }`}
                        required
                        disabled={isLoading}
                        placeholder="Enter your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                        disabled={isLoading}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {formErrors.password && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>
                    )}
                    {!formErrors.password && !isLogin && (
                      <p className="mt-1 text-xs text-gray-500">
                        Password must be at least 6 characters long
                      </p>
                    )}
                  </div>

                  {!isLogin && (
                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          id="confirmPassword"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          className={`w-full border px-4 py-3 text-sm focus:outline-none focus:border-gray-900 pr-10 ${
                            formErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                          }`}
                          required={!isLogin}
                          disabled={isLoading}
                          placeholder="Confirm your password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                          disabled={isLoading}
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {formErrors.confirmPassword && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.confirmPassword}</p>
                      )}
                    </div>
                  )}

                  {isLogin && (
                    <div className="flex items-center">
                      <label className="flex items-center">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900" 
                          disabled={isLoading}
                        />
                        <span className="ml-2 text-sm text-gray-600">Remember me</span>
                      </label>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-black text-white py-4 font-medium hover:bg-gray-800 transition text-sm md:text-base cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "Processing..." : (isLogin ? "Sign In" : "Create Account")}
                  </button>
                </form>

                <div className="relative mt-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or continue with</span>
                  </div>
                </div>

                {/* Google Login */}
                <div className="mt-8">
                  <button
                    type="button"
                    disabled={isLoading}
                    className="w-full inline-flex justify-center items-center py-3 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <FcGoogle className="w-5 h-5 mr-2" />
                    <span>Continue with Google</span>
                  </button>
                </div>

                {/* Sign up link for login form */}
                {isLogin && (
                  <div className="text-center mt-6">
                    <p className="text-sm text-gray-600">
                      Don't have an account?{" "}
                      <button
                        type="button"
                        onClick={() => setIsLogin(false)}
                        className="text-gray-900 hover:underline font-medium cursor-pointer"
                        disabled={isLoading}
                      >
                        Sign up
                      </button>
                    </p>
                  </div>
                )}

                {/* Sign in link for signup form */}
                {!isLogin && (
                  <div className="text-center mt-6">
                    <p className="text-sm text-gray-600">
                      Already have an account?{" "}
                      <button
                        type="button"
                        onClick={() => setIsLogin(true)}
                        className="text-gray-900 hover:underline font-medium cursor-pointer"
                        disabled={isLoading}
                      >
                        Sign in
                      </button>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>

          <Footer />
        </div>
      </div>
    );
  }