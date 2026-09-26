# CodeCanvas

**Open-source visual editor for building real React interfaces. Drag components, edit visually, own the code.**

CodeCanvas is a source-code-first visual UI builder. Instead of treating the canvas like an image editor full of absolute coordinates, CodeCanvas models layouts as web primitives such as flexbox, spacing, containers, and reusable components.

## MVP

- Figma-style File / Edit / Insert / View application menus
- Layers / Assets sidebar workflow
- Drag primitives or complete Navbar, Hero, Card, and Login blocks into the canvas
- Drag components from the palette into the canvas
- Nest components inside containers
- Move existing nodes between containers
- Reorder siblings with positional drag-and-drop
- Undo / redo with keyboard shortcuts
- Import and export versioned CodeCanvas project JSON
- Register project React components and drag them onto the canvas
- Generate imports and JSX for registered project components
- Scan React component folders into an importable manifest
- Edit layout, component props, sizing, spacing, typography, fills, opacity, borders, radius, shadows, overflow, and image fit
- Copy and paste visual styles between layers
- Reusable color tokens and typography styles
- Solid and linear-gradient fills
- Desktop, tablet, and mobile style/layout overrides
- Right-click canvas context menu for common layer actions
- Zoom the canvas and toggle the layout grid
- Resize selected layers from eight canvas handles, with Shift aspect-ratio lock
- Snap resize edges to nearby layer edges and centers with visual alignment guides
- Marquee-select multiple layers from empty canvas space
- Shift-click to add or remove layers from a selection
- Group / ungroup selected sibling layers
- Nudge selected layers with arrow keys; hold Shift for 10px movement
- Pan the canvas with Space + drag
- Reorder and reparent layers by dragging from the Layers panel
- Resize selected layers directly from canvas handles
- Rename, hide, and lock layers from the Layers panel
- Double-click text layers to edit content directly on the canvas
- Switch desktop, tablet, and mobile canvas widths
- Persist the current document locally
- Export readable React + Tailwind or standalone HTML + CSS
- Copy generated code directly from the editor
- Start from a built-in demo or a blank canvas

## Why CodeCanvas?

Most visual builders make design the source of truth and code the export artifact. CodeCanvas is being built around a different idea:

> The visual editor and the source code should describe the same component tree.

The current MVP uses an intermediate UI schema. That gives us a path toward multiple renderers and code generators without coupling the editor to one framework.

```text
Visual Editor
     |
     v
 UI Schema
     |
     +------> React + Tailwind
     |
     +------> Vue (planned)
     |
     +------> HTML/CSS (planned)
```

## Run locally

```bash
npm install
npm run dev
```

Then open the Vite URL shown in your terminal.

## Build

```bash
npm run build
```

## Editor shortcuts

- `Ctrl/Cmd + Z`: undo
- `Ctrl/Cmd + Shift + Z`: redo
- `Ctrl/Cmd + Y`: redo
- `Ctrl/Cmd + A`: select visible unlocked root layers
- `Ctrl/Cmd + G`: group selected sibling layers
- `Ctrl/Cmd + Shift + G`: ungroup selected frame
- Arrow keys: nudge selection by 1px
- Shift + Arrow keys: nudge selection by 10px
- Space + drag: pan the canvas
- `Ctrl/Cmd + D`: duplicate selected subtree
- `Ctrl/Cmd + Alt + C`: copy visual style
- `Ctrl/Cmd + Alt + V`: paste visual style
- `Delete / Backspace`: delete selected component
- `Escape`: close the code modal

## Document portability

Use **Export** to save the current canvas as a versioned CodeCanvas JSON file, then **Import** to restore it later or move it to another browser.

CodeCanvas v0.5 writes project format **v3**, which includes the document tree, project component registry, responsive overrides, and local design system. Existing v2 projects remain importable and receive the default design system automatically.

## Interaction workflow

CodeCanvas v0.4 adds design-tool interaction patterns on top of the source-code-first schema:

- **Shift + click** builds a multi-selection
- Drag on empty canvas space for **marquee selection**
- **Ctrl/Cmd + G** groups selected sibling layers into a Frame
- **Ctrl/Cmd + Shift + G** ungroups the selected Frame
- Arrow keys nudge selected layers without changing flex/grid ordering
- **Shift + Arrow** moves 10px at a time
- Hold **Space** and drag to pan the canvas
- Drag the handle in **Layers** to reorder or reparent a layer
- Resize from all eight directions; hold **Shift** on a corner handle to preserve aspect ratio
- Resize edges snap to nearby layer edges/centers and show purple alignment guides

Nudging is stored as X/Y translation properties, so it remains represented in React and HTML/CSS exports instead of existing only inside the editor.

