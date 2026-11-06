// S24 X03 X04 X05 — 4–8s. The near range gathers into a leaf, the vein is one stroke, the other two ranges thin into mist.
// Back to front: mist, leaf shade, leaf, vein.
import React from 'react';
import {Ranges} from '../lib/film';
import {T} from '../spec';

export const Scene02: React.FC<{t: number}> = ({t}) => {
  if (t < T.sceneLeaf || t >= T.sceneCup) return null;
  return <Ranges t={t} />;
};
