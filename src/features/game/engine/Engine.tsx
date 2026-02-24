import { useEffect, useState, useMemo } from 'react';
import { useTick } from '@pixi/react';
import GameContextProvider, { useGameContext } from '../context/GameContext';
import { PixiJSWrapper } from './PixiJSWrapper';
import { loadAssets, type AssetDictionary } from '../utils/AssetLoader';
import { loadAllContent } from '../utils/ContentManager';
import { ChunkCache } from '../utils/MapGenerator';
import { ROTATION_LERP_FACTOR } from '../utils/Scale';
import useInputController from '../hooks/UseInputController';
import { useAppWithScaleConstant } from '../hooks/UseScaleContent';

// Components
import Camera from '../components/Camera';
import OceanBackground from '../components/OceanBackground';
import TerrainLayer from '../components/TerrainLayer';
import CloudLayer from '../components/CloudLayer';
import ContentItems from '../components/ContentItems';
import DirectionalSignposts from '../components/DirectionalSignposts';
import Jet from '../components/Jet';
import UIOverlay from '../components/UIOverlay';
import OrientationGuard from '../components/OrientationGuard';

export default function Engine() {
  return (
    <GameContextProvider>
      <EngineContent />
    </GameContextProvider>
  );
}

function EngineContent() {
  const { state } = useGameContext();
  
  return (
    <div className="relative w-full h-full">
      <OrientationGuard />
      <PixiJSWrapper>
        <Main />
      </PixiJSWrapper>
      <UIOverlay />
    </div>
  );
}

