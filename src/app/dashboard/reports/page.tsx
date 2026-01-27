'use client';

import { useEffect, useState } from 'react';
import {
    Loader2,
    Ticket,
    Clock,
    CheckCircle,
    AlertTriangle,
    TrendingUp,
    Users,
    Building2,
} from 'lucide-react';
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';

interface ReportData {
    overview: {
        totalTickets: number;
        openTickets: number;
        resolvedToday: number;
        closedThisMonth: number;
    };
    statusDistribution: Array<{ status: string; count: number }>;
    priorityDistribution: Array<{ priority: string; count: number }>;
    departmentStats: Array<{ name: string; count: number }>;
    dailyTrend: Array<{ date: string; created: number; resolved: number }>;
    sla: {
        onTrack: number;
        breached: number;
        compliance: number;
    };
    topAgents: Array<{ name: string; resolved: number }>;
}

const STATUS_COLORS: Record<string, string> = {
    NEW: '#3b82f6',
    OPEN: '#0ea5e9',
    WAITING_REQUESTER: '#f59e0b',
    PENDING: '#8b5cf6',
    RESOLVED: '#22c55e',
    CLOSED: '#6b7280',
    REOPENED: '#ef4444',
};

const PRIORITY_COLORS: Record<string, string> = {
    URGENT: '#dc2626',
    HIGH: '#f97316',
    NORMAL: '#eab308',
    LOW: '#22c55e',
};

const STATUS_LABELS: Record<string, string> = {
    NEW: 'Yeni',
    OPEN: 'Açık',
    WAITING_REQUESTER: 'Yanıt Bekleniyor',
    PENDING: 'Beklemede',
    RESOLVED: 'Çözüldü',
    CLOSED: 'Kapandı',
    REOPENED: 'Yeniden Açıldı',
};

const PRIORITY_LABELS: Record<string, string> = {
    URGENT: 'Acil',
    HIGH: 'Yüksek',
    NORMAL: 'Normal',
    LOW: 'Düşük',
};

