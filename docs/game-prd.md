# Product Requirements Document: Interactive Jet Map Game

**Version**: 1.0  
**Date**: February 24, 2026  
**Project**: Self-Intro Portfolio - Interactive Game Feature

---

## Overview

An interactive PixiJS-based game where users control a jet flying through an infinite procedurally-generated map to explore portfolio content. The game serves as the main navigation interface for the portfolio website, with different directional zones containing different content types (introduction, works, social media).

---

## User Experience

### Initial State
- User lands on homepage and sees a jet centered on an ocean/island procedural map
- Control instructions displayed in bottom-left corner
- Directional arrows around the jet indicate content zones:
  - **Up**: Introduction (who-is content)
  - **Right**: Works/Projects
  - **Left**: Social Media
  - **Down**: Exploration (loops back to top)
- If on mobile portrait mode, user sees "rotate to landscape" prompt

### Core Gameplay Loop
1. User controls jet using keyboard (WASD/arrows), mouse clicks, or touch
2. Jet flies smoothly through infinite map with parallax effects
3. Content items appear as interactive "islands" in their respective zones
4. User can click/tap content items with URLs to navigate
5. Map wraps seamlessly in all directions (infinite exploration)

---

## Technical Requirements

### Platform Support
- **Desktop**: Keyboard (WASD/Arrow keys), Mouse (point-and-click, scroll zoom)
- **Mobile**: Touch (directional control), Pinch (zoom)
- **Orientation**: Landscape mode required (portrait shows prompt)
- **Viewport**: Responsive scaling from mobile to 4K displays
- **Base Resolution**: 1920x1080 reference

### Performance
- Target: 60 FPS on modern devices
- Chunk-based rendering with culling for optimization
- Preload all assets before game start
- Smooth animations and transitions

### Browser Compatibility
- Modern browsers with Canvas/WebGL support
- React 19 + PixiJS 8 compatibility

---

## Game Mechanics

### Player Control

**Desktop Controls**:
- WASD or Arrow Keys: Directional movement (can combine for diagonal)
- Mouse Click: Point-and-click movement (jet follows cursor direction)
- Mouse Scroll: Zoom in/out

**Mobile Controls**:
- Touch: Tap direction from screen center to move jet toward point
- Pinch: Two-finger zoom in/out

**Movement Behavior**:
- Constant velocity when moving (configurable speed)
- Smooth rotation interpolation when changing direction
- Default jet orientation: facing upward

### Map System

**Terrain Generation**:
- Procedural tile-based system using noise/randomization
- Terrain types (by depth): ocean_super_deep → ocean_deep → ocean_semi_deep → ocean_shallow → shoal → sand → grass → soil → rocks → mountain
- Islands: clusters of land tiles (grass/sand/soil/trees) surrounded by water
- Chunk-based generation: 64x64 tile chunks loaded around camera
- Seamless wrapping in all directions (modulo-based for infinite map)

**Tile Specifications**:
- Sprite size: 10x10 pixels
- Rendered size: 50x50 pixels (1:5 scale ratio)
- Total terrain types: 14 unique tiles

### Parallax Layers

**Rendering Order** (back to front):
1. **Terrain Layer** (z:0): Ocean/land tiles, moves at 0.5x jet velocity
2. **Cloud Layer** (z:1): Cloud sprites, moves at 1.0x jet velocity (matches jet)
3. **Content Layer** (z:2): Interactive content items
4. **Jet Layer** (z:3): Player-controlled jet

### Content System

**Content Types & Zones**:
- **Up (Whois)**: Personal introduction content (Full Name, Age, etc.)
- **Right (Works)**: Portfolio projects and works
- **Left (Social Media)**: Social network links and profiles
- **Center**: Starting point showing controls

**Content Placement**:
- Sequential along primary axis (e.g., right: x = 300, 600, 900...)
- Random offset on perpendicular axis (±50 to ±150 pixels)
- Gap spacing: 200-400 pixels between items
- Max item size: ~200 pixels (relative to viewport)

**Content Structure** (JSON):
```json
{
  "header": "string (title/label)",
  "content": "string (description)",
  "image": "string? (optional image URL from /public)",
  "url_link": "string? (optional clickable URL)"
}
```

**Content Rendering**:
- Border: 2x tile_10x10.png around edges
- Layout: Image (if exists) → Header (centered) → Content (justified)
- Interactive: Items with url_link are clickable
- Typography: Uses custom font styles (Jersey 10)

### Jet Entity

**Specifications**:
- Sprite: jet_20x20.png (20x20 pixels)
- Rendered size: 100x100 pixels (1:5 scale)
- Default orientation: Facing upward (0°)
- Position: Always centered on screen (camera follows)

