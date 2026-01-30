'use client';

import { Ticket, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import Widget from './Widget';

interface StatsData {
    openTickets: number;
    pendingTickets: number;
    resolvedToday: number;
    slaAtRisk: number;
}

interface TicketStatsWidgetProps {
    data: StatsData | null;
    loading?: boolean;
    editMode?: boolean;
    onRemove?: () => void;
}

export default function TicketStatsWidget({
    data,
    loading = false,
    editMode = false,
    onRemove,
}: TicketStatsWidgetProps) {
    const stats = [
        {
            label: 'Açık Talepler',
            value: data?.openTickets || 0,
            icon: <Ticket size={20} />,
            color: 'primary',
        },
        {
            label: 'Beklemede',
            value: data?.pendingTickets || 0,
            icon: <Clock size={20} />,
            color: 'warning',
        },
        {
            label: 'Bugün Çözülen',
            value: data?.resolvedToday || 0,
            icon: <CheckCircle size={20} />,
            color: 'success',
        },
        {
            label: 'SLA Risk',
            value: data?.slaAtRisk || 0,
            icon: <AlertTriangle size={20} />,
            color: 'danger',
        },
    ];

    return (
        <Widget
            title="Ticket Özeti"
            icon={<Ticket size={16} />}
            loading={loading}
            editMode={editMode}
            onRemove={onRemove}
        >
            <div className="stats-grid">
                {stats.map((stat, i) => (
                    <div key={i} className={`stat-item ${stat.color}`}>
                        <div className="stat-icon">{stat.icon}</div>
                        <div className="stat-content">
                            <span className="stat-value">{stat.value}</span>
                            <span className="stat-label">{stat.label}</span>
                        </div>
                    </div>
                ))}
            </div>

            <style jsx>{`
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 0.75rem;
                }

                .stat-item {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.75rem;
                    border-radius: 0.5rem;
                    background: var(--gray-50);
                }

                .stat-item.primary { background: var(--primary-50); }
                .stat-item.warning { background: var(--warning-50); }
                .stat-item.success { background: var(--success-50); }
                .stat-item.danger { background: var(--danger-50); }

                .stat-icon {
                    display: flex;
                    color: var(--gray-500);
                }

                .stat-item.primary .stat-icon { color: var(--primary-500); }
                .stat-item.warning .stat-icon { color: var(--warning-500); }
                .stat-item.success .stat-icon { color: var(--success-500); }
                .stat-item.danger .stat-icon { color: var(--danger-500); }

                .stat-content {
                    display: flex;
                    flex-direction: column;
                }

                .stat-value {
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: var(--gray-900);
                    line-height: 1;
                }

                .stat-label {
                    font-size: 0.6875rem;
                    color: var(--gray-500);
                    margin-top: 0.125rem;
                }
            `}</style>
        </Widget>
    );
}
