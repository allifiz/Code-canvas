import type { CanvasNode, NodeProps } from '../types'

const indent = (level: number) => '  '.repeat(level)
const quote = (value = '') => value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')

function widthClass(width?: string) {
  if (!width || width === 'auto') return ''
  if (width === '100%') return 'w-full'
  if (width === 'fit-content') return 'w-fit'
  return `w-[${width}]`
}

function classes(props: NodeProps, type: CanvasNode['type']) {
  const result: string[] = []

  if (type === 'container') {
    if (props.display === 'flex') {
      result.push('flex', props.direction === 'row' ? 'flex-row' : 'flex-col')
      const alignMap = {
        stretch: 'items-stretch',
        'flex-start': 'items-start',
        center: 'items-center',
        'flex-end': 'items-end',
      }
      const justifyMap = {
        'flex-start': 'justify-start',
        center: 'justify-center',
        'flex-end': 'justify-end',
        'space-between': 'justify-between',
      }
      if (props.align) result.push(alignMap[props.align])
      if (props.justify) result.push(justifyMap[props.justify])
    }
    if (props.display === 'grid') result.push('grid')
  }

  const width = widthClass(props.width)
  if (width) result.push(width)
  if (props.gap !== undefined) result.push(`gap-[${props.gap}px]`)
  if (props.padding !== undefined) result.push(`p-[${props.padding}px]`)
  if (props.minHeight !== undefined) result.push(`min-h-[${props.minHeight}px]`)
  if (props.radius !== undefined) result.push(`rounded-[${props.radius}px]`)
  if (props.background && props.background !== 'transparent') result.push(`bg-[${props.background}]`)
  if (props.color) result.push(`text-[${props.color}]`)
  if (props.fontSize !== undefined) result.push(`text-[${props.fontSize}px]`)
  if (props.fontWeight !== undefined) result.push(`font-[${props.fontWeight}]`)
  if (props.borderColor) result.push('border', `border-[${props.borderColor}]`)

  return result.join(' ')
}

function renderNode(node: CanvasNode, nodes: Record<string, CanvasNode>, level: number): string {
  const pad = indent(level)
  const className = classes(node.props, node.type)
  const classAttr = className ? ` className="${className}"` : ''

  switch (node.type) {
    case 'container': {
      if (!node.children.length) return `${pad}<div${classAttr} />`
      const children = node.children
        .map((childId) => nodes[childId])
        .filter(Boolean)
        .map((child) => renderNode(child, nodes, level + 1))
        .join('\n')
      return `${pad}<div${classAttr}>\n${children}\n${pad}</div>`
    }
    case 'text':
      return `${pad}<p${classAttr}>{${JSON.stringify(node.props.text ?? '')}}</p>`
    case 'button':
      return `${pad}<button type="button"${classAttr}>{${JSON.stringify(node.props.text ?? '')}}</button>`
    case 'input':
      return `${pad}<input placeholder="${quote(node.props.placeholder)}"${classAttr} />`
    case 'image':
      return `${pad}<img src="${quote(node.props.src)}" alt="${quote(node.props.alt)}"${classAttr} />`
  }
}

export function generateReactCode(nodes: Record<string, CanvasNode>, rootIds: string[]) {
  const body = rootIds
    .map((id) => nodes[id])
    .filter(Boolean)
    .map((node) => renderNode(node, nodes, 3))
    .join('\n')

  return `export default function GeneratedPage() {\n  return (\n    <>\n${body || '      {/* Drag something onto the canvas first. */}'}\n    </>\n  )\n}\n`
}
