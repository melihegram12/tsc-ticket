'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
    Bell,
    Ticket,
    MessageSquare,
    AlertTriangle,
    User,
    Check,
    CheckCheck,
    X,
} from 'lucide-react';

interface Notification {
    id: number;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    data: string | null;
    createdAt: string;
}

export default function NotificationCenter() {
    const { data: session } = useSession();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/notifications?limit=10');
            const data = await res.json();
            if (data.notifications) {
                setNotifications(data.notifications);
                setUnreadCount(data.unreadCount || 0);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    // Initial fetch and polling
    useEffect(() => {
        if (session?.user) {
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 30000); // Poll every 30 seconds
            return () => clearInterval(interval);
        }
    }, [session]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markAsRead = async (notificationIds?: number[]) => {
        try {
            await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(
                    notificationIds ? { notificationIds } : { markAllRead: true }
                ),
            });
            fetchNotifications();
        } catch (error) {
            console.error('Error marking notifications as read:', error);
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'TICKET_CREATED':
            case 'TICKET_ASSIGNED':
            case 'TICKET_UPDATED':
                return <Ticket size={16} />;
            case 'TICKET_REPLIED':
            case 'CHAT_MESSAGE':
                return <MessageSquare size={16} />;
            case 'SLA_WARNING':
            case 'SLA_BREACH':
                return <AlertTriangle size={16} />;
            default:
                return <Bell size={16} />;
        }
    };

    const getNotificationColor = (type: string) => {
        switch (type) {
            case 'TICKET_CREATED':
                return 'var(--primary-500)';
            case 'TICKET_ASSIGNED':
                return 'var(--success-500)';
            case 'SLA_WARNING':
                return 'var(--warning-500)';
            case 'SLA_BREACH':
                return 'var(--danger-500)';
            default:
                return 'var(--gray-500)';
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
        if (mins < 10080) return `${Math.floor(mins / 1440)} gün önce`;
        return date.toLocaleDateString('tr-TR');
    };

    const getNotificationLink = (notification: Notification) => {
        try {
            const data = notification.data ? JSON.parse(notification.data) : {};
            if (data.ticketId) {
                return `/dashboard/tickets/${data.ticketId}`;
            }
            if (data.chatSessionId) {
                return '/dashboard/chat';
            }
        } catch {
            // Invalid JSON
        }
        return '/dashboard';
    };

    if (!session?.user) return null;

    return (
        <div className="notification-center" ref={dropdownRef}>
            <button
                className="notification-trigger"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Bildirimler"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
            </button>

            {isOpen && (
                <div className="notification-dropdown">
                    <div className="dropdown-header">
                        <span>Bildirimler</span>
                        {unreadCount > 0 && (
                            <button
                                className="mark-all-read"
                                onClick={() => markAsRead()}
                            >
                                <CheckCheck size={14} />
                                Tümünü Okundu İşaretle
                            </button>
                        )}
                    </div>

                    <div className="notification-list">
                        {notifications.length === 0 ? (
                            <div className="empty-state">
                                <Bell size={24} />
                                <p>Bildirim yok</p>
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <Link
                                    key={notification.id}
                                    href={getNotificationLink(notification)}
                                    className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                                    onClick={() => {
                                        if (!notification.isRead) {
                                            markAsRead([notification.id]);
                                        }
                                        setIsOpen(false);
                                    }}
                                >
                                    <div
                                        className="notification-icon"
                                        style={{ backgroundColor: getNotificationColor(notification.type) }}
                                    >
                                        {getNotificationIcon(notification.type)}
                                    </div>
                                    <div className="notification-content">
                                        <div className="notification-title">{notification.title}</div>
                                        <div className="notification-message">{notification.message}</div>
                                        <div className="notification-time">{formatTime(notification.createdAt)}</div>
                                    </div>
                                    {!notification.isRead && <div className="unread-dot" />}
                                </Link>
                            ))
                        )}
                    </div>

                    {notifications.length > 0 && (
                        <Link href="/dashboard" className="view-all" onClick={() => setIsOpen(false)}>
                            Tüm Bildirimleri Gör
                        </Link>
                    )}
                </div>
            )}

            <style jsx>{`
                .notification-center {
                    position: relative;
                }
                .notification-trigger {
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 40px;
                    height: 40px;
                    background: var(--gray-100);
                    border: none;
                    border-radius: 10px;
                    color: var(--gray-600);
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .notification-trigger:hover {
                    background: var(--gray-200);
                    color: var(--gray-800);
                }
                .badge {
                    position: absolute;
                    top: -4px;
                    right: -4px;
                    min-width: 18px;
                    height: 18px;
                    padding: 0 5px;
                    background: var(--danger-500);
                    color: white;
                    font-size: 0.6875rem;
                    font-weight: 600;
                    border-radius: 9px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    animation: pulse 2s infinite;
                }
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                }
                .notification-dropdown {
                    position: absolute;
                    top: calc(100% + 8px);
                    right: 0;
                    width: 360px;
                    max-height: 480px;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
                    overflow: hidden;
                    z-index: 1000;
                    animation: slideDown 0.2s ease;
                }
                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .dropdown-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 16px;
                    border-bottom: 1px solid var(--gray-100);
                    font-weight: 600;
                    color: var(--gray-800);
                }
                .mark-all-read {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    padding: 6px 10px;
                    background: none;
                    border: none;
                    font-size: 0.75rem;
                    color: var(--primary-600);
                    cursor: pointer;
                    border-radius: 6px;
                    transition: background 0.2s;
                }
                .mark-all-read:hover {
                    background: var(--primary-50);
                }
                .notification-list {
                    max-height: 360px;
                    overflow-y: auto;
                }
                .empty-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 40px;
                    color: var(--gray-400);
                    gap: 8px;
                }
                .notification-item {
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    padding: 12px 16px;
                    text-decoration: none;
                    border-bottom: 1px solid var(--gray-50);
                    transition: background 0.2s;
                    position: relative;
                }
                .notification-item:hover {
                    background: var(--gray-50);
                }
                .notification-item.unread {
                    background: var(--primary-50);
                }
                .notification-item.unread:hover {
                    background: var(--primary-100);
                }
                .notification-icon {
                    flex-shrink: 0;
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                }
                .notification-content {
                    flex: 1;
                    min-width: 0;
                }
                .notification-title {
                    font-size: 0.8125rem;
                    font-weight: 600;
                    color: var(--gray-800);
                    margin-bottom: 2px;
                }
                .notification-message {
                    font-size: 0.75rem;
                    color: var(--gray-600);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .notification-time {
                    font-size: 0.6875rem;
                    color: var(--gray-400);
                    margin-top: 4px;
                }
                .unread-dot {
                    width: 8px;
                    height: 8px;
                    background: var(--primary-500);
                    border-radius: 50%;
                    flex-shrink: 0;
                    margin-top: 4px;
                }
                .view-all {
                    display: block;
                    padding: 12px;
                    text-align: center;
                    font-size: 0.8125rem;
                    font-weight: 500;
                    color: var(--primary-600);
                    text-decoration: none;
                    border-top: 1px solid var(--gray-100);
                    transition: background 0.2s;
                }
                .view-all:hover {
                    background: var(--gray-50);
                }
                @media (max-width: 640px) {
                    .notification-dropdown {
                        width: calc(100vw - 32px);
                        right: -60px;
                    }
                }
            `}</style>
        </div>
    );
}
