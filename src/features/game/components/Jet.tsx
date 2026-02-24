
import { useGameContext } from '../context/GameContext';
import type { AssetDictionary } from '../utils/AssetLoader';
import { JET_SIZE } from '../utils/Scale';

interface JetProps {
  assets: AssetDictionary;
}

/**
 * Renders the player-controlled jet at screen center
 * The jet rotates smoothly based on movement direction
 */
export default function Jet({ assets }: JetProps) {
  const { state } = useGameContext();
  const { playerPosition, playerRotation } = state;
  
  // Jet is always at player position (camera centers on it)
  // Position is relative to camera, so we use player position directly
  
  return (
    <pixiSprite
      texture={assets.jet}
      x={playerPosition.x}
      y={playerPosition.y}
      width={JET_SIZE}
      height={JET_SIZE}
      anchor={{ x: 0.5, y: 0.5 }}
      rotation={playerRotation}
    />
  );
}
