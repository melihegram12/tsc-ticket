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

let io: SocketIOServer | null = null;

export const getIO = () => io;

export const initSocketServer = (server: NetServer) => {
    if (io) return io;

    io = new SocketIOServer(server, {
        path: '/api/socket',
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
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

        // Disconnect
        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });

    return io;
};

// Utility to emit events from API routes
export const emitToChat = (sessionId: number, event: string, data: unknown) => {
    io?.to(`chat_${sessionId}`).emit(event, data);
};

// Emit to all connected agents (for new chat notifications)
export const emitToAgents = (event: string, data: unknown) => {
    io?.emit(event, data);
};
