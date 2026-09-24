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
  const addPreset = useEditorStore((state) => state.addPreset)
  const deleteNode = useEditorStore((state) => state.deleteNode)
  const deleteSelected = useEditorStore((state) => state.deleteSelected)
  const duplicateNode = useEditorStore((state) => state.duplicateNode)
  const copyStyle = useEditorStore((state) => state.copyStyle)
  const pasteStyle = useEditorStore((state) => state.pasteStyle)
  const undo = useEditorStore((state) => state.undo)
  const redo = useEditorStore((state) => state.redo)
  const selectedId = useEditorStore((state) => state.selectedId)
  const selectedIds = useEditorStore((state) => state.selectedIds)
  const clearSelection = useEditorStore((state) => state.clearSelection)
  const groupSelected = useEditorStore((state) => state.groupSelected)
  const ungroupSelected = useEditorStore((state) => state.ungroupSelected)
  const nudgeSelected = useEditorStore((state) => state.nudgeSelected)
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

      if (mod && event.key.toLowerCase() === 'g' && !isEditing) {
        event.preventDefault()
        if (event.shiftKey) ungroupSelected()
        else groupSelected()
        return
      }

      if (mod && event.key.toLowerCase() === 'd' && selectedId && !isEditing) {
        event.preventDefault()
        duplicateNode(selectedId)
        return
      }

      if (mod && event.altKey && event.key.toLowerCase() === 'c' && selectedId && !isEditing) {
        event.preventDefault()
        copyStyle(selectedId)
        return
      }

      if (mod && event.altKey && event.key.toLowerCase() === 'v' && selectedId && !isEditing) {
        event.preventDefault()
        pasteStyle(selectedId)
        return
      }

      if (
        ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key) &&
        selectedIds.length &&
        !isEditing
      ) {
        event.preventDefault()
        const distance = event.shiftKey ? 10 : 1
        if (event.key === 'ArrowLeft') nudgeSelected(-distance, 0)
        if (event.key === 'ArrowRight') nudgeSelected(distance, 0)
        if (event.key === 'ArrowUp') nudgeSelected(0, -distance)
        if (event.key === 'ArrowDown') nudgeSelected(0, distance)
        return
      }

      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedIds.length && !isEditing) {
        event.preventDefault()
        deleteSelected()
        return
      }

      if (event.key === 'Escape') {
        if (codeOpen) setCodeOpen(false)
        else clearSelection()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    clearSelection,
    codeOpen,
    copyStyle,
    deleteNode,
    deleteSelected,
    duplicateNode,
    groupSelected,
    nudgeSelected,
    pasteStyle,
    redo,
    selectedId,
    selectedIds,
    undo,
    ungroupSelected,
  ])

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

    if (source?.source === 'preset') {
      addPreset(source.preset, targetParent, targetIndex)
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
