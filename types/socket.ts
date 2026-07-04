import { Server as NetServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { NextApiRequest } from 'next';
import { NextApiResponse } from 'next';

export type ConflictPayload = {
  queryId: string;
  workflowId: string;
  runId: string;
  nodeId: string;
  nodeLabel: string;
  ownerEmail: string;
  query: string;
  contextSnapshot: {
    input: string;
    agentOutput: string;
    conflictReason: string;
    timestamp: string;
  };
  timeoutAt: string;
};

export type ConflictResponse = {
  queryId: string;
  workflowId: string;
  response: string;
  adminEmail: string;
  respondedAt: string;
};

export type ChatMessage = {
  id: string;
  workflowId: string;
  senderEmail: string;
  senderName: string;
  message: string;
  messageType: 'text' | 'system';
  createdAt: string;
};

export type ServerToClientEvents = {
  'conflict:raised': (payload: ConflictPayload) => void;
  'admin:typing': (data: { adminEmail: string; nodeId: string }) => void;
  'conflict:resolved': (data: ConflictResponse) => void;
  'admin:joined': (data: { adminEmail: string; workflowId: string; onlineCount: number }) => void;
  'admin:left': (data: { adminEmail: string; workflowId: string; onlineCount: number }) => void;
  'chat:message': (data: ChatMessage) => void;
  'chat:history': (data: ChatMessage[]) => void;
  'error': (data: { message: string }) => void;
};

export type ClientToServerEvents = {
  'join:workflow': (data: { workflowId: string; adminEmail: string }) => void;
  'leave:workflow': (data: { workflowId: string; adminEmail: string }) => void;
  'conflict:response': (data: { queryId: string; response: string; adminEmail: string }) => void;
  'admin:typing': (data: { workflowId: string; nodeId: string }) => void;
  'chat:send': (data: { workflowId: string; senderEmail: string; senderName: string; message: string }) => void;
};

export type SocketServer = SocketIOServer<ClientToServerEvents, ServerToClientEvents>;
export type SocketWithIO = NetServer & { io?: SocketServer };

export const resSocket: { io: SocketServer | null } = { io: null };
