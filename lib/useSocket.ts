'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { ConflictPayload, ConflictResponse } from '@/types/socket';
import { useConflicts } from '@/contexts/ConflictContext';

interface UseSocketProps {
  workflowId: string;
  adminEmail: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
  onMessage?: (data: WebSocketMessage) => void;
}

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export function useSocket({
  workflowId,
  adminEmail,
  onConnect,
  onDisconnect,
  onError,
  onMessage,
}: UseSocketProps) {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { addConflict, resolveConflict } = useConflicts();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const FASTAPI_BASE_URL = 'http://localhost:8000';
  const WS_URL = FASTAPI_BASE_URL.replace('https://', 'wss://').replace('http://', 'ws://');

  // Initialize WebSocket connection
  useEffect(() => {
    if (!workflowId || !adminEmail) return;

    const connect = () => {
      try {
        // Clean up any existing connection
        if (wsRef.current) {
          wsRef.current.close();
        }
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }

        const wsUrl = `${WS_URL}/ws/${workflowId}`;
        console.log('Connecting to WebSocket:', wsUrl);
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('WebSocket connected');
          setIsConnected(true);
          reconnectAttempts.current = 0;
          onConnect?.();

          // Send join message
          const joinMessage = {
            type: 'join:workflow',
            workflowId,
            adminEmail
          };
          console.log('Sending join message:', joinMessage);
          ws.send(JSON.stringify(joinMessage));
        };

        ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          setIsConnected(false);
          onDisconnect?.();
          wsRef.current = null;

          // Auto-reconnect with exponential backoff
          if (reconnectAttempts.current < maxReconnectAttempts) {
            reconnectAttempts.current++;
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000);
            console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts.current})...`);
            reconnectTimeoutRef.current = setTimeout(() => {
              connect();
            }, delay);
          } else {
            console.error('Max reconnection attempts reached');
            onError?.(new Error('Max reconnection attempts reached'));
          }
        };

        // ws.onerror = (error) => {
        //   console.error('WebSocket error:', error);
        //   // Don't call onError here, let onclose handle reconnection
        // };

        ws.onmessage = (event) => {
          try {
            const data: WebSocketMessage = JSON.parse(event.data);
            console.log('WebSocket message received:', data);

            switch (data.type) {
              case 'connected':
                console.log('Connected to workflow:', data.workflowId);
                break;

              case 'conflict:raised':
                addConflict(data as unknown as ConflictPayload);
                onMessage?.(data);
                break;

              case 'conflict:resolved':
                resolveConflict(data as unknown as ConflictResponse);
                onMessage?.(data);
                break;

              case 'admin:joined':
                console.log('Admin joined:', data.adminEmail);
                break;

              case 'admin:left':
                console.log('Admin left:', data.adminEmail);
                break;

              case 'chat:message':
                // Handle chat messages if needed
                break;

              case 'error':
                console.error('Server error:', data.message);
                break;
            }
          } catch (err) {
            console.error('Error parsing WebSocket message:', err);
          }
        };
      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        onError?.(error as Error);
      }
    };

    connect();

    // Cleanup
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (wsRef.current) {
        // Prevent reconnection on manual cleanup
        const ws = wsRef.current;
        ws.onclose = null;
        ws.close();
        wsRef.current = null;
      }
    };
  }, [workflowId, adminEmail]);

  // Send conflict response
  const sendConflictResponse = useCallback((queryId: string, response: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'conflict:response',
        queryId,
        response,
        adminEmail
      }));
    } else {
      console.error('WebSocket is not connected');
    }
  }, [adminEmail]);

  // Send typing indicator
  const sendTypingIndicator = useCallback((nodeId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'typing',
        workflowId,
        adminEmail,
        nodeId,
        isTyping: true
      }));
    }
  }, [workflowId, adminEmail]);

  return {
    isConnected,
    sendConflictResponse,
    sendTypingIndicator,
  };
}
