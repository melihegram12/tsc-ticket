'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { socket } from '@/lib/socket-client';
import { Send, User } from 'lucide-react';

interface Message {
    id: number;
    message: string;
    senderId: number;
    sender: { name: string };
    createdAt: string;
}

export default function CustomerChatPanel() {
    const { data: session } = useSession();
    const [sessionId, setSessionId] = useState<number | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [status, setStatus] = useState<'WAITING' | 'ACTIVE' | 'CLOSED'>('WAITING');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initial load - check for active session
    useEffect(() => {
        if (!session?.user) return;

        const checkActiveSession = async () => {
            try {
                const res = await fetch('/api/chat/active');
                if (res.ok) {
                    const data = await res.json();
                    if (data.session) {
                        setSessionId(data.session.id);
                        setMessages(data.session.messages || []);
                        setStatus(data.session.status);

                        // Join socket room
                        if (socket.connected) {
                            socket.emit('join_chat', {
                                sessionId: data.session.id,
                                userId: parseInt(session.user.id)
                            });
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to check active session:', error);
            }
        };

        checkActiveSession();
    }, [session]);

    // Socket listeners
    useEffect(() => {
        if (!sessionId) return;

        const handleNewMessage = (msg: Message) => {
            setMessages(prev => [...prev, msg]);
            scrollToBottom();
        };

        const handleChatAccepted = (data: any) => {
            if (data.sessionId === sessionId) {
                setStatus('ACTIVE');
            }
        };

        const handleChatClosed = (data: any) => {
            if (data.sessionId === sessionId) {
                setStatus('CLOSED');
            }
        };

        socket.on('new_message', handleNewMessage);
        socket.on('chat_accepted', handleChatAccepted);
        socket.on('chat_closed', handleChatClosed);

        return () => {
            socket.off('new_message', handleNewMessage);
            socket.off('chat_accepted', handleChatAccepted);
            socket.off('chat_closed', handleChatClosed);
        };
    }, [sessionId]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const startChat = async () => {
        try {
            const res = await fetch('/api/chat/start', { method: 'POST' });
            if (res.ok) {
                const data = await res.json();
                setSessionId(data.id);
                setStatus('WAITING');

                socket.emit('join_chat', {
                    sessionId: data.id,
                    userId: parseInt(session?.user.id || '0')
                });
            }
        } catch (error) {
            console.error('Failed to start chat:', error);
        }
    };

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !sessionId) return;

        const msg = newMessage;
        setNewMessage('');

        socket.emit('send_message', {
            sessionId,
            senderId: parseInt(session?.user.id || '0'),
            message: msg
        });
    };

    if (!sessionId || status === 'CLOSED') {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <User size={32} className="text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Canlı Destek</h2>
                <p className="text-gray-500 text-center mb-6 max-w-md">
                    Destek ekibimizle anlık olarak görüşmek için yeni bir sohbet başlatabilirsiniz.
                </p>
                <button
                    onClick={startChat}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                    Sohbet Başlat
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <div>
                    <h2 className="font-semibold text-gray-800">Destek Ekibi</h2>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                        status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                        {status === 'ACTIVE' ? 'Çevrimiçi' : 'Temsilci Bekleniyor...'}
                    </span>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                {messages.map((msg, idx) => {
                    const isMe = msg.senderId === parseInt(session?.user.id || '0');
                    return (
                        <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] rounded-lg p-3 ${
                                isMe ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-800'
                            }`}>
                                <p className="text-sm">{msg.message}</p>
                                <span className={`text-[10px] block mt-1 ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                                    {new Date(msg.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} className="p-4 border-t border-gray-200 bg-white">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Mesajınızı yazın..."
                        className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send size={20} />
                    </button>
                </div>
            </form>
        </div>
    );
}
