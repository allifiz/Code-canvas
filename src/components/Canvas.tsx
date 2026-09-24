import { useDraggable, useDroppable } from '@dnd-kit/core'
import {
  Fragment,
  useEffect,
  useRef,
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

type SizePreview = Pick<NodeProps, 'width' | 'height' | 'translateX' | 'translateY'>
type ResizeMode = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

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
  const selectedIds = useEditorStore((state) => state.selectedIds)
  const selectNode = useEditorStore((state) => state.selectNode)
  const updateNode = useEditorStore((state) => state.updateNode)
  const zoom = useEditorStore((state) => state.zoom)
  const projectComponents = useEditorStore((state) => state.projectComponents)
  const [previewSize, setPreviewSize] = useState<SizePreview | null>(null)
  const [snapGuide, setSnapGuide] = useState<{ vertical: boolean; horizontal: boolean }>({
    vertical: false,
    horizontal: false,
  })
  const [editingText, setEditingText] = useState(false)
  const textEditorRef = useRef<HTMLDivElement>(null)

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `node-${id}`,
    data: { source: 'canvas', nodeId: id },
    disabled: !!node?.locked || editingText,
  })

  useEffect(() => {
    if (!editingText) return
    textEditorRef.current?.focus()
  }, [editingText])

  if (!node || node.visible === false) return null

  const handleClick = (event: MouseEvent) => {
    event.stopPropagation()
    if (node.locked) return
    selectNode(id, event.shiftKey)
  }

  const handleDoubleClick = (event: MouseEvent) => {
    event.stopPropagation()
    if (node.locked || node.type !== 'text') return
    selectNode(id)
    setEditingText(true)
  }

  const startResize = (
    mode: ResizeMode,
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
    const startTranslateX = node.props.translateX ?? 0
    const startTranslateY = node.props.translateY ?? 0
    const startX = event.clientX
    const startY = event.clientY
    const aspectRatio = startWidth / Math.max(1, startHeight)
    let latest: SizePreview = {}

    const otherRects = Array.from(
      document.querySelectorAll<HTMLElement>('[data-canvas-node-id]'),
    )
      .filter((element) => element !== wrapper)
      .map((element) => element.getBoundingClientRect())
      .filter((candidate) => candidate.width > 0 && candidate.height > 0)

    const xCandidates = otherRects.flatMap((candidate) => [
      candidate.left,
      candidate.right,
      candidate.left + candidate.width / 2,
    ])
    const yCandidates = otherRects.flatMap((candidate) => [
      candidate.top,
      candidate.bottom,
      candidate.top + candidate.height / 2,
    ])

    const nearestSnap = (value: number, candidates: number[]) => {
      let nearest: number | null = null
      let nearestDistance = 7

      for (const candidate of candidates) {
        const distance = Math.abs(candidate - value)
        if (distance < nearestDistance) {
          nearest = candidate
          nearestDistance = distance
        }
      }

      return nearest
    }

    const east = mode.includes('e')
    const west = mode.includes('w')
    const north = mode.includes('n')
    const south = mode.includes('s')

    document.body.classList.add('is-resizing')

    const move = (pointerEvent: PointerEvent) => {
      const deltaX = (pointerEvent.clientX - startX) / safeZoom
      const deltaY = (pointerEvent.clientY - startY) / safeZoom
      const next: SizePreview = {}
      let vertical = false
      let horizontal = false

      if (east || west) {
        let effectiveDeltaX = deltaX
        let width = east
          ? startWidth + effectiveDeltaX
          : startWidth - effectiveDeltaX

        if (width < 20) {
          width = 20
          effectiveDeltaX = east ? 20 - startWidth : startWidth - 20
        }

        const rawEdge = east
          ? rect.right + effectiveDeltaX * safeZoom
          : rect.left + effectiveDeltaX * safeZoom
        const snappedX = nearestSnap(rawEdge, xCandidates)

        if (snappedX !== null) {
          if (east) {
            width = Math.max(20, (snappedX - rect.left) / safeZoom)
          } else {
            effectiveDeltaX = (snappedX - rect.left) / safeZoom
            width = Math.max(20, startWidth - effectiveDeltaX)
          }
          vertical = true
        } else {
          const gridWidth = Math.round(width / 8) * 8
          if (Math.abs(gridWidth - width) <= 2) {
            width = Math.max(20, gridWidth)
            if (west) effectiveDeltaX = startWidth - width
          }
        }

        next.width = `${Math.round(width)}px`
        if (west) next.translateX = Math.round(startTranslateX + effectiveDeltaX)
      }

      if (north || south) {
        let effectiveDeltaY = deltaY
        let height = south
          ? startHeight + effectiveDeltaY
          : startHeight - effectiveDeltaY

        if (height < 20) {
          height = 20
          effectiveDeltaY = south ? 20 - startHeight : startHeight - 20
        }

        const rawEdge = south
          ? rect.bottom + effectiveDeltaY * safeZoom
          : rect.top + effectiveDeltaY * safeZoom
        const snappedY = nearestSnap(rawEdge, yCandidates)

        if (snappedY !== null) {
          if (south) {
            height = Math.max(20, (snappedY - rect.top) / safeZoom)
          } else {
            effectiveDeltaY = (snappedY - rect.top) / safeZoom
            height = Math.max(20, startHeight - effectiveDeltaY)
          }
          horizontal = true
        } else {
          const gridHeight = Math.round(height / 8) * 8
          if (Math.abs(gridHeight - height) <= 2) {
            height = Math.max(20, gridHeight)
            if (north) effectiveDeltaY = startHeight - height
          }
        }

        next.height = `${Math.round(height)}px`
        if (north) next.translateY = Math.round(startTranslateY + effectiveDeltaY)
      }

      if (pointerEvent.shiftKey && (east || west) && (north || south)) {
        const currentWidth = Number.parseFloat(next.width ?? `${startWidth}`)
        const currentHeight = Number.parseFloat(next.height ?? `${startHeight}`)
        const widthChange = Math.abs(currentWidth - startWidth) / Math.max(1, startWidth)
        const heightChange = Math.abs(currentHeight - startHeight) / Math.max(1, startHeight)

        if (widthChange >= heightChange) {
          const lockedHeight = Math.max(20, currentWidth / aspectRatio)
          next.height = `${Math.round(lockedHeight)}px`
          if (north) next.translateY = Math.round(startTranslateY + (startHeight - lockedHeight))
        } else {
          const lockedWidth = Math.max(20, currentHeight * aspectRatio)
          next.width = `${Math.round(lockedWidth)}px`
          if (west) next.translateX = Math.round(startTranslateX + (startWidth - lockedWidth))
        }
      }

      latest = next
      setSnapGuide({ vertical, horizontal })
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
      setSnapGuide({ vertical: false, horizontal: false })
    }

    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', end, { once: true })
  }

  const visualWidth = previewSize?.width ?? node.props.width
  const visualHeight = previewSize?.height ?? node.props.height
  const intrinsicWidth = node.type === 'text' || node.type === 'button' || node.type === 'link'

  const persistentX = previewSize?.translateX ?? node.props.translateX ?? 0
  const persistentY = previewSize?.translateY ?? node.props.translateY ?? 0
  const dragTransform = transform
    ? ` translate3d(${transform.x}px, ${transform.y}px, 0)`
    : ''

  const transformStyle: CSSProperties = {
    width: visualWidth === 'auto' || (!visualWidth && intrinsicWidth) ? 'fit-content' : visualWidth,
    height: visualHeight === 'auto' ? undefined : visualHeight,
    maxWidth: '100%',
    marginTop: node.props.marginTop,
    marginRight: node.props.marginRight,
    marginBottom: node.props.marginBottom,
    marginLeft: node.props.marginLeft,
    transform: `translate(${persistentX}px, ${persistentY}px)${dragTransform}`,
  }

  const content = (() => {
    switch (node.type) {
      case 'container':
        return <ContainerContent node={node} preview={previewSize} />

      case 'text':
        return editingText ? (
          <div
            ref={textEditorRef}
            className="canvas-inline-text-editor"
            contentEditable
            suppressContentEditableWarning
            style={nodeStyle(node, previewSize)}
            onBlur={(event) => {
              updateNode(id, { text: event.currentTarget.textContent ?? '' })
              setEditingText(false)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault()
                event.currentTarget.textContent = node.props.text ?? ''
                event.currentTarget.blur()
              }
              if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                event.preventDefault()
                event.currentTarget.blur()
              }
            }}
          >
            {node.props.text}
          </div>
        ) : (
          <div style={nodeStyle(node, previewSize)}>{node.props.text}</div>
        )

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

  const isSelected = selectedIds.includes(id)
  const isPrimarySelection = selectedId === id

  return (
    <div
      ref={setNodeRef}
      className={`canvas-node ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''} ${node.locked ? 'locked' : ''} ${editingText ? 'editing-text' : ''}`}
      style={transformStyle}
      data-canvas-node-id={id}
      data-canvas-node-locked={node.locked ? 'true' : 'false'}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      {...listeners}
      {...attributes}
    >
      <span className="node-tag">{componentLabel}</span>
      {content}

      {snapGuide.vertical && <div className="alignment-guide alignment-guide-vertical" aria-hidden="true" />}
      {snapGuide.horizontal && <div className="alignment-guide alignment-guide-horizontal" aria-hidden="true" />}

      {isPrimarySelection && selectedIds.length === 1 && !isDragging && !node.locked && !editingText && (
        <>
          {([
            ['nw', 'resize-northwest'],
            ['n', 'resize-north'],
            ['ne', 'resize-northeast'],
            ['e', 'resize-east'],
            ['se', 'resize-southeast'],
            ['s', 'resize-south'],
            ['sw', 'resize-southwest'],
            ['w', 'resize-west'],
          ] as Array<[ResizeMode, string]>).map(([mode, className]) => (
            <button
              key={mode}
              className={`resize-handle ${className}`}
              aria-label={`Resize ${mode}`}
              onPointerDown={(resizeEvent) => startResize(mode, resizeEvent)}
            />
          ))}
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
  const selectedIds = useEditorStore((state) => state.selectedIds)
  const setSelection = useEditorStore((state) => state.setSelection)
  const [spaceDown, setSpaceDown] = useState(false)
  const [panning, setPanning] = useState(false)
  const [marquee, setMarquee] = useState<{ left: number; top: number; width: number; height: number } | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const suppressCanvasClickRef = useRef(false)

  useEffect(() => {
    const keyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const editing =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable

      if (event.code === 'Space' && !editing) {
        event.preventDefault()
        setSpaceDown(true)
      }
    }

    const keyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        setSpaceDown(false)
        setPanning(false)
      }
    }

    window.addEventListener('keydown', keyDown)
    window.addEventListener('keyup', keyUp)
    return () => {
      window.removeEventListener('keydown', keyDown)
      window.removeEventListener('keyup', keyUp)
    }
  }, [])

  const startPan = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!spaceDown || event.button !== 0 || !scrollRef.current) return

    event.preventDefault()
    const scroller = scrollRef.current
    const startX = event.clientX
    const startY = event.clientY
    const startLeft = scroller.scrollLeft
    const startTop = scroller.scrollTop
    setPanning(true)

    const move = (pointerEvent: PointerEvent) => {
      scroller.scrollLeft = startLeft - (pointerEvent.clientX - startX)
      scroller.scrollTop = startTop - (pointerEvent.clientY - startY)
    }

    const end = () => {
      window.removeEventListener('pointermove', move)
      setPanning(false)
    }

    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', end, { once: true })
  }

  const startMarquee = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (spaceDown || event.button !== 0) return

    const target = event.target as HTMLElement
    if (target.closest('[data-canvas-node-id], .resize-handle')) return

    event.preventDefault()
    const startX = event.clientX
    const startY = event.clientY
    const additive = event.shiftKey
    const initialSelection = additive ? [...selectedIds] : []
    let dragged = false

    setMarquee({ left: startX, top: startY, width: 0, height: 0 })

    const move = (pointerEvent: PointerEvent) => {
      const left = Math.min(startX, pointerEvent.clientX)
      const top = Math.min(startY, pointerEvent.clientY)
      const width = Math.abs(pointerEvent.clientX - startX)
      const height = Math.abs(pointerEvent.clientY - startY)
      if (width > 3 || height > 3) dragged = true
      setMarquee({ left, top, width, height })
    }

    const end = (pointerEvent: PointerEvent) => {
      window.removeEventListener('pointermove', move)

      const left = Math.min(startX, pointerEvent.clientX)
      const right = Math.max(startX, pointerEvent.clientX)
      const top = Math.min(startY, pointerEvent.clientY)
      const bottom = Math.max(startY, pointerEvent.clientY)

      if (dragged) {
        const candidates = Array.from(
          document.querySelectorAll<HTMLElement>('[data-canvas-node-id]'),
        ).filter((element) => {
          if (element.dataset.canvasNodeLocked === 'true') return false
          const rect = element.getBoundingClientRect()
          const centerX = rect.left + rect.width / 2
          const centerY = rect.top + rect.height / 2
          return centerX >= left && centerX <= right && centerY >= top && centerY <= bottom
        })

        const deepest = candidates.filter(
          (element) =>
            !candidates.some(
              (other) => other !== element && element.contains(other),
            ),
        )

        const ids = deepest
          .map((element) => element.dataset.canvasNodeId)
          .filter((id): id is string => !!id)

        setSelection([...new Set([...initialSelection, ...ids])])
        suppressCanvasClickRef.current = true
        window.setTimeout(() => {
          suppressCanvasClickRef.current = false
        }, 0)
      } else if (!additive) {
        setSelection([])
      }

      setMarquee(null)
    }

    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', end, { once: true })
  }

  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas-root',
    data: { parentId: null },
  })

  return (
    <main
      className={`workspace ${showGrid ? '' : 'grid-hidden'} ${spaceDown ? 'pan-ready' : ''} ${panning ? 'panning' : ''}`}
      onClick={() => {
        if (suppressCanvasClickRef.current) return
        selectNode(null)
      }}
    >
      <div className="viewport-label">
        <span>{viewport}</span>
        <code>{viewportWidths[viewport]} px · {Math.round(zoom * 100)}%</code>
      </div>

      <div
        ref={scrollRef}
        className="canvas-scroll"
        onPointerDown={(event) => {
          startPan(event)
          startMarquee(event)
        }}
      >
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

      {marquee && (
        <div
          className="selection-marquee"
          style={{
            left: marquee.left,
            top: marquee.top,
            width: marquee.width,
            height: marquee.height,
          }}
          aria-hidden="true"
        />
      )}
    </main>
  )
}
