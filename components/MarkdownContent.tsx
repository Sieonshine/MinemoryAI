"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const proseClasses = {
  wrapper:
    "markdown-content text-stone-800 dark:text-stone-200 [word-break:keep-all]",
  p: "text-sm leading-relaxed mb-3 last:mb-0",
  strong: "font-semibold text-stone-900 dark:text-stone-100",
  em: "italic",
  ul: "list-disc pl-5 space-y-1.5 mb-3 text-sm",
  ol: "list-decimal pl-5 space-y-1.5 mb-3 text-sm",
  li: "leading-relaxed",
  h1: "text-lg font-semibold mb-2 mt-4 first:mt-0 text-stone-900 dark:text-stone-100",
  h2: "text-base font-semibold mb-2 mt-3 first:mt-0 text-stone-900 dark:text-stone-100",
  h3: "text-sm font-semibold mb-1.5 mt-2 first:mt-0 text-stone-800 dark:text-stone-200",
  code: "rounded bg-stone-200 dark:bg-stone-700 px-1 py-0.5 text-xs font-mono",
  blockquote: "border-l-4 border-stone-300 dark:border-stone-600 pl-4 py-1 my-2 text-stone-600 dark:text-stone-400 text-sm",
  a: "text-blue-600 dark:text-blue-400 underline hover:no-underline",
};

type MarkdownContentProps = {
  content: string;
  className?: string;
  /** 요약용 단일 블록 스타일(단락만) */
  compact?: boolean;
};

export default function MarkdownContent({
  content,
  className = "",
  compact = false,
}: MarkdownContentProps) {
  const baseWrapper = compact
    ? "text-sm leading-relaxed [word-break:keep-all]"
    : proseClasses.wrapper;

  return (
    <div className={`${baseWrapper} ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => (
            <p className={proseClasses.p}>{children}</p>
          ),
          strong: ({ children }) => (
            <strong className={proseClasses.strong}>{children}</strong>
          ),
          em: ({ children }) => (
            <em className={proseClasses.em}>{children}</em>
          ),
          ul: ({ children }) => (
            <ul className={proseClasses.ul}>{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className={proseClasses.ol}>{children}</ol>
          ),
          li: ({ children }) => (
            <li className={proseClasses.li}>{children}</li>
          ),
          h1: ({ children }) => (
            <h1 className={proseClasses.h1}>{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className={proseClasses.h2}>{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className={proseClasses.h3}>{children}</h3>
          ),
          code: ({ className: codeClass, children, ...rest }) => {
            const isInline = !codeClass;
            if (isInline) {
              return (
                <code
                  className={proseClasses.code}
                  {...rest}
                >
                  {children}
                </code>
              );
            }
            return (
              <code
                className={`${proseClasses.code} block p-2 my-2`}
                {...rest}
              >
                {children}
              </code>
            );
          },
          blockquote: ({ children }) => (
            <blockquote className={proseClasses.blockquote}>
              {children}
            </blockquote>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={proseClasses.a}
            >
              {children}
            </a>
          ),
        }}
      >
        {content.trim()}
      </ReactMarkdown>
    </div>
  );
}
