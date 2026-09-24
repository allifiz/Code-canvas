import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  CanvasDocument,
  CanvasNode,
  ComponentPropValue,
  NodeProps,
  NodeType,
  PresetType,
  ProjectComponentDefinition,
  Viewport,
} from './types'

const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `node-${Date.now()}-${Math.random().toString(36).slice(2)}`

const baseVisualProps: NodeProps = {
  opacity: 1,
  borderWidth: 0,
  borderStyle: 'solid',
  shadowX: 0,
  shadowY: 0,
  shadowBlur: 0,
  shadowSpread: 0,
  shadowColor: '#000000',
}

function makeNode(type: NodeType, component?: ProjectComponentDefinition): CanvasNode {
  const id = uid()

  const defaults: Record<NodeType, NodeProps> = {
    container: {
      ...baseVisualProps,
      display: 'flex',
      direction: 'column',
      align: 'stretch',
      justify: 'flex-start',
      gap: 16,
      padding: 24,
      width: '100%',
      minHeight: 120,
      background: '#ffffff',
      radius: 16,
      borderColor: '#e5e7eb',
      borderWidth: 1,
      overflow: 'visible',
    },
    text: {
      ...baseVisualProps,
      text: 'Edit this text',
      color: '#111827',
      fontFamily: 'Inter, sans-serif',
      fontSize: 24,
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: 0,
      textAlign: 'left',
      textTransform: 'none',
      textDecoration: 'none',
      width: 'auto',
    },
    button: {
      ...baseVisualProps,
      text: 'Button',
      background: '#111827',
      color: '#ffffff',
      padding: 12,
      radius: 10,
      fontFamily: 'Inter, sans-serif',
      fontSize: 14,
      fontWeight: 600,
      lineHeight: 1.2,
      width: 'fit-content',
    },
    input: {
      ...baseVisualProps,
      placeholder: 'Type something...',
      background: '#ffffff',
      color: '#111827',
      padding: 12,
      radius: 10,
      borderColor: '#d1d5db',
      borderWidth: 1,
      width: '100%',
      fontFamily: 'Inter, sans-serif',
      fontSize: 14,
    },
    textarea: {
      ...baseVisualProps,
      placeholder: 'Write something...',
      background: '#ffffff',
      color: '#111827',
      padding: 12,
      radius: 10,
      borderColor: '#d1d5db',
      borderWidth: 1,
      width: '100%',
      minHeight: 120,
      fontFamily: 'Inter, sans-serif',
      fontSize: 14,
    },
    link: {
      ...baseVisualProps,
      text: 'Link',
      href: '#',
      color: '#4f46e5',
      fontFamily: 'Inter, sans-serif',
      fontSize: 14,
      fontWeight: 500,
      lineHeight: 1.2,
      textDecoration: 'none',
      width: 'fit-content',
    },
    divider: {
      ...baseVisualProps,
      width: '100%',
      height: '1px',
      background: '#e5e7eb',
    },
    image: {
      ...baseVisualProps,
      src: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?auto=format&fit=crop&w=1200&q=80',
      alt: 'Gradient placeholder',
      width: '100%',
      minHeight: 180,
      radius: 14,
      objectFit: 'cover',
      objectPosition: 'center',
    },
    component: {
      ...baseVisualProps,
      componentId: component?.id,
      componentProps: structuredClone(component?.defaultProps ?? {}),
      width: '100%',
      minHeight: component?.acceptsChildren ? 88 : 56,
    },
  }

  return { id, type, props: defaults[type], children: [] }
}

