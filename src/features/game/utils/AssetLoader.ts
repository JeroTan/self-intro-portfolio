import { Assets, type Texture, SCALE_MODES } from 'pixi.js';

// Import all sprites using Astro's static asset handling
import jetSprite from '@/assets/sprites/interactive/jet_20x20.png';
import tileSprite from '@/assets/sprites/interactive/tile_10x10.png';

// Map terrain sprites
import cloudCovered from '@/assets/sprites/map/cloud_covered_10x10.png';
import cloudLessCoverLand from '@/assets/sprites/map/cloud_less_cover_blend_land_10x10.png';
import cloudLessCoverOcean from '@/assets/sprites/map/cloud_less_cover_blend_ocean_10x10.png';
import grass from '@/assets/sprites/map/grass_10x10.png';
import mountain from '@/assets/sprites/map/mountain_10x10.png';
import oceanDeep from '@/assets/sprites/map/ocean_deep_10x10.png';
import oceanSemiDeep from '@/assets/sprites/map/ocean_semi_deep_10x10.png';
import oceanShallow from '@/assets/sprites/map/ocean_shallow_10x10.png';
import oceanSuperDeep from '@/assets/sprites/map/ocean_super_deep_10x10.png';
import rocks from '@/assets/sprites/map/rocks_10x10.png';
import sand from '@/assets/sprites/map/sand_10x10.png';
import shoal from '@/assets/sprites/map/shoal_10x10.png';
import soil from '@/assets/sprites/map/soil_10x10.png';
import tree from '@/assets/sprites/map/tree_10x10.png';

export interface AssetDictionary {
  // Interactive sprites
  jet: Texture;
  tile: Texture;
  
  // Terrain sprites
  grass: Texture;
  sand: Texture;
  soil: Texture;
  rocks: Texture;
  mountain: Texture;
  tree: Texture;
  
  // Water sprites
  oceanSuperDeep: Texture;
  oceanDeep: Texture;
  oceanSemiDeep: Texture;
  oceanShallow: Texture;
  shoal: Texture;
  
  // Cloud sprites
  cloudCovered: Texture;
  cloudLessCoverLand: Texture;
  cloudLessCoverOcean: Texture;
}

/**
 * Preload all game assets
 * Returns a dictionary of textures keyed by sprite name
 */
export async function loadAssets(): Promise<AssetDictionary> {
  // Explicitly load and wait for Jersey 10 font
  try {
    const font = new FontFace('Jersey 10', 'url(/fonts/jersey-10-regular.ttf)');
    await font.load();
    document.fonts.add(font);
  } catch (error) {
    console.warn('Failed to load Jersey 10 font:', error);
  }
  
  // Also wait for all fonts to be ready
  await document.fonts.ready;
  
  const assetManifest = {
    // Interactive
    jet: jetSprite.src,
    tile: tileSprite.src,
    
    // Terrain
    grass: grass.src,
    sand: sand.src,
    soil: soil.src,
    rocks: rocks.src,
    mountain: mountain.src,
    tree: tree.src,
    
    // Water
    oceanSuperDeep: oceanSuperDeep.src,
    oceanDeep: oceanDeep.src,
    oceanSemiDeep: oceanSemiDeep.src,
    oceanShallow: oceanShallow.src,
    shoal: shoal.src,
    
    // Clouds
    cloudCovered: cloudCovered.src,
    cloudLessCoverLand: cloudLessCoverLand.src,
    cloudLessCoverOcean: cloudLessCoverOcean.src,
  };

  // Load all assets
  const entries = Object.entries(assetManifest);
  await Assets.load(entries.map(([key, url]) => ({ alias: key, src: url })));

  // Retrieve loaded textures and set scale mode to nearest for pixel art
  const textures: AssetDictionary = {} as AssetDictionary;
  for (const [key] of entries) {
    const texture = Assets.get(key);
    // Set nearest neighbor scaling for crisp pixel art
    texture.source.scaleMode = 'nearest';
    textures[key as keyof AssetDictionary] = texture;
  }

  return textures;
}
