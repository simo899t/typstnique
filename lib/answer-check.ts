// Answer checking for the typing game.
//
// An answer is accepted when Typst draws the same glyphs as the target, in the
// same order, at the same sizes and heights. Horizontal spacing may differ a
// little, and explicit spacing commands are normalised first, so `quad`,
// `space space` and `wide` all count as "a visible gap", while `thin`, `space`
// or nothing at all count as "no real gap".

export const FONT_SIZE_PT = 22

export function makeTypstDoc(math: string) {
  return [
    "#set page(width: auto, height: auto, margin: (x: 10pt, y: 6pt), fill: none)",
    `#set text(size: ${FONT_SIZE_PT}pt)`,
    `$ ${math} $`,
  ].join("\n")
}

// People sometimes type the surrounding dollar signs themselves.
export function stripMathDelimiters(src: string): string {
  const s = src.trim()
  if (s.length >= 2 && s.startsWith("$") && s.endsWith("$")) return s.slice(1, -1).trim()
  return s
}

export type Verdict = "exact" | "equivalent" | "wrong"

// "exact": Typst draws the answer exactly like the target (this includes
// synonyms such as `<=` and `≤`). "equivalent": accepted, but only after
// normalising spacing / look-alike symbols, so the reference is worth showing.
export async function checkAnswer(
  target: string,
  answer: string,
  layoutOf: (src: string) => Promise<Layout | null>,
): Promise<Verdict> {
  const t = target.trim()
  const a = stripMathDelimiters(answer)
  if (!a) return "wrong"
  if (squash(a) === squash(t)) return "exact"

  const [targetLayout, answerLayout] = await Promise.all([layoutOf(t), layoutOf(a)])
  if (!targetLayout || !answerLayout) return "wrong"
  if (layoutsMatch(targetLayout, answerLayout, TIGHT)) return "exact"

  const ct = canonicalizeMath(t)
  const ca = canonicalizeMath(a)
  if (ct === ca) return "equivalent"
  const [ctLayout, caLayout] = await Promise.all([
    ct === t ? targetLayout : layoutOf(ct),
    ca === a ? answerLayout : layoutOf(ca),
  ])
  if (ctLayout && caLayout && layoutsMatch(ctLayout, caLayout, LOOSE)) return "equivalent"
  return "wrong"
}

function squash(s: string) {
  return s.trim().replace(/\s+/g, " ")
}

// ---------------------------------------------------------------------------
// Source canonicalisation
// ---------------------------------------------------------------------------

// Width in em of each spacing command available in math mode, as measured
// with typst.ts 0.6 (New Computer Modern Math).
const SPACING_EM: Record<string, number> = {
  thin: 1 / 6,
  med: 2 / 9,
  thick: 5 / 18,
  quad: 1,
  wide: 2,
  space: 0.332,
  "space.nobreak": 0.332,
  "space.nobreak.narrow": 0.2,
  "space.en": 0.5,
  "space.quad": 1,
  "space.third": 1 / 3,
  "space.quarter": 0.25,
  "space.sixth": 1 / 6,
  "space.med": 2 / 9,
  "space.fig": 0.5,
  "space.punct": 0.25,
  "space.thin": 0.2,
  "space.hair": 0.1,
}

// A run of explicit spacing at least this wide is a deliberate gap and becomes
// `quad`; anything narrower is dropped.
const GAP_EM = 0.6

// Symbols that are easy to mix up and look (nearly) identical. Each one is
// rewritten to its value before comparing.
const SYMBOL_ALIASES: Record<string, string> = {
  "dot.c": "dot", // · vs ⋅ — `dot.c` is what LaTeX \cdot users reach for
  "dot.op": "dot",
  "·": "dot",
  "⋅": "dot",
  "lt.eq.slant": "lt.eq",
  "gt.eq.slant": "gt.eq",
  "⩽": "lt.eq",
  "⩾": "gt.eq",
}

