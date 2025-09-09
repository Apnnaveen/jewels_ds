import React from "react";

const SkeletonCard = () => {
  return (
    <div className="rounded-xl p-4 flex flex-col bg-white shadow-md animate-pulse min-h-[300px]">
      {/* Top Section (Title / Car name / Ref) */}
      <div className="mb-3">
        <div className="h-5 w-32 bg-gray-300 rounded mb-2"></div>
        <div className="h-4 w-40 bg-gray-300 rounded"></div>
      </div>

      {/* Middle Section (addresses, details, notes) */}
      <div className="space-y-3 mb-4 flex-1">
        <div className="h-4 w-5/6 bg-gray-300 rounded"></div>
        <div className="h-4 w-4/6 bg-gray-300 rounded"></div>
        <div className="h-4 w-3/6 bg-gray-300 rounded"></div>
        <div className="h-4 w-2/6 bg-gray-300 rounded"></div>
      </div>

      {/* Bottom Section (buttons or status) */}
      <div className="pt-3 flex justify-between items-center gap-3">
        <div className="h-9 w-24 bg-gray-300 rounded"></div>
        <div className="h-9 w-24 bg-gray-300 rounded"></div>
        <div className="h-9 w-24 bg-gray-300 rounded"></div>
      </div>
    </div>
  );
};

export default SkeletonCard;
