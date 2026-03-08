/**
 * 회의 데이터 Local Storage 저장/조회 (PRD: 브라우저 로컬 저장)
 */
const STORAGE_KEY = "Minemory-AI_meetings";

export type Meeting = {
  id: string;
  title: string;
  created_at: string; // ISO
  date: string; // 회의 일시 (datetime-local value)
  purpose: string;
  attendees: string;
  transcript: string;
  summary: string;
  detailed_minutes: string;
  memo: string;
  /** 녹음 파일 (base64, 해당 회의록에 남김) */
  audio_base64?: string;
};

function load(): Meeting[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function save(meetings: Meeting[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(meetings));
  } catch (e) {
    console.error("Failed to save meetings", e);
  }
}

export function getMeetings(): Meeting[] {
  return load();
}

export function saveMeeting(meeting: Omit<Meeting, "id" | "created_at">): Meeting {
  const list = load();
  const created_at = new Date().toISOString();
  const id = `m_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const newMeeting: Meeting = {
    ...meeting,
    id,
    created_at,
  };
  list.unshift(newMeeting);
  save(list);
  return newMeeting;
}

export function updateMeeting(id: string, meeting: Omit<Meeting, "id" | "created_at">): void {
  const list = load();
  const idx = list.findIndex((m) => m.id === id);
  if (idx === -1) return;
  list[idx] = { ...list[idx], ...meeting };
  save(list);
}

export function deleteMeeting(id: string): void {
  const list = load().filter((m) => m.id !== id);
  save(list);
}

export function getMeetingById(id: string): Meeting | undefined {
  return load().find((m) => m.id === id);
}
