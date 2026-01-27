'use client';

import { useEffect, useState } from 'react';
import {
    Plus,
    Edit2,
    Trash2,
    Loader2,
    Building2,
    FolderTree,
    X,
    Check,
    ChevronDown,
    ChevronUp,
    Tag,
} from 'lucide-react';

interface Category {
    id: number;
    name: string;
    description: string | null;
    sortOrder: number;
    isActive: boolean;
}

interface Department {
    id: number;
    name: string;
    description: string | null;
    emailAlias: string | null;
    isActive: boolean;
    categories: Category[];
    _count: {
        users: number;
        tickets: number;
    };
}

interface DeptFormData {
    name: string;
    description: string;
    emailAlias: string;
    isActive: boolean;
}

interface CatFormData {
    name: string;
    description: string;
}

export default function AdminDepartmentsPage() {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedDept, setExpandedDept] = useState<number | null>(null);

    // Department modal
    const [deptModalOpen, setDeptModalOpen] = useState(false);
    const [editingDept, setEditingDept] = useState<Department | null>(null);
    const [deptForm, setDeptForm] = useState<DeptFormData>({
        name: '',
        description: '',
        emailAlias: '',
        isActive: true,
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Category modal
    const [catModalOpen, setCatModalOpen] = useState(false);
    const [catDeptId, setCatDeptId] = useState<number | null>(null);
    const [catForm, setCatForm] = useState<CatFormData>({ name: '', description: '' });

    // Delete confirm
    const [deleteConfirm, setDeleteConfirm] = useState<Department | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetchDepartments();
    }, []);

    const fetchDepartments = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/admin/departments');
            const data = await res.json();
            if (res.ok) {
                setDepartments(data);
            }
        } catch (err) {
            console.error('Error fetching departments:', err);
        } finally {
            setLoading(false);
        }
    };

    const openCreateDeptModal = () => {
        setEditingDept(null);
        setDeptForm({ name: '', description: '', emailAlias: '', isActive: true });
        setError('');
        setDeptModalOpen(true);
    };

    const openEditDeptModal = (dept: Department) => {
        setEditingDept(dept);
        setDeptForm({
            name: dept.name,
            description: dept.description || '',
            emailAlias: dept.emailAlias || '',
            isActive: dept.isActive,
        });
        setError('');
        setDeptModalOpen(true);
    };

    const closeDeptModal = () => {
        setDeptModalOpen(false);
        setEditingDept(null);
        setError('');
    };

    const handleDeptSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            const url = editingDept
                ? `/api/admin/departments/${editingDept.id}`
                : '/api/admin/departments';
            const method = editingDept ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(deptForm),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Bir hata oluştu');
                return;
            }

            closeDeptModal();
            fetchDepartments();
        } catch {
            setError('Bir hata oluştu');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirm) return;
        setDeleting(true);

        try {
            const res = await fetch(`/api/admin/departments/${deleteConfirm.id}`, {
                method: 'DELETE',
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Silinemedi');
                setDeleteConfirm(null);
                return;
            }

            setDeleteConfirm(null);
            fetchDepartments();
        } catch {
            console.error('Error deleting department');
        } finally {
            setDeleting(false);
        }
    };

    const openCatModal = (deptId: number) => {
        setCatDeptId(deptId);
        setCatForm({ name: '', description: '' });
        setCatModalOpen(true);
    };

    const handleCatSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!catDeptId) return;
        setSubmitting(true);

        try {
            const res = await fetch(`/api/admin/departments/${catDeptId}/categories`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(catForm),
            });

            if (res.ok) {
                setCatModalOpen(false);
                fetchDepartments();
            }
        } catch {
            console.error('Error creating category');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="admin-departments">
            <div className="page-header">
                <div>
                    <h1>Departman Yönetimi</h1>
                    <p>Departmanları ve kategorileri yönetin</p>
                </div>
                <button className="btn btn-primary" onClick={openCreateDeptModal}>
                    <Plus size={18} />
                    Yeni Departman
                </button>
            </div>

            {error && <div className="error-banner">{error}</div>}

            <div className="departments-grid">
                {loading ? (
                    <div className="loading-state">
                        <Loader2 className="spin" size={32} />
                        <p>Yükleniyor...</p>
                    </div>
                ) : departments.length === 0 ? (
                    <div className="empty-state">
                        <Building2 size={48} />
                        <p>Henüz departman oluşturulmamış</p>
                    </div>
                ) : (
                    departments.map(dept => (
                        <div key={dept.id} className={`dept-card card ${!dept.isActive ? 'inactive' : ''}`}>
                            <div className="dept-header">
                                <div className="dept-info">
                                    <div className="dept-icon">
                                        <Building2 size={24} />
                                    </div>
                                    <div>
                                        <h3>{dept.name}</h3>
                                        {dept.emailAlias && (
                                            <span className="email-alias">{dept.emailAlias}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="dept-actions">
                                    <button
                                        className="btn btn-ghost btn-sm"
                                        onClick={() => openEditDeptModal(dept)}
                                        title="Düzenle"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        className="btn btn-ghost btn-sm danger"
                                        onClick={() => setDeleteConfirm(dept)}
                                        title="Sil"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {dept.description && (
                                <p className="dept-description">{dept.description}</p>
                            )}

                            <div className="dept-stats">
                                <div className="stat">
                                    <span className="stat-value">{dept._count.users}</span>
                                    <span className="stat-label">Kullanıcı</span>
                                </div>
                                <div className="stat">
                                    <span className="stat-value">{dept._count.tickets}</span>
                                    <span className="stat-label">Ticket</span>
                                </div>
                                <div className="stat">
                                    <span className="stat-value">{dept.categories.length}</span>
                                    <span className="stat-label">Kategori</span>
                                </div>
                            </div>

                            <div className="categories-section">
                                <button
                                    className="categories-toggle"
                                    onClick={() => setExpandedDept(expandedDept === dept.id ? null : dept.id)}
                                >
                                    <FolderTree size={16} />
                                    Kategoriler
                                    {expandedDept === dept.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </button>

                                {expandedDept === dept.id && (
                                    <div className="categories-list">
                                        {dept.categories.length === 0 ? (
                                            <p className="no-categories">Kategori yok</p>
                                        ) : (
                                            dept.categories.map(cat => (
                                                <div key={cat.id} className="category-item">
                                                    <Tag size={14} />
                                                    {cat.name}
                                                </div>
                                            ))
                                        )}
                                        <button
                                            className="btn btn-ghost btn-sm add-category-btn"
                                            onClick={() => openCatModal(dept.id)}
                                        >
                                            <Plus size={14} />
                                            Kategori Ekle
                                        </button>
                                    </div>
                                )}
                            </div>

                            {!dept.isActive && (
                                <div className="inactive-badge">Pasif</div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Department Modal */}
            {deptModalOpen && (
                <div className="modal-overlay" onClick={closeDeptModal}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingDept ? 'Departman Düzenle' : 'Yeni Departman'}</h2>
                            <button className="btn btn-ghost" onClick={closeDeptModal}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleDeptSubmit}>
                            <div className="modal-body">
                                {error && <div className="error-message">{error}</div>}

                                <div className="form-group">
                                    <label>Departman Adı *</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={deptForm.name}
                                        onChange={e => setDeptForm({ ...deptForm, name: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Açıklama</label>
                                    <textarea
                                        className="input"
                                        rows={3}
                                        value={deptForm.description}
                                        onChange={e => setDeptForm({ ...deptForm, description: e.target.value })}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>E-posta Takma Adı</label>
                                    <input
                                        type="email"
                                        className="input"
                                        placeholder="it@company.com"
                                        value={deptForm.emailAlias}
                                        onChange={e => setDeptForm({ ...deptForm, emailAlias: e.target.value })}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={deptForm.isActive}
                                            onChange={e => setDeptForm({ ...deptForm, isActive: e.target.checked })}
                                        />
                                        Aktif Departman
                                    </label>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeDeptModal}>
                                    İptal
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    {submitting ? <Loader2 className="spin" size={16} /> : <Check size={16} />}
                                    Kaydet
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Category Modal */}
            {catModalOpen && (
                <div className="modal-overlay" onClick={() => setCatModalOpen(false)}>
                    <div className="modal-content modal-sm" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Yeni Kategori</h2>
                            <button className="btn btn-ghost" onClick={() => setCatModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCatSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Kategori Adı *</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={catForm.name}
                                        onChange={e => setCatForm({ ...catForm, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Açıklama</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={catForm.description}
                                        onChange={e => setCatForm({ ...catForm, description: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setCatModalOpen(false)}>
                                    İptal
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    {submitting ? <Loader2 className="spin" size={16} /> : <Plus size={16} />}
                                    Ekle
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="modal-content modal-sm" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Departmanı Sil</h2>
                        </div>
                        <div className="modal-body">
                            <p>
                                <strong>{deleteConfirm.name}</strong> departmanını silmek istediğinize emin misiniz?
                            </p>
                            {deleteConfirm._count.tickets > 0 && (
                                <div className="warning-message">
                                    Bu departmanda {deleteConfirm._count.tickets} ticket bulunuyor!
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>
                                İptal
                            </button>
                            <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
                                {deleting ? <Loader2 className="spin" size={16} /> : <Trash2 size={16} />}
                                Sil
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .admin-departments {
                    max-width: 1200px;
                }

                .page-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
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

                .error-banner {
                    background: var(--danger-50);
                    color: var(--danger-600);
                    padding: 0.75rem 1rem;
                    border-radius: 0.5rem;
                    margin-bottom: 1rem;
                }

                .departments-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
                    gap: 1rem;
                }

                .loading-state,
                .empty-state {
                    grid-column: 1 / -1;
                    padding: 3rem;
                    text-align: center;
                    color: var(--gray-500);
                }

                .spin {
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                .dept-card {
                    padding: 1.25rem;
                    position: relative;
                }

                .dept-card.inactive {
                    opacity: 0.7;
                }

                .dept-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 0.75rem;
                }

                .dept-info {
                    display: flex;
                    gap: 0.75rem;
                    align-items: center;
                }

                .dept-icon {
                    width: 44px;
                    height: 44px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
                    color: white;
                    border-radius: 0.5rem;
                }

                .dept-info h3 {
                    font-size: 1rem;
                    font-weight: 600;
                    margin: 0;
                }

                .email-alias {
                    font-size: 0.75rem;
                    color: var(--gray-500);
                }

                .dept-actions {
                    display: flex;
                    gap: 0.25rem;
                }

                .dept-actions .danger:hover {
                    color: var(--danger-600);
                    background: var(--danger-50);
                }

                .dept-description {
                    font-size: 0.8125rem;
                    color: var(--gray-600);
                    margin: 0 0 1rem 0;
                }

                .dept-stats {
                    display: flex;
                    gap: 1.5rem;
                    padding: 0.75rem 0;
                    border-top: 1px solid var(--gray-100);
                    border-bottom: 1px solid var(--gray-100);
                }

                .stat {
                    text-align: center;
                }

                .stat-value {
                    display: block;
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: var(--gray-900);
                }

                .stat-label {
                    font-size: 0.6875rem;
                    color: var(--gray-500);
                    text-transform: uppercase;
                }

                .categories-section {
                    margin-top: 0.75rem;
                }

                .categories-toggle {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    width: 100%;
                    padding: 0.5rem;
                    background: var(--gray-50);
                    border: none;
                    border-radius: 0.375rem;
                    font-size: 0.8125rem;
                    color: var(--gray-600);
                    cursor: pointer;
                }

                .categories-toggle:hover {
                    background: var(--gray-100);
                }

                .categories-list {
                    padding: 0.5rem;
                    margin-top: 0.5rem;
                    background: var(--gray-50);
                    border-radius: 0.375rem;
                }

                .no-categories {
                    font-size: 0.75rem;
                    color: var(--gray-500);
                    text-align: center;
                    padding: 0.5rem;
                    margin: 0;
                }

                .category-item {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.375rem 0.5rem;
                    font-size: 0.8125rem;
                    color: var(--gray-700);
                }

                .add-category-btn {
                    width: 100%;
                    justify-content: center;
                    margin-top: 0.5rem;
                    color: var(--primary-600);
                }

                .inactive-badge {
                    position: absolute;
                    top: 0.5rem;
                    right: 0.5rem;
                    padding: 0.125rem 0.5rem;
                    background: var(--gray-200);
                    color: var(--gray-600);
                    font-size: 0.6875rem;
                    font-weight: 500;
                    border-radius: 0.25rem;
                }

                /* Modal Styles */
                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1rem 1.25rem;
                    border-bottom: 1px solid var(--gray-200);
                }

                .modal-header h2 {
                    font-size: 1.125rem;
                    font-weight: 600;
                    margin: 0;
                }

                .modal-body {
                    padding: 1.25rem;
                }

                .modal-footer {
                    display: flex;
                    justify-content: flex-end;
                    gap: 0.5rem;
                    padding: 1rem 1.25rem;
                    border-top: 1px solid var(--gray-200);
                }

                .modal-sm {
                    max-width: 400px !important;
                }

                .form-group {
                    margin-bottom: 1rem;
                }

                .form-group label {
                    display: block;
                    font-weight: 500;
                    margin-bottom: 0.375rem;
                    color: var(--gray-700);
                    font-size: 0.875rem;
                }

                .form-group textarea {
                    resize: vertical;
                }

                .checkbox-label {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.375rem;
                    font-size: 0.875rem;
                    cursor: pointer;
                }

                .error-message {
                    background: var(--danger-50);
                    color: var(--danger-600);
                    padding: 0.75rem;
                    border-radius: 0.375rem;
                    margin-bottom: 1rem;
                    font-size: 0.875rem;
                }

                .warning-message {
                    background: var(--warning-50);
                    color: var(--warning-600);
                    padding: 0.75rem;
                    border-radius: 0.375rem;
                    margin-top: 0.75rem;
                    font-size: 0.875rem;
                }
            `}</style>
        </div>
    );
}
