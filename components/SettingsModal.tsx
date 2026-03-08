"use client";

import { useState, useEffect } from "react";
import {
  DEFAULT_SUMMARY_PROMPT,
  DEFAULT_MINUTES_PROMPT,
} from "@/lib/prompts";
import { usePromptSettings } from "@/lib/usePromptSettings";
import { useLanguage } from "@/contexts/LanguageContext";

type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { t } = useLanguage();
  const {
    summaryPrompt,
    minutesPrompt,
    saveSummary,
    saveMinutes,
    resetToDefaults,
    mounted,
  } = usePromptSettings();

  const [localSummary, setLocalSummary] = useState(DEFAULT_SUMMARY_PROMPT);
  const [localMinutes, setLocalMinutes] = useState(DEFAULT_MINUTES_PROMPT);

  useEffect(() => {
    if (mounted && isOpen) {
      setLocalSummary(summaryPrompt);
      setLocalMinutes(minutesPrompt);
    }
  }, [isOpen, mounted, summaryPrompt, minutesPrompt]);

  const handleSave = () => {
    saveSummary(localSummary);
    saveMinutes(localMinutes);
    onClose();
  };

  const handleReset = () => {
    setLocalSummary(DEFAULT_SUMMARY_PROMPT);
    setLocalMinutes(DEFAULT_MINUTES_PROMPT);
    resetToDefaults();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl border border-stone-200 bg-white shadow-xl dark:border-stone-700 dark:bg-stone-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4 dark:border-stone-700">
          <h2
            id="settings-title"
            className="text-lg font-semibold text-stone-800 dark:text-stone-100"
          >
            {t.settingsTitle}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-2 text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-700 focus:outline-none dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-200"
            aria-label={t.closeSettings}
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-6">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-stone-700 dark:text-stone-300">
                {t.summaryPromptLabel}
              </span>
              <textarea
                value={localSummary}
                onChange={(e) => setLocalSummary(e.target.value)}
                rows={6}
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100 dark:placeholder:text-stone-500"
                placeholder={t.summaryPromptPlaceholder}
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-stone-700 dark:text-stone-300">
                {t.minutesPromptLabel}
              </span>
              <textarea
                value={localMinutes}
                onChange={(e) => setLocalMinutes(e.target.value)}
                rows={8}
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100 dark:placeholder:text-stone-500"
                placeholder={t.minutesPromptPlaceholder}
              />
            </label>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-stone-200 px-6 py-4 dark:border-stone-700">
          <button
            type="button"
            onClick={handleReset}
            className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:ring-offset-2 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-200 dark:hover:bg-stone-700"
          >
            {t.resetDefaults}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-lg bg-stone-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:ring-offset-2 dark:bg-stone-700 dark:hover:bg-stone-600"
          >
            {t.saveAndClose}
          </button>
        </div>
      </div>
    </div>
  );
}
