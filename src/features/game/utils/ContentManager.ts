import type { ContentItem } from '../context/GameContext';
import { CONTENT_MIN_GAP, CONTENT_MAX_GAP } from './Scale';
import { Text } from 'pixi.js';
import { makeContentHeaderStyle, makeContentTextStyle } from './FontStyle';

export interface ContentData {
  header: string;
  content: string;
  image?: string;
  url_link?: string;
}

interface ContentWithSize extends ContentData {
  width: number;
  height: number;
}

/**
 * Calculate content box dimensions based on text
 */
function calculateContentSize(data: ContentData): { width: number; height: number } {
  const { header, content } = data;
  
  // Create styles for measurement
  const hStyle = makeContentHeaderStyle({});
  const bStyle = makeContentTextStyle({});
  
  // Max width constraint: expand horizontally up to 700px, then wrap vertically
  const maxTextWidth = 700;
  
  // Measure header text
  let headerText = new Text({ text: header, style: hStyle });
  let headerWidth = headerText.width;
  let headerHeight = headerText.height;
  headerText.destroy();
  
  // If header exceeds max width, remeasure with word wrap
  if (headerWidth > maxTextWidth) {
    hStyle.wordWrap = true;
    hStyle.wordWrapWidth = maxTextWidth;
    headerText = new Text({ text: header, style: hStyle });
    headerWidth = headerText.width;
    headerHeight = headerText.height;
    headerText.destroy();
  }
  
  // Measure body text
  let bodyText = new Text({ text: content, style: bStyle });
  let bodyWidth = bodyText.width;
  let bodyHeight = bodyText.height;
  bodyText.destroy();
  
  // If body exceeds max width, remeasure with word wrap
  if (bodyWidth > maxTextWidth) {
    bStyle.wordWrap = true;
    bStyle.wordWrapWidth = maxTextWidth;
    bodyText = new Text({ text: content, style: bStyle });
    bodyWidth = bodyText.width;
    bodyHeight = bodyText.height;
    bodyText.destroy();
  }
  
  // Calculate total dimensions with padding
  const padding = 40; // Space around text
  const verticalGap = 20; // Gap between header and body
  
  const width = Math.max(headerWidth, bodyWidth) + padding * 2;
  const height = headerHeight + verticalGap + bodyHeight + padding * 2;
  
  return { width, height };
}

/**
 * Load all content JSON files from the assets folder
 */
export async function loadContentData(): Promise<{
  whois: ContentData[];
  works: ContentData[];
  socialNetwork: ContentData[];
}> {
  const whois: ContentData[] = [];
  const works: ContentData[] = [];
  const socialNetwork: ContentData[] = [];

  // Dynamically import all JSON files from content folders
  const whoisFiles = import.meta.glob<{ default: ContentData }>('/src/assets/contents/whois/*.json');
  const worksFiles = import.meta.glob<{ default: ContentData }>('/src/assets/contents/works/*.json');
  const socialFiles = import.meta.glob<{ default: ContentData }>('/src/assets/contents/social_network/*.json');

  // Load whois content
  for (const path in whoisFiles) {
    const module = await whoisFiles[path]();
    const data = module.default;
    // Sanitize empty strings to undefined (treat like null)
    whois.push({
      ...data,
      image: data.image && data.image.trim() !== '' ? data.image : undefined,
      url_link: data.url_link && data.url_link.trim() !== '' ? data.url_link : undefined,
    });
  }

  // Load works content
  for (const path in worksFiles) {
    const module = await worksFiles[path]();
    const data = module.default;
    // Sanitize empty strings to undefined (treat like null)
    works.push({
      ...data,
      image: data.image && data.image.trim() !== '' ? data.image : undefined,
      url_link: data.url_link && data.url_link.trim() !== '' ? data.url_link : undefined,
    });
  }

  // Load social network content
  for (const path in socialFiles) {
    const module = await socialFiles[path]();
    const data = module.default;
    // Sanitize empty strings to undefined (treat like null)
    socialNetwork.push({
      ...data,
      image: data.image && data.image.trim() !== '' ? data.image : undefined,
      url_link: data.url_link && data.url_link.trim() !== '' ? data.url_link : undefined,
    });
  }

  return { whois, works, socialNetwork };
}

/**
 * Generate random offset within range
 */
