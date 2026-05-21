import { parseMathText } from "@/lib/math-rendering"

type MathTextProps = {
  text: string
  className?: string
}

export function MathText({ text, className }: MathTextProps) {
  const segments = parseMathText(text)

  return (
    <span className={className}>
      {segments.map((segment, index) => {
        if (segment.type === "text") {
          return <span key={index}>{segment.value}</span>
        }

        return (
          <span
            key={index}
            className={segment.display ? "my-2 block overflow-x-auto" : "inline-block align-baseline"}
            dangerouslySetInnerHTML={{ __html: segment.html ?? "" }}
          />
        )
      })}
    </span>
  )
}
