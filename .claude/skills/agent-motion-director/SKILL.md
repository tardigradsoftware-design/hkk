---
name: agent-motion-director
description: >
  Directs and codes deterministic 60fps YouTube (16:9) and Shorts/Reels (9:16) motion graphics videos,
  data visualizations, kinetic typography, 3D spatial scenes, procedural SFX, and word-synced captions
  using Agent Motion Studio. Activates whenever the user asks to create, animate, storyboard, or render a video.
license: MIT
---

# Agent Motion Director Skill

When asked to build an animated video or motion graphic in this workspace:

1. **Read `CLAUDE.md` first** to load the 6 Cinematic Craft Laws and SDK primitives.
2. **Choose aspect ratio**:
   - YouTube Landscape: `1920x1080` @ `60fps`
   - YouTube Shorts / TikTok / Reels: `1080x1920` @ `60fps`
3. **Design Beat Sheet before coding**:
   - Hook in `< 3.0s` (`0..180f`)
   - One Hero element per beat
   - Attach synchronized `audioCues` (`subHit`, `whoosh`, `shutter`, `uiClick`, `pop`, `riser`, `chime`) to primary visual impacts.
4. **Verify Determinism & Quality Gates**:
   - Run `npm run lint:video <spec-or-js>`
   - Synthesize audio via `npm run sfx -- --spec <spec.json> --out renders/sound.wav`
   - Render via `npm run render` and verify with `npm run qa`.
