import type {
  CanvasNode,
  ComponentPropValue,
  NodeProps,
  ProjectComponentDefinition,
} from '../types'

const indent = (level: number) => '  '.repeat(level)
const quote = (value = '') => value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')

function arbitrary(prefix: string, value?: string | number, unit = '') {
  if (value === undefined || value === '') return ''
  return `${prefix}-[${value}${unit}]`
}

function widthClass(width?: string) {
  if (!width || width === 'auto') return ''
  if (width === '100%') return 'w-full'
  if (width === 'fit-content') return 'w-fit'
  return `w-[${width}]`
}

function heightClass(height?: string) {
  if (!height || height === 'auto') return ''
  if (height === '100%') return 'h-full'
  if (height === 'fit-content') return 'h-fit'
  return `h-[${height}]`
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
        'space-around': 'justify-around',
        'space-evenly': 'justify-evenly',
      }
      if (props.align) result.push(alignMap[props.align])
      if (props.justify) result.push(justifyMap[props.justify])
    }

    if (props.display === 'grid') {
      result.push('grid')
      if (props.gridColumns) result.push(`grid-cols-${Math.max(1, Math.min(12, props.gridColumns))}`)
    }

    if (props.display === 'block') result.push('block')
  }

  const width = widthClass(props.width)
  const height = heightClass(props.height)
  if (width) result.push(width)
  if (height) result.push(height)

  const dimensionalClasses = [
    arbitrary('min-w', props.minWidth),
    props.minHeight !== undefined ? arbitrary('min-h', props.minHeight, 'px') : '',
    arbitrary('max-w', props.maxWidth),
    arbitrary('max-h', props.maxHeight),
  ].filter(Boolean)
  result.push(...dimensionalClasses)

  if (props.gap !== undefined) result.push(arbitrary('gap', props.gap, 'px'))

  const pt = props.paddingTop ?? props.padding
  const pr = props.paddingRight ?? props.padding
  const pb = props.paddingBottom ?? props.padding
  const pl = props.paddingLeft ?? props.padding
  if (pt !== undefined) result.push(arbitrary('pt', pt, 'px'))
  if (pr !== undefined) result.push(arbitrary('pr', pr, 'px'))
  if (pb !== undefined) result.push(arbitrary('pb', pb, 'px'))
  if (pl !== undefined) result.push(arbitrary('pl', pl, 'px'))

  if (props.marginTop !== undefined) result.push(arbitrary('mt', props.marginTop, 'px'))
  if (props.marginRight !== undefined) result.push(arbitrary('mr', props.marginRight, 'px'))
  if (props.marginBottom !== undefined) result.push(arbitrary('mb', props.marginBottom, 'px'))
  if (props.marginLeft !== undefined) result.push(arbitrary('ml', props.marginLeft, 'px'))

  const rtl = props.radiusTopLeft ?? props.radius
  const rtr = props.radiusTopRight ?? props.radius
  const rbr = props.radiusBottomRight ?? props.radius
  const rbl = props.radiusBottomLeft ?? props.radius
  if (rtl !== undefined) result.push(arbitrary('rounded-tl', rtl, 'px'))
  if (rtr !== undefined) result.push(arbitrary('rounded-tr', rtr, 'px'))
  if (rbr !== undefined) result.push(arbitrary('rounded-br', rbr, 'px'))
  if (rbl !== undefined) result.push(arbitrary('rounded-bl', rbl, 'px'))

  if (props.background && props.background !== 'transparent') result.push(`bg-[${props.background}]`)
  if (props.color) result.push(`text-[${props.color}]`)
  if (props.opacity !== undefined) result.push(`opacity-[${props.opacity}]`)

  if (props.fontSize !== undefined) result.push(arbitrary('text', props.fontSize, 'px'))
  if (props.fontWeight !== undefined) result.push(`font-[${props.fontWeight}]`)
  if (props.lineHeight !== undefined) result.push(`leading-[${props.lineHeight}]`)
  if (props.letterSpacing !== undefined) result.push(arbitrary('tracking', props.letterSpacing, 'px'))

  if (props.textAlign) {
    const map = { left: 'text-left', center: 'text-center', right: 'text-right', justify: 'text-justify' }
    result.push(map[props.textAlign])
  }

  if (props.textTransform && props.textTransform !== 'none') {
    const map = { uppercase: 'uppercase', lowercase: 'lowercase', capitalize: 'capitalize' }
    result.push(map[props.textTransform])
  }

  if (props.textDecoration && props.textDecoration !== 'none') {
    result.push(props.textDecoration === 'underline' ? 'underline' : 'line-through')
  }

  if ((props.borderWidth ?? 0) > 0 && props.borderStyle !== 'none') {
    result.push(arbitrary('border', props.borderWidth ?? 1, 'px'))
    if (props.borderColor) result.push(`border-[${props.borderColor}]`)
    if (props.borderStyle === 'dashed') result.push('border-dashed')
    if (props.borderStyle === 'dotted') result.push('border-dotted')
  }

  if (props.overflow && props.overflow !== 'visible') {
    result.push(
      props.overflow === 'hidden' ? 'overflow-hidden' :
      props.overflow === 'auto' ? 'overflow-auto' : 'overflow-scroll',
    )
  }

  if (type === 'image' && props.objectFit) {
    const map = { cover: 'object-cover', contain: 'object-contain', fill: 'object-fill', none: 'object-none' }
    result.push(map[props.objectFit])
  }

  return result.filter(Boolean).join(' ')
}

