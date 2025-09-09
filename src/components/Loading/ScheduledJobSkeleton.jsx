import React from "react";

const ScheduledJobSkeleton = () => {
  return (
    <div className="bg-white rounded-xl shadow-md p-4 flex flex-col h-full animate-pulse min-h-[500px]">
      {/* Top label */}
      <div className="flex justify-end mb-2">
        <div className="h-4 w-16 bg-gray-300 rounded"></div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col space-y-2">
        {/* Car Name */}
        <div className="h-5 w-3/4 bg-gray-300 rounded mb-2"></div>

        {/* Booking Ref + Sub tag */}
        <div className="flex justify-between items-center">
          <div className="h-4 w-1/2 bg-gray-300 rounded"></div>
          <div className="h-4 w-12 bg-gray-300 rounded"></div>
        </div>

        {/* Pickup */}
        <div className="h-4 w-5/6 bg-gray-300 rounded"></div>
        {/* Waypoints (2 lines placeholder) */}
        <div className="h-4 w-4/6 bg-gray-300 rounded"></div>
        <div className="h-4 w-3/6 bg-gray-300 rounded"></div>
        {/* DropOff */}
        <div className="h-4 w-5/6 bg-gray-300 rounded"></div>

        {/* Distance */}
        <div className="h-4 w-1/2 bg-gray-300 rounded"></div>

        {/* Journey Date & Time */}
        <div className="flex justify-between">
          <div className="h-4 w-1/2 bg-gray-300 rounded"></div>
          <div className="h-4 w-1/4 bg-gray-300 rounded"></div>
        </div>
        <div className="flex justify-between">
          <div className="h-4 w-1/2 bg-gray-300 rounded"></div>
          <div className="h-4 w-1/4 bg-gray-300 rounded"></div>
        </div>

        {/* Flight / Arrive From */}
        <div className="h-4 w-3/4 bg-gray-300 rounded"></div>
        <div className="h-4 w-2/3 bg-gray-300 rounded"></div>

        {/* Driver Instructions */}
        <div className="h-12 w-full bg-gray-300 rounded"></div>

        {/* Price */}
        <div className="flex justify-between">
          <div className="h-4 w-1/2 bg-gray-300 rounded"></div>
          <div className="h-4 w-1/4 bg-gray-300 rounded"></div>
        </div>
      </div>

      {/* Bottom pinned info + buttons */}
      <div className="mt-auto pt-3 space-y-2">
        {/* Optional pinned info */}
        <div className="h-4 w-full bg-gray-300 rounded"></div>
        {/* Buttons */}
        <div className="flex gap-2">
          <div className="h-9 w-1/2 bg-gray-300 rounded"></div>
          <div className="h-9 w-1/2 bg-gray-300 rounded"></div>
        </div>
      </div>
    </div>
  );
};

export default ScheduledJobSkeleton;
