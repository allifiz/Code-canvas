import { useDraggable } from '@dnd-kit/core'
import { useRef, useState, type ChangeEvent } from 'react'
import type {
  ComponentPropValue,
  NodeType,
  PresetType,
  ProjectComponentDefinition,
} from '../types'
import { useEditorStore } from '../store'

type BuiltInNodeType = Exclude<NodeType, 'component'>

const basics: Array<{ type: BuiltInNodeType; label: string; icon: string; description: string }> = [
  { type: 'container', label: 'Frame', icon: '□', description: 'Layout container' },
  { type: 'text', label: 'Text', icon: 'T', description: 'Heading or paragraph' },
  { type: 'button', label: 'Button', icon: '↗', description: 'Action button' },
  { type: 'input', label: 'Input', icon: '⌨', description: 'Single-line input' },
  { type: 'textarea', label: 'Textarea', icon: '≡', description: 'Multi-line input' },
  { type: 'link', label: 'Link', icon: '↗', description: 'Anchor link' },
  { type: 'divider', label: 'Divider', icon: '—', description: 'Visual separator' },
  { type: 'image', label: 'Image', icon: '▧', description: 'Responsive image' },
]

const blocks: Array<{ preset: PresetType; label: string; icon: string; description: string }> = [
  { preset: 'navbar', label: 'Navbar', icon: '☰', description: 'Brand, links and CTA' },
  { preset: 'hero', label: 'Hero', icon: '✦', description: 'Headline and actions' },
  { preset: 'card', label: 'Card', icon: '▤', description: 'Image content card' },
  { preset: 'login-form', label: 'Login', icon: '◫', description: 'Login form block' },
]

function DraggableAsset({
  id,
  data,
  icon,
  label,
  description,
}: {
  id: string
  data: Record<string, unknown>
  icon: string
  label: string
  description: string
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id, data })

  return (
    <button
      ref={setNodeRef}
      className={`palette-item ${isDragging ? 'dragging' : ''}`}
      style={transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined}
      {...listeners}
      {...attributes}
    >
      <span className="palette-icon">{icon}</span>
      <span>
        <strong>{label}</strong>
        <small>{description}</small>
      </span>
    </button>
  )
}

function ProjectComponentItem({
  component,
  onRemove,
}: {
  component: ProjectComponentDefinition
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `project-component-${component.id}`,
    data: { source: 'project-component', componentId: component.id },
  })

  return (
    <div className="project-component-row">
      <button
        ref={setNodeRef}
        className={`project-component-item ${isDragging ? 'dragging' : ''}`}
        style={transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined}
        {...listeners}
        {...attributes}
      >
        <span className="palette-icon">◆</span>
        <span>
          <strong>{component.name}</strong>
          <small>{component.importPath}</small>
        </span>
      </button>
      <button className="project-remove" onClick={onRemove} title={`Remove ${component.name}`}>×</button>
    </div>
  )
}

function ProjectComponentForm({ onDone }: { onDone: () => void }) {
  const addProjectComponent = useEditorStore((state) => state.addProjectComponent)
  const projectComponents = useEditorStore((state) => state.projectComponents)
  const [name, setName] = useState('')
  const [importPath, setImportPath] = useState('')
  const [exportName, setExportName] = useState('')
  const [defaultProps, setDefaultProps] = useState('{}')
  const [acceptsChildren, setAcceptsChildren] = useState(false)
  const [error, setError] = useState('')

  const submit = () => {
    setError('')

    if (!name.trim() || !importPath.trim()) {
      setError('Name and import path are required.')
      return
    }

    const identifier = /^[A-Za-z_$][A-Za-z0-9_$]*$/
    if (!identifier.test(name.trim())) {
      setError('Use a valid React component name, for example PricingCard.')
      return
    }

    if (exportName.trim() && !identifier.test(exportName.trim())) {
      setError('Named export must be a valid JavaScript identifier.')
      return
    }

    if (projectComponents.some((component) => component.name === name.trim())) {
      setError('A project component with this local name already exists.')
      return
    }

    let props: Record<string, ComponentPropValue>

    try {
      const parsed = JSON.parse(defaultProps) as unknown
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error()
      const valid = Object.values(parsed).every(
        (value) => typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean',
      )
      if (!valid) throw new Error()
      props = parsed as Record<string, ComponentPropValue>
    } catch {
      setError('Default props must be a flat JSON object.')
      return
    }

    addProjectComponent({
      name,
      importPath,
      exportName: exportName || undefined,
      defaultProps: props,
      acceptsChildren,
    })
    onDone()
  }

  return (
    <div className="project-component-form">
      <label><span>Name</span><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Button" /></label>
      <label><span>Import path</span><input value={importPath} onChange={(e) => setImportPath(e.target.value)} placeholder="@/components/ui/button" /></label>
      <label><span>Named export</span><input value={exportName} onChange={(e) => setExportName(e.target.value)} placeholder="Button (blank = default)" /></label>
      <label><span>Default props JSON</span><textarea value={defaultProps} onChange={(e) => setDefaultProps(e.target.value)} rows={3} /></label>
      <label className="project-checkbox">
        <input type="checkbox" checked={acceptsChildren} onChange={(e) => setAcceptsChildren(e.target.checked)} />
        <span>Accepts children</span>
      </label>
      {error && <p className="project-form-error">{error}</p>}
      <div className="project-form-actions">
        <button className="ghost-button" onClick={onDone}>Cancel</button>
        <button className="primary-button" onClick={submit}>Add</button>
      </div>
    </div>
  )
}

