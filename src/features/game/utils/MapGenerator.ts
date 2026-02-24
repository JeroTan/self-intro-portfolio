import type { Texture } from 'pixi.js';
import type { AssetDictionary } from './AssetLoader';
import { CHUNK_SIZE, TILE_SIZE } from './Scale';
import { gameProps } from '../engine/config';

export interface IslandTile {
  offsetX: number; // Relative to island center
  offsetY: number;
  texture: Texture;
}

export interface Island {
  id: string;
  centerX: number;
  centerY: number;
  radius: number;
  tiles: IslandTile[]; // Pre-computed tile layout
}

export interface CloudFormation {
  id: string;
  centerX: number;
  centerY: number;
  radius: number; // Cloud radius for overlap detection
  tiles: { offsetX: number; offsetY: number; texture: Texture }[];
}

export interface Chunk {
  chunkX: number;
  chunkY: number;
  islands: Island[];
  clouds: CloudFormation[];
  deepOceanPatches: { x: number; y: number }[]; // ocean_super_deep locations
}

/**
 * Seeded pseudo-random number generator
 */
function seededRandom(x: number, y: number, seed: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
  return n - Math.floor(n);
}

/**
 * Noise function for organic shapes
 */
function noise2D(x: number, y: number, seed: number, scale: number = 0.1): number {
  const scaledX = x * scale;
  const scaledY = y * scale;
  
  // Multi-octave noise
  let value = 0;
  let amplitude = 1;
  let frequency = 1;
  
  for (let i = 0; i < 3; i++) {
    value += seededRandom(scaledX * frequency, scaledY * frequency, seed + i * 1000) * amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }
  
  return value / 1.75; // Normalize
}

/**
 * Generate 1-3 islands for a chunk with varying shapes
 * Ensures islands don't overlap with each other
 */
function generateIslandsForChunk(
  chunkX: number,
  chunkY: number,
  seed: number,
  assets: AssetDictionary
): Island[] {
  const islands: Island[] = [];
  
  // 30% chance for islands in this chunk
  const chunkRandom = seededRandom(chunkX, chunkY, seed);
  if (chunkRandom < 0.3) {
    const islandCount = Math.floor(seededRandom(chunkX, chunkY, seed + 100) * 3) + 1;
    
    for (let i = 0; i < islandCount; i++) {
      const offsetX = seededRandom(chunkX, chunkY, seed + i * 10) * CHUNK_SIZE * 0.6 + CHUNK_SIZE * 0.2;
      const offsetY = seededRandom(chunkX, chunkY, seed + i * 10 + 1) * CHUNK_SIZE * 0.6 + CHUNK_SIZE * 0.2;
      const centerX = (chunkX * CHUNK_SIZE + offsetX) * TILE_SIZE;
      const centerY = (chunkY * CHUNK_SIZE + offsetY) * TILE_SIZE;
      
      const baseRadius = Math.floor(seededRandom(chunkX, chunkY, seed + i * 10 + 2) * 10) + 8; // 8-18 tiles
      const estimatedRadius = baseRadius * TILE_SIZE * 1.8; // Max reach with transitions
      
      // Check if this island would overlap with existing islands
      const wouldOverlap = islands.some(existing => {
        const dx = centerX - existing.centerX;
        const dy = centerY - existing.centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = estimatedRadius + existing.radius + 50; // 50px minimum spacing
        return distance < minDistance;
      });
      
      // Skip this island if it would overlap
      if (wouldOverlap) continue;
      
      // Determine island shape type
      const shapeType = seededRandom(chunkX, chunkY, seed + i * 10 + 3);
      let shape: 'circle' | 'oval' | 'diagonal' | 'irregular';
      if (shapeType < 0.3) shape = 'circle';
      else if (shapeType < 0.5) shape = 'oval';
      else if (shapeType < 0.65) shape = 'diagonal';
      else shape = 'irregular';
      
      islands.push(
        buildIsland(
          `${chunkX},${chunkY},${i}`,
          centerX,
          centerY,
          baseRadius,
          shape,
          seed + i * 100,
          assets
        )
      );
    }
  }
  
  return islands;
}

/**
 * Build an island with varying shapes and smooth transitions
 */
