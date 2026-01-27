'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft,
    Edit2,
    Save,
    Trash2,
    Loader2,
    Package,
    Monitor,
    Laptop,
    Smartphone,
    Printer,
    HardDrive,
    CheckCircle,
    Clock,
    XCircle,
    AlertCircle,
    User,
    Building2,
    Calendar,
    Shield,
    FileText,
} from 'lucide-react';

interface AssetModel {
    id: number;
    name: string;
    type: string;
}

interface Department {
    id: number;
    name: string;
}

interface UserInfo {
    id: number;
    name: string;
    email: string;
}

interface AssetAssignment {
    id: number;
    assignedAt: string;
    returnedAt: string | null;
    user: { id: number; name: string; email: string };
}

interface Asset {
    id: number;
    assetTag: string;
    name: string;
    status: string;
    serialNumber: string | null;
    purchaseDate: string | null;
    warrantyExpiry: string | null;
    notes: string | null;
    model: AssetModel | null;
    assignedTo: UserInfo | null;
    department: Department | null;
    assignmentHistory: AssetAssignment[];
    createdAt: string;
    updatedAt: string;
}

export default function AssetDetailPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const params = useParams();
    const assetId = params.id as string;

    const [asset, setAsset] = useState<Asset | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const [models, setModels] = useState<AssetModel[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [users, setUsers] = useState<UserInfo[]>([]);

    const [formData, setFormData] = useState({
        name: '',
        serialNumber: '',
        modelId: '',
        departmentId: '',
        assignedToId: '',
        status: '',
        purchaseDate: '',
        warrantyExpiry: '',
        notes: '',
    });

    const isAdmin = session?.user?.role === 'Admin';
    const isAdminOrAgent = session?.user?.role === 'Admin' || session?.user?.role === 'Agent';

    useEffect(() => {
        fetchAsset();
        if (isAdminOrAgent) {
            fetchModels();
            fetchDepartments();
            fetchUsers();
        }
    }, [assetId]);

    const fetchAsset = async () => {
        try {
            const response = await fetch(`/api/assets/${assetId}`);
            if (response.ok) {
                const data = await response.json();
                setAsset(data);
                setFormData({
                    name: data.name || '',
                    serialNumber: data.serialNumber || '',
                    modelId: data.model?.id?.toString() || '',
                    departmentId: data.department?.id?.toString() || '',
                    assignedToId: data.assignedTo?.id?.toString() || '',
                    status: data.status || 'ACTIVE',
                    purchaseDate: data.purchaseDate?.split('T')[0] || '',
                    warrantyExpiry: data.warrantyExpiry?.split('T')[0] || '',
                    notes: data.notes || '',
                });
            } else {
                router.push('/dashboard/assets');
            }
        } catch (error) {
            console.error('Failed to fetch asset:', error);
            router.push('/dashboard/assets');
        } finally {
            setLoading(false);
        }
    };

    const fetchModels = async () => {
        try {
            const response = await fetch('/api/assets/models');
            const data = await response.json();
            setModels(data || []);
        } catch (error) {
            console.error('Failed to fetch models:', error);
        }
    };

    const fetchDepartments = async () => {
        try {
            const response = await fetch('/api/departments');
            const data = await response.json();
            setDepartments(data || []);
        } catch (error) {
            console.error('Failed to fetch departments:', error);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await fetch('/api/users');
            const data = await response.json();
            setUsers(data.data || data || []);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await fetch(`/api/assets/${assetId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    modelId: formData.modelId ? parseInt(formData.modelId) : null,
                    departmentId: formData.departmentId ? parseInt(formData.departmentId) : null,
                    assignedToId: formData.assignedToId ? parseInt(formData.assignedToId) : null,
                    purchaseDate: formData.purchaseDate || null,
                    warrantyExpiry: formData.warrantyExpiry || null,
                }),
            });

            if (response.ok) {
                const updatedAsset = await response.json();
                setAsset(updatedAsset);
                setEditing(false);
            } else {
                const error = await response.json();
                alert(error.error || 'Varlık güncellenemedi');
            }
        } catch (error) {
            console.error('Failed to update asset:', error);
            alert('Varlık güncellenemedi');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Bu varlığı silmek istediğinize emin misiniz?')) return;

        setDeleting(true);
        try {
            const response = await fetch(`/api/assets/${assetId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                router.push('/dashboard/assets');
            } else {
                const error = await response.json();
                alert(error.error || 'Varlık silinemedi');
            }
        } catch (error) {
            console.error('Failed to delete asset:', error);
            alert('Varlık silinemedi');
        } finally {
            setDeleting(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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
            COMPUTER: <Monitor size={24} />,
            LAPTOP: <Laptop size={24} />,
            PHONE: <Smartphone size={24} />,
            PRINTER: <Printer size={24} />,
            OTHER: <HardDrive size={24} />,
        };
        return iconMap[type || 'OTHER'] || <Package size={24} />;
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    if (loading) {
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

    if (!asset) return null;

    return (
        <div className="asset-detail-page">
            <div className="page-header">
                <div className="header-left">
                    <Link href="/dashboard/assets" className="back-link">
                        <ArrowLeft size={20} />
                        Varlıklara Dön
                    </Link>
                    <div className="asset-title">
                        <div className="asset-icon">
                            {getTypeIcon(asset.model?.type)}
                        </div>
                        <div>
                            <span className="asset-tag">{asset.assetTag}</span>
                            <h1>{asset.name}</h1>
                        </div>
                    </div>
                </div>
                {isAdminOrAgent && (
                    <div className="header-actions">
                        {editing ? (
                            <>
                                <button className="btn btn-secondary" onClick={() => setEditing(false)} disabled={saving}>
                                    İptal
                                </button>
                                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                                    {saving ? <Loader2 className="spinner" size={18} /> : <Save size={18} />}
                                    Kaydet
                                </button>
                            </>
                        ) : (
                            <>
                                <button className="btn btn-secondary" onClick={() => setEditing(true)}>
                                    <Edit2 size={18} />
                                    Düzenle
                                </button>
                                {isAdmin && (
                                    <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
                                        {deleting ? <Loader2 className="spinner" size={18} /> : <Trash2 size={18} />}
                                        Sil
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>

            <div className="content-grid">
                <div className="main-content">
                    <div className="card">
                        <div className="card-header">
                            <h2>Temel Bilgiler</h2>
                        </div>
                        <div className="card-body">
                            {editing ? (
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Varlık Adı</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Seri Numarası</label>
                                        <input
                                            type="text"
                                            name="serialNumber"
                                            value={formData.serialNumber}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Model</label>
                                        <select name="modelId" value={formData.modelId} onChange={handleChange}>
                                            <option value="">Model Seçin</option>
                                            {models.map(model => (
                                                <option key={model.id} value={model.id}>{model.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Durum</label>
                                        <select name="status" value={formData.status} onChange={handleChange}>
                                            <option value="ACTIVE">Aktif</option>
                                            <option value="IN_REPAIR">Tamirde</option>
                                            <option value="RETIRED">Kullanım Dışı</option>
                                            <option value="LOST">Kayıp</option>
                                        </select>
                                    </div>
                                </div>
                            ) : (
                                <div className="info-grid">
                                    <div className="info-item">
                                        <span className="info-label">Seri Numarası</span>
                                        <span className="info-value">{asset.serialNumber || '-'}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Model</span>
                                        <span className="info-value">{asset.model?.name || '-'}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Durum</span>
                                        {getStatusBadge(asset.status)}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <h2>Atama Bilgileri</h2>
                        </div>
                        <div className="card-body">
                            {editing ? (
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Departman</label>
                                        <select name="departmentId" value={formData.departmentId} onChange={handleChange}>
                                            <option value="">Departman Seçin</option>
                                            {departments.map(dept => (
                                                <option key={dept.id} value={dept.id}>{dept.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Atanan Kişi</label>
                                        <select name="assignedToId" value={formData.assignedToId} onChange={handleChange}>
                                            <option value="">Kişi Seçin</option>
                                            {users.map(user => (
                                                <option key={user.id} value={user.id}>{user.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            ) : (
                                <div className="info-grid">
                                    <div className="info-item">
                                        <Building2 size={16} />
                                        <span className="info-label">Departman</span>
                                        <span className="info-value">{asset.department?.name || '-'}</span>
                                    </div>
                                    <div className="info-item">
                                        <User size={16} />
                                        <span className="info-label">Atanan Kişi</span>
                                        <span className="info-value">{asset.assignedTo?.name || 'Atanmamış'}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {asset.notes && !editing && (
                        <div className="card">
                            <div className="card-header">
                                <h2><FileText size={18} /> Notlar</h2>
                            </div>
                            <div className="card-body">
                                <p className="notes">{asset.notes}</p>
                            </div>
                        </div>
                    )}

                    {editing && (
                        <div className="card">
                            <div className="card-header">
                                <h2>Notlar</h2>
                            </div>
                            <div className="card-body">
                                <textarea
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleChange}
                                    rows={4}
                                    placeholder="Varlık hakkında notlar..."
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="sidebar-content">
                    <div className="card">
                        <div className="card-header">
                            <h2><Calendar size={18} /> Tarihler</h2>
                        </div>
                        <div className="card-body">
                            {editing ? (
                                <div className="form-stack">
                                    <div className="form-group">
                                        <label>Satın Alma Tarihi</label>
                                        <input type="date" name="purchaseDate" value={formData.purchaseDate} onChange={handleChange} />
                                    </div>
                                    <div className="form-group">
                                        <label>Garanti Bitiş</label>
                                        <input type="date" name="warrantyExpiry" value={formData.warrantyExpiry} onChange={handleChange} />
                                    </div>
                                </div>
                            ) : (
                                <div className="date-list">
                                    <div className="date-item">
                                        <span>Satın Alma</span>
                                        <strong>{formatDate(asset.purchaseDate)}</strong>
                                    </div>
                                    <div className="date-item">
                                        <span><Shield size={14} /> Garanti Bitiş</span>
                                        <strong className={asset.warrantyExpiry && new Date(asset.warrantyExpiry) < new Date() ? 'expired' : ''}>
                                            {formatDate(asset.warrantyExpiry)}
                                        </strong>
                                    </div>
                                    <div className="date-item">
                                        <span>Oluşturulma</span>
                                        <strong>{formatDate(asset.createdAt)}</strong>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
        .asset-detail-page {
          max-width: 1200px;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--gray-500);
          text-decoration: none;
          font-size: 0.875rem;
          margin-bottom: 0.5rem;
        }

        .back-link:hover {
          color: var(--primary-600);
        }

        .asset-title {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .asset-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          background: linear-gradient(135deg, var(--primary-100), var(--primary-200));
          border-radius: 12px;
          color: var(--primary-600);
        }

        .asset-tag {
          font-family: monospace;
          font-size: 0.8125rem;
          color: var(--primary-600);
          background: var(--primary-50);
          padding: 0.125rem 0.5rem;
          border-radius: 4px;
        }

        .asset-title h1 {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--gray-900);
          margin: 0.25rem 0 0 0;
        }

        .header-actions {
          display: flex;
          gap: 0.5rem;
        }

        .content-grid {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 1.5rem;
        }

        .main-content {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .sidebar-content {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .card-header h2 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1rem;
          font-weight: 600;
          color: var(--gray-900);
          margin: 0;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
        }

        .info-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .info-item :global(svg) {
          color: var(--gray-400);
          margin-bottom: 0.25rem;
        }

        .info-label {
          font-size: 0.75rem;
          color: var(--gray-500);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .info-value {
          font-size: 0.9375rem;
          color: var(--gray-900);
          font-weight: 500;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }

        .form-stack {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group label {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--gray-700);
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          padding: 0.625rem 0.875rem;
          border: 1px solid var(--gray-300);
          border-radius: 6px;
          font-size: 0.875rem;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: var(--primary-500);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .date-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .date-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .date-item span {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.75rem;
          color: var(--gray-500);
        }

        .date-item strong {
          color: var(--gray-900);
        }

        .date-item strong.expired {
          color: var(--danger-600);
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

        .notes {
          color: var(--gray-700);
          line-height: 1.6;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .btn-danger {
          background: var(--danger-600);
          color: white;
        }

        .btn-danger:hover {
          background: var(--danger-700);
        }

        :global(.spinner) {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 1024px) {
          .content-grid {
            grid-template-columns: 1fr;
          }

          .info-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 640px) {
          .info-grid {
            grid-template-columns: 1fr;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }

          .header-actions {
            width: 100%;
            justify-content: flex-end;
          }
        }
      `}</style>
        </div>
    );
}
