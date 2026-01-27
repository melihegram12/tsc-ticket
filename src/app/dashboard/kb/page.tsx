'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    Search,
    Loader2,
    BookOpen,
    FolderOpen,
    Eye,
    ChevronRight,
    Plus,
} from 'lucide-react';
import { useSession } from 'next-auth/react';

interface Category {
    id: number;
    name: string;
    description: string | null;
    _count: { articles: number };
}

interface Article {
    id: number;
    title: string;
    excerpt: string | null;
    viewCount: number;
    category: { id: number; name: string };
}

export default function KnowledgeBasePage() {
    const { data: session } = useSession();
    const [categories, setCategories] = useState<Category[]>([]);
    const [articles, setArticles] = useState<Article[]>([]);
    const [popularArticles, setPopularArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

    useEffect(() => {
        fetchKB();
    }, [search, selectedCategory]);

    const fetchKB = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (selectedCategory) params.append('categoryId', selectedCategory.toString());

            const res = await fetch(`/api/kb?${params}`);
            const data = await res.json();

            if (res.ok) {
                setCategories(data.categories);
                setArticles(data.articles);
                setPopularArticles(data.popularArticles);
            }
        } catch (err) {
            console.error('Error fetching KB:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchKB();
    };

    return (
        <div className="kb-page">
            <div className="page-header">
                <div className="header-content">
                    <BookOpen size={32} className="header-icon" />
                    <div>
                        <h1>Bilgi Bankası</h1>
                        <p>Sık sorulan sorular ve yardım makaleleri</p>
                    </div>
                </div>

                {session?.user?.role !== 'Requester' && (
                    <Link href="/dashboard/kb/new" className="btn btn-primary">
                        <Plus size={18} />
                        Yeni Makale
                    </Link>
                )}
            </div>

            {/* Search */}
            <form className="search-form" onSubmit={handleSearch}>
                <div className="search-box">
                    <Search size={20} />
                    <input
                        type="text"
                        placeholder="Makale ara..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="input"
                    />
                </div>
            </form>

            <div className="kb-layout">
                {/* Sidebar */}
                <aside className="kb-sidebar">
                    <h3>Kategoriler</h3>
                    <ul className="category-list">
                        <li>
                            <button
                                className={`category-item ${selectedCategory === null ? 'active' : ''}`}
                                onClick={() => setSelectedCategory(null)}
                            >
                                <FolderOpen size={18} />
                                Tümü
                            </button>
                        </li>
                        {categories.map(cat => (
                            <li key={cat.id}>
                                <button
                                    className={`category-item ${selectedCategory === cat.id ? 'active' : ''}`}
                                    onClick={() => setSelectedCategory(cat.id)}
                                >
                                    <FolderOpen size={18} />
                                    {cat.name}
                                    <span className="count">{cat._count.articles}</span>
                                </button>
                            </li>
                        ))}
                    </ul>

                    <h3>Popüler Makaleler</h3>
                    <ul className="popular-list">
                        {popularArticles.map(article => (
                            <li key={article.id}>
                                <Link href={`/dashboard/kb/${article.id}`} className="popular-item">
                                    {article.title}
                                    <span className="views">
                                        <Eye size={12} />
                                        {article.viewCount}
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </aside>

                {/* Main content */}
                <main className="kb-content">
                    {loading ? (
                        <div className="loading-state">
                            <Loader2 className="spin" size={32} />
                            <p>Yükleniyor...</p>
                        </div>
                    ) : articles.length === 0 ? (
                        <div className="empty-state">
                            <BookOpen size={48} />
                            <p>Makale bulunamadı</p>
                        </div>
                    ) : (
                        <div className="articles-grid">
                            {articles.map(article => (
                                <Link
                                    href={`/dashboard/kb/${article.id}`}
                                    key={article.id}
                                    className="article-card card"
                                >
                                    <h3>{article.title}</h3>
                                    {article.excerpt && (
                                        <p className="excerpt">{article.excerpt}</p>
                                    )}
                                    <div className="article-meta">
                                        <span className="category-badge">{article.category.name}</span>
                                        <span className="views">
                                            <Eye size={14} />
                                            {article.viewCount} görüntüleme
                                        </span>
                                    </div>
                                    <ChevronRight size={18} className="arrow" />
                                </Link>
                            ))}
                        </div>
                    )}
                </main>
            </div>

            <style jsx>{`
                .kb-page {
                    max-width: 1200px;
                }

                .page-header {
                    margin-bottom: 1.5rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .header-content {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .header-icon {
                    color: var(--primary-500);
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

                .search-form {
                    margin-bottom: 1.5rem;
                }

                .search-box {
                    position: relative;
                    max-width: 500px;
                }

                .search-box svg {
                    position: absolute;
                    left: 1rem;
                    top: 50%;
                    transform: translateY(-50%);
                    color: var(--gray-400);
                }

                .search-box input {
                    padding-left: 2.75rem;
                    padding-right: 1rem;
                    height: 48px;
                    font-size: 1rem;
                }

                .kb-layout {
                    display: grid;
                    grid-template-columns: 260px 1fr;
                    gap: 1.5rem;
                }

                @media (max-width: 768px) {
                    .kb-layout {
                        grid-template-columns: 1fr;
                    }
                }

                .kb-sidebar {
                    background: white;
                    border-radius: 0.75rem;
                    padding: 1.25rem;
                    border: 1px solid var(--gray-200);
                    height: fit-content;
                    position: sticky;
                    top: calc(var(--header-height) + 1.5rem);
                }

                .kb-sidebar h3 {
                    font-size: 0.6875rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: var(--gray-500);
                    margin: 0 0 0.75rem 0;
                }

                .kb-sidebar h3:not(:first-child) {
                    margin-top: 1.5rem;
                }

                .category-list,
                .popular-list {
                    list-style: none;
                    margin: 0;
                    padding: 0;
                }

                .category-item {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    width: 100%;
                    padding: 0.5rem 0.75rem;
                    border: none;
                    background: none;
                    border-radius: 0.375rem;
                    font-size: 0.875rem;
                    color: var(--gray-600);
                    cursor: pointer;
                    text-align: left;
                }

                .category-item:hover {
                    background: var(--gray-100);
                }

                .category-item.active {
                    background: var(--primary-50);
                    color: var(--primary-600);
                }

                .category-item .count {
                    margin-left: auto;
                    font-size: 0.75rem;
                    color: var(--gray-400);
                }

                .popular-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0.5rem 0;
                    font-size: 0.8125rem;
                    color: var(--gray-700);
                    text-decoration: none;
                    border-bottom: 1px solid var(--gray-100);
                }

                .popular-item:hover {
                    color: var(--primary-600);
                }

                .popular-item .views {
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                    font-size: 0.6875rem;
                    color: var(--gray-400);
                }

                .kb-content {
                    min-height: 400px;
                }

                .loading-state,
                .empty-state {
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

                .articles-grid {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }

                .article-card {
                    display: block;
                    padding: 1.25rem;
                    text-decoration: none;
                    position: relative;
                    transition: all 0.2s ease;
                }

                .article-card:hover {
                    box-shadow: var(--shadow-md);
                    transform: translateY(-2px);
                }

                .article-card h3 {
                    font-size: 1rem;
                    font-weight: 600;
                    margin: 0 0 0.5rem 0;
                    color: var(--gray-900);
                    padding-right: 2rem;
                }

                .article-card .excerpt {
                    font-size: 0.8125rem;
                    color: var(--gray-600);
                    margin: 0 0 0.75rem 0;
                    line-height: 1.5;
                }

                .article-meta {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .category-badge {
                    padding: 0.125rem 0.5rem;
                    background: var(--primary-50);
                    color: var(--primary-700);
                    font-size: 0.6875rem;
                    border-radius: 0.25rem;
                }

                .article-meta .views {
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                    font-size: 0.75rem;
                    color: var(--gray-500);
                }

                .article-card .arrow {
                    position: absolute;
                    right: 1rem;
                    top: 50%;
                    transform: translateY(-50%);
                    color: var(--gray-400);
                }

                .article-card:hover .arrow {
                    color: var(--primary-500);
                }
            `}</style>
        </div>
    );
}
