"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { getPromptsForApi } from "@/lib/usePromptSettings";
import { useLanguage } from "@/contexts/LanguageContext";

const MAX_DURATION_SEC = 3 * 60 * 60; // 3시간
const WAVE_COLOR = "#ef4444"; // red-500
const WAVE_COLOR_DARK = "#f87171"; // red-400

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export type MeetingResult = {
  transcript: string;
  summary: string;
  detailedMinutes: string;
};

function blobFromBase64(base64: string, mimeType: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mimeType });
}

/** 브라우저 실시간 음성 인식 (Web Speech API) */
function getSpeechRecognition(): typeof window.SpeechRecognition | null {
  if (typeof window === "undefined") return null;
  return (
    window.SpeechRecognition ||
    (window as unknown as { webkitSpeechRecognition?: typeof window.SpeechRecognition })
      .webkitSpeechRecognition ||
    null
  );
}

type RecordingControlProps = {
  onResult?: (result: MeetingResult) => void;
  /** 녹음 완료 시 base64로 전달 (회의 저장 시 사용) */
  onAudioBase64?: (base64: string) => void;
  /** 저장된 회의의 녹음(base64) — 불러올 때 재생용 */
  initialAudioBase64?: string | null;
  /** 녹음 중 실시간 전사 텍스트 (Web Speech API) */
  onLiveTranscript?: (text: string) => void;
};