function createDemoDocument(): CanvasDocument {
  const hero = makeNode('container')
  hero.props = {
    ...hero.props,
    padding: 48,
    gap: 20,
    minHeight: 420,
    justify: 'center',
    background: '#f8fafc',
    radius: 20,
    maxWidth: '980px',
    marginTop: 32,
    marginBottom: 32,
  }

  const eyebrow = makeNode('text')
  eyebrow.props = {
    ...eyebrow.props,
    text: 'OPEN-SOURCE VISUAL BUILDER',
    fontSize: 12,
    fontWeight: 700,
    color: '#6366f1',
    letterSpacing: 1.2,
  }

  const title = makeNode('text')
  title.props = {
    ...title.props,
    text: 'Build interfaces visually. Keep the code.',
    fontSize: 42,
    fontWeight: 800,
    color: '#0f172a',
    maxWidth: '720px',
  }

  const body = makeNode('text')
  body.props = {
    ...body.props,
    text: 'CodeCanvas models real web layouts instead of turning your design into a pile of absolute coordinates.',
    fontSize: 16,
    fontWeight: 400,
    lineHeight: 1.7,
    color: '#475569',
    maxWidth: '680px',
  }

  const button = makeNode('button')
  button.props = {
    ...button.props,
    text: 'Start building',
    paddingTop: 12,
    paddingRight: 18,
    paddingBottom: 12,
    paddingLeft: 18,
    shadowY: 4,
    shadowBlur: 14,
    shadowColor: '#00000022',
  }

  hero.children = [eyebrow.id, title.id, body.id, button.id]

  return {
    nodes: {
      [hero.id]: hero,
      [eyebrow.id]: eyebrow,
      [title.id]: title,
      [body.id]: body,
      [button.id]: button,
    },
    rootIds: [hero.id],
  }
}

