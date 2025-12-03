"use client";
import { useState } from "react";

export default function StarRating({ 
  rating = 0, 
  onRatingChange = null, 
  size = "md",
  readonly = false 
}) {
  const [hoverRating, setHoverRating] = useState(0);
  
  const sizeClasses = {
    sm: "text-sm",
    md: "text-xl",
    lg: "text-3xl",
    xl: "text-4xl"
  };

  const handleClick = (value) => {
    if (!readonly && onRatingChange) {
      onRatingChange(value);
    }
  };

  const handleMouseEnter = (value) => {
    if (!readonly) {
      setHoverRating(value);
    }
  };

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoverRating(0);
    }
  };

  const displayRating = hoverRating || rating;

  return (
    <div className="star-rating flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          onClick={() => handleClick(star)}
          onMouseEnter={() => handleMouseEnter(star)}
          onMouseLeave={handleMouseLeave}
          className={`${sizeClasses[size]} ${
            star <= displayRating ? "text-[#b9965d]" : "text-gray-300"
          } ${
            readonly ? "cursor-default" : "cursor-pointer hover:scale-110"
          } transition-all duration-200`}
        >
          ★
        </span>
      ))}
    </div>
  );
}
