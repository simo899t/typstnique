import fs from "node:fs"
import path from "node:path"
import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { ArrowRight, ArrowUpRight, Box, Braces, Crosshair, Keyboard, Library, SquareFunction, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { HeroDemo } from "@/components/hero-demo"
import { Wordmark } from "@/components/wordmark"

function countProblems(): number {
  const file = path.join(process.cwd(), "public", "problems.txt")
  return fs
    .readFileSync(file, "utf8")
    .split("\n")
    .filter((line) => line.trim() && !line.trim().startsWith("#")).length
}

const FEATURES: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Zap,
    title: "Fast compilation",
    body: "Typst uses a modern engine with 'incremental compilation', this means that only the changed parts of the document are recomputed instead of rebuilding everything. Because of this, typst can live preview a pdf as you type.",
  },
  {
    icon: Braces,
    title: "Much more readable syntax",
    body: "Unlike LaTeX, typst doesn't use the same backslashes and curly-brackets, instead, functions are written in a cleaner, more programming-like syntax with normal parentheses and brackets. This not only makes debugging easier but also makes the code way more readable.",
  },
  {
    icon: Crosshair,
    title: "Error pinpoint",
    body: "Typst gives clear error messages that highlight the exact line and explain the issue directly, instead of dumping a 200-line LaTeX log — whether you use the native app or compile it on your own PC.",
  },
  {
    icon: Library,
    title: "Less imports/libraries",
    body: "Math, figures, citations, tables, and a built-in package system — Typst handles most of it out of the box, so you rarely need to import extra packages like in LaTeX.",
  },
  {
    icon: SquareFunction,
    title: "Real functions, real variables",
    body: "#let, real scoping, first-class functions — you can easily define functions, pass them around, and reuse them cleanly, which makes everything much easier and more structured than LaTeX macros.",
  },
  {
    icon: Box,
    title: "One binary, zero setup",
    body: "After install it just works, no TeX Live or dependency chains to manage. Because it’s built in Rust, it compiles to a single fast, portable executable with no runtime clutter or external tooling needed.",
  },
]

