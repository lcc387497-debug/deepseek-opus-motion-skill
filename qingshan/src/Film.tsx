// Film.tsx — persistent paper and ink. Scenes read absolute t and never remount the world.
import React from 'react';
import {AbsoluteFill, Audio, staticFile} from 'remotion';
import {Paper, useTime} from './lib/motion';
import {InkDefs} from './lib/film';
import {COLOR, FILM} from './spec';
import {Scene01} from './scenes/Scene01';
import {Scene02} from './scenes/Scene02';
import {Scene03} from './scenes/Scene03';
import {Scene04} from './scenes/Scene04';
import {Scene05} from './scenes/Scene05';

export const Film: React.FC = () => {
  const {t} = useTime();
  return (
    <AbsoluteFill style={{backgroundColor: COLOR.bg}}>
      <Paper color={COLOR.bg} grain={0.11} fibre={0.09} seed={2} />
      <svg width={FILM.width} height={FILM.height} viewBox={`0 0 ${FILM.width} ${FILM.height}`} style={{position: 'absolute', inset: 0}}>
        <InkDefs />
        <Scene01 t={t} />
        <Scene02 t={t} />
        <Scene03 t={t} />
        <Scene04 t={t} />
        <Scene05 t={t} />
      </svg>
      {FILM.sound && <Audio src={staticFile('score.wav')} />}
    </AbsoluteFill>
  );
};
