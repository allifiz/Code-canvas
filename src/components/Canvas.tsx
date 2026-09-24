import { useDraggable, useDroppable } from '@dnd-kit/core'
import { Fragment, type CSSProperties, type MouseEvent } from 'react'
import { useEditorStore } from '../store'
import type { CanvasNode, ProjectComponentDefinition } from '../types'

const viewportWidths = {
  desktop: 1200,
  tablet: 768,
  mobile: 390,
}

function nodeStyle(node: CanvasNode): CSSProperties {
  const p = node.props
  const base: CSSProperties = {
    width: p.width,
    minHeight: p.minHeight,
    padding: p.padding,
    gap: p.gap,
    background: p.background,
    color: p.color,
    fontSize: p.fontSize,
    fontWeight: p.fontWeight,
    borderRadius: p.radius,
    borderColor: p.borderColor,
    borderStyle: p.borderColor ? 'solid' : undefined,
    borderWidth: p.borderColor ? 1 : undefined,
    boxSizing: 'border-box',
  }

  if (node.type === 'container') {
    base.display = p.display
    base.flexDirection = p.direction
    base.alignItems = p.align
    base.justifyContent = p.justify
  }

  return base
}

function InsertZone({
  parentId,
  index,
  direction = 'column',
}: {
  parentId: string | null
  index: number
  direction?: 'row' | 'column'
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `insert-${parentId ?? 'root'}-${index}`,
    data: { parentId, index, kind: 'insert' },
  })

  return (
    <div
      ref={setNodeRef}
      className={`insert-zone ${direction} ${isOver ? 'active' : ''}`}
      aria-hidden="true"
    >
      <span />
    </div>
  )
}

function ChildrenList({
  node,
  direction = 'column',
}: {
  node: CanvasNode
  direction?: 'row' | 'column'
}) {
  return (
    <>
      {node.children.map((childId, index) => (
        <Fragment key={childId}>
          <InsertZone parentId={node.id} index={index} direction={direction} />
          <CanvasItem id={childId} />
        </Fragment>
      ))}
      <InsertZone parentId={node.id} index={node.children.length} direction={direction} />
    </>
  )
}

function ContainerContent({ node }: { node: CanvasNode }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `drop-${node.id}`,
    data: { parentId: node.id },
  })

  return (
    <div ref={setNodeRef} className={`container-content ${isOver ? 'drop-active' : ''}`} style={nodeStyle(node)}>
      {node.children.length ? (
        <ChildrenList node={node} direction={node.props.direction ?? 'column'} />
      ) : (
        <div className="container-placeholder">Drop components here</div>
      )}
    </div>
  )
}

function ProjectComponentContent({
  node,
  component,
}: {
  node: CanvasNode
  component?: ProjectComponentDefinition
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `drop-${node.id}`,
    data: { parentId: node.id },
    disabled: !component?.acceptsChildren,
  })

  if (!component) {
    return (
      <div className="project-node missing" style={nodeStyle(node)}>
        <strong>Missing project component</strong>
        <small>Re-register the component used by this node.</small>
      </div>
    )
  }

  const entries = Object.entries(node.props.componentProps ?? {})

  return (
    <div
      ref={setNodeRef}
      className={`project-node ${component.acceptsChildren ? 'accepts-children' : ''} ${isOver ? 'drop-active' : ''}`}
      style={nodeStyle(node)}
    >
      <div className="project-node-header">
        <span className="project-node-icon">◆</span>
        <div>
          <strong>{component.name}</strong>
          <small>{component.importPath}</small>
        </div>
      </div>

      {entries.length > 0 && (
        <div className="project-node-props">
          {entries.map(([key, value]) => (
            <code key={key}>{key}={JSON.stringify(value)}</code>
          ))}
        </div>
      )}

      {component.acceptsChildren && (
        <div className="project-node-children">
          {node.children.length ? (
            <ChildrenList node={node} />
          ) : (
            <div className="container-placeholder">Drop children into {component.name}</div>
          )}
        </div>
      )}
    </div>
  )
}

function CanvasItem({ id }: { id: string }) {
  const node = useEditorStore((state) => state.nodes[id])
  const selectedId = useEditorStore((state) => state.selectedId)
  const selectNode = useEditorStore((state) => state.selectNode)
  const projectComponents = useEditorStore((state) => state.projectComponents)
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `node-${id}`,
    data: { source: 'canvas', nodeId: id },
  })

  if (!node) return null

  const handleClick = (event: MouseEvent) => {
    event.stopPropagation()
    selectNode(id)
  }

  const transformStyle: CSSProperties | undefined = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined

  const content = (() => {
    switch (node.type) {
      case 'container':
        return <ContainerContent node={node} />
      case 'text':
        return <div style={nodeStyle(node)}>{node.props.text}</div>
      case 'button':
        return (
          <button className="canvas-button" style={nodeStyle(node)} type="button">
            {node.props.text}
          </button>
        )
      case 'input':
        return <input className="canvas-input" style={nodeStyle(node)} placeholder={node.props.placeholder} readOnly />
      case 'image':
        return <img className="canvas-image" style={nodeStyle(node)} src={node.props.src} alt={node.props.alt ?? ''} />
      case 'component': {
        const component = projectComponents.find((item) => item.id === node.props.componentId)
        return <ProjectComponentContent node={node} component={component} />
      }
    }
  })()

  const componentLabel =
    node.type === 'component'
      ? projectComponents.find((item) => item.id === node.props.componentId)?.name ?? 'component'
      : node.type

  return (
    <div
      ref={setNodeRef}
      className={`canvas-node ${selectedId === id ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
      style={transformStyle}
      onClick={handleClick}
      {...listeners}
      {...attributes}
    >
      <span className="node-tag">{componentLabel}</span>
      {content}
    </div>
  )
}

export function Canvas() {
  const rootIds = useEditorStore((state) => state.rootIds)
  const viewport = useEditorStore((state) => state.viewport)
  const selectNode = useEditorStore((state) => state.selectNode)
  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas-root',
    data: { parentId: null },
  })

  return (
    <main className="workspace" onClick={() => selectNode(null)}>
      <div className="viewport-label">
        <span>{viewport}</span>
        <code>{viewportWidths[viewport]} px</code>
      </div>
      <div className="canvas-scroll">
        <div
          ref={setNodeRef}
          className={`canvas ${isOver ? 'drop-active-root' : ''}`}
          style={{ width: viewportWidths[viewport] }}
        >
          {rootIds.length ? (
            <>
              {rootIds.map((id, index) => (
                <Fragment key={id}>
                  <InsertZone parentId={null} index={index} />
                  <CanvasItem id={id} />
                </Fragment>
              ))}
              <InsertZone parentId={null} index={rootIds.length} />
            </>
          ) : (
            <div className="empty-canvas">
              <div className="empty-mark">+</div>
              <h2>Start with a component</h2>
              <p>Drag a built-in or project component from the left panel.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
