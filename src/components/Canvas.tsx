import { useDraggable, useDroppable } from '@dnd-kit/core'
import { Fragment, type CSSProperties, type MouseEvent } from 'react'
import { useEditorStore } from '../store'
import type { CanvasNode, ProjectComponentDefinition } from '../types'

const viewportWidths = {
  desktop: 1200,
  tablet: 768,
  mobile: 390,
}

function shadowValue(node: CanvasNode) {
  const p = node.props
  if (!p.shadowBlur && !p.shadowSpread && !p.shadowX && !p.shadowY) return undefined

  return `${p.shadowX ?? 0}px ${p.shadowY ?? 0}px ${p.shadowBlur ?? 0}px ${p.shadowSpread ?? 0}px ${p.shadowColor ?? '#000000'}`
}

function nodeStyle(node: CanvasNode): CSSProperties {
  const p = node.props

  const base: CSSProperties = {
    width: p.width,
    height: p.height,
    minWidth: p.minWidth,
    minHeight: p.minHeight,
    maxWidth: p.maxWidth,
    maxHeight: p.maxHeight,

    paddingTop: p.paddingTop ?? p.padding,
    paddingRight: p.paddingRight ?? p.padding,
    paddingBottom: p.paddingBottom ?? p.padding,
    paddingLeft: p.paddingLeft ?? p.padding,

    marginTop: p.marginTop,
    marginRight: p.marginRight,
    marginBottom: p.marginBottom,
    marginLeft: p.marginLeft,

    background: p.background,
    color: p.color,
    opacity: p.opacity,

    fontFamily: p.fontFamily,
    fontSize: p.fontSize,
    fontWeight: p.fontWeight,
    lineHeight: p.lineHeight,
    letterSpacing: p.letterSpacing,
    textAlign: p.textAlign,
    textTransform: p.textTransform,
    textDecoration: p.textDecoration,

    borderTopLeftRadius: p.radiusTopLeft ?? p.radius,
    borderTopRightRadius: p.radiusTopRight ?? p.radius,
    borderBottomRightRadius: p.radiusBottomRight ?? p.radius,
    borderBottomLeftRadius: p.radiusBottomLeft ?? p.radius,

    borderColor: p.borderColor,
    borderStyle: p.borderStyle,
    borderWidth: p.borderStyle === 'none' ? 0 : p.borderWidth,

    boxShadow: shadowValue(node),
    overflow: p.overflow,
    boxSizing: 'border-box',
  }

  if (node.type === 'container') {
    base.display = p.display
    base.gap = p.gap

    if (p.display === 'flex') {
      base.flexDirection = p.direction
      base.alignItems = p.align
      base.justifyContent = p.justify
    }

    if (p.display === 'grid') {
      base.gridTemplateColumns = `repeat(${Math.max(1, p.gridColumns ?? 2)}, minmax(0, 1fr))`
    }
  }

  if (node.type === 'image') {
    base.objectFit = p.objectFit
    base.objectPosition = p.objectPosition
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

  const direction =
    node.props.display === 'flex' && node.props.direction === 'row'
      ? 'row'
      : 'column'

  return (
    <div ref={setNodeRef} className={`container-content ${isOver ? 'drop-active' : ''}`} style={nodeStyle(node)}>
      {node.children.length ? (
        <ChildrenList node={node} direction={direction} />
      ) : (
        <div className="container-placeholder">Drop layers here</div>
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

      case 'textarea':
        return <textarea className="canvas-input canvas-textarea" style={nodeStyle(node)} placeholder={node.props.placeholder} readOnly />

      case 'link':
        return (
          <a
            className="canvas-link"
            style={nodeStyle(node)}
            href={node.props.href ?? '#'}
            onClick={(event) => event.preventDefault()}
          >
            {node.props.text}
          </a>
        )

      case 'divider':
        return <div className="canvas-divider" style={nodeStyle(node)} />

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
      : node.type === 'container'
        ? 'Frame'
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
  const zoom = useEditorStore((state) => state.zoom)
  const showGrid = useEditorStore((state) => state.showGrid)
  const selectNode = useEditorStore((state) => state.selectNode)
  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas-root',
    data: { parentId: null },
  })

  return (
    <main className={`workspace ${showGrid ? '' : 'grid-hidden'}`} onClick={() => selectNode(null)}>
      <div className="viewport-label">
        <span>{viewport}</span>
        <code>{viewportWidths[viewport]} px · {Math.round(zoom * 100)}%</code>
      </div>

      <div className="canvas-scroll">
        <div className="canvas-zoom-stage" style={{ width: viewportWidths[viewport], transform: `scale(${zoom})` }}>
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
                <h2>Start designing</h2>
                <p>Drag a block or primitive from Assets, or use Insert from the menu bar.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
