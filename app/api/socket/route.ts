import { Server as NetServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { NextRequest, NextResponse } from 'next/server';
import { ConflictPayload, ConflictResponse, ChatMessage } from '@/types/socket';
import { getWorkflowChatsCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Global instance
let io: SocketIOServer | null = null;

// Track connected admins per workflow
const workflowRooms = new Map<string, Set<string>>();

export function getIO() {
  return io;
}

function setupSocketHandlers(ioInstance: SocketIOServer) {
  ioInstance.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    socket.on('join:workflow', ({ workflowId, adminEmail }: { workflowId: string; adminEmail: string }) => {
      // Store user email in socket data for authorization checks
      socket.data.userEmail = adminEmail;
      
      if (!workflowRooms.has(workflowId)) {
        workflowRooms.set(workflowId, new Set());
      }
      const room = workflowRooms.get(workflowId)!;
      room.add(adminEmail);
      socket.join(workflowId);

      ioInstance.to(workflowId).emit('admin:joined', {
        adminEmail,
        workflowId,
        onlineCount: room.size,
      });
      console.log(`Admin ${adminEmail} joined workflow ${workflowId}`);
    });

    socket.on('leave:workflow', ({ workflowId, adminEmail }: { workflowId: string; adminEmail: string }) => {
      socket.leave(workflowId);
      const room = workflowRooms.get(workflowId);
      if (room) {
        room.delete(adminEmail);
        ioInstance.to(workflowId).emit('admin:left', {
          adminEmail,
          workflowId,
          onlineCount: room.size,
        });
      }
      console.log(`Admin ${adminEmail} left workflow ${workflowId}`);
    });

    socket.on('conflict:response', async (data: ConflictResponse) => {
      // Broadcast to all clients in the workflow room
      ioInstance.to(data.workflowId).emit('conflict:resolved', data);
      
      // Store in database
      try {
        const collection = await getWorkflowChatsCollection();
        await collection.updateOne(
          { workflowId: data.workflowId, 'conflicts.queryId': data.queryId },
          { 
            $set: { 
              'conflicts.$.status': 'resolved',
              'conflicts.$.response': data.response,
              'conflicts.$.resolvedAt': new Date().toISOString()
            }
          }
        );
      } catch (error) {
        console.error('Error storing conflict response:', error);
      }
    });

    socket.on('chat:send', async (data: { workflowId: string; senderEmail: string; senderName: string; message: string }) => {
      const { workflowId, senderEmail, senderName, message } = data;
      try {
        const collection = await getWorkflowChatsCollection();
        const chatMessage = {
          _id: new ObjectId(),
          workflowId,
          senderEmail,
          senderName: senderName || senderEmail.split('@')[0],
          message,
          messageType: 'text',
          createdAt: new Date().toISOString(),
        };
        await collection.insertOne(chatMessage);
        const messagePayload: ChatMessage = {
          id: chatMessage._id.toString(),
          workflowId,
          senderEmail,
          senderName: chatMessage.senderName,
          message,
          messageType: 'text',
          createdAt: chatMessage.createdAt,
        };
        ioInstance.to(workflowId).emit('chat:message', messagePayload);
      } catch (error) {
        console.error('Error handling chat:', error);
      }
    });

    socket.on('chat:message', async (data: ChatMessage & { workflowId: string }) => {
      // Broadcast chat message to workflow room
      ioInstance.to(data.workflowId).emit('chat:message', data);
    });

    socket.on('typing', ({ workflowId, adminEmail, isTyping }: { workflowId: string; adminEmail: string; isTyping: boolean }) => {
      socket.to(workflowId).emit('typing', { adminEmail, isTyping });
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected:', socket.id);
    });
  });
}

export function initIO(httpServer?: NetServer) {
  if (io) return io;
  
  if (httpServer) {
    // Attach to existing HTTP server
    io = new SocketIOServer(httpServer, {
      path: '/api/socket',
      addTrailingSlash: false,
      cors: { origin: '*', methods: ['GET', 'POST'] },
      transports: ['websocket', 'polling'],
    });
  } else {
    // Create standalone server for development
    const { createServer } = require('http');
    const httpServer = createServer();
    io = new SocketIOServer(httpServer, {
      path: '/api/socket',
      addTrailingSlash: false,
      cors: { origin: '*', methods: ['GET', 'POST'] },
      transports: ['websocket', 'polling'],
    });
    httpServer.listen(3001, () => {
      console.log('Socket.IO standalone server listening on port 3001');
    });
  }

  setupSocketHandlers(io);
  console.log('Socket.IO initialized');
  return io;
}

export function broadcastConflict(workflowId: string, payload: ConflictPayload) {
  if (!io) {
    console.error('Socket.IO not initialized');
    return false;
  }
  
  // Only broadcast to the assigned owner, not all users in the workflow room
  const targetSockets = Array.from(io.sockets.sockets.values())
    .filter(socket => {
      // Check if this socket belongs to the assigned owner
      const socketData = socket.data;
      return socketData?.userEmail === payload.ownerEmail;
    });

  if (targetSockets.length === 0) {
    console.log(`No active socket found for assigned owner: ${payload.ownerEmail}`);
    return false;
  }

  console.log(`Broadcasting conflict ${payload.queryId} to assigned owner: ${payload.ownerEmail}`);
  
  targetSockets.forEach(socket => {
    socket.emit('conflict:raised', payload);
  });
  
  return true;
}

export async function GET(req: NextRequest) {
  // Initialize Socket.IO on first request
  initIO();
  return NextResponse.json({ success: true, status: 'initialized' });
}

export async function POST(req: NextRequest) {
  // Socket.IO polling endpoint
  initIO();
  return NextResponse.json({ success: true });
}
