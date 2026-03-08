export type Lang = "ko" | "en" | "es";

export const LANG_STORAGE_KEY = "Minemory-AI_lang";

export const LANG_OPTIONS: { lang: Lang; flag: string; short: string; label: string; menuLabel: string }[] = [
  { lang: "ko", flag: "🇰🇷", short: "KR", label: "한국어", menuLabel: "Korean" },
  { lang: "en", flag: "🇺🇸", short: "EN", label: "English", menuLabel: "English" },
  { lang: "es", flag: "🇪🇸", short: "ES", label: "Español", menuLabel: "Español" },
];

export type TranslationKeys = {
  appTitle: string;
  meetingList: string;
  noMeetings: string;
  newMeeting: string;
  startRecordingHint: string;
  openSettings: string;
  closeSettings: string;
  meetingInfo: string;
  meetingTitle: string;
  meetingPurpose: string;
  meetingDate: string;
  attendees: string;
  placeholderTitle: string;
  placeholderPurpose: string;
  placeholderAttendees: string;
  tabTranscript: string;
  tabDetailedMinutes: string;
  tabSummary: string;
  exportMarkdown: string;
  exportRecording: string;
  share: string;
  transcriptEmpty: string;
  detailedEmpty: string;
  summaryLabel: string;
  summaryEmpty: string;
  sidebarClose: string;
  sidebarOpen: string;
  recordStart: string;
  recordStop: string;
  recordingMax: string;
  recordingSaved: string;
  transcribing: string;
  recordNoAudio: string;
  memo: string;
  memoPlaceholder: string;
  memoAutoSave: string;
  memoAria: string;
  memoInputAria: string;
  settingsTitle: string;
  summaryPromptLabel: string;
  minutesPromptLabel: string;
  summaryPromptPlaceholder: string;
  minutesPromptPlaceholder: string;
  resetDefaults: string;
  saveAndClose: string;
  exportSelectHint: string;
  noContent: string;
  cancel: string;
  export: string;
  close: string;
  resultTabsAria: string;
  selectLanguage: string;
  saveMeeting: string;
  saved: string;
  deleteMeeting: string;
  newMeetingButton: string;
}

