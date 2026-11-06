// Builders for 青山. One geometry per element, 96 points, so every becoming is the same object changing shape.
// The Remotion starter and src/lib/motion.tsx are Copyright (c) 2026 阿宁Neo, MIT License. See ../../LICENSE.
import React from 'react';
import {
  EASE,
  InkFilter,
  Pt,
  chain,
  drawOn,
  mix,
  morphPts,
  prog,
  toPath,
} from './motion';
import {COLOR, COPY, FONT, INK, LAYOUT, T} from '../spec';

const RIDGE = 64;
const BASE = 32;

export const TARGET: Pt = [LAYOUT.dropLand.x, LAYOUT.dropLand.y];

// Upper 64 points run left → top → right. Lower 32 run right → bottom → left.
// A drop, a mountain, a leaf and a mist band share this order, so the morph does not twist.
export function blob(cx: number, cy: number, rx: number, ry: number): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i < RIDGE; i++) {
    const a = Math.PI + (i / (RIDGE - 1)) * Math.PI;
    pts.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
  }
  for (let i = 0; i < BASE; i++) {
    const a = (i / (BASE - 1)) * Math.PI;
    pts.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
  }
  return pts;
}

const sky = (peaks: {u: number; y: number}[], u: number) => {
  let i = 0;
  while (i < peaks.length - 1 && peaks[i + 1].u < u) i++;
  const a = peaks[i];
  const b = peaks[Math.min(i + 1, peaks.length - 1)];
  const f = b.u === a.u ? 0 : (u - a.u) / (b.u - a.u);
  const s = f * f * (3 - 2 * f);
  return a.y + (b.y - a.y) * s;
};

function range(x0: number, x1: number, base: number, peaks: {u: number; y: number}[], seed: number): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i < RIDGE; i++) {
    const u = i / (RIDGE - 1);
    const jag = Math.sin(u * 19 + seed) * 2.2 + Math.sin(u * 47 + seed * 1.7) * 1.1;
    pts.push([x0 + (x1 - x0) * u, sky(peaks, u) + jag]);
  }
  for (let i = 0; i < BASE; i++) {
    const u = i / (BASE - 1);
    pts.push([x1 + (x0 - x1) * u, base + Math.sin(u * Math.PI) * 16 + Math.sin(u * Math.PI * 3) * 5]);
  }
  return pts;
}

function band(x0: number, x1: number, y: number, h: number): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i < RIDGE; i++) {
    const u = i / (RIDGE - 1);
    pts.push([x0 + (x1 - x0) * u, y - h / 2 + Math.sin(u * Math.PI * 2) * 4]);
  }
  for (let i = 0; i < BASE; i++) {
    const u = i / (BASE - 1);
    pts.push([x1 + (x0 - x1) * u, y + h / 2]);
  }
  return pts;
}

function leafLocal(len: number, wid: number): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i < RIDGE; i++) {
    const u = i / (RIDGE - 1);
    const along = u <= 0.5 ? u * 2 : (1 - u) * 2; // 0 at the stem, 1 at the tip
    const side = u <= 0.5 ? -1 : 1;
    const belly = Math.sin(Math.PI * Math.pow(along, 0.68));
    const y = len * (0.5 - along);
    const x = side * wid * 0.5 * belly + Math.sin(along * Math.PI) * wid * 0.055;
    pts.push([x, y]);
  }
  for (let i = 0; i < BASE; i++) {
    const u = i / (BASE - 1);
    pts.push([(1 - 2 * u) * wid * 0.04, len * 0.5 + Math.sin(u * Math.PI) * 8]);
  }
  return pts;
}

