# Media drop folder

Put files in this folder (`site/public/media/`) using the **exact filenames** below.
Every slot works empty — it shows a labelled placeholder until the file exists.
No code changes needed. Just drop the file and reload.

To add, remove or re-caption slots, edit `mediaSlots` in `src/lib/data.ts`.

## Required — SMR300 (highest impact, section 01)

| Filename | Type | What it should show |
|---|---|---|
| `smr300-hero.jpg` | image | The SMR300 on the factory floor, ideally 3/4 angle, whole robot in frame |
| `smr300-docking.jpg` | image | Robot approaching or under a shelf — the docking moment |
| `smr300-rviz.jpg` | image | RViz screenshot: costmap, laser scan, planned path, TF tree visible |
| `smr300-operator-ui.jpg` | image | Your operator platform — mission control or map editor screen |
| `smr300-nodered.jpg` | image | The Node-RED dashboard |
| `smr300-docking.mp4` | video | 5–15 s clip of an autonomous docking run. Muted, loops. Keep under ~8 MB |

## Required — projects

| Filename | Type | What it should show |
|---|---|---|
| `mira-auv.jpg` | image | Project MIRA AUV, assembled |
| `mira-electronics.jpg` | image | The sealed-hull electronics stack / power distribution |
| `mira-norway.jpg` | image | Team at TAC Challenge Norway 2024 (podium shot is ideal) |
| `kurat-robot.jpg` | image | Kurat companion robot |
| `vtol-uav.jpg` | image | The VTOL search-and-rescue airframe |
| `transformation-drone.jpg` | image | Transformation Drone — render, CAD or prototype |
| `pcb-animatronic.jpg` | image | Animatronic head PCB (board photo or KiCad render) |
| `pcb-rccar.jpg` | image | RC car control board |
| `workshop-kicad.jpg` | image | You teaching the KiCad workshop — room full of people |
| `portrait.jpg` | image | Portrait of you. Portrait or square crop, good light |

## Optional but strong

Add these to `mediaSlots` in `src/lib/data.ts` if you have them:

- `rosscope-ui.jpg` — RosScope engineer-mode screenshot
- `opendronekit-ui.jpg` — OpenDroneKit defect analysis view
- `robotdrawing-abb.mp4` — the ABB IRB140 drawing
- `botopsy-lab.jpg` — Botopsy Lab interface

## Specs

- **Images:** JPG or WebP. 1600×1200 or larger. Aim under 400 KB each (compress at squoosh.app).
- **Video:** MP4 (H.264), muted, under ~8 MB, 5–15 s, loops cleanly.
- **Orientation:** landscape reads best in the grid. Portrait works but crops to 4:3.
- **Naming:** exact match, lowercase, including the extension.

## Also worth sending

- The Drive résumé is linked live — no file needed.
- A 1200×630 `og-image.jpg` for link previews. Drop it in `public/` (not `public/media/`) and it'll be wired up.
