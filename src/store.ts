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

interface EditorState extends CanvasDocument {
  selectedId: string | null
  viewport: Viewport
  addNode: (type: NodeType, parentId: string | null) => string
  moveNode: (nodeId: string, parentId: string | null) => void
  updateNode: (nodeId: string, props: Partial<NodeProps>) => void
  deleteNode: (nodeId: string) => void
  selectNode: (nodeId: string | null) => void
  setViewport: (viewport: Viewport) => void
  loadDemo: () => void
  clearCanvas: () => void
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

const demo = createDemoDocument()

export const useEditorStore = create<EditorState>()(
  persist(
    (set, get) => ({
      ...demo,
      selectedId: demo.rootIds[0],
      viewport: 'desktop',

      addNode: (type, parentId) => {
        const node = makeNode(type)
        set((state) => {
          const nodes = { ...state.nodes, [node.id]: node }
          if (parentId && nodes[parentId]?.type === 'container') {
            nodes[parentId] = {
              ...nodes[parentId],
              children: [...nodes[parentId].children, node.id],
            }
            return { nodes, selectedId: node.id }
          }
          return { nodes, rootIds: [...state.rootIds, node.id], selectedId: node.id }
        })
        return node.id
      },

      moveNode: (nodeId, parentId) => {
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
            nodes[parentId] = { ...parent, children: [...parent.children, nodeId] }
          } else {
            rootIds = [...rootIds, nodeId]
          }

          return { nodes, rootIds, selectedId: nodeId }
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
          }
        }),

      selectNode: (selectedId) => set({ selectedId }),
      setViewport: (viewport) => set({ viewport }),
      loadDemo: () => {
        const next = createDemoDocument()
        set({ ...next, selectedId: next.rootIds[0] })
      },
      clearCanvas: () => set({ nodes: {}, rootIds: [], selectedId: null }),
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