function veinLocal(len: number, wid: number): Pt[] {
  const yAt = (a: number) => len * (0.5 - a);
  const xMid = (a: number) => Math.sin(a * Math.PI) * wid * 0.045;
  const pts: Pt[] = [];
  const mid = (a0: number, a1: number, n: number) => {
    for (let i = 1; i <= n; i++) {
      const a = a0 + ((a1 - a0) * i) / n;
      pts.push([xMid(a), yAt(a)]);
    }
  };
  pts.push([xMid(0.02), yAt(0.02)]);
  mid(0.02, 0.34, 7);
  const branch = (a: number, dir: number, reach: number) => {
    for (let i = 1; i <= 5; i++) {
      const f = i / 5;
      pts.push([xMid(a) + dir * f * wid * reach, yAt(a) - f * len * 0.03]);
    }
    for (let i = 4; i >= 0; i--) {
      const f = i / 5;
      pts.push([xMid(a) + dir * f * wid * reach, yAt(a) - f * len * 0.03 + 2.5]);
    }
  };
  branch(0.34, 1, 0.3);
  mid(0.34, 0.62, 7);
  branch(0.62, -1, 0.26);
  mid(0.62, 0.98, 8);
  return pts;
}

export function place(local: Pt[], cx: number, cy: number, deg: number, s: number): Pt[] {
  const a = (deg * Math.PI) / 180;
  const c = Math.cos(a);
  const sn = Math.sin(a);
  return local.map(([x, y]) => {
    const X = x * s;
    const Y = y * s;
    return [cx + X * c - Y * sn, cy + X * sn + Y * c];
  });
}

function shift(pts: Pt[], dx: number, dy: number): Pt[] {
  return pts.map(([x, y]) => [x + dx, y + dy]);
}

export function centroid(pts: Pt[]): Pt {
  let x = 0;
  let y = 0;
  for (const p of pts) {
    x += p[0];
    y += p[1];
  }
  return [x / pts.length, y / pts.length];
}

// Shrink into a droplet while the droplet travels to the target. Null once it has arrived.
export function pull(pts: Pt[], target: Pt, p: number): Pt[] | null {
  if (p >= 0.985) return null;
  const [cx, cy] = centroid(pts);
  const k = 1 - 0.94 * p;
  return pts.map(([x, y]) => [mix(cx, target[0], p) + (x - cx) * k, mix(cy, target[1], p) + (y - cy) * k]);
}

// Ambient clock. The stamp contact holds the mist still: 画面轻轻一顿. // S26
export function clock(t: number): number {
  if (t <= T.stampAt) return t;
  if (t < T.pauseEnd) return T.stampAt;
  return t - (T.pauseEnd - T.stampAt);
}

function driftOf(t: number, formedAt: number, speed: number, max: number): number {
  const u = Math.max(0, clock(Math.min(t, T.gatherMist)) - formedAt);
  return Math.min(max, u * speed);
}

const SETTLED = blob(LAYOUT.dropLand.x, LAYOUT.dropLand.y, LAYOUT.dropLand.r, LAYOUT.dropLand.r);

const FAR = range(LAYOUT.far.x0, LAYOUT.far.x1, LAYOUT.far.base, [
  {u: 0, y: 678}, {u: 0.16, y: 588}, {u: 0.34, y: 636}, {u: 0.52, y: 498}, {u: 0.7, y: 572}, {u: 0.86, y: 628}, {u: 1, y: 688},
], 1.2);
const MID = range(LAYOUT.mid.x0, LAYOUT.mid.x1, LAYOUT.mid.base, [
  {u: 0, y: 742}, {u: 0.14, y: 590}, {u: 0.3, y: 448}, {u: 0.48, y: 524}, {u: 0.66, y: 368}, {u: 0.84, y: 496}, {u: 1, y: 724},
], 2.4);
const NEAR = (() => {
  const pts = range(LAYOUT.near.x0, LAYOUT.near.x1, LAYOUT.near.base, [
    {u: 0, y: 812}, {u: 0.12, y: 616}, {u: 0.28, y: 444}, {u: 0.46, y: 508}, {u: 0.64, y: 302}, {u: 0.8, y: 430}, {u: 0.92, y: 560}, {u: 1, y: 798},
  ], 3.6);
  // A dry gap in the front ridge, so the silhouette is a brush and not a smooth hill. // S14
  pts[48][1] += 28;
  pts[47][1] += 12;
  pts[49][1] += 10;
  return pts;
})();

