"use client";

import MarkdownContent from "@/components/MarkdownContent";

/**
 * 상세 회의록 마크다운(## 섹션) 문자열을 시각적으로 파싱해 표시
 */
function parseSections(raw: string): { title: string; content: string }[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];

  const sections = trimmed.split(/\n##\s+/);
  return sections
    .map((block) => {
      const rawBlock = block.replace(/^#+\s*/, "").trim();
      const firstLineEnd = rawBlock.indexOf("\n");
      const title =
        firstLineEnd === -1
          ? rawBlock.trim()
          : rawBlock.slice(0, firstLineEnd).trim();
      const content =
        firstLineEnd === -1
          ? ""
          : rawBlock
              .slice(firstLineEnd + 1)
              .trim()
              .replace(/^\n+/, "");
      return { title, content };
    })
    .filter((s) => s.title.length > 0);
}

const SECTION_STYLES: Record<string, { label: string; accent: string }> = {
  "회의 제목": { label: "회의 제목", accent: "stone" },
  "회의 날짜": { label: "회의 날짜", accent: "stone" },
  "회의 일시": { label: "회의 일시", accent: "stone" },
  "회의 목적": { label: "회의 목적", accent: "stone" },
  참석자: { label: "참석자", accent: "stone" },
  "논의 내용": { label: "논의 내용", accent: "blue" },
  "결정 사항": { label: "결정 사항", accent: "blue" },
  "Action Items": { label: "Action Items", accent: "blue" },
};

function getAccentClasses(accent: string): string {
  switch (accent) {
    case "blue":
      return "border-l-4 border-l-blue-600 bg-blue-50 text-blue-800 dark:border-l-blue-500 dark:bg-blue-500/10 dark:text-blue-200";
    default:
      return "border-l-stone-300 bg-stone-100 text-stone-700 dark:border-l-stone-500/50 dark:bg-stone-500/10 dark:text-stone-300";
  }
}

export type OverviewData = {
  title: string;
  date: string;
  purpose: string;
  attendees: string;
};

const OVERVIEW_KEYS = [
  "회의 제목",
  "회의 날짜",
  "회의 일시",
  "회의 목적",
  "참석자",
];

export default function DetailedMinutesView({
  content,
  overviewData,
}: {
  content: string;
  overviewData?: OverviewData;
}) {
  const sections = parseSections(content);
  const hasOverview =
    overviewData &&
    (overviewData.title ||
      overviewData.date ||
      overviewData.purpose ||
      overviewData.attendees);
  const overviewFromSections = sections.reduce(
    (acc, { title, content: body }) => {
      if (title === "회의 제목") acc.title = body.trim();
      if (title === "회의 날짜" || title === "회의 일시")
        acc.date = body.trim();
      if (title === "회의 목적") acc.purpose = body.trim();
      if (title === "참석자") acc.attendees = body.trim();
      return acc;
    },
    { title: "", date: "", purpose: "", attendees: "" },
  );
  const displayOverview = hasOverview
    ? {
        title: overviewData!.title || overviewFromSections.title,
        date: overviewData!.date || overviewFromSections.date,
        purpose: overviewData!.purpose || overviewFromSections.purpose,
        attendees: overviewData!.attendees || overviewFromSections.attendees,
      }
    : overviewFromSections.title ||
        overviewFromSections.date ||
        overviewFromSections.purpose ||
        overviewFromSections.attendees
      ? overviewFromSections
      : null;
  const bodySections = displayOverview
    ? sections.filter((s) => !OVERVIEW_KEYS.includes(s.title))
    : sections;

  if (sections.length === 0 && !displayOverview) {
    return (
      <p className="text-sm text-stone-500 dark:text-stone-400">
        상세 회의록 내용이 없습니다.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {displayOverview && (
        <section className="rounded-lg border border-stone-200 dark:border-stone-700">
          <div className="border-l-4 border-l-stone-400 bg-stone-100 px-4 py-2.5 dark:border-l-stone-500 dark:bg-stone-800">
            <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-200">
              회의 개요
            </h3>
          </div>
          <div className="flex flex-col gap-3 px-4 py-3 [word-break:keep-all]">
            <div>
              <span className="text-xs font-medium text-stone-500 dark:text-stone-400">
                회의 제목
              </span>
              <p className="mt-0.5 text-sm text-stone-800 dark:text-stone-100">
                {displayOverview.title || "—"}
              </p>
            </div>
            <div>
              <span className="text-xs font-medium text-stone-500 dark:text-stone-400">
                회의 목적
              </span>
              <p className="mt-0.5 text-sm text-stone-800 dark:text-stone-100">
                {displayOverview.purpose || "—"}
              </p>
            </div>
            <div>
              <span className="text-xs font-medium text-stone-500 dark:text-stone-400">
                회의 일시
              </span>
              <p className="mt-0.5 text-sm text-stone-800 dark:text-stone-100">
                {displayOverview.date
                  ? displayOverview.date.replace("T", " ").slice(0, 16)
                  : "—"}
              </p>
            </div>
            <div>
              <span className="text-xs font-medium text-stone-500 dark:text-stone-400">
                참석자
              </span>
              <p className="mt-0.5 text-sm text-stone-800 dark:text-stone-100">
                {displayOverview.attendees || "—"}
              </p>
            </div>
          </div>
        </section>
      )}
      {bodySections.map(({ title, content: body }, i) => {
        const style = SECTION_STYLES[title] ?? {
          label: title,
          accent: "stone",
        };
        const accentClasses = getAccentClasses(style.accent);
        const isTitleSection = title === "회의 제목";

        return (
          <section
            key={i}
            className="rounded-lg border border-stone-200 dark:border-stone-700"
          >
            {/* 섹션 헤더 */}
            <div
              className={`flex items-center gap-2 border-l-4 px-4 py-2.5 rounded-r-md ${accentClasses}`}
            >
              <span
                className={`font-semibold ${isTitleSection ? "text-base" : "text-sm"}`}
              >
                {style.label}
              </span>
            </div>

            {/* 섹션 본문: 마크다운을 HTML로 렌더링해 가독성 확보 */}
            <div className="px-4 py-3">
              {isTitleSection ? (
                <p className="text-lg font-medium text-stone-800 dark:text-stone-100 [word-break:keep-all]">
                  {body}
                </p>
              ) : (
                <MarkdownContent
                  content={body}
                  className="text-sm text-stone-700 dark:text-stone-200"
                />
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
