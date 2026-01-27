'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft,
    Save,
    Loader2,
    Package,
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

interface User {
    id: number;
    name: string;
    email: string;
}

export default function NewAssetPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [models, setModels] = useState<AssetModel[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [users, setUsers] = useState<User[]>([]);

    const [formData, setFormData] = useState({
        assetTag: '',
        name: '',
        serialNumber: '',
        modelId: '',
        departmentId: '',
        assignedToId: '',
        status: 'ACTIVE',
        purchaseDate: '',
        warrantyExpiry: '',
        notes: '',
    });

    const isAdminOrAgent = session?.user?.role === 'Admin' || session?.user?.role === 'Agent';

    useEffect(() => {
        if (!isAdminOrAgent) {
            router.push('/dashboard/assets');
            return;
        }

        fetchModels();
        fetchDepartments();
        fetchUsers();
    }, []);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('/api/assets', {
                method: 'POST',
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
                router.push('/dashboard/assets');
            } else {
                const error = await response.json();
                alert(error.error || 'Varlık oluşturulamadı');
            }
        } catch (error) {
            console.error('Failed to create asset:', error);
            alert('Varlık oluşturulamadı');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    if (!isAdminOrAgent) {
        return null;
    }

    return (
        <div className="new-asset-page">
            <div className="page-header">
                <Link href="/dashboard/assets" className="back-link">
                    <ArrowLeft size={20} />
                    Varlıklara Dön
                </Link>
                <h1>
                    <Package size={24} />
                    Yeni Varlık Ekle
                </h1>
            </div>

            <form onSubmit={handleSubmit} className="asset-form">
                <div className="card">
                    <div className="card-header">
                        <h2>Temel Bilgiler</h2>
                    </div>
                    <div className="card-body">
                        <div className="form-grid">
                            <div className="form-group">
                                <label htmlFor="assetTag">Varlık Etiketi *</label>
                                <input
                                    type="text"
                                    id="assetTag"
                                    name="assetTag"
                                    value={formData.assetTag}
                                    onChange={handleChange}
                                    placeholder="Örn: PC-001"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="name">Varlık Adı *</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Örn: Dell Latitude 5520"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="serialNumber">Seri Numarası</label>
                                <input
                                    type="text"
                                    id="serialNumber"
                                    name="serialNumber"
                                    value={formData.serialNumber}
                                    onChange={handleChange}
                                    placeholder="Örn: ABC123XYZ"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="modelId">Model</label>
                                <select
                                    id="modelId"
                                    name="modelId"
                                    value={formData.modelId}
                                    onChange={handleChange}
                                >
                                    <option value="">Model Seçin</option>
                                    {models.map(model => (
                                        <option key={model.id} value={model.id}>
                                            {model.name} ({model.type})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="status">Durum</label>
                                <select
                                    id="status"
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                >
                                    <option value="ACTIVE">Aktif</option>
                                    <option value="IN_REPAIR">Tamirde</option>
                                    <option value="RETIRED">Kullanım Dışı</option>
                                    <option value="LOST">Kayıp</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <h2>Atama Bilgileri</h2>
                    </div>
                    <div className="card-body">
                        <div className="form-grid">
                            <div className="form-group">
                                <label htmlFor="departmentId">Departman</label>
                                <select
                                    id="departmentId"
                                    name="departmentId"
                                    value={formData.departmentId}
                                    onChange={handleChange}
                                >
                                    <option value="">Departman Seçin</option>
                                    {departments.map(dept => (
                                        <option key={dept.id} value={dept.id}>
                                            {dept.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="assignedToId">Atanan Kişi</label>
                                <select
                                    id="assignedToId"
                                    name="assignedToId"
                                    value={formData.assignedToId}
                                    onChange={handleChange}
                                >
                                    <option value="">Kişi Seçin</option>
                                    {users.map(user => (
                                        <option key={user.id} value={user.id}>
                                            {user.name} ({user.email})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <h2>Satın Alma ve Garanti</h2>
                    </div>
                    <div className="card-body">
                        <div className="form-grid">
                            <div className="form-group">
                                <label htmlFor="purchaseDate">Satın Alma Tarihi</label>
                                <input
                                    type="date"
                                    id="purchaseDate"
                                    name="purchaseDate"
                                    value={formData.purchaseDate}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="warrantyExpiry">Garanti Bitiş Tarihi</label>
                                <input
                                    type="date"
                                    id="warrantyExpiry"
                                    name="warrantyExpiry"
                                    value={formData.warrantyExpiry}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <h2>Notlar</h2>
                    </div>
                    <div className="card-body">
                        <div className="form-group full-width">
                            <textarea
                                id="notes"
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                placeholder="Varlık hakkında notlar..."
                                rows={4}
                            />
                        </div>
                    </div>
                </div>

                <div className="form-actions">
                    <Link href="/dashboard/assets" className="btn btn-secondary">
                        İptal
                    </Link>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? (
                            <>
                                <Loader2 className="spinner" size={18} />
                                Kaydediliyor...
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                Kaydet
                            </>
                        )}
                    </button>
                </div>
            </form>

            <style jsx>{`
        .new-asset-page {
          max-width: 800px;
        }

        .page-header {
          margin-bottom: 1.5rem;
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

        .page-header h1 {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--gray-900);
          margin: 0;
        }

        .asset-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .card-header h2 {
          font-size: 1rem;
          font-weight: 600;
          color: var(--gray-900);
          margin: 0;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group.full-width {
          grid-column: 1 / -1;
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
          transition: all 0.2s ease;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: var(--primary-500);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .form-group textarea {
          resize: vertical;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        :global(.spinner) {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 640px) {
          .form-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
        </div>
    );
}
