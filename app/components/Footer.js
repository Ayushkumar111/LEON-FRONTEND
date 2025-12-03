"use client";

import React from "react";
import { FaInstagram, FaFacebook, FaPinterest } from "react-icons/fa";
import Link from "next/link";

export default function Footer() {
  const collections = [
    { name: "Handbags", slug: "handbags" },
    { name: "Evening", slug: "evening" },
    { name: "Accessories", slug: "accessories" },
    { name: "Travel", slug: "travel" }
  ];

  const customerCare = [
    { name: "Contact Us", href: "/" },
    { name: "Size Guide", href: "/" },
    { name: "Care Instructions", href: "/" },
    { name: "Returns", href: "/" }
  ];

  return (
    <footer className="bg-[#070707] text-gray-300 w-full">
      <div className="w-full px-6 md:px-12 py-16">
        <div className="max-w-6xl mx-auto text-center">
          <h3 className="text-3xl md:text-4xl font-semibold tracking-wide text-white">
            Stay Connected
          </h3>
          <p className="mt-4 text-sm md:text-base text-gray-400 max-w-2xl mx-auto">
            Be the first to discover our latest collections and exclusive offers.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4 max-w-lg mx-auto">
            <input
              aria-label="Email address"
              type="email"
              placeholder="Enter your email"
              className="w-full sm:w-80 px-4 py-3 bg-white text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-opacity-60"
            />
            <button
              className="px-8 py-3 whitespace-nowrap shadow-sm font-medium text-black cursor-pointer"
              style={{ backgroundColor: "#b9965d" }} 
            >
              Subscribe
            </button>
          </div>
        </div>
      </div>

      <div className="w-full px-6 md:px-12 pb-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-28 pt-8">
            <div className="space-y-5">
              <div className="text-white text-5xl md:text-5xl font-semibold italianno-regular">
                León Bianco
              </div>
              <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
                Timeless luxury leather goods crafted with passion and precision in
                Italy.
              </p>
            </div>

            <nav aria-label="Collections" className="text-sm">
              <h4 className="text-white font-semibold mb-5 text-base">Collections</h4>
              <ul className="space-y-3 text-gray-400">
                {collections.map((collection) => (
                  <li key={collection.slug}>
                    <Link 
                      href={`/shop/${collection.slug}`}
                      className="hover:text-white hover:underline underline-offset-4 transition-colors cursor-pointer block"
                    >
                      {collection.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <nav aria-label="Customer care" className="text-sm">
              <h4 className="text-white font-semibold mb-5 text-base">Customer Care</h4>
              <ul className="space-y-3 text-gray-400">
                {customerCare.map((item) => (
                  <li key={item.name}>
                    <Link 
                      href={item.href}
                      className="hover:text-white hover:underline underline-offset-4 transition-colors cursor-pointer block"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="text-sm">
              <h4 className="text-white font-semibold mb-5 text-base">Connect</h4>

              <div className="flex items-center gap-3 mb-5">
                <a
                  href="#"
                  aria-label="Instagram"
                  className="p-3 rounded-full bg-transparent hover:bg-gray-800 transition-colors"
                >
                  <FaInstagram className="w-5 h-5 text-gray-300" />
                </a>

                <a
                  href="#"
                  aria-label="Facebook"
                  className="p-3 rounded-full bg-transparent hover:bg-gray-800 transition-colors"
                >
                  <FaFacebook className="w-5 h-5 text-gray-300" />
                </a>

                <a
                  href="#"
                  aria-label="Pinterest"
                  className="p-3 rounded-full bg-transparent hover:bg-gray-800 transition-colors"
                >
                  <FaPinterest className="w-5 h-5 text-gray-300" />
                </a>
              </div>

              <p className="text-gray-400 text-sm max-w-xs leading-relaxed">
                Follow us for inspiration and behind-the-scenes moments.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-6 md:px-12 py-6 bg-[#070707]">
          <div className="border-t border-gray-800 mt-12 pt-8" />
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between text-gray-500 text-sm">
            <div>© 2025 León Bianco. All rights reserved.</div>
            <div className="mt-4 md:mt-0 flex items-center gap-8">
              <Link href="/privacy" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
      </div>
    </footer>
  );
}