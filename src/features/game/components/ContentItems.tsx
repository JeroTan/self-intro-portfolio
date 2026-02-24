import { useGameContext } from '../context/GameContext';
import { useCallback, useMemo } from 'react';
import type { FederatedPointerEvent } from 'pixi.js';
import { memo } from 'react';

interface ContentItemsProps {
  assets: any; // Keep for compatibility but not used
}

/**
 * Renders pre-generated content item images as sprites
 * Maintains full interactivity with click handlers
 * Implements world map wrapping for seamless boundaries
 */
export default function ContentItems({ assets }: ContentItemsProps) {
  const { state } = useGameContext();
  const { contentItems, contentItemTextures, playerPosition, mapBounds } = state;
  
  // Generate wrapped instances of content items for seamless map boundaries
  const visibleItems = useMemo(() => {
    // Wait for textures and bounds to load
    if (!contentItemTextures || !mapBounds) return [];
    

    const renderDistance = 1500; // pixels
    const totalWidth = mapBounds.x * 2;
    const totalHeight = mapBounds.y * 2;
    const wrappedItems: Array<{ item: typeof contentItems[0]; wrappedPosition: { x: number; y: number }; key: string }> = [];
    
    contentItems.forEach(item => {
      // Check main position and 8 wrapped positions (like a 3x3 grid)
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const wrappedX = item.position.x + (dx * totalWidth);
          const wrappedY = item.position.y + (dy * totalHeight);
          
          const distX = wrappedX - playerPosition.x;
          const distY = wrappedY - playerPosition.y;
          const distance = Math.sqrt(distX * distX + distY * distY);
          
          if (distance < renderDistance) {
            wrappedItems.push({
              item,
              wrappedPosition: { x: wrappedX, y: wrappedY },
              key: `${item.id}-${dx}-${dy}`,
            });
          }
        }
      }
    });
    
    return wrappedItems;
  }, [contentItems, playerPosition, mapBounds]);
  
  return (
    <pixiContainer>
      {visibleItems.map(({ item, wrappedPosition, key }) => {
        const textureData = contentItemTextures?.get(item.id);
        if (!textureData) return null;
        
        return (
          <ContentItem
            key={key}
            item={{ ...item, position: wrappedPosition }}
            textureData={textureData}
          />
        );
      })}
    </pixiContainer>
  );
}

interface ContentItemProps {
  item: any;
  textureData: { texture: any; width: number; height: number };
}

/**
 * Individual content item renderer - just a sprite with click handler
 * All visual complexity is pre-rendered into the texture
 */
const ContentItem = memo(function ContentItem({ item, textureData }: ContentItemProps) {
  const { data, position } = item;
  const { url_link } = data;
  const { texture, width, height } = textureData;
  
  const handleClick = useCallback((e: FederatedPointerEvent) => {
    e.stopPropagation(); // ALWAYS prevent triggering jet movement
    if (url_link) {
      window.open(url_link, '_blank');
    }
  }, [url_link]);
  
  return (
    <pixiSprite
      texture={texture}
      x={position.x}
      y={position.y}
      anchor={{ x: 0.5, y: 0.5 }}
      eventMode='static'
      cursor={url_link ? 'pointer' : 'default'}
      onPointerDown={handleClick}
    />
  );
});
