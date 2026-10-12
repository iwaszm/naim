# NAIM Affective Appraisal System

Browser-first system extending open MediaPipe face signals into AU proxies, expression tendencies, appraisal proxy estimates, and feedback policies.

## Current milestone

Mobile PWA foundation:

- Vite + React + TypeScript
- local MediaPipe FaceLandmarker model and WASM
- camera session with front/back preference and foreground lifecycle cleanup
- high-frequency realtime store
- low-frequency dashboard store
- AU proxy mapping
- expression scoring
- appraisal proxy scoring
- feedback policy placeholder
- installable PWA shell with cached Face resources
- mobile live view; lazy Research and Avatar views
- opt-in IndexedDB research snapshots, markers, JSON/CSV export, and deletion

## Run

```bash
npm install
npm run dev
```

To verify a production package:

```bash
npm run build
npm run smoke:core
npm run smoke:pwa
```

The face model and Tasks Vision WASM are served locally. `npm run dev` and `npm run build` copy the installed WASM files into the ignored `public/vendor/mediapipe/tasks-vision/` directory. Keep `public/models/face_landmarker.task` available.

The default view is the mobile face experience. Research and full-body Avatar views load only when selected. A production build provides a manifest and service worker; offline face use is available after the core resources have been cached on a successful first visit. Camera access requires HTTPS or localhost.

## Principle

Outputs are proxy estimates, not clinical or psychological ground truth.

## Architecture and mobile PWA plan

See [docs/architecture-plan.md](docs/architecture-plan.md) for the current module boundaries, migration steps, and mobile PWA requirements.
