"use client";

/**
 * ChatComposer — the input area at the bottom of the chat screen.
 *
 * Two modes:
 *   - `mode="existing"` (default) — `conversationId` is required; sends
 *     to the existing chat via `useChatComposer`.
 *   - `mode="new"` — `conversationId` is NOT provided. The composer
 *     uses `useChatNewComposer`, which creates a conversation on send
 *     and calls `onCreated(convId)` so the parent can update the URL.
 *
 * The Stop button is shown when a stream is in flight; the Send button
 * is shown otherwise.
 */

import {
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { FiMic, FiMicOff, FiSend } from "react-icons/fi";

import { useChatComposer, useChatNewComposer } from "@/hooks/useChatComposer";
import type { UseChatStreamReturn } from "@/hooks/useChatStream";
import type { ChatMessage } from "@/types/chat";
import type { StreamEvent } from "@/lib/chatEvents";

interface BaseProps {
  /** Optional placeholder override. */
  placeholder?: string;
  /** Optional hint text shown below the input. */
  hint?: string;
  /** Widen the input column to match a wider chat layout. */
  wide?: boolean;
  /** Called when a new user message is sent (for optimistic UI). */
  onUserMessage: (msg: ChatMessage) => void;
  /** Called on every streaming content update. */
  onAssistantContent: (content: string) => void;
  /** Called when the stream finishes (`done` event). */
  onStreamDone?: (ev: Extract<StreamEvent, { type: "done" }>) => void;
  /** Called on a stream error. */
  onStreamError?: (ev: Extract<StreamEvent, { type: "error" }>) => void;
  /** Optional pre-built stream. When provided, the composer uses it
   *  instead of creating its own. The parent (e.g. `ChatShell`)
   *  passes its own `useChatStream` instance so the rest of the shell
   *  (status pill, steps panel, Stop button) shares the same stream
   *  state. The new-mode composer ignores this prop (it has its own
   *  stream with a `"pending"` sentinel id). */
  stream?: UseChatStreamReturn;
}

interface ExistingProps extends BaseProps {
  mode?: "existing";
  conversationId: string;
}

interface NewProps extends BaseProps {
  mode: "new";
  /** Optional workflow to bind to the new conversation. */
  workflowId?: string | null;
  /** Called once the server creates the conversation. The parent
   *  should use this to navigate to `/chats/{conversationId}`. */
  onCreated: (conversationId: string) => void;
  /** Optional controlled value for the textarea. Use this to fill
   *  the composer from a parent (e.g. clicking a suggested prompt). */
  controlledValue?: string;
  onValueChange?: (next: string) => void;
  /** Notifies the parent of stream status changes so the empty state
   *  can show a streaming indicator above the composer. */
  onStreamStatusChange?: (status: { isStreaming: boolean; content: string }) => void;
}

type ChatComposerProps = ExistingProps | NewProps;

export default function ChatComposer(props: ChatComposerProps) {
  if (props.mode === "new") {
    return <NewChatComposerInner {...props} />;
  }
  return <ExistingChatComposerInner {...(props as ExistingProps)} />;
}

function ExistingChatComposerInner({
  conversationId,
  onUserMessage,
  onAssistantContent,
  onStreamDone,
  onStreamError,
  placeholder = "Message your AI assistant…",
  hint,
  wide = false,
  stream: externalStream,
}: ExistingProps) {
  const composer = useChatComposer({
    conversationId,
    onUserMessage,
    onAssistantContent,
    onStreamDone,
    onStreamError,
    stream: externalStream,
  });
  const { value, setValue, onChange, onKeyDown, submit, canSend, textareaRef, stream } =
    composer;
  const formRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    setValue("");
  }, [conversationId, setValue]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (stream.isStreaming) return;
    void submit();
  };

  return (
    <ComposerBody
      formRef={formRef}
      textareaRef={textareaRef}
      value={value}
      setValue={setValue}
      onChange={onChange}
      onKeyDown={onKeyDown}
      onSubmit={onSubmit}
      canSend={canSend}
      isStreaming={stream.isStreaming}
      placeholder={placeholder}
      hint={hint}
      wide={wide}
    />
  );
}

