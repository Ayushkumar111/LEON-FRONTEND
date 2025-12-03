"use client";
import { useState } from "react";
import StarRating from "./StarRating";
import useAuthStore from "@/lib/store/authStore";

export default function ReviewCard({ review, onUpdate, currentUserId }) {
  const { token, user } = useAuthStore();
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportDetails, setReportDetails] = useState("");
  const [isReporting, setIsReporting] = useState(false);
  
  // Calculate initial counts from helpfulVotes arrays
  const initialHelpfulCount = review?.helpfulVotes?.helpful?.length || review?.helpfulCount || 0;
  const initialNotHelpfulCount = review?.helpfulVotes?.notHelpful?.length || review?.notHelpfulCount || 0;
  
  // Check if current user has already voted
  const getUserInitialVote = () => {
    if (!user?._id || !review?.helpfulVotes) return null;
    if (review.helpfulVotes.helpful?.includes(user._id)) return true;
    if (review.helpfulVotes.notHelpful?.includes(user._id)) return false;
    return null;
  };
  
  const [userVote, setUserVote] = useState(getUserInitialVote());
  const [localHelpfulCount, setLocalHelpfulCount] = useState(initialHelpfulCount);
  const [localNotHelpfulCount, setLocalNotHelpfulCount] = useState(initialNotHelpfulCount);

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  // Safety check - don't render if review is invalid
  if (!review || !review._id) {
    console.error("ReviewCard: Invalid review data", review);
    return null;
  }

  const isOwnReview = user?._id === review.userId?._id;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const handleHelpfulVote = async (helpful) => {
    console.log("Vote clicked - helpful:", helpful);
    console.log("Current user:", user);
    console.log("Review user:", review.userId);
    console.log("Is own review:", isOwnReview);
    console.log("Has token:", !!token);

    if (!token) {
      alert("Please login to vote on reviews");
      return;
    }

    if (isOwnReview) {
      alert("You cannot vote on your own review");
      return;
    }

    try {
      console.log("Sending vote to:", `${BACKEND_URL}/api/comments/${review._id}/helpful`);
      
      const response = await fetch(
        `${BACKEND_URL}/api/comments/${review._id}/helpful`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ helpful })
        }
      );

      const data = await response.json();
      
      console.log("Vote response:", data);
      console.log("Response status:", response.status);

      if (!response.ok) {
        throw new Error(data.message || "Failed to record vote");
      }

      // Update local counts from response: data.data.helpfulCount / data.data.notHelpfulCount
      const responseData = data.data || {};
      const newHelpfulCount = typeof responseData.helpfulCount === 'number' 
        ? responseData.helpfulCount 
        : localHelpfulCount;
      const newNotHelpfulCount = typeof responseData.notHelpfulCount === 'number' 
        ? responseData.notHelpfulCount 
        : localNotHelpfulCount;
      
      console.log("Updating counts - Helpful:", newHelpfulCount, "Not Helpful:", newNotHelpfulCount);
      
      setLocalHelpfulCount(newHelpfulCount);
      setLocalNotHelpfulCount(newNotHelpfulCount);
      setUserVote(helpful);

      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      console.error("Vote error:", err);
      alert(err.message || "Failed to record vote");
    }
  };

  const handleReport = async (e) => {
    e.preventDefault();

    if (!token) {
      alert("Please login to report reviews");
      return;
    }

    if (!reportDetails.trim() || reportDetails.trim().length < 10) {
      alert("Please provide at least 10 characters for your report");
      return;
    }

    if (reportDetails.trim().length > 500) {
      alert("Report details must not exceed 500 characters");
      return;
    }

    try {
      setIsReporting(true);

      const response = await fetch(
        `${BACKEND_URL}/api/comments/${review._id}/report`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            reason: reportDetails
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to report review");
      }

      alert("Review reported successfully. Our team will review it.");
      setShowReportModal(false);
      setReportDetails("");
    } catch (err) {
      console.error("Report error:", err);
      alert(err.message || "Failed to report review");
    } finally {
      setIsReporting(false);
    }
  };

  return (
    <>
      <div className="review-card bg-white border border-gray-200 p-6 mb-4">
        {/* Review Header */}
        <div className="review-header mb-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <StarRating rating={review.rating} readonly size="sm" />
              {review.title && (
                <h4 className="text-lg font-semibold mt-2 mb-1">{review.title}</h4>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium text-gray-900">
              {review.userId?.firstName && review.userId?.lastName 
                ? `${review.userId.firstName} ${review.userId.lastName}`
                : review.userId?._id 
                ? `User ${review.userId._id.slice(-6)}`
                : 'Anonymous'}
            </span>
            <span>•</span>
            <span>{formatDate(review.createdAt)}</span>
          </div>
        </div>

        {/* Review Text */}
        <p className="review-text text-gray-700 leading-relaxed mb-4">
          {review.text}
        </p>

        {/* Review Footer */}
        <div className="review-footer flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="helpful-buttons flex items-center gap-3">
            <button
              onClick={() => handleHelpfulVote(true)}
              disabled={isOwnReview}
              className={`flex items-center gap-1 px-3 py-1.5 border transition ${
                userVote === true
                  ? "bg-green-50 border-green-300 text-green-700"
                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
              } ${isOwnReview ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              title={isOwnReview ? "Cannot vote on your own review" : "Mark as helpful"}
            >
              <span>👍</span>
              <span className="text-sm font-medium">Helpful ({localHelpfulCount})</span>
            </button>

            <button
              onClick={() => handleHelpfulVote(false)}
              disabled={isOwnReview}
              className={`flex items-center gap-1 px-3 py-1.5 border transition ${
                userVote === false
                  ? "bg-red-50 border-red-300 text-red-700"
                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
              } ${isOwnReview ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              title={isOwnReview ? "Cannot vote on your own review" : "Mark as not helpful"}
            >
              <span>👎</span>
              <span className="text-sm font-medium">Not Helpful ({localNotHelpfulCount})</span>
            </button>
          </div>

          {!isOwnReview && token && (
            <button
              onClick={() => setShowReportModal(true)}
              className="text-sm text-gray-600 hover:text-red-600 transition"
            >
              Report
            </button>
          )}
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white max-w-md w-full p-6">
            <h3 className="text-xl font-semibold mb-4">Report Review</h3>
            
            <form onSubmit={handleReport}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Reason for Report <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="Please explain why you're reporting this review (minimum 10 characters)..."
                  rows={5}
                  minLength={10}
                  maxLength={500}
                  required
                  className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#b9965d] resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {reportDetails.length}/500 characters (minimum 10)
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isReporting}
                  className="flex-1 bg-red-600 text-white px-4 py-2 font-medium hover:bg-red-700 transition disabled:bg-gray-400"
                >
                  {isReporting ? "Reporting..." : "Submit Report"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowReportModal(false);
                    setReportDetails("");
                  }}
                  disabled={isReporting}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 font-medium hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
