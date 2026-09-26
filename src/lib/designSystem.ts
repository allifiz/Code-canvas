import type {
  CanvasNode,
  DesignSystem,
  NodeProps,
  ResponsiveViewport,
  Viewport,
} from '../types'

export const defaultDesignSystem: DesignSystem = {
  colors: [
    { id: 'color-brand-primary', name: 'Brand / Primary', value: '#6366f1' },
    { id: 'color-surface', name: 'Surface / Default', value: '#ffffff' },
    { id: 'color-text-primary', name: 'Text / Primary', value: '#0f172a' },
    { id: 'color-text-muted', name: 'Text / Muted', value: '#64748b' },
  ],
  textStyles: [
    {
      id: 'text-display',
      name: 'Display',
      value: {
        fontFamily: 'Inter, sans-serif',
        fontSize: 52,
        fontWeight: 800,
        lineHeight: 1.05,
        letterSpacing: -1,
      },
    },
    {
      id: 'text-heading',
      name: 'Heading',
      value: {
        fontFamily: 'Inter, sans-serif',
        fontSize: 28,
        fontWeight: 750,
        lineHeight: 1.2,
        letterSpacing: -0.3,
      },
    },
    {
      id: 'text-body',
      name: 'Body',
      value: {
        fontFamily: 'Inter, sans-serif',
        fontSize: 16,
        fontWeight: 400,
        lineHeight: 1.6,
        letterSpacing: 0,
      },
    },
    {
      id: 'text-label',
      name: 'Label',
      value: {
        fontFamily: 'Inter, sans-serif',
        fontSize: 12,
        fontWeight: 700,
        lineHeight: 1.2,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
      },
    },
  ],
}

export function resolveTokenProps(props: NodeProps, designSystem: DesignSystem): NodeProps {
  const resolved = { ...props }

  if (resolved.backgroundTokenId) {
    const token = designSystem.colors.find((item) => item.id === resolved.backgroundTokenId)
    if (token) resolved.background = token.value
  }

  if (resolved.colorTokenId) {
    const token = designSystem.colors.find((item) => item.id === resolved.colorTokenId)
    if (token) resolved.color = token.value
  }

  if (resolved.textStyleTokenId) {
    const token = designSystem.textStyles.find((item) => item.id === resolved.textStyleTokenId)
    if (token) Object.assign(resolved, token.value)
  }

  return resolved
}

export function effectiveNodeProps(
  node: CanvasNode,
  viewport: Viewport,
  designSystem: DesignSystem,
): NodeProps {
  const override =
    viewport === 'desktop'
      ? undefined
      : node.responsive?.[viewport as ResponsiveViewport]

  return resolveTokenProps(
    {
      ...node.props,
      ...(override ?? {}),
    },
    designSystem,
  )
}

export function responsiveOverride(
  node: CanvasNode,
  viewport: ResponsiveViewport,
): Partial<NodeProps> {
  return node.responsive?.[viewport] ?? {}
}
