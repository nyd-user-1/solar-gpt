'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Link from 'next/link'

const mdComponents: Parameters<typeof ReactMarkdown>[0]['components'] = {
  p: ({ children }) => (
    <p className="mb-3 last:mb-0 text-[var(--txt)] leading-relaxed">{children}</p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-[var(--txt)]">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="italic text-[var(--muted)]">{children}</em>
  ),
  h1: ({ children }) => (
    <h1 className="text-lg font-bold text-[var(--txt)] mt-4 mb-2 first:mt-0">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-base font-bold text-[var(--txt)] mt-4 mb-2 first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-sm font-bold text-[var(--txt)] mt-3 mb-1.5 first:mt-0">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-sm font-semibold text-[var(--txt)] mt-2 mb-1 first:mt-0">{children}</h4>
  ),
  ul: ({ children }) => (
    <ul className="list-disc pl-5 mb-3 space-y-1 text-[var(--txt)]">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-5 mb-3 space-y-1 text-[var(--txt)]">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="text-[var(--txt)] leading-relaxed">{children}</li>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-solar pl-3 my-3 text-[var(--muted)] italic">{children}</blockquote>
  ),
  hr: () => <hr className="my-4 border-[var(--border)]" />,
  code: ({ children, className }) => {
    const isBlock = className?.includes('language-')
    if (isBlock) {
      return (
        <code className="block bg-[var(--inp-bg)] rounded-xl px-4 py-3 text-xs font-mono text-[var(--txt)] overflow-x-auto mb-3">
          {children}
        </code>
      )
    }
    return (
      <code className="bg-solar/10 text-solar rounded px-1 py-0.5 text-xs font-mono">{children}</code>
    )
  },
  pre: ({ children }) => (
    <pre className="bg-[var(--inp-bg)] rounded-xl px-4 py-3 overflow-x-auto mb-3 text-xs font-mono text-[var(--txt)]">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto mb-3 rounded-xl border border-[var(--border)]">
      <table className="w-full text-sm text-left">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-[var(--inp-bg)] border-b border-[var(--border)]">{children}</thead>
  ),
  th: ({ children }) => (
    <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">{children}</th>
  ),
  td: ({ children }) => (
    <td className="px-3 py-2 border-t border-[var(--border)] text-[var(--txt)]">{children}</td>
  ),
  a: ({ href, children }) => {
    if (href?.startsWith('/')) {
      return <Link href={href} className="text-solar underline underline-offset-2 hover:opacity-80 transition-opacity">{children}</Link>
    }
    return <a href={href} target="_blank" rel="noopener noreferrer" className="text-solar underline underline-offset-2 hover:opacity-80 transition-opacity">{children}</a>
  },
}

export function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
      {content}
    </ReactMarkdown>
  )
}
