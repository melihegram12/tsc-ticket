'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft,
    Send,
    Loader2,
    AlertCircle,
    User,
} from 'lucide-react';
import FileUpload from '@/components/file-upload';

interface Department {
    id: number;
    name: string;
    categories: { id: number; name: string }[];
}

export default function NewTicketPage() {
    const router = useRouter();
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        requesterName: '',
        subject: '',
        description: '',
        department: '',
        priority: 'NORMAL',
    });
    const [attachments, setAttachments] = useState<any[]>([]);

    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const response = await fetch('/api/departments');
                const data = await response.json();
                setDepartments(data);
            } catch (error) {
                console.error('Failed to fetch departments:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDepartments();
    }, []);

    // const selectedDepartment = departments.find(d => d.id === parseInt(formData.departmentId));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        try {
            const response = await fetch('/api/tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    requesterName: formData.requesterName,
                    subject: formData.subject,
                    description: formData.description,
                    department: formData.department,
                    priority: formData.priority,
                    attachments: attachments,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Ticket oluşturulamadı');
            }

            const ticket = await response.json();
            router.push(`/dashboard/tickets/${ticket.id}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Bir hata oluştu');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <Loader2 className="spinner" size={32} />
                <style jsx>{`
          .loading-container {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 400px;
          }
          .loading-container :global(.spinner) {
            color: var(--primary-500);
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
        <div className="new-ticket-page">
            <div className="page-header">
                <Link href="/dashboard/tickets" className="back-link">
                    <ArrowLeft size={20} />
                    Talepler
                </Link>
                <h1>Yeni Talep Oluştur</h1>
                <p>Destek talebi açmak için aşağıdaki formu doldurun</p>
            </div>

            <div className="card form-card">
                {error && (
                    <div className="error-alert">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group requester-field">
                        <label htmlFor="requesterName">
                            <User size={16} />
                            Ad Soyad *
                        </label>
                        <input
                            id="requesterName"
                            type="text"
                            className="input"
                            placeholder="Adınız ve soyadınızı girin"
                            value={formData.requesterName}
                            onChange={(e) => setFormData({ ...formData, requesterName: e.target.value })}
                            required
                            maxLength={100}
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="department">Departman *</label>
                            <input
                                id="department"
                                type="text"
                                className="input"
                                placeholder="Departman adını girin (örn: Bilgi İşlem)"
                                value={formData.department}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    department: e.target.value
                                })}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="priority">Öncelik</label>
                            <select
                                id="priority"
                                className="input"
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                            >
                                <option value="LOW">Düşük</option>
                                <option value="NORMAL">Normal</option>
                                <option value="HIGH">Yüksek</option>
                                <option value="URGENT">Acil</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="subject">Konu *</label>
                        <input
                            id="subject"
                            type="text"
                            className="input"
                            placeholder="Talebinizi özetleyen kısa bir başlık"
                            value={formData.subject}
                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                            required
                            maxLength={200}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">Açıklama *</label>
                        <textarea
                            id="description"
                            className="input textarea"
                            placeholder="Sorununuzu veya talebinizi detaylı olarak açıklayın..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            required
                            rows={8}
                        />
                    </div>

                    <div className="form-group">
                        <label>Dosyalar (Opstsiyonel)</label>
                        <FileUpload onUploadComplete={setAttachments} />
                    </div>

                    <div className="form-actions">
                        <Link href="/dashboard/tickets" className="btn btn-secondary">
                            İptal
                        </Link>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={submitting}
                        >
                            {submitting ? (
                                <>
                                    <Loader2 size={18} className="spinner" />
                                    Gönderiliyor...
                                </>
                            ) : (
                                <>
                                    <Send size={18} />
                                    Talebi Gönder
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            <style jsx>{`
        .new-ticket-page {
          max-width: 800px;
        }

        .page-header {
          margin-bottom: 1.5rem;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: var(--gray-500);
          text-decoration: none;
          margin-bottom: 0.5rem;
        }

        .back-link:hover {
          color: var(--primary-600);
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

        .form-card {
          padding: 1.5rem;
        }

        .error-alert {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: var(--danger-50);
          color: var(--danger-600);
          border-radius: 0.5rem;
          margin-bottom: 1.5rem;
          font-size: 0.875rem;
        }

        .form-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .form-group label {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--gray-700);
        }

        .textarea {
          resize: vertical;
          min-height: 160px;
        }

        .requester-field {
          margin-bottom: 1.5rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid var(--gray-200);
        }

        .requester-field label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .requester-field .input {
          font-size: 1rem;
          padding: 0.875rem 1rem;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid var(--gray-200);
        }

        .form-actions :global(.spinner) {
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .form-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
        </div>
    );
}
