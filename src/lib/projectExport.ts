import { generateReactCode } from './generator'
import type { CanvasNode, ProjectComponentDefinition } from '../types'

const encoder = new TextEncoder()

const crcTable = (() => {
  const table = new Uint32Array(256)

  for (let index = 0; index < 256; index += 1) {
    let value = index
    for (let bit = 0; bit < 8; bit += 1) {
      value = (value & 1) !== 0 ? 0xedb88320 ^ (value >>> 1) : value >>> 1
    }
    table[index] = value >>> 0
  }

  return table
})()

const crc32 = (bytes: Uint8Array) => {
  let crc = 0xffffffff
  for (const byte of bytes) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

const push16 = (target: number[], value: number) => {
  target.push(value & 0xff, (value >>> 8) & 0xff)
}

const push32 = (target: number[], value: number) => {
  target.push(
    value & 0xff,
    (value >>> 8) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 24) & 0xff,
  )
}

const append = (target: number[], bytes: Uint8Array) => {
  for (const byte of bytes) target.push(byte)
}

const createZip = (files: Record<string, string>) => {
  const output: number[] = []
  const central: number[] = []
  const entries = Object.entries(files).sort(([a], [b]) => a.localeCompare(b))
  const dosDate = 33
  const dosTime = 0

  for (const [name, content] of entries) {
    const filename = encoder.encode(name)
    const bytes = encoder.encode(content)
    const crc = crc32(bytes)
    const offset = output.length

    push32(output, 0x04034b50)
    push16(output, 20)
    push16(output, 0x0800)
    push16(output, 0)
    push16(output, dosTime)
    push16(output, dosDate)
    push32(output, crc)
    push32(output, bytes.length)
    push32(output, bytes.length)
    push16(output, filename.length)
    push16(output, 0)
    append(output, filename)
    append(output, bytes)

    push32(central, 0x02014b50)
    push16(central, 20)
    push16(central, 20)
    push16(central, 0x0800)
    push16(central, 0)
    push16(central, dosTime)
    push16(central, dosDate)
    push32(central, crc)
    push32(central, bytes.length)
    push32(central, bytes.length)
    push16(central, filename.length)
    push16(central, 0)
    push16(central, 0)
    push16(central, 0)
    push16(central, 0)
    push32(central, 0)
    push32(central, offset)
    append(central, filename)
  }

  const centralOffset = output.length
  output.push(...central)

  push32(output, 0x06054b50)
  push16(output, 0)
  push16(output, 0)
  push16(output, entries.length)
  push16(output, entries.length)
  push32(output, central.length)
  push32(output, centralOffset)
  push16(output, 0)

  return new Blob([new Uint8Array(output)], { type: 'application/zip' })
}

const packageJson = `{
  "name": "codecanvas-export",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.18",
    "@types/react-dom": "^18.3.5",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.17",
    "typescript": "~5.7.2",
    "vite": "^6.0.5"
  }
}
`

const mainTsx = `import React from 'react'
import ReactDOM from 'react-dom/client'
import GeneratedPage from './GeneratedPage'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GeneratedPage />
  </React.StrictMode>,
)
`

const indexCss = `@tailwind base;
@tailwind components;
@tailwind utilities;

html {
  background: #f8fafc;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
`

const indexHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CodeCanvas Export</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`

const viteConfig = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
`

const tsconfig = `{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"]
}
`

const tailwindConfig = `/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
}
`

const postcssConfig = `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`

export const canExportStandaloneProject = (nodes: Record<string, CanvasNode>) =>
  !Object.values(nodes).some((node) => node.type === 'component')

export function downloadStandaloneProject(
  nodes: Record<string, CanvasNode>,
  rootIds: string[],
  projectComponents: ProjectComponentDefinition[],
) {
  if (!canExportStandaloneProject(nodes)) {
    throw new Error('Standalone project export cannot include external project components yet.')
  }

  const generatedPage = generateReactCode(nodes, rootIds, projectComponents)
  const projectSnapshot = JSON.stringify(
    {
      version: 2,
      document: { nodes, rootIds },
      projectComponents,
    },
    null,
    2,
  )

  const readme = `# CodeCanvas Export

This project was generated from CodeCanvas.

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

The generated interface lives in `src/GeneratedPage.tsx`.

The original CodeCanvas schema is included as `codecanvas.project.json` so the project can be reopened in CodeCanvas later.
`

  const zip = createZip({
    'README.md': readme,
    'codecanvas.project.json': projectSnapshot + '\n',
    'index.html': indexHtml,
    'package.json': packageJson,
    'postcss.config.js': postcssConfig,
    'src/GeneratedPage.tsx': generatedPage,
    'src/index.css': indexCss,
    'src/main.tsx': mainTsx,
    'tailwind.config.js': tailwindConfig,
    'tsconfig.json': tsconfig,
    'vite.config.ts': viteConfig,
  })

  const url = URL.createObjectURL(zip)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'codecanvas-react-project.zip'
  anchor.click()
  URL.revokeObjectURL(url)
}
