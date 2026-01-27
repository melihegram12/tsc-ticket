'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import {
    MessageSquare,
    Send,
    X,
    Clock,
    User,
    CheckCircle,
    Loader2,
    RefreshCw,
    Wifi,
    WifiOff,
} from 'lucide-react';
import {
    getSocket,
    joinChat,
    leaveChat,
    sendMessage as socketSendMessage,
    sendTyping,
    markAsRead,
    acceptChat as socketAcceptChat,
    closeChat as socketCloseChat,
} from '@/lib/socket-client';

interface ChatSession {
    id: number;
    status: string;
    subject: string;
    createdAt: string;
    updatedAt: string;
    customer: {
        id: number;
        name: string;
        email: string;
        avatarUrl?: string;
    };
    agent?: {
        id: number;
        name: string;
    };
    messages: Message[];
    _count?: {
        messages: number;
    };
}

interface Message {
    id: number;
    message: string;
    sentAt: string;
    isRead: boolean;
    senderId: number;
    sender: {
        id: number;
        name: string;
        avatarUrl?: string;
    };
}

export default function AgentChatPanel() {
    const { data: session } = useSession();
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [filter, setFilter] = useState<'active' | 'waiting' | 'mine'>('active');
    const [socketConnected, setSocketConnected] = useState(false);
    const [typingUsers, setTypingUsers] = useState<Map<number, string>>(new Map());
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Initialize socket connection
    useEffect(() => {
        const socket = getSocket();

        socket.on('connect', () => {
            console.log('AgentChatPanel: Socket connected');
            setSocketConnected(true);
        });

        socket.on('disconnect', () => {
            console.log('AgentChatPanel: Socket disconnected');
            setSocketConnected(false);
        });

        // Listen for new messages
        socket.on('new_message', (message: Message) => {
            setMessages(prev => {
                if (prev.some(m => m.id === message.id)) return prev;
                return [...prev, message];
            });
        });

        // Listen for chat accepted
        socket.on('chat_accepted', (data: { sessionId: number; agent: { id: number; name: string } }) => {
            setSessions(prev => prev.map(s => {
                if (s.id === data.sessionId) {
                    return { ...s, status: 'ACTIVE', agent: data.agent };
                }
                return s;
            }));
            setActiveSession(prev => {
                if (prev && prev.id === data.sessionId) {
                    return { ...prev, status: 'ACTIVE', agent: data.agent };
                }
                return prev;
            });
        });

        // Listen for chat closed
        socket.on('chat_closed', (data: { sessionId: number }) => {
            setSessions(prev => prev.map(s => {
                if (s.id === data.sessionId) {
                    return { ...s, status: 'CLOSED' };
                }
                return s;
            }));
            setActiveSession(prev => {
                if (prev && prev.id === data.sessionId) {
                    return { ...prev, status: 'CLOSED' };
                }
                return prev;
            });
        });

        // Listen for typing indicator
        socket.on('user_typing', (data: { userId: number; userName: string; isTyping: boolean }) => {
            if (data.userId !== parseInt(session?.user?.id || '0')) {
                setTypingUsers(prev => {
                    const newMap = new Map(prev);
                    if (data.isTyping) {
                        newMap.set(data.userId, data.userName);
                    } else {
                        newMap.delete(data.userId);
                    }
                    return newMap;
                });
            }
        });

        // Listen for new chat sessions (for notifications)
        socket.on('new_chat_session', () => {
            fetchSessions();
        });

        return () => {
            socket.off('connect');
            socket.off('disconnect');
            socket.off('new_message');
            socket.off('chat_accepted');
            socket.off('chat_closed');
            socket.off('user_typing');
            socket.off('new_chat_session');
        };
    }, [session]);

    // Join active chat room
    useEffect(() => {
        if (activeSession && session?.user && socketConnected) {
            joinChat(activeSession.id, parseInt(session.user.id));
            markAsRead(activeSession.id, parseInt(session.user.id));

            return () => {
                leaveChat(activeSession.id, parseInt(session.user.id));
            };
        }
    }, [activeSession, session, socketConnected]);

    const fetchSessions = async () => {
        try {
            const res = await fetch(`/api/chat/sessions?status=${filter}`);
            const data = await res.json();
            setSessions(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching sessions:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions();
        // Reduced polling frequency since we have WebSocket
        const interval = setInterval(fetchSessions, 30000);
        return () => clearInterval(interval);
    }, [filter]);

    const selectSession = async (chatSession: ChatSession) => {
        setActiveSession(chatSession);
        try {
            const res = await fetch(`/api/chat/sessions/${chatSession.id}/messages`);
            const data = await res.json();
            setMessages(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const acceptChat = async (sessionId: number) => {
        if (!session?.user) return;

        try {
            // Use Socket.io for real-time update
            socketAcceptChat(sessionId, parseInt(session.user.id));

            // Also call API for persistence
            await fetch(`/api/chat/sessions/${sessionId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'accept' }),
            });
            fetchSessions();
        } catch (error) {
            console.error('Error accepting chat:', error);
        }
    };

    const closeChat = async (sessionId: number) => {
        if (!session?.user) return;

        try {
            // Use Socket.io for real-time update
            socketCloseChat(sessionId, parseInt(session.user.id));

            // Also call API for persistence
            await fetch(`/api/chat/sessions/${sessionId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'close' }),
            });
            setActiveSession(null);
            fetchSessions();
        } catch (error) {
            console.error('Error closing chat:', error);
        }
    };

    const handleTyping = useCallback(() => {
        if (activeSession && session?.user) {
            if (!isTyping) {
                setIsTyping(true);
                sendTyping(activeSession.id, parseInt(session.user.id), session.user.name || '', true);
            }

            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            typingTimeoutRef.current = setTimeout(() => {
                setIsTyping(false);
                if (activeSession && session?.user) {
                    sendTyping(activeSession.id, parseInt(session.user.id), session.user.name || '', false);
                }
            }, 2000);
        }
    }, [activeSession, session, isTyping]);

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeSession || !session?.user) return;

        const messageText = newMessage.trim();
        setNewMessage('');
        setSending(true);

        // Stop typing indicator
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        setIsTyping(false);
        sendTyping(activeSession.id, parseInt(session.user.id), session.user.name || '', false);

        try {
            // Send via WebSocket for real-time
            socketSendMessage(activeSession.id, parseInt(session.user.id), messageText);

            // Also send via API to ensure persistence
            await fetch(`/api/chat/sessions/${activeSession.id}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: messageText }),
            });

            inputRef.current?.focus();
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setSending(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'WAITING':
                return <span className="badge badge-warning">Bekliyor</span>;
            case 'ACTIVE':
                return <span className="badge badge-success">Aktif</span>;
            case 'CLOSED':
                return <span className="badge badge-gray">Kapandı</span>;
            default:
                return null;
        }
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const mins = Math.floor(diff / 60000);

        if (mins < 1) return 'Şimdi';
        if (mins < 60) return `${mins} dk önce`;
        if (mins < 1440) return `${Math.floor(mins / 60)} saat önce`;
        return date.toLocaleDateString('tr-TR');
    };

    const typingUsersList = Array.from(typingUsers.values());

    return (
        <div className="agent-chat-panel">
            {/* Sessions List */}
            <div className="sessions-list">
                <div className="sessions-header">
                    <h2>
                        <MessageSquare size={20} /> Canlı Destek
                        {socketConnected ? (
                            <Wifi size={14} className="connection-icon connected" />
                        ) : (
                            <WifiOff size={14} className="connection-icon disconnected" />
                        )}
                    </h2>
                    <button className="btn btn-ghost btn-sm" onClick={fetchSessions}>
                        <RefreshCw size={16} />
                    </button>
                </div>

                <div className="filter-tabs">
                    <button
                        className={`tab ${filter === 'active' ? 'active' : ''}`}
                        onClick={() => setFilter('active')}
                    >
                        Aktif
                    </button>
                    <button
                        className={`tab ${filter === 'waiting' ? 'active' : ''}`}
                        onClick={() => setFilter('waiting')}
                    >
                        Bekleyen
                    </button>
                    <button
                        className={`tab ${filter === 'mine' ? 'active' : ''}`}
                        onClick={() => setFilter('mine')}
                    >
                        Benim
                    </button>
                </div>

                <div className="sessions">
                    {loading ? (
                        <div className="loading">
                            <Loader2 className="spinner" size={24} />
                        </div>
                    ) : sessions.length === 0 ? (
                        <div className="empty">
                            <MessageSquare size={32} />
                            <p>Aktif chat yok</p>
                        </div>
                    ) : (
                        sessions.map((s) => (
                            <div
                                key={s.id}
                                className={`session-item ${activeSession?.id === s.id ? 'active' : ''}`}
                                onClick={() => selectSession(s)}
                            >
                                <div className="session-avatar">
                                    {s.customer.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="session-info">
                                    <div className="session-header">
                                        <span className="customer-name">{s.customer.name}</span>
                                        <span className="time">{formatTime(s.updatedAt)}</span>
                                    </div>
                                    <div className="session-preview">
                                        {s.messages?.[0]?.message?.substring(0, 40) || 'Yeni sohbet'}
                                        {(s.messages?.[0]?.message?.length || 0) > 40 ? '...' : ''}
                                    </div>
                                    <div className="session-meta">
                                        {getStatusBadge(s.status)}
                                        {s._count?.messages && s._count.messages > 0 && (
                                            <span className="unread-count">{s._count.messages}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Window */}
            <div className="chat-window">
                {!activeSession ? (
                    <div className="no-chat">
                        <MessageSquare size={48} />
                        <h3>Chat Seçin</h3>
                        <p>Görüntülemek için soldaki listeden bir chat seçin</p>
                    </div>
                ) : (
                    <>
                        <div className="chat-header">
                            <div className="customer-info">
                                <div className="avatar">
                                    {activeSession.customer.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h4>{activeSession.customer.name}</h4>
                                    <span>{activeSession.customer.email}</span>
                                </div>
                            </div>
                            <div className="chat-actions">
                                {activeSession.status === 'WAITING' && (
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={() => acceptChat(activeSession.id)}
                                    >
                                        <CheckCircle size={16} />
                                        Chati Al
                                    </button>
                                )}
                                {activeSession.status !== 'CLOSED' && (
                                    <button
                                        className="btn btn-danger btn-sm"
                                        onClick={() => closeChat(activeSession.id)}
                                    >
                                        <X size={16} />
                                        Kapat
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="messages">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`message ${msg.senderId === parseInt(session?.user?.id || '0') ? 'sent' : 'received'}`}
                                >
                                    <div className="message-sender">{msg.sender.name}</div>
                                    <div className="message-content">{msg.message}</div>
                                    <div className="message-time">
                                        {new Date(msg.sentAt).toLocaleTimeString('tr-TR', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </div>
                                </div>
                            ))}
                            {typingUsersList.length > 0 && (
                                <div className="typing-indicator">
                                    <span>{typingUsersList.join(', ')} yazıyor</span>
                                    <div className="typing-dots">
                                        <span></span><span></span><span></span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {activeSession.status !== 'CLOSED' && (
                            <form className="message-input" onSubmit={sendMessage}>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    placeholder="Mesajınızı yazın..."
                                    value={newMessage}
                                    onChange={(e) => {
                                        setNewMessage(e.target.value);
                                        handleTyping();
                                    }}
                                    disabled={sending}
                                />
                                <button type="submit" disabled={!newMessage.trim() || sending}>
                                    {sending ? <Loader2 className="spinner" size={18} /> : <Send size={18} />}
                                </button>
                            </form>
                        )}
                    </>
                )}
            </div>

            <style jsx>{`
                .agent-chat-panel {
                    display: flex;
                    gap: 1.5rem;
                    height: calc(100vh - 120px);
                    min-height: 500px;
                }
                .sessions-list {
                    width: 360px;
                    flex-shrink: 0;
                    background: white;
                    border-radius: 16px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }
                .sessions-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1.25rem;
                    border-bottom: 1px solid var(--gray-100);
                }
                .sessions-header h2 {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 1.125rem;
                    font-weight: 600;
                    margin: 0;
                }
                .sessions-header h2 :global(.connection-icon) {
                    margin-left: 4px;
                }
                .sessions-header h2 :global(.connection-icon.connected) {
                    color: var(--success-500);
                }
                .sessions-header h2 :global(.connection-icon.disconnected) {
                    color: var(--danger-500);
                }
                .filter-tabs {
                    display: flex;
                    padding: 0.75rem;
                    gap: 0.5rem;
                    border-bottom: 1px solid var(--gray-100);
                }
                .tab {
                    flex: 1;
                    padding: 0.5rem;
                    background: var(--gray-50);
                    border: none;
                    border-radius: 8px;
                    font-size: 0.8125rem;
                    font-weight: 500;
                    color: var(--gray-600);
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .tab.active {
                    background: var(--primary-500);
                    color: white;
                }
                .sessions {
                    flex: 1;
                    overflow-y: auto;
                }
                .loading, .empty {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 200px;
                    color: var(--gray-400);
                    gap: 8px;
                }
                .loading :global(.spinner) {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                .session-item {
                    display: flex;
                    gap: 12px;
                    padding: 1rem;
                    cursor: pointer;
                    border-bottom: 1px solid var(--gray-50);
                    transition: background 0.2s;
                }
                .session-item:hover {
                    background: var(--gray-50);
                }
                .session-item.active {
                    background: var(--primary-50);
                    border-left: 3px solid var(--primary-500);
                }
                .session-avatar {
                    width: 44px;
                    height: 44px;
                    background: linear-gradient(135deg, var(--primary-400), var(--primary-600));
                    color: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 600;
                    flex-shrink: 0;
                }
                .session-info {
                    flex: 1;
                    min-width: 0;
                }
                .session-header {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 4px;
                }
                .customer-name {
                    font-weight: 600;
                    font-size: 0.875rem;
                    color: var(--gray-900);
                }
                .time {
                    font-size: 0.6875rem;
                    color: var(--gray-400);
                }
                .session-preview {
                    font-size: 0.8125rem;
                    color: var(--gray-500);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    margin-bottom: 4px;
                }
                .session-meta {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .unread-count {
                    background: var(--danger-500);
                    color: white;
                    font-size: 0.625rem;
                    font-weight: 600;
                    padding: 2px 6px;
                    border-radius: 10px;
                }
                .chat-window {
                    flex: 1;
                    background: white;
                    border-radius: 16px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }
                .no-chat {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    color: var(--gray-400);
                    gap: 8px;
                }
                .no-chat h3 {
                    color: var(--gray-600);
                    margin: 0;
                }
                .no-chat p {
                    margin: 0;
                    font-size: 0.875rem;
                }
                .chat-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1rem 1.5rem;
                    border-bottom: 1px solid var(--gray-100);
                }
                .customer-info {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .customer-info .avatar {
                    width: 44px;
                    height: 44px;
                    background: linear-gradient(135deg, var(--primary-400), var(--primary-600));
                    color: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 600;
                }
                .customer-info h4 {
                    margin: 0;
                    font-size: 1rem;
                    font-weight: 600;
                }
                .customer-info span {
                    font-size: 0.8125rem;
                    color: var(--gray-500);
                }
                .chat-actions {
                    display: flex;
                    gap: 8px;
                }
                .messages {
                    flex: 1;
                    overflow-y: auto;
                    padding: 1.5rem;
                    background: var(--gray-50);
                }
                .message {
                    max-width: 70%;
                    margin-bottom: 16px;
                    animation: fadeIn 0.2s ease;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .message.sent {
                    margin-left: auto;
                    text-align: right;
                }
                .message-sender {
                    font-size: 0.6875rem;
                    font-weight: 600;
                    color: var(--gray-500);
                    margin-bottom: 4px;
                }
                .message-content {
                    padding: 12px 16px;
                    border-radius: 16px;
                    font-size: 0.875rem;
                    line-height: 1.5;
                }
                .message.sent .message-content {
                    background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
                    color: white;
                    border-bottom-right-radius: 4px;
                }
                .message.received .message-content {
                    background: white;
                    color: var(--gray-800);
                    border-bottom-left-radius: 4px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
                }
                .message-time {
                    font-size: 0.625rem;
                    color: var(--gray-400);
                    margin-top: 4px;
                }
                .typing-indicator {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: var(--gray-500);
                    font-size: 0.75rem;
                    padding: 8px 0;
                }
                .typing-dots {
                    display: flex;
                    gap: 3px;
                }
                .typing-dots span {
                    width: 6px;
                    height: 6px;
                    background: var(--gray-400);
                    border-radius: 50%;
                    animation: typing 1.4s infinite;
                }
                .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
                .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
                @keyframes typing {
                    0%, 60%, 100% { transform: translateY(0); }
                    30% { transform: translateY(-4px); }
                }
                .message-input {
                    display: flex;
                    gap: 12px;
                    padding: 1rem 1.5rem;
                    border-top: 1px solid var(--gray-100);
                }
                .message-input input {
                    flex: 1;
                    padding: 12px 16px;
                    border: 1px solid var(--gray-200);
                    border-radius: 24px;
                    font-size: 0.875rem;
                    outline: none;
                }
                .message-input input:focus {
                    border-color: var(--primary-500);
                }
                .message-input button {
                    width: 48px;
                    height: 48px;
                    background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
                    color: white;
                    border: none;
                    border-radius: 50%;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }
                .message-input button:hover:not(:disabled) {
                    transform: scale(1.05);
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
                }
                .message-input button:disabled {
                    opacity: 0.5;
                }
                .message-input button :global(.spinner) {
                    animation: spin 1s linear infinite;
                }
                @media (max-width: 1024px) {
                    .agent-chat-panel {
                        flex-direction: column;
                    }
                    .sessions-list {
                        width: 100%;
                        max-height: 300px;
                    }
                }
            `}</style>
        </div>
    );
}
