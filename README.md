# NAIM Affective Appraisal System

Browser-first system extending open MediaPipe face signals into AU proxies, expression tendencies, appraisal proxy estimates, and feedback policies.

## Current milestone

MVP-1 internal scaffold:

- Vite + React + TypeScript
- MediaPipe FaceLandmarker wrapper
- camera loop
- high-frequency realtime store
- low-frequency dashboard store
- AU proxy mapping
- expression scoring
- appraisal proxy scoring
- feedback policy placeholder
- optional export/avatar placeholders

## Run

```bash
npm install
npm run dev
```

If `public/models/face_landmarker.task` is missing, the app falls back to the official MediaPipe CDN model.

## Principle

Outputs are proxy estimates, not clinical or psychological ground truth.
