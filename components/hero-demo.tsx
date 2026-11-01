"use client"

import { useEffect, useState } from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

// Pre-rendered with typst.ts (see public/demo), so the landing page doesn't
// need to load the compiler. Sizes are the SVG viewBox in pt.
const DEMOS = [
  { problem: 62, src: "integral_(-oo)^oo e^(-x^2) dif x = sqrt(pi)", file: "gaussian.svg", w: 186, h: 63 },
  { problem: 75, src: "e^(i pi) + 1 = 0", file: "euler.svg", w: 115, h: 29 },
  { problem: 80, src: "sum_(n = 1)^oo 1 / n^2 = pi^2 / 6", file: "basel.svg", w: 128, h: 66 },
]

const SCALE = 1.4
const TYPE_MS = 110
const HOLD_MS = 3600

export function HeroDemo({ total }: { total: number }) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ""
  const [demoIndex, setDemoIndex] = useState(0)
  const [typed, setTyped] = useState(DEMOS[0].src.length)

  const demo = DEMOS[demoIndex]
  const done = typed >= demo.src.length

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const timer = done
      ? setTimeout(() => {
          setDemoIndex((i) => (i + 1) % DEMOS.length)
          setTyped(0)
        }, HOLD_MS)
      : setTimeout(() => setTyped((n) => n + 1), TYPE_MS + (demo.src[typed] === " " ? 80 : 0))
    return () => clearTimeout(timer)
  }, [done, typed, demo.src])

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-card text-left shadow-[0_1px_2px_rgb(15_23_42/0.04),0_12px_40px_-12px_rgb(15_23_42/0.18)] transition-colors duration-500",
        done && "border-success/50",
      )}
    >
      <div className="flex items-center justify-between border-b px-4 py-2.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <span aria-hidden className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-border" />
            <span className="size-2.5 rounded-full bg-border" />
            <span className="size-2.5 rounded-full bg-border" />
          </span>
          <span className="tabular-nums">
            Problem {demo.problem} / {total}
          </span>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium transition-colors duration-300",
            done ? "bg-success/12 text-success-foreground" : "text-muted-foreground",
          )}
        >
          {done ? (
            <>
              <Check className="size-3.5" strokeWidth={2.5} /> Correct
            </>
          ) : (
            "typing…"
          )}
        </span>
      </div>

      <div className="relative grid min-h-[168px] place-items-center px-6 py-8">
        <div aria-hidden className="absolute inset-0 bg-dots opacity-60" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={demo.file}
          src={`${basePath}/demo/${demo.file}`}
          alt={`Rendered formula for ${demo.src}`}
          width={demo.w * SCALE}
          height={demo.h * SCALE}
          className="relative max-w-full h-auto animate-in fade-in duration-500"
        />
      </div>

      <div className="flex items-center gap-3 border-t bg-muted/40 px-4 py-3 font-mono text-[13px] sm:text-sm">
        <span className="select-none text-brand">$</span>
        <span className="min-w-0 flex-1 truncate text-foreground">
          {demo.src.slice(0, typed)}
          <span
            aria-hidden
            className={cn("ml-px inline-block h-[1.1em] w-[2px] translate-y-[3px] bg-brand", done && "opacity-0")}
          />
        </span>
        <span className="select-none text-brand">$</span>
      </div>
    </div>
  )
}
