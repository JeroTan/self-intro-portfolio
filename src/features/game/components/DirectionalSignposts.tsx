import { useGameContext } from '../context/GameContext';
import { useMemo } from 'react';
import type { AssetDictionary } from '../utils/AssetLoader';
import type { Graphics as GraphicsType } from 'pixi.js';
import { makeContentHeaderStyle } from '../utils/FontStyle';
import { JET_SIZE } from '../utils/Scale';
import { Text } from 'pixi.js';

interface DirectionalSignpostsProps {
  assets: AssetDictionary;
}

/**
 * Renders directional signposts in the game world
 * Shows "Who am I?" (top), "Portfolio" (right), "Socials" (left)
 */
export default function DirectionalSignposts({ assets }: DirectionalSignpostsProps) {
  const { state } = useGameContext();
  const { contentItems } = state;

  // Calculate signpost positions mathematically from origin (0,0)
  const signposts = useMemo(() => {
    if (contentItems.length === 0) return [];

    // Jet is at origin (0, 0)
    const jetRadius = JET_SIZE / 2; // 40px
    const signpostGap = 400; // Keep signposts visible within viewport
    const signpostDistance = jetRadius + signpostGap; // Total distance from center
    
    const whoisItems = contentItems.filter(item => item.type === 'whois');
    const worksItems = contentItems.filter(item => item.type === 'works');
    const socialItems = contentItems.filter(item => item.type === 'social_network');

    const posts = [];

    // Top signpost - "Who am I?" (above jet, negative Y)
    if (whoisItems.length > 0) {
      posts.push({
        x: 0,
        y: -signpostDistance,
        text: '↑ Who am I?',
        color: 0x3b82f6, // blue
      });
    }

    // Right signpost - "Portfolio" (right of jet, positive X)
    if (worksItems.length > 0) {
      posts.push({
        x: signpostDistance,
        y: 0,
        text: 'Portfolio →',
        color: 0xa855f7, // purple
      });
    }

    // Left signpost - "Socials" (left of jet, negative X)
    if (socialItems.length > 0) {
      posts.push({
        x: -signpostDistance,
        y: 0,
        text: '← Socials',
        color: 0x10b981, // green
      });
    }

    return posts;
  }, [contentItems]);

  const signpostStyle = useMemo(() => makeContentHeaderStyle({
    wordWrap: false, // Prevent text wrapping - expand horizontally only
    align: 'center',
  }), []);

  // Don't render if no signposts
  if (signposts.length === 0) {
    return null;
  }

  return (
    <pixiContainer>
      {signposts.map((signpost, idx) => {
        // Measure text to calculate dynamic size
        const textObj = new Text({ text: signpost.text, style: signpostStyle });
        const textWidth = textObj.width;
        const textHeight = textObj.height;
        textObj.destroy();
        
        // Horizontal padding larger than vertical for rectangle look
        const horizontalPadding = 60;
        const verticalPadding = 20;
        const width = textWidth + horizontalPadding * 2;
        const height = textHeight + verticalPadding * 2;
        const borderRadius = 10;
        
        return (
          <pixiContainer key={idx} x={signpost.x} y={signpost.y}>
            {/* Background rectangle */}
            <pixiGraphics
              draw={(g: GraphicsType) => {
                g.clear();
                
                // Rounded rectangle background
                g.roundRect(-width / 2, -height / 2, width, height, borderRadius);
                g.fill({ color: signpost.color, alpha: 0.95 });
                
                // White border
                g.roundRect(-width / 2, -height / 2, width, height, borderRadius);
                g.stroke({ color: 0xffffff, width: 4, alpha: 1 });
              }}
            />
            
            {/* Text label */}
            <pixiText
              text={signpost.text}
              anchor={{ x: 0.5, y: 0.5 }}
              style={signpostStyle}
            />
          </pixiContainer>
        );
      })}
    </pixiContainer>
  );
}
