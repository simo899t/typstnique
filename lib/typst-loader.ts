// Loads typst.ts (compiler + renderer, WASM inlined) from the CDN once per
// page load. It defines `window.$typst` and `window.TypstSnippet`.
const TYPST_TS_URL = "https://cdn.jsdelivr.net/npm/@myriaddreamin/typst-all-in-one.ts@0.6.0/dist/esm/index.js"

let loading: Promise<void> | null = null

export function loadTypst(): Promise<void> {
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const script = document.createElement("script")
      script.type = "module"
      script.src = TYPST_TS_URL
      script.onload = () => resolve()
      script.onerror = () => {
        loading = null
        script.remove()
        reject(new Error("Could not load the Typst compiler"))
      }
      document.head.appendChild(script)
    })
  }
  return loading
}
