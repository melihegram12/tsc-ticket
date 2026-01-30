'use client';

import Link from 'next/link';
import { List, ArrowRight } from 'lucide-react';
import Widget from './Widget';

interface RecentTicket {
    id: number;
    ticketNumber: string;
    subject: string;
    status: string;
    priority: string;
    createdAt: string;
    requester: { name: string };
}

interface RecentTicketsWidgetProps {
    tickets: RecentTicket[];
    loading?: boolean;
    editMode?: boolean;
    onRemove?: () => void;
}

const STATUS_COLORS: Record<string, string> = {
    OPEN: 'primary',
    IN_PROGRESS: 'warning',
    PENDING: 'gray',
    RESOLVED: 'success',
    CLOSED: 'gray',
};

const PRIORITY_COLORS: Record<string, string> = {
    LOW: 'gray',
    MEDIUM: 'primary',
    HIGH: 'warning',
    URGENT: 'danger',
};

export default function RecentTicketsWidget({
    tickets,
    loading = false,
    editMode = false,
    onRemove,
}: RecentTicketsWidgetProps) {
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 60) return `${diffMins} dk önce`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)} saat önce`;
        return `${Math.floor(diffMins / 1440)} gün önce`;
    };

    return (
        <Widget
            title="Son Talepler"
            icon={<List size={16} />}
            loading={loading}
            editMode={editMode}
            onRemove={onRemove}
        >
            {tickets.length === 0 ? (
                <div className="empty">Henüz talep yok</div>
            ) : (
                <>
                    <div className="ticket-list">
                        {tickets.slice(0, 5).map(ticket => (
                            <Link
                                key={ticket.id}
                                href={`/dashboard/tickets/${ticket.id}`}
                                className="ticket-item"
                            >
                                <div className="ticket-main">
                                    <span className="ticket-number">#{ticket.ticketNumber}</span>
                                    <span className="ticket-subject">{ticket.subject}</span>
                                </div>
                                <div className="ticket-meta">
                                    <span className={`badge ${STATUS_COLORS[ticket.status]}`}>
                                        {ticket.status}
                                    </span>
                                    <span className="ticket-time">{formatDate(ticket.createdAt)}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                    <Link href="/dashboard/tickets" className="view-all">
                        Tümünü Gör <ArrowRight size={14} />
                    </Link>
                </>
            )}

            <style jsx>{`
                .empty {
                    text-align: center;
                    color: var(--gray-400);
                    padding: 2rem;
                }

                .ticket-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                :global(.ticket-item) {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0.625rem 0.75rem;
                    background: var(--gray-50);
                    border-radius: 0.5rem;
                    text-decoration: none;
                    transition: all 0.15s;
                }

                :global(.ticket-item:hover) {
                    background: var(--primary-50);
                }

                .ticket-main {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    flex: 1;
                    min-width: 0;
                }

                .ticket-number {
                    font-size: 0.75rem;
                    font-weight: 600;
                    color: var(--primary-600);
                }

                .ticket-subject {
                    font-size: 0.8125rem;
                    color: var(--gray-700);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .ticket-meta {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    flex-shrink: 0;
                }

                .badge {
                    padding: 0.125rem 0.5rem;
                    font-size: 0.625rem;
                    font-weight: 500;
                    border-radius: 9999px;
                    text-transform: uppercase;
                }

                .badge.primary { background: var(--primary-100); color: var(--primary-700); }
                .badge.warning { background: var(--warning-100); color: var(--warning-700); }
                .badge.success { background: var(--success-100); color: var(--success-700); }
                .badge.danger { background: var(--danger-100); color: var(--danger-700); }
                .badge.gray { background: var(--gray-100); color: var(--gray-600); }

                .ticket-time {
                    font-size: 0.6875rem;
                    color: var(--gray-400);
                }

                :global(.view-all) {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.375rem;
                    margin-top: 0.75rem;
                    padding: 0.5rem;
                    font-size: 0.8125rem;
                    font-weight: 500;
                    color: var(--primary-600);
                    text-decoration: none;
                    border-radius: 0.375rem;
                    transition: all 0.15s;
                }

                :global(.view-all:hover) {
                    background: var(--primary-50);
                }
            `}</style>
        </Widget>
    );
}
