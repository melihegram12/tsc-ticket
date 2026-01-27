'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Package,
    Plus,
    Search,
    Filter,
    Loader2,
    Monitor,
    Laptop,
    Smartphone,
    Printer,
    HardDrive,
    AlertCircle,
    CheckCircle,
    Clock,
    XCircle,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';

interface AssetModel {
    id: number;
    name: string;
    type: string;
}

interface Asset {
    id: number;
    assetTag: string;
    name: string;
    status: string;
    serialNumber: string | null;
    purchaseDate: string | null;
    warrantyExpiry: string | null;
    model: AssetModel | null;
    assignedTo: { id: number; name: string; email: string } | null;
    department: { id: number; name: string } | null;
    createdAt: string;
}

export default function AssetsPage() {
    const { data: session } = useSession();
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const pageSize = 10;

    const isAdminOrAgent = session?.user?.role === 'Admin' || session?.user?.role === 'Agent';

    useEffect(() => {
        fetchAssets();
    }, [page, search, statusFilter]);

    const fetchAssets = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                pageSize: pageSize.toString(),
            });
            if (search) params.append('search', search);
            if (statusFilter) params.append('status', statusFilter);

            const response = await fetch(`/api/assets?${params}`);
            const data = await response.json();
            setAssets(data.data || []);
            setTotalPages(Math.ceil((data.total || 0) / pageSize));
        } catch (error) {
            console.error('Failed to fetch assets:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
            ACTIVE: { label: 'Aktif', color: 'success', icon: <CheckCircle size={14} /> },
            IN_REPAIR: { label: 'Tamirde', color: 'warning', icon: <Clock size={14} /> },
            RETIRED: { label: 'Kullanım Dışı', color: 'gray', icon: <XCircle size={14} /> },
            LOST: { label: 'Kayıp', color: 'danger', icon: <AlertCircle size={14} /> },
        };

        const config = statusConfig[status] || { label: status, color: 'gray', icon: null };

        return (
            <span className={`badge badge-${config.color}`}>
                {config.icon}
                {config.label}
            </span>
        );
    };

    const getTypeIcon = (type: string | undefined) => {
        const iconMap: Record<string, React.ReactNode> = {
            COMPUTER: <Monitor size={18} />,
            LAPTOP: <Laptop size={18} />,
            PHONE: <Smartphone size={18} />,
            PRINTER: <Printer size={18} />,
            OTHER: <HardDrive size={18} />,
        };
        return iconMap[type || 'OTHER'] || <Package size={18} />;
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('tr-TR');
    };

    if (loading && assets.length === 0) {
        return (
            <div className="loading-container">
                <Loader2 className="spinner" size={32} />
                <p>Yükleniyor...</p>
                <style jsx>{`
          .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 400px;
            gap: 1rem;
            color: var(--gray-500);
          }
          .loading-container :global(.spinner) {
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
            </div>
        );
    }

    return (
        <div className="assets-page">
            <div className="page-header">
                <div>
                    <h1>Varlık Yönetimi</h1>
                    <p>Şirket varlıklarını yönetin ve takip edin</p>
                </div>
                {isAdminOrAgent && (
                    <Link href="/dashboard/assets/new" className="btn btn-primary">
                        <Plus size={18} />
                        Yeni Varlık Ekle
                    </Link>
                )}
            </div>

            {/* Filters */}
            <div className="filters-card">
                <div className="search-box">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Varlık ara (ad, etiket, seri no)..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    />
                </div>
                <div className="filter-group">
                    <Filter size={18} />
                    <select
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                    >
                        <option value="">Tüm Durumlar</option>
                        <option value="ACTIVE">Aktif</option>
                        <option value="IN_REPAIR">Tamirde</option>
                        <option value="RETIRED">Kullanım Dışı</option>
                        <option value="LOST">Kayıp</option>
                    </select>
                </div>
            </div>

            {/* Assets Table */}
            <div className="card">
                <div className="card-body">
                    {assets.length === 0 ? (
                        <div className="empty-state">
                            <Package size={48} />
                            <p>Henüz varlık bulunmuyor</p>
                            {isAdminOrAgent && (
                                <Link href="/dashboard/assets/new" className="btn btn-primary btn-sm">
                                    İlk Varlığı Ekle
                                </Link>
                            )}
                        </div>
                    ) : (
                        <>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Etiket</th>
                                        <th>Ad</th>
                                        <th>Tür</th>
                                        <th>Durum</th>
                                        <th>Atanan Kişi</th>
                                        <th>Departman</th>
                                        <th>Garanti Bitiş</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {assets.map((asset) => (
                                        <tr key={asset.id}>
                                            <td>
                                                <Link href={`/dashboard/assets/${asset.id}`} className="asset-tag">
                                                    {asset.assetTag}
                                                </Link>
                                            </td>
                                            <td>
                                                <div className="asset-name">
                                                    <div className="asset-icon">
                                                        {getTypeIcon(asset.model?.type)}
                                                    </div>
                                                    <Link href={`/dashboard/assets/${asset.id}`}>
                                                        {asset.name}
                                                    </Link>
                                                </div>
                                            </td>
                                            <td>{asset.model?.name || '-'}</td>
                                            <td>{getStatusBadge(asset.status)}</td>
                                            <td>
                                                {asset.assignedTo ? (
                                                    <span className="assigned-user">{asset.assignedTo.name}</span>
                                                ) : (
                                                    <span className="unassigned">Atanmamış</span>
                                                )}
                                            </td>
                                            <td>{asset.department?.name || '-'}</td>
                                            <td>
                                                <span className={asset.warrantyExpiry && new Date(asset.warrantyExpiry) < new Date() ? 'expired' : ''}>
                                                    {formatDate(asset.warrantyExpiry)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="pagination">
                                    <button
                                        className="pagination-btn"
                                        disabled={page === 1}
                                        onClick={() => setPage(page - 1)}
                                    >
                                        <ChevronLeft size={16} />
                                        Önceki
                                    </button>
                                    <span className="pagination-info">
                                        Sayfa {page} / {totalPages}
                                    </span>
                                    <button
                                        className="pagination-btn"
                                        disabled={page === totalPages}
                                        onClick={() => setPage(page + 1)}
                                    >
                                        Sonraki
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            <style jsx>{`
        .assets-page {
          max-width: 1200px;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.5rem;
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

        .filters-card {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }

        .search-box {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: white;
          border: 1px solid var(--gray-200);
          border-radius: 8px;
          flex: 1;
          min-width: 250px;
        }

        .search-box input {
          border: none;
          outline: none;
          flex: 1;
          font-size: 0.875rem;
        }

        .search-box :global(svg) {
          color: var(--gray-400);
        }

        .filter-group {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: white;
          border: 1px solid var(--gray-200);
          border-radius: 8px;
        }

        .filter-group :global(svg) {
          color: var(--gray-400);
        }

        .filter-group select {
          border: none;
          outline: none;
          font-size: 0.875rem;
          background: transparent;
          cursor: pointer;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          color: var(--gray-400);
        }

        .empty-state p {
          margin: 1rem 0;
          color: var(--gray-500);
        }

        .asset-tag {
          font-family: monospace;
          font-size: 0.8125rem;
          color: var(--primary-600);
          text-decoration: none;
          font-weight: 500;
          background: var(--primary-50);
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
        }

        .asset-tag:hover {
          background: var(--primary-100);
        }

        .asset-name {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .asset-name a {
          color: var(--gray-900);
          text-decoration: none;
          font-weight: 500;
        }

        .asset-name a:hover {
          color: var(--primary-600);
        }

        .asset-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          background: var(--gray-100);
          border-radius: 6px;
          color: var(--gray-500);
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.25rem 0.5rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .badge-success {
          background: var(--success-50);
          color: var(--success-700);
        }

        .badge-warning {
          background: var(--warning-50);
          color: var(--warning-700);
        }

        .badge-danger {
          background: var(--danger-50);
          color: var(--danger-700);
        }

        .badge-gray {
          background: var(--gray-100);
          color: var(--gray-600);
        }

        .assigned-user {
          color: var(--gray-700);
        }

        .unassigned {
          color: var(--gray-400);
          font-style: italic;
        }

        .expired {
          color: var(--danger-600);
        }

        .pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          padding-top: 1rem;
          border-top: 1px solid var(--gray-100);
          margin-top: 1rem;
        }

        .pagination-btn {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.5rem 1rem;
          border: 1px solid var(--gray-200);
          background: white;
          border-radius: 6px;
          font-size: 0.875rem;
          cursor: pointer;
          color: var(--gray-700);
        }

        .pagination-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .pagination-btn:not(:disabled):hover {
          background: var(--gray-50);
        }

        .pagination-info {
          font-size: 0.875rem;
          color: var(--gray-500);
        }

        @media (max-width: 768px) {
          .page-header {
            flex-direction: column;
            gap: 1rem;
          }

          .filters-card {
            flex-direction: column;
          }

          .search-box {
            min-width: 100%;
          }
        }
      `}</style>
        </div>
    );
}
