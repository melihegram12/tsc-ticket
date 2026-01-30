'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
    Loader2,
    Plus,
    Trash2,
    Edit,
    Power,
    PowerOff,
    Zap,
    ChevronDown,
    ChevronUp,
    X,
    Save,
} from 'lucide-react';

interface Condition {
    field: string;
    operator: string;
    value: string;
}

interface Action {
    type: string;
    params: Record<string, unknown>;
}

interface AutomationRule {
    id: number;
    name: string;
    description?: string;
    trigger: string;
    conditions: Condition[];
    actions: Action[];
    isActive: boolean;
    priority: number;
    createdAt: string;
    createdBy?: { id: number; name: string };
}

const TRIGGER_LABELS: Record<string, string> = {
    TICKET_CREATED: 'Ticket Oluşturulduğunda',
    TICKET_UPDATED: 'Ticket Güncellendiğinde',
    HOURLY_CHECK: 'Saatlik Kontrol',
};

const CONDITION_FIELDS = [
    { value: 'subject', label: 'Konu' },
    { value: 'priority', label: 'Öncelik' },
    { value: 'departmentId', label: 'Departman' },
    { value: 'status', label: 'Durum' },
    { value: 'requesterEmail', label: 'Talep Eden E-posta' },
];

const CONDITION_OPERATORS = [
    { value: 'contains', label: 'İçerir' },
    { value: 'equals', label: 'Eşittir' },
    { value: 'not_equals', label: 'Eşit Değil' },
    { value: 'starts_with', label: 'İle Başlar' },
    { value: 'ends_with', label: 'İle Biter' },
];

const ACTION_TYPES = [
    { value: 'assign_department', label: 'Departmana Ata' },
    { value: 'assign_user', label: 'Kullanıcıya Ata' },
    { value: 'set_priority', label: 'Öncelik Belirle' },
    { value: 'add_tag', label: 'Etiket Ekle' },
    { value: 'send_notification', label: 'Bildirim Gönder' },
];

