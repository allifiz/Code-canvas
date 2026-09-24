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
  const addProjectNode = useEditorStore((state) => state.addProjectNode)
  const deleteNode = useEditorStore((state) => state.deleteNode)
  const duplicateNode = useEditorStore((state) => state.duplicateNode)
  const undo = useEditorStore((state) => state.undo)
  const redo = useEditorStore((state) => state.redo)
  const selectedId = useEditorStore((state) => state.selectedId)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const isEditing =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.tagName === 'SELECT' ||
        target?.isContentEditable

      const mod = event.metaKey || event.ctrlKey

      if (mod && event.key.toLowerCase() === 'z' && !isEditing) {
        event.preventDefault()
        if (event.shiftKey) redo()
        else undo()
        return
      }

      if (mod && event.key.toLowerCase() === 'y' && !isEditing) {
        event.preventDefault()
        redo()
        return
      }

      if (mod && event.key.toLowerCase() === 'd' && selectedId && !isEditing) {
        event.preventDefault()
        duplicateNode(selectedId)
        return
      }

      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedId && !isEditing) {
        deleteNode(selectedId)
      }

      if (event.key === 'Escape') setCodeOpen(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [deleteNode, duplicateNode, redo, selectedId, undo])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    const source = active.data.current
    const targetParent = (over.data.current?.parentId as string | null | undefined) ?? null
    const targetIndex =
      typeof over.data.current?.index === 'number'
        ? (over.data.current.index as number)
        : undefined

    if (source?.source === 'palette') {
      addNode(source.type as Exclude<NodeType, 'component'>, targetParent, targetIndex)
    }

    if (source?.source === 'project-component') {
      addProjectNode(source.componentId as string, targetParent, targetIndex)
    }

    if (source?.source === 'canvas') {
      moveNode(source.nodeId as string, targetParent, targetIndex)
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
