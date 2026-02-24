// Game scaling constants
// 1:1 pixel ratio (no scaling for tiles)

export const GAME_SCALE = 1;

// Base resolution (reference viewport)
export const BASE_WIDTH = 1920;
export const BASE_HEIGHT = 1080;

// Sprite sizes (in pixels, not scaled)
export const SPRITE_TILE_SIZE = 10;
export const SPRITE_JET_SIZE = 20;

import { gameProps } from '../engine/config';

// Rendered sizes
export const TILE_SIZE = SPRITE_TILE_SIZE * GAME_SCALE; // 10px (1:1)
export const JET_SIZE = gameProps.JET_SIZE * SPRITE_JET_SIZE; // Multiplier x base sprite size
export const CLOUD_TILE_SIZE = gameProps.CLOUD_SIZE * SPRITE_TILE_SIZE; // Cloud sprite scale

// Map chunk configuration
export const CHUNK_SIZE = 64; // tiles per chunk
export const CHUNK_PIXEL_SIZE = CHUNK_SIZE * TILE_SIZE; // 640px per chunk

// Content spacing (ensure content is far from starting viewport)
export const CONTENT_MIN_GAP = gameProps.CONTENT_MIN_GAP;
export const CONTENT_MAX_GAP = gameProps.CONTENT_MAX_GAP;
export const CONTENT_MAX_SIZE = 2000; // Maximum size constraint for content boxes
export const CONTENT_BORDER_TILES = 2;

// Movement constants
export const PLAYER_SPEED = gameProps.JET_SPEED;
export const ROTATION_LERP_FACTOR = gameProps.ROTATION_LERP_FACTOR;

// Parallax factors (relative to jet speed)
// Jet speed = 1.0 (base, fastest)
// Clouds = 0.6 (slower, middle layer)
// Terrain = 0.3 (slowest, background)
export const TERRAIN_PARALLAX = 0.3; // terrain moves slowest (background)
export const CLOUD_PARALLAX = 0.6; // clouds move slower than jet (middle)
export const CONTENT_PARALLAX = 1.0; // content items match jet speed

// Zoom limits
export const MIN_ZOOM = gameProps.MIN_ZOOM;
export const MAX_ZOOM = gameProps.MAX_ZOOM;
export const ZOOM_STEP = gameProps.ZOOM_STEP;

// Map bounds - computed dynamically based on content positions

