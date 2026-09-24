import { createHash } from 'node:crypto'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

const cwd = process.cwd()
const args = process.argv.slice(2)

const readArg = (name, fallback) => {
  const index = args.indexOf(name)
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback
}

const scanDir = path.resolve(cwd, readArg('--dir', 'src/components'))
const outputFile = path.resolve(cwd, readArg('--out', 'codecanvas.components.json'))
const supportedExtensions = new Set(['.tsx', '.jsx'])
const ignoredPattern = /\.(test|spec|stories)\.[jt]sx$/i

const walk = async (directory) => {
  const entries = await fs.readdir(directory, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name)

    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue
      files.push(...await walk(fullPath))
      continue
    }

    const extension = path.extname(entry.name).toLowerCase()
    if (!supportedExtensions.has(extension) || ignoredPattern.test(entry.name)) continue
    files.push(fullPath)
  }

  return files
}

const hasModifier = (node, kind) =>
  !!node.modifiers?.some((modifier) => modifier.kind === kind)

const isPascalCase = (value) => /^[A-Z][A-Za-z0-9_$]*$/.test(value)

const fallbackName = (filePath) => {
  const base = path.basename(filePath, path.extname(filePath))
  if (base !== 'index') return base

  return path.basename(path.dirname(filePath))
}

const importPathFor = (filePath) => {
  const srcDir = path.join(cwd, 'src')
  const relativeToSrc = path.relative(srcDir, filePath)
  const withoutExtension = (value) => value.replace(/\.[^.]+$/, '').replace(/\/index$/, '')

  if (!relativeToSrc.startsWith('..') && !path.isAbsolute(relativeToSrc)) {
    return '@/' + withoutExtension(relativeToSrc).split(path.sep).join('/')
  }

  const relative = withoutExtension(path.relative(cwd, filePath)).split(path.sep).join('/')
  return relative.startsWith('.') ? relative : './' + relative
}

const exportedComponents = (filePath, sourceText) => {
  const source = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.JSX,
  )

  const components = []
  const seen = new Set()
  const acceptsChildren = /\bchildren\b/.test(sourceText)

  const add = (name, exportName) => {
    if (!isPascalCase(name)) return

    const key = exportName ? 'named:' + exportName : 'default:' + name
    if (seen.has(key)) return
    seen.add(key)

    components.push({
      name,
      exportName,
      acceptsChildren,
    })
  }

  for (const statement of source.statements) {
    const isExported = hasModifier(statement, ts.SyntaxKind.ExportKeyword)
    const isDefault = hasModifier(statement, ts.SyntaxKind.DefaultKeyword)

    if (
      (ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement)) &&
      isExported
    ) {
      const name = statement.name?.text ?? fallbackName(filePath)
      add(name, isDefault ? undefined : name)
      continue
    }

    if (ts.isVariableStatement(statement) && isExported) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) {
          add(declaration.name.text, declaration.name.text)
        }
      }
      continue
    }

    if (ts.isExportAssignment(statement) && !statement.isExportEquals) {
      const name = ts.isIdentifier(statement.expression)
        ? statement.expression.text
        : fallbackName(filePath)
      add(name, undefined)
      continue
    }

    if (ts.isExportDeclaration(statement) && statement.exportClause && ts.isNamedExports(statement.exportClause)) {
      for (const element of statement.exportClause.elements) {
        if (statement.moduleSpecifier) continue
        const exportedName = element.name.text
        add(exportedName, exportedName)
      }
    }
  }

  return components
}

const makeId = (importPath, exportName, localName) =>
  'component-' +
  createHash('sha1')
    .update(importPath + ':' + (exportName ?? 'default') + ':' + localName)
    .digest('hex')
    .slice(0, 12)

const ensureUniqueNames = (components) => {
  const counts = new Map()

  return components.map((component) => {
    const count = (counts.get(component.name) ?? 0) + 1
    counts.set(component.name, count)

    if (count === 1) return component

    return {
      ...component,
      name: component.name + count,
    }
  })
}

const main = async () => {
  try {
    const stat = await fs.stat(scanDir)
    if (!stat.isDirectory()) throw new Error('Scan target is not a directory')
  } catch {
    console.error('CodeCanvas: component directory not found: ' + scanDir)
    process.exitCode = 1
    return
  }

  const files = await walk(scanDir)
  const discovered = []

  for (const filePath of files) {
    const sourceText = await fs.readFile(filePath, 'utf8')
    const importPath = importPathFor(filePath)

    for (const component of exportedComponents(filePath, sourceText)) {
      discovered.push({
        ...component,
        importPath,
        defaultProps: {},
      })
    }
  }

  const components = ensureUniqueNames(discovered).map((component) => ({
    id: makeId(component.importPath, component.exportName, component.name),
    name: component.name,
    importPath: component.importPath,
    ...(component.exportName ? { exportName: component.exportName } : {}),
    defaultProps: component.defaultProps,
    acceptsChildren: component.acceptsChildren,
  }))

  const manifest = {
    version: 1,
    generatedAt: new Date().toISOString(),
    sourceDirectory: path.relative(cwd, scanDir) || '.',
    components,
  }

  await fs.writeFile(outputFile, JSON.stringify(manifest, null, 2) + '\n', 'utf8')

  console.log('CodeCanvas component scan complete.')
  console.log('  Source: ' + path.relative(cwd, scanDir))
  console.log('  Components: ' + components.length)
  console.log('  Manifest: ' + path.relative(cwd, outputFile))

  if (components.length === 0) {
    console.log('  No exported PascalCase React components were found.')
  }
}

await main()
