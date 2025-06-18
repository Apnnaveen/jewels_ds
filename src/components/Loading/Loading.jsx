import React from 'react';

const Loading = ({ size = 'medium', color = 'text-blue-500' }) => {
  const sizeClasses = {
    small: 'h-6 w-6 border-2',
    medium: 'h-12 w-12 border-4',
    large: 'h-24 w-24 border-4',
  };

  const selectedSize = sizeClasses[size] || sizeClasses.medium;

  return (
    <div className="flex justify-center items-center">
      <div className={`animate-spin rounded-full ${selectedSize} ${color} border-t-transparent`}></div>
    </div>
  );
};

export default Loading;
