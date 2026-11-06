// Design contract — 青山
// Style source: the prompt states 水墨, the palette, the type and the bans. editorial-ink only supplies mechanisms
// (brush filters, mist as dry strokes, seal stamp, pentatonic ink score). It does not override a stated value.
// Palette: paper #F3EEE3, ink #1A1814 at opacity, seal #B8322A. No tea-ochre: the prompt allows one red only.
// Type: Noto Serif SC 900, vertical, for 青山. Noto Sans SC 400, 25px, tracking 0.1em, for the small line.
//   Subsets are the exact CJK chunks that contain those glyphs. Omitting subsets loads all 98 chunks and times out.
// Marks: filled silhouettes and one-stroke pens through InkFilter. No gradient, no blur glow, no smooth bare stroke.
// Texture: Paper grain + fibre, separate from each ink filter. Filters are seeded and do not boil, so the loop matches.
// Composition: locked camera. Resting marks stay ≥150px from the sides and ≥90px from the top and bottom.
//   Title column on the right. Seal at the title's lower left. Subject spreads across the safe area, because the
//   prompt asks the mountains to lay out left to right; that wins over the seed's 60% width.
// Motion: 80 BPM, EASE.out for spreads, EASE.smooth for gathers, EASE.in for the fall and the stamp. No bounce.
//   Reading holds are allowed. The stamp contact freezes ambient drift for a quarter-second.
// Transitions: chain() / morphPts(). The source shape is gone when the target is formed. No crossfade, no scene fade.
// Loop: frame 0 and the last frame are one resting drop at (960, 420). It falls to (960, 540) after t = 0
//   and is back in that same resting pose before the end, so both frames are still and identical.
// Sound: palette ink. Pad on D2, pentatonic pluck, drop, knock, scratch.
// Bans: gradients, glow, particles, camera shake, fades, smooth vector edges, emoji, any red except the seal.

import {loadFont as loadSerif} from '@remotion/google-fonts/NotoSerifSC';
import {loadFont as loadSans} from '@remotion/google-fonts/NotoSansSC';

// The published subset union only names "chinese-simplified", which expands to all 98 chunks and stalls the render.
// These casts pass the exact chunks that contain the on-screen glyphs. Runtime resolves a chunk key as itself.
// 青 U+9752 and 山 U+5C71 are in [116]. Weight 900 is the heaviest cut. // S15 S26
const serif = loadSerif('normal', {weights: ['900'], subsets: ['[116]'] as unknown as ['chinese-simplified']});
// 一 [119] 叶 [113] 山 [116] 盏 [100] · and the space [119]. // S16 S26
const sans = loadSans('normal', {weights: ['400'], subsets: ['[100]', '[113]', '[116]', '[119]'] as unknown as ['chinese-simplified']});

export const FILM = {duration: 20, fps: 60, width: 1920, height: 1080, bpm: 80, sound: true}; // S01 S17 S20
export const SAFE = {x: 150, y: 90}; // S19
export const FONT = {serif: serif.fontFamily, sans: sans.fontFamily}; // S15 S16
export const COLOR = {bg: '#F3EEE3', ink: '#1A1814', seal: '#B8322A'}; // S10 S11 S12
export const INK = {drop: 0.93, far: 0.16, mid: 0.4, near: 0.93, mist: 0.13, tea: 0.22, vein: 0.88}; // S11 S23
export const COPY = {title: '青山', seal: '青山', sub: '一叶 · 一山 · 一盏'}; // S02 S26

// Key times in seconds. Scene edges are the storyboard. Inner hits sit on 80 BPM beats (0.75s) wherever the scene allows.
export const T = {
  restEnd: 0.12,
  airEnd: 0.62,
  land: 0.75, // beat 1 — drop meets the paper
  settled: 1.05,
  farStart: 1.2,
  farAt: 2.25, // beat 3
  midStart: 1.8,
  midAt: 3.0, // beat 4
  nearStart: 2.4,
  nearAt: 3.75, // beat 5 — three ranges complete before 4.00
  sceneLeaf: 4,
  leafStart: 4.2,
  leafAt: 6.75, // beat 9
  veinStart: 6.75,
  veinAt: 7.8,
  mistFarStart: 4.35,
  mistFarAt: 6.9,
  mistMidStart: 4.65,
  mistMidAt: 7.2,
  sceneCup: 8,
  fallStart: 8.25, // beat 11
  fallAt: 10.5, // beat 14
  cupStart: 8.25,
  cupAt: 9.75,
  teaStart: 9.45,
  teaAt: 10.35,
  rip0: 10.5,
  rip1: 11.25, // beat 15
  rip2: 12, // beat 16
  ripDur: 0.85,
  sceneTitle: 12,
  qingStart: 12.15,
  shanStart: 13.05, // just after 青 finishes, still one character at a time
  writeDur: 0.58,
  stampStart: 13.92,
  stampAt: 14.25, // beat 19 — contact
  pauseEnd: 14.52,
  subStart: 15, // beat 20
  subStagger: 0.048,
  subDur: 0.26,
  sceneReturn: 16,
  gatherRip: 16,
  gatherMist: 16.15,
  gatherMistAt: 17.25, // beat 23
  gatherCup: 17.05, // ripples have closed before the cup becomes ink
  gatherCupAt: 17.9,
  gatherLeaf: 17.25,
  gatherLeafAt: 18.35,
  gatherQing: 18,
  gatherQingAt: 18.85,
  gatherShan: 18.15,
  gatherShanAt: 19,
  gatherSeal: 18.3,
  gatherSealAt: 19.05,
  gatherSub: 18.4,
  gatherSubAt: 19.1,
  riseStart: 19.12,
  riseAt: 19.72,
};

export const LAYOUT = {
  dropRest: {x: 960, y: 420, r: 17}, // loop pose, on the centre axis, held above the paper so the fall can happen
  dropLand: {x: 960, y: 540, r: 18}, // 画面正中
  far: {x0: 200, x1: 1040, base: 700},
  mid: {x0: 430, x1: 1340, base: 780},
  near: {x0: 700, x1: 1700, base: 860},
  farBand: {x0: 240, x1: 960, y: 520, h: 20},
  midBand: {x0: 460, x1: 1000, y: 608, h: 22},
  leafHome: {x: 1180, y: 490, len: 450, wid: 176, rot: -8},
  leafCup: {x: 748, y: 698, rot: -56, s: 0.36},
  cup: {x: 760, y: 748, rx: 168, ry: 36, footL: 702, footR: 818, footY: 956},
  title: {x: 1592, qing: 400, shan: 656, size: 196},
  seal: {x: 1340, y: 688, s: 130},
  sub: {x: 1340, y: 868, size: 25}, // S16
};