export const translations: Record<Lang, TranslationKeys> = {
  ko: {
    appTitle: "Minemory AI",
    meetingList: "회의 목록",
    noMeetings: "회의가 없습니다.",
    newMeeting: "새 회의",
    startRecordingHint: "녹음을 시작하고 메모를 작성해 보세요.",
    openSettings: "설정 열기",
    closeSettings: "설정 닫기",
    meetingInfo: "회의 정보 입력",
    meetingTitle: "회의 제목",
    meetingPurpose: "회의 목적",
    meetingDate: "회의 일시",
    attendees: "참석자",
    placeholderTitle: "예: 2026년 1분기 제품 로드맵 검토",
    placeholderPurpose: "예: 1분기 로드맵 및 예산 검토",
    placeholderAttendees: "예: 김팀장, 이대리, 박과장",
    tabTranscript: "Transcript",
    tabDetailedMinutes: "상세 회의록",
    tabSummary: "요약",
    exportMarkdown: "마크다운 형식으로 내보내기",
    exportRecording: "녹음파일 내보내기",
    share: "공유하기",
    transcriptEmpty: "녹음 후 자동으로 음성이 텍스트로 변환됩니다.",
    detailedEmpty: "녹음 후 회의 제목, 논의 내용, 결정 사항, Action Items가 정리됩니다.",
    summaryLabel: "회의 요약 (500자)",
    summaryEmpty: "녹음 후 주요 논의·결정 사항·액션 아이템이 500자로 요약됩니다.",
    sidebarClose: "사이드바 닫기",
    sidebarOpen: "사이드바 열기",
    recordStart: "녹음 시작",
    recordStop: "녹음 종료",
    recordingMax: "녹음 중입니다 (최대 3시간)",
    recordingSaved: "녹음이 저장되었습니다.",
    transcribing: "음성 변환 및 회의록 생성 중…",
    recordNoAudio: "녹음된 오디오가 없습니다. 잠시 녹음한 뒤 다시 종료해 주세요.",
    memo: "메모",
    memoPlaceholder: "회의 중 아이디어, TODO, 질문 등을 자유롭게 적어보세요…",
    memoAutoSave: "메모는 자동으로 저장됩니다.",
    memoAria: "회의 메모",
    memoInputAria: "메모 입력",
    settingsTitle: "AI 프롬프트 설정",
    summaryPromptLabel: "요약 프롬프트",
    minutesPromptLabel: "상세 회의록 프롬프트",
    summaryPromptPlaceholder: "회의 요약 생성에 사용되는 지시문을 입력하세요.",
    minutesPromptPlaceholder: "상세 회의록 생성에 사용되는 지시문을 입력하세요. 마지막에 '전사 내용:'을 두면 그 뒤에 회의 전사가 붙습니다.",
    resetDefaults: "기본값 복원",
    saveAndClose: "저장 후 닫기",
    exportSelectHint: "내보낼 항목을 선택하세요.",
    noContent: "(내용 없음)",
    cancel: "취소",
    export: "내보내기",
    close: "닫기",
    resultTabsAria: "회의 결과 보기",
    selectLanguage: "언어 선택",
    saveMeeting: "회의 저장",
    saved: "저장됨",
    deleteMeeting: "삭제",
    newMeetingButton: "새 회의",
  },
  en: {
    appTitle: "AI Meeting Notes",
    meetingList: "Meeting List",
    noMeetings: "No meetings yet.",
    newMeeting: "New Meeting",
    startRecordingHint: "Start recording and take notes.",
    openSettings: "Open settings",
    closeSettings: "Close settings",
    meetingInfo: "Meeting info",
    meetingTitle: "Meeting title",
    meetingPurpose: "Purpose",
    meetingDate: "Date & time",
    attendees: "Attendees",
    placeholderTitle: "e.g. Q1 2026 product roadmap review",
    placeholderPurpose: "e.g. Roadmap and budget review",
    placeholderAttendees: "e.g. John, Jane, Mike",
    tabTranscript: "Transcript",
    tabDetailedMinutes: "Minutes",
    tabSummary: "Summary",
    exportMarkdown: "Export as Markdown",
    exportRecording: "Export recording",
    share: "Share",
    transcriptEmpty: "Audio will be converted to text after recording.",
    detailedEmpty: "Meeting title, discussion, decisions, and action items will appear here after recording.",
    summaryLabel: "Summary (500 chars)",
    summaryEmpty: "Key discussion, decisions, and action items will be summarized here after recording.",
    sidebarClose: "Close sidebar",
    sidebarOpen: "Open sidebar",
    recordStart: "Start recording",
    recordStop: "Stop recording",
    recordingMax: "Recording (max 3 hours)",
    recordingSaved: "Recording saved.",
    transcribing: "Transcribing and generating notes…",
    recordNoAudio: "No audio recorded. Please record for a moment and stop again.",
    memo: "Memo",
    memoPlaceholder: "Ideas, TODOs, questions during the meeting…",
    memoAutoSave: "Memo is saved automatically.",
    memoAria: "Meeting memo",
    memoInputAria: "Memo input",
    settingsTitle: "AI prompt settings",
    summaryPromptLabel: "Summary prompt",
    minutesPromptLabel: "Minutes prompt",
    summaryPromptPlaceholder: "Instructions for generating the summary.",
    minutesPromptPlaceholder: "Instructions for generating the minutes. Add 'Transcript:' at the end to append the transcript.",
    resetDefaults: "Reset to default",
    saveAndClose: "Save and close",
    exportSelectHint: "Select items to export.",
    noContent: "(no content)",
    cancel: "Cancel",
    export: "Export",
    close: "Close",
    resultTabsAria: "Meeting results",
    selectLanguage: "Select language",
    saveMeeting: "Save meeting",
    saved: "Saved",
    deleteMeeting: "Delete",
    newMeetingButton: "New meeting",
  },
  es: {
    appTitle: "Actas con IA",
    meetingList: "Lista de reuniones",
    noMeetings: "No hay reuniones.",
    newMeeting: "Nueva reunión",
    startRecordingHint: "Inicia la grabación y toma notas.",
    openSettings: "Abrir ajustes",
    closeSettings: "Cerrar ajustes",
    meetingInfo: "Datos de la reunión",
    meetingTitle: "Título",
    meetingPurpose: "Objetivo",
    meetingDate: "Fecha y hora",
    attendees: "Asistentes",
    placeholderTitle: "ej. Revisión del plan Q1 2026",
    placeholderPurpose: "ej. Revisión de plan y presupuesto",
    placeholderAttendees: "ej. Ana, Luis, María",
    tabTranscript: "Transcripción",
    tabDetailedMinutes: "Actas",
    tabSummary: "Resumen",
    exportMarkdown: "Exportar en Markdown",
    exportRecording: "Exportar grabación",
    share: "Compartir",
    transcriptEmpty: "El audio se convertirá en texto tras grabar.",
    detailedEmpty: "Tras grabar aparecerán título, debate, decisiones y acciones.",
    summaryLabel: "Resumen (500 caracteres)",
    summaryEmpty: "Tras grabar se mostrará un resumen de lo tratado y las acciones.",
    sidebarClose: "Cerrar barra lateral",
    sidebarOpen: "Abrir barra lateral",
    recordStart: "Iniciar grabación",
    recordStop: "Detener grabación",
    recordingMax: "Grabando (máx. 3 horas)",
    recordingSaved: "Grabación guardada.",
    transcribing: "Transcribiendo y generando actas…",
    recordNoAudio: "No hay audio. Graba un momento y detén de nuevo.",
    memo: "Notas",
    memoPlaceholder: "Ideas, tareas, preguntas durante la reunión…",
    memoAutoSave: "Las notas se guardan solas.",
    memoAria: "Notas de la reunión",
    memoInputAria: "Escribir notas",
    settingsTitle: "Ajustes de prompts IA",
    summaryPromptLabel: "Prompt de resumen",
    minutesPromptLabel: "Prompt de actas",
    summaryPromptPlaceholder: "Instrucciones para el resumen.",
    minutesPromptPlaceholder: "Instrucciones para las actas. Añade 'Transcripción:' al final para añadir el texto.",
    resetDefaults: "Restaurar por defecto",
    saveAndClose: "Guardar y cerrar",
    exportSelectHint: "Elige qué exportar.",
    noContent: "(sin contenido)",
    cancel: "Cancelar",
    export: "Exportar",
    close: "Cerrar",
    resultTabsAria: "Resultados de la reunión",
    selectLanguage: "Seleccionar idioma",
    saveMeeting: "Guardar reunión",
    saved: "Guardado",
    deleteMeeting: "Eliminar",
    newMeetingButton: "Nueva reunión",
  },
};
