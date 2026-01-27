'use client';

import { useEffect, useState, use } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
    ArrowLeft,
    Loader2,
    ThumbsUp,
    ThumbsDown,
    Eye,
    Calendar,
    User,
    BookOpen,
} from 'lucide-react';

interface Article {
    id: number;
    title: string;
    body: string;
    excerpt: string | null;
    viewCount: number;
    helpfulCount: number;
    notHelpfulCount: number;
    createdAt: string;
    updatedAt: string;
    category: { id: number; name: string };
    createdBy: { id: number; name: string };
    updatedBy: { id: number; name: string };
}

interface RelatedArticle {
    id: number;
    title: string;
}

export default function ArticleDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const { data: session } = useSession();
    const [article, setArticle] = useState<Article | null>(null);
    const [relatedArticles, setRelatedArticles] = useState<RelatedArticle[]>([]);
    const [loading, setLoading] = useState(true);
    const [feedbackGiven, setFeedbackGiven] = useState(false);

    useEffect(() => {
        fetchArticle();
    }, [resolvedParams.id]);

    const fetchArticle = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/kb/${resolvedParams.id}`);
            const data = await res.json();

            if (res.ok) {
                setArticle(data.article);
                setRelatedArticles(data.relatedArticles);
            }
        } catch (err) {
            console.error('Error fetching article:', err);
        } finally {
            setLoading(false);
        }
    };

    const submitFeedback = async (helpful: boolean) => {
        if (feedbackGiven) return;

        try {
            await fetch(`/api/kb/${resolvedParams.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ helpful }),
            });
            setFeedbackGiven(true);
        } catch (err) {
            console.error('Error submitting feedback:', err);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    if (loading) {
        return (
            <div className="loading-state">
                <Loader2 className="spin" size={32} />
                <p>Makale yükleniyor...</p>
            </div>
        );
    }

    if (!article) {
        return (
            <div className="error-state">
                <BookOpen size={48} />
                <p>Makale bulunamadı</p>
                <Link href="/dashboard/kb" className="btn btn-primary">
                    Bilgi Bankasına Dön
                </Link>
            </div>
        );
    }

    return (
        <div className="article-page">
            <div className="article-header">
                <Link href="/dashboard/kb" className="back-link">
                    <ArrowLeft size={18} />
                    Bilgi Bankası
                </Link>
            </div>

            <div className="article-layout">
                <article className="article-content card">
                    <header>
                        <span className="category-badge">{article.category.name}</span>
                        <h1>{article.title}</h1>
                        <div className="article-meta">
                            <span>
                                <User size={14} />
                                {article.createdBy.name}
                            </span>
                            <span>
                                <Calendar size={14} />
                                {formatDate(article.createdAt)}
                            </span>
                            <span>
                                <Eye size={14} />
                                {article.viewCount} görüntüleme
                            </span>
                        </div>
                    </header>

                    <div
                        className="article-body"
                        dangerouslySetInnerHTML={{ __html: article.body.replace(/\n/g, '<br/>') }}
                    />

                    <footer className="article-footer">
                        <div className="feedback-section">
                            <p>Bu makale yardımcı oldu mu?</p>
                            {feedbackGiven ? (
                                <div className="feedback-thanks">
                                    Geri bildiriminiz için teşekkürler!
                                </div>
                            ) : (
                                <div className="feedback-buttons">
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => submitFeedback(true)}
                                    >
                                        <ThumbsUp size={16} />
                                        Evet ({article.helpfulCount})
                                    </button>
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => submitFeedback(false)}
                                    >
                                        <ThumbsDown size={16} />
                                        Hayır ({article.notHelpfulCount})
                                    </button>
                                </div>
                            )}
                        </div>
                    </footer>
                </article>

                <aside className="article-sidebar">
                    {relatedArticles.length > 0 && (
                        <div className="related-section card">
                            <h3>İlgili Makaleler</h3>
                            <ul>
                                {relatedArticles.map(related => (
                                    <li key={related.id}>
                                        <Link href={`/dashboard/kb/${related.id}`}>
                                            {related.title}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </aside>
            </div>

            <style jsx>{`
                .article-page {
                    max-width: 1000px;
                }

                .loading-state,
                .error-state {
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

                .article-header {
                    margin-bottom: 1rem;
                }

                .back-link {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: var(--gray-600);
                    text-decoration: none;
                    font-size: 0.875rem;
                }

                .back-link:hover {
                    color: var(--primary-600);
                }

                .article-layout {
                    display: grid;
                    grid-template-columns: 1fr 260px;
                    gap: 1.5rem;
                }

                @media (max-width: 768px) {
                    .article-layout {
                        grid-template-columns: 1fr;
                    }
                }

                .article-content {
                    padding: 2rem;
                }

                .article-content header {
                    margin-bottom: 2rem;
                    padding-bottom: 1.5rem;
                    border-bottom: 1px solid var(--gray-200);
                }

                .category-badge {
                    display: inline-block;
                    padding: 0.25rem 0.75rem;
                    background: var(--primary-50);
                    color: var(--primary-700);
                    font-size: 0.75rem;
                    font-weight: 500;
                    border-radius: 0.25rem;
                    margin-bottom: 0.75rem;
                }

                .article-content h1 {
                    font-size: 1.75rem;
                    font-weight: 700;
                    margin: 0 0 1rem 0;
                    color: var(--gray-900);
                    line-height: 1.3;
                }

                .article-meta {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 1rem;
                    font-size: 0.8125rem;
                    color: var(--gray-500);
                }

                .article-meta span {
                    display: flex;
                    align-items: center;
                    gap: 0.375rem;
                }

                .article-body {
                    font-size: 0.9375rem;
                    line-height: 1.7;
                    color: var(--gray-700);
                }

                .article-footer {
                    margin-top: 2rem;
                    padding-top: 1.5rem;
                    border-top: 1px solid var(--gray-200);
                }

                .feedback-section {
                    text-align: center;
                }

                .feedback-section p {
                    font-weight: 500;
                    margin-bottom: 1rem;
                }

                .feedback-buttons {
                    display: flex;
                    justify-content: center;
                    gap: 0.75rem;
                }

                .feedback-thanks {
                    color: var(--success-600);
                    font-weight: 500;
                }

                .article-sidebar {
                    position: sticky;
                    top: calc(var(--header-height) + 1.5rem);
                    height: fit-content;
                }

                .related-section {
                    padding: 1.25rem;
                }

                .related-section h3 {
                    font-size: 0.8125rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: var(--gray-500);
                    margin: 0 0 1rem 0;
                }

                .related-section ul {
                    list-style: none;
                    margin: 0;
                    padding: 0;
                }

                .related-section li {
                    border-bottom: 1px solid var(--gray-100);
                }

                .related-section li:last-child {
                    border-bottom: none;
                }

                .related-section a {
                    display: block;
                    padding: 0.625rem 0;
                    color: var(--gray-700);
                    text-decoration: none;
                    font-size: 0.875rem;
                }

                .related-section a:hover {
                    color: var(--primary-600);
                }
            `}</style>
        </div>
    );
}
