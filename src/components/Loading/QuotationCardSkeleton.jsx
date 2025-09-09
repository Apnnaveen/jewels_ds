import React from "react";

const QuotationCardSkeleton = () => {
  return (
    <div className="bg-white rounded-xl p-4 flex flex-col h-full shadow-md animate-pulse min-h-[420px]">
      {/* Top section: Alert + header */}
      <div className="flex justify-between items-center mb-2">
        <div className="h-4 w-32 bg-gray-300 rounded"></div>
        <div className="h-4 w-20 bg-gray-300 rounded"></div>
      </div>

      {/* Middle content */}
      <div className="flex-1 flex flex-col">
        {/* Car + booking ref */}
        <div className="mb-3">
          <div className="h-5 w-40 bg-gray-300 rounded mb-2"></div>
          <div className="h-4 w-32 bg-gray-300 rounded"></div>
        </div>

        {/* Address lines */}
        <div className="space-y-2 text-sm text-gray-700 flex-1">
          <div className="h-4 w-5/6 bg-gray-300 rounded"></div>
          <div className="h-4 w-4/6 bg-gray-300 rounded"></div>
          <div className="h-4 w-3/6 bg-gray-300 rounded"></div>
          <div className="h-4 w-2/6 bg-gray-300 rounded"></div>
          <div className="h-4 w-3/4 bg-gray-300 rounded"></div>
          <div className="h-4 w-2/4 bg-gray-300 rounded"></div>
          <div className="h-4 w-5/6 bg-gray-300 rounded"></div>
          <div className="h-4 w-4/6 bg-gray-300 rounded"></div>
          <div className="h-4 w-2/6 bg-gray-300 rounded"></div>
        </div>
      </div>

      {/* Bottom section */}
      <div className="mt-auto pt-3 flex flex-col space-y-3">
        <div className="h-9 w-full bg-gray-300 rounded"></div>
      </div>
    </div>
  );
};

export default QuotationCardSkeleton;
