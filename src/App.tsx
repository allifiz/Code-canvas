import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { useEffect, useState } from 'react'
import { Canvas } from './components/Canvas'
import { CodeModal } from './components/CodeModal'
import { PropertiesPanel } from './components/PropertiesPanel'
import { Sidebar } from './components/Sidebar'
import { Topbar } from './components/Topbar'
import { useEditorStore } from './store'
import type { NodeType } from './types'
import './styles.css'

export default function App() {
  const [codeOpen, setCodeOpen] = useState(false)
  const addNode = useEditorStore((state) => state.addNode)
  const moveNode = useEditorStore((state) => state.moveNode)
  const deleteNode = useEditorStore((state) => state.deleteNode)
  const selectedId = useEditorStore((state) => state.selectedId)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedId) {
        const target = event.target as HTMLElement | null
        if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.tagName === 'SELECT') return
        deleteNode(selectedId)
      }
      if (event.key === 'Escape') setCodeOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [deleteNode, selectedId])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    const source = active.data.current
    const targetParent = (over.data.current?.parentId as string | null | undefined) ?? null

    if (source?.source === 'palette') {
      addNode(source.type as NodeType, targetParent)
    }

    if (source?.source === 'canvas') {
      moveNode(source.nodeId as string, targetParent)
    }
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="app-shell">
        <Topbar onOpenCode={() => setCodeOpen(true)} />
        <div className="editor-layout">
          <Sidebar />
          <Canvas />
          <PropertiesPanel />
        </div>
        {codeOpen && <CodeModal onClose={() => setCodeOpen(false)} />}
      </div>
    </DndContext>
  )
}