export default function LandingPage() {
  const total = countProblems()

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="text-xl">
            <Wordmark />
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <NavLink href="/game">Practice</NavLink>
            <NavLink href="/template">Example</NavLink>
            <a
              href="https://typst.app/docs/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-0.5 rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Docs <ArrowUpRight className="size-3.5" />
            </a>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="absolute inset-0 bg-dots [mask-image:radial-gradient(ellipse_70%_65%_at_50%_0%,black,transparent)]"
          />
          <div
            aria-hidden
            className="absolute left-1/2 top-[-14rem] h-[30rem] w-[60rem] max-w-[200vw] -translate-x-1/2 rounded-full bg-brand/15 blur-3xl"
          />
          <div className="relative mx-auto max-w-5xl px-4 pb-20 pt-16 text-center sm:px-6 md:pt-24">
            <p className="inline-flex items-center gap-2 rounded-full border bg-card/80 px-3 py-1 text-xs font-medium text-muted-foreground shadow-xs backdrop-blur">
              <span className="size-1.5 rounded-full bg-brand" />
              A Typst typesetting game
            </p>
            <h1 className="mt-6 text-6xl tracking-tight sm:text-7xl md:text-8xl">
              <Wordmark />
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
              Practice typing Typst math, learn what Typst is, and grab the template I use for my own notes.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" className="h-11 rounded-full px-6 text-[15px]">
                <Link href="/game">
                  Play the typing game <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-11 rounded-full px-6 text-[15px]">
                <Link href="/template">See a live example</Link>
              </Button>
            </div>

            <div className="mx-auto mt-14 max-w-2xl">
              <HeroDemo total={total} />
              <p className="mt-4 text-xs text-muted-foreground">
                <Keyboard className="mr-1.5 inline size-3.5 -translate-y-px" />
                {total} formulas, from <code className="font-mono">1 + 1 = 2</code> to Fourier series. Your answer
                counts when it renders the same.
              </p>
            </div>
          </div>
        </section>

        <section id="typst" className="border-y bg-card">
          <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div className="max-w-2xl">
                <p className="text-sm font-medium text-brand-foreground">What is Typst?</p>
                <h2 className="mt-2 font-serif text-4xl tracking-tight sm:text-5xl">
                  And why it beats <span className="italic">LaTeX</span>
                </h2>
                <p className="mt-4 leading-relaxed text-muted-foreground">
                  Typst is a modern, open-source typesetting system. Like LaTeX, it takes a plain-text source and
                  produces a PDF — but it was built from scratch in 2023 with the lessons of forty years of LaTeX pain
                  in mind.
                </p>
              </div>
              <a
                href="https://typst.app/docs/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm font-medium text-brand-foreground underline-offset-4 hover:underline"
              >
                Read the docs <ArrowUpRight className="size-4" />
              </a>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <Feature key={f.title} {...f} />
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
          <div className="grid items-center gap-10 overflow-hidden rounded-3xl border bg-card p-6 shadow-xs sm:p-10 md:grid-cols-[1fr_1.15fr]">
            <div>
              <p className="text-sm font-medium text-brand-foreground">Template</p>
              <h2 className="mt-2 font-serif text-4xl tracking-tight">A working example</h2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                The template I use for my university notes is on Typst Universe as{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground">
                  @preview/sdust
                </code>
                . Open the example and edit it: the pages re-render as you type, right in your browser.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button asChild className="rounded-full px-5">
                  <Link href="/template">
                    Open the example <ArrowRight />
                  </Link>
                </Button>
                <a
                  href="https://typst.app/universe/package/sdust"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-medium text-brand-foreground underline-offset-4 hover:underline"
                >
                  Typst Universe <ArrowUpRight className="size-4" />
                </a>
              </div>
            </div>
            <TemplateSnippet />
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-4 py-8 text-xs text-muted-foreground sm:flex-row sm:px-6">
          <p>By Simon Holm · copyright © 2026</p>
          <nav className="flex gap-5">
            <Link href="/game" className="hover:text-foreground">
              Typing game
            </Link>
            <Link href="/template" className="hover:text-foreground">
              Example
            </Link>
            <a href="https://typst.app/docs/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
              Typst docs ↗
            </a>
          </nav>
        </div>
      </footer>
    </div>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {children}
    </Link>
  )
}

function Feature({ icon: Icon, title, body }: { icon: LucideIcon; title: string; body: string }) {
  return (
    <div className="rounded-2xl border bg-background/60 p-5 transition-colors hover:border-brand/40 hover:bg-background">
      <span className="grid size-9 place-items-center rounded-lg bg-accent text-accent-foreground">
        <Icon className="size-[18px]" />
      </span>
      <p className="mt-4 font-medium text-foreground">{title}</p>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  )
}

// How a document starts with the template, via its Typst Universe package.
function TemplateSnippet() {
  const fn = "text-[#0e8a99]"
  const str = "text-[#b4651f]"
  return (
    <div className="overflow-hidden rounded-xl border bg-[#fbfcfd] shadow-sm">
      <div className="flex items-center gap-2 border-b px-4 py-2.5">
        <span aria-hidden className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-border" />
          <span className="size-2.5 rounded-full bg-border" />
          <span className="size-2.5 rounded-full bg-border" />
        </span>
        <span className="ml-2 font-mono text-[11px] text-muted-foreground">main.typ</span>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[12.5px] leading-6 text-foreground">
        <span className={fn}>#import</span> <span className={str}>&quot;@preview/sdust:0.2.0&quot;</span>: *{"\n\n"}
        <span className={fn}>#show</span>: assignment.with({"\n"}
        {"  "}title: <span className={str}>&quot;Problem set 6&quot;</span>,{"\n"}
        {"  "}course: <span className={str}>&quot;AI504 — Knowledge Representation&quot;</span>,{"\n"}
        {"  "}date: <span className={str}>&quot;May, 2026&quot;</span>,{"\n"}
        {"  "}outline-depth: 1,{"\n"}
        ){"\n\n"}
        <span className="text-muted-foreground">= Problem 1</span>
      </pre>
    </div>
  )
}
