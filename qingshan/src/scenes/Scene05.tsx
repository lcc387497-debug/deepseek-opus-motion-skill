// S27 X12 X13 X14 — 16–20s. Ripples close, then the cup, the leaf and the title become ink and meet the drop.
// The drop rises to the resting pose so frame 20 matches frame 0.
// Back to front: mist, cup, leaf, title, seal, caption, the receiving drop.
import React from 'react';
import {Caption, CupRig, Ranges, ReturningDrop, SealMark, TitleMark} from '../lib/film';
import {T} from '../spec';

export const Scene05: React.FC<{t: number}> = ({t}) => {
  if (t < T.sceneReturn) return null;
  return (
    <g>
      <Ranges t={t} />
      <CupRig t={t} />
      <TitleMark t={t} />
      <SealMark t={t} />
      <Caption t={t} />
      <ReturningDrop t={t} />
    </g>
  );
};
