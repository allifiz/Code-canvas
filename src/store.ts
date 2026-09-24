import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CanvasDocument, CanvasNode, NodeProps, NodeType, Viewport } from './types'

const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `node-${Date.now()}-${Math.random().toString(36).slice(2)}`

function makeNode(type: NodeType): CanvasNode {
  const id = uid()

  const defaults: Record<NodeType, NodeProps> = {
    container: {
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
    },
    text: {
      text: 'Edit this text',
      color: '#111827',
      fontSize: 24,
      fontWeight: 700,
      width: 'auto',
    },
    button: {
      text: 'Button',
      background: '#111827',
      color: '#ffffff',
      padding: 12,
      radius: 10,
      fontSize: 14,
      fontWeight: 600,
      width: 'fit-content',
    },
    input: {
      placeholder: 'Type something...',
      background: '#ffffff',
      color: '#111827',
      padding: 12,
      radius: 10,
      borderColor: '#d1d5db',
      width: '100%',
      fontSize: 14,
    },
    image: {
      src: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?auto=format&fit=crop&w=1200&q=80',
      alt: 'Gradient placeholder',
      width: '100%',
      minHeight: 180,
      radius: 14,
    },
  }

  return { id, type, props: defaults[type], children: [] }
}

function createDemoDocument(): CanvasDocument {
  const hero = makeNode('container')
  hero.props = {
    ...hero.props,
    padding: 40,
    gap: 20,
    minHeight: 420,
    justify: 'center',
    background: '#f8fafc',
    radius: 20,
  }

  const eyebrow = makeNode('text')
  eyebrow.props = {
    ...eyebrow.props,
    text: 'OPEN-SOURCE VISUAL BUILDER',
    fontSize: 12,
    fontWeight: 700,
    color: '#6366f1',
  }

  const title = makeNode('text')
  title.props = {
    ...title.props,
    text: 'Build interfaces visually. Keep the code.',
    fontSize: 42,
    fontWeight: 800,
    color: '#0f172a',
  }

  const body = makeNode('text')
  body.props = {
    ...body.props,
    text: 'CodeCanvas models real web layouts instead of turning your design into a pile of absolute coordinates.',
    fontSize: 16,
    fontWeight: 400,
    color: '#475569',
  }

  const button = makeNode('button')
  button.props = { ...button.props, text: 'Start building' }

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

type DocumentSnapshot = CanvasDocument

interface EditorState extends CanvasDocument {
  selectedId: string | null
  viewport: Viewport
  past: DocumentSnapshot[]
  future: DocumentSnapshot[]
  addNode: (type: NodeType, parentId: string | null, index?: number) => string
  moveNode: (nodeId: string, parentId: string | null, index?: number) => void
  updateNode: (nodeId: string, props: Partial<NodeProps>) => void
  deleteNode: (nodeId: string) => void
  selectNode: (nodeId: string | null) => void
  setViewport: (viewport: Viewport) => void
  loadDemo: () => void
  loadDocument: (document: CanvasDocument) => void
  clearCanvas: () => void
  undo: () => void
  redo: () => void
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

const demo = createDemoDocument()

export const useEditorStore = create<EditorState>()(
  persist(
    (set, get) => ({
      ...demo,
      selectedId: demo.rootIds[0],
      viewport: 'desktop',
      past: [],
      future: [],

      addNode: (type, parentId, index) => {
        const node = makeNode(type)

        set((state) => {
          const nodes = { ...state.nodes, [node.id]: node }
          const history = pushHistory(state)

          if (parentId && nodes[parentId]?.type === 'container') {
            nodes[parentId] = {
              ...nodes[parentId],
              children: insertAt(nodes[parentId].children, node.id, index),
            }

            return { nodes, selectedId: node.id, ...history }
          }

          return {
            nodes,
            rootIds: insertAt(state.rootIds, node.id, index),
            selectedId: node.id,
            ...history,
          }
        })

        return node.id
      },

      moveNode: (nodeId, parentId, index) => {
        const state = get()
        if (!state.nodes[nodeId] || nodeId === parentId) return
        if (parentId && state.nodes[parentId]?.type !== 'container') return
        if (parentId && collectDescendants(state.nodes, nodeId).has(parentId)) return

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
              children: insertAt(parent.children, nodeId, index),
            }
          } else {
            rootIds = insertAt(rootIds, nodeId, index)
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

      selectNode: (selectedId) => set({ selectedId }),
      setViewport: (viewport) => set({ viewport }),

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
      }),
    },
  ),
)
