'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Users, Eye, Wifi, WifiOff } from 'lucide-react';
import { getSocket } from '@/lib/socket-client';

interface Viewer {
    id: number;
    name: string;
}

interface PresenceIndicatorProps {
    ticketId: number;
}

export default function PresenceIndicator({ ticketId }: PresenceIndicatorProps) {
    const { data: session } = useSession();
    const [viewers, setViewers] = useState<Viewer[]>([]);
    const [showTooltip, setShowTooltip] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef<ReturnType<typeof getSocket> | null>(null);

    const getInitials = useCallback((name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }, []);

    useEffect(() => {
        if (!session?.user) return;

        const socket = getSocket();
        socketRef.current = socket;

        const userId = parseInt(session.user.id);
        const userName = session.user.name || 'Kullanıcı';

        // Connection handlers
        const handleConnect = () => {
            setIsConnected(true);
            // Join ticket room on connect
            socket.emit('join_ticket', { ticketId, userId, userName });
        };

        const handleDisconnect = () => {
            setIsConnected(false);
            setViewers([]);
        };

        // Viewer handlers
        const handleCurrentViewers = (data: { ticketId: number; viewers: Viewer[] }) => {
            if (data.ticketId === ticketId) {
                setViewers(data.viewers.filter(v => v.id !== userId));
            }
        };

        const handleViewerJoined = (data: { ticketId: number; viewer: Viewer; allViewers: Viewer[] }) => {
            if (data.ticketId === ticketId && data.viewer.id !== userId) {
                setViewers(prev => {
                    const exists = prev.some(v => v.id === data.viewer.id);
                    if (exists) return prev;
                    return [...prev, data.viewer];
                });
            }
        };

        const handleViewerLeft = (data: { ticketId: number; viewer: Viewer }) => {
            if (data.ticketId === ticketId) {
                setViewers(prev => prev.filter(v => v.id !== data.viewer.id));
            }
        };

        // Register event listeners
        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        socket.on('current_viewers', handleCurrentViewers);
        socket.on('viewer_joined', handleViewerJoined);
        socket.on('viewer_left', handleViewerLeft);

        // If already connected, join immediately
        if (socket.connected) {
            setIsConnected(true);
            socket.emit('join_ticket', { ticketId, userId, userName });
        }

        // Cleanup on unmount
        return () => {
            socket.emit('leave_ticket', { ticketId });
            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
            socket.off('current_viewers', handleCurrentViewers);
            socket.off('viewer_joined', handleViewerJoined);
            socket.off('viewer_left', handleViewerLeft);
        };
    }, [ticketId, session]);

    if (viewers.length === 0) return null;

    return (
        <div
            className="presence-indicator"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
            <div className="presence-badge">
                {isConnected ? <Eye size={14} /> : <WifiOff size={14} />}
                <span className="viewer-count">{viewers.length}</span>
            </div>

            {showTooltip && (
                <div className="presence-tooltip">
                    <div className="tooltip-header">
                        <Users size={14} />
                        <span>Şu an görüntülüyor</span>
                        {isConnected && <Wifi size={12} className="live-icon" />}
                    </div>
                    <div className="viewer-list">
                        {viewers.map(v => (
                            <div key={v.id} className="viewer-item">
                                <div className="viewer-avatar">{getInitials(v.name)}</div>
                                <span className="viewer-name">{v.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <style jsx>{`
                .presence-indicator {
                    position: relative;
                    display: inline-flex;
                }

                .presence-badge {
                    display: flex;
                    align-items: center;
                    gap: 0.375rem;
                    padding: 0.375rem 0.625rem;
                    background: linear-gradient(135deg, var(--warning-100), var(--warning-50));
                    border: 1px solid var(--warning-200);
                    border-radius: 9999px;
                    color: var(--warning-700);
                    font-size: 0.75rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .presence-badge:hover {
                    background: linear-gradient(135deg, var(--warning-200), var(--warning-100));
                    transform: scale(1.05);
                }

                .viewer-count {
                    min-width: 1rem;
                    text-align: center;
                }

                .presence-tooltip {
                    position: absolute;
                    top: calc(100% + 0.5rem);
                    right: 0;
                    background: white;
                    border-radius: 0.5rem;
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
                    border: 1px solid var(--gray-200);
                    min-width: 180px;
                    z-index: 50;
                    overflow: hidden;
                }

                .tooltip-header {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.625rem 0.875rem;
                    background: var(--gray-50);
                    border-bottom: 1px solid var(--gray-100);
                    color: var(--gray-600);
                    font-size: 0.6875rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.03em;
                }

                .live-icon {
                    margin-left: auto;
                    color: var(--success-500);
                    animation: pulse 2s infinite;
                }

                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.4; }
                }

                .viewer-list {
                    padding: 0.375rem;
                }

                .viewer-item {
                    display: flex;
                    align-items: center;
                    gap: 0.625rem;
                    padding: 0.5rem;
                    border-radius: 0.375rem;
                }

                .viewer-item:hover {
                    background: var(--gray-50);
                }

                .viewer-avatar {
                    width: 28px;
                    height: 28px;
                    background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
                    color: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.6875rem;
                    font-weight: 600;
                }

                .viewer-name {
                    font-size: 0.8125rem;
                    color: var(--gray-700);
                }
            `}</style>
        </div>
    );
}