const FAR_BAND = band(LAYOUT.farBand.x0, LAYOUT.farBand.x1, LAYOUT.farBand.y, LAYOUT.farBand.h);
const MID_BAND = band(LAYOUT.midBand.x0, LAYOUT.midBand.x1, LAYOUT.midBand.y, LAYOUT.midBand.h);

const LEAF_LOCAL = leafLocal(LAYOUT.leafHome.len, LAYOUT.leafHome.wid);
const VEIN_LOCAL = veinLocal(LAYOUT.leafHome.len, LAYOUT.leafHome.wid);
const LEAF_HOME = place(LEAF_LOCAL, LAYOUT.leafHome.x, LAYOUT.leafHome.y, LAYOUT.leafHome.rot, 1);
const LEAF_CUP = place(LEAF_LOCAL, LAYOUT.leafCup.x, LAYOUT.leafCup.y, LAYOUT.leafCup.rot, LAYOUT.leafCup.s);
const VEIN_HOME = place(VEIN_LOCAL, LAYOUT.leafHome.x, LAYOUT.leafHome.y, LAYOUT.leafHome.rot, 1);
const VEIN_CUP = place(VEIN_LOCAL, LAYOUT.leafCup.x, LAYOUT.leafCup.y, LAYOUT.leafCup.rot, LAYOUT.leafCup.s);

// One closed pen path: rim ellipse, then the wall and the foot, back to the lip. // E06 S25
export function cupPoints(): Pt[] {
  const {x, y, rx, ry, footL, footR, footY} = LAYOUT.cup;
  const pts: Pt[] = [];
  for (let i = 0; i < 24; i++) {
    const a = Math.PI + (i / 23) * Math.PI; // back rim, left to right over the top
    pts.push([x + rx * Math.cos(a), y + ry * Math.sin(a)]);
  }
  for (let i = 0; i < 16; i++) {
    const a = Math.PI - (i / 15) * Math.PI; // front rim, right to left
    pts.push([x + rx * Math.cos(a), y + ry * Math.sin(a)]);
  }
  for (let i = 0; i < 24; i++) {
    const u = i / 23; // left wall down into the foot
    const wall = Math.sin(u * Math.PI);
    pts.push([mix(x - rx, footL, u) - wall * 10, mix(y, footY, u)]);
  }
  for (let i = 0; i < 16; i++) {
    const u = i / 15; // foot, then right wall back to the lip
    if (u < 0.45) {
      const f = u / 0.45;
      pts.push([mix(footL, footR, f), footY + Math.sin(f * Math.PI) * 8]);
    } else {
      const f = (u - 0.45) / 0.55;
      const wall = Math.sin(f * Math.PI);
      pts.push([mix(footR, x + rx, f) + wall * 12, mix(footY, y, f)]);
    }
  }
  return pts;
}

const CUP = cupPoints();
export const CUP_PATH = toPath(CUP, true);

// Simple outer silhouette (no retraced rim) so the gather fill is one solid cup, not a self-crossing pen path.
function cupSilhouette(): Pt[] {
  const {x, y, rx, ry, footL, footR, footY} = LAYOUT.cup;
  const pts: Pt[] = [];
  for (let i = 0; i < 28; i++) {
    const a = Math.PI + (i / 27) * Math.PI;
    pts.push([x + rx * Math.cos(a), y + ry * Math.sin(a)]);
  }
  for (let i = 0; i < 36; i++) {
    const u = i / 35;
    const wall = Math.sin(u * Math.PI);
    pts.push([mix(x + rx, footR, u) + wall * 14, mix(y, footY, u)]);
  }
  for (let i = 0; i < 12; i++) {
    const u = i / 11;
    pts.push([mix(footR, footL, u), footY + Math.sin(u * Math.PI) * 9]);
  }
  for (let i = 0; i < 20; i++) {
    const u = i / 19;
    const wall = Math.sin(u * Math.PI);
    pts.push([mix(footL, x - rx, u) - wall * 12, mix(footY, y, u)]);
  }
  return pts;
}

