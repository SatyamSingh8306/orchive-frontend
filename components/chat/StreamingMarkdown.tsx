"use client";

/**
 * StreamingMarkdown — markdown renderer used by both static messages
 * and live-streaming token deltas.
 *
 * We use `react-markdown` with `remark-gfm` (tables, strikethrough,
 * task lists) and `rehype-raw` (allow raw HTML inside markdown).
 * Custom component renderers apply the blueprint-paper aesthetic
 * (hairline borders, mono eyebrows, no Tailwind prose reset).
 *
 * Streaming: when `streaming` is true, a blinking caret pseudo-element
 * is appended at the end of the rendered content.
 *
 * Note: we use a simple wrapper class on the root div and let the
 * custom component renderers carry the styles. This avoids the
 * styled-jsx `:global(p)` approach which is brittle when react-markdown
 * renders children across multiple element types.
 */

import React from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { FiCheck, FiCopy } from "react-icons/fi";
import { useState } from "react";

interface StreamingMarkdownProps {
  content: string;
  streaming?: boolean;
  className?: string;
}

function CodeBlock({
  language,
  children,
}: {
  language: string;
  children: string;
}) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* noop */
    }
  };
  return (
    <div className="group relative my-3 overflow-hidden border border-[var(--ink)] bg-[var(--ink)] font-mono text-[12px] text-[var(--paper)]">
      <div className="flex items-center justify-between border-b border-[var(--paper)]/20 px-3 py-1">
        <span className="mono text-[9px] uppercase tracking-[0.2em] text-[var(--paper)]/60">
          {language || "code"}
        </span>
        <button
          type="button"
          onClick={copy}
          aria-label="Copy code"
          className="mono flex items-center gap-1.5 text-[9px] uppercase tracking-[0.2em] text-[var(--paper)]/70 opacity-0 transition-opacity hover:text-[var(--paper)] focus:opacity-100 group-hover:opacity-100"
        >
          {copied ? <FiCheck className="h-3 w-3" /> : <FiCopy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto whitespace-pre p-3 leading-relaxed">
        <code>{children}</code>
      </pre>
    </div>
  );
}

const components: Components = {
  // Block-level elements — apply typography styles inline.
  p({ children }) {
    return (
      <p className="mb-3 text-[var(--ink)] leading-[1.65] last:mb-0">
        {children}
      </p>
    );
  },
  strong({ children }) {
    return <strong className="font-bold text-[var(--ink)]">{children}</strong>;
  },
  em({ children }) {
    return <em className="italic text-[var(--ink-2)]">{children}</em>;
  },
  ul({ children }) {
    return (
      <ul className="mb-3 ml-5 list-disc text-[var(--ink)] last:mb-0">
        {children}
      </ul>
    );
  },
  ol({ children }) {
    return (
      <ol className="mb-3 ml-5 list-decimal text-[var(--ink)] last:mb-0">
        {children}
      </ol>
    );
  },
  li({ children }) {
    return <li className="my-1">{children}</li>;
  },
  h1({ children }) {
    return (
      <h1 className="display mt-4 mb-2 text-[1.25rem] font-medium tracking-tight text-[var(--ink)]">
        {children}
      </h1>
    );
  },
  h2({ children }) {
    return (
      <h2 className="display mt-4 mb-2 text-[1.125rem] font-medium tracking-tight text-[var(--ink)]">
        {children}
      </h2>
    );
  },
  h3({ children }) {
    return (
      <h3 className="display mt-3 mb-1.5 text-[1rem] font-medium tracking-tight text-[var(--ink)]">
        {children}
      </h3>
    );
  },
  h4({ children }) {
    return (
      <h4 className="display mt-3 mb-1.5 text-[0.875rem] font-medium tracking-tight text-[var(--ink)]">
        {children}
      </h4>
    );
  },
  blockquote({ children }) {
    return (
      <blockquote className="my-3 border-l-2 border-[var(--ink)] bg-[var(--paper)] px-4 py-2 italic text-[var(--ink-2)]">
        {children}
      </blockquote>
    );
  },
  a({ children, href }) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[var(--accent)] underline decoration-2 underline-offset-2"
      >
        {children}
      </a>
    );
  },
  hr() {
    return <hr className="my-4 border-0 border-t border-[var(--rule-soft)]" />;
  },
  table({ children }) {
    return (
      <table className="my-3 w-full border-collapse border border-[var(--ink)] text-[0.85em]">
        {children}
      </table>
    );
  },
  th({ children }) {
    return (
      <th className="border-b border-[var(--ink)] bg-[var(--ink)] px-3 py-2 text-left font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--paper)]">
        {children}
      </th>
    );
  },
  td({ children }) {
    return (
      <td className="border-t border-[var(--rule-soft)] px-3 py-2 text-[var(--ink)]">
        {children}
      </td>
    );
  },
  // Inline + block code. react-markdown passes `className` like
  // "language-python" for fenced blocks; inline code has no className.
  code({ className, children, ...rest }) {
    const match = /language-(\w+)/.exec(className || "");
    const isInline = !className;
    const text = String(children ?? "").replace(/\n$/, "");
    if (isInline) {
      return (
        <code
          className="rounded border border-[var(--ink)] bg-[var(--paper)] px-1 font-[var(--font-jetbrains),ui-monospace,monospace] text-[0.8em] text-[var(--ink)]"
          {...rest}
        >
          {children}
        </code>
      );
    }
    return <CodeBlock language={match?.[1] ?? ""}>{text}</CodeBlock>;
  },
  // `pre` is the wrapper react-markdown puts around fenced code. Our
  // `code` renderer already returns the styled CodeBlock, so just
  // pass children through.
  pre({ children }) {
    return <>{children}</>;
  },
};

export default function StreamingMarkdown({
  content,
  streaming = false,
  className = "",
}: StreamingMarkdownProps) {
  return (
    <div className={`streaming-markdown ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={components}
      >
        {content}
      </ReactMarkdown>
      {streaming && content.length > 0 && (
        <span
          className="caret ml-[0.1ch] inline-block h-[1em] w-[0.5ch] animate-caret-blink bg-[var(--ink)] align-baseline"
          aria-hidden="true"
        />
      )}
    </div>
  );
}