function createPreset(type: PresetType): { nodes: Record<string, CanvasNode>; rootId: string } {
  const nodes: Record<string, CanvasNode> = {}
  const add = (node: CanvasNode) => {
    nodes[node.id] = node
    return node
  }

  if (type === 'navbar') {
    const root = add(makeNode('container'))
    root.props = {
      ...root.props,
      direction: 'row',
      align: 'center',
      justify: 'space-between',
      gap: 20,
      paddingTop: 16,
      paddingRight: 24,
      paddingBottom: 16,
      paddingLeft: 24,
      radius: 0,
      minHeight: 64,
      shadowY: 1,
      shadowBlur: 8,
      shadowColor: '#00000012',
    }

    const brand = add(makeNode('text'))
    brand.props = { ...brand.props, text: 'Brand', fontSize: 20, fontWeight: 800 }

    const links = add(makeNode('container'))
    links.props = {
      ...links.props,
      direction: 'row',
      align: 'center',
      gap: 20,
      padding: 0,
      width: 'auto',
      minHeight: 0,
      borderWidth: 0,
      background: 'transparent',
    }

    const home = add(makeNode('link'))
    home.props = { ...home.props, text: 'Home', href: '#home', color: '#334155' }
    const features = add(makeNode('link'))
    features.props = { ...features.props, text: 'Features', href: '#features', color: '#334155' }
    const pricing = add(makeNode('link'))
    pricing.props = { ...pricing.props, text: 'Pricing', href: '#pricing', color: '#334155' }

    const cta = add(makeNode('button'))
    cta.props = {
      ...cta.props,
      text: 'Get started',
      paddingTop: 10,
      paddingRight: 16,
      paddingBottom: 10,
      paddingLeft: 16,
    }

    links.children = [home.id, features.id, pricing.id]
    root.children = [brand.id, links.id, cta.id]
    return { nodes, rootId: root.id }
  }

  if (type === 'card') {
    const root = add(makeNode('container'))
    root.props = {
      ...root.props,
      gap: 14,
      padding: 0,
      width: '320px',
      overflow: 'hidden',
      shadowY: 10,
      shadowBlur: 30,
      shadowColor: '#0f172a18',
    }

    const image = add(makeNode('image'))
    image.props = { ...image.props, minHeight: 190, radius: 0 }

    const content = add(makeNode('container'))
    content.props = {
      ...content.props,
      gap: 10,
      padding: 20,
      borderWidth: 0,
      background: 'transparent',
      minHeight: 0,
    }

    const title = add(makeNode('text'))
    title.props = { ...title.props, text: 'Beautiful card title', fontSize: 20, fontWeight: 750 }

    const body = add(makeNode('text'))
    body.props = {
      ...body.props,
      text: 'Describe your content with a clean reusable card block.',
      fontSize: 14,
      fontWeight: 400,
      lineHeight: 1.6,
      color: '#64748b',
    }

    const link = add(makeNode('link'))
    link.props = { ...link.props, text: 'Learn more →', href: '#', fontWeight: 650 }

    content.children = [title.id, body.id, link.id]
    root.children = [image.id, content.id]
    return { nodes, rootId: root.id }
  }

  if (type === 'login-form') {
    const root = add(makeNode('container'))
    root.props = {
      ...root.props,
      gap: 16,
      padding: 28,
      width: '380px',
      shadowY: 14,
      shadowBlur: 40,
      shadowColor: '#0f172a1a',
    }

    const title = add(makeNode('text'))
    title.props = { ...title.props, text: 'Welcome back', fontSize: 28, fontWeight: 800 }

    const subtitle = add(makeNode('text'))
    subtitle.props = {
      ...subtitle.props,
      text: 'Sign in to continue to your account.',
      fontSize: 14,
      fontWeight: 400,
      lineHeight: 1.5,
      color: '#64748b',
    }

    const email = add(makeNode('input'))
    email.props = { ...email.props, placeholder: 'Email address' }

    const password = add(makeNode('input'))
    password.props = { ...password.props, placeholder: 'Password' }

    const button = add(makeNode('button'))
    button.props = { ...button.props, text: 'Sign in', width: '100%', padding: 13 }

    root.children = [title.id, subtitle.id, email.id, password.id, button.id]
    return { nodes, rootId: root.id }
  }

  const root = add(makeNode('container'))
  root.props = {
    ...root.props,
    align: 'center',
    justify: 'center',
    gap: 22,
    paddingTop: 80,
    paddingRight: 36,
    paddingBottom: 80,
    paddingLeft: 36,
    minHeight: 520,
    background: '#0f172a',
    radius: 0,
    borderWidth: 0,
  }

  const badge = add(makeNode('text'))
  badge.props = {
    ...badge.props,
    text: 'BUILD SOMETHING GREAT',
    fontSize: 12,
    fontWeight: 700,
    color: '#a5b4fc',
    letterSpacing: 1.5,
    textAlign: 'center',
  }

  const title = add(makeNode('text'))
  title.props = {
    ...title.props,
    text: 'Design visually without giving up your code.',
    color: '#ffffff',
    fontSize: 52,
    fontWeight: 850,
    lineHeight: 1.05,
    textAlign: 'center',
    maxWidth: '780px',
  }

  const body = add(makeNode('text'))
  body.props = {
    ...body.props,
    text: 'Drag, customize, export, and keep complete ownership of the result.',
    color: '#cbd5e1',
    fontSize: 17,
    fontWeight: 400,
    lineHeight: 1.6,
    textAlign: 'center',
    maxWidth: '620px',
  }

  const actions = add(makeNode('container'))
  actions.props = {
    ...actions.props,
    direction: 'row',
    align: 'center',
    justify: 'center',
    gap: 12,
    padding: 0,
    width: 'auto',
    minHeight: 0,
    background: 'transparent',
    borderWidth: 0,
  }

  const primary = add(makeNode('button'))
  primary.props = {
    ...primary.props,
    text: 'Get started',
    background: '#6366f1',
    paddingTop: 12,
    paddingRight: 20,
    paddingBottom: 12,
    paddingLeft: 20,
  }

  const secondary = add(makeNode('button'))
  secondary.props = {
    ...secondary.props,
    text: 'Learn more',
    background: '#ffffff14',
    borderColor: '#ffffff33',
    borderWidth: 1,
    paddingTop: 12,
    paddingRight: 20,
    paddingBottom: 12,
    paddingLeft: 20,
  }

  actions.children = [primary.id, secondary.id]
  root.children = [badge.id, title.id, body.id, actions.id]
  return { nodes, rootId: root.id }
}

type DocumentSnapshot = CanvasDocument

const styleKeys: Array<keyof NodeProps> = [
  'display', 'direction', 'align', 'justify', 'gap', 'gridColumns', 'overflow',
  'width', 'height', 'minWidth', 'minHeight', 'maxWidth', 'maxHeight',
  'padding', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
  'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
  'background', 'color', 'opacity',
  'fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing',
  'textAlign', 'textTransform', 'textDecoration',
  'radius', 'radiusTopLeft', 'radiusTopRight', 'radiusBottomRight', 'radiusBottomLeft',
  'borderColor', 'borderWidth', 'borderStyle',
  'shadowX', 'shadowY', 'shadowBlur', 'shadowSpread', 'shadowColor',
  'objectFit', 'objectPosition',
]

