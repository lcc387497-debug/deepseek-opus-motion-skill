// S26 X09 X10 X11 — 12–16s. 青山 is written one character at a time. The seal stamps on beat 19 and the frame pauses.
// Back to front: mist and cup, title, seal, caption.
import React from 'react';
import {Caption, CupRig, Ranges, SealMark, TitleMark} from '../lib/film';
import {T} from '../spec';

export const Scene04: React.FC<{t: number}> = ({t}) => {
  if (t < T.sceneTitle || t >= T.sceneReturn) return null;
  return (
    <g>
      <Ranges t={t} />
      <CupRig t={t} />
      <TitleMark t={t} />
      <SealMark t={t} />
      <Caption t={t} />
    </g>
  );
};
