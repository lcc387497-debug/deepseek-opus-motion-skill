// S25 X06 X07 X08 — 8–12s. The leaf turns and falls into a cup drawn in one stroke. Three ripples leave the point of contact.
// Back to front: mist, tea, leaf, cup stroke, ripples.
import React from 'react';
import {CupRig, Ranges} from '../lib/film';
import {T} from '../spec';

export const Scene03: React.FC<{t: number}> = ({t}) => {
  if (t < T.sceneCup || t >= T.sceneTitle) return null;
  return (
    <g>
      <Ranges t={t} />
      <CupRig t={t} />
    </g>
  );
};
