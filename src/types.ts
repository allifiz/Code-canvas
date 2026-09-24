export type NodeType = 'container' | 'text' | 'button' | 'input' | 'image'
export type Viewport = 'desktop' | 'tablet' | 'mobile'

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
