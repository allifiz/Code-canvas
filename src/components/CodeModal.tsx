import { useMemo, useState } from 'react'
import { generateReactCode } from '../lib/generator'
import { useEditorStore } from '../store'

export function CodeModal({ onClose }: { onClose: () => void }) {
  const nodes = useEditorStore((state) => state.nodes)
  const rootIds = useEditorStore((state) => state.rootIds)
  const [copied, setCopied] = useState(false)
  const code = useMemo(() => generateReactCode(nodes, rootIds), [nodes, rootIds])

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
    anchor.download = 'GeneratedPage.tsx'
    anchor.click()
    URL.revokeObjectURL(href)
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section className="code-modal" onMouseDown={(event) => event.stopPropagation()}>
        <header>
          <div>
            <small>React + Tailwind</small>
            <h2>Generated code</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close">×</button>
        </header>
        <pre><code>{code}</code></pre>
        <footer>
          <span>Generated from the current CodeCanvas schema.</span>
          <div>
            <button className="ghost-button" onClick={download}>Download .tsx</button>
            <button className="primary-button" onClick={copy}>{copied ? 'Copied!' : 'Copy code'}</button>
          </div>
        </footer>
      </section>
    </div>
  )
}
