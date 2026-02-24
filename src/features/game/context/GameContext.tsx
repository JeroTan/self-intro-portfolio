import { createContext, useContext, useState, useCallback, type PropsWithChildren } from "react";
import { gameProps } from '../engine/config';
import type { Texture } from 'pixi.js';

export interface ContentItem {
  id: string;
  type: 'whois' | 'works' | 'social_network';
  position: { x: number; y: number };
  data: {
    header: string;
    content: string;
    image?: string;
    url_link?: string;
  };
}

export interface GameState {
  // Player state
  playerPosition: { x: number; y: number };
  playerVelocity: { vx: number; vy: number };
  playerRotation: number;
  targetRotation: number;
  
  // Camera state
  cameraOffset: { x: number; y: number };
  zoom: number;
  
  // Content state
  contentItems: ContentItem[];
  contentItemTextures: Map<string, { texture: Texture; width: number; height: number }> | null; // Pre-rendered content images
  
  // Control state
  isMobile: boolean;
  isPortrait: boolean;
  
  // Game state
  isReady: boolean;
  assetsLoaded: boolean;
  showDirectionalArrows: boolean;
  isResetting: boolean;
  
  // Map state
  mapSeed: number;
  mapBounds: { x: number; y: number } | null; // Dynamic bounds based on content
}

export interface GameContextType {
  state: GameState;
  
  // Player actions
  updatePlayerPosition: (x: number, y: number) => void;
  updatePlayerVelocity: (vx: number, vy: number) => void;
  setPlayerRotation: (rotation: number) => void;
  setTargetRotation: (rotation: number) => void;
  
  // Camera actions
  setCameraOffset: (x: number, y: number) => void;
  setZoom: (zoom: number) => void;
  
  // Content actions
  setContentItems: (items: ContentItem[]) => void;
  setContentItemTextures: (textures: Map<string, { texture: Texture; width: number; height: number }>) => void;
  setMapBounds: (bounds: { x: number; y: number }) => void;
  
  // Control actions
  setIsMobile: (isMobile: boolean) => void;
  setIsPortrait: (isPortrait: boolean) => void;
  
  // Game actions
  setIsReady: (ready: boolean) => void;
  setAssetsLoaded: (loaded: boolean) => void;
  hideDirectionalArrows: () => void;
  resetPlayer: () => void;
}

export const GameContext = createContext<GameContextType>(null!);

export default function GameContextProvider({ children }: PropsWithChildren<{}>) {
  const [state, setState] = useState<GameState>({
    // Player at origin
    playerPosition: { x: 0, y: 0 },
    playerVelocity: { vx: 0, vy: 0 },
    playerRotation: 0, // Facing up
    targetRotation: 0,
    
    // Camera follows player
    cameraOffset: { x: 0, y: 0 },
    zoom: 1.0,
    
    // Content empty initially
    contentItems: [],
    contentItemTextures: null,
    
    // Control defaults
    isMobile: false,
    isPortrait: false,
    
    // Game not ready
    isReady: false,
    assetsLoaded: false,
    showDirectionalArrows: true,
    isResetting: false,
    
    // Random seed for map generation
    mapSeed: Math.random() * 10000,
    mapBounds: null, // Computed after content loads
  });

  const updatePlayerPosition = useCallback((x: number, y: number) => {
    setState(prev => ({ ...prev, playerPosition: { x, y } }));
  }, []);

  const updatePlayerVelocity = useCallback((vx: number, vy: number) => {
    setState(prev => ({ ...prev, playerVelocity: { vx, vy } }));
  }, []);

  const setPlayerRotation = useCallback((rotation: number) => {
    setState(prev => ({ ...prev, playerRotation: rotation }));
  }, []);

  const setTargetRotation = useCallback((rotation: number) => {
    setState(prev => ({ ...prev, targetRotation: rotation }));
  }, []);

  const setCameraOffset = useCallback((x: number, y: number) => {
    setState(prev => ({ ...prev, cameraOffset: { x, y } }));
  }, []);

  const setZoom = useCallback((zoom: number) => {
    setState(prev => ({ ...prev, zoom: Math.max(gameProps.MIN_ZOOM, Math.min(gameProps.MAX_ZOOM, zoom)) }));
  }, []);

  const setContentItems = useCallback((items: ContentItem[]) => {
    setState(prev => ({ ...prev, contentItems: items }));
  }, []);

  const setContentItemTextures = useCallback((textures: Map<string, { texture: Texture; width: number; height: number }>) => {
    setState(prev => ({ ...prev, contentItemTextures: textures }));
  }, []);

  const setMapBounds = useCallback((bounds: { x: number; y: number }) => {
    setState(prev => ({ ...prev, mapBounds: bounds }));
  }, []);

  const setIsMobile = useCallback((isMobile: boolean) => {
    setState(prev => ({ ...prev, isMobile }));
  }, []);

  const setIsPortrait = useCallback((isPortrait: boolean) => {
    setState(prev => ({ ...prev, isPortrait }));
  }, []);

  const setIsReady = useCallback((ready: boolean) => {
    setState(prev => ({ ...prev, isReady: ready }));
  }, []);

  const setAssetsLoaded = useCallback((loaded: boolean) => {
    setState(prev => ({ ...prev, assetsLoaded: loaded }));
  }, []);

  const hideDirectionalArrows = useCallback(() => {
    setState(prev => ({ ...prev, showDirectionalArrows: false }));
  }, []);

  const resetPlayer = useCallback(() => {
    console.log('Resetting player to origin (0, 0)');
    // Set resetting flag first
    setState(prev => ({ ...prev, isResetting: true }));
    
    // Then reset everything
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        playerPosition: { x: 0, y: 0 },
        playerVelocity: { vx: 0, vy: 0 },
        playerRotation: 0,
        targetRotation: 0,
        cameraOffset: { x: 0, y: 0 },
        zoom: 1.0,
        showDirectionalArrows: true,
        isResetting: false,
      }));
    }, 0);
  }, []);

  return (
    <GameContext.Provider
      value={{
        state,
        updatePlayerPosition,
        updatePlayerVelocity,
        setPlayerRotation,
        setTargetRotation,
        setCameraOffset,
        setZoom,
        setContentItems,
        setContentItemTextures,
        setMapBounds,
        setIsMobile,
        setIsPortrait,
        setIsReady,
        setAssetsLoaded,
        hideDirectionalArrows,
        resetPlayer,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGameContext() {
  return useContext(GameContext);
}
