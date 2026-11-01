import { cn } from "@/lib/utils"

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-serif tracking-tight text-foreground", className)}>
      Typst<span className="italic text-brand-foreground">nique</span>
    </span>
  )
}