function randomOffset(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/**
 * Calculate positions for content items WITH SIZE-AWARE GAPS
 * Computes content sizes FIRST, then positions items to prevent overlap
 * Returns both content items AND computed map bounds
 * 
 * Up: Whois (negative Y, random X offset)
 * Right: Works (positive X, random Y offset)
 * Left: Social (negative X, random Y offset)
 * Content starts beyond viewport dimensions (not visible initially)
 */
export function generateContentPositions(
  whois: ContentData[],
  works: ContentData[],
  socialNetwork: ContentData[],
  viewportWidth: number = 1920,
  viewportHeight: number = 1080
): { items: ContentItem[]; mapBounds: { x: number; y: number } } {
  const items: ContentItem[] = [];
  let id = 0;

  // Minimum spacing between content boxes (edge to edge)
  const minSpacing = 150;
  const viewportBuffer = 200;

  // ============ STEP 1: CALCULATE ALL SIZES FIRST ============
  const whoisWithSizes = whois.map(data => ({
    ...data,
    size: calculateContentSize(data)
  }));
  
  const worksWithSizes = works.map(data => ({
    ...data,
    size: calculateContentSize(data)
  }));
  
  const socialWithSizes = socialNetwork.map(data => ({
    ...data,
    size: calculateContentSize(data)
  }));

  // ============ STEP 2: COMPUTE TOTAL SIZE NEEDED ============
  
  // VERTICAL (Whois): Sum all heights + gaps
  let totalWhoisHeight = viewportHeight / 2 + viewportBuffer; // Start position
  whoisWithSizes.forEach((data, index) => {
    totalWhoisHeight += data.size.height / 2; // Half of current box
    if (index < whoisWithSizes.length - 1) {
      totalWhoisHeight += minSpacing + randomOffset(0, minSpacing); // Gap
      totalWhoisHeight += whoisWithSizes[index + 1].size.height / 2; // Half of next box
    } else {
      totalWhoisHeight += data.size.height / 2; // Last box's other half
    }
  });

  // HORIZONTAL (Works): Sum all widths + gaps
  let totalWorksWidth = viewportWidth / 2 + viewportBuffer; // Start position
  worksWithSizes.forEach((data, index) => {
    totalWorksWidth += data.size.width / 2; // Half of current box
    if (index < worksWithSizes.length - 1) {
      totalWorksWidth += minSpacing + randomOffset(0, minSpacing); // Gap
      totalWorksWidth += worksWithSizes[index + 1].size.width / 2; // Half of next box
    } else {
      totalWorksWidth += data.size.width / 2; // Last box's other half
    }
  });

  // HORIZONTAL (Social): Sum all widths + gaps
  let totalSocialWidth = viewportWidth / 2 + viewportBuffer; // Start position
  socialWithSizes.forEach((data, index) => {
    totalSocialWidth += data.size.width / 2; // Half of current box
    if (index < socialWithSizes.length - 1) {
      totalSocialWidth += minSpacing + randomOffset(0, minSpacing); // Gap
      totalSocialWidth += socialWithSizes[index + 1].size.width / 2; // Half of next box
    } else {
      totalSocialWidth += data.size.width / 2; // Last box's other half
    }
  });

  // ============ STEP 3: CALCULATE MAP BOUNDS FROM TOTALS ============
  const mapBounds = {
    x: Math.ceil(Math.max(totalWorksWidth, totalSocialWidth)),
    y: Math.ceil(totalWhoisHeight)
  };

  // ============ STEP 4: POSITION ITEMS ============
  const startDistanceY = viewportHeight / 2 + viewportBuffer;
  const startDistanceX = viewportWidth / 2 + viewportBuffer;

  // UP direction: Whois content (negative Y, random X offset)
  // Start position offset by first item's height so it's fully outside viewport
  let currentY = -startDistanceY - (whoisWithSizes[0]?.size.height / 2 || 0);
  whoisWithSizes.forEach((data, index) => {
    const xOffset = randomOffset(-150, 150);
    items.push({
      id: `whois-${id++}`,
      type: 'whois',
      position: { x: xOffset, y: currentY },
      data,
    });
    
    if (index < whoisWithSizes.length - 1) {
      const currentHalfHeight = data.size.height / 2;
      const nextHalfHeight = whoisWithSizes[index + 1].size.height / 2;
      const extraSpacing = randomOffset(0, minSpacing);
      currentY -= (currentHalfHeight + minSpacing + extraSpacing + nextHalfHeight);
    }
  });

  // RIGHT direction: Works content (positive X, random Y offset)
  // Start position offset by first item's width so it's fully outside viewport
  let currentX = startDistanceX + (worksWithSizes[0]?.size.width / 2 || 0);
  worksWithSizes.forEach((data, index) => {
    const yOffset = randomOffset(-150, 150);
    items.push({
      id: `works-${id++}`,
      type: 'works',
      position: { x: currentX, y: yOffset },
      data,
    });
    
    if (index < worksWithSizes.length - 1) {
      const currentHalfWidth = data.size.width / 2;
      const nextHalfWidth = worksWithSizes[index + 1].size.width / 2;
      const extraSpacing = randomOffset(0, minSpacing);
      currentX += (currentHalfWidth + minSpacing + extraSpacing + nextHalfWidth);
    }
  });

  // LEFT direction: Social Network content (negative X, random Y offset)
  // Start position offset by first item's width so it's fully outside viewport
  let currentNegX = -startDistanceX - (socialWithSizes[0]?.size.width / 2 || 0);
  socialWithSizes.forEach((data, index) => {
    const yOffset = randomOffset(-150, 150);
    items.push({
      id: `social-${id++}`,
      type: 'social_network',
      position: { x: currentNegX, y: yOffset },
      data,
    });
    
    if (index < socialWithSizes.length - 1) {
      const currentHalfWidth = data.size.width / 2;
      const nextHalfWidth = socialWithSizes[index + 1].size.width / 2;
      const extraSpacing = randomOffset(0, minSpacing);
      currentNegX -= (currentHalfWidth + minSpacing + extraSpacing + nextHalfWidth);
    }
  });

  return { items, mapBounds };
}

/**
 * Main function to load and position all content
 * Accepts viewport dimensions to position content beyond initial view
 * Returns content items and computed map bounds based on ACTUAL CONTENT SIZES
 */
export async function loadAllContent(
  viewportWidth?: number,
  viewportHeight?: number
): Promise<{ contentItems: ContentItem[]; mapBounds: { x: number; y: number } }> {
  const { whois, works, socialNetwork } = await loadContentData();
  const { items, mapBounds } = generateContentPositions(whois, works, socialNetwork, viewportWidth, viewportHeight);
  
  return { contentItems: items, mapBounds };
}