const CUP_SOLID = cupSilhouette();

export function dropShape(t: number): Pt[] {
  const R = LAYOUT.dropRest;
  const L = LAYOUT.dropLand;
  if (t < T.restEnd || t >= T.riseAt) return blob(R.x, R.y, R.r, R.r);
  if (t < T.airEnd) {
    const p = prog(t, T.restEnd, T.airEnd - T.restEnd, EASE.in);
    return blob(R.x, mix(R.y, 528, p), mix(R.r, 14, p), mix(R.r, 26, p));
  }
  if (t < T.land) {
    const p = prog(t, T.airEnd, T.land - T.airEnd, EASE.out);
    return blob(R.x, mix(528, 556, p), mix(14, 32, p), mix(26, 11, p));
  }
  if (t < T.settled) {
    const p = prog(t, T.land, T.settled - T.land, EASE.out);
    return blob(L.x, mix(556, L.y, p), mix(32, L.r, p), mix(11, L.r, p));
  }
  if (t < T.riseStart) return blob(L.x, L.y, L.r, L.r);
  const p = prog(t, T.riseStart, T.riseAt - T.riseStart, EASE.inOut);
  return blob(mix(L.x, R.x, p), mix(L.y, R.y, p), mix(L.r, R.r, p), mix(L.r, R.r, p));
}

export function farState(t: number): {pts: Pt[]; opacity: number} | null {
  if (t < T.farStart || t >= T.gatherMistAt) return null;
  let pts = chain(t, [
    {at: 0, dur: 0, pts: SETTLED},
    {at: T.farAt, dur: T.farAt - T.farStart, pts: FAR, ease: EASE.out},
    {at: T.mistFarAt, dur: T.mistFarAt - T.mistFarStart, pts: FAR_BAND, ease: EASE.smooth},
  ]);
  const mistP = prog(t, T.mistFarStart, T.mistFarAt - T.mistFarStart, EASE.smooth);
  const opacity = mix(INK.far, INK.mist, mistP);
  pts = shift(pts, driftOf(t, T.mistFarAt, 26, 220), 0);
  if (t >= T.gatherMist) {
    const pulled = pull(pts, TARGET, prog(t, T.gatherMist, T.gatherMistAt - T.gatherMist, EASE.in));
    return pulled ? {pts: pulled, opacity} : null;
  }
  return {pts, opacity};
}

export function midState(t: number): {pts: Pt[]; opacity: number} | null {
  if (t < T.midStart || t >= T.gatherMistAt) return null;
  let pts = chain(t, [
    {at: 0, dur: 0, pts: SETTLED},
    {at: T.midAt, dur: T.midAt - T.midStart, pts: MID, ease: EASE.out},
    {at: T.mistMidAt, dur: T.mistMidAt - T.mistMidStart, pts: MID_BAND, ease: EASE.smooth},
  ]);
  const mistP = prog(t, T.mistMidStart, T.mistMidAt - T.mistMidStart, EASE.smooth);
  const opacity = mix(INK.mid, INK.mist, mistP);
  pts = shift(pts, driftOf(t, T.mistMidAt, 30, 160), 0);
  if (t >= T.gatherMist) {
    const pulled = pull(pts, TARGET, prog(t, T.gatherMist, T.gatherMistAt - T.gatherMist, EASE.in));
    return pulled ? {pts: pulled, opacity} : null;
  }
  return {pts, opacity};
}

