import { useApplication } from "@pixi/react";

export function useAppWithScaleConstant(props:{width?: number, height?: number} = {
  width: 1920,
  height:1080,
}) {
  const {app} = useApplication();
  const baseWidth = props.width || 1920;
  const baseHeight = props.height || 1080;
  return [
    app,
    (app?.renderer?.width ?? 1920) / baseWidth ,
    (app?.renderer?.height ?? 1080) / baseHeight,
    app?.renderer?.width ?? 1080, // get the width of the viewport
    app?.renderer?.height  ?? 1920, // get the height of the viewport
  ] as const;
}