export function canonicalizeMath(src: string): string {
  const tokens = tokenize(stripMathDelimiters(src))
  let out = ""
  let gap: number | null = null // explicit spacing (em) since the last visible token
  let space = false // plain whitespace since the last visible token
  const sep = () => {
    if (out && !out.endsWith(" ")) out += " "
  }

  tokens.forEach((t, i) => {
    const prev = tokens[i - 1]
    const next = tokens[i + 1]
    if (t.kind === "ws") {
      space = true
      return
    }
    const width = spacingWidth(t, prev, next)
    if (width !== null) {
      gap = (gap ?? 0) + width
      return
    }

    // Spacing before the first or after the last visible token is dropped.
    if (out) {
      if (gap !== null && gap >= GAP_EM) {
        sep()
        out += "quad"
        sep()
      } else if (gap !== null || space) {
        sep()
      }
    }
    gap = null
    space = false

    const alias = SYMBOL_ALIASES[t.text]
    if (alias && t.kind === "ident" && next?.text !== "(") {
      out += alias
    } else if (alias && t.kind === "other") {
      // Keep the replacement from gluing onto its neighbours (`a·b` → `a dot b`).
      sep()
      out += alias
      space = true
    } else {
      out += t.text
    }
  })
  return out.trim()
}

function spacingWidth(t: Token, prev?: Token, next?: Token): number | null {
  // `quad(…)`, `quad^2` and `x_quad` aren't used as spacing; leave them alone.
  if (next && /^[(_^']/.test(next.text)) return null
  if (prev && /^[_^]$/.test(prev.text)) return null

  if (t.kind === "ident") return SPACING_EM[t.text.replace(/^(?:sym|math)\./, "")] ?? null
  if (t.kind === "str" && /^" +"$/.test(t.text)) return (t.text.length - 2) * SPACING_EM.space
  if (t.kind === "code") {
    const m = t.text.match(
      /^#h\(\s*(?:weak\s*:\s*(?:true|false)\s*,\s*)?(\d*\.?\d+)(em|pt)\s*(?:,\s*weak\s*:\s*(?:true|false)\s*)?\)$/,
    )
    if (m) return m[2] === "em" ? Number(m[1]) : Number(m[1]) / FONT_SIZE_PT
  }
  return null
}

type Token = { kind: "ws" | "ident" | "code" | "str" | "other"; text: string }

// Math identifiers are two or more identifier characters (single letters are
// plain text), optionally followed by fields: `pi`, `plus.minus`, `dot.c`.
const WS_RE = /\s+/y
const IDENT_RE = new RegExp(
  "\\p{XID_Start}(?:(?!_)\\p{XID_Continue})+(?:\\.\\p{XID_Start}(?:(?!_)\\p{XID_Continue})*)*",
  "uy",
)
const CODE_RE = new RegExp("#[\\p{XID_Start}_][\\p{XID_Continue}-]*(?:\\.[\\p{XID_Start}_][\\p{XID_Continue}-]*)*", "uy")

// Just enough of Typst's math lexer to find spacing commands and symbols
// safely: strings, escapes and `#code(…)` expressions are kept intact.
function tokenize(src: string): Token[] {
  const tokens: Token[] = []
  const at = (re: RegExp, i: number) => {
    re.lastIndex = i
    return re.exec(src)?.[0]
  }
  let i = 0
  while (i < src.length) {
    let kind: Token["kind"] = "other"
    let end: number
    let m: string | undefined
    if ((m = at(WS_RE, i))) {
      kind = "ws"
      end = i + m.length
    } else if (src[i] === "\\") {
      end = Math.min(i + 2, src.length)
    } else if (src[i] === '"') {
      kind = "str"
      end = readString(src, i)
    } else if (src[i] === "#" && (m = at(CODE_RE, i))) {
      kind = "code"
      end = readGroups(src, i + m.length)
    } else if ((m = at(IDENT_RE, i))) {
      kind = "ident"
      end = i + m.length
    } else {
      end = i + (src.codePointAt(i)! > 0xffff ? 2 : 1)
    }
    tokens.push({ kind, text: src.slice(i, end) })
    i = end
  }
  return tokens
}

function readString(src: string, start: number): number {
  let i = start + 1
  while (i < src.length && src[i] !== '"') i += src[i] === "\\" ? 2 : 1
  return Math.min(i + 1, src.length)
}

// Skips balanced (…) and […] groups, e.g. the arguments and trailing content
// block of `#text(red)[x]`.
function readGroups(src: string, start: number): number {
  let i = start
  while (src[i] === "(" || src[i] === "[") {
    const open = src[i]
    const close = open === "(" ? ")" : "]"
    let depth = 0
    for (; i < src.length; i++) {
      if (src[i] === '"') {
        i = readString(src, i) - 1
      } else if (src[i] === open) {
        depth++
      } else if (src[i] === close && --depth === 0) {
        i++
        break
      }
    }
  }
  return i
}

// ---------------------------------------------------------------------------
// Rendered layout comparison
// ---------------------------------------------------------------------------

type Box = { x0: number; y0: number; x1: number; y1: number }
type Glyph = { key: string; x: number; y: number; size: number; box: Box }

// Everything visible in a rendered formula, in drawing order. Positions are in
// SVG units (pt).
export type Layout = { glyphs: Glyph[]; shapes: Box[] }

type Tolerance = { x: number; y: number } // em

// Rounding noise only.
const TIGHT: Tolerance = { x: 0.02, y: 0.02 }
// Each gap between neighbouring glyphs may differ by about one `space`.
const LOOSE: Tolerance = { x: 0.35, y: 0.08 }

type Matrix = [number, number, number, number, number, number]

const IDENTITY: Matrix = [1, 0, 0, 1, 0, 0]

function multiply(m: Matrix, n: Matrix): Matrix {
  return [
    m[0] * n[0] + m[2] * n[1],
    m[1] * n[0] + m[3] * n[1],
    m[0] * n[2] + m[2] * n[3],
    m[1] * n[2] + m[3] * n[3],
    m[0] * n[4] + m[2] * n[5] + m[4],
    m[1] * n[4] + m[3] * n[5] + m[5],
  ]
}

function parseTransform(attr: string | null): Matrix {
  let m = IDENTITY
  if (!attr) return m
  for (const [, fn, args] of attr.matchAll(/(matrix|translate|scale|rotate)\s*\(([^)]*)\)/g)) {
    const v = args.split(/[\s,]+/).filter(Boolean).map(Number)
    let t: Matrix
    if (fn === "matrix") t = [v[0], v[1], v[2], v[3], v[4], v[5]]
    else if (fn === "translate") t = [1, 0, 0, 1, v[0] ?? 0, v[1] ?? 0]
    else if (fn === "scale") t = [v[0], 0, 0, v[1] ?? v[0], 0, 0]
    else {
      const r = (v[0] * Math.PI) / 180
      t = [Math.cos(r), Math.sin(r), -Math.sin(r), Math.cos(r), 0, 0]
    }
    m = multiply(m, t)
  }
  return m
}

const PATH_ARITY: Record<string, number> = { m: 2, l: 2, h: 1, v: 1, c: 6, s: 4, q: 4, t: 2, a: 7 }

// All end and control points of an SVG path. Good enough for bounding boxes.
function pathPoints(d: string): Array<[number, number]> {
  const points: Array<[number, number]> = []
  let x = 0
  let y = 0
  let startX = 0
  let startY = 0
  for (const [, cmd, body] of d.matchAll(/([a-zA-Z])([^a-zA-Z]*)/g)) {
    const lower = cmd.toLowerCase()
    if (lower === "z") {
      x = startX
      y = startY
      continue
    }
    const arity = PATH_ARITY[lower]
    if (!arity) continue
    const rel = cmd === lower
    const nums = (body.match(/-?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g) ?? []).map(Number)
    for (let i = 0; i + arity <= nums.length; i += arity) {
      const a = nums.slice(i, i + arity)
      const ox = rel ? x : 0
      const oy = rel ? y : 0
      if (lower === "h") {
        x = a[0] + ox
      } else if (lower === "v") {
        y = a[0] + oy
      } else {
        // Arcs only contribute their end point; curves also their control points.
        const end = lower === "a" ? 5 : arity - 2
        for (let j = 0; j < end && lower !== "a"; j += 2) points.push([a[j] + ox, a[j + 1] + oy])
        x = a[end] + ox
        y = a[end + 1] + oy
      }
      points.push([x, y])
      if (lower === "m" && i === 0) {
        startX = x
        startY = y
      }
    }
  }
  return points
}

function boxOf(points: Array<[number, number]>, m: Matrix): Box | null {
  if (points.length === 0) return null
  const box = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity }
  for (const [px, py] of points) {
    const x = m[0] * px + m[2] * py + m[4]
    const y = m[1] * px + m[3] * py + m[5]
    box.x0 = Math.min(box.x0, x)
    box.y0 = Math.min(box.y0, y)
    box.x1 = Math.max(box.x1, x)
    box.y1 = Math.max(box.y1, y)
  }
  return box
}

function isPainted(el: Element) {
  const visible = (c: string | null) => c !== null && c !== "none" && c !== "transparent"
  return visible(el.getAttribute("fill")) || visible(el.getAttribute("stroke"))
}

// Reads glyph placements and drawn shapes (fraction bars, root overlines, …)
// out of a typst.ts SVG. Glyphs are identified by their outline, so two
// symbols that are drawn identically count as the same glyph.
export function extractLayout(svg: string): Layout | null {
  const root = new DOMParser().parseFromString(svg, "text/html").querySelector("svg")
  if (!root) return null

  const outlines = new Map<string, { key: string; points: Array<[number, number]> }>()
  root.querySelectorAll("defs [id]").forEach((el) => {
    const d = el.getAttribute("d")
    outlines.set(el.id, { key: d ?? el.outerHTML, points: d ? pathPoints(d) : [] })
  })

  const layout: Layout = { glyphs: [], shapes: [] }
  const walk = (el: Element, m: Matrix) => {
    for (const child of Array.from(el.children)) {
      const tag = child.localName.toLowerCase()
      if (tag === "defs" || tag === "style" || tag === "script" || tag === "foreignobject") continue
      const cm = multiply(m, parseTransform(child.getAttribute("transform")))
      if (tag === "use") {
        const ref = (child.getAttribute("href") ?? child.getAttribute("xlink:href") ?? "").replace(/^#/, "")
        const outline = outlines.get(ref)
        const um = multiply(cm, [1, 0, 0, 1, Number(child.getAttribute("x") ?? 0), Number(child.getAttribute("y") ?? 0)])
        const box = outline && boxOf(outline.points, um)
        // Space characters are glyphs with an empty outline.
        if (!outline || !box || box.x1 - box.x0 < 1e-3 || box.y1 - box.y0 < 1e-3) continue
        const size = Math.sqrt(Math.abs(um[0] * um[3] - um[1] * um[2]))
        layout.glyphs.push({ key: outline.key, x: um[4], y: um[5], size, box })
      } else if (tag === "path") {
        const box = isPainted(child) ? boxOf(pathPoints(child.getAttribute("d") ?? ""), cm) : null
        if (box) layout.shapes.push(box)
      } else {
        walk(child, cm)
      }
    }
  }
  walk(root, IDENTITY)
  return layout
}

export function layoutsMatch(a: Layout, b: Layout, tol: Tolerance): boolean {
  const ga = a.glyphs
  const gb = b.glyphs
  if (ga.length !== gb.length || a.shapes.length !== b.shapes.length) return false
  if (ga.length === 0) return a.shapes.length === 0
  const tx = tol.x * FONT_SIZE_PT
  const ty = tol.y * FONT_SIZE_PT

  for (let i = 0; i < ga.length; i++) {
    if (ga[i].key !== gb[i].key) return false
    if (Math.abs(ga[i].size - gb[i].size) > 0.02 * ga[i].size) return false
  }

  // The two formulas can sit at different heights on their pages, so compare
  // heights relative to the typical offset, and horizontal positions as the
  // step from one glyph to the next (spacing differences add up otherwise).
  const dy = median(ga.map((g, i) => gb[i].y - g.y))
  for (let i = 0; i < ga.length; i++) {
    if (Math.abs(gb[i].y - ga[i].y - dy) > ty) return false
    if (i > 0 && Math.abs(gb[i].x - gb[i - 1].x - (ga[i].x - ga[i - 1].x)) > tx) return false
  }

  // Lines must sit at the same height, and each end must be in the same place
  // relative to the glyph nearest to it.
  for (let j = 0; j < a.shapes.length; j++) {
    const sa = a.shapes[j]
    const sb = b.shapes[j]
    if (Math.abs(sb.y0 - sa.y0 - dy) > ty || Math.abs(sb.y1 - sa.y1 - dy) > ty) return false
    for (const edge of ["x0", "x1"] as const) {
      const k = nearestGlyph(ga, sa[edge], (sa.y0 + sa.y1) / 2, edge)
      if (Math.abs(sb[edge] - gb[k].box[edge] - (sa[edge] - ga[k].box[edge])) > tx) return false
    }
  }
  return true
}

function nearestGlyph(glyphs: Glyph[], x: number, y: number, edge: "x0" | "x1"): number {
  let best = 0
  let bestDist = Infinity
  glyphs.forEach((g, i) => {
    const dist = Math.abs(g.box[edge] - x) + Math.abs((g.box.y0 + g.box.y1) / 2 - y)
    if (dist < bestDist) {
      bestDist = dist
      best = i
    }
  })
  return best
}

function median(values: number[]): number {
  const sorted = [...values].sort((p, q) => p - q)
  return sorted[Math.floor(sorted.length / 2)]
}
