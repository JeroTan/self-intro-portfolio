import { useGameContext } from '../context/GameContext';
import { useMemo, useEffect, memo } from 'react';
import type { AssetDictionary } from '../utils/AssetLoader';
import type { ChunkCache, Island } from '../utils/MapGenerator';
import { CHUNK_SIZE, TILE_SIZE, TERRAIN_PARALLAX } from '../utils/Scale';

interface TerrainLayerProps {
  assets: AssetDictionary;
  chunkCache: ChunkCache; // Shared cache from Engine
}

/**
 * Renders islands with parallax effect
 * Each island is a grouped component of multiple tiles
 */
export default function TerrainLayer({ assets, chunkCache }: TerrainLayerProps) {
  const { state } = useGameContext();
  const { playerPosition } = state;
  
  // Calculate which chunks are visible based on player position with parallax
  const parallaxX = useMemo(() => playerPosition.x * TERRAIN_PARALLAX, [playerPosition.x]);
  const parallaxY = useMemo(() => playerPosition.y * TERRAIN_PARALLAX, [playerPosition.y]);
  
  const currentChunkX = useMemo(() => Math.floor(parallaxX / (CHUNK_SIZE * TILE_SIZE)), [parallaxX]);
  const currentChunkY = useMemo(() => Math.floor(parallaxY / (CHUNK_SIZE * TILE_SIZE)), [parallaxY]);
  
  // Load chunks in a radius around current position
  const visibleChunks = useMemo(() => {
    return chunkCache.getChunksInRadius(currentChunkX, currentChunkY, 2);
  }, [chunkCache, currentChunkX, currentChunkY]);
  
  // Cleanup old chunks
  useEffect(() => {
    const interval = setInterval(() => {
      chunkCache.cleanup(currentChunkX, currentChunkY, 4);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [chunkCache, currentChunkX, currentChunkY]);
  
  // Flatten all islands from visible chunks
  const allIslands = useMemo(() => {
    return visibleChunks.flatMap(chunk => chunk.islands);
  }, [visibleChunks]);
  
  // Flatten all deep ocean patches
  const allDeepOceanPatches = useMemo(() => {
    return visibleChunks.flatMap(chunk => chunk.deepOceanPatches);
  }, [visibleChunks]);
  
  return (
    <pixiContainer x={-parallaxX} y={-parallaxY}>
      {/* Render deep ocean patches */}
      {allDeepOceanPatches.map((patch, idx) => (
        <pixiSprite
          key={`deep-${idx}`}
          texture={assets.oceanSuperDeep}
          x={patch.x}
          y={patch.y}
          width={TILE_SIZE}
          height={TILE_SIZE}
        />
      ))}
      
      {/* Render islands */}
      {allIslands.map((island) => (
        <IslandComponent key={island.id} island={island} />
      ))}
    </pixiContainer>
  );
}

/**
 * Renders a single island composed of multiple tiles
 */
const IslandComponent = memo(function IslandComponent({ island }: { island: Island }) {
  return (
    <pixiContainer x={island.centerX} y={island.centerY}>
      {island.tiles.map((tile, idx) => (
        <pixiSprite
          key={idx}
          texture={tile.texture}
          x={tile.offsetX}
          y={tile.offsetY}
          width={TILE_SIZE}
          height={TILE_SIZE}
        />
      ))}
    </pixiContainer>
  );
});
