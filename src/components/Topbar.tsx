import { useRef, type ChangeEvent } from 'react'
import type {
  CanvasDocument,
  CanvasNode,
  CodeCanvasProject,
  ComponentPropValue,
  ProjectComponentDefinition,
  Viewport,
} from '../types'
import { useEditorStore } from '../store'

type LegacyCodeCanvasFile = {
  version: 1
  document: CanvasDocument
}

const isComponentPropValue = (value: unknown): value is ComponentPropValue =>
  typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'

const isProjectComponent = (value: unknown): value is ProjectComponentDefinition => {
  if (!value || typeof value !== 'object') return false
  const component = value as Partial<ProjectComponentDefinition>

  return (
    typeof component.id === 'string' &&
    typeof component.name === 'string' &&
    typeof component.importPath === 'string' &&
    (component.exportName === undefined || typeof component.exportName === 'string') &&
    typeof component.acceptsChildren === 'boolean' &&
    !!component.defaultProps &&
    typeof component.defaultProps === 'object' &&
    !Array.isArray(component.defaultProps) &&
    Object.values(component.defaultProps).every(isComponentPropValue)
  )
}

const isCanvasNode = (value: unknown): value is CanvasNode => {
  if (!value || typeof value !== 'object') return false
  const node = value as Partial<CanvasNode>

  return (
    typeof node.id === 'string' &&
    ['container', 'text', 'button', 'input', 'image', 'component'].includes(node.type ?? '') &&
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
  if (!nodes.every((node) => node.children.every((childId) => !!document.nodes?.[childId]))) return false

  const visiting = new Set<string>()
  const visited = new Set<string>()

  const hasCycle = (id: string): boolean => {
    if (visiting.has(id)) return true
    if (visited.has(id)) return false

    visiting.add(id)
    const node = document.nodes?.[id]
    if (node?.children.some(hasCycle)) return true

    visiting.delete(id)
    visited.add(id)
    return false
  }

  return !Object.keys(document.nodes).some(hasCycle)
}

const isCodeCanvasProject = (value: unknown): value is CodeCanvasProject => {
  if (!value || typeof value !== 'object') return false
  const project = value as Partial<CodeCanvasProject>

  if (project.version !== 2 || !isCanvasDocument(project.document) || !Array.isArray(project.projectComponents)) {
    return false
  }

  if (!project.projectComponents.every(isProjectComponent)) return false

  const componentIds = new Set(project.projectComponents.map((component) => component.id))

  return Object.values(project.document.nodes).every(
    (node) =>
      node.type !== 'component' ||
      (typeof node.props.componentId === 'string' && componentIds.has(node.props.componentId)),
  )
}

export function Topbar({ onOpenCode }: { onOpenCode: () => void }) {
  const viewport = useEditorStore((state) => state.viewport)
  const setViewport = useEditorStore((state) => state.setViewport)
  const loadDemo = useEditorStore((state) => state.loadDemo)
  const loadDocument = useEditorStore((state) => state.loadDocument)
  const loadProject = useEditorStore((state) => state.loadProject)
  const clearCanvas = useEditorStore((state) => state.clearCanvas)
  const undo = useEditorStore((state) => state.undo)
  const redo = useEditorStore((state) => state.redo)
  const canUndo = useEditorStore((state) => state.past.length > 0)
  const canRedo = useEditorStore((state) => state.future.length > 0)
  const nodes = useEditorStore((state) => state.nodes)
  const rootIds = useEditorStore((state) => state.rootIds)
  const projectComponents = useEditorStore((state) => state.projectComponents)
  const importInputRef = useRef<HTMLInputElement>(null)

  const presets: Array<{ value: Viewport; label: string }> = [
    { value: 'desktop', label: 'Desktop' },
    { value: 'tablet', label: 'Tablet' },
    { value: 'mobile', label: 'Mobile' },
  ]

  const exportDocument = () => {
    const payload: CodeCanvasProject = {
      version: 2,
      document: { nodes, rootIds },
      projectComponents,
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

      if (isCodeCanvasProject(parsed)) {
        loadProject(parsed.document, parsed.projectComponents)
        return
      }

      if (
        parsed &&
        typeof parsed === 'object' &&
        'document' in parsed &&
        isCanvasDocument((parsed as Partial<LegacyCodeCanvasFile>).document)
      ) {
        loadDocument((parsed as LegacyCodeCanvasFile).document)
        return
      }

      if (isCanvasDocument(parsed)) {
        loadDocument(parsed)
        return
      }

      throw new Error('Invalid CodeCanvas document')
    } catch {
      window.alert('Could not import this file. Choose a valid CodeCanvas JSON document.')
    }
  }

  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-mark">C</span>
        <span>CodeCanvas</span>
        <small>v0.2</small>
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