function NewChatComposerInner({
  workflowId,
  onCreated,
  onUserMessage,
  onAssistantContent,
  onStreamDone,
  onStreamError,
  placeholder = "Message your AI assistant…",
  hint,
  wide = false,
  controlledValue,
  onValueChange,
  onStreamStatusChange,
}: NewProps) {
  const composer = useChatNewComposer({
    workflowId: workflowId ?? null,
    onCreated,
    onUserMessage,
    onAssistantContent,
    onStreamDone,
    onStreamError,
    controlledValue,
    onValueChange,
    onStreamStatusChange,
  });
  const { value, setValue, onChange, onKeyDown, submit, canSend, textareaRef, stream } =
    composer;
  const formRef = useRef<HTMLFormElement | null>(null);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (stream.isStreaming) return;
    void submit();
  };

  return (
    <ComposerBody
      formRef={formRef}
      textareaRef={textareaRef}
      value={value}
      setValue={setValue}
      onChange={onChange}
      onKeyDown={onKeyDown}
      onSubmit={onSubmit}
      canSend={canSend}
      isStreaming={stream.isStreaming}
      placeholder={placeholder}
      hint={hint}
      wide={wide}
    />
  );
}

interface ComposerBodyProps {
  formRef: React.RefObject<HTMLFormElement | null>;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  value: string;
  setValue: (next: string) => void;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: FormEvent) => void;
  canSend: boolean;
  isStreaming: boolean;
  placeholder: string;
  wide?: boolean;
  hint: string | undefined;
}

