'use client';

import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
    if (!socket) {
        // Initialize socket server if not running
        fetch('/api/socket/io').catch((err) => console.error('Socket init error:', err));

        socket = io({
            path: '/api/socket',
            transports: ['websocket', 'polling'],
            autoConnect: true,
        });

        socket.on('connect', () => {
            console.log('Socket connected:', socket?.id);
        });

        socket.on('disconnect', () => {
            console.log('Socket disconnected');
        });

        socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
        });
    }

    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};

// Chat-specific hooks
export const joinChat = (sessionId: number, userId: number) => {
    const sock = getSocket();
    sock.emit('join_chat', { sessionId, userId });
};

export const leaveChat = (sessionId: number, userId: number) => {
    const sock = getSocket();
    sock.emit('leave_chat', { sessionId, userId });
};

export const sendMessage = (sessionId: number, senderId: number, message: string) => {
    const sock = getSocket();
    sock.emit('send_message', { sessionId, senderId, message });
};

export const sendTyping = (sessionId: number, userId: number, userName: string, isTyping: boolean) => {
    const sock = getSocket();
    sock.emit('typing', { sessionId, userId, userName, isTyping });
};

export const markAsRead = (sessionId: number, userId: number) => {
    const sock = getSocket();
    sock.emit('mark_read', { sessionId, userId });
};

export const acceptChat = (sessionId: number, agentId: number) => {
    const sock = getSocket();
    sock.emit('accept_chat', { sessionId, agentId });
};

export const closeChat = (sessionId: number, closedBy: number) => {
    const sock = getSocket();
    sock.emit('close_chat', { sessionId, closedBy });
};
