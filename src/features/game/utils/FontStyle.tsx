import { TextStyle, type TextStyleOptions } from "pixi.js";

export function makeFontStyle(styles: TextStyleOptions){
  return new TextStyle({
    fontFamily: 'Jersey 10, sans-serif',
    fill: 0xf0f0f0,
    ...styles
  });
}

export function makeFontStyleSmall(styles: TextStyleOptions){
  return makeFontStyle({
    fontSize: 24,
    ...styles
  });
}

export function makeFontStyleMedium(styles: TextStyleOptions){
  return makeFontStyle({
    fontSize: 40,
    ...styles
  });
}

export function makeFontStyleLarge(styles: TextStyleOptions){
  return makeFontStyle({
    fontSize: 56,
    ...styles
  });
}

// Preset for content item headers
export function makeContentHeaderStyle(styles: TextStyleOptions){
  return makeFontStyle({
    fontSize: 80,
    fill: 0x333333,
    align: 'center',
    wordWrap: false,
    ...styles
  });
}

// Preset for content item body text
export function makeContentTextStyle(styles: TextStyleOptions){
  return makeFontStyle({
    fontSize: 32,
    fill: 0x555555,
    align: 'left',
    wordWrap: false,
    ...styles
  });
}