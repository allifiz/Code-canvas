import { useMemo, useState } from 'react'
import { generateHtmlCode, generateReactCode } from '../lib/generator'
import { canExportStandaloneProject, downloadStandaloneProject } from '../lib/projectExport'
import { useEditorStore } from '../store'

type CodeFormat = 'react' | 'html'

export function CodeModal({ onClose }: { onClose: () => void }) {
  const nodes = useEditorStore((state) => state.nodes)
  const rootIds = useEditorStore((state) => state.rootIds)
  const projectComponents = useEditorStore((state) => state.projectComponents)
  const [format, setFormat] = useState<CodeFormat>('react')
  const [copied, setCopied] = useState(false)
  const canExportProject = canExportStandaloneProject(nodes)

  const code = useMemo(
    () =>
      format === 'react'
        ? generateReactCode(nodes, rootIds, projectComponents)
        : generateHtmlCode(nodes, rootIds, projectComponents),
    [format, nodes, projectComponents, rootIds],
  )

  const copy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  const download = () => {
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' })
    const href = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = href
    anchor.download = format === 'react' ? 'GeneratedPage.tsx' : 'index.html'
    anchor.click()
    URL.revokeObjectURL(href)
  }

  const downloadProject = () => {
    if (!canExportProject) {
      window.alert('Standalone project export is available when the canvas only uses built-in components. Project component source files are not available inside the browser yet.')
      return
    }

    downloadStandaloneProject(nodes, rootIds, projectComponents)
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section className="code-modal" onMouseDown={(event) => event.stopPropagation()}>
        <header>
          <div>
            <small>{format === 'react' ? 'React + Tailwind' : 'HTML + CSS'}</small>
            <h2>Generated code</h2>
          </div>

          <div className="code-header-actions">
            <div className="code-format-switcher" aria-label="Code export format">
              <button className={format === 'react' ? 'active' : ''} onClick={() => setFormat('react')}>React</button>
              <button className={format === 'html' ? 'active' : ''} onClick={() => setFormat('html')}>HTML</button>
            </div>
            <button className="icon-button" onClick={onClose} aria-label="Close">×</button>
          </div>
        </header>

        <pre><code>{code}</code></pre>

        <footer>
          <span>Generated from the current CodeCanvas schema.</span>
          <div>
            <button
              className="ghost-button"
              onClick={downloadProject}
              disabled={!canExportProject}
              title={
                canExportProject
                  ? 'Download a runnable Vite + React + Tailwind project'
                  : 'Standalone project export cannot include external project component source yet'
              }
            >
              Export project .zip
            </button>
            <button className="ghost-button" onClick={download}>
              Download {format === 'react' ? '.tsx' : '.html'}
            </button>
            <button className="primary-button" onClick={copy}>{copied ? 'Copied!' : 'Copy code'}</button>
          </div>
        </footer>
      </section>
    </div>
  )
}