function inlineStyle(props: NodeProps) {
  const pairs: string[] = []

  if (props.fontFamily) pairs.push(`fontFamily: ${JSON.stringify(props.fontFamily)}`)

  const hasShadow = !!(
    props.shadowX ||
    props.shadowY ||
    props.shadowBlur ||
    props.shadowSpread
  )

  if (hasShadow) {
    const value = `${props.shadowX ?? 0}px ${props.shadowY ?? 0}px ${props.shadowBlur ?? 0}px ${props.shadowSpread ?? 0}px ${props.shadowColor ?? '#000000'}`
    pairs.push(`boxShadow: ${JSON.stringify(value)}`)
  }

  if (props.objectPosition) pairs.push(`objectPosition: ${JSON.stringify(props.objectPosition)}`)

  if (props.translateX || props.translateY) {
    pairs.push(`transform: ${JSON.stringify(`translate(${props.translateX ?? 0}px, ${props.translateY ?? 0}px)`)}`)
  }

  return pairs.length ? ` style={{ ${pairs.join(', ')} }}` : ''
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
  const styleAttr = inlineStyle(node.props)

  switch (node.type) {
    case 'container': {
      if (!node.children.length) return `${pad}<div${classAttr}${styleAttr} />`
      const children = node.children
        .map((childId) => nodes[childId])
        .filter((child): child is CanvasNode => !!child && child.visible !== false)
        .map((child) => renderNode(child, nodes, projectComponents, level + 1))
        .join('\n')
      return `${pad}<div${classAttr}${styleAttr}>\n${children}\n${pad}</div>`
    }

    case 'text':
      return `${pad}<p${classAttr}${styleAttr}>{${JSON.stringify(node.props.text ?? '')}}</p>`

    case 'button':
      return `${pad}<button type="button"${classAttr}${styleAttr}>{${JSON.stringify(node.props.text ?? '')}}</button>`

    case 'input':
      return `${pad}<input placeholder="${quote(node.props.placeholder)}"${classAttr}${styleAttr} />`

    case 'textarea':
      return `${pad}<textarea placeholder="${quote(node.props.placeholder)}"${classAttr}${styleAttr} />`

    case 'link':
      return `${pad}<a href="${quote(node.props.href ?? '#')}"${classAttr}${styleAttr}>{${JSON.stringify(node.props.text ?? '')}}</a>`

    case 'divider':
      return `${pad}<div aria-hidden="true"${classAttr}${styleAttr} />`

    case 'image':
      return `${pad}<img src="${quote(node.props.src)}" alt="${quote(node.props.alt)}"${classAttr}${styleAttr} />`

    case 'component': {
      const component = projectComponents.find((item) => item.id === node.props.componentId)
      if (!component) return `${pad}{/* Missing project component: ${node.props.componentId ?? 'unknown'} */}`

      const componentProps = Object.entries(node.props.componentProps ?? {})
        .map(([key, value]) => renderComponentProp(key, value))
        .join(' ')

      const extraAttrs = [componentProps, classAttr.trim(), styleAttr.trim()].filter(Boolean).join(' ')
      const attrs = extraAttrs ? ` ${extraAttrs}` : ''

      if (!component.acceptsChildren || !node.children.length) {
        return `${pad}<${component.name}${attrs} />`
      }

      const children = node.children
        .map((childId) => nodes[childId])
        .filter((child): child is CanvasNode => !!child && child.visible !== false)
        .map((child) => renderNode(child, nodes, projectComponents, level + 1))
        .join('\n')

      return `${pad}<${component.name}${attrs}>\n${children}\n${pad}</${component.name}>`
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
    .filter((node): node is CanvasNode => !!node && node.visible !== false)
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

  const assign = (property: string, value: string | number | null | undefined) => {
    if (value !== undefined && value !== null && value !== '') declarations.push(`${property}: ${value}`)
  }

  assign('width', cssValue(p.width, ''))
  assign('height', cssValue(p.height, ''))
  assign('min-width', cssValue(p.minWidth, ''))
  assign('min-height', cssValue(p.minHeight))
  assign('max-width', cssValue(p.maxWidth, ''))
  assign('max-height', cssValue(p.maxHeight, ''))

  assign('padding-top', cssValue(p.paddingTop ?? p.padding))
  assign('padding-right', cssValue(p.paddingRight ?? p.padding))
  assign('padding-bottom', cssValue(p.paddingBottom ?? p.padding))
  assign('padding-left', cssValue(p.paddingLeft ?? p.padding))

  assign('margin-top', cssValue(p.marginTop))
  assign('margin-right', cssValue(p.marginRight))
  assign('margin-bottom', cssValue(p.marginBottom))
  assign('margin-left', cssValue(p.marginLeft))

  if (p.translateX || p.translateY) {
    assign('transform', `translate(${p.translateX ?? 0}px, ${p.translateY ?? 0}px)`)
  }

  assign('background', p.background)
  assign('color', p.color)
  assign('opacity', p.opacity)

  assign('font-family', p.fontFamily)
  assign('font-size', cssValue(p.fontSize))
  assign('font-weight', p.fontWeight)
  assign('line-height', p.lineHeight)
  assign('letter-spacing', cssValue(p.letterSpacing))
  assign('text-align', p.textAlign)
  assign('text-transform', p.textTransform && p.textTransform !== 'none' ? p.textTransform : undefined)
  assign('text-decoration', p.textDecoration && p.textDecoration !== 'none' ? p.textDecoration : undefined)

  assign('border-top-left-radius', cssValue(p.radiusTopLeft ?? p.radius))
  assign('border-top-right-radius', cssValue(p.radiusTopRight ?? p.radius))
  assign('border-bottom-right-radius', cssValue(p.radiusBottomRight ?? p.radius))
  assign('border-bottom-left-radius', cssValue(p.radiusBottomLeft ?? p.radius))

  if ((p.borderWidth ?? 0) > 0 && p.borderStyle !== 'none') {
    assign('border-width', cssValue(p.borderWidth ?? 1))
    assign('border-style', p.borderStyle ?? 'solid')
    assign('border-color', p.borderColor ?? '#d1d5db')
  }

  if (p.shadowX || p.shadowY || p.shadowBlur || p.shadowSpread) {
    assign(
      'box-shadow',
      `${p.shadowX ?? 0}px ${p.shadowY ?? 0}px ${p.shadowBlur ?? 0}px ${p.shadowSpread ?? 0}px ${p.shadowColor ?? '#000000'}`,
    )
  }

  assign('overflow', p.overflow)

  if (node.type === 'container') {
    assign('display', p.display)

    if (p.display === 'flex') {
      assign('flex-direction', p.direction)
      assign('align-items', p.align)
      assign('justify-content', p.justify)
      assign('gap', cssValue(p.gap))
    }

    if (p.display === 'grid') {
      assign('grid-template-columns', `repeat(${Math.max(1, p.gridColumns ?? 2)}, minmax(0, 1fr))`)
      assign('gap', cssValue(p.gap))
    }
  }

  if (node.type === 'text') declarations.push('margin: 0')
  if (node.type === 'button') declarations.push('cursor: pointer')
  if (node.type === 'image') {
    declarations.push('display: block')
    assign('object-fit', p.objectFit)
    assign('object-position', p.objectPosition)
  }
  if (node.type === 'input' || node.type === 'textarea') declarations.push('display: block')
  if (node.type === 'link') declarations.push('display: inline-block')

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
        .filter((child): child is CanvasNode => !!child && child.visible !== false)
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

    case 'textarea':
      return `${pad}<textarea class="${className}" placeholder="${escapeHtml(node.props.placeholder)}"></textarea>`

    case 'link':
      return `${pad}<a class="${className}" href="${escapeHtml(node.props.href ?? '#')}">${escapeHtml(node.props.text)}</a>`

    case 'divider':
      return `${pad}<div class="${className}" aria-hidden="true"></div>`

    case 'image':
      return `${pad}<img class="${className}" src="${escapeHtml(node.props.src)}" alt="${escapeHtml(node.props.alt)}" />`

    case 'component': {
      const component = projectComponents.find((item) => item.id === node.props.componentId)
      const name = component?.name ?? 'MissingComponent'
      const children = node.children
        .map((childId) => nodes[childId])
        .filter((child): child is CanvasNode => !!child && child.visible !== false)
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
    .filter((node): node is CanvasNode => !!node && node.visible !== false)
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
