import { useRef, type ChangeEvent } from 'react'
import type { CanvasDocument, CanvasNode, Viewport } from '../types'
import { useEditorStore } from '../store'

type CodeCanvasFile = {
  version: 1
  document: CanvasDocument
}

const isCanvasNode = (value: unknown): value is CanvasNode => {
  if (!value || typeof value !== 'object') return false
  const node = value as Partial<CanvasNode>

  return (
    typeof node.id === 'string' &&
    ['container', 'text', 'button', 'input', 'image'].includes(node.type ?? '') &&
    !!node.props &&
    typeof node.props === 'object' &&
    Array.isArray(node.children) &&
    node.children.every((child) => typeof child === 'string')
  )
}

const isCanvasDocument = (value: unknown): value is CanvasDocument => {
  if (!value || typeof value !== 'object') return false
  const document = value as Partial<CanvasDocument>

  if (!document.nodes || typeof document.nodes !== 'object' || !Array.isArray(document.rootIds)) {
    return false
  }

  const nodes = Object.values(document.nodes)
  if (!nodes.every(isCanvasNode)) return false
  if (!document.rootIds.every((id) => typeof id === 'string' && !!document.nodes?.[id])) return false

  return nodes.every((node) => node.children.every((childId) => !!document.nodes?.[childId]))
}

export function Topbar({ onOpenCode }: { onOpenCode: () => void }) {
  const viewport = useEditorStore((state) => state.viewport)
  const setViewport = useEditorStore((state) => state.setViewport)
  const loadDemo = useEditorStore((state) => state.loadDemo)
  const loadDocument = useEditorStore((state) => state.loadDocument)
  const clearCanvas = useEditorStore((state) => state.clearCanvas)
  const undo = useEditorStore((state) => state.undo)
  const redo = useEditorStore((state) => state.redo)
  const canUndo = useEditorStore((state) => state.past.length > 0)
  const canRedo = useEditorStore((state) => state.future.length > 0)
  const nodes = useEditorStore((state) => state.nodes)
  const rootIds = useEditorStore((state) => state.rootIds)
  const importInputRef = useRef<HTMLInputElement>(null)

  const presets: Array<{ value: Viewport; label: string }> = [
    { value: 'desktop', label: 'Desktop' },
    { value: 'tablet', label: 'Tablet' },
    { value: 'mobile', label: 'Mobile' },
  ]

  const exportDocument = () => {
    const payload: CodeCanvasFile = {
      version: 1,
      document: { nodes, rootIds },
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `codecanvas-${new Date().toISOString().slice(0, 10)}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const importDocument = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    try {
      const parsed = JSON.parse(await file.text()) as unknown
      const candidate =
        parsed && typeof parsed === 'object' && 'document' in parsed
          ? (parsed as Partial<CodeCanvasFile>).document
          : parsed

      if (!isCanvasDocument(candidate)) {
        throw new Error('Invalid CodeCanvas document')
      }

      loadDocument(candidate)
    } catch {
      window.alert('Could not import this file. Choose a valid CodeCanvas JSON document.')
    }
  }

  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-mark">C</span>
        <span>CodeCanvas</span>
        <small>v0.1</small>
      </div>

      <div className="viewport-switcher" aria-label="Canvas viewport">
        {presets.map((preset) => (
          <button
            key={preset.value}
            className={viewport === preset.value ? 'active' : ''}
            onClick={() => setViewport(preset.value)}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="topbar-actions">
        <button className="ghost-button" onClick={undo} disabled={!canUndo} title="Undo (Ctrl/Cmd+Z)">↶</button>
        <button className="ghost-button" onClick={redo} disabled={!canRedo} title="Redo (Ctrl/Cmd+Shift+Z)">↷</button>
        <button className="ghost-button" onClick={() => importInputRef.current?.click()} title="Import CodeCanvas JSON">Import</button>
        <button className="ghost-button" onClick={exportDocument} title="Export CodeCanvas JSON">Export</button>
        <button className="ghost-button" onClick={loadDemo}>Demo</button>
        <button className="ghost-button" onClick={clearCanvas}>Clear</button>
        <button className="primary-button" onClick={onOpenCode}>&lt;/&gt; Code</button>
        <input
          ref={importInputRef}
          className="visually-hidden"
          type="file"
          accept="application/json,.json"
          onChange={importDocument}
          tabIndex={-1}
        />
      </div>
    </header>
  )
}