**Rotation**:
- Calculated from velocity direction: `Math.atan2(vy, vx)`
- Smooth interpolation: lerp to target rotation
- Updates continuously during movement

---

## Asset Specifications

### Sprites

**Map Terrain** (14 tiles, all 10x10px):
- Water: ocean_super_deep, ocean_deep, ocean_semi_deep, ocean_shallow, shoal
- Land: grass, sand, soil, rocks, mountain, tree
- Weather: cloud_covered, cloud_less_cover_blend_land, cloud_less_cover_blend_ocean

**Interactive** (2 sprites):
- jet_20x20.png (20x20px)
- tile_10x10.png (10x10px, used for content borders)

### Content Data

**File Structure**:
```
src/assets/contents/
  whois/           # Personal intro (*.json)
  works/           # Portfolio projects (*.json)
  social_network/  # Social media links (*.json)
```

**Dynamic Loading**:
- System scans folders and loads all .json files
- Content positions calculated on load
- Map size determined by total content count

---

## UI/UX Requirements

### On-Screen UI Elements

**Control Instructions** (bottom-left):
- Desktop: "WASD or Arrow Keys to Move | Mouse Click to Point | Scroll to Zoom"
- Mobile: "Touch to Move | Pinch to Zoom"
- Persistent display

**Directional Indicators** (at game start):
- Arrows pointing in four directions from jet
- Labels: Up="Introduction", Right="Works", Left="Social Media", Down="Explore"
- Fade out after first movement or 3-5 second timer

**Orientation Guard** (mobile portrait):
- Full-screen overlay: "Please rotate your device to landscape"
- Blocks game until landscape orientation detected
- Icon/animation showing rotation gesture

### Accessibility
- Keyboard-only navigation support
- Clear visual indicators for interactive elements
- Readable text sizing with viewport scaling

---

## Implementation Architecture

### Component Structure
```
src/features/game/
  GameMainPage.tsx          # Entry point
  engine/
    Engine.tsx              # Game orchestration
    PixiJSWrapper.tsx       # PixiJS React wrapper
  context/
    GameContext.tsx         # Global game state
  components/
    Camera.tsx              # Viewport/camera system
    TerrainLayer.tsx        # Procedural terrain rendering
    CloudLayer.tsx          # Cloud parallax layer
    ContentItems.tsx        # Interactive content islands
    Jet.tsx                 # Player entity
    UIOverlay.tsx           # DOM-based UI controls
    OrientationGuard.tsx    # Portrait mode blocker
  hooks/
    UseInputController.tsx  # Input handling
    UseScaleContent.tsx     # Viewport scaling
  utils/
    AssetLoader.ts          # Sprite/texture loading
    ContentManager.ts       # JSON content loading
    MapGenerator.ts         # Procedural map generation
    Scale.tsx               # Scale constants
    FontStyle.tsx           # Typography utilities
```

### State Management
- Pattern: React Context + useState/useReducer
- Following existing ExampleContext.tsx pattern
- Global state: player position, velocity, rotation, zoom, loaded content, camera offset

### Rendering Strategy
- PixiJS 8 with @pixi/react for React integration
- Chunk-based loading: generate/render only visible map chunks
- Culling: hide off-screen sprites for performance
- Layer-based z-indexing for proper draw order

---

## Success Criteria

### Functional Requirements
- ✅ Jet responds to all input methods (keyboard, mouse, touch)
- ✅ Map generates procedurally and wraps infinitely
- ✅ Content items load dynamically from JSON files
- ✅ Content items are clickable when url_link exists
- ✅ Parallax layers render at correct speeds
- ✅ Smooth jet rotation during direction changes
- ✅ Zoom functionality works correctly
- ✅ Portrait mode shows orientation prompt

### Performance Requirements
- ✅ Maintains 60 FPS during gameplay
- ✅ Loads all assets before game starts
- ✅ Responsive to all viewport sizes

### User Experience Requirements
- ✅ Controls are intuitive and responsive
- ✅ Visual feedback for all interactions
- ✅ Smooth animations and transitions
- ✅ Clear navigation indicators at start

---

## Future Enhancements (Out of Scope for V1)

- Minimap showing content zones
- Search functionality to jump to specific content
- Animations for content item hover states
- Sound effects and background music
- Additional terrain biomes
- Weather effects (rain, storms)
- Day/night cycle
- Multiplayer cursors showing other visitors

---

## References

- PixiJS v8 Documentation: https://pixijs.download/release/docs/index.html
- PixiJS React: https://react.pixijs.io/components/pixi-components/
- Astro Framework: https://astro.build
- Project Repository: f:\dev\website\self-intro-portfolio