export function nearState(t: number): Pt[] | null {
  if (t < T.nearStart || t >= T.gatherLeafAt) return null;
  const pts = chain(t, [
    {at: 0, dur: 0, pts: SETTLED},
    {at: T.nearAt, dur: T.nearAt - T.nearStart, pts: NEAR, ease: EASE.out},
    {at: T.leafAt, dur: T.leafAt - T.leafStart, pts: LEAF_HOME, ease: EASE.smooth},
    {at: T.fallAt, dur: T.fallAt - T.fallStart, pts: LEAF_CUP, ease: EASE.inOut},
  ]);
  if (t < T.gatherLeaf) return pts;
  return pull(pts, TARGET, prog(t, T.gatherLeaf, T.gatherLeafAt - T.gatherLeaf, EASE.in));
}

export function veinState(t: number): {d: string; p: number} | null {
  if (t < T.veinStart || t >= T.gatherLeafAt) return null;
  let pts = VEIN_HOME;
  if (t >= T.fallStart) pts = morphPts(VEIN_HOME, VEIN_CUP, prog(t, T.fallStart, T.fallAt - T.fallStart, EASE.inOut));
  if (t >= T.gatherLeaf) {
    const pulled = pull(pts, TARGET, prog(t, T.gatherLeaf, T.gatherLeafAt - T.gatherLeaf, EASE.in));
    if (!pulled) return null;
    pts = pulled;
  }
  return {d: toPath(pts, false), p: prog(t, T.veinStart, T.veinAt - T.veinStart, EASE.out)};
}

// Hollow pen until the gather beat, then the same points flood solid and pull into the drop. // X13 E06
export function cupState(t: number): {pts: Pt[]; draw: number; filled: boolean} | null {
  if (t < T.cupStart || t >= T.gatherCupAt) return null;
  const draw = prog(t, T.cupStart, T.cupAt - T.cupStart, EASE.out);
  if (draw <= 0.01) return null;
  if (t < T.gatherCup) return {pts: CUP, draw, filled: false};
  const pulled = pull(CUP_SOLID, TARGET, prog(t, T.gatherCup, T.gatherCupAt - T.gatherCup, EASE.in));
  return pulled ? {pts: pulled, draw: 1, filled: true} : null;
}

export function teaOpen(t: number): number {
  if (t < T.teaStart || t >= T.gatherCup) return 0;
  return prog(t, T.teaStart, T.teaAt - T.teaStart, EASE.out);
}

export type Ring = {rx: number; ry: number; opacity: number};

export function rings(t: number): Ring[] {
  const spec = [
    {start: T.rip0, rx: 48, ry: 12, opacity: 0.62},
    {start: T.rip1, rx: 92, ry: 22, opacity: 0.46},
    {start: T.rip2, rx: 132, ry: 30, opacity: 0.32},
  ];
  const out: Ring[] = [];
  for (const r of spec) {
    if (t < r.start) continue;
    let k = prog(t, r.start, T.ripDur, EASE.out);
    if (t >= T.gatherRip) {
      const back = prog(t, T.gatherRip + (r.start - T.rip0) * 0.28, 0.48, EASE.in);
      k *= 1 - back;
    }
    if (k > 0.02) out.push({rx: r.rx * k, ry: r.ry * k, opacity: r.opacity});
  }
  return out;
}

export type MistStroke = {d: string; p: number; opacity: number};

