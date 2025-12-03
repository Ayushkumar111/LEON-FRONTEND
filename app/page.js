"use client";
import Image from "next/image";
import Link from "next/link";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { useState, useEffect } from "react";
import ProductCard from "./components/ProductCard";
import EditProductModal from "./components/EditProductModal";
import useAuthStore from "../lib/store/authStore";
import useCartStore from "../lib/store/cartStore";
import toast from "react-hot-toast";

export default function Home() {
  const [bestsellerProducts, setBestsellerProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const { token } = useAuthStore();
  const { addToCart } = useCartStore();

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  const getCategorySlug = (categoryName) => {
    const slugMap = {
      "Hand Bags": "handbags",
      "Evening": "evening", 
      "Accessories": "accessories",
      "Travel": "travel"
    };
    return slugMap[categoryName] || "handbags";
  };

  useEffect(() => {
    const fetchBestsellerProducts = async () => {
      try {
        setLoading(true);
        console.log('Fetching bestseller products for home page...');
        
        const response = await fetch(`${BACKEND_URL}/api/products?bestseller=true&limit=12`);
        const data = await response.json();
        
        console.log('Home page bestseller response:', data);
        
        if (data.success && data.data && data.data.products) {
          setBestsellerProducts(data.data.products);
        } else {
          setBestsellerProducts([]);
        }
      } catch (error) {
        console.error('Error fetching bestseller products for home:', error);
        setBestsellerProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBestsellerProducts();
  }, []);

  const getProductImage = (product) => {
    // First check if product has variants with images
    if (product.variants && product.variants.length > 0) {
      const firstVariant = product.variants[0];
      if (firstVariant.images && firstVariant.images.length > 0) {
        return firstVariant.images[0];
      }
    }
    
    // Then check product level images
    if (product.images && product.images.length > 0) {
      return product.images[0];
    }
    
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
      'Accessories': '/images/product1.png'
    };
    return fallbackImages[product.category] || '/images/product1.png';
  };

  const handleAddToCart = async (product) => {
    try {
      await addToCart(product._id, 1);
    } catch (error) {
      // Error handled in store
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setIsEditModalOpen(true);
  };

  const handleDeleteProduct = async (product) => {
    if (!token) {
      toast.error('Authentication required');
      return;
    }

    if (!confirm(`Are you sure you want to delete "${product.title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/products/${product._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Product deleted successfully!');
        window.location.reload();
      } else {
        throw new Error(data.message || 'Failed to delete product');
      }
    } catch (error) {
      console.error('Delete product error:', error);
      toast.error(error.message || 'Failed to delete product');
    }
  };

  const handleProductUpdate = (updatedProduct) => {
    setBestsellerProducts(prev => prev.map(p => 
      p._id === updatedProduct._id ? updatedProduct : p
    ));
  };

  const fallbackProducts = [
    { 
      _id: "1",
      title: "The Signature Tote", 
      price: 1250,
      category: "Handbags",
      images: ["/images/product1.png"],
      bestseller: true,
      stockQuantity: 10
    },
    { 
      _id: "2",
      title: "Minimal Crossbody", 
      price: 890,
      category: "Handbags",
      images: ["/images/product2.png"],
      bestseller: true,
      stockQuantity: 8
    },
    { 
      _id: "3",
      title: "Evening Clutch", 
      price: 650,
      category: "Evening",
      images: ["/images/product3.png"],
      bestseller: true,
      stockQuantity: 5
    },
    { 
      _id: "4",
      title: "Travel Companion", 
      price: 1850,
      category: "Travel",
      images: ["/images/product4.png"],
      bestseller: true,
      stockQuantity: 3
    }
  ];

  const displayProducts = bestsellerProducts.length > 0 ? bestsellerProducts : fallbackProducts;

  const getSlidesData = () => {
    const slides = [];
    const productsPerSlide = 4;
    
    for (let i = 0; i < displayProducts.length; i += productsPerSlide) {
      let slideProducts = displayProducts.slice(i, i + productsPerSlide);
      
      if (slideProducts.length < productsPerSlide) {
        const needed = productsPerSlide - slideProducts.length;
        const additionalProducts = fallbackProducts.slice(0, needed);
        slideProducts = [...slideProducts, ...additionalProducts];
      }
      
      slides.push(slideProducts);
    }
    
    if (slides.length === 0) {
      slides.push(fallbackProducts.slice(0, productsPerSlide));
    }
    
    return slides;
  };

  const slides = getSlidesData();
  const totalSlides = slides.length;

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      <Header />
      
      <div className="pt-16">
        <section className="relative w-full h-[70vh] md:h-[110vh] flex items-center justify-center bg-gray-200">
          <Image
            src="/images/hero.png"
            alt="Hero Image"
            fill
            className="object-cover brightness-90"
            priority
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white px-4">
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-semibold mb-4">
              The style of living
            </h2>
            <p className="text-sm md:text-lg mb-6 max-w-2xl">
              Our curated collection is crafted by skilled artisans, blending<br className="hidden md:block"/>
              traditional techniques with modern design.
            </p>
            <Link href="/shop">
              <button className="bg-white text-black px-6 py-2 font-medium hover:bg-gray-100 transition cursor-pointer text-sm md:text-base">
                VIEW SELECTION
              </button>
            </Link>
          </div>
        </section>

        {/* Bestsellers Section */}
        <section className="px-4 md:px-8 py-12 md:py-16">
          <div className="relative">
            <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mx-auto max-w-7xl mb-8">
              <div className="flex flex-col">
                <h3 className="text-xl md:text-2xl font-semibold">Bestsellers</h3>
              </div>
              <div className="flex flex-col">
                {/* Empty for spacing */}
              </div>
              <div className="flex flex-col">
                {/* Empty for spacing */}
              </div>
              <div className="flex flex-col items-end">
                <Link href="/bestseller">
                  <button className="border bg-black text-white px-5 py-2 cursor-pointer text-sm md:text-base">
                    SEE ALL BESTSELLERS
                  </button>
                </Link>
              </div>
            </div>

            <div className="md:hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <h3 className="text-xl md:text-2xl font-semibold">Bestsellers</h3>
              <Link href="/bestseller">
                <button className="border bg-black text-white px-5 py-2 cursor-pointer text-sm md:text-base w-full sm:w-auto">
                  SEE ALL BESTSELLERS
                </button>
              </Link>
            </div>

            {totalSlides > 1 && (
              <div className="hidden md:flex items-center justify-between absolute top-1/2 left-0 right-0 -translate-y-1/2 z-10 pointer-events-none">
                <button 
                  onClick={prevSlide}
                  className="text-3xl text-gray-700 hover:text-black transition-all cursor-pointer flex items-center justify-center ml-4 pointer-events-auto"
                >
                  ←
                </button>
                <button 
                  onClick={nextSlide}
                  className="text-3xl text-gray-700 hover:text-black transition-all cursor-pointer flex items-center justify-center mr-4 pointer-events-auto"
                >
                  →
                </button>
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mx-auto max-w-7xl">
                {[...Array(4)].map((_, index) => (
                  <div key={index} className="flex flex-col animate-pulse">
                    <div className="w-full h-64 sm:h-72 bg-gray-200 rounded"></div>
                    <div className="mt-4 h-4 bg-gray-200 rounded"></div>
                    <div className="mt-2 h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mx-auto max-w-7xl">
                {slides[currentSlide]?.map((product, index) => (
                  <ProductCard
                    key={product._id || `fallback-${currentSlide}-${index}`}
                    product={product}
                    onEdit={handleEditProduct}
                    onDelete={handleDeleteProduct}
                  />
                ))}
              </div>
            )}

            {totalSlides > 1 && (
              <div className="flex flex-col items-center gap-4 mt-8">
                <div className="flex space-x-2">
                  {slides.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={`w-3 h-3 rounded-full transition-all ${
                        currentSlide === index 
                          ? 'bg-gray-800 scale-110' 
                          : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                    />
                  ))}
                </div>
                
                <div className="md:hidden flex items-center justify-between w-full max-w-xs">
                  <button 
                    onClick={prevSlide}
                    className="text-2xl text-gray-700 hover:text-black transition-all cursor-pointer bg-white/80 hover:bg-white rounded-full w-10 h-10 flex items-center justify-center border shadow-md"
                  >
                    ←
                  </button>
                  <span className="text-sm text-gray-600">
                    {currentSlide + 1} / {totalSlides}
                  </span>
                  <button 
                    onClick={nextSlide}
                    className="text-2xl text-gray-700 hover:text-black transition-all cursor-pointer bg-white/80 hover:bg-white rounded-full w-10 h-10 flex items-center justify-center border shadow-md"
                  >
                    →
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Category Section */}
        <section className="grid grid-cols-2 md:grid-cols-4 pb-12 md:pb-16">
          {[
            { 
              name: "Hand Bags", 
              image: "/images/handbag1.png",
              buttonText: "SHOP HANDBAGS",
            },
            { 
              name: "Evening", 
              image: "/images/handbag2.png",
              buttonText: "SHOP EVENING",
            },
            { 
              name: "Accessories", 
              image: "/images/belt.png",
              buttonText: "SHOP ACCESSORIES",
            },
            { 
              name: "Travel", 
              image: "/images/travelbag.png",
              buttonText: "SHOP TRAVEL",
            },
          ].map((cat) => (
            <div
              key={cat.name}
              className="relative h-48 md:h-110 overflow-hidden group"
            >
              <Image
                src={cat.image}
                alt={cat.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/30 flex flex-col justify-between p-3 md:p-4 text-white">
                <h4 className="text-sm md:text-xl font-medium text-center mt-2 md:mt-4">{cat.name}</h4>
                <Link href={`/shop/${getCategorySlug(cat.name)}`}>
                  <button className="w-full border border-white px-2 md:px-4 py-1 md:py-2 bg-white text-black transition text-xs md:text-sm font-medium cursor-pointer">
                    {cat.buttonText}
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </section>

        {/* Signature Collections Section */}
        <section className="px-4 md:px-8 pb-12 md:pb-20">
          <h3 className="text-xl md:text-2xl font-semibold mb-6 md:mb-8">Signature Collections</h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            <div className="flex flex-col gap-6">
              <div className="relative w-full h-72 md:h-[600px]">
                <Image
                  src="/images/signaturecollection1.png"
                  alt="Roma Clutch"
                  fill
                  className="object-cover"
                />
                <span className="absolute bottom-3 left-3 bg-white/80 text-sm px-2 py-1 rounded">
                  Roma Clutch
                </span>
              </div>

              <div className="relative w-full h-96 md:h-[900px]">
                <Image
                  src="/images/signaturecollection4.png"
                  alt="Milano Tote"
                  fill
                  className="object-cover"
                />
                <span className="absolute bottom-3 left-3 bg-white/80 text-sm px-2 py-1 rounded">
                  Milano Tote
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div className="relative w-full h-80 md:h-[950px]">
                <Image
                  src="/images/signaturecollection2.png"
                  alt="Venezia Cross"
                  fill
                  className="object-cover"
                />
                <span className="absolute top-3 right-3 bg-white/80 text-sm px-2 py-1 rounded">
                  Venezia Cross
                </span>
              </div>

              <div className="relative w-full h-72 md:h-[550px]">
                <Image
                  src="/images/signaturecollection3.png"
                  alt="Classico"
                  fill
                  className="object-cover"
                />
                <span className="absolute top-3 right-3 bg-white/80 text-sm px-2 py-1 rounded">
                  Classico
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Italian Heritage Section */}
        <section className="flex flex-col md:flex-row items-start gap-8 md:gap-12 px-4 md:px-8 py-12 md:py-16 bg-gray-50">
          <div className="flex-1 space-y-8">
            <h3 className="text-xl md:text-4xl font-semibold">Italian Heritage</h3>
            <div className="space-y-7">
              <p className="text-gray-600 leading-relaxed text-base md:text-[17px]">
                León Bianco has been synonymous with exceptional Italian craftsmanship for over three generations, 
                establishing itself as a pinnacle of luxury leather goods. Our master artisans in the heart of 
                Florence continue to honor centuries-old traditional techniques passed down through generations, 
                while embracing contemporary innovation and design excellence that sets new standards in the industry.
              </p>
              <p className="text-gray-600 leading-relaxed text-base md:text-[17px]">
                Each piece is meticulously handcrafted using only the finest Italian leather and premium materials, 
                ensuring that every León Bianco creation becomes a treasured heirloom cherished for lifetimes. 
                Our unwavering commitment to exceptional quality, meticulous attention to detail, and timeless 
                elegance defines our enduring legacy of luxury, sophistication, and unparalleled artistry that 
                transcends fleeting trends and seasons.
              </p>
            </div>
            <div className="pt-4">
              <button className="border border-gray-700 px-8 py-3 hover:bg-gray-100 transition text-base font-medium cursor-pointer">
                DISCOVER OUR STORY
              </button>
            </div>
          </div>
          
          <div className="flex-1 relative w-full h-80 md:h-[500px] bg-gray-200 overflow-hidden">
            <Image
              src="/images/italianheritage.png"
              alt="Heritage"
              fill
              className="object-cover"
            />
          </div>
        </section>

        {/* Crafted for Life Section */}
        <section className="text-center px-4 md:px-8 py-12 md:py-20 bg-white">
          <h3 className="text-xl md:text-2xl font-semibold mb-4">Crafted for Life</h3>
          <p className="max-w-2xl mx-auto text-gray-600 leading-relaxed text-sm md:text-base">
            Each piece is meticulously crafted by master artisans using the finest
            Italian leather, ensuring timeless elegance that transcends seasons
            and trends. From our atelier to your wardrobe, discover the art of
            living beautifully.
          </p>
        </section>

        {/* Edit Product Modal */}
        <EditProductModal
          product={editingProduct}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingProduct(null);
          }}
          onUpdate={handleProductUpdate}
        />

        <Footer />
      </div>
    </div>
  );
}