interface EditorState extends CanvasDocument {
  selectedId: string | null
  viewport: Viewport
  zoom: number
  showGrid: boolean
  projectComponents: ProjectComponentDefinition[]
  copiedStyle: Partial<NodeProps> | null
  past: DocumentSnapshot[]
  future: DocumentSnapshot[]

  addNode: (type: Exclude<NodeType, 'component'>, parentId: string | null, index?: number) => string
  addPreset: (preset: PresetType, parentId: string | null, index?: number) => string
  addProjectNode: (componentId: string, parentId: string | null, index?: number) => string | null
  addProjectComponent: (input: {
    name: string
    importPath: string
    exportName?: string
    defaultProps?: Record<string, ComponentPropValue>
    acceptsChildren?: boolean
  }) => string
  removeProjectComponent: (componentId: string) => void
  replaceProjectComponents: (components: ProjectComponentDefinition[]) => void
  moveNode: (nodeId: string, parentId: string | null, index?: number) => void
  updateNode: (nodeId: string, props: Partial<NodeProps>) => void
  deleteNode: (nodeId: string) => void
  duplicateNode: (nodeId: string) => void
  copyStyle: (nodeId: string) => void
  pasteStyle: (nodeId: string) => void
  selectNode: (nodeId: string | null) => void
  setViewport: (viewport: Viewport) => void
  setZoom: (zoom: number) => void
  toggleGrid: () => void
  loadDemo: () => void
  loadDocument: (document: CanvasDocument) => void
  loadProject: (document: CanvasDocument, components: ProjectComponentDefinition[]) => void
  clearCanvas: () => void
  undo: () => void
  redo: () => void
}

function cloneBranch(nodes: Record<string, CanvasNode>, nodeId: string) {
  const clonedNodes: Record<string, CanvasNode> = {}

  const clone = (sourceId: string): string => {
    const source = nodes[sourceId]
    const clonedId = uid()
    const childIds = source.children.map(clone)

    clonedNodes[clonedId] = {
      ...source,
      id: clonedId,
      props: structuredClone(source.props),
      children: childIds,
    }

    return clonedId
  }

  const rootId = clone(nodeId)
  return { rootId, nodes: clonedNodes }
}

function collectDescendants(nodes: Record<string, CanvasNode>, nodeId: string, bag = new Set<string>()) {
  const node = nodes[nodeId]
  if (!node) return bag
  for (const childId of node.children) {
    bag.add(childId)
    collectDescendants(nodes, childId, bag)
  }
  return bag
}

const snapshot = (state: Pick<EditorState, 'nodes' | 'rootIds'>): DocumentSnapshot => ({
  nodes: structuredClone(state.nodes),
  rootIds: [...state.rootIds],
})

const pushHistory = (state: EditorState) => ({
  past: [...state.past, snapshot(state)].slice(-50),
  future: [],
})

const insertAt = (ids: string[], id: string, index?: number) => {
  const next = [...ids]
  const safeIndex = index === undefined ? next.length : Math.max(0, Math.min(index, next.length))
  next.splice(safeIndex, 0, id)
  return next
}

const canParentAcceptChildren = (
  state: Pick<EditorState, 'nodes' | 'projectComponents'>,
  parentId: string | null,
) => {
  if (!parentId) return true
  const parent = state.nodes[parentId]
  if (!parent) return false
  if (parent.type === 'container') return true
  if (parent.type !== 'component') return false
  return !!state.projectComponents.find((item) => item.id === parent.props.componentId)?.acceptsChildren
}

const attachSubtree = (
  state: EditorState,
  subtreeNodes: Record<string, CanvasNode>,
  rootId: string,
  parentId: string | null,
  index?: number,
) => {
  const nodes = { ...state.nodes, ...subtreeNodes }
  const history = pushHistory(state)

  if (parentId && canParentAcceptChildren({ ...state, nodes }, parentId)) {
    const parent = nodes[parentId]
    nodes[parentId] = {
      ...parent,
      children: insertAt(parent.children, rootId, index),
    }
    return { nodes, selectedId: rootId, ...history }
  }

  return {
    nodes,
    rootIds: insertAt(state.rootIds, rootId, index),
    selectedId: rootId,
    ...history,
  }
}

