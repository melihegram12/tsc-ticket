'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, BookOpen } from 'lucide-react';

interface Category {
    id: number;
    name: string;
}

export default function NewArticlePage() {
    const router = useRouter();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form state
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [isPublished, setIsPublished] = useState(false);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/kb');
            const data = await res.json();
            if (res.ok && data.categories) {
                setCategories(data.categories);
                if (data.categories.length > 0) {
                    setCategoryId(data.categories[0].id.toString());
                }
            }
        } catch (err) {
            console.error('Failed to fetch categories:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !body || !categoryId) return;

        setSaving(true);
        try {
            const res = await fetch('/api/kb', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    body,
                    categoryId: parseInt(categoryId),
                    isPublished
                }),
            });

            if (res.ok) {
                const data = await res.json();
                router.push(`/dashboard/kb/${data.id}`);
            } else {
                alert('Makale oluşturulamadı');
            }
        } catch (err) {
            console.error('Failed to create article:', err);
            alert('Bir hata oluştu');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <Loader2 className="spin" size={32} />
            </div>
        );
    }

    return (
        <div className="new-article-page">
            <div className="page-header">
                <Link href="/dashboard/kb" className="back-link">
                    <ArrowLeft size={18} />
                    Bilgi Bankası
                </Link>
                <h1>Yeni Makale</h1>
            </div>

            <div className="form-container card">
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Başlık</label>
                        <input
                            type="text"
                            className="input"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Makale başlığı..."
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Kategori</label>
                        <select
                            className="input"
                            value={categoryId}
                            onChange={(e) => setCategoryId(e.target.value)}
                            required
                        >
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>İçerik</label>
                        <textarea
                            className="input textarea"
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            placeholder="Makale içeriği..."
                            rows={15}
                            required
                        />
                        <p className="hint">HTML etiketleri kullanılabilir.</p>
                    </div>

                    <div className="form-group checkbox-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={isPublished}
                                onChange={(e) => setIsPublished(e.target.checked)}
                            />
                            <span>Yayına Al (Kullanıcılar görebilir)</span>
                        </label>
                    </div>

                    <div className="form-actions">
                        <Link href="/dashboard/kb" className="btn btn-ghost">
                            İptal
                        </Link>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? <Loader2 size={18} className="spin" /> : <Save size={18} />}
                            Kaydet
                        </button>
                    </div>
                </form>
            </div>

            <style jsx>{`
                .new-article-page {
                    max-width: 800px;
                    margin: 0 auto;
                }

                .page-header {
                    margin-bottom: 2rem;
                }

                .back-link {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: var(--gray-500);
                    text-decoration: none;
                    margin-bottom: 0.5rem;
                }

                .back-link:hover {
                    color: var(--primary-600);
                }

                .form-container {
                    padding: 2rem;
                }

                .form-group {
                    margin-bottom: 1.5rem;
                }

                .form-group label {
                    display: block;
                    font-weight: 500;
                    margin-bottom: 0.5rem;
                    color: var(--gray-700);
                }

                .textarea {
                    resize: vertical;
                    font-family: inherit;
                }

                .hint {
                    font-size: 0.75rem;
                    color: var(--gray-500);
                    margin-top: 0.25rem;
                }

                .checkbox-group {
                    margin-top: 1rem;
                }

                .checkbox-label {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    cursor: pointer;
                }

                .checkbox-label input {
                    width: 1rem;
                    height: 1rem;
                }

                .form-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 1rem;
                    margin-top: 2rem;
                    padding-top: 1.5rem;
                    border-top: 1px solid var(--gray-200);
                }

                .loading-container {
                    display: flex;
                    justify-content: center;
                    padding: 4rem;
                }

                .spin {
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