## Design system and responsive editing

CodeCanvas v0.5 adds reusable local styles instead of forcing every layer to carry unrelated hard-coded values.

### Color tokens

Create or edit reusable colors such as:

```text
Brand / Primary  #6366f1
Surface / Default #ffffff
Text / Primary   #0f172a
Text / Muted     #64748b
```

A layer can reference a token for its fill or text color. Updating the token updates every layer using it.

### Text styles

Typography presets can store font family, size, weight, line height, tracking, and text transform. Existing typography can be saved as a reusable text style from the inspector.

### Gradients

Layers support linear-gradient fills with configurable start color, end color, and angle.

### Responsive overrides

Desktop remains the base style. Switch the editor viewport to **Tablet** or **Mobile** and edit layout/style properties to create breakpoint-specific overrides. Content such as text, image URLs, links, and component props remains global.

Responsive exports use:

- Tablet: 768px–1199px
- Mobile: up to 767px

React exports use Tailwind responsive variants. HTML exports generate media queries.

## Design inspector

Select a layer and use the **Design** tab to edit web-real properties:

- Width, height, min/max constraints
- Padding and margin per side
- Flex / grid auto-layout, alignment, gap, overflow
- Font family, size, weight, line height, tracking, alignment, case, decoration
- Fill and opacity
- Border width/style/color
- Radius per corner
- Box shadow
- Image fit and object position

The **Inspect** tab exposes the current node type, ID, child count, import metadata, and raw schema props.

## Project components

CodeCanvas can reference components that already exist in your React project.

You can register them manually in the **Project Components** panel with:

- Local component name, for example `Button`
- Import path, for example `@/components/ui/button`
- Named export when applicable
- Flat default props
- Whether the component accepts children

Generated React code keeps the registered import instead of replacing the component with generic HTML.

### Scan a component folder

Generate a component manifest with:

```bash
npm run scan:components
```

By default this scans `src/components` and writes `codecanvas.components.json`.

Custom paths are supported:

```bash
npm run scan:components -- --dir src/ui --out codecanvas.components.json
```

Then use **Project Components → Import** inside CodeCanvas.

The scanner currently detects exported PascalCase components from `.tsx` and `.jsx` files. Children support is inferred heuristically and can be adjusted manually after import.

## Standalone project export

From the **Code** modal, **Export project .zip** creates a runnable Vite + React + Tailwind project when the canvas only uses built-in CodeCanvas components.

The ZIP includes the generated page, Vite/Tailwind setup, and the original `codecanvas.project.json` document.

When external Project Components are used, standalone ZIP export is intentionally disabled because CodeCanvas does not have those component source files in the browser. The generated React code still preserves their real imports for integration into the original project.

## Current asset library

### Blocks

- Navbar
- Hero
- Card
- Login form

### Primitives

- Frame
- Text
- Button
- Input
- Textarea
- Link
- Divider
- Image

### Project assets

- Registered React components
- Imported component manifests

## Roadmap

- [x] Visual component palette
- [x] Drag and drop into nested containers
- [x] Properties inspector
- [x] Responsive canvas presets
- [x] React + Tailwind generator
- [x] Local persistence
- [x] Reorder siblings with drag and drop
- [x] Undo / redo
- [x] Project component registry
- [x] React component manifest scanner
- [x] Generate imports for project components
- [ ] Automatically sync project components through a dev server/CLI bridge
- [ ] Parse existing JSX into the CodeCanvas schema
- [ ] Two-way visual/code editing
- [ ] Vue generator
- [x] HTML/CSS generator
- [x] Advanced design inspector
- [x] Application menus
- [x] Blocks / preset sections
- [x] Canvas zoom and grid
- [x] Copy / paste visual styles
- [x] Drag resize handles
- [x] Inline text editing
- [x] Layer rename / visibility / lock
- [x] Design tokens
- [x] Reusable color tokens
- [x] Reusable typography styles
- [x] Linear-gradient fills
- [x] Responsive style/layout overrides
- [x] Canvas context menu
- [ ] Component variants
- [x] Export a standalone React project ZIP for built-in components
- [ ] Plugin API

## Principles

1. **Source-code-first**: generated code should be readable enough to keep.
2. **Web layout, not drawing coordinates**: flexbox and normal document flow before absolute positioning.
3. **Framework-independent core**: the editor works on a UI schema, generators decide the output.
4. **Local-first where possible**: the editor should remain useful without an account or API key.
5. **AI is optional**: AI may produce or edit schema later, but it is not required for the core editor.

## Contributing

The project is intentionally young. Issues and pull requests are welcome, especially around code generation, component parsing, drag-and-drop ergonomics, and visual editing.

## License

MIT