export default function ReportsPage() {
    const [data, setData] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/reports');
            const json = await res.json();
            if (res.ok) {
                setData(json);
            }
        } catch (err) {
            console.error('Error fetching reports:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="loading-state">
                <Loader2 className="spin" size={32} />
                <p>Raporlar yükleniyor...</p>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="error-state">
                <AlertTriangle size={32} />
                <p>Rapor verileri yüklenemedi</p>
            </div>
        );
    }

    const statusData = data.statusDistribution.map(s => ({
        name: STATUS_LABELS[s.status] || s.status,
        value: s.count,
        color: STATUS_COLORS[s.status] || '#6b7280',
    }));

    const priorityData = data.priorityDistribution.map(p => ({
        name: PRIORITY_LABELS[p.priority] || p.priority,
        value: p.count,
        color: PRIORITY_COLORS[p.priority] || '#6b7280',
    }));

    return (
        <div className="reports-page">
            <div className="page-header">
                <h1>Raporlar</h1>
                <p>Ticket istatistikleri ve performans metrikleri</p>
            </div>

            {/* Overview Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon blue">
                        <Ticket size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{data.overview.totalTickets}</span>
                        <span className="stat-label">Toplam Ticket</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon orange">
                        <Clock size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{data.overview.openTickets}</span>
                        <span className="stat-label">Açık Ticket</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon green">
                        <CheckCircle size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{data.overview.resolvedToday}</span>
                        <span className="stat-label">Bugün Çözülen</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon purple">
                        <TrendingUp size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{data.sla.compliance}%</span>
                        <span className="stat-label">SLA Uyumu</span>
                    </div>
                </div>
            </div>

            {/* Charts Row 1 */}
            <div className="charts-row">
                <div className="chart-card">
                    <h3>Son 7 Gün Trendi</h3>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={data.dailyTrend}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                                <YAxis stroke="#6b7280" fontSize={12} />
                                <Tooltip />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="created"
                                    name="Oluşturulan"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    dot={{ r: 4 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="resolved"
                                    name="Çözülen"
                                    stroke="#22c55e"
                                    strokeWidth={2}
                                    dot={{ r: 4 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="chart-card">
                    <h3>Durum Dağılımı</h3>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={80}
                                    paddingAngle={2}
                                    dataKey="value"
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Charts Row 2 */}
            <div className="charts-row">
                <div className="chart-card">
                    <h3>Öncelik Dağılımı</h3>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={priorityData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis type="number" stroke="#6b7280" fontSize={12} />
                                <YAxis dataKey="name" type="category" stroke="#6b7280" fontSize={12} width={80} />
                                <Tooltip />
                                <Bar dataKey="value" name="Ticket Sayısı" radius={[0, 4, 4, 0]}>
                                    {priorityData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="chart-card">
                    <h3>Departman Dağılımı</h3>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={data.departmentStats}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis dataKey="name" stroke="#6b7280" fontSize={11} />
                                <YAxis stroke="#6b7280" fontSize={12} />
                                <Tooltip />
                                <Bar dataKey="count" name="Ticket" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Bottom Row */}
            <div className="charts-row">
                <div className="chart-card small">
                    <h3>
                        <AlertTriangle size={18} />
                        SLA Durumu
                    </h3>
                    <div className="sla-stats">
                        <div className="sla-item success">
                            <span className="sla-value">{data.sla.onTrack}</span>
                            <span className="sla-label">Uyumlu</span>
                        </div>
                        <div className="sla-item danger">
                            <span className="sla-value">{data.sla.breached}</span>
                            <span className="sla-label">İhlal</span>
                        </div>
                        <div className="sla-item info">
                            <span className="sla-value">{data.sla.compliance}%</span>
                            <span className="sla-label">Uyum Oranı</span>
                        </div>
                    </div>
                </div>

                <div className="chart-card small">
                    <h3>
                        <Users size={18} />
                        En İyi Ajanlar (Bu Ay)
                    </h3>
                    <div className="agents-list">
                        {data.topAgents.length === 0 ? (
                            <p className="no-data">Henüz veri yok</p>
                        ) : (
                            data.topAgents.map((agent, index) => (
                                <div key={index} className="agent-item">
                                    <div className="agent-rank">{index + 1}</div>
                                    <div className="agent-name">{agent.name}</div>
                                    <div className="agent-score">{agent.resolved} çözüm</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <style jsx>{`
                .reports-page {
                    max-width: 1400px;
                }

                .page-header {
                    margin-bottom: 1.5rem;
                }

                .page-header h1 {
                    font-size: 1.5rem;
                    font-weight: 600;
                    margin: 0;
                }

                .page-header p {
                    font-size: 0.875rem;
                    color: var(--gray-500);
                    margin: 0.25rem 0 0 0;
                }

                .loading-state,
                .error-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 4rem;
                    color: var(--gray-500);
                    gap: 1rem;
                }

                .spin {
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                }

                @media (max-width: 1024px) {
                    .stats-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }

                .stat-card {
                    background: white;
                    border-radius: 0.75rem;
                    padding: 1.25rem;
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    border: 1px solid var(--gray-200);
                }

                .stat-icon {
                    width: 48px;
                    height: 48px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 0.5rem;
                    color: white;
                }

                .stat-icon.blue { background: linear-gradient(135deg, #3b82f6, #2563eb); }
                .stat-icon.orange { background: linear-gradient(135deg, #f59e0b, #d97706); }
                .stat-icon.green { background: linear-gradient(135deg, #22c55e, #16a34a); }
                .stat-icon.purple { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }

                .stat-info {
                    display: flex;
                    flex-direction: column;
                }

                .stat-value {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: var(--gray-900);
                }

                .stat-label {
                    font-size: 0.75rem;
                    color: var(--gray-500);
                }

                .charts-row {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 1rem;
                    margin-bottom: 1rem;
                }

                @media (max-width: 768px) {
                    .charts-row {
                        grid-template-columns: 1fr;
                    }
                }

                .chart-card {
                    background: white;
                    border-radius: 0.75rem;
                    padding: 1.25rem;
                    border: 1px solid var(--gray-200);
                }

                .chart-card h3 {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.9375rem;
                    font-weight: 600;
                    margin: 0 0 1rem 0;
                    color: var(--gray-800);
                }

                .chart-container {
                    height: 250px;
                }

                .chart-card.small .chart-container {
                    height: auto;
                }

                .sla-stats {
                    display: flex;
                    gap: 1rem;
                    justify-content: space-around;
                    padding: 1rem 0;
                }

                .sla-item {
                    text-align: center;
                    padding: 1rem;
                    border-radius: 0.5rem;
                    flex: 1;
                }

                .sla-item.success { background: var(--success-50); }
                .sla-item.danger { background: var(--danger-50); }
                .sla-item.info { background: var(--primary-50); }

                .sla-value {
                    display: block;
                    font-size: 1.5rem;
                    font-weight: 700;
                }

                .sla-item.success .sla-value { color: var(--success-600); }
                .sla-item.danger .sla-value { color: var(--danger-600); }
                .sla-item.info .sla-value { color: var(--primary-600); }

                .sla-label {
                    font-size: 0.75rem;
                    color: var(--gray-600);
                }

                .agents-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .no-data {
                    text-align: center;
                    color: var(--gray-500);
                    padding: 1rem;
                    font-size: 0.875rem;
                }

                .agent-item {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.625rem 0.75rem;
                    background: var(--gray-50);
                    border-radius: 0.375rem;
                }

                .agent-rank {
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: var(--primary-500);
                    color: white;
                    font-size: 0.75rem;
                    font-weight: 600;
                    border-radius: 50%;
                }

                .agent-name {
                    flex: 1;
                    font-weight: 500;
                    color: var(--gray-800);
                }

                .agent-score {
                    font-size: 0.75rem;
                    color: var(--success-600);
                    font-weight: 500;
                }
            `}</style>
        </div>
    );
}
