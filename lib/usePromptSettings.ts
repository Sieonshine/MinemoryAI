"use client";

import { useState, useCallback, useEffect } from "react";
import {
  DEFAULT_SUMMARY_PROMPT,
  DEFAULT_MINUTES_PROMPT,
  PROMPT_STORAGE_KEYS,
} from "@/lib/prompts";

export type PromptSettings = {
  summaryPrompt: string;
  minutesPrompt: string;
};

function getStoredSummary(): string {
  if (typeof window === "undefined") return DEFAULT_SUMMARY_PROMPT;
  const v = localStorage.getItem(PROMPT_STORAGE_KEYS.summary);
  return v ?? DEFAULT_SUMMARY_PROMPT;
}

function getStoredMinutes(): string {
  if (typeof window === "undefined") return DEFAULT_MINUTES_PROMPT;
  const v = localStorage.getItem(PROMPT_STORAGE_KEYS.minutes);
  return v ?? DEFAULT_MINUTES_PROMPT;
}

export function usePromptSettings() {
  const [summaryPrompt, setSummaryPrompt] = useState(DEFAULT_SUMMARY_PROMPT);
  const [minutesPrompt, setMinutesPrompt] = useState(DEFAULT_MINUTES_PROMPT);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setSummaryPrompt(getStoredSummary());
    setMinutesPrompt(getStoredMinutes());
    setMounted(true);
  }, []);

  const saveSummary = useCallback((value: string) => {
    setSummaryPrompt(value);
    if (typeof window !== "undefined") {
      localStorage.setItem(PROMPT_STORAGE_KEYS.summary, value);
    }
  }, []);

  const saveMinutes = useCallback((value: string) => {
    setMinutesPrompt(value);
    if (typeof window !== "undefined") {
      localStorage.setItem(PROMPT_STORAGE_KEYS.minutes, value);
    }
  }, []);

  const resetToDefaults = useCallback(() => {
    setSummaryPrompt(DEFAULT_SUMMARY_PROMPT);
    setMinutesPrompt(DEFAULT_MINUTES_PROMPT);
    if (typeof window !== "undefined") {
      localStorage.setItem(PROMPT_STORAGE_KEYS.summary, DEFAULT_SUMMARY_PROMPT);
      localStorage.setItem(PROMPT_STORAGE_KEYS.minutes, DEFAULT_MINUTES_PROMPT);
    }
  }, []);

  return {
    summaryPrompt: mounted ? summaryPrompt : DEFAULT_SUMMARY_PROMPT,
    minutesPrompt: mounted ? minutesPrompt : DEFAULT_MINUTES_PROMPT,
    saveSummary,
    saveMinutes,
    resetToDefaults,
    mounted,
  };
}

/** 전사 API 호출 시 사용할 현재 저장된 프롬프트 (클라이언트 전용) */
export function getPromptsForApi(): PromptSettings {
  return {
    summaryPrompt: getStoredSummary(),
    minutesPrompt: getStoredMinutes(),
  };
}
