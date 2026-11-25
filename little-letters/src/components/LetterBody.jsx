import Markdown from "react-markdown";
export default function LetterBody({ body }) {
  const prepared = (body || "")
    .split("\n")
    .map((line) => (line.trim() ? `${line}  ` : ""))
    .join("\n");
  return (
    <div className="break-words font-body text-[18px] leading-[1.75] text-ink [overflow-wrap:anywhere]">
      <Markdown
        components={{
          p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
          strong: ({ children }) => (
            <strong className="font-semibold">{children}</strong>
          ),
          h1: ({ children }) => (
            <p className="mb-4 font-semibold">{children}</p>
          ),
          h2: ({ children }) => (
            <p className="mb-4 font-semibold">{children}</p>
          ),
          h3: ({ children }) => (
            <p className="mb-4 font-semibold">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="mb-4 list-disc space-y-1 pl-5">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-4 list-decimal space-y-1 pl-5">{children}</ol>
          ),
          a: ({ children }) => (
            <span className="underline decoration-hairline">{children}</span>
          ),
          img: () => null,
          blockquote: ({ children }) => (
            <blockquote className="mb-4 border-l-2 border-blush pl-4 italic">
              {children}
            </blockquote>
          ),
        }}
      >
        {prepared}
      </Markdown>
    </div>
  );
}
