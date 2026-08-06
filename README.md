# prabalkhare.dev — portfolio

Next.js 16 · React 19 · React Three Fiber · Tailwind v4.

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

## Where things live

| What | File |
|---|---|
| **All content** — bio, experience, projects, patents, skills, honors | `src/lib/data.ts` |
| Live GitHub aggregator | `src/app/api/github/route.ts` |
| 3D hero scene | `src/components/three/Scene.tsx` |
| Photos and video | `public/media/` — see `public/media/MANIFEST.md` |

Editing `src/lib/data.ts` changes the site. No component edits needed for content changes.

## Live GitHub panel

`/api/github` aggregates the REST API server-side and caches for 5 minutes.
The client polls every 60 s and on tab refocus, so a push shows up within about a minute.

Works with no configuration. Add a token to unlock more:

```bash
cp .env.example .env.local
# set GITHUB_TOKEN=github_pat_...
```

| | No token | With token |
|---|---|---|
| Repos, stars, activity stream, languages | yes | yes |
| Contribution heatmap | no (GraphQL needs auth) | yes |
| Rate limit | 60 req/hr per IP | 5000 req/hr |

For public data a classic token with `read:user` is enough. Never commit `.env.local`.

## Media

Every image and video slot renders a labelled placeholder until the file exists —
nothing breaks when the folder is empty. Drop files into `public/media/` using the
exact filenames in `public/media/MANIFEST.md`.

## Deploy

Vercel: import the repo, set the root directory to `site/`, add `GITHUB_TOKEN` as an
environment variable, deploy. Then point the domain and update `SITE` in
`src/app/layout.tsx` and `src/app/page.tsx`.

## Performance notes

- The WebGL scene is `dynamic(..., { ssr: false })`, so first paint never waits on three.js.
- `PerformanceMonitor` + `AdaptiveDpr` drop the pixel ratio when the frame budget slips.
- All animation honors `prefers-reduced-motion`.
