import React from "react";

const CompletedJobSkeleton = () => {
  return (
    <div className="bg-white rounded-xl shadow-md p-4 flex flex-col justify-between h-full animate-pulse min-h-[250px]">
      {/* Header */}
      <div className="flex justify-end mb-2">
        <div className="h-4 w-24 bg-gray-300 rounded"></div>
      </div>

      {/* Car + Booking */}
      <div className="mb-3">
        <div className="h-5 w-3/4 bg-gray-300 rounded mb-2"></div>
        <div className="h-4 w-1/2 bg-gray-300 rounded"></div>
      </div>

      {/* Journey Date / Time / Fare */}
      <div className="space-y-2">
        <div className="h-4 w-5/6 bg-gray-300 rounded"></div>
        <div className="h-4 w-5/6 bg-gray-300 rounded"></div>
        <div className="h-4 w-3/4 bg-gray-300 rounded"></div>
      </div>
    </div>
  );
};

export default CompletedJobSkeleton;
