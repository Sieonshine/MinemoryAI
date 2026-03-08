export type ExportSections = {
  memo: boolean;
  transcript: boolean;
  detailedMinutes: boolean;
  summary: boolean;
};

export type ExportContent = {
  memo: string;
  transcript: string;
  detailedMinutes: string;
  summary: string;
};

/**
 * 선택된 섹션만으로 마크다운 문서 생성
 */
export function buildExportMarkdown(
  content: ExportContent,
  sections: ExportSections,
): string {
  const parts: string[] = [];

  if (sections.memo && content.memo.trim()) {
    parts.push("# 메모\n\n" + content.memo.trim());
  }
  if (sections.transcript && content.transcript.trim()) {
    parts.push("# Transcript\n\n" + content.transcript.trim());
  }
  if (sections.summary && content.summary.trim()) {
    parts.push("# 요약\n\n" + content.summary.trim());
  }
  if (sections.detailedMinutes && content.detailedMinutes.trim()) {
    parts.push("# 상세 회의록\n\n" + content.detailedMinutes.trim());
  }

  return parts.length > 0 ? parts.join("\n\n---\n\n") : "";
}

/**
 * 마크다운 문자열을 .md 파일로 다운로드
 */
export function downloadMarkdown(markdown: string, filename: string): void {
  if (!markdown.trim()) return;
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".md") ? filename : `${filename}.md`;
  a.click();
  URL.revokeObjectURL(url);
}
