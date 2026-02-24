import { useGameContext } from '../context/GameContext';
import { useEffect } from 'react';
import type { AssetDictionary } from '../utils/AssetLoader';
import { CLOUD_PARALLAX } from '../utils/Scale';
import { revokeCombinedCloudImage } from '../utils/CloudTextureGenerator';
import { Texture } from 'pixi.js';

export interface CloudImageData {
  imageUrl: string;
  texture: Texture;
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
  isTiled: boolean;
}

interface CloudLayerProps {
  assets: AssetDictionary;
  cloudImage: CloudImageData;
}

/**
 * Renders clouds with parallax
 * ULTRA OPTIMIZED: Renders ONE BIG IMAGE containing ALL clouds
 * Pure vanilla JS computation - generates single combined texture
 * Component only moves the pre-rendered image (1 sprite for everything)
 * 
 * FALLBACK: If map exceeds 2000x2000, uses repeatable tiling pattern
 */
export default function CloudLayer({ assets, cloudImage }: CloudLayerProps) {
  const { state } = useGameContext();
  const { playerPosition, mapBounds } = state;
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cloudImage?.imageUrl) {
        revokeCombinedCloudImage(cloudImage.imageUrl);
        cloudImage.texture.destroy(true);
      }
    };
  }, [cloudImage]);
  
  // Parallax offset
  const parallaxOffsetX = playerPosition.x * (1 - CLOUD_PARALLAX);
  const parallaxOffsetY = playerPosition.y * (1 - CLOUD_PARALLAX);
  
  // If tiled mode, render multiple sprites in a grid pattern
  if (cloudImage.isTiled && mapBounds) {
    const tileWidth = cloudImage.width;
    const tileHeight = cloudImage.height;
    const tiledWidth = mapBounds.x * 2;
    const tiledHeight = mapBounds.y * 2;
    
    const tilesX = Math.ceil(tiledWidth / tileWidth) + 1;
    const tilesY = Math.ceil(tiledHeight / tileHeight) + 1;
    
    return (
      <pixiContainer>
        {Array.from({ length: tilesY }).map((_, y) => 
          Array.from({ length: tilesX }).map((_, x) => {
            const tileX = -mapBounds.x + x * tileWidth + (parallaxOffsetX % tileWidth);
            const tileY = -mapBounds.y + y * tileHeight + (parallaxOffsetY % tileHeight);
            
            return (
              <pixiSprite
                key={`${x}-${y}`}
                texture={cloudImage.texture}
                x={tileX}
                y={tileY}
                alpha={0.7}
              />
            );
          })
        )}
      </pixiContainer>
    );
  }
  
  // Normal mode: Render ONE SINGLE SPRITE containing ALL clouds
  return (
    <pixiSprite
      texture={cloudImage.texture}
      x={cloudImage.offsetX + parallaxOffsetX}
      y={cloudImage.offsetY + parallaxOffsetY}
      alpha={0.7}
    />
  );
}
