import type { NextApiRequest, NextApiResponse } from "next";
import {
  DEFAULT_SUMMARY_PROMPT,
  DEFAULT_MINUTES_PROMPT,
} from "@/lib/prompts";

const ASSEMBLYAI_BASE = "https://api.assemblyai.com/v2";

function getRawBody(req: NextApiRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

type TranscriptWord = {
  text: string;
  start: number;
  end: number;
  speaker?: string | null;
};

type TranscriptResponse = {
  id: string;
  status: string;
  text?: string;
  summary?: string;
  error?: string;
  words?: TranscriptWord[];
};

/** ms → "MM:SS" */
function formatTimestamp(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

type SpeakerSegment = { startMs: number; speaker: string | null; texts: string[] };

/** 화자가 바뀔 때마다 [MM:SS] (화자 A) 형식으로 묶기. speaker 없으면 5초 구간 폴백 */
function buildTimestampedTranscript(words: TranscriptWord[]): string {
  if (!words.length) return "";
  const hasSpeaker = words.some((w) => w.speaker != null && w.speaker !== "");
  if (hasSpeaker) {
    const segments: SpeakerSegment[] = [];
    let current: SpeakerSegment | null = null;
    for (const w of words) {
      const sp = w.speaker ?? null;
      if (current === null || current.speaker !== sp) {
        current = { startMs: w.start, speaker: sp, texts: [w.text] };
        segments.push(current);
      } else {
        current.texts.push(w.text);
      }
    }
    return segments
      .map((seg) => `[${formatTimestamp(seg.startMs)}] ${seg.texts.join(" ")}`)
      .join("\n");
  }
  const intervalMs = 5000;
  const byInterval = new Map<number, string[]>();
  for (const w of words) {
    const segStart = Math.floor(w.start / intervalMs) * intervalMs;
    if (!byInterval.has(segStart)) byInterval.set(segStart, []);
    byInterval.get(segStart)!.push(w.text);
  }
  return Array.from(byInterval.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([startMs, texts]) => `[${formatTimestamp(startMs)}] ${texts.join(" ")}`)
    .join("\n");
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{
    text?: string;
    summary?: string;
    detailedMinutes?: string;
    error?: string;
  }>,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ASSEMBLYAI_API_KEY;
  if (!apiKey) {
    return res
      .status(500)
      .json({ error: "ASSEMBLYAI_API_KEY가 설정되지 않았습니다." });
  }

  try {
    const rawBody = await getRawBody(req);
    if (rawBody.length === 0) {
      return res.status(400).json({ error: "오디오 데이터가 없습니다." });
    }

    let buffer: Buffer;
    let summaryPrompt = DEFAULT_SUMMARY_PROMPT;
    let minutesPrompt = DEFAULT_MINUTES_PROMPT;

    const contentType = req.headers["content-type"] ?? "";
    if (contentType.includes("application/json")) {
      try {
        const body = JSON.parse(rawBody.toString("utf8")) as {
          audio?: string;
          summaryPrompt?: string;
          minutesPrompt?: string;
        };
        if (!body.audio || typeof body.audio !== "string") {
          return res.status(400).json({ error: "오디오 데이터(audio)가 없습니다." });
        }
        buffer = Buffer.from(body.audio, "base64");
        if (body.summaryPrompt != null) summaryPrompt = String(body.summaryPrompt);
        if (body.minutesPrompt != null) minutesPrompt = String(body.minutesPrompt);
      } catch {
        return res.status(400).json({ error: "JSON 본문이 올바르지 않습니다." });
      }
    } else {
      buffer = rawBody;
    }

    const headers: Record<string, string> = {
      Authorization: apiKey,
    };

    // 1. Assembly AI에 오디오 업로드
    const uploadRes = await fetch(`${ASSEMBLYAI_BASE}/upload`, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/octet-stream",
      },
      body: new Uint8Array(buffer),
    });

    if (!uploadRes.ok) {
      let errMessage = "오디오 업로드에 실패했습니다.";
      const errText = await uploadRes.text();
      if (errText) {
        console.error("Assembly AI upload error:", errText);
        try {
          const errBody = JSON.parse(errText) as { error?: string };
          if (errBody.error) errMessage = errBody.error;
        } catch {
          // errText가 JSON이 아니면 기본 메시지 유지
        }
      }
      return res.status(uploadRes.status).json({ error: errMessage });
    }

    const { upload_url } = (await uploadRes.json()) as { upload_url: string };
    if (!upload_url) {
      return res.status(500).json({ error: "업로드 URL을 받지 못했습니다." });
    }

    // 2. 전사(transcript) 생성 (한국어; summarization은 한국어 미지원이라 비활성화)
    const createRes = await fetch(`${ASSEMBLYAI_BASE}/transcript`, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        audio_url: upload_url,
        language_code: "ko",
        speech_models: ["universal-2"],
        speaker_labels: true,
      }),
    });

    if (!createRes.ok) {
      let errMessage = "전사 작업 생성에 실패했습니다.";
      const errText = await createRes.text();
      if (errText) {
        console.error("Assembly AI create transcript error:", errText);
        try {
          const errBody = JSON.parse(errText) as { error?: string };
          if (errBody.error) errMessage = errBody.error;
        } catch {
          // errText가 JSON이 아니면 기본 메시지 유지
        }
      }
      return res.status(createRes.status).json({ error: errMessage });
    }

    const transcript = (await createRes.json()) as TranscriptResponse;
    const transcriptId = transcript.id;
    if (!transcriptId) {
      return res.status(500).json({ error: "전사 ID를 받지 못했습니다." });
    }

    // 3. 완료될 때까지 폴링
    const pollUrl = `${ASSEMBLYAI_BASE}/transcript/${transcriptId}`;
    let result: TranscriptResponse = transcript;

    while (result.status !== "completed" && result.status !== "error") {
      await new Promise((r) => setTimeout(r, 3000));
      const pollRes = await fetch(pollUrl, { headers: { ...headers } });
      if (!pollRes.ok) {
        return res.status(pollRes.status).json({
          error: "전사 상태 조회에 실패했습니다.",
        });
      }
      result = (await pollRes.json()) as TranscriptResponse;
    }

    if (result.status === "error") {
      return res.status(500).json({
        error: result.error ?? "전사 처리 중 오류가 발생했습니다.",
      });
    }

    // 시간이 기록된 transcript: words가 있으면 구간별 [MM:SS] 붙임
    const plainText = result.text ?? "";
    const transcriptText =
      result.words && result.words.length > 0
        ? buildTimestampedTranscript(result.words)
        : plainText;
    let summary = result.summary ?? "";

    // 4. 요약·상세 회의록 생성 (OpenAI GPT) — 타임스탬프 없는 원문 사용
    let detailedMinutes = "";
    if (plainText.length > 0) {
      const openaiKey = process.env.OPENAI_API_KEY;
      if (!openaiKey) {
        return res.status(500).json({
          error:
            "OPENAI_API_KEY가 설정되지 않았습니다. .env.local에 OpenAI API 키를 추가해 주세요.",
        });
      }

      const openaiHeaders = {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      };
      const openaiUrl = "https://api.openai.com/v1/chat/completions";

      // 4-1. 요약 (500자, 보고서체: ~함, ~임, 마침)
      if (!summary) {
        try {
          const summaryContent = `${summaryPrompt}\n\n전사 내용:\n${plainText}`;
          const summaryRes = await fetch(openaiUrl, {
            method: "POST",
            headers: openaiHeaders,
            body: JSON.stringify({
              model: "gpt-4o-mini",
              messages: [{ role: "user", content: summaryContent }],
              max_tokens: 500,
            }),
          });
          if (summaryRes.ok) {
            const data = (await summaryRes.json()) as {
              choices?: Array<{ message?: { content?: string } }>;
            };
            summary = (data.choices?.[0]?.message?.content?.trim() ?? "").slice(
              0,
              500,
            );
          } else {
            const errBody = await summaryRes.text();
            console.error("OpenAI summary error:", summaryRes.status, errBody);
          }
        } catch (e) {
          console.error("OpenAI summary error:", e);
        }
      }

      // 4-2. 상세 회의록
      try {
        const minutesContent = `${minutesPrompt}${plainText}`;
        const llmRes = await fetch(openaiUrl, {
          method: "POST",
          headers: openaiHeaders,
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: "system", content: minutesContent }],
            max_tokens: 2000,
          }),
        });

        if (llmRes.ok) {
          const llmData = (await llmRes.json()) as {
            choices?: Array<{ message?: { content?: string } }>;
          };
          detailedMinutes =
            llmData.choices?.[0]?.message?.content?.trim() ?? "";
        } else {
          const errBody = await llmRes.text();
          console.error(
            "OpenAI detailed minutes error:",
            llmRes.status,
            errBody,
          );
        }
      } catch (llmErr) {
        console.error("OpenAI detailed minutes error:", llmErr);
      }
    }

    return res.status(200).json({
      text: transcriptText,
      summary,
      detailedMinutes: detailedMinutes || undefined,
    });
  } catch (e) {
    console.error("Transcribe API error:", e);
    return res.status(500).json({
      error: e instanceof Error ? e.message : "서버 오류가 발생했습니다.",
    });
  }
}
