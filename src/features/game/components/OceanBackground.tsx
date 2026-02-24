import { useRef, useEffect } from 'react';
import { TilingSprite } from 'pixi.js';
import type { Container } from 'pixi.js';
import type { AssetDictionary } from '../utils/AssetLoader';

interface OceanBackgroundProps {
  assets: AssetDictionary;
}

/**
 * Renders infinite ocean background using TilingSprite
 */
export default function OceanBackground({ assets }: OceanBackgroundProps) {
  const containerRef = useRef<Container>(null);
  
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    // Create tiling sprite for infinite ocean pattern
    const tilingSprite = new TilingSprite({
      texture: assets.oceanDeep,
      width: 100000,
      height: 100000,
    });
    
    // Position to cover large area
    tilingSprite.x = -50000;
    tilingSprite.y = -50000;
    
    container.addChild(tilingSprite);
    
    // Cleanup on unmount
    return () => {
      container.removeChild(tilingSprite);
      tilingSprite.destroy();
    };
  }, [assets.oceanDeep]);
  
  return <pixiContainer ref={containerRef} />;
}
