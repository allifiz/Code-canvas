import type {
  CanvasNode,
  ComponentPropValue,
  NodeProps,
  ProjectComponentDefinition,
} from '../types'

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

function renderComponentProp(key: string, value: ComponentPropValue) {
  return `${key}={${JSON.stringify(value)}}`
}

function renderNode(
  node: CanvasNode,
  nodes: Record<string, CanvasNode>,
  projectComponents: ProjectComponentDefinition[],
  level: number,
): string {
  const pad = indent(level)
  const className = classes(node.props, node.type)
  const classAttr = className ? ` className="${className}"` : ''

  switch (node.type) {
    case 'container': {
      if (!node.children.length) return `${pad}<div${classAttr} />`
      const children = node.children
        .map((childId) => nodes[childId])
        .filter(Boolean)
        .map((child) => renderNode(child, nodes, projectComponents, level + 1))
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
    case 'component': {
      const component = projectComponents.find((item) => item.id === node.props.componentId)
      if (!component) return `${pad}{/* Missing project component: ${node.props.componentId ?? 'unknown'} */}`

      const props = Object.entries(node.props.componentProps ?? {})
        .map(([key, value]) => renderComponentProp(key, value))
        .join(' ')
      const propAttr = props ? ` ${props}` : ''

      if (!component.acceptsChildren || !node.children.length) {
        return `${pad}<${component.name}${propAttr} />`
      }

      const children = node.children
        .map((childId) => nodes[childId])
        .filter(Boolean)
        .map((child) => renderNode(child, nodes, projectComponents, level + 1))
        .join('\n')

      return `${pad}<${component.name}${propAttr}>\n${children}\n${pad}</${component.name}>`
    }
  }
}

function componentImport(component: ProjectComponentDefinition) {
  if (!component.exportName) {
    return `import ${component.name} from "${quote(component.importPath)}"`
  }

  const alias = component.exportName === component.name ? '' : ` as ${component.name}`
  return `import { ${component.exportName}${alias} } from "${quote(component.importPath)}"`
}

export function generateReactCode(
  nodes: Record<string, CanvasNode>,
  rootIds: string[],
  projectComponents: ProjectComponentDefinition[] = [],
) {
  const usedComponentIds = new Set(
    Object.values(nodes)
      .filter((node) => node.type === 'component' && node.props.componentId)
      .map((node) => node.props.componentId as string),
  )

  const imports = projectComponents
    .filter((component) => usedComponentIds.has(component.id))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(componentImport)
    .join('\n')

  const body = rootIds
    .map((id) => nodes[id])
    .filter(Boolean)
    .map((node) => renderNode(node, nodes, projectComponents, 3))
    .join('\n')

  const importBlock = imports ? `${imports}\n\n` : ''

  return `${importBlock}export default function GeneratedPage() {\n  return (\n    <>\n${body || '      {/* Drag something onto the canvas first. */}'}\n    </>\n  )\n}\n`
}

const escapeHtml = (value = '') =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

const cssValue = (value: number | string | undefined, unit = 'px') =>
  value === undefined ? null : typeof value === 'number' ? `${value}${unit}` : value

function htmlClass(node: CanvasNode) {
  return `cc-${node.type}-${node.id.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 8)}`
}

function cssRules(node: CanvasNode) {
  const p = node.props
  const declarations: string[] = ['box-sizing: border-box']

  const width = cssValue(p.width, '')
  const minHeight = cssValue(p.minHeight)
  const padding = cssValue(p.padding)
  const gap = cssValue(p.gap)
  const radius = cssValue(p.radius)
  const fontSize = cssValue(p.fontSize)

  if (width) declarations.push(`width: ${width}`)
  if (minHeight) declarations.push(`min-height: ${minHeight}`)
  if (padding) declarations.push(`padding: ${padding}`)
  if (gap) declarations.push(`gap: ${gap}`)
  if (radius) declarations.push(`border-radius: ${radius}`)
  if (fontSize) declarations.push(`font-size: ${fontSize}`)
  if (p.fontWeight !== undefined) declarations.push(`font-weight: ${p.fontWeight}`)
  if (p.background) declarations.push(`background: ${p.background}`)
  if (p.color) declarations.push(`color: ${p.color}`)
  if (p.borderColor) declarations.push(`border: 1px solid ${p.borderColor}`)

  if (node.type === 'container') {
    if (p.display) declarations.push(`display: ${p.display}`)
    if (p.display === 'flex') {
      if (p.direction) declarations.push(`flex-direction: ${p.direction}`)
      if (p.align) declarations.push(`align-items: ${p.align}`)
      if (p.justify) declarations.push(`justify-content: ${p.justify}`)
    }
  }

  if (node.type === 'text') declarations.push('margin: 0')
  if (node.type === 'button') declarations.push('border: 0', 'cursor: pointer')
  if (node.type === 'image') declarations.push('display: block', 'object-fit: cover')
  if (node.type === 'input') declarations.push('display: block')
  if (node.type === 'component') declarations.push('border: 1px dashed #94a3b8', 'padding: 12px')

  return `.${htmlClass(node)} {\n${declarations.map((item) => `  ${item};`).join('\n')}\n}`
}

function renderHtmlNode(
  node: CanvasNode,
  nodes: Record<string, CanvasNode>,
  projectComponents: ProjectComponentDefinition[],
  level: number,
): string {
  const pad = indent(level)
  const className = htmlClass(node)

  switch (node.type) {
    case 'container': {
      const children = node.children
        .map((childId) => nodes[childId])
        .filter(Boolean)
        .map((child) => renderHtmlNode(child, nodes, projectComponents, level + 1))
        .join('\n')

      if (!children) return `${pad}<div class="${className}"></div>`
      return `${pad}<div class="${className}">\n${children}\n${pad}</div>`
    }
    case 'text':
      return `${pad}<p class="${className}">${escapeHtml(node.props.text)}</p>`
    case 'button':
      return `${pad}<button class="${className}" type="button">${escapeHtml(node.props.text)}</button>`
    case 'input':
      return `${pad}<input class="${className}" placeholder="${escapeHtml(node.props.placeholder)}" />`
    case 'image':
      return `${pad}<img class="${className}" src="${escapeHtml(node.props.src)}" alt="${escapeHtml(node.props.alt)}" />`
    case 'component': {
      const component = projectComponents.find((item) => item.id === node.props.componentId)
      const name = component?.name ?? 'MissingComponent'
      const children = node.children
        .map((childId) => nodes[childId])
        .filter(Boolean)
        .map((child) => renderHtmlNode(child, nodes, projectComponents, level + 1))
        .join('\n')

      if (!children) {
        return `${pad}<div class="${className}" data-codecanvas-component="${escapeHtml(name)}">${escapeHtml(name)}</div>`
      }

      return `${pad}<div class="${className}" data-codecanvas-component="${escapeHtml(name)}">\n${indent(level + 1)}<!-- React component placeholder: ${escapeHtml(name)} -->\n${children}\n${pad}</div>`
    }
  }
}

export function generateHtmlCode(
  nodes: Record<string, CanvasNode>,
  rootIds: string[],
  projectComponents: ProjectComponentDefinition[] = [],
) {
  const orderedNodes = Object.values(nodes)
  const styles = orderedNodes.map(cssRules).join('\n\n')
  const body = rootIds
    .map((id) => nodes[id])
    .filter(Boolean)
    .map((node) => renderHtmlNode(node, nodes, projectComponents, 2))
    .join('\n')

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>CodeCanvas Export</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 24px;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #f8fafc;
      color: #111827;
    }

${styles.split('\n').map((line) => `    ${line}`).join('\n')}
  </style>
</head>
<body>
${body || '    <!-- Drag something onto the canvas first. -->'}
</body>
</html>
`
}
