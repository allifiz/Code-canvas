import { useRef, type ChangeEvent, type ReactNode } from 'react'
import type {
  CanvasDocument,
  CanvasNode,
  CodeCanvasProject,
  ComponentPropValue,
  DesignSystem,
  NodeType,
  PresetType,
  ProjectComponentDefinition,
  Viewport,
} from '../types'
import { useEditorStore } from '../store'
import { defaultDesignSystem } from '../lib/designSystem'

type LegacyCodeCanvasFile = {
  version: 1
  document: CanvasDocument
}

type LegacyV2Project = {
  version: 2
  document: CanvasDocument
  projectComponents: ProjectComponentDefinition[]
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
    ['container', 'text', 'button', 'input', 'textarea', 'link', 'divider', 'image', 'component'].includes(node.type ?? '') &&
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

const isDesignSystem = (value: unknown): value is DesignSystem => {
  if (!value || typeof value !== 'object') return false
  const designSystem = value as Partial<DesignSystem>

  return (
    Array.isArray(designSystem.colors) &&
    designSystem.colors.every(
      (token) =>
        !!token &&
        typeof token.id === 'string' &&
        typeof token.name === 'string' &&
        typeof token.value === 'string',
    ) &&
    Array.isArray(designSystem.textStyles) &&
    designSystem.textStyles.every(
      (token) =>
        !!token &&
        typeof token.id === 'string' &&
        typeof token.name === 'string' &&
        !!token.value &&
        typeof token.value === 'object',
    )
  )
}

const isCodeCanvasProject = (value: unknown): value is CodeCanvasProject => {
  if (!value || typeof value !== 'object') return false
  const project = value as Partial<CodeCanvasProject>

  if (
    project.version !== 3 ||
    !isCanvasDocument(project.document) ||
    !Array.isArray(project.projectComponents) ||
    !isDesignSystem(project.designSystem)
  ) {
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

function Menu({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <details className="app-menu">
      <summary>{label}</summary>
      <div className="app-menu-popover">{children}</div>
    </details>
  )
}

function MenuItem({
  children,
  shortcut,
  disabled,
  onClick,
}: {
  children: ReactNode
  shortcut?: string
  disabled?: boolean
  onClick?: () => void
}) {
  return (
    <button className="app-menu-item" disabled={disabled} onClick={onClick}>
      <span>{children}</span>
      {shortcut && <kbd>{shortcut}</kbd>}
    </button>
  )
}

const builtIns: Array<{ type: Exclude<NodeType, 'component'>; label: string }> = [
  { type: 'container', label: 'Frame' },
  { type: 'text', label: 'Text' },
  { type: 'button', label: 'Button' },
  { type: 'input', label: 'Input' },
  { type: 'textarea', label: 'Textarea' },
  { type: 'link', label: 'Link' },
  { type: 'divider', label: 'Divider' },
  { type: 'image', label: 'Image' },
]

const presets: Array<{ preset: PresetType; label: string }> = [
  { preset: 'navbar', label: 'Navbar' },
  { preset: 'hero', label: 'Hero section' },
  { preset: 'card', label: 'Card' },
  { preset: 'login-form', label: 'Login form' },
]

export function Topbar({ onOpenCode }: { onOpenCode: () => void }) {
  const viewport = useEditorStore((state) => state.viewport)
  const setViewport = useEditorStore((state) => state.setViewport)
  const zoom = useEditorStore((state) => state.zoom)
  const setZoom = useEditorStore((state) => state.setZoom)
  const showGrid = useEditorStore((state) => state.showGrid)
  const toggleGrid = useEditorStore((state) => state.toggleGrid)
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
  const selectedId = useEditorStore((state) => state.selectedId)
  const selectedIds = useEditorStore((state) => state.selectedIds)
  const projectComponents = useEditorStore((state) => state.projectComponents)
  const designSystem = useEditorStore((state) => state.designSystem)
  const addNode = useEditorStore((state) => state.addNode)
  const addPreset = useEditorStore((state) => state.addPreset)
  const duplicateNode = useEditorStore((state) => state.duplicateNode)
  const deleteSelected = useEditorStore((state) => state.deleteSelected)
  const groupSelected = useEditorStore((state) => state.groupSelected)
  const ungroupSelected = useEditorStore((state) => state.ungroupSelected)
  const copyStyle = useEditorStore((state) => state.copyStyle)
  const pasteStyle = useEditorStore((state) => state.pasteStyle)
  const copiedStyle = useEditorStore((state) => state.copiedStyle)
  const importInputRef = useRef<HTMLInputElement>(null)

  const selected = selectedId ? nodes[selectedId] : undefined
  const selectedProjectComponent =
    selected?.type === 'component'
      ? projectComponents.find((item) => item.id === selected.props.componentId)
      : undefined

  const insertionParent =
    selected?.type === 'container' || selectedProjectComponent?.acceptsChildren
      ? selectedId
      : null

  const viewportPresets: Array<{ value: Viewport; label: string }> = [
    { value: 'desktop', label: 'Desktop' },
    { value: 'tablet', label: 'Tablet' },
    { value: 'mobile', label: 'Mobile' },
  ]

  const exportDocument = () => {
    const payload: CodeCanvasProject = {
      version: 3,
      document: { nodes, rootIds },
      projectComponents,
      designSystem,
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
        loadProject(parsed.document, parsed.projectComponents, parsed.designSystem)
        return
      }

      if (
        parsed &&
        typeof parsed === 'object' &&
        (parsed as Partial<LegacyV2Project>).version === 2 &&
        isCanvasDocument((parsed as Partial<LegacyV2Project>).document) &&
        Array.isArray((parsed as Partial<LegacyV2Project>).projectComponents) &&
        ((parsed as Partial<LegacyV2Project>).projectComponents ?? []).every(isProjectComponent)
      ) {
        const legacy = parsed as LegacyV2Project
        loadProject(legacy.document, legacy.projectComponents, defaultDesignSystem)
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
      <div className="topbar-left">
        <div className="brand">
          <span className="brand-mark">C</span>
          <span>CodeCanvas</span>
          <small>v0.5</small>
        </div>

        <nav className="app-menu-bar">
          <Menu label="File">
            <MenuItem onClick={() => importInputRef.current?.click()}>Import project…</MenuItem>
            <MenuItem onClick={exportDocument}>Export project JSON</MenuItem>
            <div className="app-menu-separator" />
            <MenuItem onClick={loadDemo}>Load demo</MenuItem>
            <MenuItem onClick={clearCanvas}>New blank canvas</MenuItem>
            <div className="app-menu-separator" />
            <MenuItem onClick={onOpenCode}>View generated code</MenuItem>
          </Menu>

          <Menu label="Edit">
            <MenuItem disabled={!canUndo} shortcut="⌘Z" onClick={undo}>Undo</MenuItem>
            <MenuItem disabled={!canRedo} shortcut="⇧⌘Z" onClick={redo}>Redo</MenuItem>
            <div className="app-menu-separator" />
            <MenuItem disabled={!selectedId} shortcut="⌘D" onClick={() => selectedId && duplicateNode(selectedId)}>Duplicate</MenuItem>
            <MenuItem disabled={selectedIds.length < 2} shortcut="⌘G" onClick={groupSelected}>Group selection</MenuItem>
            <MenuItem disabled={!selectedId || selectedIds.length !== 1} shortcut="⇧⌘G" onClick={ungroupSelected}>Ungroup</MenuItem>
            <div className="app-menu-separator" />
            <MenuItem disabled={!selectedId} shortcut="⌥⌘C" onClick={() => selectedId && copyStyle(selectedId)}>Copy style</MenuItem>
            <MenuItem disabled={!selectedId || !copiedStyle} shortcut="⌥⌘V" onClick={() => selectedId && pasteStyle(selectedId)}>Paste style</MenuItem>
            <div className="app-menu-separator" />
            <MenuItem disabled={!selectedIds.length} shortcut="⌫" onClick={deleteSelected}>Delete selection</MenuItem>
          </Menu>

          <Menu label="Insert">
            <div className="app-menu-label">Basic</div>
            {builtIns.map((item) => (
              <MenuItem key={item.type} onClick={() => addNode(item.type, insertionParent)}>
                {item.label}
              </MenuItem>
            ))}
            <div className="app-menu-separator" />
            <div className="app-menu-label">Blocks</div>
            {presets.map((item) => (
              <MenuItem key={item.preset} onClick={() => addPreset(item.preset, insertionParent)}>
                {item.label}
              </MenuItem>
            ))}
          </Menu>

          <Menu label="View">
            <MenuItem onClick={toggleGrid}>{showGrid ? 'Hide layout grid' : 'Show layout grid'}</MenuItem>
            <div className="app-menu-separator" />
            {[0.5, 0.75, 1, 1.25, 1.5].map((value) => (
              <MenuItem key={value} onClick={() => setZoom(value)}>
                Zoom {Math.round(value * 100)}%
              </MenuItem>
            ))}
          </Menu>
        </nav>
      </div>

      <div className="viewport-switcher" aria-label="Canvas viewport">
        {viewportPresets.map((preset) => (
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
        <div className="zoom-control">
          <button onClick={() => setZoom(zoom - 0.1)} title="Zoom out">−</button>
          <span>{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(zoom + 0.1)} title="Zoom in">+</button>
        </div>
        <button className="ghost-button icon-action" onClick={undo} disabled={!canUndo} title="Undo">↶</button>
        <button className="ghost-button icon-action" onClick={redo} disabled={!canRedo} title="Redo">↷</button>
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