export default function RecordingControl({
  onResult,
  onAudioBase64,
  initialAudioBase64,
  onLiveTranscript,
}: RecordingControlProps) {
  const { t } = useLanguage();
  const [status, setStatus] = useState<"idle" | "recording" | "error">("idle");
  const [elapsedSec, setElapsedSec] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcribeStatus, setTranscribeStatus] = useState<
    "idle" | "loading" | "done" | "error"
  >("idle");

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const liveTranscriptRef = useRef("");
  const recognitionRef = useRef<InstanceType<NonNullable<typeof window.SpeechRecognition>> | null>(null);

  // 저장된 회의의 녹음 복원
  useEffect(() => {
    if (!initialAudioBase64?.trim()) {
      setAudioUrl(null);
      return;
    }
    const mime = "audio/webm";
    try {
      const blob = blobFromBase64(initialAudioBase64, mime);
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      return () => URL.revokeObjectURL(url);
    } catch {
      setAudioUrl(null);
    }
  }, [initialAudioBase64]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stopWaveform = useCallback(() => {
    if (animationRef.current != null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    dataArrayRef.current = null;
  }, []);

  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;
    if (!canvas || !analyser || !dataArray) {
      animationRef.current = requestAnimationFrame(drawWaveform);
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (width === 0 || height === 0) {
      animationRef.current = requestAnimationFrame(drawWaveform);
      return;
    }

    // 캔버스 크기를 표시 영역에 맞춤 (고해상도)
    const dpr = window.devicePixelRatio ?? 1;
    if (canvas.width !== Math.floor(width * dpr)) {
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    const centerY = height / 2;
    const step = width / dataArray.length;

    ctx.clearRect(0, 0, width, height);
    analyser.getByteTimeDomainData(dataArray);

    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = document.documentElement.classList.contains("dark")
      ? WAVE_COLOR_DARK
      : WAVE_COLOR;

    for (let i = 0; i < dataArray.length; i++) {
      const x = i * step;
      const y = ((dataArray[i] - 128) / 128) * (height / 2);
      if (i === 0) ctx.moveTo(x, centerY + y);
      else ctx.lineTo(x, centerY + y);
    }
    ctx.stroke();

    animationRef.current = requestAnimationFrame(drawWaveform);
  }, []);

  const startRecording = useCallback(async () => {
    setErrorMessage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "video/webm";
      const recorder = new MediaRecorder(stream, { mimeType });
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        recorderRef.current = null;

        if (blob.size === 0) {
          setTranscribeStatus("error");
          setErrorMessage(t.recordNoAudio);
          return;
        }

        setTranscribeStatus("loading");
        setErrorMessage(null);
        const { summaryPrompt, minutesPrompt } = getPromptsForApi();
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = reader.result as string;
            resolve(dataUrl.split(",")[1] ?? "");
          };
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(blob);
        });
        onAudioBase64?.(base64);
        fetch("/api/transcribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            audio: base64,
            summaryPrompt,
            minutesPrompt,
          }),
        })
          .then((r) => {
            if (!r.ok) {
              return r
                .json()
                .then((d: { error?: string }) =>
                  Promise.reject(new Error(d.error ?? "변환 실패")),
                );
            }
            return r.json();
          })
          .then(
            (data: {
              text?: string;
              summary?: string;
              detailedMinutes?: string;
            }) => {
              const result: MeetingResult = {
                transcript: data.text ?? "",
                summary: data.summary ?? "",
                detailedMinutes: data.detailedMinutes ?? "",
              };
              onResult?.(result);
              setTranscribeStatus("done");
            },
          )
          .catch((err) => {
            setTranscribeStatus("error");
            setErrorMessage(
              err instanceof Error ? err.message : "음성 변환에 실패했습니다.",
            );
          });
      };

      recorder.start(1000);

      // Web Audio API: 실시간 웨이브용
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.7;
      source.connect(analyser);
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      dataArrayRef.current = new Uint8Array(analyser.fftSize);
      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      setStatus("recording");
      setElapsedSec(0);
      timerRef.current = setInterval(() => {
        setElapsedSec((prev) => {
          if (prev + 1 >= MAX_DURATION_SEC) {
            stopTimer();
            stopRecording();
            return MAX_DURATION_SEC;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "마이크 접근 권한을 허용해 주세요.",
      );
    }
  }, [stopTimer, onResult]);

  const stopRecording = useCallback(() => {
    stopTimer();
    stopWaveform();
    const rec = recorderRef.current;
    if (rec && rec.state !== "inactive") {
      rec.stop();
    }
    setStatus("idle");
  }, [stopTimer, stopWaveform]);

  // 녹음 중일 때만 웨이브 그리기 루프 시작
  useEffect(() => {
    if (status === "recording" && analyserRef.current && canvasRef.current) {
      animationRef.current = requestAnimationFrame(drawWaveform);
    }
    return () => {
      if (animationRef.current != null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [status, drawWaveform]);

  useEffect(() => {
    return () => {
      stopTimer();
      stopWaveform();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [stopTimer, stopWaveform, audioUrl]);

  return (
    <div className="rounded-lg border border-stone-200 bg-white px-4 py-6 dark:border-stone-700 dark:bg-stone-900">
      <div className="flex flex-col items-center gap-4">
        {/* 타이머 - mm:ss (위) */}
        <div
          className="font-mono text-2xl tabular-nums text-stone-800 dark:text-stone-100"
          aria-live="polite"
        >
          {formatTime(elapsedSec)}
        </div>

        {/* 버튼 (아래) */}
        <div className="flex items-center justify-center">
          {status !== "recording" ? (
            <button
              type="button"
              onClick={startRecording}
              className="flex items-center gap-2 rounded-full bg-red-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-900"
              aria-label={t.recordStart}
            >
              <span className="h-3 w-3 rounded-full bg-white" aria-hidden />
              {t.recordStart}
            </button>
          ) : (
            <button
              type="button"
              onClick={stopRecording}
              className="flex items-center gap-2 rounded-full bg-stone-700 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-stone-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-500 focus-visible:ring-offset-2 dark:bg-stone-600 dark:hover:bg-stone-700 dark:focus-visible:ring-offset-stone-900"
              aria-label={t.recordStop}
            >
              <span
                className="h-3 w-3 animate-pulse rounded-full bg-red-400"
                aria-hidden
              />
              {t.recordStop}
            </button>
          )}
        </div>
      </div>

      {/* 녹음 중 웨이브 */}
      {status === "recording" && (
        <div className="mt-4 w-full">
          <canvas
            ref={canvasRef}
            className="h-20 w-full rounded-md bg-stone-100 dark:bg-stone-800"
            style={{ width: "100%", height: "80px" }}
            aria-label="음성 입력 레벨"
          />
          <p className="mt-2 text-center text-sm font-medium text-red-600 dark:text-red-400">
            {t.recordingMax}
          </p>
        </div>
      )}

      {/* 에러 메시지 */}
      {status === "error" && errorMessage && (
        <p className="mt-3 text-center text-sm text-red-600 dark:text-red-400">
          {errorMessage}
        </p>
      )}

      {/* 음성 → 텍스트·요약·회의록 생성 중 */}
      {transcribeStatus === "loading" && (
        <p className="mt-3 text-center text-sm text-amber-600 dark:text-amber-400">
          {t.transcribing}
        </p>
      )}

      {/* 전사(음성→텍스트) 실패 시 에러 표시 */}
      {transcribeStatus === "error" && errorMessage && (
        <p className="mt-3 text-center text-sm text-red-600 dark:text-red-400">
          {errorMessage}
        </p>
      )}

      {/* 녹음 완료 후 재생 */}
      {audioUrl && status === "idle" && (
        <div className="mt-4 border-t border-stone-200 pt-4 dark:border-stone-700">
          <p className="mb-2 text-center text-sm text-stone-600 dark:text-stone-400">
            {t.recordingSaved}
          </p>
          <audio
            src={audioUrl}
            controls
            className="mx-auto max-w-full"
            preload="metadata"
          />
        </div>
      )}
    </div>
  );
}
