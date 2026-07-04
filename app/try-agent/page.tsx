'use client';

import { Children, isValidElement } from 'react';
import { useState, useEffect, useRef, useMemo } from 'react';
import AppHeader from '@/components/app-shell/AppHeader';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import api from '@/lib/axios';

interface Agent {
  name: string;
  description: string;
  tools: string[];
}

interface GraphResp {
  nodes: string[];
  edges: [string, string][];
}

interface QueryResp {
  response: string;
  thread_id: string;
  timestamp: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface HistoryResp {
  thread_id: string;
  messages: Message[];
}

const THREAD_STORAGE_KEY = 'orkaive.tryagent.thread';

export default function TryAgentPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [graph, setGraph] = useState<{
    nodes: string[];
    edges: [string, string][];
  } | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<unknown>(null);

  useEffect(() => {
    (async () => {
      try {
      const [agentsRes, graphRes] = await Promise.all([
        api.get<Agent[]>('/agents'),
        api.get<GraphResp>('/graph'),
      ]);
      setAgents(agentsRes.data);
      setGraph(graphRes.data);
    } catch (err) {
      console.error('Failed to load agents/graph', err);
    }
    })();

    if (
      typeof window !== 'undefined' &&
      'webkitSpeechRecognition' in window
    ) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
    }
  }, []);

  // Load prior history once on mount. thread_id is read from / written to
  // localStorage so the same thread resumes across reloads.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let tid = window.localStorage.getItem(THREAD_STORAGE_KEY);
    if (!tid) {
      tid = crypto.randomUUID();
      window.localStorage.setItem(THREAD_STORAGE_KEY, tid);
    }
    setThreadId(tid);
    (async () => {
      try {
        const { data } = await api.get<HistoryResp>('/query/history', {
          params: { threadId: tid },
        });
        if (data?.messages?.length) {
          setMessages(data.messages);
        }
      } catch (err) {
        console.error('Failed to load /try-agent history', err);
      }
    })();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser. Please use Chrome.');
      return;
    }
    const rec = recognitionRef.current as any;
    if (isListening) {
      rec.stop();
      setIsListening(false);
    } else {
      rec.start();
      setIsListening(true);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    setIsChatLoading(true);
    const userMsg: Message = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    try {
      const { data } = await api.post<QueryResp>('/query', {
        query: input,
        thread_id: threadId,
      });
      const assistantMsg: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: data.timestamp,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setThreadId(data.thread_id);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(THREAD_STORAGE_KEY, data.thread_id);
      }
      setInput('');
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Error: failed to send message.',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const nodePositions = useMemo(() => {
    if (!graph) return {};
    const angleStep = (2 * Math.PI) / graph.nodes.length;
    const radius = 120;
    const pos: Record<string, { x: number; y: number }> = {};
    graph.nodes.forEach((nodeId, i) => {
      const angle = i * angleStep;
      pos[nodeId] = {
        x: 150 + radius * Math.cos(angle),
        y: 150 + radius * Math.sin(angle),
      };
    });
    return pos;
  }, [graph]);

  return (
    <div className="paper min-h-screen text-[var(--ink)]">
      <AppHeader
        title="Try Agent"
        subtitle="Free public demo of our multi-agent system"
        showBack
        chatData={messages}
      />

      <div className="flex h-[calc(100vh-88px)] flex-col lg:flex-row">
        {/* LEFT: roster + architecture */}
        <div className="max-h-[50vh] w-full overflow-y-auto border-b border-[var(--ink)] bg-[var(--paper-2)] p-4 lg:max-h-full lg:w-1/3 lg:border-b-0 lg:border-r lg:p-6">
          <div className="mono mb-4 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--graphite)]">
            <span className="border border-[var(--ink)] bg-[var(--ink)] px-1.5 py-0.5 text-[var(--paper)]">
              §
            </span>
            <span>Agents on stage</span>
          </div>

          <div className="space-y-3">
            {agents.map((agent) => (
              <div
                key={agent.name}
                className="border border-[var(--ink)] bg-[var(--paper)] p-4"
              >
                <div className="display text-[15px] font-medium text-[var(--ink)]">
                  {agent.name}
                </div>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-[var(--ink-2)]">
                  {agent.description}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {agent.tools.map((tool) => (
                    <span
                      key={tool}
                      className="mono border border-[var(--ink)] bg-[var(--paper)] px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] text-[var(--ink)]"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {graph && (
            <div className="mt-8">
              <div className="mono mb-4 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--graphite)]">
                <span className="border border-[var(--ink)] bg-[var(--ink)] px-1.5 py-0.5 text-[var(--paper)]">
                  ▣
                </span>
                <span>Architecture</span>
              </div>
              <div className="border border-[var(--ink)] bg-[var(--paper)] p-2">
                <svg
                  width="100%"
                  height="320"
                  viewBox="0 0 300 300"
                  className="h-[250px] w-full lg:h-[320px]"
                >
                  {graph.edges.map(([from, to], i) => {
                    const fromPos = nodePositions[from];
                    const toPos = nodePositions[to];
                    if (!fromPos || !toPos) return null;
                    return (
                      <line
                        key={i}
                        x1={fromPos.x}
                        y1={fromPos.y}
                        x2={toPos.x}
                        y2={toPos.y}
                        stroke="#0b0b0f"
                        strokeWidth="1.5"
                      />
                    );
                  })}
                  {graph.nodes.map((nodeId) => {
                    const pos = nodePositions[nodeId];
                    if (!pos) return null;
                    const agent = agents.find(
                      (a) =>
                        a.name
                          .toLowerCase()
                          .replace(/ agent/g, '')
                          .replace(/ /g, '_') === nodeId
                    );
                    return (
                      <g key={nodeId}>
                        <circle
                          cx={pos.x}
                          cy={pos.y}
                          r="22"
                          fill="var(--paper)"
                          stroke="#0b0b0f"
                          strokeWidth="1.5"
                        />
                        <text
                          x={pos.x}
                          y={pos.y + 4}
                          textAnchor="middle"
                          fontSize="10"
                          fontFamily="JetBrains Mono, monospace"
                          fontWeight="600"
                          fill="#0b0b0f"
                        >
                          {agent?.name?.split(' ')[0]?.charAt(0) ??
                            nodeId.charAt(0).toUpperCase()}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: chat */}
        <div className="flex min-h-[50vh] flex-1 flex-col bg-[var(--paper)] lg:min-h-full">
          <div className="flex-1 overflow-y-auto p-4 lg:p-6">
            <div className="mx-auto w-full max-w-4xl space-y-3">
              {messages.length === 0 && (
                <div className="flex h-full flex-col items-center justify-center py-16 text-center">
                  <div className="display text-[32px] leading-tight text-[var(--ink)] sm:text-[44px]">
                    Ask the workforce.
                  </div>
                  <p className="mt-3 max-w-md text-[14px] text-[var(--graphite)]">
                    Type a question —&nbsp;the router will pick the right
                    specialist. Use the mic for voice input (Chrome only).
                  </p>
                </div>
              )}

              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] border px-4 py-3 text-[14px] leading-relaxed sm:max-w-[75%] ${
                      msg.role === 'user'
                        ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]'
                        : 'border-[var(--ink)] bg-[var(--paper-2)] text-[var(--ink)]'
                    }`}
                  >
                    {msg.role === 'user' ? (
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    ) : (
                      <div className="max-w-none text-[var(--ink)]">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeRaw]}
                          components={{
                            // The LLM frequently emits block content
                            // (fenced code, tables) inside a paragraph
                            // because the source markdown is missing
                            // blank lines around them. react-markdown's
                            // default then wraps the whole thing in <p>,
                            // which is invalid HTML when a <pre>/<table>
                            // is a descendant — triggering a hydration
                            // error. Downgrade to <div> when any child is
                            // a block element, so the rendered tree is
                            // always valid.
                            p: ({ children }: any) => {
                              // The LLM frequently emits block content
                              // (fenced code, tables) inside what should
                              // be a paragraph — the markdown source
                              // has no blank line around the fence. The
                              // `code`/`table`/etc. overrides below
                              // return block-level JSX (<pre>, <table>,
                              // …), and HTML5 forbids block descendants
                              // inside <p>, so we downgrade to <div>
                              // whenever a child is a block element.
                              const kids = Children.toArray(children);
                              const BLOCK_TAGS = new Set([
                                "pre",
                                "table",
                                "div",
                                "ul",
                                "ol",
                                "blockquote",
                                "h1",
                                "h2",
                                "h3",
                                "h4",
                                "h5",
                                "h6",
                              ]);
                              const hasBlock = kids.some(
                                (c) =>
                                  isValidElement(c) &&
                                  BLOCK_TAGS.has((c.type as unknown) as string),
                              );
                              return hasBlock ? (
                                <div className="my-2 text-[var(--ink)]">
                                  {children}
                                </div>
                              ) : (
                                <p className="mb-2 text-[var(--ink)]">
                                  {children}
                                </p>
                              );
                            },
                            code: ({ node, inline, className, children, ...props }: any) => {
                              return inline ? (
                                <code
                                  className="border border-[var(--ink)] bg-[var(--paper)] px-1.5 py-0.5 text-[12px] mono"
                                  {...props}
                                >
                                  {children}
                                </code>
                              ) : (
                                <pre className="my-3 overflow-x-auto border border-[var(--ink)] bg-[var(--ink)] p-3 text-[12px] mono text-[var(--paper)]">
                                  <code className="block" {...props}>
                                    {children}
                                  </code>
                                </pre>
                              );
                            },
                            h1: ({ children }: any) => (
                              <h1 className="mb-2 display text-[20px] text-[var(--ink)]">
                                {children}
                              </h1>
                            ),
                            h2: ({ children }: any) => (
                              <h2 className="mb-2 display text-[18px] text-[var(--ink)]">
                                {children}
                              </h2>
                            ),
                            h3: ({ children }: any) => (
                              <h3 className="mb-2 display text-[15px] text-[var(--ink)]">
                                {children}
                              </h3>
                            ),
                            ul: ({ children }: any) => (
                              <ul className="mb-2 ml-5 list-disc text-[var(--ink)]">
                                {children}
                              </ul>
                            ),
                            ol: ({ children }: any) => (
                              <ol className="mb-2 ml-5 list-decimal text-[var(--ink)]">
                                {children}
                              </ol>
                            ),
                            li: ({ children }: any) => (
                              <li className="text-[var(--ink)]">{children}</li>
                            ),
                            a: ({ href, children }: any) => (
                              <a
                                href={href}
                                className="text-[var(--accent)] underline decoration-2 underline-offset-2"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {children}
                              </a>
                            ),
                            // The scroll wrapper is fine — it's a block
                            // child of whatever react-markdown emits as the
                            // table's parent (never <p> in valid GFM).
                            table: ({ children }: any) => (
                              <div className="my-3 overflow-x-auto border border-[var(--ink)]">
                                <table className="w-full border-collapse text-left text-[13px]">
                                  {children}
                                </table>
                              </div>
                            ),
                            thead: ({ children }: any) => (
                              <thead className="bg-[var(--paper-2)]">{children}</thead>
                            ),
                            th: ({ children }: any) => (
                              <th className="border border-[var(--ink)] bg-[var(--ink)] px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--paper)]">
                                {children}
                              </th>
                            ),
                            tbody: ({ children }: any) => <tbody>{children}</tbody>,
                            tr: ({ children }: any) => (
                              <tr className="even:bg-[var(--paper-2)]">{children}</tr>
                            ),
                            td: ({ children }: any) => (
                              <td className="border border-[var(--ink)] px-3 py-2 align-top text-[var(--ink)]">
                                {children}
                              </td>
                            ),
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="mono max-w-[75%] border border-[var(--ink)] bg-[var(--paper-2)] px-4 py-3 text-[11px] uppercase tracking-[0.2em] text-[var(--graphite)]">
                    Routing · thinking…
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          </div>

          {/* composer */}
          <div className="border-t border-[var(--ink)] bg-[var(--paper-2)] p-3 lg:p-4">
            <div className="mx-auto flex w-full max-w-4xl items-center gap-2 lg:gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask agents anything…"
                className="mono h-11 flex-1 border border-[var(--ink)] bg-[var(--paper)] px-4 text-[14px] text-[var(--ink)] placeholder:text-[var(--graphite)] focus:border-[var(--accent)] focus:outline-none"
                disabled={isChatLoading}
              />
              <button
                onClick={toggleListening}
                disabled={isChatLoading}
                className={`mono h-11 w-11 border border-[var(--ink)] text-[16px] transition-colors ${
                  isListening
                    ? 'animate-pulse-dot border-[var(--accent)] text-[var(--accent)]'
                    : 'bg-[var(--paper)] text-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--paper)]'
                }`}
                title="Voice input (Chrome only)"
                type="button"
                aria-label="Voice input"
              >
                ●
              </button>
              <button
                onClick={handleSend}
                disabled={isChatLoading || !input.trim()}
                className="mono h-11 border border-[var(--ink)] bg-[var(--ink)] px-5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--paper)] transition-colors hover:bg-[var(--accent)] disabled:opacity-50"
                type="button"
              >
                Send →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
