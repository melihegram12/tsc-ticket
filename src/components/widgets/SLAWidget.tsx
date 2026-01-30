'use client';

import { Clock, AlertCircle, CheckCircle } from 'lucide-react';
import Widget from './Widget';

interface SLAData {
    onTrack: number;
    atRisk: number;
    breached: number;
    total: number;
}

interface SLAWidgetProps {
    data: SLAData | null;
    loading?: boolean;
    editMode?: boolean;
    onRemove?: () => void;
}

export default function SLAWidget({
    data,
    loading = false,
    editMode = false,
    onRemove,
}: SLAWidgetProps) {
    const percentage = data && data.total > 0
        ? Math.round((data.onTrack / data.total) * 100)
        : 0;

    return (
        <Widget
            title="SLA Durumu"
            icon={<Clock size={16} />}
            loading={loading}
            editMode={editMode}
            onRemove={onRemove}
        >
            <div className="sla-content">
                <div className="progress-ring">
                    <svg viewBox="0 0 36 36" className="ring-svg">
                        <path
                            className="ring-bg"
                            d="M18 2.0845
                               a 15.9155 15.9155 0 0 1 0 31.831
                               a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                            className="ring-progress"
                            strokeDasharray={`${percentage}, 100`}
                            d="M18 2.0845
                               a 15.9155 15.9155 0 0 1 0 31.831
                               a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                    </svg>
                    <div className="ring-text">
                        <span className="percentage">{percentage}%</span>
                        <span className="label">Uyumlu</span>
                    </div>
                </div>

                <div className="sla-stats">
                    <div className="sla-stat success">
                        <CheckCircle size={14} />
                        <span className="stat-value">{data?.onTrack || 0}</span>
                        <span className="stat-label">Zamanında</span>
                    </div>
                    <div className="sla-stat warning">
                        <AlertCircle size={14} />
                        <span className="stat-value">{data?.atRisk || 0}</span>
                        <span className="stat-label">Risk</span>
                    </div>
                    <div className="sla-stat danger">
                        <AlertCircle size={14} />
                        <span className="stat-value">{data?.breached || 0}</span>
                        <span className="stat-label">Aşılmış</span>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .sla-content {
                    display: flex;
                    align-items: center;
                    gap: 1.5rem;
                }

                .progress-ring {
                    position: relative;
                    width: 80px;
                    height: 80px;
                    flex-shrink: 0;
                }

                .ring-svg {
                    transform: rotate(-90deg);
                }

                .ring-bg {
                    fill: none;
                    stroke: var(--gray-200);
                    stroke-width: 3;
                }

                .ring-progress {
                    fill: none;
                    stroke: var(--success-500);
                    stroke-width: 3;
                    stroke-linecap: round;
                    transition: stroke-dasharray 0.6s ease;
                }

                .ring-text {
                    position: absolute;
                    inset: 0;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                }

                .percentage {
                    font-size: 1rem;
                    font-weight: 700;
                    color: var(--gray-900);
                }

                .label {
                    font-size: 0.5625rem;
                    color: var(--gray-500);
                }

                .sla-stats {
                    display: flex;
                    flex-direction: column;
                    gap: 0.625rem;
                    flex: 1;
                }

                .sla-stat {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.375rem 0.625rem;
                    border-radius: 0.375rem;
                }

                .sla-stat.success { background: var(--success-50); color: var(--success-600); }
                .sla-stat.warning { background: var(--warning-50); color: var(--warning-600); }
                .sla-stat.danger { background: var(--danger-50); color: var(--danger-600); }

                .stat-value {
                    font-weight: 600;
                    font-size: 0.875rem;
                }

                .stat-label {
                    font-size: 0.6875rem;
                    opacity: 0.8;
                }
            `}</style>
        </Widget>
    );
}
