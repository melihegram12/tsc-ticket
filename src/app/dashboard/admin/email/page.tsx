'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Mail, Server, Key, Lock, RefreshCw, CheckCircle, AlertCircle, Building2 } from 'lucide-react';

interface EmailConfig {
    host: string;
    port: string;
    user: string;
    password: string;
    tls: boolean;
    targetDepartmentId: string;
}

interface Department {
    id: number;
    name: string;
}

export default function EmailSettingsPage() {
    const { data: session } = useSession();
    const [config, setConfig] = useState<EmailConfig>({
        host: '',
        port: '993',
        user: '',
        password: '',
        tls: true,
        targetDepartmentId: '',
    });
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [lastSync, setLastSync] = useState<string | null>(null);

    useEffect(() => {
        loadConfig();
        loadDepartments();
    }, []);

    const loadConfig = async () => {
        try {
            const res = await fetch('/api/admin/email/config');
            if (res.ok) {
                const data = await res.json();
                setConfig(data);
            }
        } catch (error) {
            console.error('Failed to load config:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadDepartments = async () => {
        try {
            const res = await fetch('/api/departments');
            if (res.ok) {
                const data = await res.json();
                setDepartments(data);
            }
        } catch (error) {
            console.error('Failed to load departments:', error);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);

        try {
            const res = await fetch('/api/admin/email/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config),
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({ type: 'success', text: 'Ayarlar kaydedildi' });
            } else {
                setMessage({ type: 'error', text: data.error || 'Kaydetme hatası' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Bağlantı hatası' });
        } finally {
            setSaving(false);
        }
    };

    const handleFetch = async () => {
        setFetching(true);
        setMessage(null);

        try {
            const res = await fetch('/api/admin/email/fetch', {
                method: 'POST',
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({ type: 'success', text: data.message });
                setLastSync(new Date().toLocaleString('tr-TR'));
            } else {
                setMessage({ type: 'error', text: data.error || 'E-posta çekme hatası' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Bağlantı hatası' });
        } finally {
            setFetching(false);
        }
    };

    if (session?.user?.role !== 'Admin') {
        return (
            <div className="access-denied">
                <AlertCircle size={48} />
                <h2>Erişim Engellendi</h2>
                <p>Bu sayfayı görüntülemek için yönetici yetkisi gereklidir.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner" />
                <p>Yükleniyor...</p>
            </div>
        );
    }

    return (
        <div className="email-settings">
            <div className="page-header">
                <div className="header-content">
                    <Mail size={28} />
                    <div>
                        <h1>E-posta Ayarları</h1>
                        <p>IMAP üzerinden gelen e-postaları otomatik ticket'a dönüştürün</p>
                    </div>
                </div>
            </div>

            {message && (
                <div className={`alert alert-${message.type}`}>
                    {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                    <span>{message.text}</span>
                </div>
            )}

            <div className="settings-grid">
                <div className="settings-card">
                    <h3><Server size={20} /> IMAP Sunucu Ayarları</h3>

                    <div className="form-group">
                        <label htmlFor="host">Sunucu Adresi</label>
                        <input
                            id="host"
                            type="text"
                            className="input"
                            placeholder="imap.gmail.com"
                            value={config.host}
                            onChange={(e) => setConfig({ ...config, host: e.target.value })}
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="port">Port</label>
                            <input
                                id="port"
                                type="number"
                                className="input"
                                placeholder="993"
                                value={config.port}
                                onChange={(e) => setConfig({ ...config, port: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={config.tls}
                                    onChange={(e) => setConfig({ ...config, tls: e.target.checked })}
                                />
                                <span>TLS/SSL Kullan</span>
                            </label>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="user"><Key size={16} /> Kullanıcı Adı / E-posta</label>
                        <input
                            id="user"
                            type="text"
                            className="input"
                            placeholder="destek@sirket.com"
                            value={config.user}
                            onChange={(e) => setConfig({ ...config, user: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password"><Lock size={16} /> Şifre / Uygulama Şifresi</label>
                        <input
                            id="password"
                            type="password"
                            className="input"
                            placeholder="••••••••"
                            value={config.password}
                            onChange={(e) => setConfig({ ...config, password: e.target.value })}
                        />
                        <small>Gmail için uygulama şifresi kullanın</small>
                    </div>
                </div>

                <div className="settings-card">
                    <h3><Building2 size={20} /> Hedef Departman</h3>

                    <div className="form-group">
                        <label htmlFor="department">E-postalar hangi departmana yönlendirilsin?</label>
                        <select
                            id="department"
                            className="input"
                            value={config.targetDepartmentId}
                            onChange={(e) => setConfig({ ...config, targetDepartmentId: e.target.value })}
                        >
                            <option value="">Departman seçin...</option>
                            {departments.map((dept) => (
                                <option key={dept.id} value={dept.id}>
                                    {dept.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {lastSync && (
                        <div className="last-sync">
                            <CheckCircle size={16} />
                            <span>Son senkronizasyon: {lastSync}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="actions">
                <button
                    className="btn btn-primary"
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
                </button>

                <button
                    className="btn btn-secondary"
                    onClick={handleFetch}
                    disabled={fetching || !config.host}
                >
                    <RefreshCw size={18} className={fetching ? 'spin' : ''} />
                    {fetching ? 'Çekiliyor...' : 'E-postaları Şimdi Çek'}
                </button>
            </div>

            <style jsx>{`
                .email-settings {
                    max-width: 900px;
                    margin: 0 auto;
                }

                .page-header {
                    margin-bottom: 2rem;
                }

                .header-content {
                    display: flex;
                    align-items: flex-start;
                    gap: 1rem;
                }

                .header-content h1 {
                    margin: 0;
                    font-size: 1.5rem;
                    color: var(--gray-900);
                }

                .header-content p {
                    margin: 0.25rem 0 0;
                    color: var(--gray-500);
                    font-size: 0.875rem;
                }

                .alert {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1rem;
                    border-radius: 0.5rem;
                    margin-bottom: 1.5rem;
                    font-size: 0.875rem;
                }

                .alert-success {
                    background: var(--success-50);
                    color: var(--success-700);
                    border: 1px solid var(--success-200);
                }

                .alert-error {
                    background: var(--danger-50);
                    color: var(--danger-700);
                    border: 1px solid var(--danger-200);
                }

                .settings-grid {
                    display: grid;
                    gap: 1.5rem;
                }

                .settings-card {
                    background: white;
                    border-radius: 0.75rem;
                    padding: 1.5rem;
                    box-shadow: var(--shadow-sm);
                    border: 1px solid var(--gray-200);
                }

                .settings-card h3 {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin: 0 0 1.5rem;
                    font-size: 1rem;
                    color: var(--gray-800);
                }

                .form-group {
                    margin-bottom: 1rem;
                }

                .form-group label {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: var(--gray-700);
                    margin-bottom: 0.5rem;
                }

                .form-group small {
                    display: block;
                    margin-top: 0.25rem;
                    font-size: 0.75rem;
                    color: var(--gray-500);
                }

                .form-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1rem;
                }

                .checkbox-label {
                    display: flex !important;
                    align-items: center;
                    gap: 0.5rem;
                    cursor: pointer;
                    padding-top: 1.5rem;
                }

                .checkbox-label input {
                    width: 18px;
                    height: 18px;
                    accent-color: var(--primary-500);
                }

                .last-sync {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.75rem;
                    background: var(--success-50);
                    color: var(--success-700);
                    border-radius: 0.5rem;
                    font-size: 0.875rem;
                    margin-top: 1rem;
                }

                .actions {
                    display: flex;
                    gap: 1rem;
                    margin-top: 1.5rem;
                }

                .btn-secondary {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .spin {
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                .access-denied {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 400px;
                    text-align: center;
                    color: var(--gray-500);
                }

                .access-denied h2 {
                    margin: 1rem 0 0.5rem;
                    color: var(--gray-700);
                }

                .loading-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 400px;
                    gap: 1rem;
                }

                .spinner {
                    width: 32px;
                    height: 32px;
                    border: 3px solid var(--gray-200);
                    border-top-color: var(--primary-500);
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }

                @media (max-width: 640px) {
                    .form-row {
                        grid-template-columns: 1fr;
                    }

                    .actions {
                        flex-direction: column;
                    }
                }
            `}</style>
        </div>
    );
}
