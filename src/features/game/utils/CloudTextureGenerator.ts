// Import cloud assets directly
import cloudCovered from '@/assets/sprites/map/cloud_covered_10x10.png';
import cloudLessCoverOcean from '@/assets/sprites/map/cloud_less_cover_blend_ocean_10x10.png';
import { CLOUD_TILE_SIZE } from './Scale';
import { gameProps } from '../engine/config';

/**
 * ULTRA OPTIMIZATION: Generate ONE BIG IMAGE containing ALL clouds
 * 
 * Pure vanilla JS - no React, no PixiJS in the computation
 * Just pass map dimensions, function generates everything internally
 * Uses Canvas2D API to draw cloud sprites into one massive image
 * Returns URL.createObjectURL for the final combined image
 * 
 * Performance: ONE sprite draw for ALL clouds instead of hundreds/thousands
 * 
 * FALLBACK: If canvas exceeds 2000x2000, generates a repeatable tile pattern instead
 */

interface CloudAtlasResult {
  imageUrl: string; // Blob URL from URL.createObjectURL
  texture?: any; // PixiJS texture (set by caller)
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
  isTiled: boolean; // True if this is a repeatable tile (fallback mode)
}

/**
 * Seeded random number generator
 */
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Generate ONE BIG IMAGE containing all clouds
 * Vanilla JS computation - just pass map dimensions
 * 
 * @param mapWidth - Total map width in pixels
 * @param mapHeight - Total map height in pixels
 * @param seed - Random seed for cloud generation
 */
export async function generateCombinedCloudImage(
  mapWidth: number,
  mapHeight: number, 
  seed: number = Math.random() * 10000
): Promise<CloudAtlasResult> {
  // ALWAYS use 2000x2000 tiling pattern for performance testing
  return generateTiledPattern(seed);
  
  /* Original logic - commented for performance testing
  const MAX_DIMENSION = 2000; // Maximum canvas size before switching to tiling
  
  // Check if we need to use tiling fallback
  if (mapWidth > MAX_DIMENSION || mapHeight > MAX_DIMENSION) {
    console.warn(`Map size (${mapWidth}x${mapHeight}) exceeds maximum (${MAX_DIMENSION}x${MAX_DIMENSION}), using tiling pattern`);
    return generateTiledPattern(seed);
  }
  */
  
  // Load cloud images
  const coreImage = new Image();
  const edgeImage = new Image();
  
  await Promise.all([
    new Promise((resolve, reject) => {
      coreImage.onload = resolve;
      coreImage.onerror = reject;
      coreImage.src = cloudCovered.src;
    }),
    new Promise((resolve, reject) => {
      edgeImage.onload = resolve;
      edgeImage.onerror = reject;
      edgeImage.src = cloudLessCoverOcean.src;
    })
  ]);
  
  // Generate cloud positions (simple grid-based with randomness)
  const cloudDensity = 0.00008; // Clouds per square pixel (reduced for more spacing)
  const numClouds = Math.floor(mapWidth * mapHeight * cloudDensity);
  
  interface CloudTile {
    x: number;
    y: number;
    isCoreTexture: boolean;
  }
  
  const tiles: CloudTile[] = [];
  
  // Generate clouds
  for (let i = 0; i < numClouds; i++) {
    // Random position in map
    const cloudX = seededRandom(seed + i * 100) * mapWidth - mapWidth / 2;
    const cloudY = seededRandom(seed + i * 100 + 1) * mapHeight - mapHeight / 2;
    
    // Random cloud radius (1-100px)
    const radius = Math.floor(seededRandom(seed + i * 100 + 2) * 100) + 1;
    const scaledRadius = radius * gameProps.CLOUD_SIZE;
    
    // Random aspect ratio
    const aspectType = Math.floor(seededRandom(seed + i * 100 + 3) * 3);
    let aspectRatio: number;
    if (aspectType === 0) aspectRatio = 0.6 + seededRandom(seed + i * 100 + 4) * 0.2; // Tall
    else if (aspectType === 1) aspectRatio = 1.2 + seededRandom(seed + i * 100 + 4) * 0.4; // Wide  
    else aspectRatio = 0.9 + seededRandom(seed + i * 100 + 4) * 0.2; // Circular
    
    const width = scaledRadius * aspectRatio;
    const height = scaledRadius / aspectRatio * 0.8;
    
    // Number of tiles for this cloud (reduced density for performance)
    const tileCount = Math.floor((width * height * 3) / (CLOUD_TILE_SIZE * CLOUD_TILE_SIZE));
    
    // Generate tiles in elliptical pattern
    for (let t = 0; t < tileCount; t++) {
      const angle = seededRandom(seed + i * 1000 + t * 10) * Math.PI * 2;
      
      // Gaussian distribution for puffy center
      const dist1 = seededRandom(seed + i * 1000 + t * 10 + 1);
      const dist2 = seededRandom(seed + i * 1000 + t * 10 + 2);
      const distFactor = (dist1 + dist2) / 2 * 0.95;
      
      const offsetX = Math.cos(angle) * width * distFactor;
      const offsetY = Math.sin(angle) * height * distFactor;
      
      // Determine texture (core vs edge)
      const isCoreTexture = distFactor < 0.7;
      
      tiles.push({
        x: Math.round((cloudX + offsetX) / CLOUD_TILE_SIZE) * CLOUD_TILE_SIZE,
        y: Math.round((cloudY + offsetY) / CLOUD_TILE_SIZE) * CLOUD_TILE_SIZE,
        isCoreTexture
      });
    }
  }
  
  // Find bounds
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  tiles.forEach(tile => {
    minX = Math.min(minX, tile.x);
    minY = Math.min(minY, tile.y);
    maxX = Math.max(maxX, tile.x + CLOUD_TILE_SIZE);
    maxY = Math.max(maxY, tile.y + CLOUD_TILE_SIZE);
  });
  
  const canvasWidth = maxX - minX;
  const canvasHeight = maxY - minY;
  
  // Create canvas and draw
  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d', { alpha: true })!;
  
  // Draw all tiles
  tiles.forEach(tile => {
    const img = tile.isCoreTexture ? coreImage : edgeImage;
    ctx.drawImage(
      img,
      tile.x - minX,
      tile.y - minY,
      CLOUD_TILE_SIZE,
      CLOUD_TILE_SIZE
    );
  });
  
  // Convert to blob
  try {
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Failed to create blob')), 'image/png');
    });
    
    const imageUrl = URL.createObjectURL(blob);
    
    return {
      imageUrl,
      width: canvasWidth,
      height: canvasHeight,
      offsetX: minX,
      offsetY: minY,
      isTiled: false,
    };
  } catch (error) {
    console.warn('Failed to create cloud blob, falling back to tiling pattern');
    return generateTiledPattern(seed);
  }
}

