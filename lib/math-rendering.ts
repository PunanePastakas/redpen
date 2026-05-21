import katex from "katex"

export type MathTextSegment =
  | { type: "text"; value: string }
  | { type: "math"; value: string; display: boolean; html: string | null }

const mathSpanPattern = /\\\(([\s\S]*?)\\\)|\\\[([\s\S]*?)\\\]/g

export function isValidKatex(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return false

  try {
    katex.renderToString(trimmed, {
      displayMode: false,
      throwOnError: true,
      strict: "ignore"
    })
    return true
  } catch {
    return false
  }
}

export function normalizeMathLatex(value: string | null) {
  if (value === null) return null
  const trimmed = value.trim()
  return isValidKatex(trimmed) ? trimmed : null
}

export function parseMathText(value: string): MathTextSegment[] {
  const segments: MathTextSegment[] = []
  let cursor = 0

  for (const match of value.matchAll(mathSpanPattern)) {
    const index = match.index ?? 0
    if (index > cursor) {
      segments.push({ type: "text", value: value.slice(cursor, index) })
    }

    const inlineMath = match[1]
    const blockMath = match[2]
    const display = blockMath !== undefined
    const source = (display ? blockMath : inlineMath ?? "").trim()
    const html = renderKatexToHtml(source, display)

    if (html) {
      segments.push({ type: "math", value: source, display, html })
    } else {
      segments.push({ type: "text", value: match[0] })
    }

    cursor = index + match[0].length
  }

  if (cursor < value.length) {
    segments.push({ type: "text", value: value.slice(cursor) })
  }

  return segments
}

export function hasInvalidMathSpans(value: string) {
  for (const match of value.matchAll(mathSpanPattern)) {
    const inlineMath = match[1]
    const blockMath = match[2]
    const source = (blockMath !== undefined ? blockMath : inlineMath ?? "").trim()
    if (!isValidKatex(source)) return true
  }

  return false
}

function renderKatexToHtml(value: string, displayMode: boolean) {
  if (!isValidKatex(value)) return null

  return katex.renderToString(value, {
    displayMode,
    throwOnError: false,
    strict: "ignore"
  })
}
