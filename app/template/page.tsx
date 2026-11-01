import fs from "node:fs"
import path from "node:path"
import Link from "next/link"
import { ArrowLeft, ArrowUpRight } from "lucide-react"
import { Wordmark } from "@/components/wordmark"
import { TypstExample } from "@/components/typst-example"

export default function ExamplePage() {
  const source = fs.readFileSync(path.join(process.cwd(), "public", "example", "main.typ"), "utf8")

  return (
    <div className="flex min-h-dvh flex-col md:h-dvh">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-card/80 px-2 backdrop-blur-md sm:px-4">
        <Link
          href="/"
          className="group flex items-center gap-2 rounded-md px-2 py-1 text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
          <Wordmark className="text-xl" />
        </Link>
        <span className="text-muted-foreground/40">/</span>
        <h1 className="text-sm font-medium">Example</h1>
        <p className="ml-2 hidden truncate text-xs text-muted-foreground lg:block">
          Edit the source and the pages re-render as you type, right in your browser.
        </p>
        <a
          href="https://typst.app/universe/package/sdust"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <span className="font-mono">@preview/sdust</span>
          <span className="hidden sm:inline">on Typst Universe</span>
          <ArrowUpRight className="size-3.5" />
        </a>
      </header>

      <TypstExample
        initialSource={source}
        note="This is just an assignment from class, so it may include errors or mistakes."
      />
    </div>
  )
}
