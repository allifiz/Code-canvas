import { useState, type ReactNode } from 'react'
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

function NumberInput({
  value,
  onChange,
  min,
  max,
  step,
}: {
  value?: number
  onChange: (value: number | undefined) => void
  min?: number
  max?: number
  step?: number
}) {
  return (
    <input
      type="number"
      min={min}
      max={max}
      step={step}
      value={value ?? ''}
      placeholder="—"
      onChange={(event) => {
        const raw = event.target.value
        onChange(raw === '' ? undefined : Number(raw))
      }}
    />
  )
}

function ColorField({
  value,
  fallback,
  onChange,
}: {
  value?: string
  fallback: string
  onChange: (value: string) => void
}) {
  const safeColor = value?.startsWith('#') && (value.length === 7 || value.length === 4)
    ? value
    : fallback

  return (
    <div className="color-field">
      <input type="color" value={safeColor} onChange={(event) => onChange(event.target.value)} />
      <input
        className="color-text-input"
        value={value ?? ''}
        placeholder={fallback}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}

function Section({
  title,
  children,
  defaultOpen = true,
}: {
  title: string
  children: ReactNode
  defaultOpen?: boolean
}) {
  return (
    <details className="inspector-section" open={defaultOpen}>
      <summary>{title}</summary>
      <div className="inspector-section-body">{children}</div>
    </details>
  )
}

const textLike = new Set(['text', 'button', 'input', 'textarea', 'link'])

export function PropertiesPanel() {
  const [tab, setTab] = useState<'design' | 'inspect'>('design')
  const selectedId = useEditorStore((state) => state.selectedId)
  const selectedIds = useEditorStore((state) => state.selectedIds)
  const node = useEditorStore((state) => (state.selectedId ? state.nodes[state.selectedId] : undefined))
  const updateNode = useEditorStore((state) => state.updateNode)
  const deleteNode = useEditorStore((state) => state.deleteNode)
  const deleteSelected = useEditorStore((state) => state.deleteSelected)
  const duplicateNode = useEditorStore((state) => state.duplicateNode)
  const groupSelected = useEditorStore((state) => state.groupSelected)
  const ungroupSelected = useEditorStore((state) => state.ungroupSelected)
  const copyStyle = useEditorStore((state) => state.copyStyle)
  const pasteStyle = useEditorStore((state) => state.pasteStyle)
  const copiedStyle = useEditorStore((state) => state.copiedStyle)
  const projectComponents = useEditorStore((state) => state.projectComponents)

  if (selectedIds.length > 1) {
    return (
      <aside className="properties panel">
        <div className="inspector-tabs">
          <button className="active">Design</button>
          <button disabled>Inspect</button>
        </div>

        <div className="multi-selection-panel">
          <div className="multi-selection-icon">◇◇</div>
          <strong>{selectedIds.length} layers selected</strong>
          <p>Group them, move them together with the arrow keys, or delete them as one selection.</p>

          <div className="multi-selection-actions">
            <button className="primary-button" onClick={groupSelected}>Group selection</button>
            <button className="ghost-button" onClick={deleteSelected}>Delete selection</button>
          </div>

          <div className="multi-selection-list">
            {selectedIds.map((id) => (
              <div key={id}>
                <span>{useEditorStore.getState().nodes[id]?.name ?? useEditorStore.getState().nodes[id]?.type ?? 'Layer'}</span>
                <code>{id.slice(0, 8)}</code>
              </div>
            ))}
          </div>
        </div>
      </aside>
    )
  }

  if (!node || !selectedId) {
    return (
      <aside className="properties panel">
        <div className="inspector-tabs">
          <button className="active">Design</button>
          <button disabled>Inspect</button>
        </div>
        <div className="properties-empty">
          <div>◇</div>
          <p>Select a layer to customize it.</p>
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

  const effectivePadding = {
    top: node.props.paddingTop ?? node.props.padding,
    right: node.props.paddingRight ?? node.props.padding,
    bottom: node.props.paddingBottom ?? node.props.padding,
    left: node.props.paddingLeft ?? node.props.padding,
  }

  const effectiveRadius = {
    topLeft: node.props.radiusTopLeft ?? node.props.radius,
    topRight: node.props.radiusTopRight ?? node.props.radius,
    bottomRight: node.props.radiusBottomRight ?? node.props.radius,
    bottomLeft: node.props.radiusBottomLeft ?? node.props.radius,
  }

  return (
    <aside className="properties panel">
      <div className="inspector-tabs">
        <button className={tab === 'design' ? 'active' : ''} onClick={() => setTab('design')}>Design</button>
        <button className={tab === 'inspect' ? 'active' : ''} onClick={() => setTab('inspect')}>Inspect</button>
      </div>

      <div className="inspector-selection-heading">
        <div>
          <strong>{projectComponent?.name ?? (node.type === 'container' ? 'Frame' : node.type)}</strong>
          <code>{selectedId.slice(0, 8)}</code>
        </div>
        <button onClick={() => duplicateNode(selectedId)} title="Duplicate">⧉</button>
      </div>

      {tab === 'inspect' ? (
        <div className="inspect-panel">
          <div className="inspect-meta">
            <span>Type</span><code>{node.type}</code>
            <span>Children</span><code>{node.children.length}</code>
            {projectComponent && (
              <>
                <span>Import</span><code>{projectComponent.importPath}</code>
              </>
            )}
          </div>
          <div className="group-heading">Node props</div>
          <pre>{JSON.stringify(node.props, null, 2)}</pre>
        </div>
      ) : (
        <div className="design-inspector-scroll">
          <Section title="Content">
            {(node.type === 'text' || node.type === 'button' || node.type === 'link') && (
              <Field label="Text">
                <textarea value={node.props.text ?? ''} onChange={(event) => update({ text: event.target.value })} rows={3} />
              </Field>
            )}

            {(node.type === 'input' || node.type === 'textarea') && (
              <Field label="Placeholder">
                <input value={node.props.placeholder ?? ''} onChange={(event) => update({ placeholder: event.target.value })} />
              </Field>
            )}

            {node.type === 'link' && (
              <Field label="URL">
                <input value={node.props.href ?? ''} onChange={(event) => update({ href: event.target.value })} />
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
                <Field label="Component"><input value={projectComponent?.name ?? 'Missing component'} readOnly /></Field>
                <Field label="Import"><input value={projectComponent?.importPath ?? ''} readOnly /></Field>
              </>
            )}
          </Section>

          {node.type === 'component' && (
            <Section title="Component props">
              {Object.entries(node.props.componentProps ?? {}).length ? (
                Object.entries(node.props.componentProps ?? {}).map(([key, value]) => (
                  <Field key={key} label={key}>
                    {typeof value === 'boolean' ? (
                      <select value={String(value)} onChange={(event) => updateComponentProp(key, event.target.value === 'true')}>
                        <option value="true">true</option>
                        <option value="false">false</option>
                      </select>
                    ) : typeof value === 'number' ? (
                      <input type="number" value={value} onChange={(event) => updateComponentProp(key, Number(event.target.value))} />
                    ) : (
                      <input value={value} onChange={(event) => updateComponentProp(key, event.target.value)} />
                    )}
                  </Field>
                ))
              ) : (
                <p className="inspector-note">No registered props for this component.</p>
              )}
            </Section>
          )}

          {node.type === 'container' && (
            <Section title="Auto layout">
              <Field label="Display">
                <select value={node.props.display ?? 'flex'} onChange={(event) => update({ display: event.target.value as NodeProps['display'] })}>
                  <option value="flex">Flex</option>
                  <option value="grid">Grid</option>
                  <option value="block">Block</option>
                </select>
              </Field>

              {node.props.display === 'flex' && (
                <>
                  <div className="segmented-control">
                    <button className={node.props.direction === 'row' ? 'active' : ''} onClick={() => update({ direction: 'row' })}>→ Row</button>
                    <button className={node.props.direction !== 'row' ? 'active' : ''} onClick={() => update({ direction: 'column' })}>↓ Column</button>
                  </div>

                  <Field label="Align">
                    <select value={node.props.align ?? 'stretch'} onChange={(event) => update({ align: event.target.value as NodeProps['align'] })}>
                      <option value="stretch">Stretch</option>
                      <option value="flex-start">Start</option>
                      <option value="center">Center</option>
                      <option value="flex-end">End</option>
                    </select>
                  </Field>

                  <Field label="Justify">
                    <select value={node.props.justify ?? 'flex-start'} onChange={(event) => update({ justify: event.target.value as NodeProps['justify'] })}>
                      <option value="flex-start">Start</option>
                      <option value="center">Center</option>
                      <option value="flex-end">End</option>
                      <option value="space-between">Space between</option>
                      <option value="space-around">Space around</option>
                      <option value="space-evenly">Space evenly</option>
                    </select>
                  </Field>
                </>
              )}

              {node.props.display === 'grid' && (
                <Field label="Columns">
                  <NumberInput value={node.props.gridColumns ?? 2} min={1} max={12} onChange={(gridColumns) => update({ gridColumns })} />
                </Field>
              )}

              <div className="field-grid">
                <Field label="Gap"><NumberInput value={node.props.gap} min={0} onChange={(gap) => update({ gap })} /></Field>
                <Field label="Overflow">
                  <select value={node.props.overflow ?? 'visible'} onChange={(event) => update({ overflow: event.target.value as NodeProps['overflow'] })}>
                    <option value="visible">Visible</option>
                    <option value="hidden">Hidden</option>
                    <option value="auto">Auto</option>
                    <option value="scroll">Scroll</option>
                  </select>
                </Field>
              </div>
            </Section>
          )}

          <Section title="Position">
            <div className="field-grid">
              <Field label="X">
                <NumberInput value={node.props.translateX ?? 0} onChange={(translateX) => update({ translateX })} />
              </Field>
              <Field label="Y">
                <NumberInput value={node.props.translateY ?? 0} onChange={(translateY) => update({ translateY })} />
              </Field>
            </div>
          </Section>

          <Section title="Size">
            <div className="field-grid">
              <Field label="W"><input value={node.props.width ?? 'auto'} onChange={(event) => update({ width: event.target.value })} /></Field>
              <Field label="H"><input value={node.props.height ?? 'auto'} onChange={(event) => update({ height: event.target.value })} /></Field>
              <Field label="Min W"><input value={node.props.minWidth ?? ''} placeholder="none" onChange={(event) => update({ minWidth: event.target.value || undefined })} /></Field>
              <Field label="Min H"><NumberInput value={node.props.minHeight} min={0} onChange={(minHeight) => update({ minHeight })} /></Field>
              <Field label="Max W"><input value={node.props.maxWidth ?? ''} placeholder="none" onChange={(event) => update({ maxWidth: event.target.value || undefined })} /></Field>
              <Field label="Max H"><input value={node.props.maxHeight ?? ''} placeholder="none" onChange={(event) => update({ maxHeight: event.target.value || undefined })} /></Field>
            </div>
          </Section>

          <Section title="Spacing">
            <div className="property-subtitle">Padding</div>
            <div className="box-control-grid">
              <Field label="Top"><NumberInput value={effectivePadding.top} onChange={(paddingTop) => update({ paddingTop })} /></Field>
              <Field label="Right"><NumberInput value={effectivePadding.right} onChange={(paddingRight) => update({ paddingRight })} /></Field>
              <Field label="Bottom"><NumberInput value={effectivePadding.bottom} onChange={(paddingBottom) => update({ paddingBottom })} /></Field>
              <Field label="Left"><NumberInput value={effectivePadding.left} onChange={(paddingLeft) => update({ paddingLeft })} /></Field>
            </div>

            <div className="property-subtitle">Margin</div>
            <div className="box-control-grid">
              <Field label="Top"><NumberInput value={node.props.marginTop} onChange={(marginTop) => update({ marginTop })} /></Field>
              <Field label="Right"><NumberInput value={node.props.marginRight} onChange={(marginRight) => update({ marginRight })} /></Field>
              <Field label="Bottom"><NumberInput value={node.props.marginBottom} onChange={(marginBottom) => update({ marginBottom })} /></Field>
              <Field label="Left"><NumberInput value={node.props.marginLeft} onChange={(marginLeft) => update({ marginLeft })} /></Field>
            </div>
          </Section>

          {textLike.has(node.type) && (
            <Section title="Typography">
              <Field label="Font">
                <input value={node.props.fontFamily ?? ''} placeholder="Inter, sans-serif" onChange={(event) => update({ fontFamily: event.target.value })} />
              </Field>

              <div className="field-grid">
                <Field label="Size"><NumberInput value={node.props.fontSize} min={1} onChange={(fontSize) => update({ fontSize })} /></Field>
                <Field label="Weight"><NumberInput value={node.props.fontWeight} min={100} max={900} step={50} onChange={(fontWeight) => update({ fontWeight })} /></Field>
                <Field label="Line"><NumberInput value={node.props.lineHeight} min={0.5} step={0.1} onChange={(lineHeight) => update({ lineHeight })} /></Field>
                <Field label="Tracking"><NumberInput value={node.props.letterSpacing} step={0.1} onChange={(letterSpacing) => update({ letterSpacing })} /></Field>
              </div>

              <div className="field-grid">
                <Field label="Align">
                  <select value={node.props.textAlign ?? 'left'} onChange={(event) => update({ textAlign: event.target.value as NodeProps['textAlign'] })}>
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                    <option value="justify">Justify</option>
                  </select>
                </Field>

                <Field label="Case">
                  <select value={node.props.textTransform ?? 'none'} onChange={(event) => update({ textTransform: event.target.value as NodeProps['textTransform'] })}>
                    <option value="none">None</option>
                    <option value="uppercase">Upper</option>
                    <option value="lowercase">Lower</option>
                    <option value="capitalize">Title</option>
                  </select>
                </Field>
              </div>

              <Field label="Decoration">
                <select value={node.props.textDecoration ?? 'none'} onChange={(event) => update({ textDecoration: event.target.value as NodeProps['textDecoration'] })}>
                  <option value="none">None</option>
                  <option value="underline">Underline</option>
                  <option value="line-through">Strikethrough</option>
                </select>
              </Field>
            </Section>
          )}

          <Section title="Fill & opacity">
            {node.type !== 'image' && (
              <Field label="Fill">
                <ColorField value={node.props.background} fallback="#ffffff" onChange={(background) => update({ background })} />
              </Field>
            )}

            {textLike.has(node.type) && (
              <Field label="Text">
                <ColorField value={node.props.color} fallback="#111827" onChange={(color) => update({ color })} />
              </Field>
            )}

            <Field label={`Opacity ${Math.round((node.props.opacity ?? 1) * 100)}%`}>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={node.props.opacity ?? 1}
                onChange={(event) => update({ opacity: Number(event.target.value) })}
              />
            </Field>
          </Section>

          <Section title="Border & radius" defaultOpen={false}>
            <div className="field-grid">
              <Field label="Width"><NumberInput value={node.props.borderWidth} min={0} onChange={(borderWidth) => update({ borderWidth })} /></Field>
              <Field label="Style">
                <select value={node.props.borderStyle ?? 'solid'} onChange={(event) => update({ borderStyle: event.target.value as NodeProps['borderStyle'] })}>
                  <option value="solid">Solid</option>
                  <option value="dashed">Dashed</option>
                  <option value="dotted">Dotted</option>
                  <option value="none">None</option>
                </select>
              </Field>
            </div>

            <Field label="Color">
              <ColorField value={node.props.borderColor} fallback="#d1d5db" onChange={(borderColor) => update({ borderColor })} />
            </Field>

            <div className="property-subtitle">Corner radius</div>
            <div className="box-control-grid">
              <Field label="TL"><NumberInput value={effectiveRadius.topLeft} min={0} onChange={(radiusTopLeft) => update({ radiusTopLeft })} /></Field>
              <Field label="TR"><NumberInput value={effectiveRadius.topRight} min={0} onChange={(radiusTopRight) => update({ radiusTopRight })} /></Field>
              <Field label="BR"><NumberInput value={effectiveRadius.bottomRight} min={0} onChange={(radiusBottomRight) => update({ radiusBottomRight })} /></Field>
              <Field label="BL"><NumberInput value={effectiveRadius.bottomLeft} min={0} onChange={(radiusBottomLeft) => update({ radiusBottomLeft })} /></Field>
            </div>
          </Section>

          <Section title="Effects" defaultOpen={false}>
            <div className="field-grid">
              <Field label="X"><NumberInput value={node.props.shadowX} onChange={(shadowX) => update({ shadowX })} /></Field>
              <Field label="Y"><NumberInput value={node.props.shadowY} onChange={(shadowY) => update({ shadowY })} /></Field>
              <Field label="Blur"><NumberInput value={node.props.shadowBlur} min={0} onChange={(shadowBlur) => update({ shadowBlur })} /></Field>
              <Field label="Spread"><NumberInput value={node.props.shadowSpread} onChange={(shadowSpread) => update({ shadowSpread })} /></Field>
            </div>
            <Field label="Shadow">
              <ColorField value={node.props.shadowColor} fallback="#000000" onChange={(shadowColor) => update({ shadowColor })} />
            </Field>
          </Section>

          {node.type === 'image' && (
            <Section title="Image" defaultOpen={false}>
              <Field label="Fit">
                <select value={node.props.objectFit ?? 'cover'} onChange={(event) => update({ objectFit: event.target.value as NodeProps['objectFit'] })}>
                  <option value="cover">Cover</option>
                  <option value="contain">Contain</option>
                  <option value="fill">Fill</option>
                  <option value="none">None</option>
                </select>
              </Field>
              <Field label="Position">
                <input value={node.props.objectPosition ?? 'center'} onChange={(event) => update({ objectPosition: event.target.value })} />
              </Field>
            </Section>
          )}

          <Section title="Style actions" defaultOpen={false}>
            <div className="inspector-action-grid">
              <button onClick={() => copyStyle(selectedId)}>Copy style</button>
              <button disabled={!copiedStyle} onClick={() => pasteStyle(selectedId)}>Paste style</button>
              <button onClick={() => duplicateNode(selectedId)}>Duplicate</button>
              {node.type === 'container' && node.children.length > 0 ? (
                <button onClick={ungroupSelected}>Ungroup</button>
              ) : (
                <button disabled>Ungroup</button>
              )}
              <button className="danger-inline" onClick={() => deleteNode(selectedId)}>Delete</button>
            </div>
          </Section>
        </div>
      )}
    </aside>
  )
}