/**
 * Generate a 2000x2000 repeatable tiling pattern
 */
async function generateTiledPattern(seed: number): Promise<CloudAtlasResult> {
  const TILE_SIZE = 2000;
  
  // Load cloud images
  const coreImage = new Image();
  const edgeImage = new Image();
  
  await Promise.all([
    new Promise((resolve, reject) => {
      coreImage.onload = resolve;
      coreImage.onerror = reject;
      coreImage.src = cloudCovered.src;
    }),
    new Promise((resolve, reject) => {
      edgeImage.onload = resolve;
      edgeImage.onerror = reject;
      edgeImage.src = cloudLessCoverOcean.src;
    })
  ]);
  
  const cloudDensity = 0.00008;
  const numClouds = Math.floor(TILE_SIZE * TILE_SIZE * cloudDensity);
  
  interface CloudTile {
    x: number;
    y: number;
    isCoreTexture: boolean;
  }
  
  const tiles: CloudTile[] = [];
  
  // Generate clouds within tile
  for (let i = 0; i < numClouds; i++) {
    const cloudX = seededRandom(seed + i * 100) * TILE_SIZE;
    const cloudY = seededRandom(seed + i * 100 + 1) * TILE_SIZE;
    
    const radius = Math.floor(seededRandom(seed + i * 100 + 2) * 100) + 1;
    const scaledRadius = radius * gameProps.CLOUD_SIZE;
    
    const aspectType = Math.floor(seededRandom(seed + i * 100 + 3) * 3);
    let aspectRatio: number;
    if (aspectType === 0) aspectRatio = 0.6 + seededRandom(seed + i * 100 + 4) * 0.2;
    else if (aspectType === 1) aspectRatio = 1.2 + seededRandom(seed + i * 100 + 4) * 0.4;
    else aspectRatio = 0.9 + seededRandom(seed + i * 100 + 4) * 0.2;
    
    const width = scaledRadius * aspectRatio;
    const height = scaledRadius / aspectRatio * 0.8;
    const tileCount = Math.floor((width * height * 3) / (CLOUD_TILE_SIZE * CLOUD_TILE_SIZE));
    
    for (let j = 0; j < tileCount; j++) {
      const angle = seededRandom(seed + i * 1000 + j * 10) * Math.PI * 2;
      const distance = seededRandom(seed + i * 1000 + j * 10 + 1);
      
      const ellipseX = Math.cos(angle) * (width / 2) * distance;
      const ellipseY = Math.sin(angle) * (height / 2) * distance;
      
      let tileX = Math.floor(cloudX + ellipseX);
      let tileY = Math.floor(cloudY + ellipseY);
      
      // Wrap around tile edges for seamless tiling
      tileX = ((tileX % TILE_SIZE) + TILE_SIZE) % TILE_SIZE;
      tileY = ((tileY % TILE_SIZE) + TILE_SIZE) % TILE_SIZE;
      
      const distFromCenter = Math.sqrt(ellipseX * ellipseX + ellipseY * ellipseY);
      const maxDist = Math.max(width, height) / 2;
      const isCoreTexture = distFromCenter < maxDist * 0.5;
      
      tiles.push({ x: tileX, y: tileY, isCoreTexture });
    }
  }
  
  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = TILE_SIZE;
  canvas.height = TILE_SIZE;
  const ctx = canvas.getContext('2d', { alpha: true })!;
  
  // Draw all tiles
  tiles.forEach(tile => {
    const img = tile.isCoreTexture ? coreImage : edgeImage;
    ctx.drawImage(img, tile.x, tile.y, CLOUD_TILE_SIZE, CLOUD_TILE_SIZE);
  });
  
  // Convert to blob
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Failed to create tile blob')), 'image/png');
  });
  
  const imageUrl = URL.createObjectURL(blob);
  
  return {
    imageUrl,
    width: TILE_SIZE,
    height: TILE_SIZE,
    offsetX: 0,
    offsetY: 0,
    isTiled: true,
  };
}

/**
 * Revoke object URL when done (cleanup)
 */
export function revokeCombinedCloudImage(imageUrl: string) {
  URL.revokeObjectURL(imageUrl);
}
