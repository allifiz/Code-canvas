import { useDraggable, useDroppable } from '@dnd-kit/core'
import {
  Fragment,
  useState,
  type CSSProperties,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { useEditorStore } from '../store'
import type { CanvasNode, NodeProps, ProjectComponentDefinition } from '../types'

const viewportWidths = {
  desktop: 1200,
  tablet: 768,
  mobile: 390,
}

type SizePreview = Pick<NodeProps, 'width' | 'height'>

function shadowValue(node: CanvasNode) {
  const p = node.props
  if (!p.shadowBlur && !p.shadowSpread && !p.shadowX && !p.shadowY) return undefined

  return `${p.shadowX ?? 0}px ${p.shadowY ?? 0}px ${p.shadowBlur ?? 0}px ${p.shadowSpread ?? 0}px ${p.shadowColor ?? '#000000'}`
}

function nodeStyle(node: CanvasNode, preview?: SizePreview | null): CSSProperties {
  const p = node.props

  const base: CSSProperties = {
    width: preview?.width ?? p.width,
    height: preview?.height ?? p.height,
    minWidth: p.minWidth,
    minHeight: p.minHeight,
    maxWidth: p.maxWidth,
    maxHeight: p.maxHeight,

    paddingTop: p.paddingTop ?? p.padding,
    paddingRight: p.paddingRight ?? p.padding,
    paddingBottom: p.paddingBottom ?? p.padding,
    paddingLeft: p.paddingLeft ?? p.padding,

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

function ContainerContent({
  node,
  preview,
}: {
  node: CanvasNode
  preview?: SizePreview | null
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `drop-${node.id}`,
    data: { parentId: node.id },
  })

  const direction =
    node.props.display === 'flex' && node.props.direction === 'row'
      ? 'row'
      : 'column'

  return (
    <div ref={setNodeRef} className={`container-content ${isOver ? 'drop-active' : ''}`} style={nodeStyle(node, preview)}>
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
  preview,
}: {
  node: CanvasNode
  component?: ProjectComponentDefinition
  preview?: SizePreview | null
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `drop-${node.id}`,
    data: { parentId: node.id },
    disabled: !component?.acceptsChildren,
  })

  if (!component) {
    return (
      <div className="project-node missing" style={nodeStyle(node, preview)}>
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
      style={nodeStyle(node, preview)}
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
  const updateNode = useEditorStore((state) => state.updateNode)
  const zoom = useEditorStore((state) => state.zoom)
  const projectComponents = useEditorStore((state) => state.projectComponents)
  const [previewSize, setPreviewSize] = useState<SizePreview | null>(null)

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `node-${id}`,
    data: { source: 'canvas', nodeId: id },
  })

  if (!node) return null

  const handleClick = (event: MouseEvent) => {
    event.stopPropagation()
    selectNode(id)
  }

  const startResize = (
    mode: 'width' | 'height' | 'both',
    event: ReactPointerEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault()
    event.stopPropagation()

    const wrapper = event.currentTarget.parentElement
    if (!wrapper) return

    const rect = wrapper.getBoundingClientRect()
    const safeZoom = zoom || 1
    const startWidth = rect.width / safeZoom
    const startHeight = rect.height / safeZoom
    const startX = event.clientX
    const startY = event.clientY
    let latest: SizePreview = {}

    document.body.classList.add('is-resizing')

    const move = (pointerEvent: PointerEvent) => {
      const deltaX = (pointerEvent.clientX - startX) / safeZoom
      const deltaY = (pointerEvent.clientY - startY) / safeZoom
      const next: SizePreview = {}

      if (mode === 'width' || mode === 'both') {
        next.width = `${Math.max(20, Math.round(startWidth + deltaX))}px`
      }

      if (mode === 'height' || mode === 'both') {
        next.height = `${Math.max(20, Math.round(startHeight + deltaY))}px`
      }

      latest = next
      setPreviewSize(next)
    }

    const end = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', end)
      document.body.classList.remove('is-resizing')

      if (Object.keys(latest).length) {
        updateNode(id, latest)
      }

      setPreviewSize(null)
    }

    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', end, { once: true })
  }

  const visualWidth = previewSize?.width ?? node.props.width
  const visualHeight = previewSize?.height ?? node.props.height
  const intrinsicWidth = node.type === 'text' || node.type === 'button' || node.type === 'link'

  const transformStyle: CSSProperties = {
    width: visualWidth === 'auto' || (!visualWidth && intrinsicWidth) ? 'fit-content' : visualWidth,
    height: visualHeight === 'auto' ? undefined : visualHeight,
    maxWidth: '100%',
    marginTop: node.props.marginTop,
    marginRight: node.props.marginRight,
    marginBottom: node.props.marginBottom,
    marginLeft: node.props.marginLeft,
    ...(transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : {}),
  }

  const content = (() => {
    switch (node.type) {
      case 'container':
        return <ContainerContent node={node} preview={previewSize} />

      case 'text':
        return <div style={nodeStyle(node, previewSize)}>{node.props.text}</div>

      case 'button':
        return (
          <button className="canvas-button" style={nodeStyle(node, previewSize)} type="button">
            {node.props.text}
          </button>
        )

      case 'input':
        return <input className="canvas-input" style={nodeStyle(node, previewSize)} placeholder={node.props.placeholder} readOnly />

      case 'textarea':
        return <textarea className="canvas-input canvas-textarea" style={nodeStyle(node, previewSize)} placeholder={node.props.placeholder} readOnly />

      case 'link':
        return (
          <a
            className="canvas-link"
            style={nodeStyle(node, previewSize)}
            href={node.props.href ?? '#'}
            onClick={(linkEvent) => linkEvent.preventDefault()}
          >
            {node.props.text}
          </a>
        )

      case 'divider':
        return <div className="canvas-divider" style={nodeStyle(node, previewSize)} />

      case 'image':
        return <img className="canvas-image" style={nodeStyle(node, previewSize)} src={node.props.src} alt={node.props.alt ?? ''} />

      case 'component': {
        const component = projectComponents.find((item) => item.id === node.props.componentId)
        return <ProjectComponentContent node={node} component={component} preview={previewSize} />
      }
    }
  })()

  const componentLabel =
    node.type === 'component'
      ? projectComponents.find((item) => item.id === node.props.componentId)?.name ?? 'component'
      : node.type === 'container'
        ? 'Frame'
        : node.type

  const isSelected = selectedId === id

  return (
    <div
      ref={setNodeRef}
      className={`canvas-node ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
      style={transformStyle}
      onClick={handleClick}
      {...listeners}
      {...attributes}
    >
      <span className="node-tag">{componentLabel}</span>
      {content}

      {isSelected && !isDragging && (
        <>
          <button
            className="resize-handle resize-east"
            aria-label="Resize width"
            onPointerDown={(event) => startResize('width', event)}
          />
          <button
            className="resize-handle resize-south"
            aria-label="Resize height"
            onPointerDown={(event) => startResize('height', event)}
          />
          <button
            className="resize-handle resize-southeast"
            aria-label="Resize width and height"
            onPointerDown={(event) => startResize('both', event)}
          />
        </>
      )}
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
