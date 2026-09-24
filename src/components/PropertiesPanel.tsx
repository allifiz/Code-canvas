import type { ReactNode } from 'react'
import { useEditorStore } from '../store'
import type { NodeProps } from '../types'

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  )
}

function NumberInput({ value, onChange, min = 0 }: { value?: number; onChange: (value: number) => void; min?: number }) {
  return (
    <input
      type="number"
      min={min}
      value={value ?? 0}
      onChange={(event) => onChange(Number(event.target.value))}
    />
  )
}

export function PropertiesPanel() {
  const selectedId = useEditorStore((state) => state.selectedId)
  const node = useEditorStore((state) => (state.selectedId ? state.nodes[state.selectedId] : undefined))
  const updateNode = useEditorStore((state) => state.updateNode)
  const deleteNode = useEditorStore((state) => state.deleteNode)
  const projectComponents = useEditorStore((state) => state.projectComponents)

  if (!node || !selectedId) {
    return (
      <aside className="properties panel">
        <div className="panel-title"><span>Properties</span></div>
        <div className="properties-empty">
          <div>◇</div>
          <p>Select a component to edit its properties.</p>
        </div>
      </aside>
    )
  }

  const update = (props: Partial<NodeProps>) => updateNode(selectedId, props)
  const projectComponent =
    node.type === 'component'
      ? projectComponents.find((component) => component.id === node.props.componentId)
      : undefined

  const updateComponentProp = (key: string, value: string | number | boolean) => {
    update({
      componentProps: {
        ...(node.props.componentProps ?? {}),
        [key]: value,
      },
    })
  }

  return (
    <aside className="properties panel">
      <div className="panel-title">
        <span>Properties</span>
        <small>{node.type}</small>
      </div>

      <div className="inspector-group">
        <div className="group-heading">Content</div>
        {(node.type === 'text' || node.type === 'button') && (
          <Field label="Text">
            <textarea value={node.props.text ?? ''} onChange={(event) => update({ text: event.target.value })} rows={3} />
          </Field>
        )}
        {node.type === 'input' && (
          <Field label="Placeholder">
            <input value={node.props.placeholder ?? ''} onChange={(event) => update({ placeholder: event.target.value })} />
          </Field>
        )}
        {node.type === 'image' && (
          <>
            <Field label="Image URL">
              <input value={node.props.src ?? ''} onChange={(event) => update({ src: event.target.value })} />
            </Field>
            <Field label="Alt text">
              <input value={node.props.alt ?? ''} onChange={(event) => update({ alt: event.target.value })} />
            </Field>
          </>
        )}
        {node.type === 'component' && (
          <>
            <Field label="Component">
              <input value={projectComponent?.name ?? 'Missing component'} readOnly />
            </Field>
            <Field label="Import">
              <input value={projectComponent?.importPath ?? ''} readOnly />
            </Field>
          </>
        )}
      </div>

      {node.type === 'component' && (
        <div className="inspector-group">
          <div className="group-heading">Component Props</div>
          {Object.entries(node.props.componentProps ?? {}).length ? (
            Object.entries(node.props.componentProps ?? {}).map(([key, value]) => (
              <Field key={key} label={key}>
                {typeof value === 'boolean' ? (
                  <select
                    value={String(value)}
                    onChange={(event) => updateComponentProp(key, event.target.value === 'true')}
                  >
                    <option value="true">true</option>
                    <option value="false">false</option>
                  </select>
                ) : typeof value === 'number' ? (
                  <input
                    type="number"
                    value={value}
                    onChange={(event) => updateComponentProp(key, Number(event.target.value))}
                  />
                ) : (
                  <input value={value} onChange={(event) => updateComponentProp(key, event.target.value)} />
                )}
              </Field>
            ))
          ) : (
            <p className="inspector-note">This component has no registered default props.</p>
          )}
        </div>
      )}

      {node.type === 'container' && (
        <div className="inspector-group">
          <div className="group-heading">Layout</div>
          <Field label="Display">
            <select value={node.props.display} onChange={(event) => update({ display: event.target.value as NodeProps['display'] })}>
              <option value="flex">Flex</option>
              <option value="block">Block</option>
              <option value="grid">Grid</option>
            </select>
          </Field>
          {node.props.display === 'flex' && (
            <>
              <Field label="Direction">
                <select value={node.props.direction} onChange={(event) => update({ direction: event.target.value as NodeProps['direction'] })}>
                  <option value="column">Column</option>
                  <option value="row">Row</option>
                </select>
              </Field>
              <Field label="Align">
                <select value={node.props.align} onChange={(event) => update({ align: event.target.value as NodeProps['align'] })}>
                  <option value="stretch">Stretch</option>
                  <option value="flex-start">Start</option>
                  <option value="center">Center</option>
                  <option value="flex-end">End</option>
                </select>
              </Field>
              <Field label="Justify">
                <select value={node.props.justify} onChange={(event) => update({ justify: event.target.value as NodeProps['justify'] })}>
                  <option value="flex-start">Start</option>
                  <option value="center">Center</option>
                  <option value="flex-end">End</option>
                  <option value="space-between">Space between</option>
                </select>
              </Field>
            </>
          )}
          <div className="field-grid">
            <Field label="Gap"><NumberInput value={node.props.gap} onChange={(gap) => update({ gap })} /></Field>
            <Field label="Padding"><NumberInput value={node.props.padding} onChange={(padding) => update({ padding })} /></Field>
          </div>
        </div>
      )}

      <div className="inspector-group">
        <div className="group-heading">Style</div>
        <Field label="Width">
          <input value={node.props.width ?? 'auto'} onChange={(event) => update({ width: event.target.value })} />
        </Field>
        <div className="field-grid">
          <Field label="Min height"><NumberInput value={node.props.minHeight} onChange={(minHeight) => update({ minHeight })} /></Field>
          <Field label="Radius"><NumberInput value={node.props.radius} onChange={(radius) => update({ radius })} /></Field>
        </div>
        {node.type !== 'image' && (
          <>
            <Field label="Background">
              <div className="color-field"><input type="color" value={node.props.background ?? '#ffffff'} onChange={(event) => update({ background: event.target.value })} /><code>{node.props.background ?? 'none'}</code></div>
            </Field>
            {node.type !== 'container' && (
              <Field label="Text color">
                <div className="color-field"><input type="color" value={node.props.color ?? '#111827'} onChange={(event) => update({ color: event.target.value })} /><code>{node.props.color ?? 'none'}</code></div>
              </Field>
            )}
          </>
        )}
        {(node.type === 'text' || node.type === 'button' || node.type === 'input') && (
          <div className="field-grid">
            <Field label="Font size"><NumberInput value={node.props.fontSize} onChange={(fontSize) => update({ fontSize })} min={8} /></Field>
            <Field label="Weight"><NumberInput value={node.props.fontWeight} onChange={(fontWeight) => update({ fontWeight })} min={100} /></Field>
          </div>
        )}
        {node.type !== 'text' && node.type !== 'image' && (
          <Field label="Border">
            <div className="color-field"><input type="color" value={node.props.borderColor ?? '#d1d5db'} onChange={(event) => update({ borderColor: event.target.value })} /><code>{node.props.borderColor ?? 'none'}</code></div>
          </Field>
        )}
      </div>

      <button className="danger-button" onClick={() => deleteNode(selectedId)}>Delete component</button>
    </aside>
  )
}
