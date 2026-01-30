'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Widget from './Widget';

interface PerformanceData {
    avgResponseTime: number;
    avgResolutionTime: number;
    satisfactionScore: number;
    ticketsHandled: number;
}

interface PerformanceWidgetProps {
    data: PerformanceData | null;
    loading?: boolean;
    editMode?: boolean;
    onRemove?: () => void;
}

export default function PerformanceWidget({
    data,
    loading = false,
    editMode = false,
    onRemove,
}: PerformanceWidgetProps) {
    const formatTime = (hours: number) => {
        if (hours < 1) return `${Math.round(hours * 60)} dk`;
        if (hours < 24) return `${hours.toFixed(1)} saat`;
        return `${(hours / 24).toFixed(1)} gün`;
    };

    const metrics = [
        {
            label: 'Ort. İlk Yanıt',
            value: data ? formatTime(data.avgResponseTime) : '-',
            trend: 'down',
            trendValue: '-15%',
        },
        {
            label: 'Ort. Çözüm Süresi',
            value: data ? formatTime(data.avgResolutionTime) : '-',
            trend: 'neutral',
            trendValue: '0%',
        },
        {
            label: 'Memnuniyet',
            value: data?.satisfactionScore ? `${data.satisfactionScore.toFixed(1)}/5` : '-',
            trend: 'up',
            trendValue: '+5%',
        },
        {
            label: 'Çözülen Ticket',
            value: data?.ticketsHandled || 0,
            trend: 'up',
            trendValue: '+12%',
        },
    ];

    return (
        <Widget
            title="Performans"
            icon={<TrendingUp size={16} />}
            loading={loading}
            editMode={editMode}
            onRemove={onRemove}
        >
            <div className="metrics-grid">
                {metrics.map((metric, i) => (
                    <div key={i} className="metric-item">
                        <div className="metric-header">
                            <span className="metric-label">{metric.label}</span>
                            <span className={`trend ${metric.trend}`}>
                                {metric.trend === 'up' && <TrendingUp size={12} />}
                                {metric.trend === 'down' && <TrendingDown size={12} />}
                                {metric.trend === 'neutral' && <Minus size={12} />}
                                {metric.trendValue}
                            </span>
                        </div>
                        <div className="metric-value">{metric.value}</div>
                    </div>
                ))}
            </div>

            <style jsx>{`
                .metrics-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 1rem;
                }

                .metric-item {
                    padding: 0.5rem 0;
                }

                .metric-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 0.25rem;
                }

                .metric-label {
                    font-size: 0.6875rem;
                    color: var(--gray-500);
                    text-transform: uppercase;
                    letter-spacing: 0.02em;
                }

                .trend {
                    display: flex;
                    align-items: center;
                    gap: 0.125rem;
                    font-size: 0.625rem;
                    font-weight: 500;
                }

                .trend.up { color: var(--success-600); }
                .trend.down { color: var(--danger-600); }
                .trend.neutral { color: var(--gray-400); }

                .metric-value {
                    font-size: 1.125rem;
                    font-weight: 700;
                    color: var(--gray-900);
                }
            `}</style>
        </Widget>
    );
}
