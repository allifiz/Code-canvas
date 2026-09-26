export type NodeType =
  | 'container'
  | 'text'
  | 'button'
  | 'input'
  | 'textarea'
  | 'link'
  | 'divider'
  | 'image'
  | 'component'

export type Viewport = 'desktop' | 'tablet' | 'mobile'
export type ResponsiveViewport = Exclude<Viewport, 'desktop'>
export type PresetType = 'navbar' | 'card' | 'login-form' | 'hero'
export type ComponentPropValue = string | number | boolean

export interface ProjectComponentDefinition {
  id: string
  name: string
  importPath: string
  exportName?: string
  defaultProps: Record<string, ComponentPropValue>
  acceptsChildren: boolean
}

export interface NodeProps {
  text?: string
  href?: string
  placeholder?: string
  src?: string
  alt?: string

  display?: 'block' | 'flex' | 'grid' | 'none'
  direction?: 'row' | 'column'
  align?: 'stretch' | 'flex-start' | 'center' | 'flex-end'
  justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly'
  gap?: number
  gridColumns?: number
  overflow?: 'visible' | 'hidden' | 'auto' | 'scroll'

  width?: string
  height?: string
  minWidth?: string
  minHeight?: number
  maxWidth?: string
  maxHeight?: string

  padding?: number
  paddingTop?: number
  paddingRight?: number
  paddingBottom?: number
  paddingLeft?: number
  marginTop?: number
  marginRight?: number
  marginBottom?: number
  marginLeft?: number
  translateX?: number
  translateY?: number

  background?: string
  backgroundTokenId?: string
  color?: string
  colorTokenId?: string
  opacity?: number

  fillType?: 'solid' | 'linear-gradient'
  gradientFrom?: string
  gradientTo?: string
  gradientAngle?: number

  fontFamily?: string
  fontSize?: number
  fontWeight?: number
  lineHeight?: number
  letterSpacing?: number
  textAlign?: 'left' | 'center' | 'right' | 'justify'
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize'
  textDecoration?: 'none' | 'underline' | 'line-through'
  textStyleTokenId?: string

  radius?: number
  radiusTopLeft?: number
  radiusTopRight?: number
  radiusBottomRight?: number
  radiusBottomLeft?: number

  borderColor?: string
  borderWidth?: number
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'none'

  shadowX?: number
  shadowY?: number
  shadowBlur?: number
  shadowSpread?: number
  shadowColor?: string

  objectFit?: 'cover' | 'contain' | 'fill' | 'none'
  objectPosition?: string

  componentId?: string
  componentProps?: Record<string, ComponentPropValue>
}

export interface CanvasNode {
  id: string
  type: NodeType
  name?: string
  visible?: boolean
  locked?: boolean
  props: NodeProps
  responsive?: Partial<Record<ResponsiveViewport, Partial<NodeProps>>>
  children: string[]
}

export interface ColorToken {
  id: string
  name: string
  value: string
}

export interface TextStyleValue {
  fontFamily?: string
  fontSize?: number
  fontWeight?: number
  lineHeight?: number
  letterSpacing?: number
  textTransform?: NodeProps['textTransform']
}

export interface TextStyleToken {
  id: string
  name: string
  value: TextStyleValue
}

export interface DesignSystem {
  colors: ColorToken[]
  textStyles: TextStyleToken[]
}

export interface CanvasDocument {
  nodes: Record<string, CanvasNode>
  rootIds: string[]
}

export interface CodeCanvasProject {
  version: 3
  document: CanvasDocument
  projectComponents: ProjectComponentDefinition[]
  designSystem: DesignSystem
}
