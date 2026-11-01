"use client"

import { useEffect, useRef, useState } from "react"
import { Check, Copy, Download, Info, LoaderCircle, RotateCcw, TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { highlightTypst } from "@/lib/typst-highlight"
import { loadTypst } from "@/lib/typst-loader"

// Package releases that aren't on Typst Universe yet, served from this site
// instead. Typst Universe is always tried first.
const BUNDLED_PACKAGES: Record<string, string> = {
  "sdust-0.2.0": "/packages/sdust-0.2.0.tar.gz",
}

type Snippet = { svg(options: { mainContent: string }): Promise<string> }
type Page = { svg: string; width: number; height: number }
type Status = { state: "loading" } | { state: "ok"; ms: number } | { state: "error"; message: string }

let compiler: Promise<Snippet> | null = null
let compileQueue: Promise<unknown> = Promise.resolve()

// A compiler of its own (not the global `$typst` the game uses) that can
// download @preview packages.
function getCompiler(basePath: string): Promise<Snippet> {
  compiler ??= loadTypst()
    .then(() => {
      // @ts-expect-error - loaded via CDN
      const { TypstSnippet, TypstCompileModule } = window
      const access = new TypstCompileModule.MemoryAccessModel()
      const typst = new TypstSnippet()
      // The bundle inlines its WASM and hands it to `$typst` the same way.
      // @ts-expect-error - loaded via CDN
      typst.setCompilerInitOptions({ getModule: () => window.$wasm$typst_compiler })
      // @ts-expect-error - loaded via CDN
      typst.setRendererInitOptions({ getModule: () => window.$wasm$typst_renderer })
      typst.use(
        TypstSnippet.withAccessModel(access),
        TypstSnippet.fetchPackageBy(access, (spec: { name: string; version: string }, url: string) => {
          const bundled = BUNDLED_PACKAGES[`${spec.name}-${spec.version}`]
          return fetchBytes(url) ?? (bundled ? fetchBytes(basePath + bundled) : undefined)
        }),
      )
      return typst as Snippet
    })
    .catch((e) => {
      compiler = null
      throw e
    })
  return compiler
}

// typst.ts asks for packages synchronously, from inside the compiler.
function fetchBytes(url: string): Uint8Array | undefined {
  const xhr = new XMLHttpRequest()
  xhr.overrideMimeType("text/plain; charset=x-user-defined")
  xhr.open("GET", url, false)
  try {
    xhr.send(null)
  } catch {
    return undefined
  }
  if (xhr.status !== 200) return undefined
  return Uint8Array.from(xhr.responseText, (c) => c.charCodeAt(0) & 0xff)
}

// typst.ts draws every page into one tall SVG. Split it so each page can be
// shown as its own sheet, keeping only the glyphs that page uses.
function splitPages(svg: string): Page[] {
  const root = new DOMParser().parseFromString(svg, "text/html").querySelector("svg")
  if (!root) return []
  root.querySelector("script")?.remove()
  // Internal links (the outline, references) call a helper from that script.
  // Keep where they point instead; the viewer handles the click.
  root.querySelectorAll("[onclick]").forEach((link) => {
    const target = link.getAttribute("onclick")?.match(/handleTypstLocation\(this, ([^,]+), ([^,]+), ([^)]+)\)/)
    link.removeAttribute("onclick")
    if (target) link.setAttribute("data-jump", target.slice(1, 4).join(" "))
  })
  const pages = Array.from(root.querySelectorAll("g.typst-page"))
  pages.forEach((page) => page.remove())

  return pages.map((page) => {
    const width = Number(page.getAttribute("data-page-width"))
    const height = Number(page.getAttribute("data-page-height"))
    const used = new Set(
      Array.from(page.querySelectorAll("use"), (u) => (u.getAttribute("href") ?? u.getAttribute("xlink:href") ?? "").slice(1)),
    )
    const sheet = root.cloneNode(true) as Element
    sheet.querySelectorAll("defs.glyph > [id]").forEach((glyph) => {
      if (!used.has(glyph.id)) glyph.remove()
    })
    page.setAttribute("transform", "translate(0, 0)")
    sheet.appendChild(page)
    sheet.setAttribute("viewBox", `0 0 ${width} ${height}`)
    sheet.setAttribute("width", String(width))
    sheet.setAttribute("height", String(height))
    return { svg: sheet.outerHTML, width, height }
  })
}