function buildIsland(
  id: string,
  centerX: number,
  centerY: number,
  baseRadius: number,
  shape: 'circle' | 'oval' | 'diagonal' | 'irregular',
  seed: number,
  assets: AssetDictionary
): Island {
  const tiles: IslandTile[] = [];
  const radiusTiles = baseRadius;
  
  // Shape modifiers
  let stretchX = 1;
  let stretchY = 1;
  let rotation = 0;
  
  if (shape === 'oval') {
    const horizontal = seededRandom(0, 0, seed) > 0.5;
    stretchX = horizontal ? 1.5 : 0.7;
    stretchY = horizontal ? 0.7 : 1.5;
  } else if (shape === 'diagonal') {
    rotation = (seededRandom(1, 0, seed) * Math.PI / 2); // 0, 45, 90, 135 degrees
    stretchX = 1.4;
    stretchY = 0.8;
  }
  
  // Scan area and determine tiles
  const scanRadius = radiusTiles + 8;
  for (let dy = -scanRadius; dy <= scanRadius; dy++) {
    for (let dx = -scanRadius; dx <= scanRadius; dx++) {
      // Apply rotation and stretch
      let rx = dx;
      let ry = dy;
      if (rotation !== 0) {
        const cos = Math.cos(rotation);
        const sin = Math.sin(rotation);
        rx = dx * cos - dy * sin;
        ry = dx * sin + dy * cos;
      }
      
      rx /= stretchX;
      ry /= stretchY;
      
      let distance = Math.sqrt(rx * rx + ry * ry);
      
      // Add noise for irregular shapes
      if (shape === 'irregular') {
        const noiseValue = noise2D(dx, dy, seed, 0.2);
        distance += (noiseValue - 0.5) * 3; // Add irregularity
      }
      
      const normalizedDist = distance / radiusTiles;
      const tileRandom = seededRandom(dx, dy, seed);
      
      let texture: Texture | null = null;
      
      // Layered transitions: mountain > rocks > soil/sand/tree > shoal > ocean_shallow > ocean_semi_deep > ocean_deep
      if (normalizedDist < 0.2) {
        // Core: mountain
        texture = assets.mountain;
      } else if (normalizedDist < 0.4) {
        // Inner layer: rocks with some trees
        texture = tileRandom < 0.8 ? assets.rocks : assets.tree;
      } else if (normalizedDist < 0.6) {
        // Middle layer: soil, sand, trees, grass mix
        if (tileRandom < 0.3) texture = assets.soil;
        else if (tileRandom < 0.5) texture = assets.tree;
        else if (tileRandom < 0.75) texture = assets.grass;
        else texture = assets.sand;
      } else if (normalizedDist < 0.8) {
        // Outer land: sand and grass
        texture = tileRandom < 0.6 ? assets.sand : assets.grass;
      } else if (normalizedDist < 1.0) {
        // Beach: sand transitioning to shoal
        texture = tileRandom < 0.7 ? assets.sand : assets.shoal;
      } else if (normalizedDist < 1.2) {
        // Shallow water edge: shoal
        texture = assets.shoal;
      } else if (normalizedDist < 1.5) {
        // Shallow water: ocean_shallow
        texture = assets.oceanShallow;
      } else if (normalizedDist < 1.8) {
        // Transition water: ocean_semi_deep
        texture = assets.oceanSemiDeep;
      }
      // Beyond 1.8: let ocean_deep background show through
      
      if (texture) {
        tiles.push({
          offsetX: dx * TILE_SIZE,
          offsetY: dy * TILE_SIZE,
          texture,
        });
      }
    }
  }
  
  return { id, centerX, centerY, radius: radiusTiles * TILE_SIZE, tiles };
}

/**
 * Generate ocean_super_deep patches in non-island areas
 */
function generateDeepOceanPatches(
  chunkX: number,
  chunkY: number,
  seed: number,
  islands: Island[]
): { x: number; y: number }[] {
  const patches: { x: number; y: number }[] = [];
  
  // Generate 3-8 deep ocean patches per chunk
  const patchCount = Math.floor(seededRandom(chunkX, chunkY, seed + 9000) * 6) + 3;
  
  for (let i = 0; i < patchCount; i++) {
    const patchCenterX = Math.floor(seededRandom(chunkX, chunkY, seed + 9000 + i * 3) * CHUNK_SIZE);
    const patchCenterY = Math.floor(seededRandom(chunkX, chunkY, seed + 9000 + i * 3 + 1) * CHUNK_SIZE);
    const patchSize = Math.floor(seededRandom(chunkX, chunkY, seed + 9000 + i * 3 + 2) * 5) + 3; // 3-8 tiles
    
    const globalX = (chunkX * CHUNK_SIZE + patchCenterX) * TILE_SIZE;
    const globalY = (chunkY * CHUNK_SIZE + patchCenterY) * TILE_SIZE;
    
    // Check if far from islands
    const farFromIslands = islands.every(island => {
      const dx = globalX - island.centerX;
      const dy = globalY - island.centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      return dist > island.radius + 100; // At least 100px away
    });
    
    if (farFromIslands) {
      // Create patch of super deep ocean
      for (let py = -patchSize; py <= patchSize; py++) {
        for (let px = -patchSize; px <= patchSize; px++) {
          const patchDist = Math.sqrt(px * px + py * py);
          if (patchDist <= patchSize) {
            patches.push({
              x: globalX + px * TILE_SIZE,
              y: globalY + py * TILE_SIZE,
            });
          }
        }
      }
    }
  }
  
  return patches;
}

