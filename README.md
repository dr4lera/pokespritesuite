# pokespritesuite

A standalone, browser-based Pokémon walking-sprite editor and animated showcase maker. Built for creating new Tallgrass costumes.

- 32×32 and 64×64 frames; drawing is clipped to game-visible frame bounds.
- 1,297 regular Pokémon and alternate forms. Existing Tallgrass costumes are excluded.
- Normal, shiny, and gilded source art, bundled locally in lossless atlases.
- Pencil, eraser, flood fill, eyedropper, palette, undo/redo, onion skin, six-frame timeline, mirrored right preview.
- Import single-frame PNGs, horizontal six/eight-frame sheets, and saved projects.
- Export transparent six-frame game PNGs (192×32 or 384×64), editable project JSON, labeled PNG previews, and animated GIF showcases.
- Showcase backgrounds: color or custom image. Side-by-side variants, editable lineup order, two walking steps.
- Current editor project auto-saves locally. No accounts, upload service, or server processing.

## Run locally

Serve this directory with any static web server, for example `python3 -m http.server 8000`, then open `http://localhost:8000/`.

## GitHub Pages

Publish from the main branch, root folder. No build step or external JavaScript packages are required. Optional Google Fonts fall back to system fonts.

## Formats

Game sheets use six horizontal square frames: down 1, down 2, up 1, up 2, left 1, left 2. Right-facing movement mirrors left. When importing eight-frame assets, only the first six frames are used. Native 48px/56px library art is padded to 64px without stretching. Increasing the frame size preserves the art at bottom-center; reducing the frame size crops, with Undo available.

Game PNGs contain only walking sprites; preview labels, portraits, and backgrounds never appear in game PNG exports. A single-frame import copies that frame into all six slots for you to animate. GIF exports loop two walking steps, with adaptive color palettes (GIF supports up to 256 colors per frame).

## Credits

Unofficial fan-made editor. Pokémon names and artwork belong to their respective owners. Source sprite assets come from the publicly distributed Tallgrass v0.64.11 game release. This project is not affiliated with Nintendo, Game Freak, The Pokémon Company, or Tallgrass.