function LayerNode({ id, depth = 0 }: { id: string; depth?: number }) {
  const node = useEditorStore((state) => state.nodes[id])
  const selectedId = useEditorStore((state) => state.selectedId)
  const selectNode = useEditorStore((state) => state.selectNode)
  const projectComponents = useEditorStore((state) => state.projectComponents)

  if (!node) return null

  const customComponent =
    node.type === 'component'
      ? projectComponents.find((component) => component.id === node.props.componentId)
      : undefined

  const label = customComponent?.name ?? (
    node.type === 'container' ? 'Frame' :
    node.type.charAt(0).toUpperCase() + node.type.slice(1)
  )

  return (
    <>
      <button
        className={`layer-row ${selectedId === id ? 'active' : ''}`}
        style={{ paddingLeft: 12 + depth * 14 }}
        onClick={() => selectNode(id)}
      >
        <span className="layer-dot" />
        <span>{label}</span>
        <code>{id.slice(0, 5)}</code>
      </button>
      {node.children.map((childId) => <LayerNode key={childId} id={childId} depth={depth + 1} />)}
    </>
  )
}

export function Sidebar() {
  const rootIds = useEditorStore((state) => state.rootIds)
  const nodes = useEditorStore((state) => state.nodes)
  const projectComponents = useEditorStore((state) => state.projectComponents)
  const removeProjectComponent = useEditorStore((state) => state.removeProjectComponent)
  const replaceProjectComponents = useEditorStore((state) => state.replaceProjectComponents)
  const [tab, setTab] = useState<'layers' | 'assets'>('assets')
  const [addingComponent, setAddingComponent] = useState(false)
  const manifestInputRef = useRef<HTMLInputElement>(null)

  const removeComponent = (componentId: string) => {
    const inUse = Object.values(nodes).some(
      (node) => node.type === 'component' && node.props.componentId === componentId,
    )

    if (inUse) {
      window.alert('This project component is still used on the canvas. Delete those nodes first.')
      return
    }

    removeProjectComponent(componentId)
  }

  const importManifest = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    try {
      const parsed = JSON.parse(await file.text()) as { version?: unknown; components?: unknown }
      if (parsed.version !== 1 || !Array.isArray(parsed.components)) throw new Error()

      const imported = parsed.components.filter((value): value is ProjectComponentDefinition => {
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
          Object.values(component.defaultProps).every(
            (prop) => typeof prop === 'string' || typeof prop === 'number' || typeof prop === 'boolean',
          )
        )
      })

      if (imported.length !== parsed.components.length) throw new Error()

      const merged = [...projectComponents]
      for (const component of imported) {
        const existingIndex = merged.findIndex((item) => item.name === component.name)
        if (existingIndex >= 0) merged[existingIndex] = component
        else merged.push(component)
      }

      replaceProjectComponents(merged)
    } catch {
      window.alert('Could not import this component manifest.')
    }
  }

  return (
    <aside className="sidebar panel">
      <div className="sidebar-tabs">
        <button className={tab === 'layers' ? 'active' : ''} onClick={() => setTab('layers')}>Layers</button>
        <button className={tab === 'assets' ? 'active' : ''} onClick={() => setTab('assets')}>Assets</button>
      </div>

      {tab === 'layers' ? (
        <section className="layers-section sidebar-tab-content">
          <div className="panel-title">
            <span>Layers</span>
            <small>{Object.keys(nodes).length} nodes</small>
          </div>
          <div className="layers-list">
            {rootIds.length ? rootIds.map((id) => <LayerNode key={id} id={id} />) : <p className="empty-small">No layers yet.</p>}
          </div>
        </section>
      ) : (
        <div className="sidebar-tab-content">
          <section>
            <div className="panel-title"><span>Blocks</span><small>drag a complete section</small></div>
            <div className="asset-grid blocks-grid">
              {blocks.map((item) => (
                <DraggableAsset
                  key={item.preset}
                  id={`preset-${item.preset}`}
                  data={{ source: 'preset', preset: item.preset }}
                  icon={item.icon}
                  label={item.label}
                  description={item.description}
                />
              ))}
            </div>
          </section>

          <section className="asset-section">
            <div className="panel-title"><span>Basics</span><small>primitives</small></div>
            <div className="asset-grid">
              {basics.map((item) => (
                <DraggableAsset
                  key={item.type}
                  id={`palette-${item.type}`}
                  data={{ source: 'palette', type: item.type }}
                  icon={item.icon}
                  label={item.label}
                  description={item.description}
                />
              ))}
            </div>
          </section>

          <section className="project-section">
            <div className="panel-title">
              <span>Project</span>
              <div className="panel-title-actions">
                <button className="panel-add-button" onClick={() => manifestInputRef.current?.click()}>Import</button>
                <button className="panel-add-button" onClick={() => setAddingComponent((value) => !value)}>
                  {addingComponent ? 'Close' : '+ Add'}
                </button>
              </div>
            </div>

            <input
              ref={manifestInputRef}
              className="visually-hidden"
              type="file"
              accept="application/json,.json"
              onChange={importManifest}
              tabIndex={-1}
            />

            {addingComponent && <ProjectComponentForm onDone={() => setAddingComponent(false)} />}

            <div className="project-component-list">
              {projectComponents.length ? (
                projectComponents.map((component) => (
                  <ProjectComponentItem
                    key={component.id}
                    component={component}
                    onRemove={() => removeComponent(component.id)}
                  />
                ))
              ) : (
                <p className="empty-small">Register or import React components, then drag them into the canvas.</p>
              )}
            </div>
          </section>
        </div>
      )}
    </aside>
  )
}
