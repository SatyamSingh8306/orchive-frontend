'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { ChatMessage, ConflictPayload } from '@/types/socket';
import { useSocket } from '@/lib/useSocket';
import { api } from '@/lib/axios';
import Link from 'next/link';
import { FiArrowLeft, FiSend, FiMessageSquare, FiUsers, FiAlertTriangle, FiCheckCircle, FiEdit3, FiGrid, FiMic, FiClock } from 'react-icons/fi';

interface Conflict extends ConflictPayload {
  status: 'pending' | 'answered' | 'timeout';
  response?: string;
  respondedBy?: string;
  respondedAt?: string;
}

interface WorkflowRoomProps {
  workflowId: string;
}

export default function WorkflowRoom({ workflowId }: WorkflowRoomProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load chat history and user's conflicts
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const { data } = await api.get('/workflow-chats', {
          params: { workflowId },
        });
        setMessages(data?.data || []);
      } catch (error) {
        console.error('Failed to load chat history:', error);
      }
    };

    const loadUserConflicts = async () => {
      if (!user?.email) return;

      try {
        const { data } = await api.get(`/conflicts/user/${user.email}`);
        const userWorkflowConflicts =
          data?.data?.filter(
            (conflict: any) =>
              conflict.workflowId === workflowId &&
              conflict.ownerEmail === user.email,
          ) || [];
        setConflicts(userWorkflowConflicts);
      } catch (error) {
        console.error('Failed to load user conflicts:', error);
      }
    };

    loadHistory();
    loadUserConflicts();
  }, [workflowId, user?.email]);

  const { isConnected } = useSocket({
    workflowId,
    adminEmail: user?.email || '',
    onConnect: () => console.log('Socket connected'),
    onDisconnect: () => console.log('Socket disconnected'),
    onMessage: (data) => {
      if (data.type === 'conflict:raised') {
        if (data.ownerEmail === user?.email) {
          setConflicts(prev => {
            if (prev.some(c => c.queryId === data.queryId)) return prev;
            const newConflict: Conflict = {
              queryId: data.queryId,
              workflowId: data.workflowId,
              runId: data.runId,
              nodeId: data.nodeId,
              nodeLabel: data.nodeLabel,
              ownerEmail: data.ownerEmail,
              query: data.query,
              contextSnapshot: data.contextSnapshot,
              timeoutAt: data.timeoutAt,
              status: 'pending',
            };
            return [newConflict, ...prev];
          });
        }
      } else if (data.type === 'conflict:resolved') {
        setConflicts(prev =>
          prev.map(c =>
            c.queryId === data.queryId && c.ownerEmail === user?.email
              ? {
                  ...c,
                  status: 'answered',
                  response: data.response,
                  respondedBy: data.adminEmail,
                  respondedAt: data.respondedAt,
                }
              : c,
          ),
        );
      } else if (data.type === 'admin:joined') {
        setOnlineUsers(prev => prev + 1);
      } else if (data.type === 'admin:left') {
        setOnlineUsers(prev => Math.max(0, prev - 1));
      }
    },
  });

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [newMessage]);

  // Voice recognition setup
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();

      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setNewMessage(transcript);
        setIsRecording(false);
      };

      recognitionInstance.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognitionInstance.onend = () => {
        setIsRecording(false);
      };

      setRecognition(recognitionInstance);
    }
  }, []);

  const handleConflictResponse = async (queryId: string, response: string) => {
    if (!user?.email) return;

    const conflict = conflicts.find(c => c.queryId === queryId);
    if (!conflict || conflict.ownerEmail !== user.email) {
      console.warn('Unauthorized: You can only respond to your own conflicts');
      return;
    }

    try {
      await api.post('/conflicts/respond', {
        queryId,
        response,
        adminEmail: user.email,
      });

      setConflicts(prev =>
        prev.map(c =>
          c.queryId === queryId
            ? {
                ...c,
                status: 'answered',
                response,
                respondedBy: user.email,
                respondedAt: new Date().toISOString(),
              }
            : c,
        ),
      );
    } catch (error) {
      console.warn('Failed to respond to conflict:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user?.email) return;

    const messageData = {
      workflowId,
      senderEmail: user.email,
      senderName: user.name || user.email.split('@')[0],
      message: newMessage.trim(),
    };

    try {
      const { data } = await api.post('/workflow-chats', messageData);
      if (data) {
        setMessages(prev => [...prev, data.data]);
        setNewMessage('');

        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      } else {
        console.warn('Failed to send message');
      }
    } catch (error) {
      console.warn('Error sending message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const toggleRecording = () => {
    if (!recognition) {
      alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
      return;
    }

    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      recognition.start();
      setIsRecording(true);
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[var(--ink)] bg-[var(--paper)]">
        <div className="flex items-center justify-between gap-4 px-3 py-3 lg:px-6 lg:py-4">
          <div className="flex min-w-0 items-center gap-3 lg:gap-4">
            <button
              onClick={() => router.push('/agent-maker')}
              className="mono flex h-8 w-8 shrink-0 items-center justify-center border border-[var(--ink)] bg-[var(--paper)] text-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--paper)]"
              type="button"
              aria-label="Back to agent maker"
            >
              <FiArrowLeft className="h-3.5 w-3.5" />
            </button>

            <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-[var(--ink)] bg-[var(--paper-2)] text-[var(--ink)]">
              <FiMessageSquare className="h-4 w-4" />
            </span>

            <div className="min-w-0">
              <div className="display truncate text-[14px] font-semibold text-[var(--ink)] lg:text-[16px]">
                Workflow room
              </div>
              <div className="mono mt-0.5 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[var(--graphite)]">
                <span className="truncate">ID · {workflowId}</span>
                <span
                  className={`flex shrink-0 items-center gap-1.5 border px-1.5 py-0.5 ${
                    isConnected
                      ? 'border-[var(--ok)]/40 bg-[var(--ok)]/10 text-[var(--ok)]'
                      : 'border-[var(--rule-soft)] bg-[var(--paper-2)] text-[var(--graphite)]'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      isConnected
                        ? 'animate-pulse-dot bg-[var(--ok)]'
                        : 'bg-[var(--graphite)]'
                    }`}
                  />
                  {isConnected ? 'connected' : 'disconnected'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 lg:gap-3">
            <span className="mono hidden items-center gap-1.5 border border-[var(--ink)] bg-[var(--paper)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--ink)] sm:inline-flex">
              <FiUsers className="h-3.5 w-3.5" />
              {onlineUsers} online
            </span>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-68px)] flex-col">
        {/* Quick-actions toolbar — connects the header to the chat
            surface so the page reads as one continuous paper system
            rather than two side-by-side panels with a hard seam. */}
        <div className="flex items-center justify-between border-b border-[var(--ink)] bg-[var(--paper-2)] px-4 py-2 lg:px-6">
          <div className="flex items-center gap-2">
            <Link
              href={`/agent-maker?id=${workflowId}`}
              className="mono inline-flex items-center gap-2 border border-[var(--ink)] bg-[var(--paper)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--paper)]"
            >
              <FiEdit3 className="h-3.5 w-3.5" />
              Edit workflow
            </Link>
            <Link
              href="/dashboard"
              className="mono inline-flex items-center gap-2 border border-[var(--ink)] bg-[var(--paper)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--paper)]"
            >
              <FiGrid className="h-3.5 w-3.5" />
              Dashboard
            </Link>
          </div>
          {user && (
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center border border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]">
                <span className="display text-[12px] font-semibold">
                  {user.name?.charAt(0).toUpperCase() ||
                    user.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="hidden sm:block">
                <div className="display text-[12px] font-semibold leading-tight text-[var(--ink)]">
                  {user.name || user.email}
                </div>
                <div className="mono text-[9.5px] uppercase tracking-[0.2em] text-[var(--ok)]">
                  You · online
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chat Area — full width, single column */}
        <div className="flex flex-1 flex-col">
          <div className="flex-1 overflow-y-auto px-3 py-6 lg:px-6">
            <div className="mx-auto max-w-3xl space-y-5">
              {/* Pending Conflicts */}
              {conflicts
                .filter(c => c.status === 'pending')
                .map(conflict => (
                  <ConflictCard
                    key={conflict.queryId}
                    conflict={conflict}
                    onRespond={handleConflictResponse}
                    variant="pending"
                  />
                ))}

              {/* Answered Conflicts */}
              {conflicts
                .filter(c => c.status === 'answered')
                .map(conflict => (
                  <ConflictCard key={conflict.queryId} conflict={conflict} variant="answered" />
                ))}

              {messages.length === 0 &&
              conflicts.filter(c => c.status === 'pending').length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center px-4 py-16">
                  <div className="mb-6 flex h-20 w-20 items-center justify-center border border-[var(--ink)] bg-[var(--paper-2)]">
                    <FiMessageSquare className="h-10 w-10 text-[var(--ink)]" />
                  </div>
                  <h2 className="display mb-3 text-[28px] font-semibold text-[var(--ink)]">
                    Start the conversation
                  </h2>
                  <p className="mx-auto max-w-md text-center text-[15px] leading-relaxed text-[var(--ink-2)]">
                    Collaborate with your team and resolve conflicts in real-time.
                  </p>
                </div>
              ) : (
                messages.map(msg => {
                  const isMe = msg.senderEmail === user?.email;
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isMe && (
                        <div className="mt-1 shrink-0">
                          <div className="flex h-9 w-9 items-center justify-center border border-[var(--ink)] bg-[var(--paper-2)] text-[var(--ink)]">
                            <span className="display text-[14px] font-semibold">
                              {msg.senderName?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                          </div>
                        </div>
                      )}
                      <div className="max-w-[85%] min-w-0">
                        <div
                          className={`px-5 py-3.5 ${
                            isMe
                              ? 'border border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]'
                              : 'border border-[var(--ink)] bg-[var(--paper-2)] text-[var(--ink)]'
                          }`}
                        >
                          {!isMe && (
                            <div className="mono mb-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--graphite)]">
                              {msg.senderName}
                            </div>
                          )}
                          <p className="whitespace-pre-wrap break-words text-[14px] leading-relaxed">
                            {msg.message}
                          </p>
                        </div>
                        <div
                          className={`mt-1.5 flex items-center gap-1.5 ${
                            isMe ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <FiClock className="h-3 w-3 text-[var(--graphite)]" />
                          <span className="mono text-[10px] uppercase tracking-[0.2em] text-[var(--graphite)]">
                            {formatTime(msg.createdAt)}
                          </span>
                        </div>
                      </div>
                      {isMe && (
                        <div className="mt-1 shrink-0">
                          <div className="flex h-9 w-9 items-center justify-center border border-[var(--ink)] bg-[var(--paper-2)] text-[var(--ink)]">
                            <span className="display text-[14px] font-semibold">
                              {user?.name?.charAt(0)?.toUpperCase() ||
                                user?.email?.charAt(0)?.toUpperCase() ||
                                'U'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <div className="border-t border-[var(--ink)] bg-[var(--paper-2)] px-3 py-4 lg:px-6">
            <div className="mx-auto max-w-3xl">
              <form onSubmit={handleSendMessage} className="flex items-end gap-2 border border-[var(--ink)] bg-[var(--paper)] p-2 focus-within:border-[var(--accent)]">
                <button
                  type="button"
                  onClick={toggleRecording}
                  className={`flex h-9 w-9 shrink-0 items-center justify-center border border-[var(--ink)] transition-colors ${
                    isRecording
                      ? 'animate-pulse-dot border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]'
                      : 'bg-[var(--paper)] text-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--paper)]'
                  }`}
                  title="Voice input"
                  aria-label="Voice input"
                >
                  <FiMic className="h-4 w-4" />
                </button>

                <textarea
                  ref={textareaRef}
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message…"
                  className="flex-1 resize-none border-0 bg-transparent px-1 py-2 text-[14px] leading-relaxed text-[var(--ink)] placeholder:text-[var(--graphite)] focus:outline-none"
                  rows={1}
                  style={{ height: '36px', maxHeight: '100px' }}
                />

                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="mono flex h-9 shrink-0 items-center gap-2 border border-[var(--ink)] bg-[var(--ink)] px-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--paper)] transition-colors hover:bg-[var(--accent)] disabled:opacity-50"
                >
                  <FiSend className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Send</span>
                </button>
              </form>

              <div className="mono mt-2 flex items-center justify-between px-1 text-[9.5px] uppercase tracking-[0.2em] text-[var(--graphite)]">
                <span>
                  {messages.length} message{messages.length !== 1 ? 's' : ''} · {onlineUsers} online
                </span>
                <span>Enter to send · Shift+Enter for new line</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConflictCard({
  conflict,
  onRespond,
  variant,
}: {
  conflict: Conflict;
  onRespond?: (queryId: string, response: string) => void;
  variant: 'pending' | 'answered';
}) {
  const [response, setResponse] = useState('');

  if (variant === 'answered') {
    return (
      <div className="border border-[var(--ok)]/40 bg-[var(--ok)]/5 p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center border border-[var(--ok)] bg-[var(--ok)]/10 text-[var(--ok)]">
            <FiCheckCircle className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--ok)]">
              Conflict resolved
            </div>
            <p className="mt-1 text-[14px] leading-relaxed text-[var(--ink)]">
              {conflict.query}
            </p>
            {conflict.response && (
              <p className="mt-2 text-[13px] text-[var(--ink-2)]">
                <span className="mono text-[9.5px] uppercase tracking-[0.2em] text-[var(--graphite)]">
                  Response ·{' '}
                </span>
                {conflict.response}
              </p>
            )}
            <p className="mono mt-1.5 text-[9.5px] uppercase tracking-[0.2em] text-[var(--graphite)]">
              By {conflict.respondedBy} ·{' '}
              {conflict.respondedAt
                ? new Date(conflict.respondedAt).toLocaleString()
                : ''}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-[var(--accent)]/40 bg-[var(--accent)]/5 p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center border border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]">
          <FiAlertTriangle className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
            Conflict requires attention
          </div>
          <p className="mt-1 text-[14px] leading-relaxed text-[var(--ink)]">
            {conflict.query}
          </p>
          <div className="mono mt-1.5 space-y-0.5 text-[9.5px] uppercase tracking-[0.18em] text-[var(--graphite)]">
            <p>From · {conflict.nodeLabel || conflict.nodeId}</p>
            <p>Workflow · {conflict.workflowId}</p>
          </div>
          {onRespond && (
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                placeholder="Type response…"
                value={response}
                onChange={e => setResponse(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && response.trim()) {
                    onRespond(conflict.queryId, response.trim());
                    setResponse('');
                  }
                }}
                className="mono h-9 flex-1 border border-[var(--ink)] bg-[var(--paper)] px-3 text-[12px] text-[var(--ink)] placeholder:text-[var(--graphite)] focus:border-[var(--accent)] focus:outline-none"
              />
              <button
                type="button"
                disabled={!response.trim()}
                onClick={() => {
                  if (response.trim()) {
                    onRespond(conflict.queryId, response.trim());
                    setResponse('');
                  }
                }}
                className="mono border border-[var(--accent)] bg-[var(--paper)] px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--paper)] disabled:opacity-50"
              >
                Respond
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
