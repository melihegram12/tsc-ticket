'use client';

import { useEffect, useState } from 'react';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    Loader2,
    UserCheck,
    UserX,
    X,
    Check,
} from 'lucide-react';

interface Role {
    id: number;
    name: string;
}

interface Department {
    id: number;
    name: string;
}

interface UserDepartment {
    department: Department;
    isPrimary: boolean;
}

interface User {
    id: number;
    email: string;
    name: string;
    isActive: boolean;
    role: Role;
    departments: UserDepartment[];
    lastLoginAt: string | null;
    createdAt: string;
}

interface FormData {
    email: string;
    name: string;
    password: string;
    roleId: number;
    departmentIds: number[];
    isActive: boolean;
}

const initialFormData: FormData = {
    email: '',
    name: '',
    password: '',
    roleId: 0,
    departmentIds: [],
    isActive: true,
};

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [filterActive, setFilterActive] = useState('');

    const [modalOpen, setModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState<FormData>(initialFormData);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const [deleteConfirm, setDeleteConfirm] = useState<User | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, [search, filterRole, filterActive]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (filterRole) params.append('roleId', filterRole);
            if (filterActive) params.append('isActive', filterActive);

            const res = await fetch(`/api/admin/users?${params}`);
            const data = await res.json();

            if (res.ok) {
                setUsers(data.users);
                setRoles(data.roles);
                setDepartments(data.departments);
            }
        } catch (err) {
            console.error('Error fetching users:', err);
        } finally {
            setLoading(false);
        }
    };

    const openCreateModal = () => {
        setEditingUser(null);
        setFormData(initialFormData);
        setError('');
        setModalOpen(true);
    };

    const openEditModal = (user: User) => {
        setEditingUser(user);
        setFormData({
            email: user.email,
            name: user.name,
            password: '',
            roleId: user.role.id,
            departmentIds: user.departments.map(d => d.department.id),
            isActive: user.isActive,
        });
        setError('');
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditingUser(null);
        setFormData(initialFormData);
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            const url = editingUser
                ? `/api/admin/users/${editingUser.id}`
                : '/api/admin/users';
            const method = editingUser ? 'PATCH' : 'POST';

            const payload = { ...formData };
            if (editingUser && !payload.password) {
                delete (payload as any).password;
            }

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Bir hata oluştu');
                return;
            }

            closeModal();
            fetchUsers();
        } catch (err) {
            setError('Bir hata oluştu');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirm) return;
        setDeleting(true);

        try {
            const res = await fetch(`/api/admin/users/${deleteConfirm.id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                setDeleteConfirm(null);
                fetchUsers();
            }
        } catch (err) {
            console.error('Error deleting user:', err);
        } finally {
            setDeleting(false);
        }
    };

    const toggleDepartment = (deptId: number) => {
        setFormData(prev => ({
            ...prev,
            departmentIds: prev.departmentIds.includes(deptId)
                ? prev.departmentIds.filter(id => id !== deptId)
                : [...prev.departmentIds, deptId],
        }));
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="admin-users">
            <div className="page-header">
                <div>
                    <h1>Kullanıcı Yönetimi</h1>
                    <p>Sistem kullanıcılarını yönetin</p>
                </div>
                <button className="btn btn-primary" onClick={openCreateModal}>
                    <Plus size={18} />
                    Yeni Kullanıcı
                </button>
            </div>

            {/* Filters */}
            <div className="filters card">
                <div className="filter-group">
                    <div className="search-box">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Ad veya e-posta ara..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="input"
                        />
                    </div>
                    <select
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value)}
                        className="input"
                        style={{ width: '160px' }}
                    >
                        <option value="">Tüm Roller</option>
                        {roles.map(role => (
                            <option key={role.id} value={role.id}>{role.name}</option>
                        ))}
                    </select>
                    <select
                        value={filterActive}
                        onChange={(e) => setFilterActive(e.target.value)}
                        className="input"
                        style={{ width: '140px' }}
                    >
                        <option value="">Tüm Durumlar</option>
                        <option value="true">Aktif</option>
                        <option value="false">Pasif</option>
                    </select>
                </div>
            </div>

            {/* Users Table */}
            <div className="card">
                {loading ? (
                    <div className="loading-state">
                        <Loader2 className="spin" size={32} />
                        <p>Yükleniyor...</p>
                    </div>
                ) : users.length === 0 ? (
                    <div className="empty-state">
                        <p>Kullanıcı bulunamadı</p>
                    </div>
                ) : (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Kullanıcı</th>
                                <th>Rol</th>
                                <th>Departmanlar</th>
                                <th>Durum</th>
                                <th>Son Giriş</th>
                                <th style={{ width: '100px' }}>İşlemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id}>
                                    <td>
                                        <div className="user-cell">
                                            <div className="avatar avatar-md">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <strong>{user.name}</strong>
                                                <span className="email">{user.email}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge badge-${user.role.name.toLowerCase()}`}>
                                            {user.role.name}
                                        </span>
                                    </td>
                                    <td>
                                        {user.departments.length > 0 ? (
                                            <div className="dept-list">
                                                {user.departments.map(d => (
                                                    <span key={d.department.id} className="dept-badge">
                                                        {d.department.name}
                                                        {d.isPrimary && <span className="primary-badge">●</span>}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-muted">-</span>
                                        )}
                                    </td>
                                    <td>
                                        {user.isActive ? (
                                            <span className="status-badge active">
                                                <UserCheck size={14} />
                                                Aktif
                                            </span>
                                        ) : (
                                            <span className="status-badge inactive">
                                                <UserX size={14} />
                                                Pasif
                                            </span>
                                        )}
                                    </td>
                                    <td className="text-muted">
                                        {formatDate(user.lastLoginAt)}
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            <button
                                                className="btn btn-ghost btn-sm"
                                                onClick={() => openEditModal(user)}
                                                title="Düzenle"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                className="btn btn-ghost btn-sm danger"
                                                onClick={() => setDeleteConfirm(user)}
                                                title="Sil"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Create/Edit Modal */}
            {modalOpen && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingUser ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı'}</h2>
                            <button className="btn btn-ghost" onClick={closeModal}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                {error && <div className="error-message">{error}</div>}

                                <div className="form-group">
                                    <label>Ad Soyad *</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>E-posta *</label>
                                    <input
                                        type="email"
                                        className="input"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>{editingUser ? 'Yeni Şifre (opsiyonel)' : 'Şifre'}</label>
                                    <input
                                        type="password"
                                        className="input"
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        required={!editingUser}
                                        placeholder={editingUser ? 'Değiştirmek için doldurun' : ''}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Rol *</label>
                                    <select
                                        className="input"
                                        value={formData.roleId}
                                        onChange={e => setFormData({ ...formData, roleId: parseInt(e.target.value) })}
                                        required
                                    >
                                        <option value="">Rol Seçin</option>
                                        {roles.map(role => (
                                            <option key={role.id} value={role.id}>{role.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Departmanlar</label>
                                    <div className="checkbox-group">
                                        {departments.map(dept => (
                                            <label key={dept.id} className="checkbox-label">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.departmentIds.includes(dept.id)}
                                                    onChange={() => toggleDepartment(dept.id)}
                                                />
                                                {dept.name}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={formData.isActive}
                                            onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                        />
                                        Aktif Kullanıcı
                                    </label>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                                    İptal
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    {submitting ? (
                                        <>
                                            <Loader2 className="spin" size={16} />
                                            Kaydediliyor...
                                        </>
                                    ) : (
                                        <>
                                            <Check size={16} />
                                            Kaydet
                                        </>
                                    )}
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
                            <h2>Kullanıcıyı Sil</h2>
                        </div>
                        <div className="modal-body">
                            <p>
                                <strong>{deleteConfirm.name}</strong> kullanıcısını silmek istediğinize emin misiniz?
                                Bu işlem geri alınamaz.
                            </p>
                        </div>
                        <div className="modal-footer">
                            <button
                                className="btn btn-secondary"
                                onClick={() => setDeleteConfirm(null)}
                            >
                                İptal
                            </button>
                            <button
                                className="btn btn-danger"
                                onClick={handleDelete}
                                disabled={deleting}
                            >
                                {deleting ? (
                                    <>
                                        <Loader2 className="spin" size={16} />
                                        Siliniyor...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 size={16} />
                                        Sil
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .admin-users {
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
                    color: var(--gray-900);
                }

                .page-header p {
                    font-size: 0.875rem;
                    color: var(--gray-500);
                    margin: 0.25rem 0 0 0;
                }

                .filters {
                    padding: 1rem;
                    margin-bottom: 1rem;
                }

                .filter-group {
                    display: flex;
                    gap: 0.75rem;
                    flex-wrap: wrap;
                }

                .search-box {
                    position: relative;
                    flex: 1;
                    min-width: 200px;
                }

                .search-box svg {
                    position: absolute;
                    left: 0.75rem;
                    top: 50%;
                    transform: translateY(-50%);
                    color: var(--gray-400);
                }

                .search-box input {
                    padding-left: 2.5rem;
                }

                .loading-state,
                .empty-state {
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

                .user-cell {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }

                .user-cell strong {
                    display: block;
                    font-weight: 500;
                    color: var(--gray-900);
                }

                .user-cell .email {
                    display: block;
                    font-size: 0.75rem;
                    color: var(--gray-500);
                }

                .badge-admin {
                    background: linear-gradient(135deg, #8b5cf6, #7c3aed);
                    color: white;
                }

                .badge-supervisor {
                    background: linear-gradient(135deg, #0ea5e9, #0284c7);
                    color: white;
                }

                .badge-agent {
                    background: linear-gradient(135deg, #22c55e, #16a34a);
                    color: white;
                }

                .badge-requester {
                    background: var(--gray-100);
                    color: var(--gray-600);
                }

                .dept-list {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.25rem;
                }

                .dept-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.25rem;
                    padding: 0.125rem 0.5rem;
                    background: var(--primary-50);
                    color: var(--primary-700);
                    border-radius: 0.25rem;
                    font-size: 0.75rem;
                }

                .primary-badge {
                    color: var(--primary-500);
                    font-size: 0.5rem;
                }

                .status-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.375rem;
                    padding: 0.25rem 0.5rem;
                    border-radius: 0.25rem;
                    font-size: 0.75rem;
                    font-weight: 500;
                }

                .status-badge.active {
                    background: var(--success-50);
                    color: var(--success-600);
                }

                .status-badge.inactive {
                    background: var(--gray-100);
                    color: var(--gray-500);
                }

                .text-muted {
                    color: var(--gray-500);
                    font-size: 0.8125rem;
                }

                .action-buttons {
                    display: flex;
                    gap: 0.25rem;
                }

                .action-buttons .danger:hover {
                    color: var(--danger-600);
                    background: var(--danger-50);
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
                    max-height: 60vh;
                    overflow-y: auto;
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

                .checkbox-group {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.5rem 1rem;
                    padding: 0.5rem;
                    background: var(--gray-50);
                    border-radius: 0.375rem;
                }

                .checkbox-label {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.375rem;
                    font-size: 0.875rem;
                    cursor: pointer;
                }

                .checkbox-label input {
                    width: 16px;
                    height: 16px;
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
            `}</style>
        </div>
    );
}
