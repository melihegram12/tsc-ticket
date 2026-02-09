import { Server as NetServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import prisma from './prisma';

interface ChatMessagePayload {
    sessionId: number;
    senderId: number;
    message: string;
    senderName?: string;
}

interface TypingPayload {
    sessionId: number;
    userId: number;
    userName: string;
    isTyping: boolean;
}

interface JoinChatPayload {
    sessionId: number;
    userId: number;
}

// Ticket presence tracking
interface TicketPresencePayload {
    ticketId: number;
    userId: number;
    userName: string;
}

// In-memory ticket viewers map
const ticketViewers = new Map<number, Map<string, { id: number; name: string; socketId: string }>>();

let io: SocketIOServer | null = null;

export const getIO = () => io;
export const getTicketViewers = () => ticketViewers;

export const initSocketServer = (server: NetServer) => {
    if (io) return io;

    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
        'http://localhost:3000',
        'http://localhost:3001',
    ];

    io = new SocketIOServer(server, {
        path: '/socket.io',
        cors: {
            origin: (origin, callback) => {
                // Allow requests with no origin (mobile apps, curl, etc.) in development
                if (!origin && process.env.NODE_ENV !== 'production') {
                    return callback(null, true);
                }
                if (origin && allowedOrigins.includes(origin)) {
                    return callback(null, true);
                }
                callback(new Error('CORS not allowed'));
            },
            methods: ['GET', 'POST'],
            credentials: true,
        },
        transports: ['websocket', 'polling'],
    });
    (server as any).io = io;

    io.on('connection', (socket: Socket) => {
        console.log('Client connected:', socket.id);

        // Join a chat session room
        socket.on('join_chat', async (data: JoinChatPayload) => {
            const roomName = `chat_${data.sessionId}`;
            socket.join(roomName);
            console.log(`User ${data.userId} joined room ${roomName}`);

            // Notify others in the room
            socket.to(roomName).emit('user_joined', {
                userId: data.userId,
                sessionId: data.sessionId,
            });
        });

        // Leave a chat session room
        socket.on('leave_chat', (data: JoinChatPayload) => {
            const roomName = `chat_${data.sessionId}`;
            socket.leave(roomName);
            console.log(`User ${data.userId} left room ${roomName}`);

            socket.to(roomName).emit('user_left', {
                userId: data.userId,
                sessionId: data.sessionId,
            });
        });

        // Send a message
        socket.on('send_message', async (data: ChatMessagePayload) => {
            try {
                // Save message to database
                const message = await prisma.chatMessage.create({
                    data: {
                        sessionId: data.sessionId,
                        senderId: data.senderId,
                        message: data.message,
                        isRead: false,
                    },
                    include: {
                        sender: {
                            select: {
                                id: true,
                                name: true,
                                avatarUrl: true,
                            },
                        },
                    },
                });

                // Emit to all users in the room
                io?.to(`chat_${data.sessionId}`).emit('new_message', message);
            } catch (error) {
                console.error('Error sending message:', error);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

        // Typing indicator
        socket.on('typing', (data: TypingPayload) => {
            socket.to(`chat_${data.sessionId}`).emit('user_typing', {
                userId: data.userId,
                userName: data.userName,
                isTyping: data.isTyping,
            });
        });

        // Mark messages as read
        socket.on('mark_read', async (data: { sessionId: number; userId: number }) => {
            try {
                await prisma.chatMessage.updateMany({
                    where: {
                        sessionId: data.sessionId,
                        senderId: { not: data.userId },
                        isRead: false,
                    },
                    data: { isRead: true },
                });

                io?.to(`chat_${data.sessionId}`).emit('messages_read', {
                    sessionId: data.sessionId,
                    readBy: data.userId,
                });
            } catch (error) {
                console.error('Error marking messages as read:', error);
            }
        });

        // Agent accepts chat
        socket.on('accept_chat', async (data: { sessionId: number; agentId: number }) => {
            try {
                const session = await prisma.chatSession.update({
                    where: { id: data.sessionId },
                    data: {
                        agentId: data.agentId,
                        status: 'ACTIVE',
                    },
                    include: {
                        agent: {
                            select: { id: true, name: true },
                        },
                    },
                });

                io?.to(`chat_${data.sessionId}`).emit('chat_accepted', {
                    sessionId: data.sessionId,
                    agent: session.agent,
                });
            } catch (error) {
                console.error('Error accepting chat:', error);
            }
        });

        // Close chat
        socket.on('close_chat', async (data: { sessionId: number; closedBy: number }) => {
            try {
                await prisma.chatSession.update({
                    where: { id: data.sessionId },
                    data: {
                        status: 'CLOSED',
                        endedAt: new Date(),
                    },
                });

                io?.to(`chat_${data.sessionId}`).emit('chat_closed', {
                    sessionId: data.sessionId,
                    closedBy: data.closedBy,
                });
            } catch (error) {
                console.error('Error closing chat:', error);
            }
        });

        // === TICKET PRESENCE ===

        // Join ticket viewing
        socket.on('join_ticket', (data: TicketPresencePayload) => {
            const roomName = `ticket_${data.ticketId}`;
            socket.join(roomName);

            // Track viewer
            if (!ticketViewers.has(data.ticketId)) {
                ticketViewers.set(data.ticketId, new Map());
            }
            ticketViewers.get(data.ticketId)?.set(socket.id, {
                id: data.userId,
                name: data.userName,
                socketId: socket.id,
            });

            // Notify others
            const viewers = Array.from(ticketViewers.get(data.ticketId)?.values() || [])
                .filter(v => v.socketId !== socket.id);

            socket.to(roomName).emit('viewer_joined', {
                ticketId: data.ticketId,
                viewer: { id: data.userId, name: data.userName },
                allViewers: viewers,
            });

            // Send current viewers to the joining user
            socket.emit('current_viewers', {
                ticketId: data.ticketId,
                viewers: viewers,
            });
        });

        // Leave ticket viewing
        socket.on('leave_ticket', (data: { ticketId: number }) => {
            const roomName = `ticket_${data.ticketId}`;
            const viewer = ticketViewers.get(data.ticketId)?.get(socket.id);

            socket.leave(roomName);
            ticketViewers.get(data.ticketId)?.delete(socket.id);

            if (viewer) {
                socket.to(roomName).emit('viewer_left', {
                    ticketId: data.ticketId,
                    viewer: { id: viewer.id, name: viewer.name },
                });
            }
        });

        // Disconnect - clean up all ticket viewers
        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);

            // Clean up from all ticket rooms
            ticketViewers.forEach((viewers, ticketId) => {
                const viewer = viewers.get(socket.id);
                if (viewer) {
                    viewers.delete(socket.id);
                    io?.to(`ticket_${ticketId}`).emit('viewer_left', {
                        ticketId,
                        viewer: { id: viewer.id, name: viewer.name },
                    });
                }
            });
        });
    });

    return io;
};

// Utility to emit events from API routes
export const emitToChat = (sessionId: number, event: string, data: unknown) => {
    io?.to(`chat_${sessionId}`).emit(event, data);
};

// Emit notification to specific user
export const emitNotification = (userId: number, notification: any) => {
    // In a real app, we would map userId to socketId.
    // For now, we broadcast to a room named user_{userId} if we implement user rooms,
    // or just broadcast to everyone and let client filter (not secure but simple for MVP).
    // Better approach: Since we don't have user->socket mapping yet, let's emit to all and filter on client.
    io?.emit('notification', { userId, notification });
};