export default function AutomationPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [rules, setRules] = useState<AutomationRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
    const [saving, setSaving] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        trigger: 'TICKET_CREATED',
        conditions: [{ field: 'subject', operator: 'contains', value: '' }] as Condition[],
        actions: [{ type: 'set_priority', params: { priority: 'HIGH' } }] as Action[],
        priority: 0,
        isActive: true,
    });

    useEffect(() => {
        if (session?.user?.role !== 'Admin') {
            router.push('/dashboard');
            return;
        }
        fetchRules();
    }, [session]);

    const fetchRules = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/automation');
            if (res.ok) {
                const data = await res.json();
                setRules(data.rules || []);
            }
        } catch (error) {
            console.error('Error fetching rules:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const url = editingRule
                ? `/api/admin/automation/${editingRule.id}`
                : '/api/admin/automation';
            const method = editingRule ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                await fetchRules();
                resetForm();
            }
        } catch (error) {
            console.error('Error saving rule:', error);
        } finally {
            setSaving(false);
        }
    };

    const toggleActive = async (rule: AutomationRule) => {
        try {
            await fetch(`/api/admin/automation/${rule.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !rule.isActive }),
            });
            await fetchRules();
        } catch (error) {
            console.error('Error toggling rule:', error);
        }
    };

    const deleteRule = async (id: number) => {
        if (!confirm('Bu kuralı silmek istediğinize emin misiniz?')) return;

        try {
            await fetch(`/api/admin/automation/${id}`, { method: 'DELETE' });
            await fetchRules();
        } catch (error) {
            console.error('Error deleting rule:', error);
        }
    };

    const editRule = (rule: AutomationRule) => {
        setFormData({
            name: rule.name,
            description: rule.description || '',
            trigger: rule.trigger,
            conditions: rule.conditions,
            actions: rule.actions,
            priority: rule.priority,
            isActive: rule.isActive,
        });
        setEditingRule(rule);
        setShowForm(true);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            trigger: 'TICKET_CREATED',
            conditions: [{ field: 'subject', operator: 'contains', value: '' }],
            actions: [{ type: 'set_priority', params: { priority: 'HIGH' } }],
            priority: 0,
            isActive: true,
        });
        setEditingRule(null);
        setShowForm(false);
    };

    const addCondition = () => {
        setFormData(prev => ({
            ...prev,
            conditions: [...prev.conditions, { field: 'subject', operator: 'contains', value: '' }],
        }));
    };

    const removeCondition = (index: number) => {
        setFormData(prev => ({
            ...prev,
            conditions: prev.conditions.filter((_, i) => i !== index),
        }));
    };

    const updateCondition = (index: number, field: keyof Condition, value: string) => {
        setFormData(prev => ({
            ...prev,
            conditions: prev.conditions.map((c, i) => (i === index ? { ...c, [field]: value } : c)),
        }));
    };

    if (session?.user?.role !== 'Admin') return null;

    return (
        <div className="automation-page">
            <div className="page-header">
                <div>
                    <h1>Otomasyon Kuralları</h1>
                    <p>Ticket işlemlerini otomatikleştirin</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                    <Plus size={18} />
                    Yeni Kural
                </button>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="modal-overlay" onClick={resetForm}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editingRule ? 'Kuralı Düzenle' : 'Yeni Kural Oluştur'}</h3>
                            <button className="close-btn" onClick={resetForm}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Kural Adı *</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={formData.name}
                                        onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                                        placeholder="Örn: VIP Müşteri Önceliği"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Açıklama</label>
                                    <textarea
                                        className="input"
                                        value={formData.description}
                                        onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                                        rows={2}
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Tetikleyici *</label>
                                        <select
                                            className="select"
                                            value={formData.trigger}
                                            onChange={e => setFormData(p => ({ ...p, trigger: e.target.value }))}
                                        >
                                            {Object.entries(TRIGGER_LABELS).map(([k, v]) => (
                                                <option key={k} value={k}>{v}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Öncelik</label>
                                        <input
                                            type="number"
                                            className="input"
                                            value={formData.priority}
                                            onChange={e => setFormData(p => ({ ...p, priority: parseInt(e.target.value) || 0 }))}
                                        />
                                    </div>
                                </div>

                                <div className="form-section">
                                    <div className="section-header">
                                        <label>Koşullar</label>
                                        <button type="button" className="btn btn-ghost btn-sm" onClick={addCondition}>
                                            <Plus size={14} /> Ekle
                                        </button>
                                    </div>
                                    {formData.conditions.map((cond, i) => (
                                        <div key={i} className="condition-row">
                                            <select
                                                className="select"
                                                value={cond.field}
                                                onChange={e => updateCondition(i, 'field', e.target.value)}
                                            >
                                                {CONDITION_FIELDS.map(f => (
                                                    <option key={f.value} value={f.value}>{f.label}</option>
                                                ))}
                                            </select>
                                            <select
                                                className="select"
                                                value={cond.operator}
                                                onChange={e => updateCondition(i, 'operator', e.target.value)}
                                            >
                                                {CONDITION_OPERATORS.map(o => (
                                                    <option key={o.value} value={o.value}>{o.label}</option>
                                                ))}
                                            </select>
                                            <input
                                                type="text"
                                                className="input"
                                                value={cond.value}
                                                onChange={e => updateCondition(i, 'value', e.target.value)}
                                                placeholder="Değer"
                                            />
                                            {formData.conditions.length > 1 && (
                                                <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeCondition(i)}>
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div className="form-section">
                                    <label>Aksiyonlar</label>
                                    <div className="action-row">
                                        <select
                                            className="select"
                                            value={formData.actions[0]?.type || ''}
                                            onChange={e => setFormData(p => ({
                                                ...p,
                                                actions: [{ type: e.target.value, params: {} }]
                                            }))}
                                        >
                                            {ACTION_TYPES.map(a => (
                                                <option key={a.value} value={a.value}>{a.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={formData.isActive}
                                            onChange={e => setFormData(p => ({ ...p, isActive: e.target.checked }))}
                                        />
                                        Kural aktif
                                    </label>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-ghost" onClick={resetForm}>İptal</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? <Loader2 size={18} className="spin" /> : <Save size={18} />}
                                    Kaydet
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Rules List */}
            <div className="card">
                {loading ? (
                    <div className="loading-state">
                        <Loader2 className="spin" size={24} />
                        <p>Yükleniyor...</p>
                    </div>
                ) : rules.length === 0 ? (
                    <div className="empty-state">
                        <Zap size={48} />
                        <h3>Henüz kural yok</h3>
                        <p>İlk otomasyon kuralınızı oluşturun</p>
                    </div>
                ) : (
                    <div className="rules-list">
                        {rules.map(rule => (
                            <div key={rule.id} className={`rule-item ${!rule.isActive ? 'inactive' : ''}`}>
                                <div className="rule-header">
                                    <div className="rule-info">
                                        <h4>{rule.name}</h4>
                                        <span className="trigger-badge">{TRIGGER_LABELS[rule.trigger]}</span>
                                    </div>
                                    <div className="rule-actions">
                                        <button
                                            className={`toggle-btn ${rule.isActive ? 'active' : ''}`}
                                            onClick={() => toggleActive(rule)}
                                            title={rule.isActive ? 'Devre dışı bırak' : 'Etkinleştir'}
                                        >
                                            {rule.isActive ? <Power size={16} /> : <PowerOff size={16} />}
                                        </button>
                                        <button className="btn btn-ghost btn-sm" onClick={() => editRule(rule)}>
                                            <Edit size={16} />
                                        </button>
                                        <button className="btn btn-ghost btn-sm danger" onClick={() => deleteRule(rule.id)}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                                {rule.description && <p className="rule-desc">{rule.description}</p>}
                                <div className="rule-details">
                                    <span><strong>Koşullar:</strong> {rule.conditions.length} adet</span>
                                    <span><strong>Aksiyonlar:</strong> {rule.actions.length} adet</span>
                                    <span><strong>Öncelik:</strong> {rule.priority}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <style jsx>{`
                .automation-page {
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
                    font-weight: 600;
                    margin: 0;
                }

                .page-header p {
                    color: var(--gray-500);
                    margin: 0.25rem 0 0 0;
                    font-size: 0.875rem;
                }

                .loading-state, .empty-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 4rem 2rem;
                    color: var(--gray-400);
                    gap: 1rem;
                }

                .empty-state h3 {
                    color: var(--gray-700);
                    margin: 0;
                }

                .empty-state p {
                    margin: 0;
                }

                .spin {
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                .rules-list {
                    display: flex;
                    flex-direction: column;
                }

                .rule-item {
                    padding: 1.25rem;
                    border-bottom: 1px solid var(--gray-100);
                }

                .rule-item:last-child {
                    border-bottom: none;
                }

                .rule-item.inactive {
                    opacity: 0.6;
                    background: var(--gray-50);
                }

                .rule-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    gap: 1rem;
                }

                .rule-info {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    flex-wrap: wrap;
                }

                .rule-info h4 {
                    margin: 0;
                    font-size: 1rem;
                    font-weight: 600;
                }

                .trigger-badge {
                    background: var(--primary-100);
                    color: var(--primary-700);
                    padding: 0.25rem 0.625rem;
                    border-radius: 9999px;
                    font-size: 0.6875rem;
                    font-weight: 500;
                }

                .rule-actions {
                    display: flex;
                    gap: 0.375rem;
                }

                .toggle-btn {
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 0.375rem;
                    border: none;
                    cursor: pointer;
                    background: var(--gray-100);
                    color: var(--gray-500);
                }

                .toggle-btn.active {
                    background: var(--success-100);
                    color: var(--success-600);
                }

                .rule-desc {
                    margin: 0.5rem 0;
                    font-size: 0.875rem;
                    color: var(--gray-600);
                }

                .rule-details {
                    display: flex;
                    gap: 1.5rem;
                    font-size: 0.75rem;
                    color: var(--gray-500);
                    margin-top: 0.5rem;
                }

                .btn.danger:hover {
                    color: var(--danger-600);
                    background: var(--danger-50);
                }

                /* Modal */
                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }

                .modal {
                    background: white;
                    border-radius: 0.75rem;
                    width: 100%;
                    max-width: 600px;
                    max-height: 90vh;
                    overflow-y: auto;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
                }

                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1rem 1.5rem;
                    border-bottom: 1px solid var(--gray-100);
                }

                .modal-header h3 {
                    margin: 0;
                    font-size: 1.125rem;
                    font-weight: 600;
                }

                .close-btn {
                    background: none;
                    border: none;
                    color: var(--gray-400);
                    cursor: pointer;
                }

                .modal-body {
                    padding: 1.5rem;
                }

                .modal-footer {
                    display: flex;
                    justify-content: flex-end;
                    gap: 0.75rem;
                    padding: 1rem 1.5rem;
                    background: var(--gray-50);
                    border-top: 1px solid var(--gray-100);
                }

                .form-group {
                    margin-bottom: 1rem;
                }

                .form-group label {
                    display: block;
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: var(--gray-700);
                    margin-bottom: 0.375rem;
                }

                .form-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1rem;
                }

                .form-section {
                    margin-bottom: 1rem;
                    padding: 1rem;
                    background: var(--gray-50);
                    border-radius: 0.5rem;
                }

                .section-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 0.75rem;
                }

                .section-header label {
                    font-weight: 600;
                    margin: 0;
                }

                .condition-row, .action-row {
                    display: flex;
                    gap: 0.5rem;
                    margin-bottom: 0.5rem;
                }

                .condition-row .select,
                .condition-row .input {
                    flex: 1;
                }

                .checkbox-label {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    cursor: pointer;
                }

                textarea.input {
                    resize: vertical;
                }
            `}</style>
        </div>
    );
}
