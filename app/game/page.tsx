"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  Lightbulb,
  PanelRightClose,
  PanelRightOpen,
  RotateCcw,
  SkipForward,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Wordmark } from "@/components/wordmark"
import { cn } from "@/lib/utils"
import {
  checkAnswer,
  extractLayout,
  makeTypstDoc,
  stripMathDelimiters,
  type Layout,
  type Verdict,
} from "@/lib/answer-check"
import { loadTypst } from "@/lib/typst-loader"

type GameState = "loading" | "playing" | "done"

type Problem = { math: string; hint?: string }

type Solved = { answer: string; verdict: Verdict }

function parseProblemsFile(text: string): Problem[] {
  return text
    .split("\n")
    .map((line): Problem | null => {
      const l = line.trim()
      if (!l || l.startsWith("#")) return null

      // Split math and hint on the first unescaped '#'
      const hashIdx = l.indexOf("#")
      let math = (hashIdx >= 0 ? l.slice(0, hashIdx) : l).trim()
      const hint = hashIdx >= 0 ? l.slice(hashIdx + 1).trim() : undefined

      // Remove $ delimiters if present
      if (math.startsWith("$") && math.endsWith("$") && math.length > 1) {
        math = math.slice(1, -1).trim()
      }
      if (!math) return null
      return { math, hint: hint || undefined }
    })
    .filter((p): p is Problem => p !== null)
}

// typst.ts compiles one document at a time, so renders are queued (concurrent
// calls can otherwise get each other's output). Results are cached by source
// because the answer checker asks for the same formulas over and over.
const svgCache = new Map<string, Promise<string>>()
const layoutCache = new Map<string, Promise<Layout | null>>()
let renderQueue: Promise<unknown> = Promise.resolve()

function renderSvg(math: string): Promise<string> {
  let svg = svgCache.get(math)
  if (!svg) {
    svg = renderQueue.then(
      // @ts-expect-error - $typst is loaded via CDN
      () => window.$typst.svg({ mainContent: makeTypstDoc(math) }) as Promise<string>,
    )
    renderQueue = svg.catch(() => undefined)
    svgCache.set(math, svg)
    if (svgCache.size > 300) svgCache.delete(svgCache.keys().next().value!)
  }
  return svg
}

function layoutOf(math: string): Promise<Layout | null> {
  let layout = layoutCache.get(math)
  if (!layout) {
    layout = renderSvg(math).then(extractLayout, () => null)
    layoutCache.set(math, layout)
    if (layoutCache.size > 300) layoutCache.delete(layoutCache.keys().next().value!)
  }
  return layout
}

const normalize = (s: string) => s.trim().replace(/\s+/g, " ")

