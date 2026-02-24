import { useGameContext } from '../context/GameContext';
import type { PropsWithChildren } from 'react';
import { useMemo } from 'react';

/**
 * Camera component that translates the world based on player position
 * All game objects should be children of this component
 */
export default function Camera({ children }: PropsWithChildren<{}>) {
  const { state } = useGameContext();
  const { playerPosition, cameraOffset, zoom } = state;
  
  // Camera follows player (center screen on player)
  const screenCenterX = 1920 / 2;
  const screenCenterY = 1080 / 2;
  
  // Set pivot to player position in world coordinates
  // Set position to screen center (with offset)
  // This makes the pivot (player) appear at screen center, and zoom happens around the player
  const posX = useMemo(() => screenCenterX + cameraOffset.x, [cameraOffset.x]);
  const posY = useMemo(() => screenCenterY + cameraOffset.y, [cameraOffset.y]);
  
  const pivotX = useMemo(() => playerPosition.x, [playerPosition.x]);
  const pivotY = useMemo(() => playerPosition.y, [playerPosition.y]);
  
  return (
    <pixiContainer
      pivot={{ x: pivotX, y: pivotY }}
      position={{ x: posX, y: posY }}
      scale={zoom}
    >
      {children}
    </pixiContainer>
  );
}
