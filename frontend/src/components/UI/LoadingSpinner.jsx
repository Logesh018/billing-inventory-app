export default function LoadingSpinner({ message = "Loading...", fullScreen = true }) {
  if (fullScreen) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-transparent">
        <div className="relative">
          {/* Outer spinning ring */}
          <div className="w-16 h-16 border-4 border-gray-200 border-t-green-500 rounded-full animate-spin"></div>
          
          {/* Inner pulsing circle */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-8 h-8 bg-green-500 rounded-full animate-pulse opacity-75"></div>
          </div>
        </div>
        
        {message && (
          <p className="mt-4 text-gray-600 text-sm font-medium animate-pulse">
            {message}
          </p>
        )}
      </div>
    );
  }

  // Inline spinner (for smaller components)
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="relative">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-green-500 rounded-full animate-spin"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-6 h-6 bg-green-500 rounded-full animate-pulse opacity-75"></div>
        </div>
      </div>
      
      {message && (
        <p className="mt-3 text-gray-600 text-xs font-medium">
          {message}
        </p>
      )}
    </div>
  );
}