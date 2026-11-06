// S23 X01 X02 — 0–4s. A drop falls on the centre axis and spreads, left to right, into three ranges.
// Back to front: far wash, mid wash, the drop, then the near range once it takes the drop's place.
import React from 'react';
import {OpeningDrop, Ranges} from '../lib/film';
import {T} from '../spec';

export const Scene01: React.FC<{t: number}> = ({t}) => {
  if (t >= T.sceneLeaf) return null;
  return (
    <g>
      <Ranges t={t} />
      <OpeningDrop t={t} />
    </g>
  );
};