// Extra dry strokes born as the far and mid ranges thin. They drift right, then pull back. // E05 S24
export function mistStrokes(t: number): MistStroke[] {
  if (t < T.mistFarStart || t >= T.gatherMistAt) return [];
  const spec = [
    {y: 492, x0: 260, x1: 900, start: T.mistFarStart, at: T.mistFarAt, speed: 28, max: 200, opacity: 0.12, amp: 5},
    {y: 556, x0: 340, x1: 940, start: T.mistFarStart + 0.28, at: T.mistFarAt + 0.35, speed: 22, max: 170, opacity: 0.1, amp: 4},
    {y: 600, x0: 500, x1: 980, start: T.mistMidStart, at: T.mistMidAt, speed: 32, max: 150, opacity: 0.12, amp: 6},
  ];
  const out: MistStroke[] = [];
  const gp = prog(t, T.gatherMist, T.gatherMistAt - T.gatherMist, EASE.in);
  for (const s of spec) {
    const p = prog(t, s.start, Math.max(0.2, s.at - s.start), EASE.out);
    if (p <= 0) continue;
    const dx = driftOf(t, s.at, s.speed, s.max);
    let pts: Pt[] = Array.from({length: 14}, (_, i) => {
      const u = i / 13;
      return [s.x0 + (s.x1 - s.x0) * u + dx, s.y + Math.sin(u * Math.PI * 2) * s.amp] as Pt;
    });
    if (t >= T.gatherMist) {
      const pulled = pull(pts, TARGET, gp);
      if (!pulled) continue;
      pts = pulled;
    }
    out.push({d: toPath(pts, false), p: t >= T.gatherMist ? 1 : p, opacity: s.opacity});
  }
  return out;
}

export function arrived(t: number): number {
  const parts = [
    prog(t, T.gatherMist, T.gatherMistAt - T.gatherMist, EASE.in),
    prog(t, T.gatherCup, T.gatherCupAt - T.gatherCup, EASE.in),
    prog(t, T.gatherLeaf, T.gatherLeafAt - T.gatherLeaf, EASE.in),
    prog(t, T.gatherQing, T.gatherQingAt - T.gatherQing, EASE.in),
    prog(t, T.gatherShan, T.gatherShanAt - T.gatherShan, EASE.in),
    prog(t, T.gatherSeal, T.gatherSealAt - T.gatherSeal, EASE.in),
    prog(t, T.gatherSub, T.gatherSubAt - T.gatherSub, EASE.in),
  ];
  return parts.reduce((s, p) => s + p, 0) / parts.length;
}

export function fly(p: number, x: number, y: number): string {
  const cx = mix(x, TARGET[0], p);
  const cy = mix(y, TARGET[1], p);
  const s = Math.max(0.05, 1 - 0.95 * p);
  return `translate(${cx} ${cy}) scale(${s}) translate(${-x} ${-y})`;
}

export const subChars = (() => {
  const size = LAYOUT.sub.size;
  const tracking = size * 0.1; // S16 字距 0.1 em
  const widthOf = (ch: string) => (ch === ' ' ? size * 0.33 : ch === '·' ? size * 0.52 : size);
  let x = 0;
  return [...COPY.sub].map((ch) => {
    const w = widthOf(ch);
    const item = {ch, x, w};
    x += w + tracking;
    return item;
  });
})();

export const InkDefs: React.FC = () => (
  <defs>
    <InkFilter id="ink-drop" edge={5.5} freq={0.05} grain={0.42} seed={3} />
    <InkFilter id="ink-far" edge={15} freq={0.012} grain={0.32} seed={4} />
    <InkFilter id="ink-mid" edge={12} freq={0.015} grain={0.28} seed={5} />
    <InkFilter id="ink-near" edge={9} freq={0.02} grain={0.26} seed={6} />
    <InkFilter id="ink-vein" edge={1.3} freq={0.06} grain={0.12} seed={8} />
    <InkFilter id="ink-cup" edge={3.4} freq={0.04} grain={0.22} seed={10} />
    <InkFilter id="ink-tea" edge={3.6} freq={0.03} grain={0.34} seed={11} />
    <InkFilter id="ink-rip" edge={2.2} freq={0.05} grain={0.28} seed={12} />
    <InkFilter id="ink-title" edge={1.15} freq={0.045} grain={0.08} seed={13} />
    <InkFilter id="ink-seal" edge={2.6} freq={0.05} grain={0.2} seed={14} />
    <InkFilter id="ink-sub" edge={0.7} freq={0.06} grain={0.06} seed={15} />
  </defs>
);

