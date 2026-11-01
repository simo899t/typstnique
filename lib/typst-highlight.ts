// A small Typst highlighter: comments, strings, math and #code. Returns HTML.
// Character-for-character with the input, so it can sit under a textarea.

const COMMENT = "#8a94a6"
const STRING = "#b4651f"
const MATH = "#7c3aed"
const CODE = "#0e8a99"

function escHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

export function highlightTypst(code: string): string {
  const out: string[] = []
  let i = 0
  let plain = ""

  const flush = () => { if (plain) { out.push(escHtml(plain)); plain = "" } }
  const span = (text: string, color: string) => {
    flush()
    out.push(`<span style="color:${color}">${escHtml(text)}</span>`)
  }

  while (i < code.length) {
    if (code[i] === "/" && code[i + 1] === "/") {
      const end = code.indexOf("\n", i)
      span(end === -1 ? code.slice(i) : code.slice(i, end), COMMENT)
      i = end === -1 ? code.length : end
      continue
    }
    if (code[i] === "/" && code[i + 1] === "*") {
      const end = code.indexOf("*/", i + 2)
      span(end === -1 ? code.slice(i) : code.slice(i, end + 2), COMMENT)
      i = end === -1 ? code.length : end + 2
      continue
    }
    // Strings end on the same line; a lone quote in prose is just a quote.
    if (code[i] === '"') {
      let j = i + 1
      while (j < code.length && code[j] !== '"' && code[j] !== "\n") { if (code[j] === "\\") j++; j++ }
      if (code[j] === '"') { span(code.slice(i, j + 1), STRING); i = j + 1; continue }
    }
    if (code[i] === "$") {
      const end = code.indexOf("$", i + 1)
      if (end !== -1) { span(code.slice(i, end + 1), MATH); i = end + 1; continue }
    }
    if (code[i] === "#") {
      const m = code.slice(i).match(/^#[a-zA-Z_][a-zA-Z0-9_-]*/)
      if (m) { span(m[0], CODE); i += m[0].length; continue }
    }
    plain += code[i++]
  }
  flush()
  return out.join("")
}
