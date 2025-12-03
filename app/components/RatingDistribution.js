"use client";

export default function RatingDistribution({ stats }) {
  if (!stats) {
    return null;
  }

  // API is returning ratingBreakdown and totalRatings
  const averageRating = stats.averageRating || 0;
  const totalReviews = stats.totalRatings || stats.totalReviews || 0;
  const ratingDistribution = stats.ratingBreakdown || stats.ratingDistribution || {};

  const getPercentage = (count) => {
    if (totalReviews === 0) return 0;
    return (count / totalReviews) * 100;
  };

  return (
    <div className="rating-distribution bg-white border border-gray-200 p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Average Rating */}
        <div className="average-rating-box flex flex-col items-center justify-center text-center border-r border-gray-200">
          <div className="text-5xl font-bold text-gray-900 mb-2">
            {averageRating ? averageRating.toFixed(1) : "0.0"}
          </div>
          <div className="flex mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={`text-2xl ${
                  star <= Math.round(averageRating)
                    ? "text-[#b9965d]"
                    : "text-gray-300"
                }`}
              >
                ★
              </span>
            ))}
          </div>
          <p className="text-sm text-gray-600">
            Based on {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
          </p>
        </div>

        {/* Rating Bars */}
        <div className="rating-bars space-y-3">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = ratingDistribution[star] || 0;
            const percentage = getPercentage(count);

            return (
              <div key={star} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-12">
                  <span className="text-sm font-medium">{star}</span>
                  <span className="text-[#b9965d] text-sm">★</span>
                </div>
                
                <div className="flex-1 h-3 bg-gray-200 overflow-hidden">
                  <div
                    className="h-full bg-[#b9965d] transition-all duration-500 ease-out"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                
                <div className="w-12 text-right">
                  <span className="text-sm text-gray-600">{count}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
