# 青山

20 秒无缝循环水墨品牌短片。独立工程，从 `motion-design-prompt-generator/templates/remotion-starter` 复制而来，不是 `docs/media/videos/` 里的作者成片。

提示词原文：`test-prompts/01-青山-水墨品牌短片.txt`。

起步项目与 `src/lib/motion.tsx`、`scripts/score.mjs`、`scripts/check.sh` 版权归 **阿宁Neo**，MIT License，见 `LICENSE`。

## 运行

```bash
npm install
npx tsc -p .
npm run render
TIMES="0 0.75 2.4 4 6.75 8 10.5 12 14.25 16 18 19.98" npm run check
```

`npm run render` 会先用 `scripts/cues.json` 生成 `public/score.wav`，再导出 `out/film.mp4`（1920×1080，60 fps，20 秒，带声音）。
