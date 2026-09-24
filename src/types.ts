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

  display?: 'block' | 'flex' | 'grid'
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
  color?: string
  opacity?: number

  fontFamily?: string
  fontSize?: number
  fontWeight?: number
  lineHeight?: number
  letterSpacing?: number
  textAlign?: 'left' | 'center' | 'right' | 'justify'
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize'
  textDecoration?: 'none' | 'underline' | 'line-through'

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
  children: string[]
}

export interface CanvasDocument {
  nodes: Record<string, CanvasNode>
  rootIds: string[]
}

export interface CodeCanvasProject {
  version: 2
  document: CanvasDocument
  projectComponents: ProjectComponentDefinition[]
}
