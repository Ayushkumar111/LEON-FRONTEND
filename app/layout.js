"use client";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { useEffect } from "react";
import useAuthStore from "../lib/store/authStore";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({ children }) {
  const initializeFromCookies = useAuthStore((state) => state.initializeFromCookies);
  const startTokenCheck = useAuthStore((state) => state.startTokenCheck);
  const checkTokenExpiry = useAuthStore((state) => state.checkTokenExpiry);

  useEffect(() => {
    // Initialize auth from cookies
    initializeFromCookies();
    
    // Start periodic token expiry check
    const cleanupTokenCheck = startTokenCheck();
    
    // Check token on the page visibility change
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkTokenExpiry();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Check token on page focus
    const handleFocus = () => {
      checkTokenExpiry();
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      // Cleanup all event listeners and intervals
      if (cleanupTokenCheck) cleanupTokenCheck();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [initializeFromCookies, startTokenCheck, checkTokenExpiry]);

  return (
    <html lang="en">
      <head>
        <title>León Bianco</title>
        <meta name="description" content="Luxury leather goods crafted with passion in Florence, Italy" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              theme: {
                primary: 'green',
                secondary: 'black',
              },
            },
            error: {
              duration: 5000,
              theme: {
                primary: 'red',
                secondary: 'black',
              },
            },
          }}
        />
      </body>
    </html>
  );
}