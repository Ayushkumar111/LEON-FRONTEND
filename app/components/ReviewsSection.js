"use client";
import { useState, useEffect } from "react";
import ReviewForm from "./ReviewForm";
import ReviewCard from "./ReviewCard";
import RatingDistribution from "./RatingDistribution";
import useAuthStore from "@/lib/store/authStore";

export default function ReviewsSection({ productId }) {
  const { user, token } = useAuthStore();
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalComments: 0
  });
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [filterRating, setFilterRating] = useState("");

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  const fetchReviews = async (page = 1) => {
    try {
      setLoading(true);

      // cache-busting parameter to force fresh data
      let url = `${BACKEND_URL}/api/products/${productId}/comments?page=${page}&limit=${pagination.limit}&sortBy=${sortBy}&sortOrder=${sortOrder}&_t=${Date.now()}`;
      
      if (filterRating) {
        url += `&rating=${filterRating}`;
      }

      console.log("Fetching reviews from:", url);

      const response = await fetch(url, {
        cache: 'no-store' // Disable caching
      });
      const data = await response.json();

      console.log("Reviews API response:", data);

      if (data.success) {
        const comments = data.data.comments || [];
        
        const statsData = data.data.statistics || data.data.stats || null;
        
        const paginationData = {
          page: data.data.pagination?.currentPage || 1,
          limit: data.data.pagination?.limit || 10,
          totalPages: data.data.pagination?.totalPages || 0,
          totalComments: data.data.pagination?.totalComments || 0
        };
        
        console.log("Comments:", comments);
        console.log("Statistics:", statsData);
        console.log("Pagination:", paginationData);
        
        setReviews(comments);
        setStats(statsData);
        setPagination(paginationData);
        console.log("Reviews loaded:", comments.length);
      } else {
        console.error("Failed to fetch reviews:", data.message);
        setReviews([]);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId) {
      fetchReviews(1);
    }
  }, [productId, sortBy, sortOrder, filterRating]);

  const handleReviewSubmitted = (newReview) => {
    setShowReviewForm(false);
    // delay to ensure backend has processed, then refresh from page 1
    setTimeout(() => {
      fetchReviews(1);
    }, 500);
  };

  const handlePageChange = (newPage) => {
    fetchReviews(newPage);
    // Scroll to reviews section
    document.getElementById("reviews-section")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleWriteReview = () => {
    if (!token) {
      alert("Please login to write a review");
      return;
    }
    setShowReviewForm(true);
  };

  return (
    <section id="reviews-section" className="reviews-section bg-gray-50 px-4 md:px-8 py-12 md:py-16">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-semibold">
            Customer Reviews
            {stats && stats.totalReviews > 0 && (
              <span className="text-gray-600 text-lg ml-2">
                ({stats.totalReviews})
              </span>
            )}
          </h2>

          {!showReviewForm && (
            <button
              onClick={handleWriteReview}
              className="bg-black text-white px-6 py-2 font-medium hover:bg-gray-800 transition"
            >
              Write a Review
            </button>
          )}
        </div>

        {/* Rating Distribution */}
        {stats && (
          <RatingDistribution stats={stats} />
        )}

        {/* Review Form */}
        {showReviewForm && (
          <ReviewForm
            productId={productId}
            onReviewSubmitted={handleReviewSubmitted}
            onCancel={() => setShowReviewForm(false)}
          />
        )}

        {/* Filters and Sorting */}
        {stats && reviews.length > 0 && (
          <div className="flex flex-wrap gap-4 mb-6">
            {/* Sort By */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Sort by:</label>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [newSortBy, newSortOrder] = e.target.value.split("-");
                  setSortBy(newSortBy);
                  setSortOrder(newSortOrder);
                }}
                className="px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#b9965d]"
              >
                <option value="createdAt-desc">Most Recent</option>
                <option value="createdAt-asc">Oldest First</option>
                <option value="helpfulCount-desc">Most Helpful</option>
                <option value="rating-desc">Highest Rating</option>
                <option value="rating-asc">Lowest Rating</option>
              </select>
            </div>

            {/* Filter by Rating */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Filter:</label>
              <select
                value={filterRating}
                onChange={(e) => setFilterRating(e.target.value)}
                className="px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#b9965d]"
              >
                <option value="">All Ratings</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>
            </div>
          </div>
        )}

        {/* Reviews List */}
        <div className="reviews-list">
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="bg-white border border-gray-200 p-6 animate-pulse">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-4 bg-gray-200 w-24"></div>
                  </div>
                  <div className="h-6 bg-gray-200 w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 w-2/3"></div>
                </div>
              ))}
            </div>
          ) : reviews.length > 0 ? (
            <>
              {reviews.filter(review => review && review._id).map((review) => (
                <ReviewCard
                  key={review._id}
                  review={review}
                  onUpdate={() => fetchReviews(pagination.page)}
                  currentUserId={user?._id}
                />
              ))}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-4 py-2 border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Previous
                  </button>

                  <div className="flex items-center gap-2">
                    {[...Array(pagination.totalPages)].map((_, index) => {
                      const pageNumber = index + 1;
                      //only nearby pages
                      if (
                        pageNumber === 1 ||
                        pageNumber === pagination.totalPages ||
                        (pageNumber >= pagination.page - 1 && pageNumber <= pagination.page + 1)
                      ) {
                        return (
                          <button
                            key={pageNumber}
                            onClick={() => handlePageChange(pageNumber)}
                            className={`px-4 py-2 transition ${
                              pagination.page === pageNumber
                                ? "bg-black text-white"
                                : "border border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            {pageNumber}
                          </button>
                        );
                      } else if (
                        pageNumber === pagination.page - 2 ||
                        pageNumber === pagination.page + 2
                      ) {
                        return <span key={pageNumber}>...</span>;
                      }
                      return null;
                    })}
                  </div>

                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-4 py-2 border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 bg-white border border-gray-200">
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-xl font-semibold mb-2">No Reviews Yet</h3>
              <p className="text-gray-600 mb-6">
                Be the first to share your experience with this product!
              </p>
              {token && !showReviewForm && (
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="bg-black text-white px-6 py-3 font-medium hover:bg-gray-800 transition"
                >
                  Write First Review
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
