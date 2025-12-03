"use client";
import { useState } from "react";
import StarRating from "./StarRating";
import useAuthStore from "@/lib/store/authStore";

export default function ReviewForm({ productId, onReviewSubmitted, onCancel }) {
  const { token } = useAuthStore();
  const [formData, setFormData] = useState({
    rating: 0,
    title: "",
    text: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (formData.rating === 0) {
      setError("Please select a rating");
      return;
    }

    if (formData.text.length < 10) {
      setError("Review text must be at least 10 characters");
      return;
    }

    if (formData.text.length > 1000) {
      setError("Review text must not exceed 1000 characters");
      return;
    }

    if (formData.title && formData.title.length > 100) {
      setError("Review title must not exceed 100 characters");
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch(
        `${BACKEND_URL}/api/products/${productId}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        }
      );

      const data = await response.json();
      
      console.log("Review submission response:", data);
      console.log("Response status:", response.status);

      if (!response.ok) {
        throw new Error(data.message || "Failed to submit review");
      }

      // backend returns review directly in data, not data.comment remember
      const createdReview = data.data;
      console.log("Review created successfully:", createdReview);

      // reset the form data 
      setFormData({ rating: 0, title: "", text: "" });
      
      // parent component notify
      if (onReviewSubmitted) {
        onReviewSubmitted(createdReview);
      }

      //success message
      alert("Review submitted successfully!");
      
    } catch (err) {
      setError(err.message || "Failed to submit review. Please try again.");
      console.error("Review submission error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="review-form bg-white border border-gray-200 p-6 mb-6">
      <h3 className="text-xl font-semibold mb-4">Write a Review</h3>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 mb-4">
          {error}
        </div>
      )}

      {/* Rating */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Rating <span className="text-red-500">*</span>
        </label>
        <StarRating
          rating={formData.rating}
          onRatingChange={(value) => setFormData({ ...formData, rating: value })}
          size="lg"
        />
      </div>

      {/* Title */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Review Title (Optional)
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="e.g., Amazing Quality!"
          maxLength={100}
          className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#b9965d] focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">
          {formData.title.length}/100 characters
        </p>
      </div>

      {/* Review Text */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Your Review <span className="text-red-500">*</span>
        </label>
        <textarea
          value={formData.text}
          onChange={(e) => setFormData({ ...formData, text: e.target.value })}
          placeholder="Share your experience with this product..."
          rows={5}
          minLength={10}
          maxLength={1000}
          required
          className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#b9965d] focus:border-transparent resize-none"
        />
        <p className="text-xs text-gray-500 mt-1">
          {formData.text.length}/1000 characters (minimum 10)
        </p>
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-black text-white px-6 py-2 font-medium hover:bg-gray-800 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Submitting..." : "Submit Review"}
        </button>
        
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="bg-gray-200 text-gray-700 px-6 py-2 font-medium hover:bg-gray-300 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
