"use client";

import { useState, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

type MemoSectionProps = {
  value?: string;
  onChange?: (value: string) => void;
};

export default function MemoSection({ value, onChange }: MemoSectionProps) {
  const { t } = useLanguage();
  const [internalValue, setInternalValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const isControlled = value !== undefined;
  const displayValue = isControlled ? value : internalValue;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const next = e.target.value;
      if (isControlled) {
        onChange?.(next);
      } else {
        setInternalValue(next);
      }
    },
    [isControlled, onChange],
  );

  return (
    <section
      className="flex min-h-0 flex-1 flex-col border-0 bg-transparent shadow-none dark:bg-transparent"
      aria-label={t.memoAria}
    >
      <div className="shrink-0 border-b border-stone-200 px-4 py-3 dark:border-stone-700">
        <h3 className="text-sm font-medium text-stone-700 dark:text-stone-300">
          {t.memo}
        </h3>
      </div>

      <div className="relative min-h-0 flex-1 px-4 py-3">
        <textarea
          value={displayValue}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={t.memoPlaceholder}
          className="h-full min-h-[120px] w-full resize-y rounded bg-transparent text-[15px] leading-relaxed text-stone-800 placeholder:text-stone-400 focus:outline-none dark:text-stone-200 dark:placeholder:text-stone-500 [word-break:keep-all]"
          aria-label={t.memoInputAria}
        />
        {/* Subtle focus ring for accessibility */}
        <div
          className={`pointer-events-none absolute inset-0 rounded-md ring-1 ring-inset transition-colors ${
            isFocused
              ? "ring-amber-400/40 dark:ring-amber-500/30"
              : "ring-transparent"
          }`}
          aria-hidden
        />
      </div>

      <div className="shrink-0 border-t border-stone-200 px-4 py-2 dark:border-stone-700">
        <p className="text-xs text-stone-400 dark:text-stone-500 [word-break:keep-all]">
          {t.memoAutoSave}
        </p>
      </div>
    </section>
  );
}