function ComposerBody({
  formRef,
  textareaRef,
  value,
  setValue,
  onChange,
  onKeyDown,
  onSubmit,
  canSend,
  isStreaming,
  placeholder,
  hint,
  wide = false,
}: ComposerBodyProps) {
  // Web Speech API — SpeechRecognition is non-standard, hence the
  // vendor-prefixed lookup and the feature gate. If the browser doesn't
  // expose it (Firefox today), we hide the mic button instead of
  // rendering a dead control. The types live in lib.dom.d.ts under
  // historical names; we declare a minimal structural type so we don't
  // pull in @types/dom-speech-recognition.
  interface SpeechRecognitionLike {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onresult: ((ev: SpeechRecognitionEventLike) => void) | null;
    onerror: ((ev: { error?: string }) => void) | null;
    onend: (() => void) | null;
    start: () => void;
    stop: () => void;
    abort: () => void;
  }
  interface SpeechRecognitionEventLike {
    resultIndex: number;
    results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>;
  }
  type SRConstructor = new () => SpeechRecognitionLike;

  const SpeechRecognitionImpl: SRConstructor | null =
    typeof window !== "undefined"
      ? ((window as unknown as { SpeechRecognition?: SRConstructor }).SpeechRecognition ??
        (window as unknown as { webkitSpeechRecognition?: SRConstructor }).webkitSpeechRecognition ??
        null)
      : null;

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [sttError, setSttError] = useState<string | null>(null);
  const supported = SpeechRecognitionImpl !== null;

  // Keep the latest value/setValue in refs so the recognition
  // callbacks (which fire async from the browser) always see the
  // current composer state without re-creating the recognition
  // instance on every keystroke.
  const valueRef = useRef(value);
  const setValueRef = useRef(setValue);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);
  useEffect(() => {
    setValueRef.current = setValue;
  }, [setValue]);

  // Stop the recognizer if a stream starts — otherwise the mic stays
  // hot and bleeds audio into the browser after the user has moved on.
  // We don't setState here: `onend` will flip isListening=false once
  // the recognizer reports it stopped, which keeps the effect side-
  // effect-free of cascading renders.
  useEffect(() => {
    if (!isStreaming) return;
    const r = recognitionRef.current;
    if (r) {
      try {
        r.stop();
      } catch {
        /* ponytail: swallow — recognizer may already be stopped */
      }
    }
  }, [isStreaming]);

  useEffect(() => {
    return () => {
      const r = recognitionRef.current;
      if (r) {
        try {
          r.abort();
        } catch {
          /* ponytail: swallow */
        }
      }
    };
  }, []);

  const toggleListening = useCallback(() => {
    if (!SpeechRecognitionImpl) return;
    const existing = recognitionRef.current;
    if (existing) {
      try {
        existing.stop();
      } catch {
        /* ponytail: swallow */
      }
      recognitionRef.current = null;
      setIsListening(false);
      return;
    }
    const r = new SpeechRecognitionImpl();
    r.continuous = true;
    r.interimResults = true;
    r.lang = typeof navigator !== "undefined" ? navigator.language : "en-US";
    r.onresult = (e: SpeechRecognitionEventLike) => {
      let finalText = "";
      let interimText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        const transcript = result[0]?.transcript ?? "";
        if (result.isFinal) finalText += transcript;
        else interimText += transcript;
      }
      if (finalText) {
        const next = (valueRef.current ? valueRef.current + " " : "") + finalText.trim();
        setValueRef.current(next);
      } else if (interimText) {
        // Show interim text in the textarea without committing it
        // to `value` (the next final result will overwrite).
        const ta = textareaRef.current;
        if (ta) {
          ta.placeholder = interimText;
        }
      }
    };
    r.onerror = (e: { error?: string }) => {
      setSttError(e?.error ?? "speech recognition error");
      setIsListening(false);
      recognitionRef.current = null;
    };
    r.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
      // Clear the interim-text placeholder trick on end.
      const ta = textareaRef.current;
      if (ta) ta.placeholder = placeholder;
    };
    try {
      r.start();
      recognitionRef.current = r;
      setIsListening(true);
      setSttError(null);
    } catch {
      setSttError("failed to start microphone");
      recognitionRef.current = null;
    }
  }, [SpeechRecognitionImpl, textareaRef, placeholder]);

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      className="border-t border-[var(--ink)] bg-[var(--paper-2)] px-3 py-4 lg:px-6"
    >
      <div className={`mx-auto ${wide ? "max-w-[1000px]" : "max-w-[720px]"}`}>
        <div className="flex items-end gap-2 border border-[var(--ink)] bg-[var(--paper)] p-2 focus-within:border-[var(--accent)]">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={onChange}
            onKeyDown={onKeyDown}
            placeholder={isListening ? "Listening…" : placeholder}
            rows={1}
            className="block max-h-[200px] min-h-[36px] flex-1 resize-none border-0 bg-transparent px-1 py-2 text-[14px] leading-relaxed text-[var(--ink)] placeholder:text-[var(--graphite)] focus:outline-none"
            disabled={isStreaming}
            style={{ height: "36px" }}
          />
          {supported && !isStreaming ? (
            <button
              type="button"
              onClick={toggleListening}
              aria-label={isListening ? "Stop dictation" : "Dictate with microphone"}
              aria-pressed={isListening}
              title={isListening ? "Stop dictation" : "Dictate with microphone"}
              className={`mono flex h-9 shrink-0 items-center gap-2 border px-3 text-[10px] font-semibold uppercase tracking-[0.2em] transition-colors ${
                isListening
                  ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--paper)] animate-pulse-dot"
                  : "border-[var(--rule-soft)] bg-[var(--paper-2)] text-[var(--graphite)] hover:border-[var(--ink)] hover:text-[var(--ink)]"
              }`}
            >
              {isListening ? (
                <FiMicOff className="h-3.5 w-3.5" />
              ) : (
                <FiMic className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline">{isListening ? "Stop" : "Voice"}</span>
            </button>
          ) : null}
          {isStreaming ? (
            <span
              aria-label="Streaming"
              className="mono flex h-9 shrink-0 items-center gap-2 border border-[var(--rule-soft)] bg-[var(--paper-2)] px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--graphite)]"
            >
              <span className="inline-block h-1.5 w-1.5 animate-pulse-dot rounded-full bg-[var(--ok)]" />
              <span className="hidden sm:inline">Streaming</span>
            </span>
          ) : (
            <button
              type="submit"
              disabled={!canSend}
              aria-label="Send (Enter)"
              className="mono flex h-9 shrink-0 items-center gap-2 border border-[var(--ink)] bg-[var(--ink)] px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--paper)] transition-colors hover:bg-[var(--accent)] disabled:opacity-50"
            >
              <FiSend className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Send</span>
            </button>
          )}
        </div>
        <div className="mono mt-2 flex items-center justify-between px-1 text-[9.5px] uppercase tracking-[0.2em] text-[var(--graphite)]">
          <span>
            {isListening
              ? "Listening — speak now, click mic again to stop"
              : sttError
                ? `Voice unavailable: ${sttError}`
                : "Enter to send · Shift + Enter for new line"}
          </span>
        </div>
      </div>
    </form>
  );
}