export default function TypstniquePage() {
  const [gameState, setGameState] = useState<GameState>("loading")
  const [problems, setProblems] = useState<Problem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [solved, setSolved] = useState<Map<number, Solved>>(new Map())
  const [skippedSet, setSkippedSet] = useState<Set<number>>(new Set())
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [userInput, setUserInput] = useState("")
  const [targetSvg, setTargetSvg] = useState("")
  const [targetRenderError, setTargetRenderError] = useState<string | null>(null)
  const [previewSvg, setPreviewSvg] = useState("")
  const [previewError, setPreviewError] = useState(false)
  const [solutionShown, setSolutionShown] = useState(false)
  const [hintShown, setHintShown] = useState(false)
  const [typstReady, setTypstReady] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const advanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const solvedRef = useRef<Map<number, Solved>>(solved)
  solvedRef.current = solved

  // Load problems from file
  const [problemsLoaded, setProblemsLoaded] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Load Typst WASM
  useEffect(() => {
    loadTypst().then(
      () => setTypstReady(true),
      (e: Error) => setLoadError(e.message),
    )
  }, [])

  useEffect(() => {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ""
    fetch(`${basePath}/problems.txt`)
      .then((r) => r.text())
      .then((text) => {
        const parsed = parseProblemsFile(text)
        if (parsed.length === 0) {
          setLoadError("No problems found in problems.txt")
          return
        }
        setProblems(parsed)
        setProblemsLoaded(true)
      })
      .catch(() => {
        setLoadError("Could not load problems.txt")
      })
  }, [])

  // Initialize game when both Typst and problems are ready
  useEffect(() => {
    if (typstReady && problemsLoaded) {
      setGameState("playing")
    }
  }, [typstReady, problemsLoaded])

  // The problem list starts collapsed on small screens.
  useEffect(() => {
    if (window.matchMedia("(max-width: 767px)").matches) setSidebarOpen(false)
  }, [])

  // Render target when problem changes
  useEffect(() => {
    if (!typstReady || problems.length === 0) return
    let cancelled = false
    renderSvg(problems[currentIndex].math).then(
      (svg) => {
        if (cancelled) return
        setTargetSvg(svg)
        setTargetRenderError(null)
      },
      (e) => {
        if (cancelled) return
        console.error("Typst target render error:", e)
        setTargetSvg("")
        setTargetRenderError(e instanceof Error ? e.message : String(e))
      },
    )
    return () => {
      cancelled = true
    }
  }, [typstReady, problems, currentIndex])

  useEffect(() => {
    const saved = solvedRef.current.get(currentIndex)
    setUserInput(saved?.answer ?? "")
    setPreviewSvg("")
    setPreviewError(false)
    setSolutionShown(false)
    setHintShown(false)
    if (!saved) requestAnimationFrame(() => inputRef.current?.focus())
    document.querySelector(`[data-problem="${currentIndex}"]`)?.scrollIntoView({ block: "nearest" })
  }, [currentIndex])

  const goNext = useCallback(() => {
    if (currentIndex + 1 >= problems.length) {
      setGameState("done")
    } else {
      setCurrentIndex((i) => i + 1)
    }
  }, [currentIndex, problems.length])

  const markCorrect = useCallback(
    (answer: string, verdict: Verdict) => {
      if (solvedRef.current.has(currentIndex)) return
      const next = new Map(solvedRef.current).set(currentIndex, { answer, verdict })
      solvedRef.current = next
      setSolved(next)
      // If this problem was previously skipped, move it out of the skipped bucket
      // so completing it after a skip gives full credit.
      setSkippedSet((prev) => {
        if (!prev.has(currentIndex)) return prev
        const s = new Set(prev)
        s.delete(currentIndex)
        return s
      })
      // Leave a little longer to read the reference when the answer only matched loosely.
      advanceTimeoutRef.current = setTimeout(
        () => {
          advanceTimeoutRef.current = null
          goNext()
        },
        verdict === "exact" ? 700 : 2000,
      )
    },
    [currentIndex, goNext],
  )

  // Live preview with debounce, then check the answer against the target.
  useEffect(() => {
    const input = stripMathDelimiters(userInput)
    if (!typstReady || !input) {
      setPreviewSvg("")
      setPreviewError(false)
      return
    }

    let cancelled = false
    const timer = setTimeout(async () => {
      try {
        const svg = await renderSvg(input)
        if (cancelled) return
        setPreviewSvg(svg)
        setPreviewError(false)
      } catch {
        // Keep showing the last good render (dimmed) while the input is incomplete.
        if (!cancelled) setPreviewError(true)
        return
      }

      // Accept anything Typst draws the same way as the target, give or take
      // some spacing — see lib/answer-check.ts.
      if (solvedRef.current.has(currentIndex)) return
      const verdict = await checkAnswer(problems[currentIndex].math, input, layoutOf)
      if (!cancelled && verdict !== "wrong") markCorrect(userInput, verdict)
    }, 150)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [userInput, typstReady, currentIndex, problems, markCorrect])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setUserInput(value)
    if (normalize(stripMathDelimiters(value)) === normalize(problems[currentIndex].math)) {
      markCorrect(value, "exact")
    }
  }

  const isCorrect = solved.has(currentIndex)

  const handleSkip = () => {
    if (isCorrect) return
    setSkippedSet((prev) => new Set(prev).add(currentIndex))
    goNext()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Tab") {
      e.preventDefault()
      handleSkip()
    }
  }

  const selectProblem = (idx: number) => {
    if (advanceTimeoutRef.current) {
      clearTimeout(advanceTimeoutRef.current)
      advanceTimeoutRef.current = null
    }
    setCurrentIndex(idx)
    if (window.matchMedia("(max-width: 767px)").matches) setSidebarOpen(false)
  }

  const handleRestart = () => {
    setCurrentIndex(0)
    setSolved(new Map())
    setSkippedSet(new Set())
    setUserInput("")
    setPreviewSvg("")
    setPreviewError(false)
    setSolutionShown(false)
    setHintShown(false)
    setGameState("playing")
  }

  const solvedCount = solved.size
  const skippedCount = skippedSet.size

  // Loading screen
  if (gameState === "loading") {
    return (
      <main className="relative flex min-h-dvh items-center justify-center overflow-hidden p-6">
        <div
          aria-hidden
          className="absolute inset-0 bg-dots [mask-image:radial-gradient(ellipse_at_center,black,transparent_65%)]"
        />
        <div className="relative space-y-6 text-center">
          <h1 className="text-6xl md:text-7xl">
            <Wordmark />
          </h1>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">A Typst Math Typing Practice</p>
          {loadError ? (
            <p className="text-sm text-destructive">{loadError}</p>
          ) : (
            <div className="flex items-center justify-center gap-2" aria-label="Loading the Typst compiler">
              <span className="size-2 animate-pulse rounded-full bg-brand/60" />
              <span className="size-2 animate-pulse rounded-full bg-brand/60 [animation-delay:150ms]" />
              <span className="size-2 animate-pulse rounded-full bg-brand/60 [animation-delay:300ms]" />
            </div>
          )}
        </div>
      </main>
    )
  }

  // Done screen
  if (gameState === "done") {
    return (
      <main className="relative flex min-h-dvh items-center justify-center overflow-hidden p-6">
        <div
          aria-hidden
          className="absolute inset-0 bg-dots [mask-image:radial-gradient(ellipse_at_center,black,transparent_65%)]"
        />
        <div className="relative w-full max-w-md rounded-3xl border bg-card px-8 py-12 text-center shadow-[0_12px_40px_-12px_rgb(15_23_42/0.18)]">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Completed</p>
          <p className="mt-4 font-serif text-7xl tracking-tight tabular-nums md:text-8xl">
            {solvedCount}
            <span className="text-muted-foreground/50"> / {problems.length}</span>
          </p>
          {skippedCount > 0 && <p className="mt-2 text-sm text-muted-foreground">{skippedCount} skipped</p>}
          <div className="mt-10 flex items-center justify-center gap-3">
            <Button onClick={handleRestart} size="lg" className="rounded-full px-6">
              <RotateCcw /> Play again
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full px-6">
              <Link href="/">Home</Link>
            </Button>
          </div>
        </div>
      </main>
    )
  }

  const problem = problems[currentIndex]
  const verdict = solved.get(currentIndex)?.verdict
  const remaining = problems.length - solvedCount - skippedCount

  // Game screen
  return (
    <div className="flex h-dvh flex-col">
      <header className="relative z-20 shrink-0 border-b bg-card/80 backdrop-blur-md">
        <div className="flex h-14 items-center gap-2 px-2 sm:px-4">
          <Link
            href="/"
            className="group flex items-center gap-2 rounded-md px-2 py-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
            <Wordmark className="text-xl" />
          </Link>
          <div className="ml-auto flex items-center gap-1 sm:gap-3">
            <Stat label="Problem" value={`${currentIndex + 1} / ${problems.length}`} />
            <Stat label="Solved" icon={Check} value={solvedCount} className="text-success-foreground" />
            {skippedCount > 0 && (
              <Stat label="Skipped" value={skippedCount} className="hidden text-warning-foreground sm:flex" />
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setSidebarOpen((open) => !open)}
              aria-label={sidebarOpen ? "Hide problems list" : "Show problems list"}
              className="text-muted-foreground"
            >
              {sidebarOpen ? <PanelRightClose /> : <PanelRightOpen />}
            </Button>
          </div>
        </div>
        <div className="absolute inset-x-0 -bottom-px h-0.5">
          <div
            className="h-full bg-brand transition-[width] duration-500"
            style={{ width: `${(solvedCount / problems.length) * 100}%` }}
          />
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <main className="relative flex-1 overflow-y-auto [scrollbar-gutter:stable]">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-dots [mask-image:linear-gradient(to_bottom,black,transparent)]"
          />
          <div className="relative mx-auto w-full max-w-3xl space-y-4 px-4 py-8 sm:px-6 md:py-14">
            {/* Target formula */}
            <section
              className={cn(
                "rounded-2xl border bg-card shadow-[0_1px_2px_rgb(15_23_42/0.04),0_8px_24px_-12px_rgb(15_23_42/0.12)] transition-[border-color,box-shadow] duration-300",
                isCorrect && "border-success/50 ring-4 ring-success/10",
              )}
            >
              <CardLabel>
                <span>Target</span>
                <span className="normal-case tracking-normal tabular-nums">#{currentIndex + 1}</span>
              </CardLabel>
              <div className="flex min-h-[180px] items-center justify-center overflow-x-auto px-6 pb-10 pt-4">
                {targetSvg ? (
                  <div
                    className="md:[zoom:1.25] [&_svg]:h-auto [&_svg]:max-w-full"
                    dangerouslySetInnerHTML={{ __html: targetSvg }}
                  />
                ) : targetRenderError ? (
                  <p className="break-all font-mono text-xs text-destructive">{targetRenderError}</p>
                ) : (
                  <div className="h-10 w-48 animate-pulse rounded-lg bg-muted" />
                )}
              </div>
            </section>

            {/* Input */}
            <div
              className={cn(
                "flex items-center gap-3 rounded-2xl border bg-card px-4 shadow-xs transition-[border-color,box-shadow] duration-200 focus-within:border-brand/60 focus-within:ring-4 focus-within:ring-brand/15 sm:px-5",
                isCorrect && "border-success/50",
              )}
            >
              <span className="select-none font-mono text-lg text-brand">$</span>
              <input
                ref={inputRef}
                type="text"
                value={userInput}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="type typst math..."
                aria-label="Your Typst math"
                className="min-w-0 flex-1 bg-transparent py-4 font-helvetica text-lg outline-none placeholder:text-muted-foreground/50"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                disabled={isCorrect}
                autoFocus
              />
              <span className="select-none font-mono text-lg text-brand">$</span>
              {isCorrect && (
                <span className="grid size-6 shrink-0 animate-in zoom-in-50 place-items-center rounded-full bg-success text-white">
                  <Check className="size-3.5" strokeWidth={3} />
                </span>
              )}
            </div>

            {/* Preview */}
            <section
              className={cn(
                "rounded-2xl border border-dashed bg-card/60 transition-colors duration-300",
                isCorrect && "border-solid border-success/40 bg-success/5",
              )}
              aria-live="polite"
            >
              <CardLabel>
                {verdict ? (
                  <span className="inline-flex items-center gap-1.5 text-success-foreground">
                    <Check className="size-3.5" strokeWidth={2.5} />
                    {verdict === "exact" ? "Correct" : "Accepted — close enough"}
                  </span>
                ) : previewError ? (
                  <span className="text-destructive">Can&apos;t render this yet</span>
                ) : (
                  <span>Your output</span>
                )}
              </CardLabel>
              <div className="flex min-h-[110px] items-center justify-center overflow-x-auto px-6 pb-8 pt-3">
                {previewSvg ? (
                  <div
                    className={cn("transition-opacity md:[zoom:1.25] [&_svg]:h-auto [&_svg]:max-w-full", previewError && "opacity-30")}
                    dangerouslySetInnerHTML={{ __html: previewSvg }}
                  />
                ) : (
                  <p className="text-sm italic text-muted-foreground/70">
                    {previewError ? "parse error" : "your output appears here"}
                  </p>
                )}
              </div>
              {verdict === "equivalent" && (
                <p className="border-t border-success/20 px-5 py-3 text-xs text-muted-foreground">
                  Typst draws it (almost) the same. The reference writes it as{" "}
                  <code className="rounded bg-card px-1.5 py-0.5 font-mono text-foreground">{problem.math}</code>
                </p>
              )}
            </section>

            {hintShown && problem.hint && (
              <Reveal icon={Lightbulb} label="Hint">
                <p className="break-words font-helvetica">{problem.hint}</p>
              </Reveal>
            )}
            {solutionShown && (
              <Reveal icon={Eye} label="Solution">
                <code className="break-all font-mono">{problem.math}</code>
              </Reveal>
            )}

            <footer className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <p className="text-xs tabular-nums text-muted-foreground">
                {remaining} remaining
                {skippedCount > 0 && ` · ${skippedCount} skipped`}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setHintShown((s) => !s)} disabled={!problem.hint}>
                  <Lightbulb />
                  {problem.hint ? (hintShown ? "Hide hint" : "Hint") : "No hint"}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSolutionShown((s) => !s)}>
                  {solutionShown ? <EyeOff /> : <Eye />}
                  {solutionShown ? "Hide solution" : "Show solution"}
                </Button>
                <Button variant="outline" size="sm" onClick={handleSkip} disabled={isCorrect}>
                  <SkipForward />
                  Skip
                  <kbd className="ml-0.5 hidden rounded border bg-muted px-1.5 py-px font-sans text-[10px] font-normal text-muted-foreground sm:inline">
                    Tab
                  </kbd>
                </Button>
              </div>
            </footer>

            <p className="pt-6 text-center text-xs text-muted-foreground">
              Feeling stuck? See{" "}
              <a
                href="https://typst.app/docs/reference/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 transition-colors hover:text-foreground"
              >
                typst.app/docs/reference
              </a>{" "}
              for help.
            </p>
          </div>
        </main>

        {/* Problems sidebar - right side; an overlay on small screens */}
        {sidebarOpen && (
          <div
            aria-hidden
            className="fixed inset-0 z-30 bg-foreground/20 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <aside
          className={cn(
            "shrink-0 overflow-hidden border-l bg-card transition-[width] duration-300 max-md:fixed max-md:inset-y-0 max-md:right-0 max-md:z-40 max-md:shadow-xl",
            sidebarOpen ? "w-64" : "w-0 border-l-0",
          )}
        >
          <div className="flex h-full w-64 flex-col">
            <div className="flex items-baseline justify-between px-4 pb-2 pt-5">
              <h2 className="text-sm font-medium">Problems</h2>
              <span className="text-xs tabular-nums text-muted-foreground">
                {solvedCount} / {problems.length}
              </span>
            </div>
            <div className="flex gap-4 px-4 pb-4 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-sm bg-success/60" /> Solved
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-sm bg-warning/60" /> Skipped
              </span>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-6">
              <div className="grid grid-cols-6 gap-1.5">
                {problems.map((_, idx) => {
                  const isSolved = solved.has(idx)
                  const isSkipped = skippedSet.has(idx)
                  const isCurrent = idx === currentIndex

                  return (
                    <button
                      key={idx}
                      data-problem={idx}
                      onClick={() => selectProblem(idx)}
                      aria-label={`Problem ${idx + 1}${isSolved ? ", solved" : isSkipped ? ", skipped" : ""}`}
                      aria-current={isCurrent ? "step" : undefined}
                      className={cn(
                        "grid aspect-square place-items-center rounded-md text-[11px] font-medium tabular-nums transition-colors",
                        isCurrent
                          ? "bg-foreground text-background ring-2 ring-brand/50 ring-offset-1 ring-offset-card"
                          : isSolved
                            ? "bg-success/15 text-success-foreground hover:bg-success/25"
                            : isSkipped
                              ? "bg-warning/15 text-warning-foreground hover:bg-warning/25"
                              : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                      )}
                    >
                      {idx + 1}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
  icon: Icon,
  className,
}: {
  label: string
  value: React.ReactNode
  icon?: LucideIcon
  className?: string
}) {
  return (
    <div className={cn("flex items-center gap-1.5 px-1.5 text-sm", className)}>
      <span className="hidden text-xs text-muted-foreground sm:inline">{label}</span>
      {Icon && <Icon className="size-3.5 sm:hidden" strokeWidth={2.5} aria-label={label} />}
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  )
}

function CardLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5 pt-4 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
      {children}
    </div>
  )
}

function Reveal({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-brand/20 bg-accent/60 px-4 py-3 text-sm animate-in fade-in slide-in-from-top-1">
      <span className="mt-0.5 inline-flex shrink-0 items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-accent-foreground">
        <Icon className="size-3.5" />
        {label}
      </span>
      <div className="min-w-0 text-foreground">{children}</div>
    </div>
  )
}