export const Wash: React.FC<{pts: Pt[]; opacity: number; filter: string}> = ({pts, opacity, filter}) => (
  <path d={toPath(pts)} fill={COLOR.ink} fillOpacity={opacity} filter={`url(#${filter})`} />
);

export const Brush: React.FC<{d: string; p: number; width: number; opacity?: number; filter: string; color?: string}> = ({d, p, width, opacity = 1, filter, color = COLOR.ink}) => {
  if (p <= 0.015) return null;
  return (
    <path d={d} fill="none" stroke={color} strokeOpacity={opacity} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" filter={`url(#${filter})`} {...drawOn(d, Math.min(1, p))} />
  );
};

const oval = (cx: number, cy: number, rx: number, ry: number) =>
  `M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx - rx} ${cy}`;

export const OpeningDrop: React.FC<{t: number}> = ({t}) => {
  if (t >= T.nearStart) return null;
  return <Wash pts={dropShape(t)} opacity={INK.drop} filter="ink-drop" />;
};

export const ReturningDrop: React.FC<{t: number}> = ({t}) => {
  if (t < T.gatherMist) return null;
  if (t >= T.riseStart) return <Wash pts={dropShape(t)} opacity={INK.drop} filter="ink-drop" />;
  const a = arrived(t);
  if (a <= 0.02) return null;
  const r = mix(5, LAYOUT.dropLand.r, Math.min(1, a / 0.85));
  return <Wash pts={blob(TARGET[0], TARGET[1], r, r)} opacity={INK.drop} filter="ink-drop" />;
};

export const Ranges: React.FC<{t: number}> = ({t}) => {
  const far = farState(t);
  const mid = midState(t);
  const near = nearState(t);
  const vein = veinState(t);
  return (
    <g>
      {far && <Wash pts={far.pts} opacity={far.opacity} filter="ink-far" />}
      {mid && <Wash pts={mid.pts} opacity={mid.opacity} filter="ink-mid" />}
      {mistStrokes(t).map((s, i) => <Brush key={i} d={s.d} p={s.p} width={11} opacity={s.opacity} filter="ink-far" />)}
      {near && <Wash pts={near} opacity={INK.near} filter="ink-near" />}
      {vein && <Brush d={vein.d} p={vein.p} width={3.1} opacity={0.92} filter="ink-vein" color={COLOR.bg} />}
    </g>
  );
};

export const CupRig: React.FC<{t: number}> = ({t}) => {
  const cup = cupState(t);
  const tea = teaOpen(t);
  const rs = rings(t);
  if (!cup && tea <= 0 && rs.length === 0) return null;
  const {x, y} = LAYOUT.cup;
  return (
    <g>
      {tea > 0 && <ellipse cx={x + 8} cy={y + 8} rx={138 * tea} ry={24 * tea} fill={COLOR.ink} fillOpacity={INK.tea} filter="url(#ink-tea)" />}
      {cup && !cup.filled && <Brush d={toPath(cup.pts)} p={cup.draw} width={11} filter="ink-cup" />}
      {cup && cup.filled && <Wash pts={cup.pts} opacity={0.9} filter="ink-cup" />}
      {rs.map((r, i) => (
        <path key={i} d={oval(x, y + 4, r.rx, r.ry)} fill="none" stroke={COLOR.ink} strokeOpacity={r.opacity} strokeWidth={4.2} strokeLinecap="round" filter="url(#ink-rip)" />
      ))}
    </g>
  );
};

const Glyph: React.FC<{ch: string; x: number; y: number; start: number; g0: number; g1: number; t: number}> = ({ch, x, y, start, g0, g1, t}) => {
  const write = prog(t, start, T.writeDur, EASE.out);
  if (write <= 0 || t >= g1) return null;
  const p = t >= g0 ? prog(t, g0, g1 - g0, EASE.in) : 0;
  if (p >= 0.985) return null;
  const size = LAYOUT.title.size;
  const shown = p > 0 ? 1 : write;
  const id = `gly-${ch}`;
  return (
    <g transform={p > 0 ? fly(p, x, y - size * 0.42) : undefined} filter="url(#ink-title)">
      <clipPath id={id}>
        <rect x={x - size * 0.72} y={y - size * 1.05} width={size * 1.44} height={size * 1.2 * shown} />
      </clipPath>
      <text clipPath={`url(#${id})`} x={x} y={y} textAnchor="middle" fontFamily={FONT.serif} fontSize={size} fontWeight={900} fill={COLOR.ink}>{ch}</text>
    </g>
  );
};

