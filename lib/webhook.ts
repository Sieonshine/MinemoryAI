const DEFAULT_WEBHOOK_URL =
  "https://hook.eu1.make.com/jwe1i2hm4lxt7jtc7c6krl81051wjkyj";

export type WebhookPayload = {
  memo: string;
  summary: string;
  minutes: string;
};

/**
 * 메모, 요약, 회의록을 마크다운 형태로 묶은 문자열 생성
 */
export function buildMarkdownDocument(payload: WebhookPayload): string {
  const sections: string[] = [];

  if (payload.memo.trim()) {
    sections.push("# 메모\n\n" + payload.memo.trim());
  }
  if (payload.summary.trim()) {
    sections.push("# 요약\n\n" + payload.summary.trim());
  }
  if (payload.minutes.trim()) {
    sections.push("# 상세 회의록\n\n" + payload.minutes.trim());
  }

  return sections.length > 0 ? sections.join("\n\n---\n\n") : "";
}

/**
 * Make.com 웹훅으로 마크다운 형태 결과 전송
 * - markdown: 통합 마크다운 문서
 * - memo, summary, minutes: 개별 필드(마크다운)
 */
export async function sendToWebhook(payload: WebhookPayload): Promise<void> {
  const url =
    (process.env.NEXT_PUBLIC_MAKE_WEBHOOK_URL as string | undefined) ||
    DEFAULT_WEBHOOK_URL;

  const markdown = buildMarkdownDocument(payload);

  const body = {
    markdown,
    memo: payload.memo.trim() || "",
    summary: payload.summary.trim() || "",
    minutes: payload.minutes.trim() || "",
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`웹훅 전송 실패: ${res.status}`);
  }
}