/**
 * Generate 1-3 cloud formations per chunk with spacing
 */
function generateCloudsForChunk(
  chunkX: number,
  chunkY: number,
  seed: number,
  islands: Island[],
  assets: AssetDictionary
): CloudFormation[] {
  const clouds: CloudFormation[] = [];
  
  // Generate 1-3 cloud formations (reduced for better performance)
  const cloudCount = Math.floor(seededRandom(chunkX, chunkY, seed + 7000) * 3) + 1;
  
  // Helper function to check if a cloud overlaps with existing clouds
  const checkOverlap = (x: number, y: number, radius: number): boolean => {
    return clouds.some(cloud => {
      const dx = x - cloud.centerX;
      const dy = y - cloud.centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      // Add buffer between clouds scaled by CLOUD_SIZE
      const buffer = 150 * gameProps.CLOUD_SIZE;
      return distance < (radius * gameProps.CLOUD_SIZE + cloud.radius * gameProps.CLOUD_SIZE + buffer);
    });
  };
  
  for (let i = 0; i < cloudCount; i++) {
    let centerX: number, centerY: number, radius: number;
    let attempts = 0;
    const maxAttempts = 10;
    
    // Try to find a non-overlapping position
    do {
      const offsetX = seededRandom(chunkX, chunkY, seed + 8000 + i * 5 + attempts) * CHUNK_SIZE * TILE_SIZE;
      const offsetY = seededRandom(chunkX, chunkY, seed + 8000 + i * 5 + 1 + attempts) * CHUNK_SIZE * TILE_SIZE;
      centerX = chunkX * CHUNK_SIZE * TILE_SIZE + offsetX;
      centerY = chunkY * CHUNK_SIZE * TILE_SIZE + offsetY;
      
      // Random radius between 1-100 pixels for maximum variety
      radius = Math.floor(seededRandom(chunkX, chunkY, seed + 8000 + i * 5 + 2 + attempts) * 100) + 1;
      attempts++;
    } while (checkOverlap(centerX, centerY, radius) && attempts < maxAttempts);
    
    // Skip this cloud if we couldn't find a non-overlapping position
    if (attempts >= maxAttempts && checkOverlap(centerX, centerY, radius)) {
      continue;
    }
    
    clouds.push(
      buildCloudFormation(
        `${chunkX},${chunkY},${i}`,
        centerX,
        centerY,
        radius,
        seed + i * 50,
        assets
      )
    );
  }
  
  return clouds;
}

/**
 * Build a cloud formation with varied shapes (elliptical, rectangular, diagonal)
 */