export const TitleMark: React.FC<{t: number}> = ({t}) => {
  if (t < T.qingStart) return null;
  return (
    <g>
      <Glyph ch="青" x={LAYOUT.title.x} y={LAYOUT.title.qing} start={T.qingStart} g0={T.gatherQing} g1={T.gatherQingAt} t={t} />
      <Glyph ch="山" x={LAYOUT.title.x} y={LAYOUT.title.shan} start={T.shanStart} g0={T.gatherShan} g1={T.gatherShanAt} t={t} />
    </g>
  );
};

export const SealMark: React.FC<{t: number}> = ({t}) => {
  if (t < T.stampStart || t >= T.gatherSealAt) return null;
  const press = prog(t, T.stampStart, T.stampAt - T.stampStart, EASE.in);
  if (press <= 0) return null;
  const {x, y, s} = LAYOUT.seal;
  const cx = x + s / 2;
  const cy = y + s / 2;
  const gp = t >= T.gatherSeal ? prog(t, T.gatherSeal, T.gatherSealAt - T.gatherSeal, EASE.in) : 0;
  if (gp >= 0.985) return null;
  const lift = (1 - press) * 36;
  const sc = 1 + (1 - press) * 0.16;
  const inked = gp > 0.05;
  return (
    <g transform={gp > 0 ? fly(gp, cx, cy) : undefined}>
      <g transform={`translate(${cx} ${cy - lift}) scale(${sc}) translate(${-cx} ${-cy})`} filter="url(#ink-seal)">
        <rect x={x} y={y} width={s} height={s} rx={4} fill={inked ? COLOR.ink : COLOR.seal} />
        {!inked && (
          <>
            <text x={cx} y={cy - 4} textAnchor="middle" fontFamily={FONT.serif} fontSize={46} fontWeight={900} fill={COLOR.bg}>青</text>
            <text x={cx} y={cy + 48} textAnchor="middle" fontFamily={FONT.serif} fontSize={46} fontWeight={900} fill={COLOR.bg}>山</text>
          </>
        )}
      </g>
    </g>
  );
};

export const Caption: React.FC<{t: number}> = ({t}) => {
  if (t < T.subStart || t >= T.gatherSubAt) return null;
  const gp = t >= T.gatherSub ? prog(t, T.gatherSub, T.gatherSubAt - T.gatherSub, EASE.in) : 0;
  if (gp >= 0.985) return null;
  const anchorX = LAYOUT.sub.x + 130;
  return (
    <g transform={gp > 0 ? fly(gp, anchorX, LAYOUT.sub.y) : undefined} filter="url(#ink-sub)">
      {subChars.map((item, i) => {
        const p = prog(t, T.subStart + i * T.subStagger, T.subDur, EASE.out);
        if (p <= 0) return null;
        const x = LAYOUT.sub.x + item.x;
        const id = `sub-${i}`;
        return (
          <g key={i}>
            <clipPath id={id}>
              <rect x={x - 1} y={LAYOUT.sub.y - LAYOUT.sub.size} width={(item.w + 2) * (gp > 0 ? 1 : p)} height={LAYOUT.sub.size * 1.5} />
            </clipPath>
            <text clipPath={`url(#${id})`} x={x} y={LAYOUT.sub.y} fontFamily={FONT.sans} fontSize={LAYOUT.sub.size} fontWeight={400} fill={COLOR.ink}>{item.ch}</text>
          </g>
        );
      })}
    </g>
  );
};
