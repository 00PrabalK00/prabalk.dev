# Media drop folder

Put files in `site/public/media/` using the **exact filenames** below.
Every slot works empty — it renders a labelled placeholder until the file exists.
No code changes needed: drop the file, reload.

To add, remove or re-caption slots, edit `mediaSlots` in `src/lib/data.ts`.

---

## Tier 1 — send these first

These carry the most weight. The site is convincing with just these six.

| Filename | Type | What it should show |
|---|---|---|
| `smr300-hero.jpg` | image | The SMR300 on the factory floor. 3/4 angle, whole robot in frame, shelf visible if possible |
| `smr300-docking.mp4` | video | 5–15 s of an autonomous docking run — approach, align, lift. This is your single strongest asset |
| `smr300-rviz.jpg` | image | RViz: costmap, laser scan, planned path, TF tree |
| `smr300-operator-ui.jpg` | image | Your operator platform — mission control or the map editor |
| `mira-norway.jpg` | image | TAC Challenge Norway 2024. Podium or team shot |
| `portrait.jpg` | image | You. Portrait or square crop, decent light |

---

## Tier 2 — projects

| Filename | Type | What it should show |
|---|---|---|
| `transform-drone.jpg` | image | Transformation Drone in rover mode — the shot you sent works |
| `transform-drone.mp4` | video | Ground-to-air transition, or the wheels driving with props stowed |
| `mira-auv.jpg` | image | Project MIRA assembled, frame and thrusters visible |
| `mira-electronics.jpg` | image | The pressure-housing internals / power distribution |
| `mira-underwater.mp4` | video | MIRA in the water, even a short pool test |
| `vtol-uav.jpg` | image | The VTOL airframe — the bench photo you sent is good |
| `vtol-flight.mp4` | video | Hover, transition, or a scan pass |
| `kurat-robot.jpg` | image | Kurat, assembled |
| `robotdrawing-abb.mp4` | video | The IRB140 actually drawing |
| `smr300-nodered.jpg` | image | The Node-RED dashboard |
| `smr300-docking.jpg` | image | Still of the robot under a shelf |
| `rosscope-ui.jpg` | image | RosScope engineer mode, graph visible |
| `pcb-animatronic.jpg` | image | Animatronic head PCB — board photo or KiCad render |
| `pcb-rccar.jpg` | image | RC car control board |
| `workshop-kicad.jpg` | image | You teaching the KiCad workshop, room full |

---

## Specs

- **Images** — JPG or WebP, 1600px on the long edge or larger, under ~400 KB each. Compress at squoosh.app.
- **Video** — MP4 (H.264), **muted**, 5–15 s, under ~8 MB, loops cleanly. They autoplay silently, so no audio needed and no sound will ever play.
- **Orientation** — landscape reads best. Portrait works; it crops to the slot ratio.
- **Naming** — exact match, lowercase, including extension.

### Trimming a clip to size

```bash
ffmpeg -i input.mp4 -t 12 -an -vf "scale=1280:-2" -crf 28 -preset slow smr300-docking.mp4
```

`-an` strips audio, `-t 12` caps length, `-crf 28` targets a small file. Check it lands under 8 MB.

---

## Also worth sending

- **`og-image.jpg`** — 1200×630, for link previews when you share the site. Goes in `public/`, not `public/media/`. Best candidate: the SMR300 hero shot with your name on it.
- Screenshots of **OpenDroneKit** defect analysis and the **Botopsy Lab** interface, if you want those in the gallery — tell me and I'll add slots.

The Drive résumé is linked live, so no file needed for that.
