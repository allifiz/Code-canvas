import { useDraggable, useDroppable } from '@dnd-kit/core'
import { Fragment, type CSSProperties, type MouseEvent } from 'react'
import { useEditorStore } from '../store'
import type { CanvasNode } from '../types'

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

function InsertZone({ parentId, index }: { parentId: string | null; index: number }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `insert-${parentId ?? 'root'}-${index}`,
    data: { parentId, index, kind: 'insert' },
  })

  return (
    <div ref={setNodeRef} className={`insert-zone ${isOver ? 'active' : ''}`}>
      <span />
    </div>
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
        <>
          {node.children.map((childId, index) => (
            <Fragment key={childId}>
              <InsertZone parentId={node.id} index={index} />
              <CanvasItem id={childId} />
            </Fragment>
          ))}
          <InsertZone parentId={node.id} index={node.children.length} />
        </>
      ) : (
        <div className="container-placeholder">Drop components here</div>
      )}
    </div>
  )
}

function CanvasItem({ id }: { id: string }) {
  const node = useEditorStore((state) => state.nodes[id])
  const selectedId = useEditorStore((state) => state.selectedId)
  const selectNode = useEditorStore((state) => state.selectNode)
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
    }
  })()

  return (
    <div
      ref={setNodeRef}
      className={`canvas-node ${selectedId === id ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
      style={transformStyle}
      onClick={handleClick}
      {...listeners}
      {...attributes}
    >
      <span className="node-tag">{node.type}</span>
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
              <p>Drag a container, text, button, input, or image from the left panel.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
