import { useDraggable } from '@dnd-kit/core'
import type { NodeType } from '../types'
import { useEditorStore } from '../store'

const palette: Array<{ type: NodeType; label: string; icon: string; description: string }> = [
  { type: 'container', label: 'Container', icon: '□', description: 'Flex layout wrapper' },
  { type: 'text', label: 'Text', icon: 'T', description: 'Heading or paragraph' },
  { type: 'button', label: 'Button', icon: '↗', description: 'Interactive action' },
  { type: 'input', label: 'Input', icon: '⌨', description: 'Text field' },
  { type: 'image', label: 'Image', icon: '▧', description: 'Responsive image' },
]

function PaletteItem({ item }: { item: (typeof palette)[number] }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `palette-${item.type}`,
    data: { source: 'palette', type: item.type },
  })

  return (
    <button
      ref={setNodeRef}
      className={`palette-item ${isDragging ? 'dragging' : ''}`}
      style={transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined}
      {...listeners}
      {...attributes}
    >
      <span className="palette-icon">{item.icon}</span>
      <span>
        <strong>{item.label}</strong>
        <small>{item.description}</small>
      </span>
    </button>
  )
}

function LayerNode({ id, depth = 0 }: { id: string; depth?: number }) {
  const node = useEditorStore((state) => state.nodes[id])
  const selectedId = useEditorStore((state) => state.selectedId)
  const selectNode = useEditorStore((state) => state.selectNode)
  if (!node) return null

  return (
    <>
      <button
        className={`layer-row ${selectedId === id ? 'active' : ''}`}
        style={{ paddingLeft: 12 + depth * 14 }}
        onClick={() => selectNode(id)}
      >
        <span className="layer-dot" />
        <span>{node.type}</span>
        <code>{id.slice(0, 5)}</code>
      </button>
      {node.children.map((childId) => (
        <LayerNode key={childId} id={childId} depth={depth + 1} />
      ))}
    </>
  )
}

export function Sidebar() {
  const rootIds = useEditorStore((state) => state.rootIds)

  return (
    <aside className="sidebar panel">
      <section>
        <div className="panel-title">
          <span>Components</span>
          <small>drag to canvas</small>
        </div>
        <div className="palette-grid">
          {palette.map((item) => (
            <PaletteItem key={item.type} item={item} />
          ))}
        </div>
      </section>

      <section className="layers-section">
        <div className="panel-title">
          <span>Layers</span>
          <small>{rootIds.length} root</small>
        </div>
        <div className="layers-list">
          {rootIds.length ? rootIds.map((id) => <LayerNode key={id} id={id} />) : <p className="empty-small">No layers yet.</p>}
        </div>
      </section>
    </aside>
  )
}
