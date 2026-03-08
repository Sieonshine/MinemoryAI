"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import type { ExportSections, ExportContent } from "@/lib/exportMarkdown";
import {
  buildExportMarkdown,
  downloadMarkdown,
} from "@/lib/exportMarkdown";
import { useLanguage } from "@/contexts/LanguageContext";

/** 파일명에 사용할 수 없는 문자 제거 */
function sanitizeFilename(name: string): string {
  return name.replace(/[/\\:*?"<>|]/g, "").trim() || "회의록";
}

/** 회의 날짜(datetime-local)를 파일명용 문자열로 (YYYY-MM-DD) */
function formatDateForFilename(dateStr: string): string {
  if (!dateStr) return new Date().toISOString().slice(0, 10);
  return dateStr.slice(0, 10);
}

/** base64 → Blob (audio/webm) */
function base64ToBlob(base64: string, mimeType: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mimeType });
}

/** 오디오 파일 다운로드 */
function downloadAudio(base64: string, filename: string): void {
  const blob = base64ToBlob(base64, "audio/webm");
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".webm") ? filename : `${filename}.webm`;
  a.click();
  URL.revokeObjectURL(url);
}

type ExportModalProps = {
  isOpen: boolean;
  onClose: () => void;
  content: ExportContent;
  /** 내보내기 파일명: "회의 제목 (날짜).md" */
  meetingTitle?: string;
  meetingDate?: string;
  /** 녹음 파일(base64). 있으면 녹음파일 내보내기 버튼 표시 */
  audioBase64?: string | null;
};

function defaultSections(content: ExportContent): ExportSections {
  return {
    memo: !!content.memo.trim(),
    transcript: !!content.transcript.trim(),
    detailedMinutes: !!content.detailedMinutes.trim(),
    summary: !!content.summary.trim(),
  };
}

export default function ExportModal({
  isOpen,
  onClose,
  content,
  meetingTitle = "",
  meetingDate = "",
  audioBase64 = null,
}: ExportModalProps) {
  const { t } = useLanguage();
  const sectionOptions = useMemo(
    () => [
      { key: "memo" as const, label: t.memo },
      { key: "transcript" as const, label: t.tabTranscript },
      { key: "detailedMinutes" as const, label: t.tabDetailedMinutes },
      { key: "summary" as const, label: t.tabSummary },
    ],
    [t],
  );

  const [sections, setSections] = useState<ExportSections>(() =>
    defaultSections(content),
  );

  useEffect(() => {
    if (isOpen) {
      setSections(defaultSections(content));
    }
  }, [isOpen, content.memo, content.transcript, content.summary, content.detailedMinutes]);

  const toggleSection = useCallback((key: keyof ExportSections) => {
    setSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleExport = useCallback(() => {
    const markdown = buildExportMarkdown(content, sections);
    if (!markdown.trim()) {
      return;
    }
    const title = sanitizeFilename(meetingTitle);
    const date = formatDateForFilename(meetingDate);
    const filename = `${title} (${date}).md`;
    downloadMarkdown(markdown, filename);
    onClose();
  }, [content, sections, onClose, meetingTitle, meetingDate]);

  const handleExportRecording = useCallback(() => {
    if (!audioBase64?.trim()) return;
    const title = sanitizeFilename(meetingTitle);
    const date = formatDateForFilename(meetingDate);
    downloadAudio(audioBase64, `${title} (${date}).webm`);
    onClose();
  }, [audioBase64, meetingTitle, meetingDate, onClose]);

  const hasAnyContent =
    content.memo.trim() ||
    content.transcript.trim() ||
    content.detailedMinutes.trim() ||
    content.summary.trim();

  const selectedCount = sectionOptions.filter((o) => sections[o.key]).length;
  const canExport = hasAnyContent && selectedCount > 0;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md rounded-xl border border-stone-200 bg-white shadow-xl dark:border-stone-700 dark:bg-stone-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4 dark:border-stone-700">
          <h2
            id="export-modal-title"
            className="text-lg font-semibold text-stone-800 dark:text-stone-100"
          >
            {t.exportMarkdown}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-2 text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-700 focus:outline-none dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-200"
            aria-label={t.close}
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

        <div className="px-6 py-4">
          <p className="mb-4 text-sm text-stone-600 dark:text-stone-400">
            {t.exportSelectHint}
          </p>
          <ul className="space-y-3">
            {sectionOptions.map(({ key, label }) => {
              const hasContent = !!(
                content[key as keyof ExportContent] as string
              ).trim();
              return (
                <li key={key} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id={`export-${key}`}
                    checked={sections[key]}
                    onChange={() => toggleSection(key)}
                    disabled={!hasContent}
                    className="h-4 w-4 rounded border-stone-300 text-stone-700 focus:ring-stone-500 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-300"
                  />
                  <label
                    htmlFor={`export-${key}`}
                    className={`text-sm font-medium ${
                      hasContent
                        ? "cursor-pointer text-stone-700 dark:text-stone-200"
                        : "cursor-not-allowed text-stone-400 dark:text-stone-500"
                    }`}
                  >
                    {label}
                    {!hasContent && (
                      <span className="ml-1.5 text-xs">{t.noContent}</span>
                    )}
                  </label>
                </li>
              );
            })}
          </ul>

          {audioBase64 && (
            <div className="mt-4 border-t border-stone-200 pt-4 dark:border-stone-700">
              <p className="mb-2 text-sm font-medium text-stone-700 dark:text-stone-200">
                {t.exportRecording}
              </p>
              <button
                type="button"
                onClick={handleExportRecording}
                className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:ring-offset-2 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-200 dark:hover:bg-stone-700"
              >
                {t.exportRecording}
              </button>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-stone-200 px-6 py-4 dark:border-stone-700">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:ring-offset-2 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-200 dark:hover:bg-stone-700"
          >
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={!canExport}
            className="rounded-lg bg-stone-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-stone-700 disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-stone-500 focus:ring-offset-2 dark:bg-stone-700 dark:hover:bg-stone-600"
          >
            {t.export}
          </button>
        </div>
      </div>
    </div>
  );
}
