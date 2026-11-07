import { useEffect, useRef, type HTMLAttributes } from "react"
import { attachDither } from "@/lib/dither"

/** A paper card for React islands. The dots are attached after hydration, never in server HTML. */
export const Sheet = ({ small, className = "", ...rest }: HTMLAttributes<HTMLDivElement> & { small?: boolean }) => {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.dataset.dither = small ? "sm" : ""
    attachDither(el)
  }, [small])
  return <div ref={ref} className={`sheet ${className}`} {...rest} />
}
