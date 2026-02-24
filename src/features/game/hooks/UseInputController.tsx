import { useEffect, useRef, useCallback } from 'react';
import { useGameContext } from '../context/GameContext';
import { PLAYER_SPEED, ZOOM_STEP, MIN_ZOOM, MAX_ZOOM } from '../utils/Scale';

/**
 * Input controller hook
 * Handles keyboard (WASD/arrows), mouse, and touch controls
 */
export default function useInputController() {
  const { state, updatePlayerVelocity, setTargetRotation, setZoom, hideDirectionalArrows, setIsMobile } = useGameContext();
  const keysPressed = useRef<Set<string>>(new Set());
  const spacebarHeld = useRef<boolean>(false);
  const mouseHeld = useRef<boolean>(false);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const lastTouchDistance = useRef<number>(0);
  
  // Detect if mobile device
  useEffect(() => {
    const isMobileDevice = navigator.maxTouchPoints > 0 || 'ontouchstart' in window;
    setIsMobile(isMobileDevice);
  }, [setIsMobile]);
  
  // Calculate velocity from pressed keys
  const updateVelocityFromKeys = useCallback(() => {
    // Don't update if resetting
    if (state.isResetting) return;
    
    let vx = 0;
    let vy = 0;
    
    // Horizontal movement
    if (keysPressed.current.has('ArrowLeft') || keysPressed.current.has('a') || keysPressed.current.has('A')) {
      vx -= 1;
    }
    if (keysPressed.current.has('ArrowRight') || keysPressed.current.has('d') || keysPressed.current.has('D')) {
      vx += 1;
    }
    
    // Vertical movement
    if (keysPressed.current.has('ArrowUp') || keysPressed.current.has('w') || keysPressed.current.has('W')) {
      vy -= 1;
    }
    if (keysPressed.current.has('ArrowDown') || keysPressed.current.has('s') || keysPressed.current.has('S')) {
      vy += 1;
    }
    
    // Normalize diagonal movement
    if (vx !== 0 && vy !== 0) {
      const length = Math.sqrt(vx * vx + vy * vy);
      vx = (vx / length) * PLAYER_SPEED;
      vy = (vy / length) * PLAYER_SPEED;
    } else {
      vx *= PLAYER_SPEED;
      vy *= PLAYER_SPEED;
    }
    
    // Apply speed boost if spacebar is held (2x speed)
    if (spacebarHeld.current) {
      vx *= 2;
      vy *= 2;
    }
    
    updatePlayerVelocity(vx, vy);
    
    // Update target rotation if moving
    if (vx !== 0 || vy !== 0) {
      const rotation = Math.atan2(vy, vx) + Math.PI / 2; // +90deg because sprite faces up
      setTargetRotation(rotation);
      hideDirectionalArrows();
    }
  }, [updatePlayerVelocity, setTargetRotation, hideDirectionalArrows, state.isResetting]);
  
  // Keyboard event handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
      
      // Handle spacebar separately for speed boost
      if (e.key === ' ') {
        spacebarHeld.current = true;
        updateVelocityFromKeys();
        return;
      }
      
      keysPressed.current.add(e.key);
      updateVelocityFromKeys();
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      // Handle spacebar separately for speed boost
      if (e.key === ' ') {
        spacebarHeld.current = false;
        updateVelocityFromKeys();
        return;
      }
      
      keysPressed.current.delete(e.key);
      updateVelocityFromKeys();
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [updateVelocityFromKeys]);
  
  // Mouse hold handler (hold to move, release to stop)
  useEffect(() => {
    const updateMouseDirection = (e: MouseEvent) => {
      // Get mouse position relative to screen center
      const screenCenterX = window.innerWidth / 2;
      const screenCenterY = window.innerHeight / 2;
      
      const dx = e.clientX - screenCenterX;
      const dy = e.clientY - screenCenterY;
      
      // Calculate direction
      const length = Math.sqrt(dx * dx + dy * dy);
      if (length > 0) {
        let vx = (dx / length) * PLAYER_SPEED;
        let vy = (dy / length) * PLAYER_SPEED;
        
        // Apply speed boost if spacebar is held (2x speed)
        if (spacebarHeld.current) {
          vx *= 2;
          vy *= 2;
        }
        
        updatePlayerVelocity(vx, vy);
        
        const rotation = Math.atan2(dy, dx) + Math.PI / 2;
        setTargetRotation(rotation);
        hideDirectionalArrows();
      }
    };
    
    const handleMouseDown = (e: MouseEvent) => {
      // Ignore if resetting or if keyboard keys are pressed
      if (state.isResetting || keysPressed.current.size > 0) return;
      
      mouseHeld.current = true;
      updateMouseDirection(e);
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      // Update direction while mouse is held
      if (mouseHeld.current && keysPressed.current.size === 0) {
        updateMouseDirection(e);
      }
    };
    
    const handleMouseUp = () => {
      mouseHeld.current = false;
      // Only stop movement if no keyboard keys are pressed
      if (keysPressed.current.size === 0) {
        updatePlayerVelocity(0, 0);
      }
    };
    
    // Clear mouse held state when resetting
    if (state.isResetting) {
      mouseHeld.current = false;
    }
    
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [updatePlayerVelocity, setTargetRotation, hideDirectionalArrows, state.isResetting]);
  
  // Mouse wheel zoom
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, state.zoom + delta));
      setZoom(newZoom);
    };
    
    window.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      window.removeEventListener('wheel', handleWheel);
    };
  }, [state.zoom, setZoom]);
  
  // Touch controls (hold and drag to move, pinch to zoom)
  useEffect(() => {
    const updateTouchDirection = (touch: Touch) => {
      const screenCenterX = window.innerWidth / 2;
      const screenCenterY = window.innerHeight / 2;
      
      const dx = touch.clientX - screenCenterX;
      const dy = touch.clientY - screenCenterY;
      
      const length = Math.sqrt(dx * dx + dy * dy);
      if (length > 20) { // Minimum distance threshold
        const vx = (dx / length) * PLAYER_SPEED;
        const vy = (dy / length) * PLAYER_SPEED;
        
        updatePlayerVelocity(vx, vy);
        
        const rotation = Math.atan2(dy, dx) + Math.PI / 2;
        setTargetRotation(rotation);
        hideDirectionalArrows();
      }
    };
    
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        // Single touch - start moving in direction
        touchStartPos.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
        updateTouchDirection(e.touches[0]);
      } else if (e.touches.length === 2) {
        // Two touches - pinch zoom (stop movement)
        updatePlayerVelocity(0, 0);
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        lastTouchDistance.current = Math.sqrt(dx * dx + dy * dy);
        touchStartPos.current = null;
      }
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      
      if (e.touches.length === 1 && touchStartPos.current) {
        // Single touch move - update direction continuously
        updateTouchDirection(e.touches[0]);
      } else if (e.touches.length === 2) {
        // Pinch zoom
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (lastTouchDistance.current > 0) {
          const delta = (distance - lastTouchDistance.current) * 0.01;
          const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, state.zoom + delta));
          setZoom(newZoom);
        }
        
        lastTouchDistance.current = distance;
      }
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 0) {
        // All touches released - stop movement (unless keyboard is active)
        if (keysPressed.current.size === 0) {
          updatePlayerVelocity(0, 0);
        }
        touchStartPos.current = null;
        lastTouchDistance.current = 0;
      } else if (e.touches.length === 1) {
        // Back to single touch from pinch - resume movement
        touchStartPos.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
        updateTouchDirection(e.touches[0]);
        lastTouchDistance.current = 0;
      }
    };
    
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [state.zoom, setZoom, updatePlayerVelocity, setTargetRotation, hideDirectionalArrows]);
}
