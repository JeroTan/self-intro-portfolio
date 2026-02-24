import { useEffect, useState } from 'react';
import { useGameContext } from '../context/GameContext';

/**
 * OrientationGuard component
 * Shows a fullscreen message when device is in portrait mode
 * Only allows landscape orientation for optimal gameplay
 */
export default function OrientationGuard() {
  const { state, setIsPortrait } = useGameContext();
  const [isPortraitMode, setIsPortraitMode] = useState(false);
  
  useEffect(() => {
    const checkOrientation = () => {
      const portrait = window.innerHeight > window.innerWidth;
      setIsPortraitMode(portrait);
      setIsPortrait(portrait);
    };
    
    // Check on mount
    checkOrientation();
    
    // Listen for orientation changes
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    
    // Also use matchMedia for better support
    const mediaQuery = window.matchMedia('(orientation: portrait)');
    const handleMediaChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsPortraitMode(e.matches);
      setIsPortrait(e.matches);
    };
    
    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMediaChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleMediaChange as any);
    }
    
    // Initial check
    handleMediaChange(mediaQuery);
    
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
      
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleMediaChange);
      } else {
        mediaQuery.removeListener(handleMediaChange as any);
      }
    };
  }, [setIsPortrait]);
  
  if (!isPortraitMode) {
    return null; // Landscape mode - show game
  }
  
  return (
    <div className="absolute inset-0 bg-black/95 flex items-center justify-center z-50">
      <div className="text-center text-white px-8">
        {/* Rotation icon */}
        <div className="mb-6">
          <svg
            className="w-24 h-24 mx-auto animate-pulse"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </div>
        
        {/* Message */}
        <h2 className="text-2xl font-bold mb-4">Please Rotate Your Device</h2>
        <p className="text-lg text-gray-300">
          This game is best experienced in landscape mode
        </p>
      </div>
    </div>
  );
}
