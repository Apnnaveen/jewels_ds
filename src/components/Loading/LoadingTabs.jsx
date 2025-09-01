import React from 'react'

const LoadingTabs = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  )
}

export default LoadingTabs