function buildCloudFormation(
  id: string,
  centerX: number,
  centerY: number,
  radius: number,
  seed: number,
  assets: AssetDictionary
): CloudFormation {
  const tiles: { offsetX: number; offsetY: number; texture: Texture }[] = [];
  
  // Random aspect ratio for ovalish variety (0.6 to 1.6 - moderate variation)
  // < 1.0 = slightly tall/vertical ovals
  // > 1.0 = slightly wide/horizontal ovals
  // ~1.0 = circular clouds
  const aspectRatioRand = seededRandom(0, 2, seed);
  let aspectRatio: number;
  if (aspectRatioRand < 0.33) {
    // Tall oval clouds (0.6 to 0.8)
    aspectRatio = 0.6 + seededRandom(0, 3, seed) * 0.2;
  } else if (aspectRatioRand < 0.66) {
    // Wide oval clouds (1.2 to 1.6)
    aspectRatio = 1.2 + seededRandom(0, 4, seed) * 0.4;
  } else {
    // Circular clouds (0.9 to 1.1)
    aspectRatio = 0.9 + seededRandom(0, 5, seed) * 0.2;
  }
  
  // Random rotation angle for diagonal orientations (0 to 180 degrees)
  const rotation = seededRandom(0, 6, seed) * Math.PI;
  
  // Width and height based on aspect ratio and CLOUD_SIZE multiplier
  const width = radius * aspectRatio * gameProps.CLOUD_SIZE;
  const height = radius / aspectRatio * 0.8 * gameProps.CLOUD_SIZE;
  
  // Calculate tile count based on area - multiply by 3 for better performance
  const tileCount = Math.floor((width * height * 3) / (TILE_SIZE * TILE_SIZE));
  
  // Textures for core and edge
  const coreTexture = assets.cloudCovered; // Solid cloud center
  const edgeTexture = assets.cloudLessCoverOcean; // Halftone transition
  
  // Generate cloud in elliptical/rectangular shape with rotation
  for (let i = 0; i < tileCount; i++) {
    // Random position within ellipse
    const angle = seededRandom(i, 0, seed) * Math.PI * 2;
    
    // Gaussian-like distribution for puffy center (more tiles toward center, fewer at edges)
    const randomDist1 = seededRandom(i, 1, seed);
    const randomDist2 = seededRandom(i, 2, seed);
    const gaussianDist = (randomDist1 + randomDist2) / 2; // Average creates bell curve
    const distanceFactor = gaussianDist * 0.95; // Fill to 95% with gaussian distribution
    
    // Elliptical coordinates
    let offsetX = Math.cos(angle) * width * distanceFactor;
    let offsetY = Math.sin(angle) * height * distanceFactor;
    
    // Apply rotation for diagonal clouds
    const rotatedX = offsetX * Math.cos(rotation) - offsetY * Math.sin(rotation);
    const rotatedY = offsetX * Math.sin(rotation) + offsetY * Math.cos(rotation);
    
    // Determine texture based on distance (terminator line at 0.7)
    // Core (0-70%): solid cloud_covered
    // Edge/Transition (70-95%): halftone cloud_less_cover
    const texture = distanceFactor < 0.7 ? coreTexture : edgeTexture;
    
    tiles.push({
      offsetX: Math.round(rotatedX / TILE_SIZE) * TILE_SIZE,
      offsetY: Math.round(rotatedY / TILE_SIZE) * TILE_SIZE,
      texture: texture,
    });
  }
  
  return { id, centerX, centerY, radius, tiles };
}

/**
 * Generate a chunk with islands, clouds, and deep ocean patches
 */
export function generateChunk(
  chunkX: number,
  chunkY: number,
  seed: number,
  assets: AssetDictionary
): Chunk {
  // Generate islands with varying shapes
  const islands = generateIslandsForChunk(chunkX, chunkY, seed, assets);
  
  // Generate deep ocean patches
  const deepOceanPatches = generateDeepOceanPatches(chunkX, chunkY, seed, islands);
  
  // Generate clouds
  const clouds = generateCloudsForChunk(chunkX, chunkY, seed, islands, assets);
  
  return {
    chunkX,
    chunkY,
    islands,
    clouds,
    deepOceanPatches,
  };
}

/**
 * Chunk cache to avoid regenerating chunks
 */
export class ChunkCache {
  private cache = new Map<string, Chunk>();
  private seed: number;
  private assets: AssetDictionary;
  
  constructor(seed: number, assets: AssetDictionary) {
    this.seed = seed;
    this.assets = assets;
  }
  
  private getKey(chunkX: number, chunkY: number): string {
    return `${chunkX},${chunkY}`;
  }
  
  getChunk(chunkX: number, chunkY: number): Chunk {
    const key = this.getKey(chunkX, chunkY);
    
    if (!this.cache.has(key)) {
      const chunk = generateChunk(chunkX, chunkY, this.seed, this.assets);
      this.cache.set(key, chunk);
    }
    
    return this.cache.get(key)!;
  }
  
  /**
   * Get all chunks in a radius around a center chunk
   */
  getChunksInRadius(centerChunkX: number, centerChunkY: number, radius: number): Chunk[] {
    const chunks: Chunk[] = [];
    
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        chunks.push(this.getChunk(centerChunkX + dx, centerChunkY + dy));
      }
    }
    
    return chunks;
  }
  
  /**
   * Clear old chunks to prevent memory leaks (keep only recent chunks)
   */
  cleanup(centerChunkX: number, centerChunkY: number, keepRadius: number) {
    const toDelete: string[] = [];
    
    this.cache.forEach((chunk, key) => {
      const dx = Math.abs(chunk.chunkX - centerChunkX);
      const dy = Math.abs(chunk.chunkY - centerChunkY);
      
      if (dx > keepRadius || dy > keepRadius) {
        toDelete.push(key);
      }
    });
    
    toDelete.forEach(key => this.cache.delete(key));
  }
}
