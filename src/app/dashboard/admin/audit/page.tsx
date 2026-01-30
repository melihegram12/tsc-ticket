'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
    Loader2,
    FileText,
    ChevronLeft,
    ChevronRight,
    Filter,
    Calendar,
    User,
    Search,
    RefreshCw,
} from 'lucide-react';

interface AuditLog {
    id: number;
    action: string;
    entity: string;
    entityId?: number;
    oldValue?: Record<string, unknown>;
    newValue?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
    createdAt: string;
    user?: { id: number; name: string; email: string };
}

interface AuditResponse {
    data: AuditLog[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    filters: {
        actions: string[];
        entities: string[];
    };
}

const ACTION_LABELS: Record<string, string> = {
    LOGIN: 'Giriş',
    LOGOUT: 'Çıkış',
    LOGIN_FAILED: 'Başarısız Giriş',
    TICKET_CREATE: 'Ticket Oluşturma',
    TICKET_UPDATE: 'Ticket Güncelleme',
    TICKET_DELETE: 'Ticket Silme',
    TICKET_ASSIGN: 'Ticket Atama',
    TICKET_STATUS_CHANGE: 'Durum Değişikliği',
    USER_CREATE: 'Kullanıcı Oluşturma',
    USER_UPDATE: 'Kullanıcı Güncelleme',
    USER_DELETE: 'Kullanıcı Silme',
    DEPARTMENT_CREATE: 'Departman Oluşturma',
    DEPARTMENT_UPDATE: 'Departman Güncelleme',
    DEPARTMENT_DELETE: 'Departman Silme',
    SETTINGS_UPDATE: 'Ayar Değişikliği',
    SATISFACTION_RATED: 'Memnuniyet Puanı',
};

const ENTITY_LABELS: Record<string, string> = {
    ticket: 'Ticket',
    user: 'Kullanıcı',
    department: 'Departman',
    settings: 'Ayarlar',
    auth: 'Kimlik Doğrulama',
};

export default function AuditLogsPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [data, setData] = useState<AuditResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [showFilters, setShowFilters] = useState(false);
    const [selectedAction, setSelectedAction] = useState('');
    const [selectedEntity, setSelectedEntity] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        if (session?.user?.role !== 'Admin') {
            router.push('/dashboard');
            return;
        }
        fetchLogs();
    }, [session, page, selectedAction, selectedEntity, startDate, endDate]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.set('page', page.toString());
            if (selectedAction) params.set('action', selectedAction);
            if (selectedEntity) params.set('entity', selectedEntity);
            if (startDate) params.set('startDate', startDate);
            if (endDate) params.set('endDate', endDate);

            const res = await fetch(`/api/admin/audit?${params}`);
            if (res.ok) {
                const json = await res.json();
                setData(json);
            }
        } catch (error) {
            console.error('Error fetching audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const clearFilters = () => {
        setSelectedAction('');
        setSelectedEntity('');
        setStartDate('');
        setEndDate('');
        setPage(1);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (session?.user?.role !== 'Admin') {
        return null;
    }

    return (
        <div className="audit-page">
            <div className="page-header">
                <div>
                    <h1>Denetim Logları</h1>
                    <p>Sistem aktivitelerini izleyin</p>
                </div>
                <button className="btn btn-ghost" onClick={fetchLogs}>
                    <RefreshCw size={18} />
                    Yenile
                </button>
            </div>

            {/* Filters */}
            <div className="filters-section">
                <button
                    className={`btn btn-secondary ${showFilters ? 'active' : ''}`}
                    onClick={() => setShowFilters(!showFilters)}
                >
                    <Filter size={18} />
                    Filtreler
                </button>

                {showFilters && data && (
                    <div className="filters-panel">
                        <div className="filter-group">
                            <label>Aksiyon</label>
                            <select
                                value={selectedAction}
                                onChange={(e) => { setSelectedAction(e.target.value); setPage(1); }}
                                className="select"
                            >
                                <option value="">Tümü</option>
                                {data.filters.actions.map(action => (
                                    <option key={action} value={action}>
                                        {ACTION_LABELS[action] || action}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="filter-group">
                            <label>Varlık</label>
                            <select
                                value={selectedEntity}
                                onChange={(e) => { setSelectedEntity(e.target.value); setPage(1); }}
                                className="select"
                            >
                                <option value="">Tümü</option>
                                {data.filters.entities.map(entity => (
                                    <option key={entity} value={entity}>
                                        {ENTITY_LABELS[entity] || entity}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="filter-group">
                            <label>Başlangıç</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                                className="input"
                            />
                        </div>
                        <div className="filter-group">
                            <label>Bitiş</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                                className="input"
                            />
                        </div>
                        <button className="btn btn-ghost btn-sm" onClick={clearFilters}>
                            Temizle
                        </button>
                    </div>
                )}
            </div>

            {/* Logs Table */}
            <div className="card">
                {loading ? (
                    <div className="loading-state">
                        <Loader2 className="spin" size={24} />
                        <p>Yükleniyor...</p>
                    </div>
                ) : !data || data.data.length === 0 ? (
                    <div className="empty-state">
                        <FileText size={48} />
                        <h3>Log bulunamadı</h3>
                        <p>Filtreleri değiştirmeyi deneyin</p>
                    </div>
                ) : (
                    <>
                        <div className="table-wrapper">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Tarih</th>
                                        <th>Kullanıcı</th>
                                        <th>Aksiyon</th>
                                        <th>Varlık</th>
                                        <th>Detay</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.data.map((log) => (
                                        <tr key={log.id}>
                                            <td className="date-cell">
                                                {formatDate(log.createdAt)}
                                            </td>
                                            <td>
                                                {log.user ? (
                                                    <div className="user-cell">
                                                        <div className="avatar avatar-sm">
                                                            {log.user.name.charAt(0)}
                                                        </div>
                                                        <span>{log.user.name}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted">Sistem</span>
                                                )}
                                            </td>
                                            <td>
                                                <span className={`badge action-${log.action.toLowerCase()}`}>
                                                    {ACTION_LABELS[log.action] || log.action}
                                                </span>
                                            </td>
                                            <td>
                                                {ENTITY_LABELS[log.entity] || log.entity}
                                                {log.entityId && (
                                                    <span className="entity-id"> #{log.entityId}</span>
                                                )}
                                            </td>
                                            <td className="detail-cell">
                                                {log.newValue && (
                                                    <code className="detail-code">
                                                        {JSON.stringify(log.newValue).substring(0, 50)}...
                                                    </code>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="pagination">
                            <span className="pagination-info">
                                Toplam {data.total} kayıt
                            </span>
                            <div className="pagination-controls">
                                <button
                                    className="btn btn-ghost btn-sm"
                                    disabled={page === 1}
                                    onClick={() => setPage(p => p - 1)}
                                >
                                    <ChevronLeft size={16} />
                                    Önceki
                                </button>
                                <span className="page-indicator">
                                    Sayfa {data.page} / {data.totalPages}
                                </span>
                                <button
                                    className="btn btn-ghost btn-sm"
                                    disabled={page >= data.totalPages}
                                    onClick={() => setPage(p => p + 1)}
                                >
                                    Sonraki
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <style jsx>{`
                .audit-page {
                    max-width: 1400px;
                }

                .page-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 1.5rem;
                }

                .page-header h1 {
                    font-size: 1.5rem;
                    font-weight: 600;
                    margin: 0;
                }

                .page-header p {
                    color: var(--gray-500);
                    margin: 0.25rem 0 0 0;
                    font-size: 0.875rem;
                }

                .filters-section {
                    margin-bottom: 1rem;
                }

                .filters-panel {
                    display: flex;
                    gap: 1rem;
                    flex-wrap: wrap;
                    align-items: flex-end;
                    margin-top: 1rem;
                    padding: 1rem;
                    background: white;
                    border: 1px solid var(--gray-200);
                    border-radius: 0.5rem;
                }

                .filter-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                }

                .filter-group label {
                    font-size: 0.75rem;
                    font-weight: 500;
                    color: var(--gray-600);
                }

                .select, .input {
                    min-width: 150px;
                }

                .loading-state, .empty-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 4rem 2rem;
                    color: var(--gray-400);
                    gap: 1rem;
                }

                .spin {
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                .empty-state h3 {
                    color: var(--gray-700);
                    margin: 0;
                }

                .empty-state p {
                    margin: 0;
                }

                .table-wrapper {
                    overflow-x: auto;
                }

                .date-cell {
                    white-space: nowrap;
                    font-size: 0.8125rem;
                    color: var(--gray-600);
                }

                .user-cell {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .text-muted {
                    color: var(--gray-400);
                    font-style: italic;
                }

                .entity-id {
                    color: var(--gray-400);
                    font-size: 0.75rem;
                }

                .detail-cell {
                    max-width: 200px;
                }

                .detail-code {
                    font-size: 0.6875rem;
                    background: var(--gray-100);
                    padding: 0.125rem 0.375rem;
                    border-radius: 0.25rem;
                    color: var(--gray-600);
                }

                .pagination {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1rem 1.25rem;
                    border-top: 1px solid var(--gray-200);
                }

                .pagination-info {
                    font-size: 0.8125rem;
                    color: var(--gray-500);
                }

                .pagination-controls {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }

                .page-indicator {
                    font-size: 0.875rem;
                    color: var(--gray-700);
                }

                .badge {
                    display: inline-block;
                    padding: 0.25rem 0.625rem;
                    font-size: 0.75rem;
                    font-weight: 500;
                    border-radius: 9999px;
                }

                .badge.action-login { background: var(--success-100); color: var(--success-700); }
                .badge.action-logout { background: var(--gray-100); color: var(--gray-700); }
                .badge.action-login_failed { background: var(--danger-100); color: var(--danger-700); }
                .badge.action-ticket_create { background: var(--primary-100); color: var(--primary-700); }
                .badge.action-ticket_update { background: var(--warning-100); color: var(--warning-700); }
                .badge.action-ticket_delete { background: var(--danger-100); color: var(--danger-700); }
                .badge.action-user_create { background: var(--primary-100); color: var(--primary-700); }
                .badge.action-user_update { background: var(--warning-100); color: var(--warning-700); }

                @media (max-width: 768px) {
                    .filters-panel {
                        flex-direction: column;
                    }
                    
                    .pagination {
                        flex-direction: column;
                        gap: 1rem;
                    }
                }
            `}</style>
        </div>
    );
}
