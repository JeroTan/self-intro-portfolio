// Import tile asset directly
import tileSprite from '@/assets/sprites/interactive/tile_10x10.png';
import { TILE_SIZE } from './Scale';
import type { ContentData } from './ContentManager';

/**
 * PRE-RENDER OPTIMIZATION: Generate static images for each content item
 * 
 * Pure vanilla JS - no React, no PixiJS in generation
 * Uses Canvas2D API to render the complete content item:
 * - Background rectangles (border + content area)
 * - Procedural tile border
 * - Header and body text
 * 
 * Returns blob URL for the final rendered image
 * Runtime: Just draw ONE sprite instead of complex PixiJS objects
 */

interface ContentImageResult {
  imageUrl: string; // Blob URL from URL.createObjectURL
  width: number;
  height: number;
}

/**
 * Seeded random number generator (same as ContentItems.tsx)
 */
function seededRandom(seed: number, index: number): number {
  const x = Math.sin(seed + index * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Measure text dimensions using Canvas2D
 */
function measureText(
  ctx: CanvasRenderingContext2D,
  text: string,
  font: string,
  maxWidth: number
): { width: number; height: number; lines: string[] } {
  ctx.font = font;
  const metrics = ctx.measureText(text);
  const singleLineWidth = metrics.width;
  
  // If text fits in one line, return it
  if (singleLineWidth <= maxWidth) {
    return {
      width: singleLineWidth,
      height: metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent,
      lines: [text],
    };
  }
  
  // Text needs wrapping - split by words
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  words.forEach((word, i) => {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = ctx.measureText(testLine).width;
    
    if (testWidth <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      currentLine = word;
    }
  });
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  // Calculate actual wrapped dimensions
  let maxLineWidth = 0;
  lines.forEach(line => {
    const lineWidth = ctx.measureText(line).width;
    maxLineWidth = Math.max(maxLineWidth, lineWidth);
  });
  
  const lineHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
  const totalHeight = lineHeight * lines.length * 1.2; // 1.2 for line spacing
  
  return {
    width: maxLineWidth,
    height: totalHeight,
    lines,
  };
}

/**
 * Generate complete content item image
 */
export async function generateContentItemImage(
  data: ContentData,
  id: string
): Promise<ContentImageResult> {
  const { header, content } = data;
  
  // Create temporary canvas for measurement
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true })!;
  
  // Font configurations (matching FontStyle.tsx)
  const headerFont = '80px "Jersey 10", sans-serif';
  const bodyFont = '32px "Jersey 10", sans-serif';
  const maxTextWidth = 700;
  const padding = 40;
  const verticalGap = 20;
  
  // Measure text
  const headerMeasure = measureText(tempCtx, header, headerFont, maxTextWidth);
  const bodyMeasure = measureText(tempCtx, content, bodyFont, maxTextWidth);
  
  // Calculate content dimensions
  const contentWidth = Math.max(headerMeasure.width, bodyMeasure.width) + padding * 2;
  const contentHeight = headerMeasure.height + verticalGap + bodyMeasure.height + padding * 2;
  
  // Calculate border dimensions
  const halfWidth = Math.floor(contentWidth / 2 / TILE_SIZE);
  const halfHeight = Math.floor(contentHeight / 2 / TILE_SIZE);
  const maxDepth = 4;
  const borderGap = TILE_SIZE; // 1 tile gap for dark background
  
  // Calculate total canvas size (content + border + extra space for tiles)
  const canvasWidth = contentWidth + (maxDepth * 2 + 2) * TILE_SIZE * 2;
  const canvasHeight = contentHeight + (maxDepth * 2 + 2) * TILE_SIZE * 2;
  
  // Create main canvas
  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  
  // Center offset for drawing
  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;
  
  // Load tile image
  const tileImg = new Image();
  const tilePromise = new Promise<void>((resolve, reject) => {
    tileImg.onload = () => resolve();
    tileImg.onerror = reject;
  });
  tileImg.src = tileSprite.src;
  await tilePromise;
  
  // Generate procedural tile border positions (same algorithm as ContentItems.tsx)
  const seed = id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
  
  const getDepthForAngle = (angle: number) => {
    const normalizedAngle = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const segmentSize = (Math.PI * 2) / 8;
    const segmentIndex = Math.floor(normalizedAngle / segmentSize);
    const nextSegmentIndex = (segmentIndex + 1) % 8;
    const t = (normalizedAngle - segmentIndex * segmentSize) / segmentSize;
    
    const depth1 = Math.floor(2 + seededRandom(seed, segmentIndex) * 3);
    const depth2 = Math.floor(2 + seededRandom(seed, nextSegmentIndex) * 3);
    
    return Math.floor(depth1 + (depth2 - depth1) * t);
  };
  
  const borderTiles: { x: number; y: number }[] = [];
  
  for (let tileY = -halfHeight - maxDepth; tileY <= halfHeight + maxDepth; tileY++) {
    for (let tileX = -halfWidth - maxDepth; tileX <= halfWidth + maxDepth; tileX++) {
      const isOutsideContent = 
        tileX < -halfWidth - 1 || tileX > halfWidth + 1 ||
        tileY < -halfHeight - 1 || tileY > halfHeight + 1;
      
      if (isOutsideContent) {
        let dx = 0;
        let dy = 0;
        
        if (tileX < -halfWidth - 1) {
          dx = -halfWidth - 1 - tileX;
        } else if (tileX > halfWidth + 1) {
          dx = tileX - halfWidth - 1;
        }
        
        if (tileY < -halfHeight - 1) {
          dy = -halfHeight - 1 - tileY;
        } else if (tileY > halfHeight + 1) {
          dy = tileY - halfHeight - 1;
        }
        
        const distanceFromEdge = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(tileY, tileX);
        const depth = getDepthForAngle(angle);
        
        if (distanceFromEdge <= depth) {
          borderTiles.push({
            x: tileX * TILE_SIZE,
            y: tileY * TILE_SIZE,
          });
        }
      }
    }
  }
  
  // Draw dark metallic border background
  ctx.fillStyle = '#4A5568'; // Dark metallic blue-gray
  ctx.fillRect(
    centerX - contentWidth / 2 - borderGap,
    centerY - contentHeight / 2 - borderGap,
    contentWidth + borderGap * 2,
    contentHeight + borderGap * 2
  );
  
  // Draw content background (light silver)
  ctx.fillStyle = '#E2E8F0'; // Light metallic silver
  ctx.fillRect(
    centerX - contentWidth / 2,
    centerY - contentHeight / 2,
    contentWidth,
    contentHeight
  );
  
  // Draw tile border sprites
  borderTiles.forEach(tile => {
    ctx.drawImage(
      tileImg,
      centerX + tile.x - TILE_SIZE / 2,
      centerY + tile.y - TILE_SIZE / 2,
      TILE_SIZE,
      TILE_SIZE
    );
  });
  
  // Draw header text (centered)
  ctx.font = headerFont;
  ctx.fillStyle = '#333333'; // Dark gray
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  
  let currentY = centerY - contentHeight / 2 + padding;
  headerMeasure.lines.forEach((line, i) => {
    const lineHeight = headerMeasure.height / headerMeasure.lines.length * 1.2;
    ctx.fillText(line, centerX, currentY + i * lineHeight);
  });
  currentY += headerMeasure.height + verticalGap;
  
  // Draw body text (centered)
  ctx.font = bodyFont;
  ctx.fillStyle = '#555555'; // Medium gray
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  
  bodyMeasure.lines.forEach((line, i) => {
    const lineHeight = bodyMeasure.height / bodyMeasure.lines.length * 1.2;
    ctx.fillText(line, centerX, currentY + i * lineHeight);
  });
  
  // Convert to blob URL
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Failed to create blob from canvas'));
        return;
      }
      
      const imageUrl = URL.createObjectURL(blob);
      resolve({
        imageUrl,
        width: canvasWidth,
        height: canvasHeight,
      });
    }, 'image/png');
  });
}
