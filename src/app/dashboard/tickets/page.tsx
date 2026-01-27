'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Plus,
    Search,
    Filter,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Ticket,
    RefreshCw,
} from 'lucide-react';

interface TicketItem {
    id: number;
    ticketNumber: string;
    subject: string;
    status: string;
    priority: string;
    createdAt: string;
    lastActivityAt: string;
    requester: { id: number; name: string; email: string };
    assignedTo?: { id: number; name: string };
    department: { id: number; name: string };
    category?: { id: number; name: string };
}

interface PaginatedResponse {
    data: TicketItem[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

const statusOptions = [
    { value: 'NEW', label: 'Yeni' },
    { value: 'OPEN', label: 'Açık' },
    { value: 'WAITING_REQUESTER', label: 'Yanıt Bekleniyor' },
    { value: 'PENDING', label: 'Beklemede' },
    { value: 'RESOLVED', label: 'Çözüldü' },
    { value: 'CLOSED', label: 'Kapandı' },
];

const priorityOptions = [
    { value: 'URGENT', label: 'Acil' },
    { value: 'HIGH', label: 'Yüksek' },
    { value: 'NORMAL', label: 'Normal' },
    { value: 'LOW', label: 'Düşük' },
];

export default function TicketsPage() {
    const router = useRouter();
    const { data: session } = useSession();
    const searchParams = useSearchParams();
    const [tickets, setTickets] = useState<TicketItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        pageSize: 20,
        totalPages: 0,
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
    const [selectedPriority, setSelectedPriority] = useState<string[]>([]);
    const [selectedQueue, setSelectedQueue] = useState<string | null>(null);
    const [showFilters, setShowFilters] = useState(false);

    const fetchTickets = async (page = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.set('page', page.toString());
            params.set('pageSize', '20');

            if (searchQuery) params.set('search', searchQuery);
            if (selectedStatus.length) params.set('status', selectedStatus.join(','));
            if (selectedPriority.length) params.set('priority', selectedPriority.join(','));
            if (selectedQueue) params.set('queue', selectedQueue);

            const response = await fetch(`/api/tickets?${params.toString()}`);
            const data: PaginatedResponse = await response.json();

            setTickets(data.data || []);
            setPagination({
                total: data.total,
                page: data.page,
                pageSize: data.pageSize,
                totalPages: data.totalPages,
            });
        } catch (error) {
            console.error('Failed to fetch tickets:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, [selectedStatus, selectedPriority, selectedQueue]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchTickets(1);
    };

    const handleStatusChange = (value: string) => {
        setSelectedStatus(prev =>
            prev.includes(value)
                ? prev.filter(s => s !== value)
                : [...prev, value]
        );
    };

    const handlePriorityChange = (value: string) => {
        setSelectedPriority(prev =>
            prev.includes(value)
                ? prev.filter(p => p !== value)
                : [...prev, value]
        );
    };

    const clearFilters = () => {
        setSelectedStatus([]);
        setSelectedPriority([]);
        setSearchQuery('');
    };

    const getStatusLabel = (status: string) => {
        return statusOptions.find(s => s.value === status)?.label || status;
    };

    const getPriorityLabel = (priority: string) => {
        return priorityOptions.find(p => p.value === priority)?.label || priority;
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="tickets-page">
            <div className="page-header">
                <div>
                    <h1>Talepler</h1>
                    <p>Tüm destek taleplerini görüntüleyin ve yönetin</p>
                </div>
                <Link href="/dashboard/tickets/new" className="btn btn-primary">
                    <Plus size={18} />
                    Yeni Talep
                </Link>
            </div>

            {/* Queue Tabs (For Agents+) */}
            {session?.user?.role !== 'Requester' && (
                <div className="queue-tabs">
                    <button
                        className={`queue-tab ${selectedQueue === null ? 'active' : ''}`}
                        onClick={() => setSelectedQueue(null)}
                    >
                        Tümü
                    </button>
                    <button
                        className={`queue-tab ${selectedQueue === 'mine' ? 'active' : ''}`}
                        onClick={() => setSelectedQueue('mine')}
                    >
                        Bana Atananlar
                    </button>
                    <button
                        className={`queue-tab ${selectedQueue === 'unassigned' ? 'active' : ''}`}
                        onClick={() => setSelectedQueue('unassigned')}
                    >
                        Atanmamış
                    </button>
                    <button
                        className={`queue-tab ${selectedQueue === 'team' ? 'active' : ''}`}
                        onClick={() => setSelectedQueue('team')}
                    >
                        Ekibim
                    </button>
                    <button
                        className={`queue-tab ${selectedQueue === 'sla_risk' ? 'active' : ''}`}
                        onClick={() => setSelectedQueue('sla_risk')}
                    >
                        🚨 SLA Riski
                    </button>
                </div>
            )}

            {/* Search and Filters */}
            <div className="filters-section">
                <form onSubmit={handleSearch} className="search-form">
                    <div className="search-input-wrapper">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            className="input search-input"
                            placeholder="Ticket numarası, konu veya açıklama ara..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary">
                        Ara
                    </button>
                    <button
                        type="button"
                        className={`btn btn-secondary ${showFilters ? 'active' : ''}`}
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <Filter size={18} />
                        Filtreler
                        {(selectedStatus.length + selectedPriority.length > 0) && (
                            <span className="filter-count">
                                {selectedStatus.length + selectedPriority.length}
                            </span>
                        )}
                    </button>
                    <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => fetchTickets(pagination.page)}
                    >
                        <RefreshCw size={18} />
                    </button>
                </form>

                {showFilters && (
                    <div className="filters-panel">
                        <div className="filter-group">
                            <label>Durum</label>
                            <div className="filter-options">
                                {statusOptions.map((option) => (
                                    <label key={option.value} className="filter-option">
                                        <input
                                            type="checkbox"
                                            checked={selectedStatus.includes(option.value)}
                                            onChange={() => handleStatusChange(option.value)}
                                        />
                                        <span>{option.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="filter-group">
                            <label>Öncelik</label>
                            <div className="filter-options">
                                {priorityOptions.map((option) => (
                                    <label key={option.value} className="filter-option">
                                        <input
                                            type="checkbox"
                                            checked={selectedPriority.includes(option.value)}
                                            onChange={() => handlePriorityChange(option.value)}
                                        />
                                        <span>{option.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {(selectedStatus.length + selectedPriority.length > 0) && (
                            <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                onClick={clearFilters}
                            >
                                Filtreleri Temizle
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Tickets Table */}
            <div className="card">
                {loading ? (
                    <div className="skeleton-container">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="skeleton-row" style={{ animationDelay: `${i * 50}ms` }}>
                                <div className="skeleton skeleton-id"></div>
                                <div className="skeleton skeleton-subject"></div>
                                <div className="skeleton skeleton-badge"></div>
                                <div className="skeleton skeleton-badge"></div>
                                <div className="skeleton skeleton-date"></div>
                            </div>
                        ))}
                    </div>
                ) : tickets.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">
                            <Ticket size={48} />
                        </div>
                        <h3>Talep Bulunamadı</h3>
                        <p>Arama kriterlerinize uygun talep yok</p>
                        <Link href="/dashboard/tickets/new" className="btn btn-primary">
                            Yeni Talep Oluştur
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="table-wrapper">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Ticket #</th>
                                        <th>Konu</th>
                                        <th>Talep Eden</th>
                                        <th>Departman</th>
                                        <th>Durum</th>
                                        <th>Öncelik</th>
                                        <th>Tarih</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tickets.map((ticket) => (
                                        <tr
                                            key={ticket.id}
                                            onClick={() => router.push(`/dashboard/tickets/${ticket.id}`)}
                                            className="clickable-row"
                                        >
                                            <td>
                                                <span className="ticket-number">{ticket.ticketNumber}</span>
                                            </td>
                                            <td>
                                                <div className="ticket-subject-cell">
                                                    <span className="ticket-subject">{ticket.subject}</span>
                                                    {ticket.assignedTo && (
                                                        <span className="assigned-to">→ {ticket.assignedTo.name}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="requester-cell">
                                                    <div className="avatar avatar-sm">{ticket.requester.name.charAt(0)}</div>
                                                    <span>{ticket.requester.name}</span>
                                                </div>
                                            </td>
                                            <td>{ticket.department.name}</td>
                                            <td>
                                                <span className={`badge status-${ticket.status.toLowerCase().replace('_', '-')}`}>
                                                    {getStatusLabel(ticket.status)}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge priority-${ticket.priority.toLowerCase()}`}>
                                                    {getPriorityLabel(ticket.priority)}
                                                </span>
                                            </td>
                                            <td className="date-cell">{formatDate(ticket.createdAt)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="pagination">
                            <span className="pagination-info">
                                Toplam {pagination.total} talepten {((pagination.page - 1) * pagination.pageSize) + 1} - {Math.min(pagination.page * pagination.pageSize, pagination.total)} arası gösteriliyor
                            </span>
                            <div className="pagination-controls">
                                <button
                                    className="btn btn-ghost btn-sm"
                                    disabled={pagination.page === 1}
                                    onClick={() => fetchTickets(pagination.page - 1)}
                                >
                                    <ChevronLeft size={16} />
                                    Önceki
                                </button>
                                <span className="page-indicator">
                                    Sayfa {pagination.page} / {pagination.totalPages}
                                </span>
                                <button
                                    className="btn btn-ghost btn-sm"
                                    disabled={pagination.page === pagination.totalPages}
                                    onClick={() => fetchTickets(pagination.page + 1)}
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
        .tickets-page {
          max-width: 1400px;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .queue-tabs {
            display: flex;
            gap: 0.5rem;
            margin-bottom: 1.5rem;
            border-bottom: 1px solid var(--gray-200);
            padding-bottom: 0rem;
        }

        .queue-tab {
            padding: 0.75rem 1rem;
            border: none;
            background: none;
            color: var(--gray-500);
            font-weight: 500;
            font-size: 0.875rem;
            cursor: pointer;
            border-bottom: 2px solid transparent;
            transition: all 0.2s;
        }

        .queue-tab:hover {
            color: var(--gray-700);
            background: var(--gray-50);
        }

        .queue-tab.active {
            color: var(--primary-600);
            border-bottom-color: var(--primary-600);
            background: var(--primary-50);
        }

        .page-header h1 {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--gray-900);
          margin: 0 0 0.25rem 0;
        }

        .page-header p {
          color: var(--gray-500);
          margin: 0;
        }

        .filters-section {
          margin-bottom: 1.5rem;
        }

        .search-form {
          display: flex;
          gap: 0.75rem;
          align-items: center;
        }

        .search-input-wrapper {
          position: relative;
          flex: 1;
          max-width: 400px;
        }

        .search-icon {
          position: absolute;
          left: 0.875rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--gray-400);
        }

        .search-input {
          padding-left: 2.5rem;
        }

        .btn.active {
          background: var(--primary-50);
          border-color: var(--primary-200);
          color: var(--primary-600);
        }

        .filter-count {
          background: var(--primary-500);
          color: white;
          font-size: 0.6875rem;
          padding: 0.125rem 0.375rem;
          border-radius: 9999px;
          margin-left: 0.25rem;
        }

        .filters-panel {
          margin-top: 1rem;
          padding: 1rem;
          background: white;
          border: 1px solid var(--gray-200);
          border-radius: 0.5rem;
          display: flex;
          gap: 2rem;
          flex-wrap: wrap;
          align-items: flex-end;
        }

        .filter-group label {
          display: block;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--gray-500);
          margin-bottom: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .filter-options {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .filter-option {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.875rem;
          color: var(--gray-700);
          cursor: pointer;
        }

        .filter-option input {
          accent-color: var(--primary-500);
        }

        .table-wrapper {
          overflow-x: auto;
        }

        .clickable-row {
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .clickable-row:hover {
          background: linear-gradient(90deg, rgba(59, 130, 246, 0.08), rgba(59, 130, 246, 0.04)) !important;
          transform: scale(1.005);
        }

        .clickable-row:hover .ticket-number {
          color: var(--primary-700);
        }

        .clickable-row:active {
          transform: scale(0.995);
        }

        /* Skeleton Loading */
        .skeleton-container {
          padding: 1rem;
        }

        .skeleton-row {
          display: flex;
          gap: 1rem;
          padding: 1rem;
          border-bottom: 1px solid var(--gray-100);
          animation: fadeInUp 0.4s ease-out both;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .skeleton {
          background: linear-gradient(90deg, var(--gray-200) 25%, var(--gray-100) 50%, var(--gray-200) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 6px;
        }

        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .skeleton-id {
          width: 100px;
          height: 20px;
        }

        .skeleton-subject {
          flex: 1;
          height: 20px;
        }

        .skeleton-badge {
          width: 80px;
          height: 24px;
          border-radius: 12px;
        }

        .skeleton-date {
          width: 120px;
          height: 20px;
        }

        .ticket-number {
          font-family: monospace;
          font-size: 0.8125rem;
          color: var(--primary-600);
          font-weight: 500;
        }

        .ticket-subject-cell {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .ticket-subject {
          color: var(--gray-900);
          font-weight: 500;
        }

        .assigned-to {
          font-size: 0.75rem;
          color: var(--gray-500);
        }

        .requester-cell {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .date-cell {
          font-size: 0.8125rem;
          color: var(--gray-500);
          white-space: nowrap;
        }

        .loading-container {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4rem;
        }

        .loading-container :global(.spinner) {
          color: var(--primary-500);
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
          color: var(--gray-400);
          animation: fadeIn 0.4s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .empty-icon {
          width: 80px;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, var(--gray-100), var(--gray-200));
          border-radius: 50%;
          margin-bottom: 1rem;
          animation: float 3s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }

        .empty-state h3 {
          color: var(--gray-700);
          margin: 0.5rem 0;
          font-size: 1.125rem;
        }

        .empty-state p {
          color: var(--gray-500);
          margin: 0 0 1.5rem 0;
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

        @media (max-width: 768px) {
          .page-header {
            flex-direction: column;
            gap: 1rem;
          }

          .search-form {
            flex-wrap: wrap;
          }

          .search-input-wrapper {
            max-width: none;
            width: 100%;
          }

          .filters-panel {
            flex-direction: column;
            gap: 1rem;
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
