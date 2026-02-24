
import {
  Application,
  extend,
} from '@pixi/react';

import {
    Container,
    Graphics,
    Sprite,
    TextStyle,
    Text,
} from 'pixi.js';
import { useRef } from 'react';

extend({
  Container,
  Graphics,
  Sprite,
  Text,
  TextStyle
});
import type { PropsWithChildren } from "react";


export function PixiJSWrapper({children}:PropsWithChildren<{}>){
  const wrapperRef = useRef(null);
  return <>
    <div ref={wrapperRef} className='size-full'>
      <Application
        resizeTo={wrapperRef}
        background={"0x28282B"}
        antialias={false}
      >
        {children}
      </Application>
    </div>
  </>
}