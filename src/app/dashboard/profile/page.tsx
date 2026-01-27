'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
    User,
    Mail,
    Building2,
    Shield,
    Calendar,
    Clock,
    Save,
    Loader2,
    Key,
    Check,
} from 'lucide-react';

interface UserProfile {
    id: number;
    email: string;
    name: string;
    avatarUrl: string | null;
    locale: string;
    timezone: string;
    lastLoginAt: string | null;
    createdAt: string;
    role: { id: number; name: string };
    departments: Array<{
        department: { id: number; name: string };
        isPrimary: boolean;
    }>;
}

export default function ProfilePage() {
    const { data: session } = useSession();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const [formData, setFormData] = useState({
        name: '',
        locale: 'tr',
        timezone: 'Europe/Istanbul',
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const [showPasswordForm, setShowPasswordForm] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/profile');
            const data = await res.json();

            if (res.ok) {
                setProfile(data);
                setFormData({
                    name: data.name,
                    locale: data.locale,
                    timezone: data.timezone,
                });
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const res = await fetch('/api/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({ type: 'success', text: 'Profil güncellendi' });
                fetchProfile();
            } else {
                setMessage({ type: 'error', text: data.error });
            }
        } catch {
            setMessage({ type: 'error', text: 'Bir hata oluştu' });
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setMessage({ type: 'error', text: 'Şifreler eşleşmiyor' });
            setSaving(false);
            return;
        }

        if (passwordData.newPassword.length < 6) {
            setMessage({ type: 'error', text: 'Şifre en az 6 karakter olmalı' });
            setSaving(false);
            return;
        }

        try {
            const res = await fetch('/api/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({ type: 'success', text: 'Şifre değiştirildi' });
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                setShowPasswordForm(false);
            } else {
                setMessage({ type: 'error', text: data.error });
            }
        } catch {
            setMessage({ type: 'error', text: 'Bir hata oluştu' });
        } finally {
            setSaving(false);
        }
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <div className="loading-state">
                <Loader2 className="spin" size={32} />
                <p>Profil yükleniyor...</p>
            </div>
        );
    }

    if (!profile) return null;

    return (
        <div className="profile-page">
            <div className="page-header">
                <h1>Profilim</h1>
                <p>Hesap bilgilerinizi görüntüleyin ve düzenleyin</p>
            </div>

            {message.text && (
                <div className={`message-banner ${message.type}`}>
                    {message.text}
                </div>
            )}

            <div className="profile-layout">
                {/* Profile Card */}
                <div className="profile-card card">
                    <div className="profile-avatar">
                        <div className="avatar avatar-lg">
                            {profile.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="profile-info">
                            <h2>{profile.name}</h2>
                            <span className="role-badge">{profile.role.name}</span>
                        </div>
                    </div>

                    <div className="profile-details">
                        <div className="detail-item">
                            <Mail size={16} />
                            <span>{profile.email}</span>
                        </div>
                        {profile.departments.length > 0 && (
                            <div className="detail-item">
                                <Building2 size={16} />
                                <span>
                                    {profile.departments.map(d => d.department.name).join(', ')}
                                </span>
                            </div>
                        )}
                        <div className="detail-item">
                            <Calendar size={16} />
                            <span>Kayıt: {formatDate(profile.createdAt)}</span>
                        </div>
                        <div className="detail-item">
                            <Clock size={16} />
                            <span>Son giriş: {formatDate(profile.lastLoginAt)}</span>
                        </div>
                    </div>
                </div>

                {/* Edit Form */}
                <div className="settings-section">
                    <div className="settings-card card">
                        <h3>
                            <User size={18} />
                            Profil Bilgileri
                        </h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Ad Soyad</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Dil</label>
                                    <select
                                        className="input"
                                        value={formData.locale}
                                        onChange={e => setFormData({ ...formData, locale: e.target.value })}
                                    >
                                        <option value="tr">Türkçe</option>
                                        <option value="en">English</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Saat Dilimi</label>
                                    <select
                                        className="input"
                                        value={formData.timezone}
                                        onChange={e => setFormData({ ...formData, timezone: e.target.value })}
                                    >
                                        <option value="Europe/Istanbul">İstanbul (UTC+3)</option>
                                        <option value="Europe/London">Londra (UTC+0)</option>
                                        <option value="America/New_York">New York (UTC-5)</option>
                                    </select>
                                </div>
                            </div>

                            <button type="submit" className="btn btn-primary" disabled={saving}>
                                {saving ? <Loader2 className="spin" size={16} /> : <Save size={16} />}
                                Kaydet
                            </button>
                        </form>
                    </div>

                    <div className="settings-card card">
                        <h3>
                            <Key size={18} />
                            Şifre Değiştir
                        </h3>

                        {!showPasswordForm ? (
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => setShowPasswordForm(true)}
                            >
                                <Key size={16} />
                                Şifre Değiştir
                            </button>
                        ) : (
                            <form onSubmit={handlePasswordChange}>
                                <div className="form-group">
                                    <label>Mevcut Şifre</label>
                                    <input
                                        type="password"
                                        className="input"
                                        value={passwordData.currentPassword}
                                        onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Yeni Şifre</label>
                                    <input
                                        type="password"
                                        className="input"
                                        value={passwordData.newPassword}
                                        onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                        required
                                        minLength={6}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Yeni Şifre (Tekrar)</label>
                                    <input
                                        type="password"
                                        className="input"
                                        value={passwordData.confirmPassword}
                                        onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="button-group">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => {
                                            setShowPasswordForm(false);
                                            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                                        }}
                                    >
                                        İptal
                                    </button>
                                    <button type="submit" className="btn btn-primary" disabled={saving}>
                                        {saving ? <Loader2 className="spin" size={16} /> : <Check size={16} />}
                                        Şifreyi Değiştir
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>

            <style jsx>{`
                .profile-page {
                    max-width: 900px;
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

                .loading-state {
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

                .message-banner {
                    padding: 0.75rem 1rem;
                    border-radius: 0.5rem;
                    margin-bottom: 1rem;
                    font-size: 0.875rem;
                }

                .message-banner.success {
                    background: var(--success-50);
                    color: var(--success-600);
                }

                .message-banner.error {
                    background: var(--danger-50);
                    color: var(--danger-600);
                }

                .profile-layout {
                    display: grid;
                    grid-template-columns: 300px 1fr;
                    gap: 1.5rem;
                }

                @media (max-width: 768px) {
                    .profile-layout {
                        grid-template-columns: 1fr;
                    }
                }

                .profile-card {
                    padding: 1.5rem;
                    height: fit-content;
                }

                .profile-avatar {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    padding-bottom: 1.25rem;
                    border-bottom: 1px solid var(--gray-100);
                    margin-bottom: 1.25rem;
                }

                .avatar-lg {
                    width: 80px;
                    height: 80px;
                    font-size: 2rem;
                    margin-bottom: 0.75rem;
                }

                .profile-info h2 {
                    font-size: 1.125rem;
                    font-weight: 600;
                    margin: 0 0 0.25rem 0;
                }

                .role-badge {
                    display: inline-block;
                    padding: 0.25rem 0.75rem;
                    background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
                    color: white;
                    font-size: 0.6875rem;
                    font-weight: 500;
                    border-radius: 9999px;
                }

                .profile-details {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }

                .detail-item {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.8125rem;
                    color: var(--gray-600);
                }

                .settings-section {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .settings-card {
                    padding: 1.5rem;
                }

                .settings-card h3 {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 1rem;
                    font-weight: 600;
                    margin: 0 0 1.25rem 0;
                    color: var(--gray-800);
                }

                .form-group {
                    margin-bottom: 1rem;
                }

                .form-group label {
                    display: block;
                    font-weight: 500;
                    margin-bottom: 0.375rem;
                    font-size: 0.875rem;
                    color: var(--gray-700);
                }

                .form-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1rem;
                }

                .button-group {
                    display: flex;
                    gap: 0.5rem;
                    margin-top: 1rem;
                }
            `}</style>
        </div>
    );
}
