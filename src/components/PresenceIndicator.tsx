'use client';

import { useEffect, useState, useCallback } from 'react';
import { Users, Eye } from 'lucide-react';

interface Viewer {
    id: number;
    name: string;
    initials: string;
}

interface PresenceIndicatorProps {
    ticketId: number;
}

export default function PresenceIndicator({ ticketId }: PresenceIndicatorProps) {
    const [viewers, setViewers] = useState<Viewer[]>([]);
    const [showTooltip, setShowTooltip] = useState(false);

    const updatePresence = useCallback(async () => {
        try {
            const res = await fetch(`/api/tickets/${ticketId}/presence`, { method: 'POST' });
            if (res.ok) {
                const data = await res.json();
                setViewers(data.viewers || []);
            }
        } catch (error) {
            console.error('Presence update failed:', error);
        }
    }, [ticketId]);

    const leavePresence = useCallback(async () => {
        try {
            await fetch(`/api/tickets/${ticketId}/presence`, { method: 'DELETE' });
        } catch (error) {
            console.error('Leave presence failed:', error);
        }
    }, [ticketId]);

    useEffect(() => {
        // Register presence immediately
        updatePresence();

        // Heartbeat every 15 seconds
        const interval = setInterval(updatePresence, 15000);

        // Clean up on unmount
        return () => {
            clearInterval(interval);
            leavePresence();
        };
    }, [updatePresence, leavePresence]);

    if (viewers.length === 0) return null;

    return (
        <div
            className="presence-indicator"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
            <div className="presence-badge">
                <Eye size={14} />
                <span className="viewer-count">{viewers.length}</span>
            </div>

            {showTooltip && (
                <div className="presence-tooltip">
                    <div className="tooltip-header">
                        <Users size={14} />
                        <span>Şu an görüntülüyor</span>
                    </div>
                    <div className="viewer-list">
                        {viewers.map(v => (
                            <div key={v.id} className="viewer-item">
                                <div className="viewer-avatar">{v.initials}</div>
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
