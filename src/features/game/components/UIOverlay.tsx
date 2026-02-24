import { useEffect } from 'react';
import { useGameContext } from '../context/GameContext';

/**
 * UI Overlay component for control instructions
 * Rendered as DOM elements over the PixiJS canvas
 */
export default function UIOverlay() {
  const { state, resetPlayer } = useGameContext();
  const { isMobile } = state;
  
  const handleReset = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resetPlayer();
  };

  // Keyboard shortcut: R to reset
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        resetPlayer();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [resetPlayer]);
  
  return (
    <>
      {/* Reset button - top left */}
      <button
        onClick={handleReset}
        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onMouseUp={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); }}
        className="absolute top-4 left-4 bg-black/70 hover:bg-black/90 text-white px-3 py-2 rounded-lg text-xl font-mono shadow-lg transition-colors pointer-events-auto cursor-pointer z-50"
        title="Reset to start"
      >
        ↻
      </button>
      
      {/* Control instructions - bottom left */}
      <div className="absolute bottom-4 left-4 bg-black/70 text-white px-4 py-2 rounded-lg text-sm font-mono">
        {isMobile ? (
          <div>Touch to Move | Pinch to Zoom</div>
        ) : (
          <div>WASD/Arrows to Move | Space to Sprint | Mouse Click to Point | Scroll to Zoom | R to Reset</div>
        )}
      </div>
    </>
  );
}
