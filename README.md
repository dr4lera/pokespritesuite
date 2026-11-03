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

## Runtime effect previews

Prismatic, Void, and Prismatic + Void can be previewed over normal, shiny, or gilded source art. The body color filters follow the shipped game's coefficients; animated rainbow facets are a canvas approximation for portable GIF/PNG previews. These effects are not baked into game sprite sheets. Prismatic GIFs use a 12-frame color cycle with alternating walking steps.

The editor always loads normal base art. Shiny, gilded, Prismatic, and Void are read-only preview options. For edited sprites, shiny previews map matching original palette colors (new custom colors stay unchanged); gilded previews also tint new colors. Changing preview options never changes the editable project or game PNG. The showcase maker exports these read-only looks as GIF/PNG.

## Walking and battle workspaces

Walking sprites and Battle sprites are separate tabs, with independent local projects and undo histories. Battle has Front and Back projects. Front art uses the original 64×64 frames stacked vertically (64×64 or 64×128 exports). Back art uses the original square resolution: 64×64, 96×96, or 120×120. Painting remains clipped to the chosen game frame. Imported battle PNGs must match these native formats. Switching workspaces preserves their current art; project backups record the workspace and layout.

Adding a project to the showcase also gathers the edited front/walking art for the same species from the other workspace, when available, so one lineup row can show your new portrait alongside your new walking sprites. Preview variants never change these projects.

## Spectral previews

Spectral is available in the walking/battle preview effect selector and as a showcase column, over normal, shiny, or gilded art. Its pale teal / shiny gold palette, retained outline/highlights, and breathing transparency follow Tallgrass's shipped season renderer. Floating wisps are approximated on canvas. Spectral GIFs use 12 frames for the breathing loop. Preview effects never modify editable pixels or game PNG exports.

## Editing shortcuts and quality of life

Both walking and battle editors support pencil, eraser, fill, eyedropper, 1/2/4px brushes, palette picking, undo/redo, copy previous frame, horizontal flip, onion skin, pixel grid, and automatic local saving. Ctrl/Command Z undoes; Ctrl Y or Command Shift Z redoes; left/right arrows or 1–6 select frames; Space pauses/plays preview; F fits the canvas to its workspace. Shortcuts are ignored while typing into inputs.
