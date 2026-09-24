# CodeCanvas

**Open-source visual editor for building real React interfaces. Drag components, edit visually, own the code.**

CodeCanvas is a source-code-first visual UI builder. Instead of treating the canvas like an image editor full of absolute coordinates, CodeCanvas models layouts as web primitives such as flexbox, spacing, containers, and reusable components.

## MVP

- Drag components from the palette into the canvas
- Nest components inside containers
- Move existing nodes between containers
- Reorder siblings with positional drag-and-drop
- Undo / redo with keyboard shortcuts
- Import and export CodeCanvas JSON documents
- Edit layout and visual properties
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
- `Delete / Backspace`: delete selected component
- `Escape`: close the code modal

## Document portability

Use **Export** to save the current canvas as a versioned CodeCanvas JSON file, then **Import** to restore it later or move it to another browser.

## Current component palette

- Container
- Text
- Button
- Input
- Image

## Roadmap

- [x] Visual component palette
- [x] Drag and drop into nested containers
- [x] Properties inspector
- [x] Responsive canvas presets
- [x] React + Tailwind generator
- [x] Local persistence
- [x] Reorder siblings with drag and drop
- [x] Undo / redo
- [ ] Import project React components
- [ ] Parse existing JSX into the CodeCanvas schema
- [ ] Two-way visual/code editing
- [ ] Vue generator
- [x] HTML/CSS generator
- [ ] Design tokens
- [ ] Component variants
- [ ] Export a full project
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
