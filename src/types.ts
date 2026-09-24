export type NodeType = 'container' | 'text' | 'button' | 'input' | 'image' | 'component'
export type Viewport = 'desktop' | 'tablet' | 'mobile'

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
  placeholder?: string
  src?: string
  alt?: string
  display?: 'block' | 'flex' | 'grid'
  direction?: 'row' | 'column'
  align?: 'stretch' | 'flex-start' | 'center' | 'flex-end'
  justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between'
  gap?: number
  padding?: number
  width?: string
  minHeight?: number
  background?: string
  color?: string
  fontSize?: number
  fontWeight?: number
  radius?: number
  borderColor?: string
  componentId?: string
  componentProps?: Record<string, ComponentPropValue>
}

export interface CanvasNode {
  id: string
  type: NodeType
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
