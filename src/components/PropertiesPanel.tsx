import { useState, type ReactNode } from 'react'
import { effectiveNodeProps } from '../lib/designSystem'
import { useEditorStore } from '../store'
import type { NodeProps, TextStyleValue } from '../types'

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
  const safeColor =
    value?.startsWith('#') && (value.length === 7 || value.length === 4)
      ? value
      : fallback

  return (
    <div className="color-field">
      <input
        type="color"
        value={safeColor}
        onChange={(event) => onChange(event.target.value)}
      />
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
  const [newColorName, setNewColorName] = useState('New color')
  const [newColorValue, setNewColorValue] = useState('#6366f1')
  const [newTextStyleName, setNewTextStyleName] = useState('New text style')

  const selectedId = useEditorStore((state) => state.selectedId)
  const selectedIds = useEditorStore((state) => state.selectedIds)
  const node = useEditorStore((state) =>
    state.selectedId ? state.nodes[state.selectedId] : undefined,
  )

  const viewport = useEditorStore((state) => state.viewport)
  const designSystem = useEditorStore((state) => state.designSystem)
  const updateNode = useEditorStore((state) => state.updateNode)
  const updateNodeForViewport = useEditorStore((state) => state.updateNodeForViewport)
  const clearResponsiveOverrides = useEditorStore((state) => state.clearResponsiveOverrides)
  const addColorToken = useEditorStore((state) => state.addColorToken)
  const updateColorToken = useEditorStore((state) => state.updateColorToken)
  const addTextStyleToken = useEditorStore((state) => state.addTextStyleToken)
  const updateTextStyleToken = useEditorStore((state) => state.updateTextStyleToken)

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
          <p>
            Group them, move them together with the arrow keys, or delete them as
            one selection.
          </p>

          <div className="multi-selection-actions">
            <button className="primary-button" onClick={groupSelected}>
              Group selection
            </button>
            <button className="ghost-button" onClick={deleteSelected}>
              Delete selection
            </button>
          </div>

          <div className="multi-selection-list">
            {selectedIds.map((id) => {
              const item = useEditorStore.getState().nodes[id]
              return (
                <div key={id}>
                  <span>{item?.name ?? item?.type ?? 'Layer'}</span>
                  <code>{id.slice(0, 8)}</code>
                </div>
              )
            })}
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

  const activeProps = effectiveNodeProps(node, viewport, designSystem)
  const updateVisual = (props: Partial<NodeProps>) =>
    updateNodeForViewport(selectedId, viewport, props)
  const updateContent = (props: Partial<NodeProps>) => updateNode(selectedId, props)

  const projectComponent =
    node.type === 'component'
      ? projectComponents.find(
          (component) => component.id === node.props.componentId,
        )
      : undefined

  const updateComponentProp = (
    key: string,
    value: string | number | boolean,
  ) => {
    updateContent({
      componentProps: {
        ...(node.props.componentProps ?? {}),
        [key]: value,
      },
    })
  }

  const effectivePadding = {
    top: activeProps.paddingTop ?? activeProps.padding,
    right: activeProps.paddingRight ?? activeProps.padding,
    bottom: activeProps.paddingBottom ?? activeProps.padding,
    left: activeProps.paddingLeft ?? activeProps.padding,
  }

  const effectiveRadius = {
    topLeft: activeProps.radiusTopLeft ?? activeProps.radius,
    topRight: activeProps.radiusTopRight ?? activeProps.radius,
    bottomRight: activeProps.radiusBottomRight ?? activeProps.radius,
    bottomLeft: activeProps.radiusBottomLeft ?? activeProps.radius,
  }

  const detachTextStyle = (patch: Partial<NodeProps>) =>
    updateVisual({ textStyleTokenId: undefined, ...patch })

  const currentTextStyle: TextStyleValue = {
    fontFamily: activeProps.fontFamily,
    fontSize: activeProps.fontSize,
    fontWeight: activeProps.fontWeight,
    lineHeight: activeProps.lineHeight,
    letterSpacing: activeProps.letterSpacing,
    textTransform: activeProps.textTransform,
  }

  return (
    <aside className="properties panel">
      <div className="inspector-tabs">
        <button
          className={tab === 'design' ? 'active' : ''}
          onClick={() => setTab('design')}
        >
          Design
        </button>
        <button
          className={tab === 'inspect' ? 'active' : ''}
          onClick={() => setTab('inspect')}
        >
          Inspect
        </button>
      </div>

      <div className="inspector-selection-heading">
        <div>
          <strong>
            {projectComponent?.name ??
              (node.type === 'container' ? 'Frame' : node.type)}
          </strong>
          <code>{selectedId.slice(0, 8)}</code>
        </div>
        <button onClick={() => duplicateNode(selectedId)} title="Duplicate">
          ⧉
        </button>
      </div>

      {viewport !== 'desktop' && (
        <div className="responsive-override-banner">
          <div>
            <strong>{viewport} override</strong>
            <small>
              Only style/layout changes made here override desktop values.
            </small>
          </div>
          <button
            onClick={() => clearResponsiveOverrides(selectedId, viewport)}
            disabled={!node.responsive?.[viewport]}
          >
            Reset
          </button>
        </div>
      )}

      {tab === 'inspect' ? (
        <div className="inspect-panel">
          <div className="inspect-meta">
            <span>Type</span>
            <code>{node.type}</code>
            <span>Viewport</span>
            <code>{viewport}</code>
            <span>Children</span>
            <code>{node.children.length}</code>
            {projectComponent && (
              <>
                <span>Import</span>
                <code>{projectComponent.importPath}</code>
              </>
            )}
          </div>

          <div className="group-heading">Resolved props</div>
          <pre>{JSON.stringify(activeProps, null, 2)}</pre>

          {node.responsive && (
            <>
              <div className="group-heading inspect-responsive-heading">
                Breakpoint overrides
              </div>
              <pre>{JSON.stringify(node.responsive, null, 2)}</pre>
            </>
          )}
        </div>
      ) : (
        <div className="design-inspector-scroll">
          <Section title="Content">
            {(node.type === 'text' ||
              node.type === 'button' ||
              node.type === 'link') && (
              <Field label="Text">
                <textarea
                  value={node.props.text ?? ''}
                  onChange={(event) =>
                    updateContent({ text: event.target.value })
                  }
                  rows={3}
                />
              </Field>
            )}

            {(node.type === 'input' || node.type === 'textarea') && (
              <Field label="Placeholder">
                <input
                  value={node.props.placeholder ?? ''}
                  onChange={(event) =>
                    updateContent({ placeholder: event.target.value })
                  }
                />
              </Field>
            )}

            {node.type === 'link' && (
              <Field label="URL">
                <input
                  value={node.props.href ?? ''}
                  onChange={(event) =>
                    updateContent({ href: event.target.value })
                  }
                />
              </Field>
            )}

            {node.type === 'image' && (
              <>
                <Field label="Image URL">
                  <input
                    value={node.props.src ?? ''}
                    onChange={(event) =>
                      updateContent({ src: event.target.value })
                    }
                  />
                </Field>
                <Field label="Alt text">
                  <input
                    value={node.props.alt ?? ''}
                    onChange={(event) =>
                      updateContent({ alt: event.target.value })
                    }
                  />
                </Field>
              </>
            )}

            {node.type === 'component' && (
              <>
                <Field label="Component">
                  <input
                    value={projectComponent?.name ?? 'Missing component'}
                    readOnly
                  />
                </Field>
                <Field label="Import">
                  <input value={projectComponent?.importPath ?? ''} readOnly />
                </Field>
              </>
            )}
          </Section>

          {node.type === 'component' && (
            <Section title="Component props">
              {Object.entries(node.props.componentProps ?? {}).length ? (
                Object.entries(node.props.componentProps ?? {}).map(
                  ([key, value]) => (
                    <Field key={key} label={key}>
                      {typeof value === 'boolean' ? (
                        <select
                          value={String(value)}
                          onChange={(event) =>
                            updateComponentProp(
                              key,
                              event.target.value === 'true',
                            )
                          }
                        >
                          <option value="true">true</option>
                          <option value="false">false</option>
                        </select>
                      ) : typeof value === 'number' ? (
                        <input
                          type="number"
                          value={value}
                          onChange={(event) =>
                            updateComponentProp(key, Number(event.target.value))
                          }
                        />
                      ) : (
                        <input
                          value={value}
                          onChange={(event) =>
                            updateComponentProp(key, event.target.value)
                          }
                        />
                      )}
                    </Field>
                  ),
                )
              ) : (
                <p className="inspector-note">
                  No registered props for this component.
                </p>
              )}
            </Section>
          )}

          {node.type === 'container' && (
            <Section title="Auto layout">
              <Field label="Display">
                <select
                  value={activeProps.display ?? 'flex'}
                  onChange={(event) =>
                    updateVisual({
                      display: event.target.value as NodeProps['display'],
                    })
                  }
                >
                  <option value="flex">Flex</option>
                  <option value="grid">Grid</option>
                  <option value="block">Block</option>
                  <option value="none">Hidden at breakpoint</option>
                </select>
              </Field>

              {activeProps.display === 'flex' && (
                <>
                  <div className="segmented-control">
                    <button
                      className={
                        activeProps.direction === 'row' ? 'active' : ''
                      }
                      onClick={() => updateVisual({ direction: 'row' })}
                    >
                      → Row
                    </button>
                    <button
                      className={
                        activeProps.direction !== 'row' ? 'active' : ''
                      }
                      onClick={() => updateVisual({ direction: 'column' })}
                    >
                      ↓ Column
                    </button>
                  </div>

                  <Field label="Align">
                    <select
                      value={activeProps.align ?? 'stretch'}
                      onChange={(event) =>
                        updateVisual({
                          align: event.target.value as NodeProps['align'],
                        })
                      }
                    >
                      <option value="stretch">Stretch</option>
                      <option value="flex-start">Start</option>
                      <option value="center">Center</option>
                      <option value="flex-end">End</option>
                    </select>
                  </Field>

                  <Field label="Justify">
                    <select
                      value={activeProps.justify ?? 'flex-start'}
                      onChange={(event) =>
                        updateVisual({
                          justify: event.target.value as NodeProps['justify'],
                        })
                      }
                    >
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

              {activeProps.display === 'grid' && (
                <Field label="Columns">
                  <NumberInput
                    value={activeProps.gridColumns ?? 2}
                    min={1}
                    max={12}
                    onChange={(gridColumns) =>
                      updateVisual({ gridColumns })
                    }
                  />
                </Field>
              )}

              <div className="field-grid">
                <Field label="Gap">
                  <NumberInput
                    value={activeProps.gap}
                    min={0}
                    onChange={(gap) => updateVisual({ gap })}
                  />
                </Field>
                <Field label="Overflow">
                  <select
                    value={activeProps.overflow ?? 'visible'}
                    onChange={(event) =>
                      updateVisual({
                        overflow: event.target.value as NodeProps['overflow'],
                      })
                    }
                  >
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
                <NumberInput
                  value={activeProps.translateX ?? 0}
                  onChange={(translateX) =>
                    updateVisual({ translateX })
                  }
                />
              </Field>
              <Field label="Y">
                <NumberInput
                  value={activeProps.translateY ?? 0}
                  onChange={(translateY) =>
                    updateVisual({ translateY })
                  }
                />
              </Field>
            </div>
          </Section>

          <Section title="Size">
            <div className="field-grid">
              <Field label="W">
                <input
                  value={activeProps.width ?? 'auto'}
                  onChange={(event) =>
                    updateVisual({ width: event.target.value })
                  }
                />
              </Field>
              <Field label="H">
                <input
                  value={activeProps.height ?? 'auto'}
                  onChange={(event) =>
                    updateVisual({ height: event.target.value })
                  }
                />
              </Field>
              <Field label="Min W">
                <input
                  value={activeProps.minWidth ?? ''}
                  placeholder="none"
                  onChange={(event) =>
                    updateVisual({
                      minWidth: event.target.value || undefined,
                    })
                  }
                />
              </Field>
              <Field label="Min H">
                <NumberInput
                  value={activeProps.minHeight}
                  min={0}
                  onChange={(minHeight) =>
                    updateVisual({ minHeight })
                  }
                />
              </Field>
              <Field label="Max W">
                <input
                  value={activeProps.maxWidth ?? ''}
                  placeholder="none"
                  onChange={(event) =>
                    updateVisual({
                      maxWidth: event.target.value || undefined,
                    })
                  }
                />
              </Field>
              <Field label="Max H">
                <input
                  value={activeProps.maxHeight ?? ''}
                  placeholder="none"
                  onChange={(event) =>
                    updateVisual({
                      maxHeight: event.target.value || undefined,
                    })
                  }
                />
              </Field>
            </div>
          </Section>

          <Section title="Spacing">
            <div className="property-subtitle">Padding</div>
            <div className="box-control-grid">
              <Field label="Top">
                <NumberInput
                  value={effectivePadding.top}
                  onChange={(paddingTop) =>
                    updateVisual({ paddingTop })
                  }
                />
              </Field>
              <Field label="Right">
                <NumberInput
                  value={effectivePadding.right}
                  onChange={(paddingRight) =>
                    updateVisual({ paddingRight })
                  }
                />
              </Field>
              <Field label="Bottom">
                <NumberInput
                  value={effectivePadding.bottom}
                  onChange={(paddingBottom) =>
                    updateVisual({ paddingBottom })
                  }
                />
              </Field>
              <Field label="Left">
                <NumberInput
                  value={effectivePadding.left}
                  onChange={(paddingLeft) =>
                    updateVisual({ paddingLeft })
                  }
                />
              </Field>
            </div>

            <div className="property-subtitle">Margin</div>
            <div className="box-control-grid">
              <Field label="Top">
                <NumberInput
                  value={activeProps.marginTop}
                  onChange={(marginTop) => updateVisual({ marginTop })}
                />
              </Field>
              <Field label="Right">
                <NumberInput
                  value={activeProps.marginRight}
                  onChange={(marginRight) =>
                    updateVisual({ marginRight })
                  }
                />
              </Field>
              <Field label="Bottom">
                <NumberInput
                  value={activeProps.marginBottom}
                  onChange={(marginBottom) =>
                    updateVisual({ marginBottom })
                  }
                />
              </Field>
              <Field label="Left">
                <NumberInput
                  value={activeProps.marginLeft}
                  onChange={(marginLeft) =>
                    updateVisual({ marginLeft })
                  }
                />
              </Field>
            </div>
          </Section>

          {textLike.has(node.type) && (
            <Section title="Typography">
              <Field label="Text style">
                <select
                  value={activeProps.textStyleTokenId ?? ''}
                  onChange={(event) =>
                    updateVisual({
                      textStyleTokenId: event.target.value || undefined,
                    })
                  }
                >
                  <option value="">Custom</option>
                  {designSystem.textStyles.map((token) => (
                    <option key={token.id} value={token.id}>
                      {token.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Font">
                <input
                  value={activeProps.fontFamily ?? ''}
                  placeholder="Inter, sans-serif"
                  onChange={(event) =>
                    detachTextStyle({
                      fontFamily: event.target.value,
                    })
                  }
                />
              </Field>

              <div className="field-grid">
                <Field label="Size">
                  <NumberInput
                    value={activeProps.fontSize}
                    min={1}
                    onChange={(fontSize) =>
                      detachTextStyle({ fontSize })
                    }
                  />
                </Field>
                <Field label="Weight">
                  <NumberInput
                    value={activeProps.fontWeight}
                    min={100}
                    max={900}
                    step={50}
                    onChange={(fontWeight) =>
                      detachTextStyle({ fontWeight })
                    }
                  />
                </Field>
                <Field label="Line">
                  <NumberInput
                    value={activeProps.lineHeight}
                    min={0.5}
                    step={0.1}
                    onChange={(lineHeight) =>
                      detachTextStyle({ lineHeight })
                    }
                  />
                </Field>
                <Field label="Tracking">
                  <NumberInput
                    value={activeProps.letterSpacing}
                    step={0.1}
                    onChange={(letterSpacing) =>
                      detachTextStyle({ letterSpacing })
                    }
                  />
                </Field>
              </div>

              <div className="field-grid">
                <Field label="Align">
                  <select
                    value={activeProps.textAlign ?? 'left'}
                    onChange={(event) =>
                      updateVisual({
                        textAlign: event.target
                          .value as NodeProps['textAlign'],
                      })
                    }
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                    <option value="justify">Justify</option>
                  </select>
                </Field>

                <Field label="Case">
                  <select
                    value={activeProps.textTransform ?? 'none'}
                    onChange={(event) =>
                      detachTextStyle({
                        textTransform: event.target
                          .value as NodeProps['textTransform'],
                      })
                    }
                  >
                    <option value="none">None</option>
                    <option value="uppercase">Upper</option>
                    <option value="lowercase">Lower</option>
                    <option value="capitalize">Title</option>
                  </select>
                </Field>
              </div>

              <Field label="Decoration">
                <select
                  value={activeProps.textDecoration ?? 'none'}
                  onChange={(event) =>
                    updateVisual({
                      textDecoration: event.target
                        .value as NodeProps['textDecoration'],
                    })
                  }
                >
                  <option value="none">None</option>
                  <option value="underline">Underline</option>
                  <option value="line-through">Strikethrough</option>
                </select>
              </Field>

              <button
                className="inspector-secondary-action"
                onClick={() => {
                  const id = addTextStyleToken(
                    newTextStyleName,
                    currentTextStyle,
                  )
                  updateVisual({ textStyleTokenId: id })
                }}
              >
                Save current as text style
              </button>
            </Section>
          )}

          <Section title="Fill & opacity">
            {node.type !== 'image' && (
              <>
                <Field label="Fill type">
                  <select
                    value={activeProps.fillType ?? 'solid'}
                    onChange={(event) =>
                      updateVisual({
                        fillType: event.target
                          .value as NodeProps['fillType'],
                      })
                    }
                  >
                    <option value="solid">Solid</option>
                    <option value="linear-gradient">
                      Linear gradient
                    </option>
                  </select>
                </Field>

                {activeProps.fillType === 'linear-gradient' ? (
                  <>
                    <Field label="From">
                      <ColorField
                        value={activeProps.gradientFrom ?? '#6366f1'}
                        fallback="#6366f1"
                        onChange={(gradientFrom) =>
                          updateVisual({ gradientFrom })
                        }
                      />
                    </Field>
                    <Field label="To">
                      <ColorField
                        value={activeProps.gradientTo ?? '#ec4899'}
                        fallback="#ec4899"
                        onChange={(gradientTo) =>
                          updateVisual({ gradientTo })
                        }
                      />
                    </Field>
                    <Field label="Angle">
                      <NumberInput
                        value={activeProps.gradientAngle ?? 90}
                        min={0}
                        max={360}
                        onChange={(gradientAngle) =>
                          updateVisual({ gradientAngle })
                        }
                      />
                    </Field>
                  </>
                ) : (
                  <>
                    <Field label="Fill token">
                      <select
                        value={activeProps.backgroundTokenId ?? ''}
                        onChange={(event) =>
                          updateVisual({
                            backgroundTokenId:
                              event.target.value || undefined,
                          })
                        }
                      >
                        <option value="">Custom</option>
                        {designSystem.colors.map((token) => (
                          <option key={token.id} value={token.id}>
                            {token.name}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Fill">
                      <ColorField
                        value={activeProps.background}
                        fallback="#ffffff"
                        onChange={(background) =>
                          updateVisual({
                            backgroundTokenId: undefined,
                            background,
                          })
                        }
                      />
                    </Field>
                  </>
                )}
              </>
            )}

            {textLike.has(node.type) && (
              <>
                <Field label="Text token">
                  <select
                    value={activeProps.colorTokenId ?? ''}
                    onChange={(event) =>
                      updateVisual({
                        colorTokenId:
                          event.target.value || undefined,
                      })
                    }
                  >
                    <option value="">Custom</option>
                    {designSystem.colors.map((token) => (
                      <option key={token.id} value={token.id}>
                        {token.name}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Text">
                  <ColorField
                    value={activeProps.color}
                    fallback="#111827"
                    onChange={(color) =>
                      updateVisual({
                        colorTokenId: undefined,
                        color,
                      })
                    }
                  />
                </Field>
              </>
            )}

            <Field
              label={`Opacity ${Math.round(
                (activeProps.opacity ?? 1) * 100,
              )}%`}
            >
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={activeProps.opacity ?? 1}
                onChange={(event) =>
                  updateVisual({
                    opacity: Number(event.target.value),
                  })
                }
              />
            </Field>
          </Section>

          <Section title="Border & radius" defaultOpen={false}>
            <div className="field-grid">
              <Field label="Width">
                <NumberInput
                  value={activeProps.borderWidth}
                  min={0}
                  onChange={(borderWidth) =>
                    updateVisual({ borderWidth })
                  }
                />
              </Field>
              <Field label="Style">
                <select
                  value={activeProps.borderStyle ?? 'solid'}
                  onChange={(event) =>
                    updateVisual({
                      borderStyle: event.target
                        .value as NodeProps['borderStyle'],
                    })
                  }
                >
                  <option value="solid">Solid</option>
                  <option value="dashed">Dashed</option>
                  <option value="dotted">Dotted</option>
                  <option value="none">None</option>
                </select>
              </Field>
            </div>

            <Field label="Color">
              <ColorField
                value={activeProps.borderColor}
                fallback="#d1d5db"
                onChange={(borderColor) =>
                  updateVisual({ borderColor })
                }
              />
            </Field>

            <div className="property-subtitle">Corner radius</div>
            <div className="box-control-grid">
              <Field label="TL">
                <NumberInput
                  value={effectiveRadius.topLeft}
                  min={0}
                  onChange={(radiusTopLeft) =>
                    updateVisual({ radiusTopLeft })
                  }
                />
              </Field>
              <Field label="TR">
                <NumberInput
                  value={effectiveRadius.topRight}
                  min={0}
                  onChange={(radiusTopRight) =>
                    updateVisual({ radiusTopRight })
                  }
                />
              </Field>
              <Field label="BR">
                <NumberInput
                  value={effectiveRadius.bottomRight}
                  min={0}
                  onChange={(radiusBottomRight) =>
                    updateVisual({ radiusBottomRight })
                  }
                />
              </Field>
              <Field label="BL">
                <NumberInput
                  value={effectiveRadius.bottomLeft}
                  min={0}
                  onChange={(radiusBottomLeft) =>
                    updateVisual({ radiusBottomLeft })
                  }
                />
              </Field>
            </div>
          </Section>

          <Section title="Effects" defaultOpen={false}>
            <div className="field-grid">
              <Field label="X">
                <NumberInput
                  value={activeProps.shadowX}
                  onChange={(shadowX) =>
                    updateVisual({ shadowX })
                  }
                />
              </Field>
              <Field label="Y">
                <NumberInput
                  value={activeProps.shadowY}
                  onChange={(shadowY) =>
                    updateVisual({ shadowY })
                  }
                />
              </Field>
              <Field label="Blur">
                <NumberInput
                  value={activeProps.shadowBlur}
                  min={0}
                  onChange={(shadowBlur) =>
                    updateVisual({ shadowBlur })
                  }
                />
              </Field>
              <Field label="Spread">
                <NumberInput
                  value={activeProps.shadowSpread}
                  onChange={(shadowSpread) =>
                    updateVisual({ shadowSpread })
                  }
                />
              </Field>
            </div>
            <Field label="Shadow">
              <ColorField
                value={activeProps.shadowColor}
                fallback="#000000"
                onChange={(shadowColor) =>
                  updateVisual({ shadowColor })
                }
              />
            </Field>
          </Section>

          {node.type === 'image' && (
            <Section title="Image" defaultOpen={false}>
              <Field label="Fit">
                <select
                  value={activeProps.objectFit ?? 'cover'}
                  onChange={(event) =>
                    updateVisual({
                      objectFit: event.target
                        .value as NodeProps['objectFit'],
                    })
                  }
                >
                  <option value="cover">Cover</option>
                  <option value="contain">Contain</option>
                  <option value="fill">Fill</option>
                  <option value="none">None</option>
                </select>
              </Field>
              <Field label="Position">
                <input
                  value={activeProps.objectPosition ?? 'center'}
                  onChange={(event) =>
                    updateVisual({
                      objectPosition: event.target.value,
                    })
                  }
                />
              </Field>
            </Section>
          )}

          <Section title="Local styles" defaultOpen={false}>
            <div className="property-subtitle">Color tokens</div>
            <div className="token-list">
              {designSystem.colors.map((token) => (
                <div className="token-row" key={token.id}>
                  <input
                    className="token-swatch"
                    type="color"
                    value={token.value}
                    onChange={(event) =>
                      updateColorToken(token.id, {
                        value: event.target.value,
                      })
                    }
                  />
                  <input
                    value={token.name}
                    onChange={(event) =>
                      updateColorToken(token.id, {
                        name: event.target.value,
                      })
                    }
                  />
                  <code>{token.value}</code>
                </div>
              ))}
            </div>

            <div className="token-create-row">
              <input
                value={newColorName}
                onChange={(event) =>
                  setNewColorName(event.target.value)
                }
              />
              <input
                type="color"
                value={newColorValue}
                onChange={(event) =>
                  setNewColorValue(event.target.value)
                }
              />
              <button
                onClick={() =>
                  addColorToken(newColorName, newColorValue)
                }
              >
                +
              </button>
            </div>

            <div className="property-subtitle token-text-heading">
              Text styles
            </div>
            <div className="token-list">
              {designSystem.textStyles.map((token) => (
                <div className="text-token-row" key={token.id}>
                  <input
                    value={token.name}
                    onChange={(event) =>
                      updateTextStyleToken(token.id, {
                        name: event.target.value,
                      })
                    }
                  />
                  <small>
                    {token.value.fontSize ?? '—'}px ·{' '}
                    {token.value.fontWeight ?? '—'}
                  </small>
                </div>
              ))}
            </div>

            <div className="token-create-row text-style-create-row">
              <input
                value={newTextStyleName}
                onChange={(event) =>
                  setNewTextStyleName(event.target.value)
                }
              />
              <button
                onClick={() =>
                  addTextStyleToken(
                    newTextStyleName,
                    currentTextStyle,
                  )
                }
              >
                + Current
              </button>
            </div>
          </Section>

          <Section title="Style actions" defaultOpen={false}>
            <div className="inspector-action-grid">
              <button onClick={() => copyStyle(selectedId)}>
                Copy style
              </button>
              <button
                disabled={!copiedStyle}
                onClick={() => pasteStyle(selectedId)}
              >
                Paste style
              </button>
              <button onClick={() => duplicateNode(selectedId)}>
                Duplicate
              </button>
              {node.type === 'container' && node.children.length > 0 ? (
                <button onClick={ungroupSelected}>Ungroup</button>
              ) : (
                <button disabled>Ungroup</button>
              )}
              <button
                className="danger-inline"
                onClick={() => deleteNode(selectedId)}
              >
                Delete
              </button>
            </div>
          </Section>
        </div>
      )}
    </aside>
  )
}
