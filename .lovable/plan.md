# Beat Brains Amapiano and Vision Upgrade

## What will change
- Rename Atelier AI to Beat Brains across navigation, page titles, and descriptions.
- Add a light/dark theme switch that remembers the visitor’s choice.
- Add the exact disclaimer “AI can make mistakes. Please check important info.” throughout the shared experience.
- Focus Music on South African Amapiano: user-selected song subject, emotional direction, 112–115 BPM, richer warm chords, log-drum bass, percussion, harmonies, chorus structure, playback, and WAV download.
- Keep generated audio claims accurate: the browser synthesizer will create an original instrumental and a sing-along lyric/chant concept, without falsely claiming studio-quality AI vocals.
- Redesign Detection as a professional live vision console with clearer scanning overlays, tracked labels, confidence scores, object counts, motion summaries, scene/weather estimates, and spoken descriptions.
- Clearly distinguish model-backed detections from best-effort scene, activity, weather, and expression estimates.

## Verification
- Check all page metadata uses Beat Brains.
- Test the Amapiano generation and playback controls in the browser.
- Test the detector’s upload/demo controls and spoken-description fallback.
- Check desktop and mobile layouts and confirm the preview builds without errors.

## Technical details
- Keep processing in the browser and reuse the existing COCO-SSD and Web Audio foundations.
- Expand the procedural music engine and detector interface without adding accounts, storage, or paid services.
- Store only the visual theme preference in browser storage after the page loads.
