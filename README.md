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
- Zoom the canvas and toggle the layout grid
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
- `Ctrl/Cmd + D`: duplicate selected subtree
- `Ctrl/Cmd + Alt + C`: copy visual style
- `Ctrl/Cmd + Alt + V`: paste visual style
- `Delete / Backspace`: delete selected component
- `Escape`: close the code modal

## Document portability

Use **Export** to save the current canvas as a versioned CodeCanvas JSON file, then **Import** to restore it later or move it to another browser.

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
- [ ] Drag resize handles
- [ ] Inline text editing
- [ ] Design tokens
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
