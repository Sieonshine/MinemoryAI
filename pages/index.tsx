import React, { useState, useRef, useEffect } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import DetailedMinutesView from "@/components/DetailedMinutesView";
import MarkdownContent from "@/components/MarkdownContent";
import MemoSection from "@/components/MemoSection";
import RecordingControl, {
  type MeetingResult,
} from "@/components/RecordingControl";
import SettingsModal from "@/components/SettingsModal";
import ExportModal from "@/components/ExportModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLanguage } from "@fortawesome/free-solid-svg-icons";
import { faShareFromSquare, faFloppyDisk } from "@fortawesome/free-regular-svg-icons";
import { useLanguage } from "@/contexts/LanguageContext";
import { LANG_OPTIONS, type Lang } from "@/lib/translations";
import {
  getMeetings,
  saveMeeting,
  updateMeeting,
  deleteMeeting,
  getMeetingById,
  type Meeting,
} from "@/lib/meetings";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

type ResultTab = "transcript" | "detailed" | "summary";

export type MeetingOverview = {
  title: string;
  date: string;
  purpose: string;
  attendees: string;
};

export default function Home() {
  const { lang, setLang, t } = useLanguage();
  const [langOpen, setLangOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  const [transcript, setTranscript] = useState("");
  const [summary, setSummary] = useState("");
  const [detailedMinutes, setDetailedMinutes] = useState("");
  const [activeTab, setActiveTab] = useState<ResultTab>("transcript");
  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingPurpose, setMeetingPurpose] = useState("");
  const [meetingAttendees, setMeetingAttendees] = useState("");
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [memo, setMemo] = useState("");
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | null>(null);
  /** 현재 회의에서 막 녹음한 오디오(base64). 저장 시 사용. */
  const [currentAudioBase64, setCurrentAudioBase64] = useState<string | null>(null);

  useEffect(() => {
    setMeetings(getMeetings());
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    }
    if (langOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [langOpen]);

  /** 모바일 drawer: Escape로 닫기 */
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setSidebarOpen(false);
    }
    if (sidebarOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [sidebarOpen]);

  /** 모바일 drawer 열림 시 body 스크롤 잠금 */
  useEffect(() => {
    if (!sidebarOpen) return;
    const mq = window.matchMedia("(max-width: 767px)");
    if (!mq.matches) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [sidebarOpen]);

  const handleMeetingResult = (result: MeetingResult) => {
    setTranscript(result.transcript);
    setSummary(result.summary);
    setDetailedMinutes(result.detailedMinutes);
  };

  const handleSaveMeeting = () => {
    const existing = selectedMeetingId ? getMeetingById(selectedMeetingId) : undefined;
    const payload = {
      title: meetingTitle.trim() || t.newMeeting,
      date: meetingDate,
      purpose: meetingPurpose,
      attendees: meetingAttendees,
      transcript,
      summary,
      detailed_minutes: detailedMinutes,
      memo,
      audio_base64: currentAudioBase64 ?? existing?.audio_base64,
    };
    if (selectedMeetingId) {
      updateMeeting(selectedMeetingId, payload);
    } else {
      const saved = saveMeeting(payload);
      setSelectedMeetingId(saved.id);
    }
    setMeetings(getMeetings());
    setSaveStatus("saved");
    setTimeout(() => setSaveStatus(null), 2000);
  };

  const handleSelectMeeting = (id: string) => {
    const m = getMeetingById(id);
    if (!m) return;
    setSelectedMeetingId(id);
    setCurrentAudioBase64(null);
    setMeetingTitle(m.title);
    setMeetingDate(m.date);
    setMeetingPurpose(m.purpose);
    setMeetingAttendees(m.attendees);
    setTranscript(m.transcript);
    setSummary(m.summary);
    setDetailedMinutes(m.detailed_minutes);
    setMemo(m.memo);
  };

  const handleNewMeeting = () => {
    setSelectedMeetingId(null);
    setCurrentAudioBase64(null);
    setMeetingTitle("");
    setMeetingDate("");
    setMeetingPurpose("");
    setMeetingAttendees("");
    setTranscript("");
    setSummary("");
    setDetailedMinutes("");
    setMemo("");
  };

  const handleDeleteMeeting = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteMeeting(id);
    setMeetings(getMeetings());
    if (selectedMeetingId === id) handleNewMeeting();
  };

  const tabs: { id: ResultTab; label: React.ReactNode }[] = [
    { id: "transcript", label: <span className="whitespace-nowrap">{t.tabTranscript}</span> },
    { id: "detailed", label: <span className="whitespace-nowrap">{t.tabDetailedMinutes}</span> },
    { id: "summary", label: <span className="whitespace-nowrap">{t.tabSummary}</span> },
  ];

  /** 사이드바 본문 (데스크톱 in-flow / 모바일 drawer에서 공통) */
  const sidebarContent = (
    <>
      <div className="flex items-center justify-between border-b border-stone-200 px-4 py-4 dark:border-stone-700">
        <h1 className="text-lg font-semibold text-stone-800 dark:text-stone-100">
          {t.appTitle}
        </h1>
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="rounded p-1.5 text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-700 focus:outline-none dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-200"
          aria-label={t.sidebarClose}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>
      <div className="border-b border-stone-200 px-4 py-3 dark:border-stone-700">
        <span className="text-xs font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400">
          {t.meetingList}
        </span>
      </div>
      <nav className="flex-1 overflow-auto p-2">
        <button
          type="button"
          onClick={handleNewMeeting}
          className="mb-2 w-full rounded-md px-3 py-2 text-left text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800"
        >
          + {t.newMeetingButton}
        </button>
        {meetings.length === 0 ? (
          <div className="rounded-md px-3 py-2 text-sm text-stone-500 dark:text-stone-400 [word-break:keep-all]">
            {t.noMeetings}
          </div>
        ) : (
          <ul className="space-y-0.5">
            {meetings.map((m) => (
              <li key={m.id}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSelectMeeting(m.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleSelectMeeting(m.id);
                    }
                  }}
                  className={`flex items-center justify-between gap-1 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-stone-100 dark:hover:bg-stone-800 ${
                    selectedMeetingId === m.id
                      ? "bg-stone-100 font-medium text-stone-800 dark:bg-stone-800 dark:text-stone-100"
                      : "text-stone-700 dark:text-stone-200"
                  }`}
                >
                  <span className="min-w-0 truncate [word-break:break-word]">
                    {m.title || t.newMeeting}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteMeeting(e, m.id)}
                    className="shrink-0 rounded p-1 text-stone-400 transition-colors hover:bg-stone-200 hover:text-red-600 focus:outline-none dark:text-stone-500 dark:hover:bg-stone-700 dark:hover:text-red-400"
                    aria-label={t.deleteMeeting}
                    title={t.deleteMeeting}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </nav>
    </>
  );

  const sidebarToggleIcon = (
    <>
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        {sidebarOpen ? (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
        )}
      </svg>
    </>
  );

  return (
    <div
      className={`${geistSans.className} ${geistMono.variable} flex min-h-screen font-sans antialiased`}
    >
      {/* 데스크톱(md+): 좌측 사이드바 in-flow, expanded/collapsed, width만 변경 */}
      <div
        className="hidden md:flex md:shrink-0 md:flex-col md:border-r md:border-stone-200 md:bg-white md:transition-[width] md:duration-200 md:ease-out md:dark:border-stone-700 md:dark:bg-stone-900"
        style={{ width: sidebarOpen ? "12rem" : "3rem" }}
      >
        <button
          type="button"
          onClick={() => setSidebarOpen((open) => !open)}
          className="flex min-h-[3.5rem] items-center justify-center px-3 py-4 text-stone-500 transition-colors hover:bg-stone-50 hover:text-stone-700 focus:outline-none dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-200"
          aria-label={sidebarOpen ? t.sidebarClose : t.sidebarOpen}
          aria-expanded={sidebarOpen}
        >
          {sidebarToggleIcon}
        </button>
        {sidebarOpen && (
          <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
            {sidebarContent}
          </div>
        )}
      </div>

      {/* 모바일(md 미만): drawer + backdrop (본문 레이아웃에 영향 없음) */}
      {sidebarOpen && (
        <>
          <div
            role="button"
            tabIndex={-1}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            aria-hidden
          />
          <aside
            className="fixed left-0 top-0 z-50 flex h-full w-72 max-w-[85vw] flex-col border-r border-stone-200 bg-white shadow-xl dark:border-stone-700 dark:bg-stone-900 dark:shadow-black/40 md:hidden"
            aria-label={t.meetingList}
            role="dialog"
            aria-modal="true"
          >
            {sidebarContent}
          </aside>
        </>
      )}

      {/* 메인: 데스크톱에서 min-w 유지, 본문은 max-w-3xl로 줄바꿈 안정화 */}
      <div className="grid min-h-0 min-w-0 flex-1 grid-cols-1 grid-rows-[auto_auto_1fr] gap-0 lg:grid-cols-[1fr_20rem] lg:grid-rows-[auto_1fr] md:min-w-0">
        {/* 1) 새 회의 상단 (제목, 회의 정보, 녹음) */}
        <div className="min-h-0 overflow-auto bg-stone-50 dark:bg-stone-950 lg:col-start-1 lg:row-start-1">
          <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:py-8">
            {/* 제목·아이콘 한 줄(아이콘 오른쪽 정렬), 안내문구는 다음 줄에서 전체 사용 */}
            <div className="mb-6 flex flex-wrap items-start gap-x-2 gap-y-1 sm:gap-x-4">
              <h2 className="text-2xl font-semibold text-stone-800 dark:text-stone-100">
                {meetingTitle.trim() || t.newMeeting}
              </h2>
              <div className="min-w-0 flex-1 shrink" aria-hidden />
              <div className="flex shrink-0 items-center gap-1 sm:gap-2">
                {/* 모바일: 메뉴 버튼으로 drawer 열기 */}
                <button
                  type="button"
                  onClick={() => setSidebarOpen(true)}
                  className="rounded p-1.5 text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-700 focus:outline-none dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-200 sm:p-2 md:hidden"
                  aria-label={t.sidebarOpen}
                  aria-expanded={sidebarOpen}
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <div className="relative" ref={langMenuRef}>
                  <button
                    type="button"
                    onClick={() => setLangOpen((o) => !o)}
                    className="rounded p-1.5 text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-700 focus:outline-none dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-200 sm:p-2"
                    aria-label={t.selectLanguage}
                    aria-expanded={langOpen}
                  >
                    <FontAwesomeIcon
                      icon={faLanguage}
                      className="h-5 w-5"
                      style={{ color: "inherit" }}
                    />
                  </button>
                  {langOpen && (
                    <div className="absolute right-0 top-full z-50 mt-1 flex flex-col rounded-lg border border-stone-200 bg-white py-1 shadow-lg dark:border-stone-700 dark:bg-stone-800">
                      {LANG_OPTIONS.map((opt) => (
                        <button
                          key={opt.lang}
                          type="button"
                          onClick={() => {
                            setLang(opt.lang as Lang);
                            setLangOpen(false);
                          }}
                          className={`px-3 py-1.5 text-left text-sm transition-colors hover:bg-stone-100 dark:hover:bg-stone-700 ${
                            lang === opt.lang ? "bg-stone-100 dark:bg-stone-700" : ""
                          } text-stone-500 dark:text-stone-400`}
                          title={opt.label}
                        >
                          {opt.menuLabel}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleSaveMeeting}
                  title={saveStatus === "saved" ? t.saved : t.saveMeeting}
                  aria-label={saveStatus === "saved" ? t.saved : t.saveMeeting}
                  className="flex items-center justify-center rounded p-1.5 text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-700 focus:outline-none dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-200 sm:p-2"
                >
                  <FontAwesomeIcon
                    icon={faFloppyDisk}
                    className="h-5 w-5 shrink-0"
                    style={{ color: "inherit", width: "1.25rem", height: "1.25rem", display: "block" }}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => setExportModalOpen(true)}
                  title={t.exportMarkdown}
                  className="rounded p-1.5 text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-700 focus:outline-none dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-200 sm:p-2"
                  aria-label={t.exportMarkdown}
                >
                  <FontAwesomeIcon
                    icon={faShareFromSquare}
                    className="h-5 w-5"
                    style={{ color: "inherit" }}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsOpen(true)}
                  className="rounded p-1.5 text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-700 focus:outline-none dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-200 sm:p-2"
                  aria-label={t.openSettings}
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </button>
              </div>
              <div className="w-full">
                <p className="text-sm text-stone-500 dark:text-stone-400">
                  {t.startRecordingHint}
                </p>
              </div>
            </div>

            {/* 회의 정보 입력: 펼쳐도 아래 콘텐츠(타이머·녹음·메모)가 밀리지 않도록 절대 위치 오버레이 */}
            <div className="relative mb-6">
              <div className="rounded-lg border border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900">
                <button
                  type="button"
                  onClick={() => setOverviewOpen((prev) => !prev)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50 focus:outline-none dark:text-stone-200 dark:hover:bg-stone-800"
                  aria-expanded={overviewOpen}
                >
                  <span>{t.meetingInfo}</span>
                  <svg
                    className={`h-5 w-5 shrink-0 text-stone-500 transition-transform dark:text-stone-400 ${
                      overviewOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
              </div>
              {overviewOpen && (
                <div
                  className="absolute left-0 right-0 top-full z-20 mt-1 max-h-[min(70vh,28rem)] overflow-y-auto rounded-lg border border-stone-200 bg-white p-4 shadow-lg dark:border-stone-700 dark:bg-stone-900 dark:shadow-black/20"
                  role="region"
                  aria-label={t.meetingInfo}
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="flex flex-col gap-1.5 sm:col-span-2">
                      <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
                        {t.meetingTitle}
                      </span>
                      <input
                        type="text"
                        value={meetingTitle}
                        onChange={(e) => setMeetingTitle(e.target.value)}
                        placeholder={t.placeholderTitle}
                        className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100 dark:placeholder:text-stone-500"
                      />
                    </label>
                    <label className="flex flex-col gap-1.5 sm:col-span-2">
                      <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
                        {t.meetingPurpose}
                      </span>
                      <input
                        type="text"
                        value={meetingPurpose}
                        onChange={(e) => setMeetingPurpose(e.target.value)}
                        placeholder={t.placeholderPurpose}
                        className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100 dark:placeholder:text-stone-500"
                      />
                    </label>
                    <label className="flex flex-col gap-1.5">
                      <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
                        {t.meetingDate}
                      </span>
                      <input
                        type="datetime-local"
                        value={meetingDate}
                        onChange={(e) => setMeetingDate(e.target.value)}
                        className={`rounded-md border border-stone-300 bg-white px-3 py-2 text-sm focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500 dark:border-stone-600 dark:bg-stone-800 input-datetime ${
                          meetingDate
                            ? "text-stone-800 dark:text-stone-100"
                            : "text-stone-400 dark:text-stone-500"
                        }`}
                      />
                    </label>
                    <label className="flex flex-col gap-1.5">
                      <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
                        {t.attendees}
                      </span>
                      <input
                        type="text"
                        value={meetingAttendees}
                        onChange={(e) => setMeetingAttendees(e.target.value)}
                        placeholder={t.placeholderAttendees}
                        className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100 dark:placeholder:text-stone-500"
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div className="mb-6 lg:mb-8">
              <RecordingControl
                key={selectedMeetingId ?? "new"}
                onResult={handleMeetingResult}
                onAudioBase64={setCurrentAudioBase64}
                initialAudioBase64={
                  selectedMeetingId
                    ? getMeetingById(selectedMeetingId)?.audio_base64
                    : undefined
                }
              />
            </div>
          </div>
        </div>

        {/* 2) 메모 - 좁은 화면에서는 Transcript 탭 위, 넓은 화면에서는 오른쪽 */}
        <aside className="flex min-h-0 min-w-0 flex-col border-t border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:border-l lg:border-t-0">
          <MemoSection value={memo} onChange={setMemo} />
        </aside>

        {/* 3) Transcript / 상세 회의록 / 요약 탭 - 좁은 화면에서는 메모 아래 */}
        <div className="min-h-0 overflow-auto bg-stone-50 dark:bg-stone-950 lg:col-start-1 lg:row-start-2">
          <div className="mx-auto max-w-3xl px-4 pb-8 pt-0 sm:px-6 lg:pt-8">
            <div className="rounded-lg border border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900">
              <div
                className="flex overflow-x-auto border-b border-stone-200 dark:border-stone-700"
                role="tablist"
                aria-label={t.resultTabsAria}
              >
                {tabs.map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === id}
                    aria-controls={`panel-${id}`}
                    id={`tab-${id}`}
                    onClick={() => setActiveTab(id)}
                    className={`min-w-[5rem] flex-1 shrink-0 basis-0 px-6 py-4 text-center text-sm font-medium transition-colors focus:outline-none ${
                      activeTab === id
                        ? "font-semibold text-stone-800 dark:text-stone-100"
                        : "text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-300"
                    }`}
                  >
                    {activeTab === id ? (
                      <span className="inline-block border-b-2 border-stone-800 pb-0.5 dark:border-stone-200">
                        {label}
                      </span>
                    ) : (
                      label
                    )}
                  </button>
                ))}
              </div>
              <div
                id="panel-transcript"
                role="tabpanel"
                aria-labelledby="tab-transcript"
                hidden={activeTab !== "transcript"}
                className="px-6 py-8"
              >
                {transcript ? (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-stone-800 dark:text-stone-200 [word-break:keep-all]">
                    {transcript.split("\n").map((line, i) => {
                      const m = line.match(/^(\[\d{2}:\d{2}\]) (.*)$/);
                      if (m) {
                        return (
                          <React.Fragment key={i}>
                            <span className="text-stone-400 dark:text-stone-500">
                              {m[1]}
                            </span>{" "}
                            {m[2]}
                            {"\n"}
                          </React.Fragment>
                        );
                      }
                      return (
                        <React.Fragment key={i}>
                          {line}
                          {"\n"}
                        </React.Fragment>
                      );
                    })}
                  </p>
                ) : (
                  <p className="text-center text-sm text-stone-500 dark:text-stone-400 [word-break:keep-all]">
                    {t.transcriptEmpty}
                  </p>
                )}
              </div>
              <div
                id="panel-detailed"
                role="tabpanel"
                aria-labelledby="tab-detailed"
                hidden={activeTab !== "detailed"}
                className="px-6 py-8"
              >
                {detailedMinutes ? (
                  <DetailedMinutesView
                    content={detailedMinutes}
                    overviewData={{
                      title: meetingTitle,
                      date: meetingDate,
                      purpose: meetingPurpose,
                      attendees: meetingAttendees,
                    }}
                  />
                ) : (
                  <div className="text-center">
                    <p className="text-sm text-stone-500 dark:text-stone-400 [word-break:keep-all]">
                      {t.detailedEmpty}
                    </p>
                  </div>
                )}
              </div>
              <div
                id="panel-summary"
                role="tabpanel"
                aria-labelledby="tab-summary"
                hidden={activeTab !== "summary"}
                className="px-6 py-8"
              >
                {summary ? (
                  <div className="space-y-3">
                    <p className="text-xs text-stone-400 dark:text-stone-500">
                      {t.summaryLabel}
                    </p>
                    <MarkdownContent content={summary} compact />
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-sm text-stone-500 dark:text-stone-400 [word-break:keep-all]">
                      {t.summaryEmpty}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
      <ExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        content={{
          memo,
          transcript,
          detailedMinutes,
          summary,
        }}
        meetingTitle={meetingTitle}
        meetingDate={meetingDate}
        audioBase64={
          currentAudioBase64 ??
          (selectedMeetingId ? getMeetingById(selectedMeetingId)?.audio_base64 : undefined)
        }
      />
    </div>
  );
}
