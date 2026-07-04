'use client';

import { useState, useEffect } from 'react';
import { RealtimeEvent } from '@/types/dashboard';

interface RealtimeActivityProps {
  onRealtimeUpdate?: (data: any) => void;
}

function resolveWsBase(): string {
  // Mirror the chat sidebar's helper: env-driven, falls back to
  // localhost:8000, with the `/api` suffix stripped so we can sit
  // at the bare origin for the WebSocket.
  const fromEnv = process.env.NEXT_PUBLIC_FASTAPI_BASE_URL;
  const base = fromEnv && fromEnv.length > 0
    ? fromEnv
    : "http://localhost:8000/api";
  return base.replace(/\/api\/?$/, "");
}

export default function RealtimeActivity({ onRealtimeUpdate }: RealtimeActivityProps) {
  const [events, setEvents] = useState<RealtimeEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let retryTimeout: NodeJS.Timeout | null = null;
    let retryCount = 0;
    const maxRetries = 3;
    let isComponentMounted = true;

    const connectWebSocket = async () => {
      if (!isComponentMounted) return;

      try {
        const wsBase = resolveWsBase().replace(/^http/, "ws");
        const wsUrl = `${wsBase}/ws/dashboard`;
        console.log('Attempting WebSocket connection...', wsUrl);
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          if (!isComponentMounted) return;
          setIsConnected(true);
          retryCount = 0;
          console.log('✅ Connected to dashboard WebSocket');
        };

        ws.onmessage = (event) => {
          if (!isComponentMounted) return;

          try {
            const data = JSON.parse(event.data);
            const newEvent: RealtimeEvent = {
              type: data.type,
              data: data.data,
              timestamp: data.timestamp,
            };

            if (onRealtimeUpdate) {
              onRealtimeUpdate(data);
            }

            setEvents((prev) => [newEvent, ...prev.slice(0, 49)]);
          } catch (parseError) {
            console.error('Failed to parse WebSocket message:', parseError);
          }
        };

        ws.onclose = (event) => {
          if (!isComponentMounted) return;

          setIsConnected(false);
          console.log('🔌 WebSocket disconnected:', event.code, event.reason);

          if (event.code !== 1000 && retryCount < maxRetries && isComponentMounted) {
            retryCount++;
            console.log(`🔄 Retrying WebSocket connection (${retryCount}/${maxRetries})...`);
            retryTimeout = setTimeout(connectWebSocket, 3000);
          } else if (retryCount >= maxRetries) {
            console.log('❌ Max retry attempts reached, giving up');
          }
        };

        ws.onerror = (error) => {
          if (!isComponentMounted) return;
          setIsConnected(false);
          console.error('⚠️ WebSocket connection error:', error);
        };
      } catch (error) {
        console.error('❌ Failed to create WebSocket connection:', error);
        setIsConnected(false);
      }
    };

    const initialDelay = setTimeout(connectWebSocket, 1000);

    return () => {
      isComponentMounted = false;
      if (retryTimeout) clearTimeout(retryTimeout);
      if (initialDelay) clearTimeout(initialDelay);
      if (ws) ws.close(1000, 'Component unmounted');
    };
  }, [onRealtimeUpdate]);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'run_started':
      case 'step_completed':
        return <div className="w-2 h-2 bg-green-500 rounded-full"></div>;
      case 'run_completed':
        return <div className="w-2 h-2 bg-blue-500 rounded-full"></div>;
      case 'step_started':
        return <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>;
      default:
        return <div className="w-2 h-2 bg-gray-500 rounded-full"></div>;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'run_started':
      case 'step_completed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'run_completed':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'step_started':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatEventMessage = (event: RealtimeEvent) => {
    switch (event.type) {
      case 'run_started':
        return `Started workflow: ${event.data.workflow_name || event.data.workflow_id}`;
      case 'run_completed':
        return `Completed workflow: ${event.data.workflow_name || event.data.workflow_id}`;
      case 'step_started':
        return `Started step: ${event.data.name}`;
      case 'step_completed':
        return `Completed step: ${event.data.name}`;
      default:
        return 'Unknown event';
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-4 py-5 sm:px-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Real-time Activity</h3>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-500">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Live workflow execution events and updates
        </p>
      </div>

      <div className="border-t border-gray-200">
        <div className="max-h-96 overflow-y-auto">
          {events.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <svg className="w-8 h-8 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <p className="text-sm">Waiting for real-time events...</p>
              <p className="text-xs mt-1">Start a workflow to see live updates</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {events.map((event, index) => (
                <div key={`${event.timestamp}-${index}`} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getEventIcon(event.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-medium px-2 py-1 rounded border ${getEventColor(event.type)}`}>
                          {formatEventMessage(event)}
                        </p>
                        <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                          {formatTime(event.timestamp)}
                        </span>
                      </div>

                      {event.data && (
                        <details className="mt-2">
                          <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-800">
                            Event Details
                          </summary>
                          <pre className="mt-1 p-2 bg-gray-50 text-xs overflow-x-auto rounded border">
                            {JSON.stringify(event.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}