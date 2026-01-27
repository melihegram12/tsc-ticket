'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { MessageCircle, X, Send, Minimize2, Loader2 } from 'lucide-react';
import {
    getSocket,
    joinChat,
    leaveChat,
    sendMessage as socketSendMessage,
    sendTyping,
    markAsRead,
} from '@/lib/socket-client';

interface Message {
    id: number;
    message: string;
    sentAt: string;
    senderId: number;
    sender: {
        id: number;
        name: string;
        avatarUrl?: string;
    };
}

interface ChatSession {
    id: number;
    status: string;
    subject: string;
    agent?: {
        id: number;
        name: string;
    };
}

export default function ChatWidget() {
    const { data: session } = useSession();
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [chatSession, setChatSession] = useState<ChatSession | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [typingUser, setTypingUser] = useState<string | null>(null);
    const [socketConnected, setSocketConnected] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Don't show widget for agents
    if (session?.user?.role !== 'Requester') {
        return null;
    }

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
            console.log('ChatWidget: Socket connected');
            setSocketConnected(true);
        });

        socket.on('disconnect', () => {
            console.log('ChatWidget: Socket disconnected');
            setSocketConnected(false);
        });

        // Listen for new messages
        socket.on('new_message', (message: Message) => {
            setMessages(prev => {
                // Avoid duplicates
                if (prev.some(m => m.id === message.id)) return prev;
                return [...prev, message];
            });
        });

        // Listen for chat accepted
        socket.on('chat_accepted', (data: { sessionId: number; agent: { id: number; name: string } }) => {
            setChatSession(prev => {
                if (prev && prev.id === data.sessionId) {
                    return { ...prev, status: 'ACTIVE', agent: data.agent };
                }
                return prev;
            });
        });

        // Listen for chat closed
        socket.on('chat_closed', (data: { sessionId: number }) => {
            setChatSession(prev => {
                if (prev && prev.id === data.sessionId) {
                    return { ...prev, status: 'CLOSED' };
                }
                return prev;
            });
        });

        // Listen for typing indicator
        socket.on('user_typing', (data: { userId: number; userName: string; isTyping: boolean }) => {
            if (data.userId !== parseInt(session?.user?.id || '0')) {
                if (data.isTyping) {
                    setTypingUser(data.userName);
                } else {
                    setTypingUser(null);
                }
            }
        });

        return () => {
            socket.off('connect');
            socket.off('disconnect');
            socket.off('new_message');
            socket.off('chat_accepted');
            socket.off('chat_closed');
            socket.off('user_typing');
        };
    }, [session]);

    // Join chat room when session is active
    useEffect(() => {
        if (chatSession && session?.user && socketConnected) {
            joinChat(chatSession.id, parseInt(session.user.id));
            markAsRead(chatSession.id, parseInt(session.user.id));

            return () => {
                leaveChat(chatSession.id, parseInt(session.user.id));
            };
        }
    }, [chatSession, session, socketConnected]);

    const startChat = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/chat/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subject: 'Canlı Destek' }),
            });
            const data = await res.json();
            setChatSession(data);
            fetchMessages(data.id);
        } catch (error) {
            console.error('Error starting chat:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (sessionId: number) => {
        try {
            const res = await fetch(`/api/chat/sessions/${sessionId}/messages`);
            const data = await res.json();
            setMessages(data);
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const handleTyping = useCallback(() => {
        if (chatSession && session?.user) {
            if (!isTyping) {
                setIsTyping(true);
                sendTyping(chatSession.id, parseInt(session.user.id), session.user.name || '', true);
            }

            // Clear existing timeout
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            // Set new timeout to stop typing indicator
            typingTimeoutRef.current = setTimeout(() => {
                setIsTyping(false);
                if (chatSession && session?.user) {
                    sendTyping(chatSession.id, parseInt(session.user.id), session.user.name || '', false);
                }
            }, 2000);
        }
    }, [chatSession, session, isTyping]);

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !chatSession || !session?.user) return;

        const messageText = newMessage.trim();
        setNewMessage('');
        setSending(true);

        // Stop typing indicator
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        setIsTyping(false);
        sendTyping(chatSession.id, parseInt(session.user.id), session.user.name || '', false);

        try {
            // Send via WebSocket for real-time
            socketSendMessage(chatSession.id, parseInt(session.user.id), messageText);

            // Also send via API to ensure persistence
            await fetch(`/api/chat/sessions/${chatSession.id}/messages`, {
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

    const openChat = () => {
        setIsOpen(true);
        setIsMinimized(false);
        if (!chatSession) {
            startChat();
        }
    };

    if (!isOpen) {
        return (
            <>
                <button className="chat-fab" onClick={openChat}>
                    <MessageCircle size={24} />
                    <span className="fab-label">Canlı Destek</span>
                </button>
                <style jsx>{`
                    .chat-fab {
                        position: fixed;
                        bottom: 24px;
                        right: 24px;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        padding: 14px 20px;
                        background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
                        color: white;
                        border: none;
                        border-radius: 50px;
                        font-weight: 600;
                        font-size: 0.875rem;
                        cursor: pointer;
                        box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4);
                        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                        z-index: 1000;
                    }
                    .chat-fab:hover {
                        transform: translateY(-4px) scale(1.02);
                        box-shadow: 0 12px 32px rgba(59, 130, 246, 0.5);
                    }
                    .fab-label {
                        display: block;
                    }
                    @media (max-width: 640px) {
                        .fab-label { display: none; }
                        .chat-fab { padding: 16px; border-radius: 50%; }
                    }
                `}</style>
            </>
        );
    }

    return (
        <>
            <div className={`chat-widget ${isMinimized ? 'minimized' : ''}`}>
                <div className="chat-header">
                    <div className="header-info">
                        <div className="header-avatar">
                            <MessageCircle size={20} />
                        </div>
                        <div>
                            <h4>Canlı Destek</h4>
                            {chatSession?.agent ? (
                                <span className="agent-name">{chatSession.agent.name}</span>
                            ) : (
                                <span className="status-text">
                                    {socketConnected ? 'Bağlandı' : 'Bağlanıyor...'}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="header-actions">
                        <button onClick={() => setIsMinimized(!isMinimized)}>
                            <Minimize2 size={18} />
                        </button>
                        <button onClick={() => setIsOpen(false)}>
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {!isMinimized && (
                    <>
                        <div className="chat-messages">
                            {loading ? (
                                <div className="loading">
                                    <Loader2 className="spinner" size={24} />
                                    <span>Bağlanıyor...</span>
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="welcome-message">
                                    <p>Size nasıl yardımcı olabiliriz?</p>
                                    <p className="sub">Mesajınızı yazın, destek ekibimiz en kısa sürede yanıtlayacaktır.</p>
                                </div>
                            ) : (
                                messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`message ${msg.senderId === parseInt(session?.user?.id || '0') ? 'sent' : 'received'}`}
                                    >
                                        <div className="message-content">{msg.message}</div>
                                        <div className="message-time">
                                            {new Date(msg.sentAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                ))
                            )}
                            {typingUser && (
                                <div className="typing-indicator">
                                    <span>{typingUser} yazıyor</span>
                                    <div className="typing-dots">
                                        <span></span><span></span><span></span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <form className="chat-input" onSubmit={sendMessage}>
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="Mesajınızı yazın..."
                                value={newMessage}
                                onChange={(e) => {
                                    setNewMessage(e.target.value);
                                    handleTyping();
                                }}
                                disabled={sending || chatSession?.status === 'CLOSED'}
                            />
                            <button type="submit" disabled={!newMessage.trim() || sending}>
                                {sending ? <Loader2 className="spinner" size={18} /> : <Send size={18} />}
                            </button>
                        </form>
                    </>
                )}
            </div>

            <style jsx>{`
                .chat-widget {
                    position: fixed;
                    bottom: 24px;
                    right: 24px;
                    width: 380px;
                    max-height: 600px;
                    background: white;
                    border-radius: 16px;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    z-index: 1000;
                    animation: slideUp 0.3s ease-out;
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .chat-widget.minimized {
                    max-height: 60px;
                }
                .chat-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 16px;
                    background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
                    color: white;
                }
                .header-info {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .header-avatar {
                    width: 40px;
                    height: 40px;
                    background: rgba(255,255,255,0.2);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .header-info h4 {
                    margin: 0;
                    font-size: 1rem;
                    font-weight: 600;
                }
                .agent-name, .status-text {
                    font-size: 0.75rem;
                    opacity: 0.9;
                }
                .header-actions {
                    display: flex;
                    gap: 4px;
                }
                .header-actions button {
                    background: rgba(255,255,255,0.1);
                    border: none;
                    color: white;
                    padding: 8px;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: background 0.2s;
                }
                .header-actions button:hover {
                    background: rgba(255,255,255,0.2);
                }
                .chat-messages {
                    flex: 1;
                    overflow-y: auto;
                    padding: 16px;
                    min-height: 300px;
                    max-height: 400px;
                    background: var(--gray-50);
                }
                .loading {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 200px;
                    color: var(--gray-500);
                    gap: 8px;
                }
                .loading :global(.spinner) {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                .welcome-message {
                    text-align: center;
                    padding: 40px 20px;
                    color: var(--gray-600);
                }
                .welcome-message p {
                    margin: 0;
                    font-size: 1rem;
                }
                .welcome-message .sub {
                    font-size: 0.875rem;
                    color: var(--gray-500);
                    margin-top: 8px;
                }
                .message {
                    max-width: 80%;
                    margin-bottom: 12px;
                    animation: fadeIn 0.2s ease;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .message.sent {
                    margin-left: auto;
                }
                .message-content {
                    padding: 12px 16px;
                    border-radius: 16px;
                    font-size: 0.875rem;
                    line-height: 1.4;
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
                    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
                }
                .message-time {
                    font-size: 0.6875rem;
                    color: var(--gray-400);
                    margin-top: 4px;
                    text-align: right;
                }
                .message.received .message-time {
                    text-align: left;
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
                .chat-input {
                    display: flex;
                    gap: 8px;
                    padding: 16px;
                    background: white;
                    border-top: 1px solid var(--gray-100);
                }
                .chat-input input {
                    flex: 1;
                    padding: 12px 16px;
                    border: 1px solid var(--gray-200);
                    border-radius: 24px;
                    font-size: 0.875rem;
                    outline: none;
                    transition: border-color 0.2s;
                }
                .chat-input input:focus {
                    border-color: var(--primary-500);
                }
                .chat-input button {
                    width: 44px;
                    height: 44px;
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
                .chat-input button:hover:not(:disabled) {
                    transform: scale(1.05);
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
                }
                .chat-input button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                .chat-input button :global(.spinner) {
                    animation: spin 1s linear infinite;
                }
                @media (max-width: 640px) {
                    .chat-widget {
                        width: calc(100vw - 32px);
                        max-height: calc(100vh - 100px);
                        bottom: 16px;
                        right: 16px;
                    }
                }
            `}</style>
        </>
    );
}
