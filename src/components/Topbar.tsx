import type { Viewport } from '../types'
import { useEditorStore } from '../store'

export function Topbar({ onOpenCode }: { onOpenCode: () => void }) {
  const viewport = useEditorStore((state) => state.viewport)
  const setViewport = useEditorStore((state) => state.setViewport)
  const loadDemo = useEditorStore((state) => state.loadDemo)
  const clearCanvas = useEditorStore((state) => state.clearCanvas)
  const undo = useEditorStore((state) => state.undo)
  const redo = useEditorStore((state) => state.redo)
  const canUndo = useEditorStore((state) => state.past.length > 0)
  const canRedo = useEditorStore((state) => state.future.length > 0)

  const presets: Array<{ value: Viewport; label: string }> = [
    { value: 'desktop', label: 'Desktop' },
    { value: 'tablet', label: 'Tablet' },
    { value: 'mobile', label: 'Mobile' },
  ]

  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-mark">C</span>
        <span>CodeCanvas</span>
        <small>v0.1</small>
      </div>

      <div className="viewport-switcher" aria-label="Canvas viewport">
        {presets.map((preset) => (
          <button
            key={preset.value}
            className={viewport === preset.value ? 'active' : ''}
            onClick={() => setViewport(preset.value)}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="topbar-actions">
        <button className="ghost-button" onClick={undo} disabled={!canUndo} title="Undo (Ctrl/Cmd+Z)">↶</button>
        <button className="ghost-button" onClick={redo} disabled={!canRedo} title="Redo (Ctrl/Cmd+Shift+Z)">↷</button>
        <button className="ghost-button" onClick={loadDemo}>Demo</button>
        <button className="ghost-button" onClick={clearCanvas}>Clear</button>
        <button className="primary-button" onClick={onOpenCode}>&lt;/&gt; Code</button>
      </div>
    </header>
  )
}