const attachNode = (
  state: EditorState,
  node: CanvasNode,
  parentId: string | null,
  index?: number,
) => attachSubtree(state, { [node.id]: node }, node.id, parentId, index)

const demo = createDemoDocument()

export const useEditorStore = create<EditorState>()(
  persist(
    (set, get) => ({
      ...demo,
      selectedId: demo.rootIds[0],
      viewport: 'desktop',
      zoom: 0.8,
      showGrid: true,
      projectComponents: [],
      copiedStyle: null,
      past: [],
      future: [],

      addNode: (type, parentId, index) => {
        const node = makeNode(type)
        set((state) => attachNode(state, node, parentId, index))
        return node.id
      },

      addPreset: (preset, parentId, index) => {
        const tree = createPreset(preset)
        set((state) => attachSubtree(state, tree.nodes, tree.rootId, parentId, index))
        return tree.rootId
      },

      addProjectNode: (componentId, parentId, index) => {
        const component = get().projectComponents.find((item) => item.id === componentId)
        if (!component) return null

        const node = makeNode('component', component)
        set((state) => attachNode(state, node, parentId, index))
        return node.id
      },

      addProjectComponent: (input) => {
        const id = `component-${uid()}`
        const component: ProjectComponentDefinition = {
          id,
          name: input.name.trim(),
          importPath: input.importPath.trim(),
          exportName: input.exportName?.trim() || undefined,
          defaultProps: structuredClone(input.defaultProps ?? {}),
          acceptsChildren: input.acceptsChildren ?? false,
        }

        set((state) => ({
          projectComponents: [...state.projectComponents, component],
        }))

        return id
      },

      removeProjectComponent: (componentId) =>
        set((state) => ({
          projectComponents: state.projectComponents.filter((item) => item.id !== componentId),
        })),

      replaceProjectComponents: (projectComponents) =>
        set({ projectComponents: structuredClone(projectComponents) }),

      moveNode: (nodeId, parentId, index) => {
        const state = get()
        if (!state.nodes[nodeId] || nodeId === parentId) return
        if (!canParentAcceptChildren(state, parentId)) return
        if (parentId && collectDescendants(state.nodes, nodeId).has(parentId)) return

        const sourceParentId =
          state.rootIds.includes(nodeId)
            ? null
            : Object.values(state.nodes).find((node) => node.children.includes(nodeId))?.id ?? null
        const sourceSiblings = sourceParentId ? state.nodes[sourceParentId].children : state.rootIds
        const sourceIndex = sourceSiblings.indexOf(nodeId)
        const targetIndex =
          index !== undefined && sourceParentId === parentId && sourceIndex >= 0 && sourceIndex < index
            ? index - 1
            : index

        set((current) => {
          const nodes = { ...current.nodes }
          let rootIds = current.rootIds.filter((id) => id !== nodeId)

          for (const node of Object.values(nodes)) {
            if (node.children.includes(nodeId)) {
              nodes[node.id] = {
                ...node,
                children: node.children.filter((id) => id !== nodeId),
              }
            }
          }

          if (parentId) {
            const parent = nodes[parentId]
            nodes[parentId] = {
              ...parent,
              children: insertAt(parent.children, nodeId, targetIndex),
            }
          } else {
            rootIds = insertAt(rootIds, nodeId, targetIndex)
          }

          return {
            nodes,
            rootIds,
            selectedId: nodeId,
            ...pushHistory(current),
          }
        })
      },

      updateNode: (nodeId, props) =>
        set((state) => {
          const node = state.nodes[nodeId]
          if (!node) return state

          return {
            nodes: {
              ...state.nodes,
              [nodeId]: { ...node, props: { ...node.props, ...props } },
            },
            ...pushHistory(state),
          }
        }),

      deleteNode: (nodeId) =>
        set((state) => {
          if (!state.nodes[nodeId]) return state

          const toDelete = collectDescendants(state.nodes, nodeId)
          toDelete.add(nodeId)
          const nodes = { ...state.nodes }
          toDelete.forEach((id) => delete nodes[id])

          for (const node of Object.values(nodes)) {
            const children = node.children.filter((id) => !toDelete.has(id))
            if (children.length !== node.children.length) {
              nodes[node.id] = { ...node, children }
            }
          }

          return {
            nodes,
            rootIds: state.rootIds.filter((id) => !toDelete.has(id)),
            selectedId: toDelete.has(state.selectedId ?? '') ? null : state.selectedId,
            ...pushHistory(state),
          }
        }),

      duplicateNode: (nodeId) =>
        set((state) => {
          if (!state.nodes[nodeId]) return state

          const cloned = cloneBranch(state.nodes, nodeId)
          const nodes = { ...state.nodes, ...cloned.nodes }
          const parent = Object.values(state.nodes).find((node) => node.children.includes(nodeId))

          if (parent) {
            const sourceIndex = parent.children.indexOf(nodeId)
            nodes[parent.id] = {
              ...nodes[parent.id],
              children: insertAt(parent.children, cloned.rootId, sourceIndex + 1),
            }

            return {
              nodes,
              selectedId: cloned.rootId,
              ...pushHistory(state),
            }
          }

          const sourceIndex = state.rootIds.indexOf(nodeId)
          return {
            nodes,
            rootIds: insertAt(state.rootIds, cloned.rootId, sourceIndex + 1),
            selectedId: cloned.rootId,
            ...pushHistory(state),
          }
        }),

      copyStyle: (nodeId) =>
        set((state) => {
          const node = state.nodes[nodeId]
          if (!node) return state
          const copiedStyle: Partial<NodeProps> = {}
          for (const key of styleKeys) {
            const value = node.props[key]
            if (value !== undefined) {
              ;(copiedStyle as Record<string, unknown>)[key] = structuredClone(value)
            }
          }
          return { copiedStyle }
        }),

      pasteStyle: (nodeId) =>
        set((state) => {
          const node = state.nodes[nodeId]
          if (!node || !state.copiedStyle) return state
          return {
            nodes: {
              ...state.nodes,
              [nodeId]: {
                ...node,
                props: { ...node.props, ...structuredClone(state.copiedStyle) },
              },
            },
            ...pushHistory(state),
          }
        }),

      selectNode: (selectedId) => set({ selectedId }),
      setViewport: (viewport) => set({ viewport }),
      setZoom: (zoom) => set({ zoom: Math.min(2, Math.max(0.25, zoom)) }),
      toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),

      loadDemo: () =>
        set((state) => {
          const next = createDemoDocument()
          return {
            ...next,
            selectedId: next.rootIds[0],
            ...pushHistory(state),
          }
        }),

      loadDocument: (document) =>
        set((state) => ({
          nodes: structuredClone(document.nodes),
          rootIds: [...document.rootIds],
          selectedId: null,
          ...pushHistory(state),
        })),

      loadProject: (document, projectComponents) =>
        set((state) => ({
          nodes: structuredClone(document.nodes),
          rootIds: [...document.rootIds],
          projectComponents: structuredClone(projectComponents),
          selectedId: null,
          ...pushHistory(state),
        })),

      clearCanvas: () =>
        set((state) => ({
          nodes: {},
          rootIds: [],
          selectedId: null,
          ...pushHistory(state),
        })),

      undo: () =>
        set((state) => {
          const previous = state.past.at(-1)
          if (!previous) return state

          return {
            ...previous,
            selectedId: null,
            past: state.past.slice(0, -1),
            future: [snapshot(state), ...state.future].slice(0, 50),
          }
        }),

      redo: () =>
        set((state) => {
          const next = state.future[0]
          if (!next) return state

          return {
            ...next,
            selectedId: null,
            past: [...state.past, snapshot(state)].slice(-50),
            future: state.future.slice(1),
          }
        }),
    }),
    {
      name: 'codecanvas-document-v1',
      partialize: (state) => ({
        nodes: state.nodes,
        rootIds: state.rootIds,
        viewport: state.viewport,
        zoom: state.zoom,
        showGrid: state.showGrid,
        projectComponents: state.projectComponents,
      }),
    },
  ),
)