function Main() {
  const { state, setAssetsLoaded, setContentItems, setContentItemTextures, setMapBounds, setIsReady, updatePlayerPosition, setPlayerRotation } = useGameContext();
  const [assets, setAssets] = useState<AssetDictionary | null>(null);
  const [cloudImage, setCloudImage] = useState<any>(null);
  const [contentTexturesReady, setContentTexturesReady] = useState(false);
  const [app, scaleX, scaleY, viewportWidth, viewportHeight] = useAppWithScaleConstant();
  
  // Initialize input controller
  useInputController();
  
  // Create chunk cache ONCE - shared by terrain and cloud layers
  // This ensures map generation happens once and is cached
  const chunkCache = useMemo(() => {
    if (!assets) return null;
    return new ChunkCache(state.mapSeed, assets);
  }, [state.mapSeed, assets]);
  
  // Load assets and content on mount
  useEffect(() => {
    async function initialize() {
      try {
        // Load all assets
        const loadedAssets = await loadAssets();
        setAssets(loadedAssets);
        setAssetsLoaded(true);
        
        // Load all content with viewport dimensions - returns content and computed bounds
        const { contentItems, mapBounds } = await loadAllContent(viewportWidth, viewportHeight);
        setContentItems(contentItems);
        setMapBounds(mapBounds);
        
        // Generate cloud image BEFORE marking ready
        const mapWidth = mapBounds.x * 2;
        const mapHeight = mapBounds.y * 2;
        
        const { generateCombinedCloudImage } = await import('../utils/CloudTextureGenerator');
        const cloudResult = await generateCombinedCloudImage(mapWidth, mapHeight, state.mapSeed);
        
        // Load image and create texture
        const img = new Image();
        img.src = cloudResult.imageUrl;
        await img.decode();
        
        const { Texture } = await import('pixi.js');
        const texture = Texture.from(img);
        
        setCloudImage({ ...cloudResult, texture });
        
        // Generate content item images (pre-render each content item)
        const { generateContentItemImage } = await import('../utils/ContentItemImageGenerator');
        const contentTextures = new Map<string, { texture: any; width: number; height: number }>();
        
        for (const item of contentItems) {
          const { imageUrl, width, height } = await generateContentItemImage(item.data, item.id);
          
          // Load image and create texture
          const contentImg = new Image();
          contentImg.src = imageUrl;
          await contentImg.decode();
          
          const contentTexture = Texture.from(contentImg);
          contentTextures.set(item.id, { texture: contentTexture, width, height });
          
          // Clean up blob URL
          URL.revokeObjectURL(imageUrl);
        }
        
        setContentItemTextures(contentTextures);
        setContentTexturesReady(true);
        
        // Mark game as ready ONLY after all assets including cloud and content images are loaded
        setIsReady(true);
      } catch (error) {
        console.error('Failed to load game assets:', error);
      }
    }
    
    initialize();
  }, [setAssetsLoaded, setContentItems, setContentItemTextures, setMapBounds, setIsReady, viewportWidth, viewportHeight, state.mapSeed]);
  
  // Game loop - update player position and rotation
  useTick((ticker) => {
    if (!state.isReady || !state.mapBounds) return;
    
    // Use actual elapsed time in seconds for true frame-independent movement
    const deltaTime = ticker.deltaMS / 1000; // Convert milliseconds to seconds
    
    const { playerPosition, playerVelocity, playerRotation, targetRotation, mapBounds } = state;
    
    // Update position based on velocity (pixels per second)
    let newX = playerPosition.x + playerVelocity.vx * deltaTime;
    let newY = playerPosition.y + playerVelocity.vy * deltaTime;
    
    // World map wrapping (like Final Fantasy 6)
    // Map is finite: -mapBounds to +mapBounds (e.g., -2500 to +2500)
    // When crossing boundary, wrap to opposite side using modulo
    const totalWidth = mapBounds.x * 2; // Total map width (e.g., 5000)
    const totalHeight = mapBounds.y * 2; // Total map height (e.g., 5000)
    
    // Normalize to 0-based coordinates for modulo operation
    newX = ((newX + mapBounds.x) % totalWidth + totalWidth) % totalWidth - mapBounds.x;
    newY = ((newY + mapBounds.y) % totalHeight + totalHeight) % totalHeight - mapBounds.y;
    
    updatePlayerPosition(newX, newY);
    
    // Smooth rotation interpolation (lerp)
    if (playerVelocity.vx !== 0 || playerVelocity.vy !== 0) {
      let rotationDiff = targetRotation - playerRotation;
      
      // Handle rotation wrapping (choose shortest path)
      if (rotationDiff > Math.PI) rotationDiff -= Math.PI * 2;
      if (rotationDiff < -Math.PI) rotationDiff += Math.PI * 2;
      
      const newRotation = playerRotation + rotationDiff * ROTATION_LERP_FACTOR * deltaTime;
      setPlayerRotation(newRotation);
    }
  });
  
  // Show loading placeholder until ALL assets are loaded (including cloud and content images)
  if (!assets || !cloudImage || !contentTexturesReady) {
    const loadingMessage = !assets 
      ? 'Loading assets...' 
      : !cloudImage 
        ? 'Generating cloud atlas...' 
        : 'Rendering content items...';
    
    return (
      <pixiContainer>
        <pixiGraphics
          draw={(graphics) => {
            graphics.clear();
            graphics.rect(0, 0, viewportWidth, viewportHeight);
            graphics.fill({ color: 0x1e3a8a }); // Blue background
          }}
        />
        <pixiText
          text={loadingMessage}
          x={viewportWidth / 2}
          y={viewportHeight / 2}
          anchor={{ x: 0.5, y: 0.5 }}
          style={{
            fontFamily: 'Arial',
            fontSize: 32,
            fill: 0xffffff,
            align: 'center'
          }}
        />
      </pixiContainer>
    );
  }
  
  return (
    <Camera>
      {/* Layer 0: Ocean background (static, fills entire background) */}
      <OceanBackground assets={assets} />
      
      {/* Layer 1: Islands (slowest parallax 0.3x) */} 
      {/* <TerrainLayer assets={assets} chunkCache={chunkCache!} /> */}
      
      {/* Layer 2: Clouds (medium parallax 0.6x) */}
      <CloudLayer assets={assets} cloudImage={cloudImage} />
      
      {/* Layer 3: Directional signposts (match jet speed 1.0x) */}
      <DirectionalSignposts assets={assets} />

      
      {/* Layer 4: Content items (match jet speed 1.0x) */}
      <ContentItems assets={assets} />
      
      {/* Layer 5: Player jet (always on top, 1.0x) */}
      <Jet assets={assets} />
    </Camera>
  );
}