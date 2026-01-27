'use client';

import { useEffect, useState } from 'react';
import {
    Save,
    Loader2,
    Settings,
    Clock,
    Mail,
    AlertCircle,
} from 'lucide-react';

interface Setting {
    key: string;
    value: string;
    type: string;
    description: string | null;
}

interface SLAPolicy {
    id: number;
    name: string;
    priority: string;
    firstResponseMinutes: number;
    resolutionMinutes: number;
    isActive: boolean;
    department: { id: number; name: string };
}

interface Department {
    id: number;
    name: string;
}

type TabType = 'general' | 'sla' | 'email';

export default function AdminSettingsPage() {
    const [settings, setSettings] = useState<Setting[]>([]);
    const [slaPolicies, setSlaPolicies] = useState<SLAPolicy[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [activeTab, setActiveTab] = useState<TabType>('general');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/admin/settings');
            const data = await res.json();
            if (res.ok) {
                setSettings(data.settings);
                setSlaPolicies(data.slaPolicies);
                setDepartments(data.departments);
            }
        } catch (err) {
            console.error('Error fetching settings:', err);
        } finally {
            setLoading(false);
        }
    };

    const getSetting = (key: string): string => {
        const setting = settings.find(s => s.key === key);
        return setting?.value || '';
    };

    const updateSetting = (key: string, value: string) => {
        setSettings(prev => {
            const existing = prev.find(s => s.key === key);
            if (existing) {
                return prev.map(s => s.key === key ? { ...s, value } : s);
            }
            return [...prev, { key, value, type: 'string', description: null }];
        });
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage('');

        try {
            const res = await fetch('/api/admin/settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ settings }),
            });

            if (res.ok) {
                setMessage('Ayarlar başarıyla kaydedildi');
                setTimeout(() => setMessage(''), 3000);
            } else {
                setMessage('Kaydetme başarısız');
            }
        } catch {
            setMessage('Bir hata oluştu');
        } finally {
            setSaving(false);
        }
    };

    const formatMinutes = (mins: number): string => {
        if (mins < 60) return `${mins} dakika`;
        const hours = Math.floor(mins / 60);
        const remainingMins = mins % 60;
        if (remainingMins === 0) return `${hours} saat`;
        return `${hours} saat ${remainingMins} dakika`;
    };

    const getPriorityLabel = (priority: string): string => {
        const labels: Record<string, string> = {
            URGENT: 'Acil',
            HIGH: 'Yüksek',
            NORMAL: 'Normal',
            LOW: 'Düşük',
        };
        return labels[priority] || priority;
    };

    const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
        { id: 'general', label: 'Genel Ayarlar', icon: <Settings size={18} /> },
        { id: 'sla', label: 'SLA Politikaları', icon: <Clock size={18} /> },
        { id: 'email', label: 'E-posta Ayarları', icon: <Mail size={18} /> },
    ];

    if (loading) {
        return (
            <div className="loading-state">
                <Loader2 className="spin" size={32} />
                <p>Yükleniyor...</p>
            </div>
        );
    }

    return (
        <div className="admin-settings">
            <div className="page-header">
                <div>
                    <h1>Sistem Ayarları</h1>
                    <p>Uygulama ve sistem ayarlarını yönetin</p>
                </div>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="spin" size={18} /> : <Save size={18} />}
                    Kaydet
                </button>
            </div>

            {message && (
                <div className={`message-banner ${message.includes('başarıyla') ? 'success' : 'error'}`}>
                    {message}
                </div>
            )}

            <div className="tabs-container">
                <div className="tabs">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="tab-content">
                    {activeTab === 'general' && (
                        <div className="settings-section">
                            <div className="settings-group card">
                                <h3>Uygulama Ayarları</h3>

                                <div className="form-group">
                                    <label>Uygulama Adı</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={getSetting('app.name')}
                                        onChange={e => updateSetting('app.name', e.target.value)}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Ticket Numara Öneki</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={getSetting('ticket.prefix')}
                                        onChange={e => updateSetting('ticket.prefix', e.target.value)}
                                        placeholder="TCK"
                                    />
                                    <span className="form-hint">Örnek: TCK-2026-000001</span>
                                </div>

                                <div className="form-group">
                                    <label>Otomatik Kapanma Süresi (gün)</label>
                                    <input
                                        type="number"
                                        className="input"
                                        value={getSetting('ticket.autoclose.days')}
                                        onChange={e => updateSetting('ticket.autoclose.days', e.target.value)}
                                        min="1"
                                    />
                                    <span className="form-hint">Çözülen ticketlar bu süre sonunda otomatik kapanır</span>
                                </div>

                                <div className="form-group">
                                    <label>SLA Uyarı Eşiği (%)</label>
                                    <input
                                        type="number"
                                        className="input"
                                        value={getSetting('sla.warning.percent')}
                                        onChange={e => updateSetting('sla.warning.percent', e.target.value)}
                                        min="50"
                                        max="99"
                                    />
                                    <span className="form-hint">Bu yüzdeye ulaşıldığında uyarı gösterilir</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'sla' && (
                        <div className="settings-section">
                            <div className="info-box">
                                <AlertCircle size={18} />
                                <p>SLA politikaları departman bazında tanımlanır. Departman yönetiminden değiştirilebilir.</p>
                            </div>

                            {departments.map(dept => {
                                const deptPolicies = slaPolicies.filter(p => p.department.id === dept.id);
                                if (deptPolicies.length === 0) return null;

                                return (
                                    <div key={dept.id} className="sla-department card">
                                        <h3>{dept.name}</h3>
                                        <table className="table">
                                            <thead>
                                                <tr>
                                                    <th>Öncelik</th>
                                                    <th>İlk Yanıt</th>
                                                    <th>Çözüm</th>
                                                    <th>Durum</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {deptPolicies.map(policy => (
                                                    <tr key={policy.id}>
                                                        <td>
                                                            <span className={`badge priority-${policy.priority.toLowerCase()}`}>
                                                                {getPriorityLabel(policy.priority)}
                                                            </span>
                                                        </td>
                                                        <td>{formatMinutes(policy.firstResponseMinutes)}</td>
                                                        <td>{formatMinutes(policy.resolutionMinutes)}</td>
                                                        <td>
                                                            {policy.isActive ? (
                                                                <span className="status-badge active">Aktif</span>
                                                            ) : (
                                                                <span className="status-badge inactive">Pasif</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {activeTab === 'email' && (
                        <div className="settings-section">
                            <div className="settings-group card">
                                <h3>E-posta Bildirimleri</h3>

                                <div className="form-group">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={getSetting('notification.email.enabled') === 'true'}
                                            onChange={e => updateSetting('notification.email.enabled', e.target.checked ? 'true' : 'false')}
                                        />
                                        E-posta bildirimlerini aktifleştir
                                    </label>
                                </div>
                            </div>

                            <div className="settings-group card">
                                <h3>SMTP Ayarları</h3>
                                <p className="section-description">
                                    E-posta göndermek için SMTP sunucu bilgilerini girin. Bu ayarlar .env dosyasından yönetilir.
                                </p>

                                <div className="env-info">
                                    <code>SMTP_HOST</code>
                                    <code>SMTP_PORT</code>
                                    <code>SMTP_USER</code>
                                    <code>SMTP_PASSWORD</code>
                                    <code>SMTP_FROM</code>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .admin-settings {
                    max-width: 900px;
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

                .loading-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 3rem;
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

                .tabs-container {
                    background: white;
                    border-radius: 0.75rem;
                    border: 1px solid var(--gray-200);
                    overflow: hidden;
                }

                .tabs {
                    display: flex;
                    border-bottom: 1px solid var(--gray-200);
                    background: var(--gray-50);
                }

                .tab {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.875rem 1.25rem;
                    background: none;
                    border: none;
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: var(--gray-600);
                    cursor: pointer;
                    border-bottom: 2px solid transparent;
                    margin-bottom: -1px;
                }

                .tab:hover {
                    color: var(--gray-900);
                }

                .tab.active {
                    background: white;
                    color: var(--primary-600);
                    border-bottom-color: var(--primary-600);
                }

                .tab-content {
                    padding: 1.5rem;
                }

                .settings-section {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .settings-group {
                    padding: 1.25rem;
                }

                .settings-group h3 {
                    font-size: 1rem;
                    font-weight: 600;
                    margin: 0 0 1rem 0;
                    color: var(--gray-900);
                }

                .section-description {
                    font-size: 0.8125rem;
                    color: var(--gray-500);
                    margin: -0.5rem 0 1rem 0;
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

                .form-hint {
                    display: block;
                    font-size: 0.75rem;
                    color: var(--gray-500);
                    margin-top: 0.25rem;
                }

                .checkbox-label {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.875rem;
                    cursor: pointer;
                }

                .info-box {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.875rem 1rem;
                    background: var(--primary-50);
                    color: var(--primary-700);
                    border-radius: 0.5rem;
                    font-size: 0.8125rem;
                }

                .info-box p {
                    margin: 0;
                }

                .sla-department {
                    padding: 1rem;
                }

                .sla-department h3 {
                    font-size: 0.875rem;
                    font-weight: 600;
                    margin: 0 0 0.75rem 0;
                }

                .status-badge {
                    display: inline-block;
                    padding: 0.125rem 0.5rem;
                    font-size: 0.6875rem;
                    font-weight: 500;
                    border-radius: 0.25rem;
                }

                .status-badge.active {
                    background: var(--success-50);
                    color: var(--success-600);
                }

                .status-badge.inactive {
                    background: var(--gray-100);
                    color: var(--gray-500);
                }

                .env-info {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.5rem;
                }

                .env-info code {
                    padding: 0.375rem 0.625rem;
                    background: var(--gray-100);
                    color: var(--gray-700);
                    border-radius: 0.25rem;
                    font-size: 0.75rem;
                    font-family: monospace;
                }
            `}</style>
        </div>
    );
}