// typst.ts reports errors as a debug-printed list of diagnostics.
function errorMessage(e: unknown): string {
  const text = e instanceof Error ? e.message : String(e)
  const m = text.match(/message: "((?:[^"\\]|\\.)*)"/)
  return m ? m[1].replace(/\\"/g, '"') : text.slice(0, 300)
}

export function TypstExample({ initialSource, note }: { initialSource: string; note?: React.ReactNode }) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ""
  const [source, setSource] = useState(initialSource)
  const [pages, setPages] = useState<Page[]>([])
  const [status, setStatus] = useState<Status>({ state: "loading" })
  const [copied, setCopied] = useState(false)
  const firstRun = useRef(true)

  useEffect(() => {
    let cancelled = false
    const timer = setTimeout(
      async () => {
        try {
          const typst = await getCompiler(basePath)
          if (cancelled) return
          const start = performance.now()
          // One compile at a time; a newer edit simply discards older results.
          const run = compileQueue.then(() => typst.svg({ mainContent: source }))
          compileQueue = run.catch(() => undefined)
          const svg = await run
          if (cancelled) return
          setPages(splitPages(svg))
          setStatus({ state: "ok", ms: Math.round(performance.now() - start) })
        } catch (e) {
          if (!cancelled) setStatus({ state: "error", message: errorMessage(e) })
        }
      },
      firstRun.current ? 0 : 250,
    )
    firstRun.current = false
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [source, basePath])

  const copy = async () => {
    await navigator.clipboard.writeText(source)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const download = () => {
    const url = URL.createObjectURL(new Blob([source], { type: "text/plain" }))
    const a = document.createElement("a")
    a.href = url
    a.download = "main.typ"
    a.click()
    URL.revokeObjectURL(url)
  }

  // Scroll an internal link's target into view and mark the spot.
  const followLink = (e: React.MouseEvent<HTMLDivElement>) => {
    const link = (e.target as Element).closest("[data-jump]")
    if (!link) return
    e.preventDefault()
    const [page, x, y] = link.getAttribute("data-jump")!.split(" ").map(Number)
    const figure = e.currentTarget.querySelectorAll("figure")[page - 1]
    if (!figure || !pages[page - 1]) return
    const scale = figure.clientWidth / pages[page - 1].width
    // A bar in the margin, beside the target's first line.
    const marker = document.createElement("span")
    marker.className = "pointer-events-none absolute w-[3px] scroll-mt-20 rounded-full bg-brand"
    marker.style.left = `${x * scale - 10}px`
    marker.style.top = `${y * scale}px`
    marker.style.height = `${16 * scale}px`
    figure.append(marker)
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    marker.scrollIntoView({ behavior: reduceMotion ? "instant" : "smooth", block: "start" })
    marker.animate({ opacity: [1, 1, 0] }, { duration: 1800, easing: "ease-in" }).finished.then(() => marker.remove())
  }

  return (
    <div className="flex flex-1 flex-col md:min-h-0 md:flex-row">
      <section className="flex h-[55vh] shrink-0 flex-col border-b md:h-auto md:w-[46%] md:border-b-0 md:border-r">
        <div className="flex h-11 shrink-0 items-center justify-between gap-2 border-b bg-card px-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="rounded-md bg-muted px-2 py-1 font-mono text-xs text-foreground">main.typ</span>
            <StatusBadge status={status} />
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            {source !== initialSource && (
              <Button variant="ghost" size="sm" onClick={() => setSource(initialSource)} className="text-muted-foreground">
                <RotateCcw /> <span className="hidden sm:inline">Reset</span>
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={copy} className="text-muted-foreground">
              {copied ? <Check /> : <Copy />} <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={download} className="text-muted-foreground">
              <Download /> <span className="hidden sm:inline">Download</span>
            </Button>
          </div>
        </div>
        <div className="relative min-h-0 flex-1 bg-card">
          <CodeEditor value={source} onChange={setSource} />
        </div>
      </section>

      <section className="relative min-h-[60vh] flex-1 bg-muted/80 md:min-h-0 md:overflow-y-auto">
        {status.state === "error" && (
          <div className="sticky top-0 z-10 flex items-start gap-2 border-b border-destructive/20 bg-card/95 px-4 py-2.5 text-xs text-destructive backdrop-blur">
            <TriangleAlert className="mt-px size-3.5 shrink-0" />
            <p className="min-w-0 break-words font-mono">{status.message}</p>
          </div>
        )}
        <div
          onClick={followLink}
          className={cn(
            "mx-auto flex max-w-[680px] flex-col items-center gap-8 px-4 py-8 transition-opacity sm:px-10",
            status.state === "error" && "opacity-50",
          )}
        >
          {note && (
            <p className="-mb-3 flex items-start gap-1.5 text-xs text-muted-foreground">
              <Info className="mt-px size-3.5 shrink-0" /> {note}
            </p>
          )}
          {pages.length === 0 && (
            <div className="grid aspect-[210/297] w-full place-items-center rounded-sm bg-card shadow-sm">
              {status.state === "loading" && (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <LoaderCircle className="size-4 animate-spin" /> Loading Typst and @preview/sdust…
                </p>
              )}
            </div>
          )}
          {pages.map((page, i) => (
            <figure key={i} className="relative w-full">
              <div
                className="overflow-hidden rounded-sm bg-white shadow-[0_1px_3px_rgb(15_23_42/0.08),0_16px_40px_-16px_rgb(15_23_42/0.3)] [&_svg]:h-auto [&_svg]:w-full"
                style={{ aspectRatio: `${page.width} / ${page.height}` }}
                dangerouslySetInnerHTML={{ __html: page.svg }}
              />
              <figcaption className="mt-2 text-center text-[11px] tabular-nums text-muted-foreground">
                {i + 1} / {pages.length}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>
    </div>
  )
}

function StatusBadge({ status }: { status: Status }) {
  if (status.state === "loading") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <LoaderCircle className="size-3.5 animate-spin" /> Loading…
      </span>
    )
  }
  if (status.state === "error") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-destructive">
        <TriangleAlert className="size-3.5" /> Error
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-success-foreground">
      {/* The first compile includes downloading fonts and packages. */}
      <Check className="size-3.5" strokeWidth={2.5} /> Compiled{status.ms < 1000 && ` in ${status.ms} ms`}
    </span>
  )
}

// A textarea on top of a highlighted copy of its text.
function CodeEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const highlightRef = useRef<HTMLPreElement>(null)
  const syncScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (!highlightRef.current) return
    highlightRef.current.scrollTop = e.currentTarget.scrollTop
    highlightRef.current.scrollLeft = e.currentTarget.scrollLeft
  }
  // Both layers must wrap at the same width, scrollbar or not.
  const shared =
    "absolute inset-0 m-0 whitespace-pre-wrap break-words p-4 font-mono text-[13px] leading-6 [scrollbar-gutter:stable] [tab-size:2]"

  return (
    <>
      <pre
        ref={highlightRef}
        aria-hidden
        className={cn(shared, "pointer-events-none overflow-hidden text-foreground")}
        dangerouslySetInnerHTML={{ __html: highlightTypst(value) + "\n" }}
      />
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={syncScroll}
        spellCheck={false}
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        aria-label="Typst source"
        className={cn(
          shared,
          "h-full w-full resize-none overflow-auto bg-transparent text-transparent caret-foreground outline-none selection:bg-brand/20",
        )}
      />
    </>
  )
}
